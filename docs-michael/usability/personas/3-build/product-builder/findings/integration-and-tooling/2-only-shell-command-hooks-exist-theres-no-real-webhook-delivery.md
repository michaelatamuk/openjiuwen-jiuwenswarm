---

# Only shell-command hooks exist; there's no real webhook delivery

*Concern: Integration & Local Development*

---

## The problem today

Hooks only fire shell commands (e.g. `curl`), so there's no native HTTP webhook — no retry, no delivery guarantee, no HMAC, and no events for task completion, tool calls, errors, or stream start/end.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["An app wants task-completion events"]):::plain
    MID(["only shell-command hooks exist"]):::plain
    START --> MID
    MID -->|"reason: no native webhook delivery"| OUT(["Events arrive unreliably and unsigned"]):::fail
    OUT --> DONE(["integrations can't depend on them"]):::fail
```

---

## The proposed fix

A native webhook destination in config (`on_task_complete`, `on_agent_error`, …) with HMAC-SHA256 signature, retry, timeout, and a structured JSON payload.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["An app wants task-completion events"]):::plain
    MID(["a native webhook delivers signed JSON"]):::plain
    START --> MID
    MID -->|"reason: webhook targets exist with retry/HMAC"| OUT(["Events arrive reliably and verifiably"]):::fix
    OUT --> DONE(["apps can trust the events"]):::ok
```
