[← Index](../README.md) · jiuwenswarm Usability Review

---

# §3 · Trust & Safety

*Does the user understand what the agent is about to do, and can they stop it?*

*Primary persona: P1. Also relevant to: P6, P13.*

---

## 3.1 No Visibility Into Agent Permissions Before the First Action

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

---

## 3.2 No Diff/Preview Before the Agent Modifies Files

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

---

## 3.3 No Task Cancellation With Defined Semantics

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

---

## 3.4 Destructive External Actions Have No Confirmation Layer

**Current state.**
The agent can send messages to Feishu groups, publish to external APIs, and call
webhooks — all without a user confirmation step. The permission system can block
tools entirely but cannot require per-call confirmation for sensitive actions.

**What good looks like.**
A "confirm before send" mode for external-impact tools. Before calling
`send_feishu_message` or any external webhook, the agent shows the message content
in the chat panel with Confirm / Edit / Cancel buttons. This is especially important
for group messages where mistakes are visible to many people.
