[← Index](../README.md) · jiuwenswarm Usability Review

---

# §4 · Reliability & Resilience

*What does the user experience when something goes wrong?*

*Primary persona: P1. Also relevant to: P2, P6.*

---

## 4.1 Graceful Degradation Is Silent

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

**Operator note.**
Additionally, the startup log should print subsystem health before serving the first request (see 2.1). Operators monitoring without the Web UI — via logs or alerting — need this information in the log stream, not only in the UI.

---

## 4.2 Session Recovery After Disconnect Is Undefined

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

**Operator note.**
From an operator's perspective: the server-side behavior during a disconnect (does the agent process continue? is state preserved?) should be documented. Currently it is not.

---

## 4.3 Rate Limiting and API Failures Are Opaque

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

**Operator note.**
Operators need this surfaced in logs at WARNING level, not just in the Web UI, so that monitoring systems can detect model provider failures.

---

## 4.4 No Persistent State for In-Progress Tasks

**Current state.**
If the `jiuwenswarm` process crashes mid-task, the task is lost. There is no
checkpoint system — the agent cannot resume from step 3 of 5 after a restart.

**What good looks like.**
The todo system (`TaskPlanningRail`) already tracks task state. Persisting this to
disk (a simple JSON file per session) would allow the agent to display "last session
was interrupted at step 3: parse invoices. Resume?" on reconnect. This turns a
frustrating failure mode into a recoverable one.

**Operator note.**
For operators managing multi-user deployments, the checkpoint store should be configurable (local disk or external durable store) so that it survives process restarts in containerized environments.
