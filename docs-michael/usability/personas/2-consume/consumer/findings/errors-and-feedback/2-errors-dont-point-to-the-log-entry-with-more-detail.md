---

# Errors don't point to the log entry with more detail

*Concern: Diagnostics & Support*

---

## The problem today

When an error occurs the user isn't told where to look for more detail — they must know logs exist, where they are, and how to read them.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["An error is shown"]):::plain
    MID(["the message gives no log location"]):::plain
    START --> MID
    MID -->|"reason: errors don't reference their log entry"| OUT(["The user can't dig into the detail"]):::fail
    OUT --> DONE(["reports without the underlying log"]):::fail
```

---

## The proposed fix

Every error with more detail should end with "Full details in ~/.jiuwenswarm/agent/.logs/agent_server.log", or offer a "Show log" button (last 60s of the session). stderr errors should include the log path automatically. Related: [Error messages give no explanation or next step](1-error-messages-give-no-explanation-or-next-step.md).

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["An error is shown"]):::plain
    MID(["the message points to its log entry"]):::plain
    START --> MID
    MID -->|"reason: errors cite the log path / Show log"| OUT(["The user can reach the detail"]):::fix
    OUT --> DONE(["finds the underlying cause"]):::ok
```
