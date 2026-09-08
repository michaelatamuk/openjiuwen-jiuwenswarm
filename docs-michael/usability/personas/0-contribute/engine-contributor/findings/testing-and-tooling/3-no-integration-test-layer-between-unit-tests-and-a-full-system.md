---

# No integration test layer between unit tests and a full system

*Concern: Extension Testing & Tooling*

---

## The problem today

There's unit tests (mocked) and full end-to-end, but nothing in between — testing a rail that touches prompt builder, tools, and results requires fragile mock-response sequencing.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A developer tests a multi-part rail"]):::plain
    MID(["only fragile mock sequencing works"]):::plain
    START --> MID
    MID -->|"reason: no mid-level test layer exists"| OUT(["A wrong mock order passes for the wrong reason"]):::fail
    OUT --> DONE(["integration bugs slip through"]):::fail
```

---

## The proposed fix

A higher-level integration helper (e.g. `run_agent_with_rail`) that hides mock sequencing and runs the real interactions.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A developer tests a multi-part rail"]):::plain
    MID(["an integration helper runs real interactions"]):::plain
    START --> MID
    MID -->|"reason: a mid-level test layer exists"| OUT(["The rail is tested as a whole"]):::fix
    OUT --> DONE(["integration bugs are caught"]):::ok
```
