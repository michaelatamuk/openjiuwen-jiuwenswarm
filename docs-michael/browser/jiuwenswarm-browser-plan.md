# JiuwenSwarm Browser Extension — Development Plan

**Project name:** `jiuwenswarm-browser`
**Package name (Chrome Web Store):** JiuwenSwarm for Browser
**Manifest version:** 3 (required for Chrome Web Store since 2023)
**Primary target:** Chrome 114+ (Side Panel API); Firefox compatibility in v2

---

## Why This Extension Exists

The IDE plugin and JupyterLab extension both assume the user is working inside a structured tool
(a code editor or a notebook). The browser is different: the user is _consuming_ — reading a SEC
filing, browsing a competitor's pricing page, reading a PubMed abstract, watching a documentation
page while debugging. The agent adds value by seeing exactly what the user sees and operating in
that context, without the user switching windows or copy-pasting content.

The browser extension is also the only surface that works for non-technical users without any
install (Chrome Web Store install = two clicks, no terminal).

**Audiences served that no other surface reaches:**
- Financial analysts reading SEC filings, earnings transcripts, Bloomberg articles
- Journalists processing documents, tracking sources across tabs
- Product managers doing competitive research across multiple sites
- Academic researchers doing literature review on PubMed, arXiv, Google Scholar
- Developers reading docs while coding (complement to IDE plugin)
- Business professionals doing market research

---

## 1. High-Level Architecture

### 1.1 Extension Anatomy (Manifest V3)

```
Chrome Extension (jiuwenswarm-browser)
│
├── Service Worker (background.ts)
│     Persistent connection manager. Owns the WebSocket to the JiuwenSwarm
│     server. Routes messages between all other extension contexts. Manages
│     sessions. Survives tab navigation.
│
├── Content Script (content.ts)
│     Injected into every web page (all_urls, on demand). Extracts page
│     context (text, selection, URL, DOM structure). Responds to extraction
│     requests from the service worker. Can highlight/annotate the page.
│
├── Side Panel (sidepanel.html + sidepanel.ts)
│     The main interaction surface. A persistent panel docked to the right
│     of the browser window (Chrome Side Panel API). Hosts chat.html in an
│     iframe. Connected to background via chrome.runtime messaging.
│
├── Popup (popup.html + popup.ts)
│     Quick-access panel (toolbar icon click). Used when side panel is not
│     open. Simpler UI — just the chat input and last few messages.
│
├── Options Page (options.html + options.ts)
│     Full settings page: server host/port, default mode, context behavior,
│     keyboard shortcuts, research session settings.
│
└── Shared webview (chat.html)
      Same file used by IDE plugins and JupyterLab. Extended with a
      __chrome_send bridge function. No modifications to core HTML —
      bridge is injected by the side panel script.
```

### 1.2 Connection to JiuwenSwarm Server

Identical transport as the IDE plugins:

```
Chrome Extension (service worker)
        │
        │  WebSocket ws://127.0.0.1:19000/ws
        │  channel_id: "browser"
        │  session_id: "browser_<uuid>"
        ▼
JiuwenSwarm local server
        │
        │  E2A streaming envelope
        ▼
Agent runtime (openjiuwen.core)
```

The extension does NOT call any external API. All intelligence is routed through
the local JiuwenSwarm server the user is already running. This means:
- No API keys in the extension
- No data leaves the browser without going through the local server first
- Works with any model/provider the user has configured server-side
- Same security posture as the IDE plugin

### 1.3 Key Design Decisions

**Side Panel over Popup**
Chrome 114 introduced the Side Panel API — a persistent panel that stays open across
navigation and does not close when you click elsewhere. This is the correct surface for
an ambient assistant. The popup exists as a fallback for older Chrome and Firefox.

**Service Worker owns the WebSocket**
Content scripts and side panels are destroyed and recreated on navigation. The service
worker persists. All WebSocket communication is centralized there; other contexts message
it via `chrome.runtime.sendMessage` / `chrome.runtime.connect`.

**Shared chat.html**
The same `chat.html` from `packages/shared-webview/` used by IDE plugins is reused here.
A `__chrome_send` bridge function is injected by the side panel host. This means the chat
UI gets all future improvements automatically.

**Research Session as first-class concept**
Unlike IDE/Jupyter sessions which are 1:1 with a project or kernel, browser sessions
are often multi-page research tasks. A "research session" aggregates context from multiple
tabs the user has visited or pinned. This is the differentiating feature over just opening
the JiuwenSwarm web app in a tab.

**No filesystem or shell access**
The browser sandbox prevents it. Browser-specific tools replace IDE tools:
`read_page`, `get_selection`, `open_url`, `search_tabs`, `save_snippet`.

---

## 2. Medium-Level Design

### 2.1 Background Service Worker (`background.ts`)

The single long-lived process. Responsible for:

**WebSocket management**
- Connect to `ws://127.0.0.1:19000/ws` on extension startup
- Exponential backoff reconnect: 1s → 2s → 4s → 8s → 30s (cap)
- Heartbeat ping every 30s
- Broadcast connection status to all connected extension contexts
- Queue outgoing messages while disconnected, flush on reconnect

**Session registry**
- Map of `session_id → SessionState`
- Each session: `{ id, name, mode, messages[], created_at, page_contexts[] }`
- Persist to `chrome.storage.local` (survives service worker restarts)
- Session ID format: `browser_<nanoid(8)>`
- Max sessions: 50 (oldest pruned)

**Message routing**
- Receive from side panel / popup via `chrome.runtime.connect` (long-lived port)
- Receive from content scripts via `chrome.runtime.sendMessage`
- Route server events to the correct connected panel port
- Multiplex multiple panels to the single WebSocket connection

**Context aggregation**
- Request page context from content script in active tab
- Cache last-known context per tab (`Map<tabId, PageContext>`)
- Invalidate cache on navigation (`chrome.tabs.onUpdated`)

**Research session management**
- Track which tabs are "pinned" to the current research session
- Maintain aggregated context blob from all pinned pages
- Expose `research.add_page`, `research.remove_page`, `research.get_context` commands

### 2.2 Content Script (`content.ts`)

Injected into every page on demand (not `run_at: document_start` — avoid slowdowns).

**Page context extraction**
```typescript
interface PageContext {
  url: string
  title: string
  domain: string
  page_type: "pdf" | "github" | "arxiv" | "sec_filing" | "generic" | "docs" | "news"
  full_text: string        // Readability.js extracted article text (≤8000 chars)
  selection: string        // Currently selected text
  active_element: {        // Input/textarea the user is focused on (for form assist)
    tag: string
    placeholder: string
    label: string
    value: string
  } | null
  links: string[]          // First 20 hrefs on the page
  meta: {                  // <meta> tags: description, keywords, og:*
    description: string
    author: string
    published_date: string
  }
  word_count: number
  extracted_at: number     // timestamp
}
```

**Page type detection**
- GitHub: `window.location.hostname === "github.com"` → extract repo, file, PR details
- arXiv: hostname match → extract paper title, abstract, authors, date
- SEC EDGAR: hostname match → extract filing type, company, period
- PubMed: hostname match → extract PMID, abstract, MeSH terms
- PDF viewer: `document.contentType === "application/pdf"` → use PDF.js text layer
- News: Open Graph `og:type === "article"` → extract article body
- Generic: `Readability.js` fallback

**Selection monitoring**
- `document.addEventListener("selectionchange")` → debounce 200ms → notify background
- Enables "instant context" — selection automatically flows to the panel

**Page annotation**
- On request from background: highlight specific text spans (for agent citing)
- CSS class `jiuwenswarm-highlight` with a branded color overlay
- Remove all highlights on session clear

**Right-click context menu integration**
- Background registers `chrome.contextMenus.create` entries
- Content script receives `chrome.runtime.onMessage` to get selected text

### 2.3 Side Panel (`sidepanel.html`, `sidepanel.ts`)

The primary interaction surface.

**Structure**
```html
sidepanel.html
├── <div id="header">
│     Session picker dropdown | Research mode toggle | Settings button
├── <div id="context-bar">
│     Shows: current page domain | word count | "Add to research" button
├── <iframe id="chat-frame" src="chat.html">
│     The shared chat UI. Bridge injected by sidepanel.ts.
└── <div id="research-panel"> (collapsible)
      List of pinned pages in current research session.
      Each: favicon, title, domain, remove button.
```

**Bridge injection**
```typescript
// sidepanel.ts injects into chat.html iframe context:
chatFrame.contentWindow.__chrome_send = (msg: string) => {
  chrome.runtime.sendMessage({ type: "from_panel", payload: JSON.parse(msg) })
}

// Forward server events into chat.html:
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "server_event") {
    chatFrame.contentWindow.postMessage(msg.payload, "*")
  }
})
```

**Context bar behavior**
- Updates on every tab navigation (background notifies panel)
- "Add to research" pins the current page to the research session context
- Shows a ✓ when page is already pinned
- Shows page word count and extraction status (loading / ready / failed)

**Session picker**
- Dropdown listing all saved sessions with names + timestamps
- "New session" creates a fresh one
- Sessions are named after first user message (auto-named, truncated to 40 chars)
- Research sessions shown with 📚 icon, regular sessions with 💬

**Mode selector**
- `Agent` (default): reasoning + tools
- `Code`: code generation focused
- `Team`: multi-agent swarm
- `Research`: research session mode (activates page pinning and aggregated context)

### 2.4 Context Collection System

Context is assembled by the background service worker from multiple sources before each message:

```typescript
interface AgentContext {
  // Current page
  current_page: PageContext

  // Research session (if active)
  research_pages: Array<{
    url: string
    title: string
    text_summary: string    // Truncated to 1000 chars per page
  }>

  // Browser state
  open_tabs: Array<{        // Titles and URLs of all open tabs (optional, user opt-in)
    title: string
    url: string
    active: boolean
  }>

  // System
  timestamp: string
  timezone: string
}
```

Context is prepended to the user message as a structured block (same pattern as IDE/Jupyter):

```
[Browser Context]
Current page: "Nvidia Q3 2024 Earnings Transcript" (nvidia.com)
URL: https://investor.nvidia.com/...
Page type: investor_relations
Word count: 12,400
Selected text: "Data center revenue grew 279% year-over-year..."

[Research Session: "Q3 AI chip earnings comparison"]
Pinned pages (3):
  1. "AMD Q3 2024 Earnings Transcript" (amd.com) — 9,200 words
  2. "Intel Q3 2024 Earnings Transcript" (intel.com) — 8,100 words
  3. [current page]
---
```

**Context size management**
- Per-page text truncated to 8,000 chars
- Research session pages: 1,000 chars summary each (agent summarizes on add)
- Total context budget: 32,000 chars
- Warning shown in context bar if budget exceeded

### 2.5 Browser-Specific Agent Tools

The server will offer a set of browser-specific tools when `channel_id === "browser"`.
These are not registered for IDE or Jupyter sessions.

| Tool | What it does | Implementation |
|---|---|---|
| `read_page(url?)` | Return full text of current page (or a URL) | Content script extraction |
| `get_selection()` | Return currently selected text | Content script |
| `open_tab(url)` | Open URL in a new tab | `chrome.tabs.create` |
| `search_tabs(query)` | Find open tabs matching a query | `chrome.tabs.query` |
| `save_snippet(text, note)` | Save highlighted text + note to research session | `chrome.storage.local` |
| `pin_page(url?)` | Add current (or given) URL to research session | Background session manager |
| `highlight_text(text)` | Highlight a text span on the current page | Content script annotation |
| `take_screenshot()` | Capture current tab as PNG (send to agent) | `chrome.tabs.captureVisibleTab` |
| `get_page_links()` | Return all links on current page | Content script |
| `fill_form(field, value)` | Fill a form field by label/placeholder | Content script DOM manipulation |

Tools that require filesystem or shell (`read_file`, `write_file`, `run_bash`) are
not available and return a clear error if invoked: "This tool is not available in
the browser extension. Use the IDE plugin for file operations."

### 2.6 Research Session Feature

This is the primary differentiating feature over just opening the JiuwenSwarm web app.

**Concept**
A research session is a named session where the agent has access to content from
multiple pages the user has visited, not just the current one. The user "pins" pages
to the session as they browse.

**Workflow**
```
User starts a research task:
  %jiuwen_suggest → "Compare Q3 earnings for major AI chip makers"

User opens nvidia.com earnings page → clicks "📌 Add to research"
User opens amd.com earnings page → clicks "📌 Add to research"
User opens intel.com earnings page → clicks "📌 Add to research"

Side panel shows:
  Research session: "Q3 AI chip earnings"
  Pinned pages: NVDA ✓ | AMD ✓ | INTC ✓

User types:
  "Compare revenue growth, gross margin, and data center guidance for all three"

Agent receives context for all 3 pages → produces comparison table
```

**Research export**
- `Export session` button in the research panel
- Generates a markdown document: query history + all pinned page summaries + final output
- Same mechanism as `%jiuwen_story` — agent narrates the research as a document
- Saved to `~/Downloads/jiuwenswarm-research-<date>.md`

### 2.7 Settings / Options Page

Accessible via the toolbar icon right-click → "Options" or from the side panel gear icon.

```
Connection
  Server host:      [localhost        ]
  Server port:      [19000            ]
  [Test connection]  ● Connected

Defaults
  Default mode:     [Agent ▼         ]
  Auto-inject context: [✓ Current page ] [✓ Selected text]
  Include open tabs:   [ ] (opt-in)

Research Sessions
  Auto-name sessions:  [✓]
  Max pinned pages:    [10]
  Page summary length: [1000 chars ▼]

Keyboard Shortcuts
  Open/close panel:    Ctrl+Shift+J
  Add page to research: Ctrl+Shift+P
  Ask about selection:  Ctrl+Shift+A
  (These mirror the IDE plugin shortcuts)

Privacy
  Store session history: [✓] (local only)
  Clear all sessions:    [Clear]
  Export all sessions:   [Export JSON]

Theme
  [System ▼] / Light / Dark
```

### 2.8 Right-Click Context Menu

```
On text selection:
  ├── Ask JiuwenSwarm about this
  ├── Add to research session
  └── Explain this text

On any element:
  └── Ask JiuwenSwarm about this page

On link:
  └── Summarize this page (without opening)
```

"Ask about this" pre-fills the chat input with the selection and opens the side panel.
"Summarize without opening" calls `read_page(url)` tool.

---

## 3. Low-Level Specification

### 3.1 Full Directory Structure

```
jiuwenswarm-browser/
│
├── manifest.json                    # Extension manifest (MV3)
│
├── src/
│   ├── background/
│   │   ├── index.ts                 # Service worker entry point
│   │   ├── WsClient.ts              # WebSocket + reconnect + heartbeat
│   │   ├── SessionManager.ts        # Session CRUD, chrome.storage persistence
│   │   ├── ContextCache.ts          # Per-tab PageContext cache
│   │   ├── ResearchSession.ts       # Multi-page research session logic
│   │   ├── ContextMenu.ts           # chrome.contextMenus registration
│   │   └── TabWatcher.ts            # chrome.tabs.onUpdated listener
│   │
│   ├── content/
│   │   ├── index.ts                 # Content script entry (injected on demand)
│   │   ├── Extractor.ts             # Page content extraction (Readability.js)
│   │   ├── PageTypeDetector.ts      # Detect github / arxiv / sec / pdf / etc.
│   │   ├── SelectionMonitor.ts      # selectionchange listener + debounce
│   │   ├── Annotator.ts             # Highlight spans on page
│   │   ├── FormAssist.ts            # Fill form fields on agent request
│   │   └── adapters/
│   │       ├── github.ts            # GitHub-specific extraction
│   │       ├── arxiv.ts             # arXiv-specific extraction
│   │       ├── sec.ts               # SEC EDGAR extraction
│   │       ├── pubmed.ts            # PubMed extraction
│   │       └── pdf.ts               # PDF viewer text extraction
│   │
│   ├── sidepanel/
│   │   ├── index.ts                 # Side panel entry
│   │   ├── sidepanel.html           # Side panel shell (iframe host)
│   │   ├── SessionPicker.ts         # Session dropdown component
│   │   ├── ContextBar.ts            # Page context indicator strip
│   │   ├── ResearchPanel.ts         # Pinned pages list
│   │   ├── ModeSelector.ts          # Agent/Code/Team/Research buttons
│   │   └── ChatBridge.ts            # Inject __chrome_send into chat.html iframe
│   │
│   ├── popup/
│   │   ├── index.ts                 # Popup entry (toolbar icon click)
│   │   ├── popup.html               # Minimal popup: input + last message
│   │   └── ConnectionStatus.ts      # Show connected/disconnected badge
│   │
│   ├── options/
│   │   ├── index.ts                 # Options page entry
│   │   ├── options.html             # Full settings page
│   │   └── SettingsForm.ts          # Form binding + chrome.storage.sync
│   │
│   ├── shared/
│   │   ├── protocol.ts              # Message type definitions (shared with server)
│   │   ├── constants.ts             # DEFAULT_HOST, DEFAULT_PORT, CHANNEL_ID
│   │   ├── storage.ts               # chrome.storage typed wrappers
│   │   ├── logger.ts                # Structured console logging
│   │   └── types.ts                 # PageContext, ResearchSession, etc.
│   │
│   └── webview/
│       └── chat.html                # Copied from packages/shared-webview/chat.html
│
├── icons/
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
│
├── package.json
├── tsconfig.json
├── vite.config.ts                   # Multi-entry Vite build
└── README.md
```

### 3.2 Manifest V3 (`manifest.json`)

```json
{
  "manifest_version": 3,
  "name": "JiuwenSwarm",
  "version": "0.1.0",
  "description": "AI agent assistant for your browser — research, analysis, and synthesis",
  "icons": {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },

  "background": {
    "service_worker": "dist/background/index.js",
    "type": "module"
  },

  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["dist/content/index.js"],
      "run_at": "document_idle",
      "all_frames": false
    }
  ],

  "side_panel": {
    "default_path": "dist/sidepanel/sidepanel.html"
  },

  "action": {
    "default_popup": "dist/popup/popup.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png"
    },
    "default_title": "JiuwenSwarm"
  },

  "options_ui": {
    "page": "dist/options/options.html",
    "open_in_tab": true
  },

  "permissions": [
    "sidePanel",
    "storage",
    "contextMenus",
    "activeTab",
    "tabs",
    "scripting"
  ],

  "host_permissions": [
    "ws://127.0.0.1:19000/*",
    "ws://localhost:19000/*"
  ],

  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'none';"
  },

  "web_accessible_resources": [
    {
      "resources": ["webview/chat.html", "icons/*"],
      "matches": ["<all_urls>"]
    }
  ],

  "commands": {
    "toggle-panel": {
      "suggested_key": { "default": "Ctrl+Shift+J", "mac": "MacCtrl+Shift+J" },
      "description": "Open or close the JiuwenSwarm side panel"
    },
    "pin-page": {
      "suggested_key": { "default": "Ctrl+Shift+P", "mac": "MacCtrl+Shift+P" },
      "description": "Pin current page to research session"
    },
    "ask-selection": {
      "suggested_key": { "default": "Ctrl+Shift+A", "mac": "MacCtrl+Shift+A" },
      "description": "Ask about selected text"
    }
  }
}
```

### 3.3 Message Protocol (`src/shared/protocol.ts`)

All messages between extension contexts use typed envelopes.

```typescript
// From panel / popup → background service worker
type ToBackground =
  | { type: "chat.send"; sessionId: string; content: string; mode: Mode; requestId: string }
  | { type: "session.create"; name?: string }
  | { type: "session.delete"; sessionId: string }
  | { type: "session.list" }
  | { type: "research.pin_page"; tabId?: number }
  | { type: "research.unpin_page"; url: string }
  | { type: "research.get_context"; sessionId: string }
  | { type: "context.get_current" }
  | { type: "connection.status" }

// From background → panel / popup (events)
type FromBackground =
  | { type: "server.event"; payload: ServerEvent }
  | { type: "connection.changed"; status: "connected" | "disconnected" | "reconnecting" }
  | { type: "context.updated"; context: PageContext }
  | { type: "session.updated"; session: SessionState }
  | { type: "research.page_added"; url: string; title: string }

// From background → content script
type ToContent =
  | { type: "extract.page" }
  | { type: "extract.selection" }
  | { type: "annotate.highlight"; spans: string[] }
  | { type: "annotate.clear" }
  | { type: "form.fill"; field: string; value: string }

// From content script → background
type FromContent =
  | { type: "page.context"; context: PageContext }
  | { type: "selection.changed"; text: string }

// Server events (identical to IDE protocol, E2A envelope unwrapped)
type ServerEvent =
  | { event_type: "chat.delta"; delta: string; request_id: string }
  | { event_type: "chat.reasoning"; delta: string; request_id: string }
  | { event_type: "tool.call"; name: string; args: Record<string, unknown>; tool_id: string }
  | { event_type: "tool.result"; result: unknown; tool_id: string }
  | { event_type: "team.agent_started"; agent_id: string; role: string }
  | { event_type: "team.agent_message"; agent_id: string; delta: string }
  | { event_type: "chat.final"; content: string; request_id: string }
  | { event_type: "chat.error"; message: string; request_id: string }

type Mode = "agent" | "code" | "team" | "research"
```

### 3.4 WebSocket Client (`src/background/WsClient.ts`)

```typescript
class WsClient {
  private ws: WebSocket | null = null
  private backoffMs = 1000
  private readonly MAX_BACKOFF = 30_000
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private queue: string[] = []  // Messages queued while disconnected

  connect(host: string, port: number): void
    // ws://host:port/ws
    // On open: flush queue, start heartbeat, broadcast connected
    // On message: parse E2A envelope, extract event, broadcast to ports
    // On close/error: backoff reconnect, broadcast disconnected

  send(request: ServerRequest): void
    // If connected: ws.send(JSON.stringify(request))
    // If not: queue.push(...)

  private heartbeat(): void
    // Send {"type": "ping"} every 30s
    // If no pong in 10s: close + reconnect
}

interface ServerRequest {
  id: string                         // nanoid
  type: "req"
  channel_id: "browser"
  session_id: string
  method: "chat.send"
  params: {
    content: string                  // context block + user message
    mode: string
  }
}
```

### 3.5 Session Manager (`src/background/SessionManager.ts`)

```typescript
interface SessionState {
  id: string                          // "browser_<nanoid>"
  name: string                        // Auto-named from first message
  mode: Mode
  created_at: number
  updated_at: number
  message_count: number
  is_research: boolean
  pinned_pages: PinnedPage[]          // Only for research sessions
}

interface PinnedPage {
  url: string
  title: string
  domain: string
  pinned_at: number
  text_summary: string               // 1000 char summary (agent-generated)
}

class SessionManager {
  private sessions: Map<string, SessionState>

  async create(name?: string, mode?: Mode): Promise<SessionState>
  async get(id: string): Promise<SessionState | null>
  async list(): Promise<SessionState[]>
  async delete(id: string): Promise<void>
  async updateName(id: string, name: string): Promise<void>
  async pinPage(sessionId: string, page: PinnedPage): Promise<void>
  async unpinPage(sessionId: string, url: string): Promise<void>

  // Persistence: chrome.storage.local key "jiuwenswarm_sessions"
  private async persist(): Promise<void>
  private async restore(): Promise<void>
}
```

### 3.6 Page Extractor (`src/content/Extractor.ts`)

```typescript
import { Readability } from "@mozilla/readability"

class Extractor {
  extract(): PageContext {
    const url = window.location.href
    const pageType = PageTypeDetector.detect(url, document)

    // Use page-type-specific adapter if available
    const adapter = AdapterRegistry.get(pageType)
    if (adapter) return adapter.extract(document)

    // Generic: Readability.js
    const clone = document.cloneNode(true) as Document
    const reader = new Readability(clone)
    const article = reader.parse()

    return {
      url,
      title: document.title,
      domain: window.location.hostname,
      page_type: pageType,
      full_text: article?.textContent?.slice(0, 8000) ?? "",
      selection: window.getSelection()?.toString() ?? "",
      active_element: this.getActiveElement(),
      links: Array.from(document.links).slice(0, 20).map(a => a.href),
      meta: this.extractMeta(),
      word_count: article?.textContent?.split(/\s+/).length ?? 0,
      extracted_at: Date.now(),
    }
  }

  private getActiveElement(): PageContext["active_element"] {
    const el = document.activeElement
    if (!el || (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA")) return null
    return {
      tag: el.tagName.toLowerCase(),
      placeholder: el.getAttribute("placeholder") ?? "",
      label: this.findLabel(el),
      value: (el as HTMLInputElement).value.slice(0, 500),
    }
  }
}
```

### 3.7 Build System (`vite.config.ts`)

```typescript
import { defineConfig } from "vite"

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        background: "src/background/index.ts",
        content:    "src/content/index.ts",
        sidepanel:  "src/sidepanel/index.ts",
        popup:      "src/popup/index.ts",
        options:    "src/options/index.ts",
      },
      output: {
        entryFileNames: "[name]/index.js",
        chunkFileNames: "shared/[name].js",
        assetFileNames: "[name].[ext]",
        format: "es",
      },
    },
    outDir: "dist",
    emptyOutDir: true,
    target: "chrome114",
    sourcemap: false,  // Disable in production build for CWS submission
  },
})
```

**`package.json` dependencies:**
```json
{
  "name": "jiuwenswarm-browser",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev":   "vite build --watch",
    "build": "vite build",
    "pack":  "node scripts/pack.js"
  },
  "dependencies": {
    "@mozilla/readability": "^0.5.0",
    "nanoid": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.0.0",
    "vite-plugin-copy": "^0.1.6",
    "@types/chrome": "^0.0.268"
  }
}
```

### 3.8 Page-Type Adapters (examples)

**GitHub adapter (`src/content/adapters/github.ts`):**
```typescript
// Detects: github.com/owner/repo/blob/...
// Extracts: repo name, file path, file language, selected code, PR description, issue body
// Augments PageContext with github-specific metadata
```

**arXiv adapter (`src/content/adapters/arxiv.ts`):**
```typescript
// Detects: arxiv.org/abs/XXXX.XXXXX or arxiv.org/pdf/...
// Extracts: paper ID, title, authors, abstract, submission date, categories
// For PDF: uses PDF.js text layer if available, else meta only
```

**SEC EDGAR adapter (`src/content/adapters/sec.ts`):**
```typescript
// Detects: sec.gov/Archives/... or sec.gov/cgi-bin/browse-edgar
// Extracts: CIK, company name, form type, period of report, filing date
// For 10-K/10-Q: extracts financial statement tables as structured text
```

---

## 4. Server-Side Changes Required

The JiuwenSwarm server needs small additions to support the browser channel:

### 4.1 Channel Registration

```python
# In the server's channel registry:
CHANNEL_ID = "browser"

# Browser-specific tool set (subset + browser additions):
BROWSER_TOOLS = {
    # Available (from core):
    "web_search",
    "summarize_text",
    # Browser-specific (new, lightweight):
    "read_page",          # Returns page content from agent context
    "get_selection",      # Returns selection from agent context
    "save_snippet",       # Saves to research session via tool result
    # Disabled (no filesystem):
    # "read_file", "write_file", "run_bash", "run_python"
}
```

### 4.2 Context Injection

The browser client prepends a structured context block to every message.
The server's context parser needs to recognize the `[Browser Context]` header
and parse it into structured fields (same as it handles `[IDE Context]` and
`[Notebook Context]` for the other channels).

### 4.3 Browser-Specific System Prompt Segment

The server should inject an additional system prompt segment for browser sessions:

```
You are operating inside a browser extension. You can see the current web page
the user is reading. You do NOT have access to the user's filesystem or shell.
When the user asks you to "read the page", the full page text is in the context
provided. When you cite specific text from the page, use the highlight_text tool
to mark it on the page. Keep responses concise — the user is reading this in a
sidebar while looking at a web page.
```

---

## 5. Research Session — Detailed Flow

```
User opens side panel (Ctrl+Shift+J)
  ▼
Panel shows: "No active research session"
  ▼
User clicks [+ New Research Session]
  → SessionManager.create({ is_research: true })
  → Panel enters research mode

User navigates to nvidia.com earnings transcript
  ▼
ContextBar shows: "NVDA Q3 Earnings | 12,400 words | [📌 Pin]"
User clicks [📌 Pin]
  ▼
Background: ExtractPage(activeTab) → PageContext
Background: [optional] SendToAgent("summarize this page in 3 sentences") → summary
Background: ResearchSession.pinPage({ url, title, text_summary: summary })
  ▼
Research panel shows:
  [nvidia.com] Nvidia Q3 2024 Earnings Transcript ✓

User navigates to amd.com, pins.
User navigates to intel.com, pins.

Research panel:
  [nvidia.com] Nvidia Q3 2024 Earnings Transcript ✓
  [amd.com]   AMD Q3 2024 Earnings Transcript ✓
  [intel.com] Intel Q3 2024 Earnings Transcript ✓

User types: "Compare gross margins across all three"
  ▼
Background assembles context:
  [Browser Context]
  ...current page: intel.com...
  [Research Session: "Q3 AI chip earnings"]
  Page 1: nvidia.com — "Nvidia reported gross margin of 74.6%..."
  Page 2: amd.com — "AMD reported gross margin of 50.4%..."
  Page 3: intel.com (current) — full text up to 8000 chars
  ▼
WsClient.send(chat.send, content=contextBlock + userMessage)
  ▼
Agent receives all three pages → produces comparison table
  ▼
Chat panel renders streaming response

User clicks [Export Research]
  ▼
Background calls agent: "Write a research summary of our session..."
  ▼
Agent generates markdown document using all session context
  ▼
chrome.downloads.download({ url: blobUrl, filename: "jiuwenswarm-research-2024-12-01.md" })
```

---

## 6. MVP vs. Future Versions

### MVP (v0.1) — Ship this first

- [ ] Background service worker with WebSocket connection + reconnect
- [ ] Content script with generic page extraction (Readability.js)
- [ ] Side panel with chat.html bridge (basic chat, current page context)
- [ ] Session persistence (chrome.storage.local)
- [ ] Options page: host, port, connection test
- [ ] Right-click "Ask about this" context menu
- [ ] Keyboard shortcut to open/close panel
- [ ] Connection status badge on toolbar icon
- [ ] Popup (fallback for sidebar-unavailable contexts)

**What MVP does NOT include:**
Research sessions, page annotation, page-type adapters, form assist, screenshot,
research export, open tab context.

**Why ship MVP first:**
Validates the core loop (open panel → ask → see answer about current page) before
investing in differentiating features. Also needed to pass Chrome Web Store review,
which requires a working submission.

### v0.2 — Research Sessions

- [ ] Research session creation and management
- [ ] Pin page button in context bar
- [ ] Research panel in side panel
- [ ] Multi-page context aggregation
- [ ] Page summarization on pin (calls agent)
- [ ] Research session export (markdown)
- [ ] Session naming (auto-named from first message)

### v0.3 — Page-Type Adapters

- [ ] GitHub adapter (repo, file, PR, issue)
- [ ] arXiv adapter (paper metadata + abstract)
- [ ] SEC EDGAR adapter (filing metadata + financial tables)
- [ ] PubMed adapter (PMID, abstract, MeSH)
- [ ] PDF viewer extraction (PDF.js text layer)
- [ ] News article extraction (improved Open Graph parsing)

### v0.4 — Advanced Features

- [ ] Page annotation / text highlight (agent can mark citations on the page)
- [ ] Form assist (agent can fill fields on request)
- [ ] Screenshot tool (capture visible tab → send as image to agent)
- [ ] Open tab context (user opt-in: include all open tab titles)
- [ ] Swarm map panel (visualize multi-agent team in research mode)
- [ ] Firefox compatibility (Manifest V3 polyfill, sidebar API fallback)

### v0.5 — Enterprise / Power Features

- [ ] Custom server URL (not just localhost) — for teams sharing a remote server
- [ ] Session sharing (export/import session JSON)
- [ ] Pinned context that persists across sessions (like `%jiuwen_memory`)
- [ ] Webhook mode: agent posts results to Slack/Notion automatically
- [ ] PDF upload (drag PDF onto panel → extract and add to session)

---

## 7. Security and Privacy

### What Data Leaves the Browser

- User messages + page context → **local JiuwenSwarm server only** (never a remote server by default)
- The server then decides which LLM API to call (user's own configured API keys)
- No telemetry, no analytics, no external requests from the extension itself

### Chrome Web Store Permissions Justification

The following justifications need to be submitted with the CWS listing:

| Permission | Justification |
|---|---|
| `sidePanel` | Required for the persistent side panel (primary UI) |
| `storage` | Store sessions, settings locally — never synced to external server |
| `contextMenus` | "Ask about this" right-click menu entry |
| `activeTab` | Read current tab URL and title for context |
| `tabs` | Enumerate open tabs for research mode (user opt-in only) |
| `scripting` | Inject content script into pages for text extraction |
| `ws://127.0.0.1:*` | Connect to local JiuwenSwarm server — no external connection |

**Sensitive permissions warning:** `tabs` and `scripting` are flagged by CWS review.
The submission must clearly explain both are used only for local context extraction,
not for tracking or cross-site data collection.

### Content Security Policy

```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'none';"
}
```

chat.html uses no inline scripts — all JS is external files from `web_accessible_resources`.

---

## 8. Naming and Branding

**Repository:** `jiuwenswarm-browser`
**Chrome Web Store name:** JiuwenSwarm
**Extension ID:** Assigned by Google on first submission
**Tagline:** "AI research assistant — works on any page you're reading"
**Category:** Productivity / AI Tools

**Icon design brief:**
Same JiuwenSwarm visual identity as the IDE plugin and JupyterLab extension.
Need 16×16, 32×32, 48×48, 128×128 PNG variants from the existing SVG.
The 16×16 must be legible at small size (status bar context) — use a simplified mark, not text.

---

## 9. Relation to Other Channels

```
jiuwenswarm-ide          → Developer working in an editor, reading/writing code
jiuwenswarm-jupyterlab   → Data scientist working in a notebook, analyzing data
jiuwenswarm-browser      → Analyst / researcher reading the web, synthesizing information
```

All three share:
- The same `chat.html` webview
- The same WebSocket message protocol (E2A envelope)
- The same JiuwenSwarm local server
- The same session ID namespace (different prefix)
- The same swarm map visualization

The browser extension is intentionally **read-oriented**: it helps users consume and
synthesize information they are already reading. It does not write code, edit files,
or run commands — those belong to the IDE. It does not manipulate data in DataFrames —
that belongs to JupyterLab.

---

## 10. Development Setup

```bash
# Clone and install
git clone https://github.com/jiuwenswarm/jiuwenswarm-browser
cd jiuwenswarm-browser
npm install

# Development build (watch mode)
npm run dev
# → dist/ is updated on every file change

# Load unpacked extension in Chrome:
# chrome://extensions/ → Developer mode → Load unpacked → select dist/

# Production build
npm run build

# Package for Chrome Web Store submission
npm run pack
# → jiuwenswarm-browser-0.1.0.zip
```

**Development workflow:**
1. Start local JiuwenSwarm server (`jiuwenswarm serve` or equivalent)
2. `npm run dev` in this repo
3. Load `dist/` as unpacked extension
4. Open any web page, click toolbar icon or Ctrl+Shift+J
5. Changes to `src/` rebuild automatically; reload extension to pick up background changes

**Shared webview sync:**
The `src/webview/chat.html` is a copy of `packages/shared-webview/chat.html` from
`jiuwenswarm-ide`. A `prebuild` npm script (`scripts/sync-webview.js`) copies it
automatically before each build. Do not edit `src/webview/chat.html` directly —
edit the source in `jiuwenswarm-ide` and sync.
