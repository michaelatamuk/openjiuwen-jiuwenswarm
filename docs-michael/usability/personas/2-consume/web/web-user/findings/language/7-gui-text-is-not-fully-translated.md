---

# GUI text is not fully translated

*Concern: Running & Managing the Instance*

---

## The problem today

Even when the UI language is set to English, parts of the interface still appear in Chinese. Several user-facing components contain hardcoded Simplified-Chinese literals instead of reading the locale files, so translation coverage is incomplete rather than a single surface being ignored.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The user switches the UI to English"]):::plain
    MID(["parts of the GUI still show Chinese"]):::plain
    START --> MID
    MID -->|"reason: not every user-facing string goes through i18n"| OUT(["The interface mixes languages"]):::fail
    OUT --> DONE(["some controls are unreadable in English"]):::fail
```

---

## The proposed fix

Make i18n coverage complete: route every user-facing string through the locale files (en/zh), so choosing English (or Chinese) applies consistently across the whole interface with no hardcoded literals left.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The user switches the UI to English"]):::plain
    MID(["every string now follows the chosen locale"]):::plain
    START --> MID
    MID -->|"reason: all user-facing text goes through i18n"| OUT(["The whole interface matches the language"]):::fix
    OUT --> DONE(["no untranslated controls remain"]):::ok
```
