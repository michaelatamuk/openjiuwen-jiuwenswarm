[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# No shared skill library across instances

*Concern: Shared Skill Library*

---

## The problem today

Skills are per-workspace; two operators can't share a skill across instances without manually copying files. This is about sharing skills **across separate instances**, which is a different axis from scoping skills *per user within one instance* (that is the multi-tenancy concern).

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["Two teams want to share a skill"]):::plain
    MID(["they must copy files manually"]):::plain
    START --> MID
    MID -->|"reason: no shared registry exists"| OUT(["Sharing is manual and error-prone"]):::fail
    OUT --> DONE(["skills don't propagate"]):::fail
```

---

## The proposed fix

A `.skill.zip` export/import format and a shared skill registry to publish and pull from — surfaced as the primary distribution mechanism.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["Two teams want to share a skill"]):::plain
    MID(["a registry lets them publish and pull"]):::plain
    START --> MID
    MID -->|"reason: export/import + registry exist"| OUT(["Skills propagate between teams"]):::fix
    OUT --> DONE(["reuse is easy"]):::ok
```

Concern: [Shared Skill Library](README.md).
