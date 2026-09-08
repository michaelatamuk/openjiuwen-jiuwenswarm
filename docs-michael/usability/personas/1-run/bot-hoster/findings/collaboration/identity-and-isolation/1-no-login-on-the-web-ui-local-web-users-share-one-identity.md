---

# No login on the Web UI: local Web users share one identity

*Concern: Identity & Isolation*

---

## The problem today

The Web UI has no login, so everyone who opens a given instance shares one **empty** identity — the same sessions, memory, and channel-less context. This affects the Web surface only: channel users (Feishu/Telegram/WeChat) already carry a distinct `user_id` that the server scopes by. The gap is that the Web UI gives a person no identity at all, so it only becomes a problem when more than one person uses the same Web instance.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["Several people open the same Web UI"]):::plain
    MID(["they all share one empty identity"]):::plain
    START --> MID
    MID -->|"reason: the Web UI has no login"| OUT(["one person's sessions/memory are visible to another"]):::fail
    OUT --> DONE(["no way to tell Web users apart"]):::fail
```

---

## The proposed fix

Give the Web UI a per-user identity (login), so each person on a shared Web instance is a distinct user with their own sessions and memory. For a personal local instance (one user) no login is fine; the fix matters only when several people use the same Web UI.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["Several people open the same Web UI"]):::plain
    MID(["each Web user logs in to their own identity"]):::plain
    START --> MID
    MID -->|"reason: the Web UI assigns a per-user identity"| OUT(["each user sees only their own sessions/memory"]):::fix
    OUT --> DONE(["Web users are distinguishable"]):::ok
```

Scoping the `user_id` that channel/API requests already carry is a separate, broader problem — see [No multi-tenancy: every user shares one workspace](2-no-multi-tenancy-every-user-shares-one-workspace.md).
