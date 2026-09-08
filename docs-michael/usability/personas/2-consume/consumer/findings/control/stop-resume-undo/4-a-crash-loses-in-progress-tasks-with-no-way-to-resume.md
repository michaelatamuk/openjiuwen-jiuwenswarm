---

# A crash loses in-progress tasks with no way to resume

*Concern: Stop, Resume & Undo*

---

## The problem today

If the process crashes mid-task, the task is lost — there is no checkpoint, so the agent can't resume from step 3 of 5 after a restart.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The process crashes mid-task"]):::plain
    MID(["all task state is lost"]):::plain
    START --> MID
    MID -->|"reason: no checkpoint is persisted"| OUT(["The work cannot be resumed"]):::fail
    OUT --> DONE(["the user must restart from scratch"]):::fail
```

---

## The proposed fix

Persist the todo state (`TaskPlanningRail`) to disk as a per-session JSON so the agent can offer "last session was interrupted at step 3: parse invoices. Resume?" after a restart. The checkpoint store should be configurable (local disk or a durable store) to survive restarts in containerized/multi-user deployments.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The process crashes mid-task"]):::plain
    MID(["a checkpoint was persisted to disk"]):::plain
    START --> MID
    MID -->|"reason: task state survives the restart"| OUT(["The agent offers to resume at step 3"]):::fix
    OUT --> DONE(["the user recovers the interrupted work"]):::ok
```
