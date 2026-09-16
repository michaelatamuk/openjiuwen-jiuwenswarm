---

# User docs are written like internal design notes

*Concern: Documentation & Stability*

---

## The problem today

User-facing docs (`Modes.md`, `SlashCommands.md`) mix canonical matrices, `deprecate_mode` and string-literal contracts with user guidance, and even contradict themselves. Internal and user audiences are both served badly.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user opens Modes.md / SlashCommands.md"]):::plain
    MID(["design-note contracts are interleaved with guidance"]):::plain
    START --> MID
    MID -->|"reason: internal and user audiences share one page"| OUT(["The user can't tell what to do"]):::fail
    OUT --> DONE(["the doc contradicts itself and loses trust"]):::fail
```

---

## The proposed fix

Split each page into a user-facing, task-oriented guide (what to do, with examples) and a separate internal reference (canonical matrices, contracts, deprecation). Generate the reference from source so the two cannot contradict.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user opens Modes.md / SlashCommands.md"]):::plain
    MID(["user guide and internal reference are separate"]):::plain
    START --> MID
    MID -->|"reason: the reference is generated from source"| OUT(["The user reads a clear task guide"]):::fix
    OUT --> DONE(["the two audiences are both served"]):::ok
```
