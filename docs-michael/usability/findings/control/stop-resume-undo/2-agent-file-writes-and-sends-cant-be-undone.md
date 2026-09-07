[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# Agent file writes and sends can't be undone

*Concern: Stop, Resume & Undo*

---

## The problem today

The agent can write files, send Feishu messages, delete files, and call external APIs. None of these can be undone from the UI — once done, they are done.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The agent acts (writes / sends / deletes)"]):::plain
    MID(["nothing can be undone afterwards"]):::plain
    START --> MID
    MID -->|"reason: no undo is available from the UI"| OUT(["A mistake is irreversible"]):::fail
    OUT --> DONE(["the user manually repairs the damage"]):::fail
```

---

## The proposed fix

A post-action summary card after each turn. For reversible actions (file writes, deletes), an "Undo last action" button for ~30s. For irreversible actions (messages sent, API calls), a clear label "This action cannot be undone." Requires the harness to track a per-turn action log — feasible given the trajectory system.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The agent acts (writes / sends / deletes)"]):::plain
    MID(["an undo button appears for reversible actions"]):::plain
    START --> MID
    MID -->|"reason: a per-turn action log enables undo"| OUT(["The user can reverse a reversible action"]):::fix
    OUT --> DONE(["irreversible ones are clearly labelled"]):::ok
```

Concern: [Stop, Resume & Undo](README.md).
