---

# No hints about what is consuming the context

*Concern: Cost & Token Economics*

---

## The problem today

When a session's context grows large there's no guidance on how to shrink it — the user can't tell whether the cause is memory, skills, or history.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["Context grows toward the limit"]):::plain
    MID(["no guidance on what is consuming it"]):::plain
    START --> MID
    MID -->|"reason: no breakdown of the context is shown"| OUT(["The user can't see the culprit"]):::fail
    OUT --> DONE(["doesn't know what to trim"]):::fail
```

---

## The proposed fix

Past ~70% tokens, show a breakdown — "history 40%, memory 35%, skills 15%, system 10%" — each linking to the fix: "Reduce memory snapshot size", "Use auto_list mode for skills".

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["Context grows toward the limit"]):::plain
    MID(["a breakdown shows what consumes it"]):::plain
    START --> MID
    MID -->|"reason: usage is attributed per component"| OUT(["The user sees the culprit"]):::fix
    OUT --> DONE(["knows exactly what to trim"]):::ok
```
