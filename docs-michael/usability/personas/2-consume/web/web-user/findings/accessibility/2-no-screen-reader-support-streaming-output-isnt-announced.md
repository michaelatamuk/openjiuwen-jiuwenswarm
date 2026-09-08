---

# No screen-reader support; streaming output isn't announced

*Concern: Accessibility & Keyboard*

---

## The problem today

No `aria-label`, `aria-live`, or `role` attributes are visible; streaming text has no `aria-live` region, so screen readers don't announce new content.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A screen-reader user gets an answer"]):::plain
    MID(["streaming text is never announced"]):::plain
    START --> MID
    MID -->|"reason: no aria-live region exists"| OUT(["The output is invisible to them"]):::fail
    OUT --> DONE(["they miss the response entirely"]):::fail
```

---

## The proposed fix

Make the streaming area `aria-live="polite"`, announce tool success/failure via `aria-live="assertive"`, add `aria-label` to icon-only buttons, and run an axe-core/Lighthouse audit.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A screen-reader user gets an answer"]):::plain
    MID(["streaming text is announced as it arrives"]):::plain
    START --> MID
    MID -->|"reason: an aria-live region exists"| OUT(["The user hears the output"]):::fix
    OUT --> DONE(["screen readers keep up"]):::ok
```
