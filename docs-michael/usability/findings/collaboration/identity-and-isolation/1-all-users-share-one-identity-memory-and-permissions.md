[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# All users share one identity, memory and permissions

*Concern: Identity & Isolation*

---

## The problem today

The Web UI has no login — everyone shares one identity, memory, and skills; there's no "this belongs to user A, not B."

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["Several people use one instance"]):::plain
    MID(["they all share identity, memory, skills"]):::plain
    START --> MID
    MID -->|"reason: no per-user separation exists"| OUT(["One user's context bleeds into another's"]):::fail
    OUT --> DONE(["conversations and memory collide"]):::fail
```

---

## The proposed fix

For shared/channel deployments, isolate memory and permissions per user. The channel integration already passes `user_id` — plumb it into memory and permission scoping.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["Several people use one instance"]):::plain
    MID(["each user gets isolated memory + permissions"]):::plain
    START --> MID
    MID -->|"reason: the passed user_id is scoped"| OUT(["Each user sees only their own data"]):::fix
    OUT --> DONE(["no cross-user bleed"]):::ok
```

Concern: [Identity & Isolation](README.md).
