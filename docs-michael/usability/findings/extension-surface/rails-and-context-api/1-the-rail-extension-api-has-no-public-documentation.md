[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# The rail extension API has no public documentation

*Concern: Rails & Context API*

---

## The problem today

The rail system is the primary extension point, but `AgentRail` (10 hooks) and `DeepAgentRail` (+2) have no public reference page — a developer must read both source files, and the only written description is in Chinese docs.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A developer wants to write a rail"]):::plain
    MID(["no public API reference exists"]):::plain
    START --> MID
    MID -->|"reason: hooks/context are only in source"| OUT(["They must reverse-engineer the base classes"]):::fail
    OUT --> DONE(["getting started is slow and uncertain"]):::fail
```

---

## The proposed fix

A `RAILS.md` at the root (or `docs/en/rails.md`) explaining what a rail is, the full hook lifecycle in order, a paste-and-run example, and common patterns; the `DeepAgentRail` docstring lists all 12 hooks.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A developer wants to write a rail"]):::plain
    MID(["a RAILS.md documents hooks and lifecycle"]):::plain
    START --> MID
    MID -->|"reason: public docs + examples exist"| OUT(["They can start from documentation"]):::fix
    OUT --> DONE(["first rail works on the first try"]):::ok
```

Concern: [Rails & Context API](README.md).
