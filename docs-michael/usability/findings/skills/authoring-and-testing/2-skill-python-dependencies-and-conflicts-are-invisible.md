[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# Skill Python dependencies and conflicts are invisible

*Concern: Skill Authoring & Dependencies*

---

## The problem today

Skills may have a `requirements.txt`, installed at load time, but there's no UI showing which skills have deps, whether they're installed, or whether two conflict.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A skill needs Python packages"]):::plain
    MID(["their install state is invisible"]):::plain
    START --> MID
    MID -->|"reason: no dependency panel exists"| OUT(["A skill silently breaks or conflicts"]):::fail
    OUT --> DONE(["the user can't see why"]):::fail
```

---

## The proposed fix

A per-skill dependency panel: required packages, installed status, version conflicts; an "Install dependencies" button that runs in the background with progress.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A skill needs Python packages"]):::plain
    MID(["a dependency panel shows state and conflicts"]):::plain
    START --> MID
    MID -->|"reason: dependencies are visible per skill"| OUT(["The user sees and fixes deps"]):::fix
    OUT --> DONE(["skills run without surprises"]):::ok
```

Concern: [Skill Authoring & Dependencies](README.md).
