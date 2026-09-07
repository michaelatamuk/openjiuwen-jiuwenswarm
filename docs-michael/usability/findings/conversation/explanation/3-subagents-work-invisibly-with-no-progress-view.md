[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# Subagents work invisibly with no progress view

*Concern: Agent Explanation*

---

## The problem today

When `subagent_spawn` is called, the parent panel shows nothing about running subagents — not what they're doing, how many, or whether any failed.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The parent spawns subagents"]):::plain
    MID(["the parent panel shows nothing running"]):::plain
    START --> MID
    MID -->|"reason: no subagent activity indicator exists"| OUT(["User can't see subagent work or failures"]):::fail
    OUT --> DONE(["watches a silent parent with no visibility"]):::fail
```

---

## The proposed fix

A live subagent activity panel (the `TeamArea` component already exists for team mode; apply it to on-demand subagents):

- a list of active subagents with type, current step, and elapsed time;
- clicking a subagent opens its own trajectory or streaming output;
- when all finish, a summary: "3 subagents finished in 28s."

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The parent spawns subagents"]):::plain
    MID(["a live subagent panel shows type, step, time"]):::plain
    START --> MID
    MID -->|"reason: a progress view lists running subagents"| OUT(["User can watch each subagent and see failures"]):::fix
    OUT --> DONE(["knows progress and what finished"]):::ok
```

Concern: [Agent Explanation](README.md).
