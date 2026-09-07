[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# No login on the Web UI: local Web users share one identity

*Concern: Identity & Isolation*

---

## The problem today

The Web UI has no login, so everyone who uses a given Web UI instance shares the same (empty) identity, its sessions, and its memory. This is not true across the system as a whole: channel users (Feishu/Telegram/WeChat) are carried with distinct `user_id`s, which the server scopes sessions and memory by. The gap is specifically the no-login Web surface — it becomes a problem only when more than one person uses the same Web instance.

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
