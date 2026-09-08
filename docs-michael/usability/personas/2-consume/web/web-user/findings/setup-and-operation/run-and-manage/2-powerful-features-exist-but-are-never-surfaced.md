---

# Powerful features exist but are never surfaced

*Concern: Running & Managing the Instance*

---

## The problem today

Trajectory UI, OTel tracing, debug traces, coding memory, and the SSH channel exist but are off by default with no hint anywhere in the UI or startup output.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A capable feature exists"]):::plain
    MID(["it is disabled and never mentioned"]):::plain
    START --> MID
    MID -->|"reason: no discoverability for opt-in features"| OUT(["The user never learns it exists"]):::fail
    OUT --> DONE(["powerful capabilities go unused"]):::fail
```

---

## The proposed fix

A "Feature Discovery" section in Web UI settings listing opt-in features with a description and toggle, plus startup tips like "trajectory UI is available — enable `trajectory_ui.enabled`".

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A capable feature exists"]):::plain
    MID(["a Feature Discovery panel lists it with a toggle"]):::plain
    START --> MID
    MID -->|"reason: opt-in features are surfaced"| OUT(["The user discovers and enables it"]):::fix
    OUT --> DONE(["capabilities get used"]):::ok
```
