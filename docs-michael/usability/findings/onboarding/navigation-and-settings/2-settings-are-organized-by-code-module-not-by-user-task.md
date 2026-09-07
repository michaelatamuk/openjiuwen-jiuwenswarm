[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# Settings are organized by code module, not by user task

*Concern: Navigation & Settings*

---

## The problem today

Settings modules (General, Models, Channels, Agent, Browser, Experimental) mirror the codebase, not the user's goals — e.g. "change the response language" could live under General, Models, or Agent.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user wants to change a behaviour"]):::plain
    MID(["settings are grouped by code module"]):::plain
    START --> MID
    MID -->|"reason: no goal-based grouping exists"| OUT(["The user guesses which module"]):::fail
    OUT --> DONE(["changes the wrong setting"]):::fail
```

---

## The proposed fix

Organize by goal: Getting started · Communication channels · Memory & context · Agent behavior · Advanced — so a task maps to one obvious place.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user wants to change a behaviour"]):::plain
    MID(["settings are grouped by goal"]):::plain
    START --> MID
    MID -->|"reason: a goal-based structure exists"| OUT(["The user finds the right section"]):::fix
    OUT --> DONE(["changes the right setting"]):::ok
```

Concern: [Navigation & Settings](README.md).
