[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# Error messages give no explanation or next step

*Concern: Errors & Feedback*

---

## The problem today

When an error occurs, jiuwenswarm shows a bare message that tells the user nothing they can act on. Two examples reached production:

```python
# channels/cli/render.py:200
error = payload.get("error") or payload.get("message", "unknown error")
```
When neither field is present, the user sees `unknown error` — no tool name, no session id, no log reference, no next step.

```python
# channels/cli/chat.py:292
raise ValueError("unable to parse response from gateway")
```
No indication of whether this is a network issue, a protocol mismatch, or a bug.

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant S as Agent (CLI/Web)
    U->>S: asks for something
    S-->>U: "unknown error"
    U->>U: cannot tell what happened, why, or what to do
    U->>U: ends stuck or files a useless bug report
```

---

## The proposed fix

Every error surfaced to the user should answer three questions: what happened, why it happened, and what to do next.

> "The parse-invoice skill failed to read /data/invoices/inv_003.pdf — the file may be corrupted or password-protected. Try opening the file manually to verify it."

> "Lost connection to the gateway (WebSocket closed). The agent has stopped. Your conversation is saved. Reload the page to reconnect."

The CLI and Web UI should agree on the error format, and errors should carry a short machine-readable code (e.g. `ERR_GATEWAY_DISCONNECT`) so a user can search for it in docs or paste it into a support request.

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant S as Agent (CLI/Web)
    U->>S: asks for something
    S->>S: route the failure
    S-->>U: ERR_ code · what happened · why · what to do next
    S-->>U: pointer to the log entry / "Show log"
    U->>U: can act and can report the issue usefully
```

Related: [Errors don't point to the log entry with more detail](../../setup-and-operation/diagnostics-and-help.md#2-errors-dont-point-to-the-log-entry-with-more-detail).
