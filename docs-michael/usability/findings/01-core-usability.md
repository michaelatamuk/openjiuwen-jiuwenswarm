[← Index](../README.md) · jiuwenswarm Usability Review

---

# §1 · Core Usability

*Direct interaction quality: errors, modes, feedback, conversation management.*

---

## 1.1 Error Messages Give Users Nothing to Act On

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

---

## 1.2 Mode Naming Is System-Centric, Not User-Centric

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

---

## 1.3 No Structured Feedback Mechanism for Agent Responses

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

---

## 1.4 Skill Creation Entry Point Is Not Obvious

**Current state.**
Creating a skill routes between `skill-creator-normal`, `swarmskill-creator`, and
`skill-omni-creation` based on what the user types into the chat input. The routing
logic lives inside the `SKILL.md` of the skill-creator skill itself — not in any
user-facing UI. A user wanting to create a skill has no guided entry point.

**What good looks like.**
A "Create Skill" button in the Skills panel (`SkillPanel/index.tsx`) that opens a
short wizard: what kind of skill? (single-agent / team / from URL) — and routes the
user to the right creator with an opening prompt already filled in.

---

## 1.5 Conversation History Is Not Searchable

**Current state.**
`ConversationSidebar.tsx` shows sessions grouped by project with rename, delete,
and pin — but no search. Finding a specific past conversation requires scrolling
through all sessions.

**What good looks like.**
A search box at the top of the conversation sidebar that searches across session
titles and message content. Results should highlight the matching message and jump
to it. This is table-stakes for any chat product.

---

## 1.6 No Keyboard Shortcuts for Core Actions

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

---

## 1.7 Agent Output Has No Length or Style Controls

**Current state.**
There is no global setting or per-message instruction for response length or style.
If the agent tends to be verbose, the user must add "be brief" to every message.

**What good looks like.**
A persistent preference (saved to MEMORY.md or user config) for response style:
terse / standard / detailed. A per-message override via a small pill control next
to the send button. The agent should read this preference from memory and apply it
without being reminded.

---

## 1.8 No "Undo" for Agent Actions

**Current state.**
The agent can write files, send Feishu messages, delete files, and call external
APIs. None of these actions can be undone from the UI. Once sent, they are sent.

**What good looks like.**
A post-action summary card after each turn showing what was changed. For reversible
actions (file writes, file deletes), an "Undo last action" button that appears for
30 seconds. For irreversible actions (messages sent, API calls made), a clear label
"This action cannot be undone." This requires the harness to track a per-turn
action log — which is architecturally feasible given the existing trajectory system.

---

## 1.9 Long Messages Lack Structure Aids

**Current state.**
`StreamingContent.tsx` renders text with simple whitespace-preserving display.
For long agent responses with multiple sections, there is no table of contents, no
jump-to-section, no folding.

**What good looks like.**
Auto-detect headers in agent output (`## Section`) and render a sticky mini-TOC
at the top of the message panel for long responses. Collapsible sections for
code blocks and lengthy reasoning chains.
