[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# Writing a custom channel has no developer guide

*Concern: Integration & Local Development*

---

## The problem today

`BaseChannel` is a clean interface with 11 built-in reference channels, but there's no `CHANNELS.md` — registration, the lifecycle contract, and the `Message`/`E2AEnvelope` relationship are all undocumented.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A developer adds a custom channel"]):::plain
    MID(["no guide explains registration or lifecycle"]):::plain
    START --> MID
    MID -->|"reason: BaseChannel is undocumented"| OUT(["They reverse-engineer a built-in channel"]):::fail
    OUT --> DONE(["custom channels are slow to build"]):::fail
```

---

## The proposed fix

A `CHANNELS.md` with when-to-write guidance, the full lifecycle, a minimal ~80-line example, registration, and the `RoutingTarget` model.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A developer adds a custom channel"]):::plain
    MID(["a CHANNELS.md guides the full lifecycle"]):::plain
    START --> MID
    MID -->|"reason: registration and lifecycle are documented"| OUT(["They build a channel from the guide"]):::fix
    OUT --> DONE(["custom channels integrate cleanly"]):::ok
```

Concern: [Integration & Local Development](README.md).
