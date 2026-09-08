---

# Creating a skill has no clear entry point

*Concern: Skill Authoring & Dependencies*

---

## The problem today

Creating a skill routes between `skill-creator-normal`, `swarmskill-creator`, and `skill-omni-creation` based on chat input, with the routing hidden inside a SKILL.md — no guided UI entry point.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user wants to create a skill"]):::plain
    MID(["no guided entry point exists"]):::plain
    START --> MID
    MID -->|"reason: creation is routed by hidden logic"| OUT(["The user doesn't know where to start"]):::fail
    OUT --> DONE(["creating a skill feels impossible"]):::fail
```

---

## The proposed fix

A "Create Skill" button in the Skills panel opening a short wizard (single-agent / team / from URL) that routes to the right creator with a starter prompt pre-filled.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user wants to create a skill"]):::plain
    MID(["a 'Create Skill' wizard guides them"]):::plain
    START --> MID
    MID -->|"reason: a UI entry point exists"| OUT(["The user starts the right creator"]):::fix
    OUT --> DONE(["creation is discoverable"]):::ok
```
