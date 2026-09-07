[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# The agent factory has too many undocumented parameters

*Concern: Tools & Agent Factory*

---

## The problem today

`create_deep_agent()` takes 15+ parameters with no docs on which are required, what `sys_operation`/`workspace` mean, or how passing `tools` differs from a rail.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A developer creates an agent"]):::plain
    MID(["the factory's 15+ params are unexplained"]):::plain
    START --> MID
    MID -->|"reason: no tiered docs exist"| OUT(["They can't assemble a valid call"]):::fail
    OUT --> DONE(["agents are misconfigured or fail"]):::fail
```

---

## The proposed fix

A tiered guide — minimum invocation, + workspace/rails, + subagents/sys_operation — and an inline docstring covering each parameter.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A developer creates an agent"]):::plain
    MID(["a tiered guide explains each parameter"]):::plain
    START --> MID
    MID -->|"reason: required vs optional is documented"| OUT(["They build the right invocation"]):::fix
    OUT --> DONE(["agents start correctly"]):::ok
```

Concern: [Tools & Agent Factory](README.md).
