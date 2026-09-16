---

# The task list doesn't show progress moving

*Concern: Control & Continuity*

---

## The problem today

Goals and todos are rendered as flat rows, so there is no board on which a user can watch items move todo → in-progress → done as the agent works.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The agent is working through todos"]):::plain
    MID(["todos are shown as flat rows"]):::plain
    START --> MID
    MID -->|"reason: no board binds status to columns"| OUT(["Progress is invisible at a glance"]):::fail
    OUT --> DONE(["the user can't tell what is done vs pending"]):::fail
```

---

## The proposed fix

Add a task-board view driven by the existing `TaskPlan`/todo statuses (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`), with columns that update live as the agent changes status.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The agent is working through todos"]):::plain
    MID(["a board maps status to columns"]):::plain
    START --> MID
    MID -->|"reason: task status is already tracked"| OUT(["Items visibly move across the board"]):::fix
    OUT --> DONE(["progress is legible at a glance"]):::ok
```
