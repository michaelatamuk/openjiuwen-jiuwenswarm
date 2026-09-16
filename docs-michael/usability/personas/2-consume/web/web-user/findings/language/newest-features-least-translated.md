---

# The newest features are the least translated

*Concern: Language*

---

## The problem today

About 366 Chinese string literals sit outside the locale bundles, clustered in recent work (trajectory, code mode, team area, slash registry). The differentiating features therefore read as untranslated.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["New feature code is written"]):::plain
    MID(["strings are inlined in Chinese, not in locales"]):::plain
    START --> MID
    MID -->|"reason: nothing enforces locale-bundle usage"| OUT(["The newest features show Chinese to en users"]):::fail
    OUT --> DONE(["the best features look unfinished"]):::fail
```

---

## The proposed fix

Move the inlined literals into the locale bundles, and add a lint check that fails CI on raw CJK string literals in UI/feature source so new code cannot reintroduce them.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["New feature code is written"]):::plain
    MID(["strings must go through locale bundles"]):::plain
    START --> MID
    MID -->|"reason: CI lint rejects raw CJK literals"| OUT(["New features are translated like the rest"]):::fix
    OUT --> DONE(["localization keeps pace with development"]):::ok
```
