[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# Documentation is scattered with no guide for common tasks

*Concern: Running & Managing the Instance*

---

## The problem today

Docs live in inline YAML comments, `/docs/` Markdown, and skill `SKILL.md` files, with no centralized guide for the three most common tasks: add a channel, debug a task, create a skill.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["An operator needs to do a common task"]):::plain
    MID(["the docs are split across three places"]):::plain
    START --> MID
    MID -->|"reason: no task-based guide exists"| OUT(["The operator hunts through sources"]):::fail
    OUT --> DONE(["can't find the answer quickly"]):::fail
```

---

## The proposed fix

An integrated help panel in settings (each module with a collapsible "Help"), a single `quickstart.md` covering install → configure → start → first task → channel → skill, and doc links referenced from complex config sections.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["An operator needs to do a common task"]):::plain
    MID(["help is in-context and task-based"]):::plain
    START --> MID
    MID -->|"reason: a quickstart + per-module help exist"| OUT(["The operator finds the answer fast"]):::fix
    OUT --> DONE(["completes the task confidently"]):::ok
```

Concern: [Running & Managing the Instance](README.md).
