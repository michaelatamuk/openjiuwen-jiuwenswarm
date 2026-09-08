---

# Error messages give no explanation or next step

*Concern: Errors & Feedback*

---

## The problem today

When an error occurs, jiuwenswarm shows a bare message that gives the user nothing to act on. Two examples reached production:

```python
# channels/cli/render.py:200
error = payload.get("error") or payload.get("message", "unknown error")
```
When neither field is present, the user sees `unknown error` — no tool name, no session id, no log reference, no next step. The same pattern repeats elsewhere: failures surface without saying whether the cause was a network issue, a protocol mismatch, or a bug, so the user cannot tell what went wrong or what to do about it.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B

    START(["An error occurs while running a task"]):::plain
    SHOW(["The UI/CLI shows a bare 'unknown error'"]):::plain

    START --> SHOW
    SHOW -->|"reason: no tool name / session id /
    log reference / next step is captured"| STUCK(["The user can't tell
    what happened, why, or what to do"]):::fail
    STUCK --> DEAD(["User stays stuck; bug report has nothing useful"]):::fail
```

---

## The proposed fix

Every error surfaced to the user should answer three questions: what happened, why it happened, and what to do next.

> "The parse-invoice skill failed to read /data/invoices/inv_003.pdf — the file may be corrupted or password-protected. Try opening the file manually to verify it."

> "Lost connection to the gateway (WebSocket closed). The agent has stopped. Your conversation is saved. Reload the page to reconnect."

The CLI and Web UI should agree on the error format, and errors should carry a short machine-readable code (e.g. `ERR_GATEWAY_DISCONNECT`) so a user can search for it in docs or paste it into a support request.

```mermaid
flowchart TD
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B

    START(["An error occurs while running a task"]):::plain
    BUILD(["The error carries what happened,
    why, a code, and the next step"]):::plain

    START --> BUILD
    BUILD -->|"reason: every error answers 3 questions
    + ERR_ code + a pointer to the log"| CLEAR(["The user understands
    the cause and the next step"]):::fix
    CLEAR --> DONE(["User can act and can report it"]):::ok
```

Related: [Errors don't point to the log entry with more detail](../../setup-and-operation/diagnostics-and-help/2-errors-dont-point-to-the-log-entry-with-more-detail.md).
