[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# No warning before the context limit drops early memory

*Concern: Output & Perceived Speed*

---

## The problem today

There is a proactive notification for "context limit reached" via WebSocket, but it fires only at the limit — users get no advance warning before early context starts being dropped.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A session grows long"]):::plain
    MID(["the user is told only at the limit"]):::plain
    START --> MID
    MID -->|"reason: no advance warning before the cap"| OUT(["Early context silently starts being dropped"]):::fail
    OUT --> DONE(["the agent forgets the start of the task"]):::fail
```

---

## The proposed fix

A small token counter in the chat input area. At ~70% it turns yellow; at ~90% it warns "Approaching context limit — older messages may be summarized." That gives the user time to start a new session before the agent forgets.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A session grows long"]):::plain
    MID(["a live token counter warns before the cap"]):::plain
    START --> MID
    MID -->|"reason: the counter warns at 70%/90%"| OUT(["The user is warned in time"]):::fix
    OUT --> DONE(["can start a new session before memory drops"]):::ok
```

Concern: [Output & Perceived Speed](README.md).
