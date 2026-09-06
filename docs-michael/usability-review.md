# jiuwenswarm — Usability Review

This document covers usability findings across every dimension of the product,
organized by persona. Each top-level section belongs to one persona; readers can
go directly to their section without scanning the entire document. Findings that
affect multiple personas appear in full under the primary persona and are
summarized with pointers under secondary ones.

Finding IDs (e.g. **3.1**, **17.4**) are stable across document versions and used
in the prioritized backlog.

---

## Personas

The following personas interact with jiuwenswarm at different layers. Not all
have dedicated sections yet — they are listed here so that future findings can
be attributed correctly and so that gaps in coverage are explicit.

### Fully covered personas

| ID | Persona | Who they are | Section in this document |
|---|---|---|---|
| **P1** | **End-User** | The person chatting with the agent day to day — gives tasks, reads responses, judges whether the agent is useful | §P1 |
| **P2** | **Operator** | The person who installs, configures, deploys, and maintains the jiuwenswarm instance | §P2 |
| **P3** | **Extension Developer** | The engineer who extends jiuwenswarm from inside: writes custom rails, registers tools, works within the Python SDK | §P3 |
| **P4** | **Application Developer** | The engineer who builds their own product on top of jiuwenswarm as a backend: connects via E2A/WebSocket, builds a custom frontend or automation | §P4 |

### Partially covered personas

| ID | Persona | Who they are | Section in this document |
|---|---|---|---|
| **P5** | **Skill Author** | Creates skills to publish to the marketplace for others to install — writes `SKILL.md`, packages Python tools, tests and submits skills | §P5 (partial) |
| **P6** | **Team Admin** | Manages a shared jiuwenswarm instance on behalf of a team — sets per-user permissions, manages shared memory and skills, reviews activity | §P6 (partial) |

### Personas with no dedicated coverage yet

These personas are real, relevant, and will produce findings when investigated.
They are defined here so that future sections can be attributed to them.

| ID | Persona | Who they are | Key unmet needs |
|---|---|---|---|
| **P7** | **Auditor / Compliance Officer** | Reviews what the agent did, what data it accessed, what external calls it made — for legal, security, or regulatory purposes | Structured audit log, data lineage, PII report, export tools |
| **P8** | **Agent QA / Evaluator** | Tests agent quality: runs benchmark tasks, compares model responses across versions, measures task success rate, catches regressions | Golden-set eval, trajectory comparison, deterministic replay |
| **P9** | **Support / Help Desk** | Helps end-users when something goes wrong: looks up a session, replays what the agent did, diagnoses failures, resets user state | Session lookup by user, diagnostic replay, state reset |
| **P10** | **AI / Prompt Engineer** | Crafts and optimizes the system prompts, persona instructions, and skill descriptions that shape agent behavior — iterates on prompt text to improve output quality | Prompt testing sandbox, A/B comparison, version history for prompts, live prompt inspector |
| **P11** | **Security Researcher** | Tests the security posture of a jiuwenswarm deployment: prompt injection, permission bypass, authentication gaps, data leakage | Documented threat model, security config guide, test harness for attack patterns |
| **P12** | **Data Analyst** | Analyzes aggregate agent behavior: usage patterns, task success rates, most-used skills, failure modes — to inform product decisions | Structured telemetry export, usage dashboards, per-session metrics |

---

# P1 — End-User

*The person chatting with the agent day to day.*

This is the largest section because end-users are the primary audience for most
of jiuwenswarm's surface area. Operators, developers, and admins configure the
system; end-users experience everything that results from those choices.

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

> Also affects: **P2** (operators configure permission rules), **P6** (team admins
> manage per-user permissions). See the P2 and P6 sections for the operator/admin
> perspective on these findings.

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

> Also affects: **P2** (operators are responsible for reliability configuration).
> See §P2·§4 for the operator perspective.

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

> Also affects: **P2** (operators perform the installation and initial config).
> See §P2·§5 for the operator-side first-run findings.

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

> Also affects: **P7** (Auditor needs structured activity logs), **P9** (Support
> needs session replay). These personas are not yet fully covered — findings here
> are written from the end-user perspective but will gain dedicated sections when
> P7/P9 investigation is complete.

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

> Also affects: **P4** (application developers need webhook events for async
> task completion). See §P4·§8 for the developer perspective.

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

> Also affects: **P2** (operators set retention policies), **P7** (Auditors need
> data lineage). See §P2·§12 for the operator perspective.

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

> Also affects: **P2** (operators need diagnostic tools), **P9** (Support staff
> need session lookup). See §P2·§13 for the operator/support perspective.

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

> Also affects: **P2** (operators navigate the same settings panels). See §P2·§16
> for the operator perspective on settings organization.

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

# P2 — Operator

*The person installing, configuring, deploying, and maintaining the system.*

---

## §2 · Operator Configuration & Setup

*Installation, configuration, and day-to-day system management.*

### 2.1 No Startup Validation — Failures Surface on First Use

**Current state.**
Model credentials are never checked at startup. `jiuwenswarm-init` completes, the
user runs `jiuwenswarm-start`, the web UI loads — and the first failure is on the
first chat message. Same for channels: a wrong `app_secret` or `bot_token` silently
fails to initialize. The operator discovers this when a user reports that Feishu/
Telegram is not responding.

`jiuwenswarm/common/config.py:257`, `channel_manager.py:52`

**What good looks like.**
A startup health check that runs before the first request is served:
1. Validate model config (send a minimal test request, check HTTP 200).
2. Validate each enabled channel (check token format, optionally make a test API
   call to the platform's auth endpoint).
3. Validate workspace directory permissions (write a temp file, delete it).
4. Check optional dependencies (SSH, TUI) and warn if referenced but not installed.

Print a health report to stdout on startup:

```
jiuwenswarm health check
  ✓ Model: deepseek-v4-flash (latency 320ms)
  ✓ Memory: enabled, workspace /home/mishka/.jiuwenswarm/
  ✗ Feishu: app_secret missing — channel disabled
  ✓ Telegram: connected (@my_bot)
  ⚠ OTel: endpoint unreachable — traces will be written to file
```

### 2.2 Config File Is 1709 Lines With No Validation Tool

**Current state.**
`jiuwenswarm/resources/config.yaml` contains models, memory, channels, permissions,
observability, browser runtime, SSH, team agents, and debug traces in a single file.
There is no tool to check whether an edited copy is correct before running. Env var
substitution uses `${VAR:-default}` syntax, which is undocumented at the point of
use. Crypto provider failures fall back silently:

```python
# common/config.py:84
logger.debug("Crypto provider unavailable while resolving env var %s; using raw value", ...)
```

**What good looks like.**
- A `jiuwenswarm config check` CLI command that validates the config file against a
  JSON Schema and prints every error with the line number and a fix suggestion.
- A config version field (`jiuwenswarm_config_version: 3`) so the validator can
  detect stale configs from older versions.
- Env var substitution failures logged at `WARNING` level minimum.
- The Web UI settings panels (`features/settings/modules/`) should be the primary
  config interface for operators who are not comfortable editing YAML — and every
  field in the YAML should have a corresponding Web UI field.

### 2.3 Powerful Features Are Invisible by Default

**Current state.**
The following features exist and are useful but are disabled by default with no
hint they exist anywhere in the UI or startup output:

| Feature | Config key | What it does |
|---|---|---|
| Trajectory UI | `trajectory_ui.enabled` | Web dashboard for multi-agent traces |
| OTel tracing | `team_observability.enabled` | Distributed tracing for agent/tool spans |
| Agent debug trace | `debug_trace.agent.enabled` | Full per-request context + tool result dump |
| Coding memory | `memory.coding_memory` | Persistent code-specific memory |
| SSH channel | `channels.ssh` | Terminal tunneling into the agent |

`config.yaml:442–574`

**What good looks like.**
A "Feature Discovery" section in the Web UI settings — a curated list of opt-in
features with a one-paragraph description and a toggle. The first time `jiuwenswarm-start`
runs, the startup output should mention: "Tip: trajectory UI is available. Enable it
with `trajectory_ui.enabled: true` in config."

### 2.4 Onboarding Ends Before the Hard Part

**Current state.**
`ModelSetupGuide.tsx` implements a 3-step spotlight tour: welcome → settings icon
spotlight → models module spotlight. Step 3 ends at the models panel. The user must
then figure out how to fill in the API key, API base, and model name themselves —
and if they fill it in wrong, there is no inline validation until they send a chat.

`features/modelSetupGuide/ModelSetupGuide.tsx`

**What good looks like.**
The setup guide should not end until the model is working:
1. Welcome.
2. Choose your model provider from a dropdown (OpenAI, DeepSeek, Anthropic, Azure,
   Huawei MaaS, Custom…).
3. Enter API key. A "Test" button sends a real request and shows ✓ / ✗ inline.
4. On success: "Your agent is ready. Want to enable a communication channel?"
5. Optional: channel setup with the same test-and-confirm pattern.
6. Final screen: "Start your first conversation →"

The guide should be re-enterable at any time from the `?` icon, not just on first run.

### 2.5 Instance and Port Management Is Confusing

**Current state.**
- Default instance lives in `~/.jiuwenswarm/`; named instances in
  `~/.jiuwenswarm/instances/{name}/` — different directory layouts, different PID
  file paths, inconsistent env var behavior.
- Port scan range is hardcoded to 20 candidates; if all are busy the system falls
  back to a conflicting port silently.
- After `jiuwenswarm-start --name alice`, there is no output listing what ports
  were assigned, what URL to open, what is running.

**What good looks like.**
```
$ jiuwenswarm-start
Starting jiuwenswarm (default)...
  Agent server:  http://localhost:8942
  Gateway:       http://localhost:8943
  Web UI:        http://localhost:5173

All services ready in 3.2s. Opening browser...
```
Port conflicts should be detected proactively with an actionable message:
```
Port 8942 is already in use by another process (PID 14821).
Run: jiuwenswarm-stop   to stop the existing instance, or
     jiuwenswarm-start --port 9000   to use a different base port.
```

### 2.6 Permission System Has No GUI and No Testing Tool

**Current state.**
The tiered permission policy (`config.yaml:1129–1286`) uses a complex rule syntax
with regex support. There is no Web UI to create, edit, or test rules. The
`PermissionWarningDialog.tsx` only shows a generic "full access warning" — it does
not explain which specific rules are active or what they permit.

**What good looks like.**
A permissions panel in Web UI settings that shows:
- A list of active rules, each with: tool pattern, allowed/denied, who it applies to.
- An inline rule editor with pattern validation (highlight invalid regex).
- A "Test" field: enter a tool name and see which rule it matches and what the
  outcome is.
- A "What can the agent do?" summary in plain language: "Agent can read and write
  files in /home/mishka/invoices/. Agent cannot run bash. Agent can send Feishu
  messages."

### 2.7 Optional Dependencies Fail at Runtime, Not Install Time

**Current state.**
SSH channel requires `pip install "jiuwenswarm[ssh]"`. TUI requires
`pip install jiuwenswarm-tui`. Neither is checked at startup. The error appears
only when the operator enables the feature.

**What good looks like.**
`jiuwenswarm-start` should check all optional dependencies referenced in the config
and warn at startup:
```
⚠ SSH channel is enabled in config but 'jiuwenswarm[ssh]' is not installed.
  Install with: pip install "jiuwenswarm[ssh]"
  SSH channel will be disabled until installed.
```

### 2.8 Documentation Is Scattered and Hard to Navigate

**Current state.**
Documentation lives in three places: inline YAML comments (must open 1709-line
config to read), Markdown docs in `/docs/` (must know they exist), and skill
`SKILL.md` files (designed as agent prompts, not operator reference). There is no
centralized guide for the three most common operator tasks: add a channel, debug a
failing task, create a skill.

**What good looks like.**
- An integrated help panel in the Web UI settings — each settings module has a
  collapsible "Help" section with the documentation for that module.
- The `/docs/` directory should have a `quickstart.md` that covers: install →
  configure model → start → first task → add a channel → create a skill. All in
  one file.
- `config.yaml` should reference doc links for complex sections:
  ```yaml
  # See: https://docs.jiuwenswarm.io/channels/feishu for setup guide
  channels:
    feishu: ...
  ```

### 2.9 Upgrade Experience Is Undefined

**Current state.**
`pip install --upgrade jiuwenswarm` — what happens to `~/.jiuwenswarm/config/
config.yaml`? There is no config version field, no migration system, no changelog
that flags breaking config changes, and no validation of whether an existing config
is compatible with the new version.

**What good looks like.**
- A `jiuwenswarm_config_version: 4` field in config.yaml.
- On startup, if the config version is older than the binary expects, print a
  migration guide or run automatic migration with a backup:
  ```
  Config migration: v3 → v4
  Backed up config to ~/.jiuwenswarm/config/config.yaml.bak
  Added new required field: memory.coding_memory.enabled = false
  ```
- A `CHANGELOG.md` section specifically for config-breaking changes.

### 2.10 Internationalization Is Inconsistent

**Current state.**
Some error messages, log strings, and config comments are in Chinese; others are in
English. An operator reading logs cannot predict which language the system will use.
Runtime log lines mix both languages. Config.yaml section comments are mixed:
Chinese narrative comments beside English error messages.

**What good looks like.**
All operator-facing log messages (WARNING and above), CLI output, and error messages
should be in English unconditionally. User-facing chat responses should respect the
`preferred_response_language` setting. Config comments should be available in both
languages, ideally as separate config templates: `config.zh.yaml`, `config.en.yaml`.

---

## §4 · Reliability (Operator Perspective)

*(Full findings → P1 chapter, §4)*

Findings 4.1–4.4 are written from the user experience perspective but affect
operators who are responsible for the reliability of the deployment:

- **4.1** Graceful Degradation Is Silent — operators should receive the same
  health indicator in the startup log and a persistent alert channel (not just
  the Web UI dot) when subsystems degrade.
- **4.2** Session Recovery After Disconnect — operators need to understand the
  server-side behavior: does the agent process continue after a WebSocket drop,
  and how is state persisted?
- **4.4** No Persistent State for In-Progress Tasks — the checkpoint system
  should write to a configurable durable store, not just local disk.

---

## §5 · Onboarding (Operator Perspective)

*(Full findings → P1 chapter, §5)*

Finding 5.1 (setup wizard) and 5.4 (CLI first-run) directly affect operators
who perform the installation. The model credential testing (5.1 step 3) is an
operator task. Finding 2.4 in the §P2 Operator Configuration section covers the
same wizard from the operator's configuration angle.

---

## §9 · Economic UX

*Token consumption, API costs, and resource awareness.*

> Also affects: **P1** (end-users see their own token usage), **P12** (Data
> Analysts need aggregate telemetry). The user-facing token counter (9.1) is
> described here; P12 aggregate analytics is not yet covered.

### 9.1 No Token or Cost Visibility

**Current state.**
Users have no visibility into how many tokens each conversation is consuming.
For sessions with large memory snapshots, many installed skills, long conversation
history, and multiple subagents, the context can exceed 30K tokens per call. No
per-session counter, no cost estimate, no warning before hitting the model's limit.

**What good looks like.**
- A token counter in the chat panel showing total tokens used in the current
  session (both input and output).
- A per-message token annotation (collapsed by default, expandable on the message).
- A cost estimate based on the configured model's pricing (configurable per model
  in settings: `price_per_1k_input_tokens`, `price_per_1k_output_tokens`).
- A session summary card at conversation end: "This session used 48,320 tokens
  (~$0.14 at current rates)."

### 9.2 No Optimization Hints

**Current state.**
If a session's context is growing large, there is no guidance on how to reduce it.
Users who hit context limits do not know whether the cause is a large memory
snapshot, many installed skills, or a long conversation.

**What good looks like.**
When the token count crosses 70%, show a breakdown: "Your context: conversation
history 40%, memory snapshot 35%, skills 15%, system 10%." Each item has a link
to the relevant setting: "Reduce memory snapshot size →", "Use auto_list mode for
skills →".

---

## §10 · Skill Ecosystem (Operator Perspective)

*Discovering, installing, and managing skills across the instance.*

> Also affects: **P1** (end-users discover and use skills), **P5** (Skill Authors
> create and publish skills). End-user skill discovery is covered here; skill
> authoring is in the P5 section.

### 10.1 Skill Marketplace Has No Quality Signals

**Current state.**
`MarketplacePage.tsx` shows skill cards with logo, name, status, and install button.
There are no ratings, no usage counts, no author reputation, no reviews, no "last
updated" date. Users cannot assess quality before installing.

**What good looks like.**
Each skill card should show:
- Star rating (1–5) from community or internal team.
- Number of installs.
- Last updated date.
- Author verified badge (if published by the jiuwenswarm team).
- A one-paragraph description and a "Preview" that shows the SKILL.md content.

### 10.2 No Skill Dependency Management

**Current state.**
Skills can have Python `requirements.txt`. These are presumably installed at skill
load time, but there is no UI showing which skills have dependencies, whether they
are installed, or whether two skills conflict.

**What good looks like.**
A dependency panel per skill showing: required packages, installed status, version
conflicts with other installed skills. A "Install dependencies" button that runs in
the background with a progress indicator.

### 10.3 No Skill Version Management or Rollback

**Current state.**
When a skill is updated — manually or via the evolution system — the previous
version is not retained. If an updated skill breaks, the user must manually
reconstruct the old `SKILL.md`.

**What good looks like.**
Git-style version history per skill: each save creates a version record. The skill
panel shows: "Current: v1.3 (saved 2h ago). Previous: v1.2, v1.1." One-click
rollback to any previous version. If the evolution system modifies a skill, the
change is shown as a diff for user approval before being committed.

### 10.4 Skill Testing Has No Infrastructure

**Current state.**
There is no way to test a skill with sample input from the UI before deploying it
to live use. The user must trigger the skill through a real chat session.

**What good looks like.**
A "Test run" panel in the skill detail view: paste a sample input, click Run, see
the output. This is the skill equivalent of a unit test. The trajectory panel already
captures this data — wiring it to a skill test UI is achievable.

---

## §12 · Data & Privacy (Operator Perspective)

*(Full findings → P1 chapter, §12)*

- **12.3** No Data Retention Policy UI — operators set the retention policy for
  the whole instance. The settings panel described in 12.3 should distinguish
  between instance-wide defaults (set by operator in config) and per-user
  preferences (set by user in Web UI). Currently neither exists.

---

## §13 · Help & Support (Operator Perspective)

*(Full findings → P1 chapter, §13)*

- **13.2** No Diagnostic Mode — the `jiuwenswarm diagnostics` command is
  primarily an operator tool, used when supporting an end-user who reports a
  problem.
- **13.3** Error Messages Do Not Reference Log Files — especially important for
  operators who monitor the system and need to correlate Web UI errors with
  server-side log entries.

---

## §16 · Information Architecture (Operator Perspective)

*(Full findings → P1 chapter, §16)*

- **16.2** Settings Are Organized by Implementation, Not by User Task — this
  affects operators who configure the system via the Web UI settings panels.
  The goal-oriented reorganization proposed in 16.2 would reduce the time an
  operator spends hunting for the right settings panel.

---

# P3 — Extension Developer

*The engineer extending jiuwenswarm from inside: writing custom rails, registering
tools, working within the Python SDK.*

This audience is distinct from the operator (who installs and runs jiuwenswarm) and
from the end-user (who chats with the agent). The extension developer writes Python
code that participates in the agent lifecycle — adding new rails, registering tools,
composing custom agents, and integrating jiuwenswarm into their own product. This
section evaluates how well jiuwenswarm supports that experience.

> Also relevant: **P10 (AI / Prompt Engineer)** works with the prompt section API
> (17.9) and the examples directory (17.6). P10 coverage will expand in a future
> dedicated section.

---

## §17 · Developer Usability

### 17.1 Rail Extension API Is Undocumented at the Public Surface

**Current state.**
The rail system is the primary extension point for developers. The base class hierarchy is:

```
AgentRail  (openjiuwen/core/single_agent/rail/base.py)
  └── DeepAgentRail  (openjiuwen/harness/rails/base.py)
```

`AgentRail` exposes 10 hook methods. `DeepAgentRail` adds 2 more task-loop hooks. A developer
must read both source files to know what hooks exist and what `ctx: AgentCallbackContext`
contains. There is no public reference page, no generated API docs, no README in
`openjiuwen/harness/rails/` explaining what a rail is. The only written description lives in
Chinese-language docs in `agent-core/docs/zh/`.

**What good looks like.**
A `RAILS.md` file at the root of `agent-core` (or a `docs/en/rails.md`) explaining:
- What a rail is and when to write one.
- The full hook lifecycle, in order of execution, with a timing diagram showing when each
  hook fires relative to the model call and tool call.
- A minimal working example that developers can paste and run.
- Common patterns: adding a prompt section, registering a tool, reading the callback context.

The `DeepAgentRail` docstring should list all 12 hooks, not just the 2 it adds. Right now a
developer reading only `DeepAgentRail` does not know the 10 `AgentRail` hooks exist.

---

### 17.2 Hook Execution Order Is Not Discoverable

**Current state.**
Twelve hooks exist across two base classes. A developer writing a rail that interacts with
model input and tool output needs to know: does `before_model_call` fire before or after the
prompt is assembled? Does `after_tool_call` receive the result before or after it is appended
to conversation history?

None of this is documented. The answers require reading the agent execution loop in
`openjiuwen/core/single_agent/agent.py` — which is not a short file.

There is also a `priority` integer on each rail. Higher priority runs first during `init()` and
callback dispatch. But whether `priority=85` runs before or after `priority=50` is not stated
anywhere except "higher runs first" — inferred from reading the test:

```python
# tests/unit_tests/core/single_agent/rail/test_rail.py
class HighPriorityRail(AgentRail):
    priority = 100
class LowPriorityRail(AgentRail):
    priority = 1
```

**What good looks like.**
A lifecycle diagram (ASCII is fine) showing the agent execution loop with arrows at each hook
point. Approximate:

```
agent.invoke(query)
  │
  ├── before_invoke
  │
  ├── on_user_message
  │
  └─[task loop]──────────────────────────────────────────────────────────
      │
      ├── before_task_iteration
      │
      ├── before_steering_drain
      │
      ├── before_model_call          ← prompt is final here
      │
      │   [LLM call]
      │
      ├── after_model_call           ← raw LLM response here
      │
      ├─[for each tool call]──────────────────────────────────────────────
      │   ├── before_tool_call       ← args are final here
      │   │   [tool execution]
      │   └── after_tool_call        ← result is here, not yet in history
      │
      └── after_task_iteration
      │
  ├── after_invoke
  └── [end]
```

This takes under an hour to write and saves every new developer from reading the agent loop.

---

### 17.3 `AgentCallbackContext` Has No Type Stubs or Usage Examples

**Current state.**
Every hook receives `ctx: AgentCallbackContext`. This object carries the current agent state:
conversation history, tool call results, the current model response, session ID, and more.
A developer writing a hook must discover what is accessible on `ctx` by reading the dataclass
definition — there are no examples showing `ctx.messages`, `ctx.tool_result`, or
`ctx.response` in the context of a hook.

Additionally, `ctx` mutability is implicit: some fields are read-only (reading them does not
affect the agent), others are writable (modifying them does affect the next step). This
distinction is never stated.

**What good looks like.**
A "Context reference" section in the developer docs listing every attribute of
`AgentCallbackContext`, its type, whether it is mutable, and which hooks it is populated in.
Example snippet:

| Attribute | Type | Mutable | Available from |
|---|---|---|---|
| `ctx.session_id` | `str` | No | `before_invoke` |
| `ctx.messages` | `list[Message]` | Yes | `before_model_call` |
| `ctx.response` | `ModelResponse` | No | `after_model_call` |
| `ctx.tool_call` | `ToolCall` | No | `before_tool_call` |
| `ctx.tool_result` | `ToolResult` | Yes | `after_tool_call` |

Until this table exists, every developer who writes a `before_model_call` hook has to guess
whether `ctx.messages` reflects the assembled prompt or the raw conversation history.

---

### 17.4 Tool Registration API Has No Developer Guide

**Current state.**
Tools are registered in a rail's `init()` method via `agent.ability_manager.add(tool_card)`.
This requires the developer to know:

1. That `ability_manager` exists on the agent object.
2. That it has an `add()` method accepting `ToolCard`.
3. That cleanup requires `agent.ability_manager.remove(tool_id)` in `uninit()`.
4. That `ToolCard.input_params` must be a JSON Schema dict (not a Pydantic model, not a
   function signature).

None of this appears in any public documentation. The only source of truth is the test file:

```python
# tests/unit_tests/core/single_agent/rail/test_rail.py
class ToolCarryingRail(AgentRail):
    def init(self, agent):
        tool_card = ToolCard(
            id="rail_tool",
            name="rail_tool",
            description="A rail tool",
            input_params={"type": "object", "properties": {}},
        )
        agent.ability_manager.add(tool_card)

    def uninit(self, agent):
        agent.ability_manager.remove("rail_tool")
```

A developer who does not know to look in the test directory will not find this pattern.

**What good looks like.**
A "Adding a tool from a rail" guide, showing the complete pattern: `ToolCard` definition with
a real JSON Schema, registration in `init()`, deregistration in `uninit()`, and how to handle
the tool's execution (where does the tool's Python function connect to the `ToolCard`?).

The relationship between `ToolCard` (metadata) and `LocalFunction` (implementation) is the
most confusing part for new developers — one provides the schema the LLM sees, the other
provides the Python that runs. This needs a diagram or a working end-to-end example.

---

### 17.5 `create_deep_agent()` Has Too Many Parameters With No Defaults Explained

**Current state.**
The primary factory function for creating an agent programmatically is `create_deep_agent()`.
It accepts 15+ parameters including `model`, `card`, `system_prompt`, `enable_task_loop`,
`max_iterations`, `rails`, `tools`, `mcps`, `skills`, `subagents`, `workspace`,
`sys_operation`, and more.

There is no documentation explaining:
- Which parameters are required vs optional.
- What the minimum viable invocation looks like.
- What `sys_operation` is and when a developer needs it.
- What `workspace` is and how it relates to `~/.jiuwenswarm/`.
- The difference between passing `tools` here vs registering tools in a rail.

A developer starting from the quickstart example in
`examples/context_evolver/quickstart_rail.py` gets a working snippet, but that example
hardcodes model credentials from env vars and omits half the parameters without explanation.

**What good looks like.**
A tiered guide: minimum invocation (5 lines), intermediate (add workspace and rails), advanced
(add subagents and sys_operation). Each tier shows the code and explains what each new
parameter enables. The docstring on `create_deep_agent()` should include all of this inline.

---

### 17.6 Examples Directory Is Not Discoverable and Inconsistently Structured

**Current state.**
Working examples live in `agent-core/examples/`. This directory contains:

```
examples/
  context_evolver/            # ContextEvolutionRail usage
  security_rail_demo/
    SensitiveDataSanitize/    # Custom rail: mask secrets
    ApiKeyGuardAlert/         # Custom rail: detect API keys
    ModelCallGuard/           # Custom rail: guard model calls
  # … more
```

Issues:
- `README.md` at the root of `examples/` does not exist — there is no index of what each
  example demonstrates.
- The security rail examples use `BaseSecurityRail` (a jiuwenswarm-specific subclass), not
  `DeepAgentRail` — confusing for a developer who just learned about `DeepAgentRail`.
- `context_evolver/quickstart_rail.py` imports `memory_service` from a module that requires
  a running database — not runnable without significant setup.
- No example demonstrates the simplest case: a rail that adds one line to the system prompt.

**What good looks like.**
An `examples/README.md` listing all examples with:
- What the example demonstrates.
- Prerequisites (what needs to be running, what env vars are needed).
- Expected output.

A `examples/00_hello_rail/` directory with the simplest possible working rail — one file, no
external dependencies, outputs "My rail ran" to the console. This is the "Hello World" that
every developer needs but currently does not exist.

---

### 17.7 Testing a Custom Rail Requires Knowing About Mock Infrastructure

**Current state.**
The testing infrastructure for rails is excellent — `MockLLMModel`, `create_text_response()`,
`create_tool_call_response()` — but it is entirely undocumented and lives in:

```
tests/unit_tests/fixtures/mock_llm.py
```

A developer who writes a custom rail and wants to test it has no path to discover this
infrastructure except reading the test source. There is no `testing/README.md`, no
"Testing your rail" section in any guide.

The pattern for writing a rail test is:

```python
class TestMyRail(unittest.IsolatedAsyncioTestCase):
    async def test_my_rail(self):
        agent, _ = _make_agent()          # Where is _make_agent() defined?
        await agent.register_rail(MyRail())
        mock_llm = MockLLMModel()         # Not importable without knowing the path
        mock_llm.set_responses([create_text_response("done")])
        with patch.object(agent, "_get_llm", return_value=mock_llm):
            result = await agent.invoke({"query": "test"})
        assert result["result_type"] == "answer"
```

`_make_agent()` is a private helper in the test file itself. `MockLLMModel` requires a direct
import from an internal path. Neither is part of a public test helper package.

**What good looks like.**
A `openjiuwen.testing` module that exports:
```python
from openjiuwen.testing import make_test_agent, MockLLMModel, text_response, tool_call_response
```

And a "Testing your rail" guide that shows the above pattern using these public imports. A
developer should be able to write a test for their custom rail in under 20 lines without reading
the internal test infrastructure.

---

### 17.8 No Stable Public API / No Semver Contract

**Current state.**
`agent-core` is at version `0.1.17`. `jiuwenswarm` (`workswarm`) is at `0.2.5.beta1`. The
`0.x` prefix signals pre-stable, which in practice means: any import path can change between
releases without a deprecation warning, and any internal class a developer subclasses may be
moved or renamed.

In practice, `jiuwenswarm` imports `agent-core` from a git SHA:
```toml
openjiuwen @ git+https://gitcode.com/openJiuwen/agent-core.git@...
```

A developer building on top of this system has no version guarantee. If they pin to a SHA,
they get no bug fixes. If they don't pin, any update may break their rail.

**What good looks like.**
- A documented `PUBLIC_API.md` listing which classes, functions, and modules are stable
  public API and which are implementation details subject to change.
- A `CHANGELOG.md` with a dedicated "Breaking changes for rail developers" section.
- Semantic versioning with proper minor/patch discipline once the API is declared stable.
- `@public` / `@internal` markers in docstrings for the transitional period.

---

### 17.9 Prompt Section API for Rails Is Hidden

**Current state.**
Rails inject content into the LLM system prompt by calling `add_section()` or
`add_from_prompt_section()` on a system prompt builder. This is one of the most common things
a developer would want a custom rail to do — "add my custom instructions to the prompt" — but
the API for doing it is not documented anywhere outside the source code.

The pattern requires knowing:
1. That `self.system_prompt_builder` can be obtained from `agent` in `init()`.
2. That sections have a `PromptPriority` or raw integer priority.
3. That `add_section(SectionName, text)` is the right method.
4. That the priority number determines insertion order in the system prompt.

This is the core developer extension use case and it has zero written documentation.

**What good looks like.**
A "Adding prompt content from a rail" guide:

```python
class MyContextRail(DeepAgentRail):
    def init(self, agent):
        self.prompt_builder = getattr(agent, "system_prompt_builder", None)

    async def before_model_call(self, ctx):
        if self.prompt_builder is None:
            return
        self.prompt_builder.add_section(
            name="MY_CUSTOM_CONTEXT",    # unique section name
            content="Always respond in bullet points.",
            priority=75,                 # inserts between priority 70 and 85 sections
        )
```

And a reference table of reserved priority ranges so developers know which slots are safe to
use for custom content without colliding with built-in sections.

---

### 17.10 No CLI Tool to Scaffold a New Rail or Skill

**Current state.**
Creating a new rail requires: creating a Python file, writing the class boilerplate, choosing
a priority, writing a registration call, and figuring out how to wire it in. There is no
`openjiuwen new-rail MyRailName` command. There is no cookiecutter template. There is no
`examples/template_rail/` directory to copy from.

The `openjiuwen` CLI command exists (`pyproject.toml` registers `openjiuwen = "openjiuwen.harness.cli.cli:cli"`),
but its subcommands are not documented externally.

**What good looks like.**
```
$ openjiuwen new rail --name my-context-rail --priority 75
Created: rails/my_context_rail.py
Created: tests/test_my_context_rail.py

rails/my_context_rail.py contains a minimal DeepAgentRail subclass.
tests/test_my_context_rail.py contains a working test using openjiuwen.testing.
```

A scaffolding command eliminates the cold-start friction for every new developer. The
generated files serve as a living example of the correct patterns.

---

### 17.11 Error Framework Is Not Exposed as a Developer API

**Current state.**
The error framework (`openjiuwen/core/common/exception/errors.py`) is well-designed:

```python
class BaseError(Exception):
    status: StatusCode
    recoverable: bool
    fatal: bool

    def to_dict(self) -> Dict[str, Any]: ...
    def to_json(self) -> str: ...
```

Helper functions exist: `build_error()`, `raise_error()`, `system_error()`, `validate_error()`.

A developer writing a custom rail that encounters an error has two options: raise a plain
Python exception (loses the structured error metadata) or use the framework (requires
discovering it). The framework is not mentioned in any developer-facing documentation.

If a rail raises a plain `RuntimeError`, the harness catches it but the structured error
context (`recoverable`, `fatal`, `code`) is lost, affecting how the agent decides to retry
or surface the error to the user.

**What good looks like.**
Document the error framework as part of the rail developer guide:

```python
from openjiuwen.core.common.exception import raise_error, StatusCode

async def before_tool_call(self, ctx):
    if self._is_blocked(ctx.tool_call.name):
        raise_error(
            StatusCode.PERMISSION_DENIED,
            f"Tool '{ctx.tool_call.name}' is blocked by MyRail",
            recoverable=False,
        )
```

Show that `recoverable=True` causes the agent to retry; `recoverable=False` aborts the task.
This is the correct API for rail authors to signal intent — but nobody knows it exists.

---

### 17.12 No Integration Test Layer Between Unit Tests and Full System

**Current state.**
The test suite has unit tests (mocked LLM, isolated rails) and manual end-to-end tests (full
system running). There is nothing in between: a test that runs a real rail against a real
(but small and controlled) agent without standing up the full jiuwenswarm stack.

A developer who writes a rail that interacts with the prompt builder, registers a tool, and
reads tool results needs to test all three interactions together — but the only way to do this
is the full unit test with `MockLLMModel`, which requires carefully sequencing mock responses
to exercise the rail in all three states. A single wrong mock response order causes the test
to pass for the wrong reason.

**What good looks like.**
An integration test helper:

```python
from openjiuwen.testing.integration import run_agent_with_rail

result = await run_agent_with_rail(
    rail=MyRail(),
    query="do the thing",
    llm_responses=["First I will call my_tool", tool_call("my_tool", {}), "Done."],
)
assert result.tool_calls[0].name == "my_tool"
assert "Done" in result.final_answer
```

This higher-level helper hides the mock sequencing complexity and lets the developer focus on
testing their rail's behavior, not the test framework mechanics.

---

### Summary: Developer Usability at a Glance

The rail and tool extension system is architecturally sound — the hook model, priority system,
and tool registration are clean and well-implemented. The gap is entirely in the developer
surface: documentation, discoverability, and tooling. A developer who reads the source code
can figure it out. A developer who relies on documentation cannot start.

**The five developer-facing changes with the highest impact:**

1. **Write `RAILS.md`** — lifecycle diagram, hook reference, `AgentCallbackContext` attribute
   table, full working example. Single document, one day to write, unlocks every developer.

2. **Create `openjiuwen.testing` as a public module** — `make_test_agent()`,
   `MockLLMModel`, `text_response()`, `tool_call_response()` exported from a stable path.
   Developers should not have to read internal test infrastructure to write their first test.

3. **Add `openjiuwen new rail` scaffold command** — generates a rail file and a test file
   from templates. Eliminates cold-start friction.

4. **Document prompt section insertion API** — the most common developer use case (add
   custom instructions to the system prompt) has zero documentation. One guide page fixes this.

5. **Publish a `PUBLIC_API.md`** — list which classes are stable API. Developers cannot
   build with confidence on a codebase where any class can move or be renamed without notice.

---

# P4 — Application Developer

*The engineer building their own product, app, or service on top of jiuwenswarm as a backend.*

This audience is distinct from the extension developer in §P3 (who works inside the jiuwenswarm
codebase, writing rails and tools). The application developer treats jiuwenswarm as a black
box: they stand it up, connect to it over a network, and build their own frontend, workflow,
or integration on top of it. Their only contact with jiuwenswarm is the external API it
exposes.

---

## §8 · Async Notifications (Application Developer Perspective)

*(Full findings → P1 chapter, §8)*

Finding 8.1 (task completion notification) is especially important for application
developers building automation workflows: the current in-browser notification
approach doesn't serve server-side consumers. The webhook system described in **18.8**
is the right solution for P4 — see §18.8 below.

---

## §18 · Application Developer Usability

### 18.1 The Primary API Is WebSocket-Only — No REST Fallback

**Current state.**
jiuwenswarm's external interface is the E2A (Everything-to-Agent) protocol, carried over
WebSocket. There is no HTTP REST API. Every operation — sending a chat message, listing
sessions, fetching history, uploading a file — requires a persistent WebSocket connection
and the E2A envelope format:

```json
{
  "protocol_version": "1.0",
  "request_id": "abc123",
  "session_id": "sess_xyz",
  "method": "chat.send",
  "params": { "content": "Parse this invoice" },
  "channel": "web",
  "user_id": "user_001",
  "timestamp": "2026-09-06T10:00:00Z",
  "is_stream": true
}
```

For an application developer whose stack is REST-native (mobile app, server-side script,
simple automation), this is a barrier. Maintaining a WebSocket connection requires async
infrastructure, reconnection logic, and stream multiplexing. A one-shot "send a message
and wait for reply" use case requires the same WebSocket machinery as a real-time chat UI.

**What good looks like.**
A thin HTTP REST wrapper that covers the most common single-shot use cases:

```
POST /api/chat     { session_id, message }  → { response_text, session_id }
GET  /api/sessions                          → [ { id, name, updated_at } ]
GET  /api/sessions/:id/history              → [ { role, content, timestamp } ]
```

The WebSocket API remains for streaming and real-time use. The REST API is a convenience
layer for integrations that don't need streaming. Under the hood, the gateway translates
REST requests into E2A envelopes and returns the final response.

---

### 18.2 E2A Protocol Is Documented in Markdown, Not in a Machine-Readable Format

**Current state.**
The E2A protocol specification lives in two Markdown files:
- `docs/en/E2A-protocol.md`
- `docs/zh/E2A-protocol.md`

These describe the envelope fields and method names in prose. There is no:
- JSON Schema for the `E2AEnvelope` or `E2AResponse` structures
- OpenAPI/AsyncAPI specification
- Generated type stubs (`e2a.d.ts`, `e2a.pyi`)
- Protobuf or MessagePack schema

An application developer implementing an E2A client must manually read the Markdown doc,
then cross-reference the actual dataclass in `jiuwenswarm/common/e2a/models.py` to get the
true field names and types. When the protocol changes, there is no version diff or
structured changelog for the envelope format.

The `ReqMethod` enum (all valid method names like `chat.send`, `session.create`, etc.) is
defined in `jiuwenswarm/common/e2a/constants.py` — source code only, not surfaced anywhere
for consumers.

**What good looks like.**
An AsyncAPI 3.0 specification file (`docs/api/e2a-asyncapi.yaml`) that fully describes:
- All WebSocket message schemas (request and response)
- All method names with their params and response shapes
- Error codes and their meanings
- The streaming response protocol (how chunks relate to a single request)

This file can be used to auto-generate client SDKs in any language via AsyncAPI generators.
It is also the ground truth that prevents spec-code drift.

---

### 18.3 No Published Client SDK — Every App Reimplements the Protocol

**Current state.**
A `WebSocketAgentServerClient` class exists in:
```
jiuwenswarm/gateway/routing/agent_client.py
```

It is the internal client the gateway uses to talk to the agent server. It handles envelope
serialization, response deserialization, and streaming chunking. But it is:
- An internal class, not exported as a public package
- Written for gateway-to-agentserver communication, not for external-app-to-gateway
- Not documented, not versioned, not published to PyPI

An external Python developer must either copy this class into their project (fragile) or
implement E2A from scratch (duplicated effort). A JavaScript/TypeScript developer has no
reference implementation at all — only the Markdown spec and the web frontend's ad-hoc
WebSocket usage in `hooks/useWebSocket.ts`.

**What good looks like.**
A published `jiuwenswarm-client` package on PyPI:

```python
from jiuwenswarm_client import JiuwenswarmClient, ChatSession

client = JiuwenswarmClient("ws://localhost:19000/ws")
session = await client.session.create(name="my task")

async for chunk in session.chat("Parse this invoice"):
    print(chunk.text, end="", flush=True)
```

And a TypeScript/JavaScript equivalent (`@jiuwenswarm/client` on npm):

```typescript
import { JiuwenswarmClient } from "@jiuwenswarm/client";

const client = new JiuwenswarmClient("ws://localhost:19000/ws");
const session = await client.sessions.create({ name: "my task" });

for await (const chunk of session.chat("Parse this invoice")) {
  process.stdout.write(chunk.text);
}
```

Both packages generated from the AsyncAPI spec (see 18.2), so they stay in sync with the
protocol automatically.

---

### 18.4 Authentication Has No Enforcement — APIs Are Open by Default

**Current state.**
The `E2AAuth` structure exists in the protocol:

```python
# jiuwenswarm/common/e2a/models.py
@dataclass
class E2AAuth:
    method_id: str | None = None
    bearer_token: str | None = None
    api_key_ref: str | None = None
    credential_ref: str | None = None
    extra_headers: dict[str, str] = field(default_factory=dict)
```

However, this structure is carried through the protocol but not validated anywhere. Anyone
who can reach `ws://localhost:19000/ws` can connect and send any E2A request — no API key,
no token, no session secret is checked. Origin validation exists (`ws_origin.py`) but is
disabled by default.

For a local deployment, this is acceptable. For an application developer who exposes
jiuwenswarm to the internet (or even to a LAN with untrusted devices), there is no
authentication layer to enable. The only protection is network-level: don't expose the port.

**What good looks like.**
A configurable authentication gate at the gateway level:

```yaml
# config.yaml
gateway:
  auth:
    mode: none          # default — no auth, local use only
    # mode: api_key     — require X-API-Key header on WS upgrade
    # mode: bearer      — require Authorization: Bearer <token> on WS upgrade
    api_keys:
      - key: "sk-my-app-key-123"
        label: "My external app"
        scopes: ["chat", "session"]
```

Authentication should fail at WebSocket handshake time, not after the connection is
established. Unauthenticated connections should receive a 401 HTTP response during the
upgrade, not a connected-then-rejected response.

---

### 18.5 WebSocket Origin Checking Is Disabled by Default and Undocumented

**Current state.**
WebSocket origin validation is controlled by two environment variables:
- `JIUWENSWARM_ENABLE_ORIGIN_CHECK=1` — enables origin validation
- `JIUWENSWARM_WS_ALLOWED_ORIGIN_HOSTS=host1.com,host2.com` — sets the allowlist

These are not mentioned in `config.yaml`, not in the operator onboarding docs, not in any
Web UI settings panel. An operator deploying jiuwenswarm behind a reverse proxy and exposing
it to the internet does not know this mechanism exists.

By default, any browser page on any origin can connect to the WebSocket — an XSS attack
on any page served alongside jiuwenswarm would have unrestricted WebSocket access to the
agent.

**What good looks like.**
Origin configuration promoted to `config.yaml` as a first-class field:

```yaml
gateway:
  web_channel:
    allowed_origins:
      - "http://localhost:5173"
      - "https://myapp.example.com"
    # Empty list = block all cross-origin connections
    # Not set = allow all (with a startup WARNING printed)
```

A startup warning when `allowed_origins` is not configured and the server is not
bound to loopback: "⚠ WebSocket origin validation is disabled. Set
`gateway.web_channel.allowed_origins` to restrict access."

---

### 18.6 No Multi-Tenancy — One Workspace, One User Namespace

**Current state.**
jiuwenswarm is a single-workspace system. All sessions, memory, and skills belong to one
agent identity in `~/.jiuwenswarm/`. While the E2A protocol carries a `user_id` field, this
is used for logging and channel routing, not for data isolation. Two users calling the
same jiuwenswarm instance with different `user_id` values share the same memory, the same
installed skills, and can see each other's session list.

For an application developer building a multi-user product (a SaaS tool, a team assistant,
a customer-facing agent), this is a hard blocker. The only workaround is running a separate
jiuwenswarm instance per user — multiplying infrastructure cost and operational complexity.

**What good looks like.**
A `user_id`-scoped isolation layer:
- Sessions are scoped to `user_id`: user A cannot list or access user B's sessions.
- Memory is scoped to `user_id`: each user has their own `USER.md` and `MEMORY.md`.
- Installed skills are shared (system-level) or per-user depending on config.
- The `session.list` method returns only the sessions belonging to the requesting `user_id`.

This does not require separate processes — it requires namespace prefixes in session IDs
and memory paths: `~/.jiuwenswarm/users/{user_id}/sessions/` instead of
`~/.jiuwenswarm/agent/sessions/`.

---

### 18.7 Custom Channel API Exists But Has No Developer Guide

**Current state.**
The `BaseChannel` abstract class in `jiuwenswarm/gateway/channel_manager/base.py` defines a
clean interface for implementing a custom integration channel:

```python
class BaseChannel(ABC):
    async def start(self) -> None: ...      # begin listening for inbound messages
    async def stop(self) -> None: ...       # clean up
    async def send(self, msg, ...) -> None: # send outbound message to user
    def is_allowed(self, sender_id) -> bool # check sender permission
```

11 built-in channels exist (Feishu, Telegram, Discord, WeChat, DingTalk, Slack, WhatsApp,
etc.) as working reference implementations. But:
- No `CHANNELS.md` or developer guide explains how to register a custom channel.
- The registration mechanism (how a custom `BaseChannel` subclass is wired into the
  `ChannelManager`) is not documented.
- The lifecycle contract (`start()` must be non-blocking, `send()` must handle
  `RoutingTarget` correctly) is not written down.
- The relationship between `Message`, `E2AEnvelope`, and `ChannelMetadata` is implicit.

An application developer who wants to integrate jiuwenswarm with their own messaging
platform (a custom NATS-based event bus, an internal Slack-like tool) must reverse-engineer
a working channel from source.

**What good looks like.**
A `CHANNELS.md` guide covering:
1. When to write a custom channel (vs. using the Web/WebSocket channel directly).
2. The full lifecycle: `start()` → receive inbound → call `self.bus.route_user_message()`
   → receive response in `send()`.
3. A minimal working example channel (HTTP polling or webhook receiver) in under 80 lines.
4. How to register the channel with `ChannelManager` at startup.
5. The `RoutingTarget` model — what it means and how to use it in `send()`.

---

### 18.8 Webhook/Event Notification System Is Limited

**Current state.**
A `GatewayHookHandler` exists with four events:

```python
async def on_session_start(self, session_id, source) -> None
async def on_user_prompt_submit(self, session_id, prompt) -> None
async def on_session_end(self, session_id, reason) -> None
async def on_notification(self, notification_type, message, session_id) -> None
```

These hooks fire shell commands configured in `hooks.yaml`. They can be used to POST to a
webhook URL via a shell `curl` command — but this is a workaround, not a designed feature.
There is no native "HTTP webhook" target type, no retry on failure, no delivery guarantee,
no signature (HMAC) for webhook security, and no event for the most useful cases:

- Agent task completed (with result summary)
- Agent tool call executed (which tool, what args)
- Agent error occurred
- Streaming response started / ended

**What good looks like.**
A native webhook destination in `config.yaml`:

```yaml
hooks:
  on_task_complete:
    - type: webhook
      url: "https://myapp.example.com/jiuwenswarm-events"
      secret: "whsec_abc123"   # HMAC-SHA256 signature header
      retry: 3
      timeout_seconds: 10
  on_agent_error:
    - type: webhook
      url: "https://myapp.example.com/jiuwenswarm-events"
```

Each webhook POST delivers a structured JSON payload:
```json
{
  "event": "task_complete",
  "session_id": "sess_xyz",
  "timestamp": "2026-09-06T10:05:22Z",
  "data": {
    "summary": "Parsed 3 invoices, wrote output.csv",
    "duration_ms": 14200,
    "tool_calls_count": 7
  }
}
```

With HMAC signature in `X-Jiuwenswarm-Signature` so the receiving app can verify the
request is authentic.

---

### 18.9 Session API Is Full-Featured But Has No Documented Response Shapes

**Current state.**
The E2A protocol supports a complete session lifecycle:
`session.create`, `session.list`, `session.switch`, `session.rename`, `session.fork`,
`session.delete`, `session.get_metadata`, `session.pin`, `session.color_set`.

But the response shape for each method is nowhere documented outside the server source code.
A developer calling `session.create` does not know that the response `data` contains
`session_id`, `created_at`, `project_id`, and `mode` until they either read
`session_metadata.py` or inspect a live response. There is no request/response schema
document for any of the ~30 E2A methods.

This is the difference between an API that is *implemented* and an API that is *published*.

**What good looks like.**
A method reference document (or AsyncAPI spec — see 18.2) listing every method with its
request params and response data shape:

```
session.create
  Request params:
    name: string (optional) — display name for the session
    project_id: string (optional, default "default")
    mode: "work" | "code" (optional, default "work")
  Response data:
    session_id: string
    name: string
    project_id: string
    mode: string
    created_at: ISO 8601 timestamp
```

30 methods × ~5 fields each = a half-day of documentation that eliminates hours of source
reading for every application developer.

---

### 18.10 No Local Development Mode for Application Developers

**Current state.**
An application developer building against jiuwenswarm must run the full stack (agent server
+ gateway + model API) to test their integration. There is no:
- Mock/stub gateway that replays canned responses without an LLM
- Sandbox mode with a local "echo agent" that returns predictable replies
- Response recording/playback for deterministic integration tests
- Docker Compose file for spinning up the full stack in CI

The only development mode is real: real WebSocket, real E2A protocol, real LLM API calls.
This makes integration tests slow, expensive, and non-deterministic.

**What good looks like.**
A `jiuwenswarm-dev` mode that starts a lightweight stub gateway:

```
$ jiuwenswarm-dev --stub
Stub gateway running at ws://localhost:19000/ws
Responds to chat.send with configurable canned replies.
No LLM required. No API keys required.

Configure responses in ~/.jiuwenswarm/dev/stubs.yaml:
  - method: chat.send
    pattern: ".*invoice.*"
    response: "I found 3 invoices. Processing now."
```

And a Docker Compose file in the repo root that starts agentserver + gateway + web UI with
one command, for developers who want the real stack without manual process management.

---

### Summary: Application Developer Usability at a Glance

The E2A protocol is well-designed internally: it has a consistent envelope format, a clean
method namespace, streaming support, and a full session lifecycle. The problem is the same
as section 17 — it is implemented, not published. An application developer looking at
jiuwenswarm from the outside sees a WebSocket port, a Markdown file, and no SDK.

**The five changes that unblock application developers fastest:**

1. **Publish `jiuwenswarm-client` on PyPI and npm.** Wrap E2A in a clean Python and
   TypeScript SDK. Remove the protocol implementation barrier entirely. Without this,
   every integration starts with "implement WebSocket + E2A from scratch."

2. **Add a REST HTTP API wrapper for single-shot use cases.** `POST /api/chat` with a
   JSON body. No WebSocket required. Covers 80% of automation and scripting use cases.

3. **Publish an AsyncAPI spec for E2A.** Machine-readable protocol definition. Enables
   auto-generated clients, auto-generated docs, and prevents spec drift.

4. **Add API key authentication with config.yaml support.** One configurable field
   that enables `mode: api_key`. Makes jiuwenswarm deployable in any environment, not
   just localhost.

5. **Add user-scoped session isolation.** Route `session.list`, session memory, and
   session history through `user_id`. Unblocks every multi-user product built on top
   of jiuwenswarm.

---

# P5 — Skill Author

*Creates skills to publish to the marketplace for others to install — writes `SKILL.md`,
packages Python tools, tests and submits skills.*

Coverage for P5 is partial. The findings below are drawn from §10 (Skill Ecosystem),
which was investigated primarily from the operator/end-user perspective. A dedicated
investigation of the skill authoring workflow will produce additional findings.

---

## §10 · Skill Authoring (Partial)

### 10.3 No Skill Version Management or Rollback

*(Full finding → P2 chapter, §10.3)*

Skill authors are the ones who update `SKILL.md`. When the evolution system
automatically modifies a skill, there is no diff-for-approval step and no way to
roll back to a previous version. This affects skill authors more directly than
operators — it is their work that gets overwritten.

### 10.4 Skill Testing Has No Infrastructure

*(Full finding → P2 chapter, §10.4)*

A skill author cannot test their skill with sample inputs from the UI before
submitting it to the marketplace. Every test requires a live chat session. A
dedicated skill test runner (paste input, see output) is the most important
unimplemented tool for this persona.

### P5 Gaps

The following aspects of skill authoring have not been investigated yet:

- **SKILL.md format documentation** — is there a schema, a linter, or a guide for
  writing well-structured skill prompts?
- **Tool packaging** — how does a skill author package Python tools alongside a
  SKILL.md? What is the directory structure?
- **Submission process** — how does a skill get published to the marketplace?
  What validation does it go through?
- **Skill metadata** — ratings, install counts, author pages — is there an author
  dashboard?

---

# P6 — Team Admin

*Manages a shared jiuwenswarm instance on behalf of a team — sets per-user
permissions, manages shared memory and skills, reviews activity.*

Coverage for P6 is partial. The findings below cover multi-user collaboration,
which is where team admin needs most clearly surface.

---

## §11 · Multi-User & Collaboration

*More than one person using the same instance.*

> Also affects: **P1** (end-users in a shared instance), **P2** (operators deploy
> and configure the shared instance), **P4** (application developers building
> multi-user products on top of jiuwenswarm). See finding 18.6 for the application
> developer perspective on multi-tenancy.

### 11.1 No User Identity or Access Control

**Current state.**
The Web UI has no login. All users who can reach `localhost:5173` share the same
agent identity, memory, and skills. There is no concept of "this conversation
belongs to user A, not user B."

**What good looks like.**
For single-operator deployments this is acceptable. But for team deployments where
the agent is shared via a channel (Feishu group, Telegram channel), there should
be per-user memory isolation and the ability to set per-user permission levels.
The channel integration already passes `user_id` — this should be plumbed through
to memory and permission scoping.

### 11.2 Conversation Sharing Is Image-Only

**Current state.**
`shareImageExport.tsx` converts the chat to a PNG image. This is the only sharing
mechanism. There is no way to share a conversation as a link, as Markdown, or as
a JSON export that another person could import.

**What good looks like.**
- Export as Markdown (conversation turns formatted as `**User:** / **Agent:**`).
- Export as JSON (full structured conversation for import elsewhere).
- Share link (if the instance has a publicly accessible URL).

### 11.3 No Shared Skill Library for Teams

**Current state.**
Skills are per-agent-workspace. If two operators run separate instances, they cannot
share skills without manually copying files.

**What good looks like.**
A skill export/import format (`.skill.zip`) and a shared skill registry that team
members can publish to and pull from. The `SkillNetSearchModal` and `ClawHubSearchModal`
components suggest this direction exists — it should be surfaced more prominently
as the primary skill distribution mechanism.

---

## §3 · Trust & Safety (Team Admin Perspective)

*(Full findings → P1 chapter, §3)*

- **3.1** No Visibility Into Agent Permissions — team admins are the ones who
  configure per-user permission rules. Finding 2.6 (no GUI for permission system)
  in the P2 chapter is the operator-side view of the same problem.
- **3.4** Destructive External Actions Have No Confirmation Layer — team admins
  may want to enable confirmation for specific users (e.g. newer team members)
  while allowing trusted users to bypass it.

---

# P7–P12 — Not Yet Covered

The following personas have been defined and their key needs identified, but no
dedicated findings investigation has been completed. Sections will be added as
investigation proceeds.

| Persona | Key needs to investigate |
|---|---|
| **P7 — Auditor** | Structured audit log format, data lineage for tool calls, PII detection, export to SIEM |
| **P8 — Agent QA** | Golden-set eval framework, trajectory comparison across model versions, deterministic replay |
| **P9 — Support / Help Desk** | Session lookup by user ID, diagnostic replay UI, state reset commands |
| **P10 — AI / Prompt Engineer** | Prompt section inspector (live, per-request), A/B comparison for prompts, version history |
| **P11 — Security Researcher** | Documented threat model, security config hardening guide, test harness for injection patterns |
| **P12 — Data Analyst** | Structured telemetry export (Parquet/JSON), usage dashboard, per-session metrics API |

---

## Appendix: Findings by Persona (Matrix)

Quick-reference table for cross-persona navigation. Each finding ID is stable.
Full content is in the persona section above.

| Finding | Title | P1 | P2 | P3 | P4 | P5 | P6 |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **1.1** | Error messages give users nothing to act on | ● | | | | | |
| **1.2** | Mode naming is system-centric | ● | | | | | |
| **1.3** | No structured feedback on responses | ● | | | | | |
| **1.4** | Skill creation entry point not obvious | ● | | | | | |
| **1.5** | Conversation history not searchable | ● | | | | | |
| **1.6** | No keyboard shortcuts | ● | | | | | |
| **1.7** | No output length/style controls | ● | | | | | |
| **1.8** | No undo for agent actions | ● | | | | | |
| **1.9** | Long messages lack structure aids | ● | | | | | |
| **2.1** | No startup validation | | ● | | | | |
| **2.2** | Config file has no validation tool | | ● | | | | |
| **2.3** | Powerful features invisible by default | | ● | | | | |
| **2.4** | Onboarding ends before hard part | | ● | | | | |
| **2.5** | Instance/port management confusing | | ● | | | | |
| **2.6** | Permission system has no GUI | | ● | | ○ | | ○ |
| **2.7** | Optional deps fail at runtime | | ● | | | | |
| **2.8** | Documentation scattered | | ● | | | | |
| **2.9** | Upgrade experience undefined | | ● | | | | |
| **2.10** | Internationalization inconsistent | | ● | | | | |
| **3.1** | No agent permission visibility before first action | ● | ○ | | | | ○ |
| **3.2** | No diff/preview before file modify | ● | | | | | |
| **3.3** | No task cancellation with defined semantics | ● | | | | | |
| **3.4** | No confirmation for destructive external actions | ● | ○ | | | | ○ |
| **4.1** | Graceful degradation is silent | ● | ○ | | | | |
| **4.2** | Session recovery after disconnect undefined | ● | ○ | | | | |
| **4.3** | Rate limiting and API failures opaque | ● | | | | | |
| **4.4** | No persistent state for in-progress tasks | ● | ○ | | | | |
| **5.1** | Setup wizard ends too early | ● | ○ | | | | |
| **5.2** | Empty state has no direction | ● | | | | | |
| **5.3** | No progressive onboarding after first use | ● | | | | | |
| **5.4** | CLI first-run has no guidance | ● | ○ | | | | |
| **6.1** | Thinking display hidden behind trajectory panel | ● | | | | | |
| **6.2** | Tool calls shown but not explained | ● | | | | | |
| **6.3** | Subagent activity not visible | ● | | | | | |
| **6.4** | No explanation of why agent asked a question | ● | | | | | |
| **7.1** | No first-token latency indicator | ● | | | | | |
| **7.2** | No indication of context length pressure | ● | | | | | |
| **7.3** | Skill execution has no progress feedback | ● | | | | | |
| **8.1** | No notification when long tasks complete | ● | | | ○ | | |
| **8.2** | No background task management | ● | | | | | |
| **9.1** | No token or cost visibility | ○ | ● | | | | |
| **9.2** | No optimization hints | ○ | ● | | | | |
| **10.1** | Skill marketplace has no quality signals | ○ | ● | | | ● | |
| **10.2** | No skill dependency management | | ● | | | ○ | |
| **10.3** | No skill version management or rollback | | ● | | | ● | |
| **10.4** | Skill testing has no infrastructure | | ○ | | | ● | |
| **11.1** | No user identity or access control | ○ | ○ | | ○ | | ● |
| **11.2** | Conversation sharing is image-only | ● | | | | | ○ |
| **11.3** | No shared skill library for teams | | ○ | | | ○ | ● |
| **12.1** | No visibility into what is stored in memory | ● | | | | | |
| **12.2** | No indication of what agent sends to LLM | ● | | | | | |
| **12.3** | No data retention policy UI | ○ | ● | | | | |
| **13.1** | No in-context help | ● | | | | | |
| **13.2** | No diagnostic mode | ● | ○ | | | | |
| **13.3** | Error messages don't reference log files | ● | ○ | | | | |
| **14.1** | No keyboard navigation across the UI | ● | | | | | |
| **14.2** | No screen reader support audit | ● | | | | | |
| **14.3** | No high-contrast or large-text mode | ● | | | | | |
| **15.1** | Mobile layout not first-class | ● | | | | | |
| **15.2** | No PWA support | ● | | | | | |
| **16.1** | Skills and connectors separate but similar | ● | | | | | |
| **16.2** | Settings organized by implementation not task | ● | ● | | | | |
| **16.3** | Trajectory panel hidden and unnamed | ● | | | | | |
| **17.1** | Rail API undocumented | | | ● | | | |
| **17.2** | Hook execution order not discoverable | | | ● | | | |
| **17.3** | AgentCallbackContext has no type stubs | | | ● | | | |
| **17.4** | Tool registration has no developer guide | | | ● | | | |
| **17.5** | create_deep_agent() too many undocumented params | | | ● | | | |
| **17.6** | Examples directory not discoverable | | | ● | | | |
| **17.7** | Testing a rail requires undocumented mock infra | | | ● | | | |
| **17.8** | No stable public API / no semver contract | | | ● | ○ | | |
| **17.9** | Prompt section API is hidden | | | ● | | | |
| **17.10** | No scaffold CLI for new rail | | | ● | | | |
| **17.11** | Error framework not exposed as developer API | | | ● | | | |
| **17.12** | No integration test layer | | | ● | | | |
| **18.1** | WebSocket-only API, no REST fallback | | | | ● | | |
| **18.2** | E2A protocol in markdown, not machine-readable | | | | ● | | |
| **18.3** | No published client SDK | | | | ● | | |
| **18.4** | Authentication not enforced — open by default | | ○ | | ● | | |
| **18.5** | WebSocket origin checking disabled by default | | ○ | | ● | | |
| **18.6** | No multi-tenancy | | | | ● | | ● |
| **18.7** | Custom channel API has no developer guide | | | | ● | | |
| **18.8** | Webhook/event system is limited | | | | ● | | |
| **18.9** | Session API has no documented response shapes | | | | ● | | |
| **18.10** | No local development mode | | | | ● | | |

**Legend:** ● primary persona (full content in their section) · ○ secondary persona (affected, pointer in their section)

---

## The Core Problem and the Highest-Leverage Fixes

jiuwenswarm is engineered from the inside out. Each feature was built correctly
within its own scope, but usability was not designed as a cross-cutting concern.
The result: a system that works well for users who already understand it and is
hostile to users who do not.

**The five changes that would move the score the most:**

1. **Startup health check with a printed report.** Validate model credentials,
   channel credentials, and optional dependencies before serving the first request.
   Print a green/yellow/red summary. Eliminates the most common onboarding failure.

2. **Setup wizard that does not exit until a message succeeds.** Extend
   `ModelSetupGuide.tsx` to include inline credential testing and a "send first
   message" step. Turns a 40% first-run failure rate into near zero.

3. **Actionable error messages with a machine-readable code.** Every error surfaced
   to the user must include: what happened, why, and what to do. Add `ERR_*` codes
   for searchability. Dramatically reduces support requests.

4. **Stop button with defined semantics and a completion card.** Users need to trust
   that they can interrupt the agent safely. The trajectory system already has the
   data needed to produce "here is what completed and what did not."

5. **Health indicator in the Web UI sidebar.** A green/yellow/red dot that reflects
   memory, channels, and OTel status. Two hours of implementation that eliminates
   an entire class of silent failures where users operate with broken subsystems.

These five changes require no architectural redesign. They are surface-level
improvements on top of what already exists, and they address the root cause of the
low usability score: the system does not tell users what is happening.
