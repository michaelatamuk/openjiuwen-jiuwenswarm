[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# Data is kept indefinitely with no expiry controls

*Concern: Data Retention*

---

## The problem today

Memory and conversation history are stored indefinitely. There is a `trajectory_ui.retention_days` option, but no equivalent for conversations or memory.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The user accumulates sessions and memory"]):::plain
    MID(["data is kept forever"]):::plain
    START --> MID
    MID -->|"reason: no retention control exists for them"| OUT(["Data grows indefinitely with no expiry"]):::fail
    OUT --> DONE(["old personal data is never cleaned up"]):::fail
```

---

## The proposed fix

A retention settings panel with instance-wide defaults and per-user preferences: "Keep conversation history for: 30 / 90 / 365 / forever", "Keep daily memory for: 7 / 30 / 90 / forever", "Delete all data older than X". Expiration runs on startup; in shared deployments admins can set a maximum users cannot exceed.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The user accumulates sessions and memory"]):::plain
    MID(["retention policies expire old data"]):::plain
    START --> MID
    MID -->|"reason: expiry runs on startup"| OUT(["Data is cleaned up on a schedule"]):::fix
    OUT --> DONE(["old personal data no longer piles up"]):::ok
```

Concern: [Data Retention](README.md).
