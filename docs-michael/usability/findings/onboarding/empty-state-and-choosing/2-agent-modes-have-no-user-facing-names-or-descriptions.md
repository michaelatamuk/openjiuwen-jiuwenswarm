[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# Agent modes have no user-facing names or descriptions

*Concern: Empty States & Choosing a Mode*

---

## The problem today

Modes — `agent`, `code`, `cluster`, `team`, `agent.plan`, `agent.fast` — are named from the implementation. The selector has no tooltip or one-liner, so a new user can't choose informedly.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user must pick a mode"]):::plain
    MID(["the names are internal and unexplained"]):::plain
    START --> MID
    MID -->|"reason: no descriptions exist for the modes"| OUT(["The user can't tell modes apart"]):::fail
    OUT --> DONE(["picks arbitrarily or gives up"]):::fail
```

---

## The proposed fix

Name modes by the user's goal (Standard / Fast / Plan first / Code / Multi-agent / Team) with a one-liner each, shown on hover, plus a first-time recommendation ("try Standard").

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user must pick a mode"]):::plain
    MID(["friendly names and one-liners describe each"]):::plain
    START --> MID
    MID -->|"reason: modes are explained on hover"| OUT(["The user understands the choice"]):::fix
    OUT --> DONE(["picks the right mode"]):::ok
```

Concern: [Empty States & Choosing a Mode](README.md).
