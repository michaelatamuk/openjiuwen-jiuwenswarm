# JiuwenSwarm IDE Plugin Plan
## opencode-equivalent for JetBrains & VS Code

---

## 1. What We're Building

An embedded AI coding assistant plugin — in the spirit of opencode / Claude Code — that runs inside PyCharm, IntelliJ IDEA, WebStorm (and all JetBrains IDEs) and VS Code, backed by a locally running jiuwenswarm instance.

The user gets a persistent chat panel inside their IDE, with full awareness of the open project: open files, current selection, cursor position, git status, diagnostics. The agent can read files, propose diffs, apply edits, run terminal commands — all shown inline with native IDE UI.

---

## 2. Architecture Overview

```
┌─────────────────────────────────┐     WebSocket      ┌─────────────────────────────────┐
│       IDE Plugin                │ ◄─────────────────► │    jiuwenswarm Gateway          │
│  (JetBrains / VS Code)          │   ws://localhost:   │    ws://localhost:19000/ws       │
│                                 │   19000/ws          │                                 │
│  ┌───────────────────────────┐  │                     │  ┌───────────────────────────┐  │
│  │  Chat Panel (UI)          │  │                     │  │  Web Channel Handler      │  │
│  │  - Streaming markdown     │  │                     │  │  (reused as-is)           │  │
│  │  - Tool call cards        │  │                     │  └───────────┬───────────────┘  │
│  │  - Diff viewer            │  │                     │             │                   │
│  └───────────────────────────┘  │                     │  ┌──────────▼───────────────┐  │
│  ┌───────────────────────────┐  │                     │  │  AgentServer             │  │
│  │  Context Collector        │  │                     │  │  (unchanged)             │  │
│  │  - Open files             │  │                     │  └──────────────────────────┘  │
│  │  - Selection / cursor     │  │                     └─────────────────────────────────┘
│  │  - Git status             │  │
│  │  - Diagnostics/errors     │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │  Edit Applier             │  │
│  │  - Parse tool_call events │  │
│  │  - Show diff in IDE       │  │
│  │  - Apply/reject hunks     │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │  WS Client + Session Mgr  │  │
│  │  - Reconnect logic        │  │
│  │  - Session CRUD           │  │
│  │  - Message queue          │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

**No new backend code required for the initial version.** The IDE plugin connects as just another WebSocket client to the existing `ws://localhost:19000/ws` endpoint, using the same protocol the web frontend uses. The `channel_id` field is set to `"ide"` so it's identifiable in logs and TraceHound.

---

## 3. Protocol Reuse

The plugin uses the exact same message protocol as the web frontend:

### Sending a message
```json
{
  "id": "<uuid>",
  "type": "req",
  "channel_id": "ide",
  "session_id": "<session-id>",
  "req_method": "chat.send",
  "params": {
    "content": "Refactor this function to use async/await",
    "mode": "code.normal",
    "context": {
      "open_file": "/path/to/file.py",
      "selection": "def foo():\n    return sync_call()",
      "cursor_line": 42,
      "language": "python",
      "diagnostics": ["E501: line too long at line 42"],
      "git_branch": "feature/refactor",
      "git_diff_summary": "+3/-1 in foo.py"
    }
  },
  "timestamp": 1720000000.0
}
```

The `context` dict goes into `params` — the agent sees it as additional system context. No schema changes needed; the agent reads it from `params`.

### Receiving streaming response
Plugin listens for event frames:
- `chat.delta` → append to chat panel (streaming text)
- `chat.reasoning` → show in collapsible "Thinking..." block
- `chat.tool_call` → show tool card (file_edit, bash, read_file, etc.)
- `chat.tool_result` → update tool card with result
- `chat.final` → mark turn complete
- `chat.usage_metadata` → update token counter in status bar

### Session management
```
req: session.list    → list sessions (show in sidebar dropdown)
req: session.create  → start new chat session
req: session.switch  → switch active session
req: session.delete  → delete session
```

---

## 4. Context Injection Strategy

When the user sends a message, the plugin automatically prepends structured context to the message. The agent sees this as part of the user message and uses it to understand the current state of the IDE.

```
[IDE Context]
Project root: /Users/mishka/project
Language: Python 3.11
Active file: src/api/handlers.py (line 87, col 12)
Selection:
```python
def handle_request(req):
    result = blocking_call(req)
    return result
```
Diagnostics (2 errors):
  - Line 87: Variable 'result' is not used before return
  - Line 88: blocking_call is deprecated
Git: branch=feature/async-refactor, 3 uncommitted changes
---
User message: Refactor this to be async
```

The context is assembled from IDE APIs and injected at send time — the backend is unaware of this and doesn't need to change.

---

## 5. File Edit Handling

When the agent calls a file-editing tool (`str_replace_editor`, `write_file`, etc.), the plugin intercepts the `chat.tool_call` and `chat.tool_result` events and:

1. **Shows a diff panel** — the proposed change rendered as a side-by-side or inline diff using native IDE diff UI
2. **User accepts/rejects** — accept applies the edit to the actual file in the editor; reject sends a follow-up message explaining the rejection
3. **Auto-apply mode** — optional setting to apply all changes without prompting (like `--yolo` mode)

For JetBrains: `DiffManager` API + `Document.replaceString()`
For VS Code: `WorkspaceEdit` API + `window.showTextDocument()`

The tool call parsing is the same for both: extract `path`, `old_str`, `new_str` (or `content`) from the tool call params JSON.

---

## 6. Feature Set (Both Plugins)

Legend: ✅ done · 🔶 partial · ❌ not started

### Core (v1)

| Feature | JetBrains | VS Code |
|---------|-----------|---------|
| Chat panel with streaming markdown rendering | ✅ | ✅ |
| Session list (create / switch / delete) | ✅ | ✅ (list + switch; no delete) |
| Automatic context injection (active file, selection, language) | ✅ | ✅ |
| Tool call cards (file read/write, bash, etc.) | ✅ | ✅ (via shared webview) |
| Inline diff for file edits (accept / reject) | ✅ | ❌ |
| Connection status indicator (connected / reconnecting) | ✅ | ✅ |
| Token usage display | ✅ (status bar tooltip) | ❌ |

### Enhanced (v2)

| Feature | JetBrains | VS Code |
|---------|-----------|---------|
| Diagnostics context: IDE errors/warnings injected into every message | ✅ | ✅ |
| Git context: current branch + uncommitted change count | ✅ | ❌ |
| Multi-file context: all open tabs sent with each message | ✅ | ❌ |
| Project tree context: directory listing of workspace | ✅ | ❌ |
| "Fix this error" quick action on diagnostic markers (Alt+Enter) | ✅ | ❌ |
| Right-click → "Send Selection to JiuwenSwarm" | ✅ | ✅ |
| Inline ghost text suggestions (like Copilot) | ❌ | ❌ |
| Skills panel: browse / toggle skills from within IDE | ✅ | ❌ |
| Clickable file links: agent-mentioned paths open file at line in editor | ✅ | ❌ |
| TraceHound / Replay panel: session trajectory viewer inside IDE | ❌ | ❌ |

### Power features (v3)

| Feature | JetBrains | VS Code |
|---------|-----------|---------|
| Approval workflow: tool calls require user confirmation | ❌ | ❌ |
| Terminal integration: agent runs commands in IDE terminal | ❌ | ❌ |
| Symbol navigation: agent references symbols for jump-to-definition | ❌ | ❌ |
| Checkpoint / rewind: undo all file changes from last turn | ✅ | ❌ |
| Pair programming mode: agent narrates thought process in real time | ❌ | ❌ |

---

## 7. VS Code Extension

### Tech Stack
- Language: **TypeScript**
- Bundler: **esbuild** (same as most VS Code extensions)
- WebSocket: **`ws`** npm package
- Markdown rendering: VS Code's built-in `MarkdownString` / Webview
- UI: **Webview** (`vscode.WebviewPanel`) using React + Vite (same as jiuwenswarm web frontend — can share components)

### Extension Structure
```
vscode-jiuwenswarm/
├── package.json              # Extension manifest (contributes, activationEvents)
├── src/
│   ├── extension.ts          # Entry point: activate(), deactivate()
│   ├── client/
│   │   ├── WsClient.ts       # WebSocket connection + reconnect logic
│   │   ├── SessionManager.ts # session.list / create / switch
│   │   └── MessageStream.ts  # event parsing, stream assembly
│   ├── context/
│   │   ├── ContextCollector.ts  # Collect active file, selection, diagnostics, git
│   │   └── GitContext.ts        # git branch, diff via simple-git or child_process
│   ├── editor/
│   │   ├── DiffApplier.ts    # Parse tool_call file edits, apply via WorkspaceEdit
│   │   └── InlineGhost.ts    # Ghost text provider (v2)
│   ├── ui/
│   │   ├── ChatPanel.ts      # WebviewPanel wrapper + message bridge
│   │   ├── StatusBar.ts      # Connection status + token counter
│   │   └── SessionPicker.ts  # QuickPick session switcher
│   └── webview/              # React app inside webview
│       ├── App.tsx
│       ├── ChatView.tsx      # Message list, streaming text
│       ├── ToolCallCard.tsx  # Tool invocation UI
│       ├── DiffPreview.tsx   # Proposed edit diff view
│       └── SessionBar.tsx    # Session selector
├── webpack.config.js
└── tsconfig.json
```

### Key VS Code APIs Used
| Feature | API |
|---------|-----|
| Chat panel | `vscode.window.createWebviewPanel()` |
| Active file | `vscode.window.activeTextEditor` |
| Selection | `editor.selection`, `editor.document.getText(selection)` |
| Apply edit | `vscode.workspace.applyEdit(WorkspaceEdit)` |
| Diagnostics | `vscode.languages.getDiagnostics()` |
| Quick action | `vscode.languages.registerCodeActionsProvider()` |
| Keybinding | `contributes.keybindings` in package.json |
| Status bar | `vscode.window.createStatusBarItem()` |
| Terminal | `vscode.window.createTerminal()` |
| Settings | `vscode.workspace.getConfiguration('jiuwenswarm')` |

### package.json contributes
```json
{
  "contributes": {
    "viewsContainers": {
      "activitybar": [{
        "id": "jiuwenswarm",
        "title": "JiuwenSwarm",
        "icon": "$(hubot)"
      }]
    },
    "views": {
      "jiuwenswarm": [
        { "id": "jiuwenswarm.chat", "type": "webview", "name": "Chat" },
        { "id": "jiuwenswarm.sessions", "name": "Sessions" }
      ]
    },
    "commands": [
      { "command": "jiuwenswarm.newSession", "title": "JiuwenSwarm: New Session" },
      { "command": "jiuwenswarm.sendSelection", "title": "JiuwenSwarm: Explain Selection" },
      { "command": "jiuwenswarm.fixDiagnostic", "title": "JiuwenSwarm: Fix Error" }
    ],
    "keybindings": [
      { "command": "jiuwenswarm.newSession", "key": "ctrl+shift+j", "mac": "cmd+shift+j" },
      { "command": "jiuwenswarm.sendSelection", "key": "ctrl+shift+e" }
    ],
    "configuration": {
      "title": "JiuwenSwarm",
      "properties": {
        "jiuwenswarm.host": { "type": "string", "default": "localhost" },
        "jiuwenswarm.port": { "type": "number", "default": 19000 },
        "jiuwenswarm.autoApplyEdits": { "type": "boolean", "default": false },
        "jiuwenswarm.defaultMode": { "type": "string", "default": "code.normal" }
      }
    }
  }
}
```

### Webview Communication
VS Code webviews are isolated iframes. Communication goes via `postMessage`:
```
Extension ──postMessage──► Webview (React)
Extension ◄──postMessage── Webview (React)
```

The React app inside the webview handles rendering; the extension host holds the WebSocket connection. This separation means the UI can be rebuilt with hot-reload during development.

---

## 8. JetBrains Plugin

### Tech Stack
- Language: **Kotlin**
- Build: **Gradle** with `org.jetbrains.intellij.platform` Gradle plugin
- WebSocket: **OkHttp** (already bundled in IntelliJ) or **Ktor client**
- Markdown rendering: **Swing JTextPane** with HTML, or **JCEF** (embedded Chromium) for rich UI
- JSON: **kotlinx.serialization** or **Gson** (bundled)
- Coroutines: **kotlinx.coroutines** (standard for IntelliJ plugins)

**Key decision: JCEF vs Swing UI**

JCEF (JetBrains Chromium Embedded Framework) allows running the same React webview as the VS Code extension — possibly sharing the webview codebase. This is the recommended path for rich UI. JCEF is available in all 2020+ IntelliJ-based IDEs.

### Plugin Structure
```
jetbrains-jiuwenswarm/
├── build.gradle.kts
├── src/main/
│   ├── kotlin/com/jiuwenswarm/plugin/
│   │   ├── JiuwenSwarmPlugin.kt        # Plugin main (ApplicationComponent)
│   │   ├── client/
│   │   │   ├── WsClient.kt             # OkHttp WebSocket + coroutine flow
│   │   │   ├── SessionManager.kt       # Session CRUD + state
│   │   │   └── MessageStream.kt        # Parse streaming events
│   │   ├── context/
│   │   │   ├── ContextCollector.kt     # Active file, selection, diagnostics
│   │   │   └── GitContextProvider.kt   # git4idea API for branch/diff
│   │   ├── editor/
│   │   │   ├── DiffApplier.kt          # DiffManager, WriteCommandAction
│   │   │   └── InlineHintProvider.kt   # InlayHintsProvider (v2)
│   │   ├── ui/
│   │   │   ├── ChatToolWindow.kt       # ToolWindowFactory + JCEF panel
│   │   │   ├── SessionPickerAction.kt  # Popup session switcher
│   │   │   ├── StatusBarWidget.kt      # Connection + token count
│   │   │   └── FixWithAiIntention.kt   # IntentionAction for diagnostics
│   │   └── settings/
│   │       ├── JiuwenSwarmSettings.kt  # PersistentStateComponent
│   │       └── SettingsConfigurable.kt # Settings UI panel
│   └── resources/
│       ├── META-INF/
│       │   └── plugin.xml              # Plugin descriptor
│       └── webview/                    # Shared React webview build output
└── build/
```

### Key JetBrains APIs Used
| Feature | API |
|---------|-----|
| Chat panel | `ToolWindowFactory` + `JBCefBrowser` (JCEF) |
| Active file | `FileEditorManager.getInstance(project).selectedFiles` |
| Selection | `Editor.selectionModel`, `PsiFile` at cursor |
| Apply edit | `WriteCommandAction.runWriteCommandAction()` + `Document.replaceString()` |
| Diagnostics | `WolfTheProblemSolver`, `DaemonCodeAnalyzer`, `AnnotationHolder` |
| Quick fix | `IntentionAction` (appears in Alt+Enter menu) |
| Git context | `GitRepositoryManager` (git4idea plugin) |
| Settings | `PersistentStateComponent<State>` |
| Status bar | `StatusBarWidgetFactory` |
| Diff view | `DiffManager.getInstance().showDiff()` |
| Keyboard | `<action>` in plugin.xml with `<keyboard-shortcut>` |

### plugin.xml descriptor (key sections)
```xml
<idea-plugin>
  <id>com.jiuwenswarm.ide-plugin</id>
  <name>JiuwenSwarm</name>
  <vendor>OpenJiuwen</vendor>
  <depends>com.intellij.modules.platform</depends>
  <depends optional="true" config-file="jiuwenswarm-git.xml">Git4Idea</depends>

  <extensions defaultExtensionNs="com.intellij">
    <toolWindow id="JiuwenSwarm" anchor="right"
                factoryClass="com.jiuwenswarm.plugin.ui.ChatToolWindow"/>
    <applicationService
        serviceInterface="com.jiuwenswarm.plugin.settings.JiuwenSwarmSettings"
        serviceImplementation="com.jiuwenswarm.plugin.settings.JiuwenSwarmSettings"/>
    <statusBarWidgetFactory id="JiuwenSwarmStatus"
        implementation="com.jiuwenswarm.plugin.ui.StatusBarWidget"/>
    <intentionAction>
      <className>com.jiuwenswarm.plugin.ui.FixWithAiIntention</className>
      <category>JiuwenSwarm</category>
    </intentionAction>
  </extensions>

  <actions>
    <action id="JiuwenSwarm.NewSession"
            class="com.jiuwenswarm.plugin.ui.NewSessionAction"
            text="New JiuwenSwarm Session">
      <keyboard-shortcut keymap="$default" first-keystroke="ctrl shift J"/>
    </action>
    <action id="JiuwenSwarm.SendSelection"
            class="com.jiuwenswarm.plugin.ui.SendSelectionAction"
            text="Send Selection to JiuwenSwarm">
      <keyboard-shortcut keymap="$default" first-keystroke="ctrl shift E"/>
      <add-to-group group-id="EditorPopupMenu" anchor="last"/>
    </action>
  </actions>
</idea-plugin>
```

### JCEF Webview Communication
Similar to VS Code's webview — JavaScript bridge:
```kotlin
// Kotlin → JS
browser.cefBrowser.executeJavaScript("window.__jiuwen.onEvent($jsonPayload)", "", 0)

// JS → Kotlin (via query handler)
browser.jbCefClient.addMessageRouterHandler(object : CefMessageRouterHandlerAdapter() {
    override fun onQuery(browser, frame, queryId, request, persistent, callback): Boolean {
        val msg = Json.decodeFromString<IdeToExtMsg>(request)
        handleFromWebview(msg)
        return true
    }
}, browser.cefBrowser, null)
```

This means the React webview code can be **shared between VS Code and JetBrains** — both load the same HTML/JS bundle, just with different bridge implementations.

---

## 9. Shared Webview (Cross-IDE UI)

The chat UI rendered in both plugins is the same React application:

```
shared-webview/
├── src/
│   ├── App.tsx
│   ├── bridge/
│   │   ├── Bridge.ts         # Abstract: postMessage API
│   │   ├── VscodeBridge.ts   # VS Code: acquireVsCodeApi().postMessage
│   │   └── JetBrainsBridge.ts # JetBrains: window.cefQuery / __jiuwen.send
│   ├── components/
│   │   ├── ChatMessages.tsx   # Message list (streaming)
│   │   ├── ToolCallCard.tsx   # Tool invocation display
│   │   ├── DiffBlock.tsx      # Proposed file changes
│   │   ├── SessionBar.tsx     # Session selector header
│   │   └── InputBar.tsx       # Chat input with file attachment
│   ├── hooks/
│   │   ├── useStream.ts       # Assemble delta chunks into complete messages
│   │   └── useSession.ts      # Session state management
│   └── main.tsx
├── vite.config.ts
└── package.json
```

The bridge abstraction:
```typescript
export interface Bridge {
  send(msg: WebviewToExtMsg): void;
  onMessage(handler: (msg: ExtToWebviewMsg) => void): () => void;
}

// Detected at startup from window globals
export function createBridge(): Bridge {
  if (typeof acquireVsCodeApi !== 'undefined') return new VscodeBridge();
  if (window.__jiuwen_jb) return new JetBrainsBridge();
  throw new Error('Unknown IDE host');
}
```

---

## 10. New Backend Channel (Optional — Phase 2)

For v2, add `"ide"` as a first-class channel in jiuwenswarm to enable IDE-specific features:

### What requires a new channel type
- **Per-file permission scoping**: Agent only touches files within the open project
- **IDE-native tool results**: Instead of the agent writing to terminal, results go back to IDE APIs (open file, show diff, run test)
- **Bidirectional cursor sync**: Agent can request "jump to line 42 in foo.py" and the IDE executes it
- **Streaming token-by-token inline**: Inline completions need sub-50ms latency routing

### Implementation sketch
```python
# jiuwenswarm/common/schema/message.py
class ReqMethod(str, Enum):
    # ... existing ...
    IDE_CONTEXT_PUSH = "ide.context_push"    # IDE pushes context (file open, selection change)
    IDE_APPLY_EDIT   = "ide.apply_edit"      # Agent requests IDE to apply an edit
    IDE_OPEN_FILE    = "ide.open_file"       # Agent requests IDE to open a file
    IDE_RUN_TERMINAL = "ide.run_terminal"    # Agent requests terminal command via IDE
    IDE_COMPLETION   = "ide.completion"      # Inline completion request (fast path)

class EventType(str, Enum):
    # ... existing ...
    IDE_EDIT_PROPOSAL = "ide.edit_proposal"  # Server pushes a file edit for IDE to render
    IDE_CURSOR_MOVE   = "ide.cursor_move"    # Server requests IDE cursor movement
```

```python
# jiuwenswarm/gateway/channel_manager/ide/ide_channel.py
class IdeChannel(BaseWsChannel):
    """
    WebSocket channel for IDE plugin clients.
    Same protocol as web channel but with:
    - Project-scoped file access validation
    - ide.* method handlers for bidirectional control
    - IDE-native tool routing (edits go back to IDE, not written by agent)
    """
    channel_type = ChannelType.IDE

    def register_handlers(self):
        self.register_method("ide.context_push", self._handle_context_push)
        self.register_method("ide.completion", self._handle_completion)
```

For Phase 1, this is not needed — the existing web protocol is sufficient.

---

## 11. Build & Distribution

### VS Code Extension
- **Registry**: [VS Code Marketplace](https://marketplace.visualstudio.com/)
- **Packaging**: `vsce package` → `.vsix` file
- **CI**: GitHub Actions — `vsce publish` on tag push
- **Install locally**: `code --install-extension jiuwenswarm-*.vsix`

### JetBrains Plugin
- **Registry**: [JetBrains Marketplace](https://plugins.jetbrains.com/)
- **Packaging**: `./gradlew buildPlugin` → `build/distributions/jiuwenswarm-*.zip`
- **CI**: GitHub Actions — `./gradlew publishPlugin` on tag push
- **Compatibility**: `sinceBuild = "223"` (2022.3) — covers all modern JetBrains IDEs
- **Install locally**: Settings → Plugins → Install from disk

### Monorepo layout
```
jiuwenswarm-ide/
├── packages/
│   ├── shared-webview/          # Shared React chat UI
│   ├── vscode-extension/        # VS Code plugin
│   └── jetbrains-plugin/        # JetBrains plugin (Kotlin/Gradle)
├── .github/workflows/
│   ├── build-vscode.yml
│   └── build-jetbrains.yml
└── README.md
```

---

## 12. Implementation Phases

Legend: ✅ done · ❌ not started — columns: [JetBrains | VS Code]

### Phase 1 — Working Prototype (both plugins)

| # | Feature | JetBrains | VS Code |
|---|---------|-----------|---------|
| 1 | WebSocket client connecting to `ws://localhost:19000/ws` | ✅ | ✅ |
| 2 | Session creation on startup | ✅ | ✅ |
| 3 | Basic chat panel (text in, streaming text out) | ✅ | ✅ |
| 4 | Tool call cards (read-only display) | ✅ | ✅ |
| 5 | Connection status indicator | ✅ | ✅ |
| 6 | VS Code: Webview panel · JetBrains: JCEF panel | ✅ | ✅ |

**Deliverable**: Developer can type a question, get a streaming answer from jiuwenswarm, see what tools ran.

### Phase 2 — Context & Edits

| # | Feature | JetBrains | VS Code |
|---|---------|-----------|---------|
| 1 | Context injection (active file, selection, diagnostics) | ✅ | ✅ |
| 2 | File edit interception from `chat.tool_call` events | ✅ | ❌ |
| 3 | Diff viewer (propose → accept/reject) | ✅ | ❌ |
| 4 | Session management (list, create, switch) | ✅ | ✅ |
| 5 | Settings panel (host, port, mode, auto-apply) | ✅ | ✅ (no auto-apply setting) |

**Deliverable**: Developer can ask "fix this function" with selection, get a diff, click Accept.

### Phase 3 — Deep IDE Integration

| # | Feature | JetBrains | VS Code |
|---|---------|-----------|---------|
| 1 | Git context (branch, uncommitted changes count) | ✅ | ❌ |
| 2 | "Fix with JiuwenSwarm" quick action on errors (Alt+Enter) | ✅ | ❌ |
| 3 | Right-click context menu → "Send Selection to JiuwenSwarm" | ✅ | ✅ |
| 4 | Multi-file context (all open tabs) | ✅ | ❌ |
| 5 | Skills browser panel | ✅ | ❌ |
| 6 | Token usage in status bar | ✅ | ❌ |

**Deliverable**: First-class AI assistant experience on par with Copilot Chat / Cursor.

### Phase 4 — Advanced

| # | Feature | JetBrains | VS Code |
|---|---------|-----------|---------|
| 1 | Inline ghost text completions | ❌ | ❌ |
| 2 | Approval workflow for tool calls | ❌ | ❌ |
| 3 | Replay / TraceHound viewer inside IDE | ❌ | ❌ |
| 4 | Terminal integration (agent runs commands in IDE terminal) | ❌ | ❌ |
| 5 | Shared webview code published as npm package | ❌ | ❌ |

---

## 13. Key Implementation Notes

### Connection Management
- Reconnect with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- On reconnect: restore last active session via `session.switch`
- Heartbeat: send a ping frame every 20s to keep the WS alive (jiuwenswarm default timeout is 20s)

### Message ID Tracking
Every `req` message gets a UUID `id`. Responses/events include `request_id` matching that UUID. The plugin must track in-flight requests by ID to match response events to the right chat turn.

### Streaming Text Assembly
Events arrive as:
```
chat.delta  { request_id, payload: { text: "Hello" } }
chat.delta  { request_id, payload: { text: " world" } }
chat.final  { request_id, payload: { ... full content ... } }
```

The webview accumulates `delta.text` strings per `request_id`. On `chat.final`, replace with the canonical content (handles edge cases where deltas are dropped).

### Tool Call Display
```
chat.tool_call   → show card: "📝 Writing file: src/api.py" (spinner)
chat.tool_result → update card: show first 3 lines of result + collapsible full view
```

For file edit tools (`str_replace_editor`, `write_file`): parse `params.path`, `params.old_str`, `params.new_str` and show diff in IDE native diff viewer instead of the generic card.

### Security Considerations
- The plugin only connects to `localhost` — never a remote server (configurable for enterprise)
- jiuwenswarm itself handles tool permissions — the plugin doesn't need to sandbox anything
- For the "approval workflow" feature (Phase 3): the plugin sends `permissions.approval_overrides.*` to configure which tools require confirmation

---

## 14. Open Questions

1. **Shared credentials**: The IDE plugin connects to jiuwenswarm which the user is already running. No separate auth needed for v1. Enterprise deployments may want API token auth on the WebSocket — would need a minor gateway change to read `Authorization: Bearer <token>` headers on WS handshake.

2. **Multiple projects**: Should each VS Code workspace get its own jiuwenswarm session, or share one? Recommendation: one session per VS Code workspace folder (keyed on workspace path hash). Store the mapping in extension global state.

3. **jiuwenswarm not running**: If the user hasn't started jiuwenswarm, the plugin should show a helpful setup prompt rather than a raw "connection refused" error. Could bundle a minimal launcher command.

4. **Inline completions latency**: The `code.normal` mode has ~1-3s latency — too slow for ghost text. Inline completions would need a dedicated fast model path (`code.complete` mode, not yet in ReqMethod — would need to be added).

5. **Code indexing**: Should the plugin proactively send project file contents so the agent has whole-project context? For large repos this is expensive. Start with just the active file + selection; add opt-in "send project index" for smaller repos.
