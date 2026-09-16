---

# Nothing verifies the model before the first conversation

*Concern: Startup & Configuration*

---

## The problem today

Setup never gates on a real model completion, and `jiuwenswarm-init` never touches model config at all. Model-config errors are therefore pushed into first use instead of being caught at write time.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["Setup writes the model config"]):::plain
    MID(["no completion is ever run"]):::plain
    START --> MID
    MID -->|"reason: init never tests the model"| OUT(["The first chat fails"]):::fail
    OUT --> DONE(["the user debugs credentials mid-task"]):::fail
```

---

## The proposed fix

Add a verification step to setup/init that runs a single tiny completion against the configured model and blocks with an actionable error (bad key, bad base URL, unreachable endpoint) before declaring setup complete.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["Setup writes the model config"]):::plain
    MID(["a tiny completion confirms the model"]):::plain
    START --> MID
    MID -->|"reason: init tests connectivity inline"| OUT(["Errors surface during setup"]):::fix
    OUT --> DONE(["the first chat is known to work"]):::ok
```
