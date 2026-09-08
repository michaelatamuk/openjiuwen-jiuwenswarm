---

# Skill updates can't be reviewed or rolled back

*Concern: Skill Versioning*

---

## The problem today

When a skill is updated (manually or by evolution), the old version isn't kept — a break forces reconstructing the previous SKILL.md.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A skill is updated"]):::plain
    MID(["the previous version is lost"]):::plain
    START --> MID
    MID -->|"reason: no version history is kept"| OUT(["A bad update can't be undone"]):::fail
    OUT --> DONE(["the author rebuilds it by hand"]):::fail
```

---

## The proposed fix

Git-style history per skill with one-click rollback; when the evolution system changes a skill, show the diff for approval before committing.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A skill is updated"]):::plain
    MID(["history is kept and rollback is one click"]):::plain
    START --> MID
    MID -->|"reason: each save makes a version record"| OUT(["A bad update is undone instantly"]):::fix
    OUT --> DONE(["the author stays safe"]):::ok
```
