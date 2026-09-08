---

# The web UI isn't usable as a proper mobile experience

*Concern: Mobile & Cross-Device*

---

## The problem today

`useResponsive.ts` has breakpoints, but the 3-panel architecture collapses poorly on a 375px screen.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user opens the Web UI on a phone"]):::plain
    MID(["the 3-panel layout collapses awkwardly"]):::plain
    START --> MID
    MID -->|"reason: mobile is only a fallback"| OUT(["The UI is cramped and hard to use"]):::fail
    OUT --> DONE(["mobile users struggle"]):::fail
```

---

## The proposed fix

Treat mobile as a real use case: input docked to the bottom, conversation fills the viewport, panels open via a bottom sheet or drawer on a 375px screen.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user opens the Web UI on a phone"]):::plain
    MID(["the layout fits a 375px viewport"]):::plain
    START --> MID
    MID -->|"reason: mobile is first-class"| OUT(["The UI is comfortable on a phone"]):::fix
    OUT --> DONE(["mobile users work easily"]):::ok
```
