---

# English docs show the Chinese UI

*Concern: Documentation*

---

## The problem today

55 of 144 image references in `docs/en` point at screenshots of the Chinese interface — on exactly the pages a reader views before deciding to adopt.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["An English reader opens docs/en"]):::plain
    MID(["the screenshots show a Chinese UI"]):::plain
    START --> MID
    MID -->|"reason: images were captured in zh and reused"| OUT(["The product looks untranslated"]):::fail
    OUT --> DONE(["adoption confidence drops"]):::fail
```

---

## The proposed fix

Regenerate the English screenshots from an English instance, and add a docs check that fails when a `docs/en` image was produced under a non-English locale. Where a feature has no English UI yet, say so in text instead of showing the Chinese screen.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["An English reader opens docs/en"]):::plain
    MID(["screenshots match the English UI"]):::plain
    START --> MID
    MID -->|"reason: images are captured per locale"| OUT(["The docs read as a finished product"]):::fix
    OUT --> DONE(["adoption confidence rises"]):::ok
```
