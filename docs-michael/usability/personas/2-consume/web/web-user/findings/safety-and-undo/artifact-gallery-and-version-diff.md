---

# Can't compare versions of a generated artifact

*Concern: Safety & Undo*

---

## The problem today

Artifacts render one at a time, with no gallery and no version-to-version diff when the agent revises the same document.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The agent revises a document it made before"]):::plain
    MID(["each version renders in isolation"]):::plain
    START --> MID
    MID -->|"reason: no gallery or diff tracks versions"| OUT(["The user can't see what changed"]):::fail
    OUT --> DONE(["revising risks silently losing content"]):::fail
```

---

## The proposed fix

Keep every revision of an artifact and add a gallery view plus a version-to-version diff, so the user can compare any two revisions and see exactly what the agent changed.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The agent revises a document it made before"]):::plain
    MID(["a gallery lists versions with a diff view"]):::plain
    START --> MID
    MID -->|"reason: revisions are versioned and diffable"| OUT(["The user reviews each change"]):::fix
    OUT --> DONE(["revisions are safe and reversible"]):::ok
```
