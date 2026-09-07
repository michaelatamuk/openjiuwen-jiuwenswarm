[← Index](../../README.md) · jiuwenswarm Usability Review

---

# Errors & Feedback

*How failures and agent answers are surfaced and corrected.*

---

## 1 Error messages give no explanation or next step

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

## 2 No way to rate, retry or correct an agent answer

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

