[← Index](../README.md) · jiuwenswarm Usability Review

---

# §4 · Reliability & Resilience

*What does the user experience when something goes wrong?*

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
that eliminates an entire class of silent failures. The same health state should also be
printed to the startup log stream (see 2.1), so deployments monitored via logs or
alerting — without the Web UI — can detect degradation.

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
The server-side behavior during a disconnect — whether the agent process continues and
state is preserved — must be documented too, not assumed.

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
- Model provider failures should be logged at WARNING level, so monitoring systems can
  detect them even without the Web UI open.

---

## 4.4 No Persistent State for In-Progress Tasks

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
