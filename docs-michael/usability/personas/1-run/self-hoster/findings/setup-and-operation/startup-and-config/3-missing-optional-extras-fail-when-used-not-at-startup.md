---

# Missing optional extras fail when used, not at startup

*Concern: Startup & Configuration*

---

## The problem today

SSH needs `jiuwenswarm[ssh]`; TUI needs `jiuwenswarm-tui`. Neither is checked at startup, so the error appears only when the operator enables the feature.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A feature is enabled in config"]):::plain
    MID(["its optional dependency is missing"]):::plain
    START --> MID
    MID -->|"reason: no check happens at startup"| OUT(["The error appears only when used"]):::fail
    OUT --> DONE(["the operator discovers it mid-use"]):::fail
```

---

## The proposed fix

`jiuwenswarm-start` checks all optional dependencies referenced in config and warns at startup with the install command and that the feature is disabled until installed.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A feature is enabled in config"]):::plain
    MID(["startup warns about the missing dependency"]):::plain
    START --> MID
    MID -->|"reason: optional deps are checked at boot"| OUT(["The operator is told at startup"]):::fix
    OUT --> DONE(["installs it before relying on the feature"]):::ok
```
