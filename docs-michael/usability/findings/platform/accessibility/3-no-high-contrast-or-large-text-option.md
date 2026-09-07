[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# No high-contrast or large-text option

*Concern: Accessibility & Keyboard*

---

## The problem today

The UI has light/dark but no high-contrast theme, no font-size controls, and no zoom-safe layout testing.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user needs more contrast or larger text"]):::plain
    MID(["no such option exists"]):::plain
    START --> MID
    MID -->|"reason: contrast/font settings are missing"| OUT(["The UI is hard or impossible to read"]):::fail
    OUT --> DONE(["the user is excluded"]):::fail
```

---

## The proposed fix

Respect `prefers-contrast: more` and `prefers-reduced-motion`; use `rem` units so browser font-size preferences apply.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user needs more contrast or larger text"]):::plain
    MID(["the OS contrast/font preferences are honoured"]):::plain
    START --> MID
    MID -->|"reason: relative units + media queries are used"| OUT(["The UI adapts to their needs"]):::fix
    OUT --> DONE(["the user can read comfortably"]):::ok
```

Concern: [Accessibility & Keyboard](README.md).
