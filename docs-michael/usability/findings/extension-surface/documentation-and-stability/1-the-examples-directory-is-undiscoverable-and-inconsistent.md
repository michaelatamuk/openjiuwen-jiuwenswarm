[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# The examples directory is undiscoverable and inconsistent

*Concern: Extension Documentation & Stability*

---

## The problem today

`examples/` has no README index, mixes `BaseSecurityRail` with `DeepAgentRail`, has non-runnable quickstarts (need a DB), and lacks the simplest case (add a line to the system prompt).

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A developer looks for an example"]):::plain
    MID(["there's no index and examples conflict"]):::plain
    START --> MID
    MID -->|"reason: no runnable hello-world exists"| OUT(["They can't find or run a useful example"]):::fail
    OUT --> DONE(["learning is blocked"]):::fail
```

---

## The proposed fix

An `examples/README.md` (what/prereqs/expected output) and a one-file `00_hello_rail/` that just prints "My rail ran".

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A developer looks for an example"]):::plain
    MID(["an indexed set of runnable examples exists"]):::plain
    START --> MID
    MID -->|"reason: a hello-world rail is provided"| OUT(["They find and run an example"]):::fix
    OUT --> DONE(["they learn from working code"]):::ok
```

Concern: [Extension Documentation & Stability](README.md).
