[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# No multi-tenancy: every user shares one workspace

*Concern: Identity & Isolation*

---

## The problem today

jiuwenswarm is single-workspace: `user_id` is only for logging/routing, so two users share memory and can see each other's sessions. This blocks multi-user products (the workaround is one instance per user).

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A product needs per-user data"]):::plain
    MID(["two users share one workspace"]):::plain
    START --> MID
    MID -->|"reason: no user_id isolation exists"| OUT(["Users see each other's sessions/memory"]):::fail
    OUT --> DONE(["the multi-user product is blocked"]):::fail
```

---

## The proposed fix

A `user_id`-scoped isolation layer: sessions, memory (`USER.md`/`MEMORY.md`), and (optionally) skills scoped per user via namespace prefixes like `~/.jiuwenswarm/users/{user_id}/sessions/` — no separate processes.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A product needs per-user data"]):::plain
    MID(["each user's data is namespaced"]):::plain
    START --> MID
    MID -->|"reason: user_id scopes sessions and memory"| OUT(["Users can't see each other's data"]):::fix
    OUT --> DONE(["the multi-user product works"]):::ok
```

Concern: [Identity & Isolation](README.md).
