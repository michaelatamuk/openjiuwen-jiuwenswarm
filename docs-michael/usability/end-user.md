[← Index](README.md) · jiuwenswarm Usability Review

---

# P1 — End-User

*The person chatting with the agent day to day.*

This is the largest section because end-users are the primary audience for most
of jiuwenswarm's surface area.

**Two meaningfully different variants of P1 exist:**

- **Web UI user** — opens `localhost:5173` directly, has full access to the chat
  panel, settings, skill panel, and trajectory view. This is also the most common
  deployment: the person who installed jiuwenswarm and uses it for themselves
  (see note on P1/P2 overlap below).
- **IM channel user (P13)** — encounters jiuwenswarm through a Feishu group, Telegram
  channel, WeChat bot, or similar. They use their IM app as the interface; they have
  no access to the Web UI, cannot change settings, cannot stop a running task, and
  may not know they are talking to jiuwenswarm. This persona is defined separately as
  P13 and is not yet fully covered.

The findings in this section are written for the Web UI user. Several (keyboard
shortcuts, trajectory panel, settings) do not apply to IM channel users at all.

**Note on P1/P2 overlap:** In the dominant deployment pattern — a developer or
technical individual who self-hosts jiuwenswarm — the installer and the user are the
same person. P1 and P2 collapse into one. The P1/P2 split is meaningful only when
jiuwenswarm is deployed as a shared IM bot: one person configured it (P2), others
use it through a channel (P1) without touching the config.

---

## §1 · Core Usability

*Direct interaction quality: errors, modes, feedback, conversation management.*

### 1.1 Error Messages Give Users Nothing to Act On

**Current state.**
Two examples that reached production:
```python
# channels/cli/render.py:200
error = payload.get("error") or payload.get("message", "unknown error")
```
When neither field is present, the user sees `unknown error` with no context — no
tool name, no session ID, no log reference, no next step.

```python
# channels/cli/chat.py:292
raise ValueError("unable to parse response from gateway")
```
No indication of whether this is a network issue, a protocol mismatch, or a bug.

**What good looks like.**
Every error surfaced to a user should answer three questions: what happened, why it
happened, and what to do next. Examples of the pattern:

> "The parse-invoice skill failed to read /data/invoices/inv_003.pdf — the file may
> be corrupted or password-protected. Try opening the file manually to verify it."

> "Lost connection to the gateway (WebSocket closed). The agent has stopped. Your
> conversation is saved. Reload the page to reconnect."

The CLI and Web UI should agree on error format. Errors should include a short
machine-readable code (e.g. `ERR_GATEWAY_DISCONNECT`) so users can search for it
in documentation or paste it in a support request.

### 1.2 Mode Naming Is System-Centric, Not User-Centric

**Current state.**
Modes — `agent`, `code`, `cluster`, `team`, `agent.plan`, `agent.fast` — are named
from the implementation's perspective. The mode selector in the Web UI has no
tooltip, no one-liner description, and no example of when to use each. A new user
cannot make an informed choice.

**What good looks like.**
Name modes from the user's goal, not the system's architecture:

| Internal name | User-facing name | One-liner |
|---|---|---|
| `agent` | Standard | For everyday tasks and questions |
| `agent.fast` | Fast | Quick answers, less thorough |
| `agent.plan` | Plan first | Agent writes a plan for your approval before doing anything |
| `code` | Code | Software development, debugging, refactoring |
| `cluster` | Multi-agent | Complex tasks where several agents work in parallel |
| `team` | Team | Persistent team of agents with shared workspace and memory |

The mode selector should show this table on hover or as an expandable hint.
First-time users should see a recommendation ("For your first task, try Standard").

### 1.3 No Structured Feedback Mechanism for Agent Responses

**Current state.**
The only feedback mechanism found is on `ProactiveRecommendationCard` — thumbs
up/down for skill recommendations, stored in localStorage, sent via
`webClient.request('proactive.feedback', {...})`. There is no feedback mechanism on
regular assistant messages: no thumbs down, no "regenerate", no "that was wrong",
no inline correction.

**What good looks like.**
- Every assistant message should have a lightweight feedback row: 👍 👎 and a "retry"
  button that regenerates the last response.
- Thumbs down should optionally open a micro-form: "Wrong facts", "Too long",
  "Didn't follow my instruction", "Other" — two taps, no typing required.
- A "correct this" mode that lets the user edit the agent's response inline and marks
  that edit as ground truth for the session.
- Corrections should feed back into the session context so the agent adjusts without
  the user having to re-explain.

### 1.4 Skill Creation Entry Point Is Not Obvious

**Current state.**
Creating a skill routes between `skill-creator-normal`, `swarmskill-creator`, and
`skill-omni-creation` based on what the user types into the chat input. The routing
logic lives inside the `SKILL.md` of the skill-creator skill itself — not in any
user-facing UI. A user wanting to create a skill has no guided entry point.

**What good looks like.**
A "Create Skill" button in the Skills panel (`SkillPanel/index.tsx`) that opens a
short wizard: what kind of skill? (single-agent / team / from URL) — and routes the
user to the right creator with an opening prompt already filled in.

### 1.5 Conversation History Is Not Searchable

**Current state.**
`ConversationSidebar.tsx` shows sessions grouped by project with rename, delete,
and pin — but no search. Finding a specific past conversation requires scrolling
through all sessions.

**What good looks like.**
A search box at the top of the conversation sidebar that searches across session
titles and message content. Results should highlight the matching message and jump
to it. This is table-stakes for any chat product.

### 1.6 No Keyboard Shortcuts for Core Actions

**Current state.**
No documented keyboard shortcuts exist in the Web UI. The chat input handles `Enter`
to submit, but actions like "new conversation", "stop agent", "switch mode", "open
settings", and "focus input" have no keyboard access.

**What good looks like.**
A small keybindings layer with at minimum:
- `Ctrl+K` / `Cmd+K` — new conversation
- `Escape` — stop/interrupt agent
- `Ctrl+/` / `Cmd+/` — command palette
- `Ctrl+,` / `Cmd+,` — open settings
- Arrow keys to navigate session list when focused

A `?` key or `Shift+?` that opens a keybindings reference overlay.

### 1.7 Agent Output Has No Length or Style Controls

**Current state.**
There is no global setting or per-message instruction for response length or style.
If the agent tends to be verbose, the user must add "be brief" to every message.

**What good looks like.**
A persistent preference (saved to MEMORY.md or user config) for response style:
terse / standard / detailed. A per-message override via a small pill control next
to the send button. The agent should read this preference from memory and apply it
without being reminded.

### 1.8 No "Undo" for Agent Actions

**Current state.**
The agent can write files, send Feishu messages, delete files, and call external
APIs. None of these actions can be undone from the UI. Once sent, they are sent.

**What good looks like.**
A post-action summary card after each turn showing what was changed. For reversible
actions (file writes, file deletes), an "Undo last action" button that appears for
30 seconds. For irreversible actions (messages sent, API calls made), a clear label
"This action cannot be undone." This requires the harness to track a per-turn
action log — which is architecturally feasible given the existing trajectory system.

### 1.9 Long Messages Lack Structure Aids

**Current state.**
`StreamingContent.tsx` renders text with simple whitespace-preserving display.
For long agent responses with multiple sections, there is no table of contents, no
jump-to-section, no folding.

**What good looks like.**
Auto-detect headers in agent output (`## Section`) and render a sticky mini-TOC
at the top of the message panel for long responses. Collapsible sections for
code blocks and lengthy reasoning chains.

---

## §3 · Trust & Safety

*Does the user understand what the agent is about to do, and can they stop it?*

### 3.1 No Visibility Into Agent Permissions Before the First Action

**Current state.**
The agent can run bash commands, read and write files, send messages to Feishu,
call web APIs, and spawn subagents. Before a session starts the user sees no
summary of what the agent's current permissions are. The `PermissionWarningDialog`
only appears as a generic "full access warning" — it does not list what is
specifically permitted.

**What good looks like.**
A "Session capabilities" summary shown as a collapsible banner at the top of a new
conversation:
```
This agent can: read/write files in /home/mishka/invoices/ · send Feishu messages
                · run bash commands · call the parse-invoice skill
This agent cannot: access the internet · modify files outside the project directory
```
Users should be able to click any item to see the specific permission rule behind
it, and toggle tool access for this session without editing config.

### 3.2 No Diff/Preview Before the Agent Modifies Files

**Current state.**
The agent can create, edit, and delete files in the project directory. The Web UI
has a `CodeChangesCard` component in `ChatPanel/index.tsx` — but it is not clear
whether it shows a preview before changes are made or a summary after.

**What good looks like.**
Before committing any file write, the agent should show a diff in the chat panel:
```
Proposed change to src/parser.py:
- def parse(file):
+ def parse(file, encoding="utf-8"):
[Apply] [Edit] [Skip]
```
This requires the harness to separate the "compute change" step from the "commit
change" step — architecturally non-trivial but the highest-leverage trust feature
in a coding assistant.

### 3.3 No Task Cancellation With Defined Semantics

**Current state.**
There is no Stop button with defined behavior. The user can close the tab or kill
the process, but the agent may continue running on the server, and partial file
writes or external API calls may be in an inconsistent state.

**What good looks like.**
A Stop button in the chat panel header that:
1. Sends an interrupt signal to the harness.
2. Waits for the currently executing tool call to finish (not mid-write).
3. Displays a "Stopped" card listing exactly what was completed and what was not:
   ```
   Stopped after 3 of 5 steps.
   Completed: listed files, read inv_001.pdf
   Not completed: parse inv_002.pdf, write CSV
   ```
4. Leaves the conversation in a resumable state — the user can say "continue" to
   pick up where it stopped.

### 3.4 Destructive External Actions Have No Confirmation Layer

**Current state.**
The agent can send messages to Feishu groups, publish to external APIs, and call
webhooks — all without a user confirmation step. The permission system can block
tools entirely but cannot require per-call confirmation for sensitive actions.

**What good looks like.**
A "confirm before send" mode for external-impact tools. Before calling
`send_feishu_message` or any external webhook, the agent shows the message content
in the chat panel with Confirm / Edit / Cancel buttons. This is especially important
for group messages where mistakes are visible to many people.

---

## §4 · Reliability & Resilience

*What does the user experience when something goes wrong?*

### 4.1 Graceful Degradation Is Silent

**Current state.**
When a non-critical subsystem fails — memory provider down, OTel exporter
unreachable, a channel fails to initialize — the system continues running but the
user receives no notice. They may be operating under the assumption that memory is
being saved when it is silently failing. `config.py:84` logs this at DEBUG level.

**What good looks like.**
A persistent health indicator in the Web UI — a small dot in the sidebar or bottom
bar:
- Green: all subsystems nominal.
- Yellow: one or more non-critical subsystems degraded (click for details).
- Red: agent is not reachable.

On hover or click, a panel shows: "Memory: degraded (disk full). OTel: offline
(exporter unreachable). All other services nominal." This is a 2-hour implementation
that eliminates an entire class of silent failures.

### 4.2 Session Recovery After Disconnect Is Undefined

**Current state.**
If the browser tab closes or the WebSocket drops mid-task, it is not documented or
visible whether the agent continues, stops, or is in an undefined state. There is
no reconnect flow that shows what happened during the disconnect.

**What good looks like.**
On reconnect, the Web UI should immediately show what the agent did during the
disconnect: "While you were away, the agent completed 4 steps and wrote 2 files.
Here is what happened: [summary]." If the task is still running, show its current
step. If it completed with an error, show the error prominently. The `useWebSocket`
hook in `hooks/useWebSocket.ts` is the right place to implement reconnect + replay.

### 4.3 Rate Limiting and API Failures Are Opaque

**Current state.**
When an API rate limit is hit or the model returns a 429 / 503, the user sees either
a generic error message or the agent silently hangs. There is no exponential backoff
indicator, no "retrying in 15s" message, no suggestion to switch to a different model.

**What good looks like.**
- A visible "Rate limited — retrying in 15s" countdown in the chat panel.
- After 3 consecutive model errors, surface a prompt: "The model is repeatedly
  failing. Try switching to deepseek-v3?" with a one-click model switch.
- API errors should include the HTTP status code and the model's error message
  verbatim, not a paraphrase.

### 4.4 No Persistent State for In-Progress Tasks

**Current state.**
If the `jiuwenswarm` process crashes mid-task, the task is lost. There is no
checkpoint system — the agent cannot resume from step 3 of 5 after a restart.

**What good looks like.**
The todo system (`TaskPlanningRail`) already tracks task state. Persisting this to
disk (a simple JSON file per session) would allow the agent to display "last session
was interrupted at step 3: parse invoices. Resume?" on reconnect. This turns a
frustrating failure mode into a recoverable one.

---

## §5 · Onboarding & First-Run Experience

*The experience from `pip install` to first successful task.*

### 5.1 The Setup Wizard Ends Too Early

**Current state.**
`ModelSetupGuide.tsx` has 3 steps: welcome → settings spotlight → models module
spotlight. The wizard ends at the models panel. The user must then figure out how
to fill in provider credentials and validate them. If the model is misconfigured,
the error only appears on the first chat.

**What good looks like.**
The wizard should not complete until the user has sent one successful message. Every
step should be testable inline. Suggested flow:
1. Welcome — what jiuwenswarm does in 3 bullet points.
2. Choose model provider — dropdown with logos (DeepSeek, OpenAI, Anthropic,
   Huawei MaaS, Azure, Custom). Each option shows which fields are required.
3. Enter credentials — with a "Test connection" button that makes a live API call.
   Show: ✓ Connected (320ms) or ✗ Invalid API key — check your provider dashboard.
4. (Optional) Enable a channel — Feishu, Telegram, etc., same test pattern.
5. Send your first message — prefilled with a suggested starter task.

### 5.2 Empty State Has No Direction

**Current state.**
An empty conversation shows a blank input area. There is a `WelcomeBubble` component
with adaptive positioning, but its content is not known without reading the code.

**What good looks like.**
The empty state should show:
- 3–5 example tasks tailored to the active mode ("Parse my invoices", "Refactor
  this Python file", "Search the web for…").
- A prompt suggestion chip that inserts the text into the input on click.
- A "What can I do?" link that opens a short capability overview.

### 5.3 No Progressive Onboarding After First Use

**Current state.**
After the setup wizard there is no further onboarding. Features like trajectory,
skills, team mode, memory, and the connector market are never introduced unless
the user stumbles upon them.

**What good looks like.**
A "tip of the session" system: once per new feature area first encountered, show a
small non-blocking tooltip. Examples:
- First time an agent completes a multi-step task: "Did you know you can see exactly
  what the agent did? Open the Trajectory panel →"
- First time the agent writes a file: "You can review file changes before they're
  applied. Enable change preview in settings →"
- After 5 sessions: "You've had 5 conversations. Memory lets the agent remember your
  preferences. Enable it →"

### 5.4 CLI First-Run Has No Guidance

**Current state.**
Running `jiuwenswarm` from the terminal with no config gives an unclear error. There
is no `jiuwenswarm --help` output that walks through what to do first.

**What good looks like.**
```
$ jiuwenswarm
No config found at ~/.jiuwenswarm/config/config.yaml.
Run 'jiuwenswarm-init' to set up your workspace, then 'jiuwenswarm-start'.
```
And `jiuwenswarm-init` should interactively prompt for the minimum required
configuration (model provider, API key) before exiting.

---

## §6 · Agent Transparency & Explainability

*Can the user understand what the agent is doing and why?*

### 6.1 Thinking Display Is Hidden Behind the Trajectory Panel

**Current state.**
`TrajectoryTable.tsx` displays `thinkingDetail` for each trajectory cell with
expandable thinking blocks. However, this is inside the Trajectory panel — a
separate panel that must be explicitly opened. During a conversation, the user
sees only the streaming text output and tool call cards.

**What good looks like.**
Two levels of transparency:
- **Inline (default):** A collapsed "Reasoning" chip on each assistant message.
  Clicking it expands the thinking inline in the chat, without switching panels.
- **Full (Trajectory panel):** The full structured trace with timing, token counts,
  and tool argument/result details.

The inline chip should show the first 1–2 sentences of reasoning as a preview before
expanding.

### 6.2 Tool Calls Are Shown But Not Explained

**Current state.**
`ToolCallDisplay.tsx` shows tool name, formatted arguments (expandable), and
success/failure status. The description field exists in the tool schema but is
not displayed. The user sees `read_file("/data/invoices/inv_001.pdf")` but not why
the agent chose to read that file.

**What good looks like.**
Show a one-sentence rationale before each tool call — either from the agent's
reasoning or synthesized from the thinking trace:
```
Reading the invoice file to extract the vendor and amount fields.
> read_file("/data/invoices/inv_001.pdf")   ✓  (140ms)
```
For tool errors, show what the agent will try next:
```
> glob("/data/invoices/*.pdf")   ✗  Directory not found
  Agent will check if /data/invoices exists before retrying.
```

### 6.3 Subagent Activity Is Not Visible to the User

**Current state.**
When `subagent_spawn` is called, the parent agent's panel shows no indication that
subagents are running. The user has no view into what the subagents are doing, how
many are running, or whether any have failed.

**What good looks like.**
A live subagent activity panel (the `TeamArea` component exists for team mode —
the same concept should apply to on-demand subagents):
- A list of active subagents with: type, current step, elapsed time.
- Clicking a subagent opens its own trajectory or streaming output.
- When all subagents complete, a summary: "3 subagents finished in 28s."

### 6.4 No Explanation of Why the Agent Asked a Question

**Current state.**
When the agent asks the user for clarification ("Which directory should I write the
output to?"), there is no indication of what it was trying to do when it got stuck.
Users must infer from context.

**What good looks like.**
Attach a brief context line to every clarification request:
> "I'm about to write the output CSV and wasn't sure of the destination."
> **Which directory should I write the output file to?**

---

## §7 · Performance & Perceived Speed

*Does the system feel fast, and does it communicate when it is not?*

### 7.1 No First-Token Latency Indicator

**Current state.**
`StreamingContent.tsx` renders tokens as they arrive. But between submitting a
message and the first token appearing, there is a gap (model warm-up, context
assembly, routing). During this gap the user sees nothing — no spinner, no progress.

**What good looks like.**
Immediately on message submit, show an animated "thinking" indicator (three dots,
a pulsing bar) that disappears when the first token arrives. The `HarnessProgressBar`
component already exists — it should be visible from the moment the user submits.

### 7.2 No Indication of Context Length Pressure

**Current state.**
There is a proactive notification for "context limit reached" via WebSocket, but
this appears only at the limit. Users have no advance warning.

**What good looks like.**
A small token counter in the chat input area, similar to what Claude.ai and ChatGPT
show. At 70% capacity, change color to yellow. At 90%, show a warning: "Approaching
context limit — older messages may be summarized." This gives users time to start a
new session before the agent starts forgetting early context.

### 7.3 Skill Execution Has No Progress Feedback

**Current state.**
When a skill is executing (potentially for minutes), the user sees only a generic
tool call card. There is no progress bar, no step count, no estimated time.

**What good looks like.**
Skills should be able to emit progress events that render as a live progress bar
in the tool call card: "parse-invoice: processed 3 of 12 files…". This requires a
lightweight progress protocol in the skill execution harness, but the UI infrastructure
(`HarnessProgressBar`) already exists.

---

## §8 · Notification & Async

*How does the system communicate with users who are not watching?*

### 8.1 No Notification When Long-Running Tasks Complete

**Current state.**
For tasks that take minutes, the user must keep the Web UI open and watch. There
is no desktop notification, no sound, no badge, no message-to-self when the task
completes. The only notifications found are in-app toasts.

**What good looks like.**
- **Browser notification:** On task complete, fire a Web Notifications API
  notification (with permission): "Invoice parsing complete — 3 files processed."
- **Sound:** An optional subtle completion sound (user-configurable).
- **Tab badge:** Update the page title to show unread results: "(✓) jiuwenswarm".
- **Channel self-notification:** Option to send the result summary to the user's own
  Feishu/Telegram account on completion. Given that channels are already integrated,
  this is a small addition.

### 8.2 No Background Task Management

**Current state.**
When the user navigates to a different session while the agent is running, there is
no indication in the sidebar that a session has an active task. The session list
shows a processing state for the active session, but background sessions are silent.

**What good looks like.**
- A pulsing dot on sessions running in background in the `ConversationSidebar`.
- A global "Running tasks" indicator in the `SessionSidebar` nav.
- When a background task completes, show a badge on the session and a non-blocking
  toast: "Session 'Invoice task' completed."

---

## §12 · Data & Privacy

*What data is stored, where, and who can see it.*

### 12.1 No Visibility Into What Is Stored in Memory

**Current state.**
The memory system stores facts, daily logs, and user profile data in
`~/.jiuwenswarm/workspace/`. Users have no UI to browse, search, edit, or delete
what the agent has remembered about them.

**What good looks like.**
A "My memory" panel (accessible from the sidebar) that shows:
- `USER.md` content formatted as a profile card.
- `MEMORY.md` content as a searchable list of facts.
- Recent daily memory entries (last 7 days).
- A "Delete fact" button on each item.
- A "Clear all memory" action with a confirmation.

### 12.2 No Indication of What the Agent Sends to the LLM

**Current state.**
The full prompt sent to the model — including memory snapshot, installed skills,
conversation history, and system sections — is invisible to the user. There is no
way to audit what personal information is being sent to an external API.

**What good looks like.**
A "What's in the prompt?" inspector (accessible from a ⓘ icon on the model name
indicator) that shows a summary of the current prompt: how many tokens, which
sections are included, and whether memory or skills are attached. Users should be
able to see that their `USER.md` content is part of the prompt before they consent
to using an external model.

### 12.3 No Data Retention Policy UI

**Current state.**
Memory and conversation history are stored indefinitely. There is a
`trajectory_ui.retention_days` config option, but no equivalent for conversations
or memory.

**What good looks like.**
A data retention settings panel: "Keep conversation history for: 30 / 90 / 365 /
forever". "Keep daily memory for: 7 / 30 / 90 / forever". "Delete all data older
than X". Automated expiration should run on startup.

---

## §13 · Help & Support

*What happens when the user gets stuck?*

### 13.1 No In-Context Help

**Current state.**
`HelpTips.tsx` exists as a generic help component. `channelGuideUrls.ts` has
external links for channel setup. Beyond these, there is no contextual help — no
tooltips on complex fields, no "?" icons that open relevant documentation.

**What good looks like.**
Every settings field with a non-obvious value should have a `?` icon that opens a
popover with:
- What this field does.
- Where to find the value (e.g. "Find your app_secret in the Feishu developer
  console under Credentials & Basic Info").
- A link to the full documentation.

### 13.2 No Diagnostic Mode for Users

**Current state.**
When something goes wrong, the user has no tool to collect diagnostic information.
They would need to know to look in `~/.jiuwenswarm/agent/.logs/`, which directory
the relevant log is in, and which log level to set.

**What good looks like.**
A `jiuwenswarm diagnostics` CLI command that:
- Collects the last 100 lines of each log file.
- Captures the config (with API keys redacted).
- Captures system info (OS, Python version, package versions).
- Writes a `jiuwenswarm-diagnostics-YYYY-MM-DD.txt` file.
- Prints: "Diagnostics saved. Share this file when reporting an issue."

### 13.3 Error Messages Do Not Reference Log Files

**Current state.**
When an error occurs, the user is not told where to look for more detail. They must
know that logs exist, where they are, and how to read them.

**What good looks like.**
Every error message that has more detail in the log should end with:
> "Full details in ~/.jiuwenswarm/agent/.logs/agent_server.log"

Or in the Web UI, a "Show log" button that opens a scrollable log panel filtered
to the current session and the last 60 seconds.

---

## §14 · Accessibility

*Can all users operate the product regardless of ability?*

### 14.1 No Keyboard Navigation Across the UI

**Current state.**
Tab focus traversal, arrow key navigation in lists, and keyboard activation of
buttons have not been verified. The React component library used (`shadcn/ui`,
`lucide-react`) supports accessibility, but it requires implementation discipline
in the consuming components.

**What good looks like.**
Every interactive element — session list items, skill cards, settings toggles,
tool call expand buttons — should be reachable and operable by keyboard. Focus
indicators should be visible. `ConversationSidebar` session items should support
arrow-key navigation.

### 14.2 No Screen Reader Support Audit

**Current state.**
No `aria-label`, `aria-live` regions for streaming content, or `role` attributes
are visible in the explored code. Streaming text in `StreamingContent.tsx` has no
`aria-live="polite"` region, so screen readers would not announce new content.

**What good looks like.**
- The streaming output area should be an `aria-live="polite"` region.
- Tool call status changes should announce via `aria-live="assertive"` when
  a tool succeeds or fails.
- All icon-only buttons should have `aria-label`.
- A one-time accessibility audit (axe-core, Lighthouse) to surface the full list.

### 14.3 No High-Contrast or Large-Text Mode

**Current state.**
The UI has a light/dark mode. No high-contrast theme, no font size controls, no
zoom-safe layout testing documented.

**What good looks like.**
Respect the OS `prefers-contrast: more` and `prefers-reduced-motion` media queries.
Use relative font units (`rem`) throughout so browser font size preferences apply.

---

## §15 · Mobile & Cross-Platform

*Using jiuwenswarm on a phone or tablet.*

### 15.1 Mobile Layout Exists But Is Not a First-Class Experience

**Current state.**
`useResponsive.ts` implements breakpoints and `isMobile` detection. The
`ConversationSidebar` collapses and floats on small screens. The `useResponsivePanelResize`
hook mutually excludes team and single-agent panels. Breakpoints at 1130px, 1000px,
and 800px are defined.

**What good looks like.**
Mobile should be treated as a real use case, not a fallback. The Feishu and Telegram
channels mean users are on mobile frequently. The Web UI should be fully usable on
a 375px viewport: input area docked to bottom, conversation fills viewport, panels
accessible via bottom sheet or drawer. The current panel architecture (left sidebar +
chat + right panel) collapses poorly to mobile.

### 15.2 No Native App (PWA) Support

**Current state.**
The Web UI is a standard React SPA. No `manifest.json`, no service worker, no
offline support, no install-to-homescreen capability.

**What good looks like.**
A Progressive Web App manifest that allows users to install jiuwenswarm to their
phone homescreen. Service worker for offline mode (read past conversations, queue
messages to send when reconnected). Push notification support for task completion.

---

## §16 · Information Architecture

*Is the right information in the right place?*

### 16.1 Skills and Connectors Are Separate But Conceptually Similar

**Current state.**
`SessionSidebar` has separate nav items for "Skills" and "Connector Market" (plugins,
MCP). These are conceptually similar — both extend agent capabilities — but are
presented as separate top-level sections.

**What good looks like.**
A unified "Capabilities" section: Skills, MCP servers, plugins, and browser tools
all in one place, filterable by type. A user adding a new capability should not need
to know which category it falls into first.

### 16.2 Settings Are Organized by Implementation, Not by User Task

**Current state.**
Settings modules: General, Models, Channels, Agent, Browser, Experimental. This is
organized by implementation component, not by what the user is trying to do.

**What good looks like.**
Organize by user goal:
- **Getting started** — model setup, language, first skill.
- **Communication channels** — Feishu, Telegram, Discord, etc.
- **Memory & context** — memory settings, coding memory, context length.
- **Agent behavior** — permissions, tools, mode defaults, response style.
- **Advanced** — observability, debug traces, experimental features.

### 16.3 Trajectory / Trace Panel Is Hidden and Unnamed

**Current state.**
The trajectory system (full LLM input/output/thinking trace per call) is inside the
right panel but requires knowing to look for it. The navigation item is labeled
"TraceHound" — a name that means nothing to a new user.

**What good looks like.**
Rename to "Agent activity" or "What happened". Surface it as a default sub-tab
in the right panel alongside artifacts, rather than a separate nav item.

---
