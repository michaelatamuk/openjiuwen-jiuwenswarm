[← Index](../../README.md) · jiuwenswarm Usability Review

---

# Health & Degradation

*Knowing when a subsystem is failing.*

---

## 1 Degraded subsystems fail silently and users assume all is fine

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
printed to the startup log stream (see [startup validation](startup-and-config.md#1-wrong-credentials-surface-only-on-the-first-chat-never-at-startup)), so deployments monitored via logs or
alerting — without the Web UI — can detect degradation.

---

## 2 Rate limits and API failures hang or show nothing useful

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

