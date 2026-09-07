[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# Unclear what the agent does when a session disconnects

*Concern: Stop, Resume & Undo*

---

## The problem today

If the tab closes or the WebSocket drops mid-task, it is not documented or visible whether the agent continues, stops, or is undefined. There is no reconnect flow showing what happened during the disconnect.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The connection drops mid-task"]):::plain
    MID(["nothing explains what the agent did after"]):::plain
    START --> MID
    MID -->|"reason: no reconnect summary exists"| OUT(["The user returns unsure whether it finished"]):::fail
    OUT --> DONE(["can't tell if the work continued or broke"]):::fail
```

---

## The proposed fix

On reconnect, immediately show what the agent did while away ("completed 4 steps and wrote 2 files — summary"), its current step if still running, or the error if it failed. Server-side behaviour during a disconnect must be documented, not assumed.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The connection drops mid-task"]):::plain
    MID(["reconnect shows a summary of what happened"]):::plain
    START --> MID
    MID -->|"reason: a replay flow surfaces the outcome"| OUT(["The user returns knowing exactly what ran"]):::fix
    OUT --> DONE(["can continue from the actual state"]):::ok
```

Concern: [Stop, Resume & Undo](README.md).
