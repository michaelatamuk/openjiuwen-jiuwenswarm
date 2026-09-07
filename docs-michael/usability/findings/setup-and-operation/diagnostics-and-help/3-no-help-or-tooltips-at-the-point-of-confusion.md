[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# No help or tooltips at the point of confusion

*Concern: Diagnostics & Support*

---

## The problem today

Beyond a generic `HelpTips.tsx` and channel guide links there is no contextual help — no tooltips on complex fields, no "?" icons opening relevant docs.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user is stuck on a field"]):::plain
    MID(["no help is available at that spot"]):::plain
    START --> MID
    MID -->|"reason: only generic help exists"| OUT(["The user can't find the answer in place"]):::fail
    OUT --> DONE(["leaves the settings or guesses"]):::fail
```

---

## The proposed fix

Every non-obvious settings field gets a `?` icon opening a popover: what it does, where to find the value (e.g. the Feishu console), and a link to the full documentation.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user is stuck on a field"]):::plain
    MID(["a ? icon opens a contextual popover"]):::plain
    START --> MID
    MID -->|"reason: every field has inline help"| OUT(["The user is helped at the point of confusion"]):::fix
    OUT --> DONE(["understands the field without leaving"]):::ok
```

Concern: [Diagnostics & Support](README.md).
