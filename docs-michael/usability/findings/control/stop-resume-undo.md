[← Index](../../README.md) · jiuwenswarm Usability Review

---

# Stop, Resume & Undo

*Interrupting, resuming and reversing agent work.*

---

## 1 No stop button that safely interrupts the agent

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

## 2 Agent file writes and sends can't be undone

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

## 3 Unclear what the agent does when a session disconnects

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
The server-side behavior during a disconnect — whether the agent process continues and
state is preserved — must be documented too, not assumed.

---

## 4 A crash loses in-progress tasks with no way to resume

**Current state.**
If the `jiuwenswarm` process crashes mid-task, the task is lost. There is no
checkpoint system — the agent cannot resume from step 3 of 5 after a restart.

**What good looks like.**
The todo system (`TaskPlanningRail`) already tracks task state. Persisting this to
disk (a simple JSON file per session) would allow the agent to display "last session
was interrupted at step 3: parse invoices. Resume?" on reconnect. This turns a
frustrating failure mode into a recoverable one. The checkpoint store should be
configurable (local disk or an external durable store) so it survives process restarts
in containerized and multi-user deployments.

---
