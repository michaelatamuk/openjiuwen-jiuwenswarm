[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# Background tasks look identical to idle sessions

*Concern: Messages, History & Notifications*

---

## The problem today

When the user navigates to another session while the agent is running, nothing in the sidebar shows that a session has an active task. The active session shows a processing state, but background sessions are silent.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["User navigates away while the agent runs"]):::plain
    MID(["the sidebar shows no active-task state"]):::plain
    START --> MID
    MID -->|"reason: no running indicator exists for background sessions"| OUT(["User can't tell the task is still going"]):::fail
    OUT --> DONE(["opens the wrong session or forgets the task"]):::fail
```

---

## The proposed fix

- A pulsing dot on sessions running in the background in `ConversationSidebar`.
- A global "Running tasks" indicator in the `SessionSidebar` nav.
- When a background task completes, a badge on the session and a non-blocking toast: "Session 'Invoice task' completed."

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["User navigates away while the agent runs"]):::plain
    MID(["running sessions get a pulsing dot and a task indicator"]):::plain
    START --> MID
    MID -->|"reason: active tasks are visibly marked"| OUT(["User can see a task is still running"]):::fix
    OUT --> DONE(["returns at the right moment and sees completion"]):::ok
```

Concern: [Messages, History & Notifications](README.md).
