---

# Default permissions are off, contradicting the README

*Concern: Running & Managing the Instance*

---

## The problem today

All shipped config templates set `permissions.enabled: false`, so a user who reads the README believes tools are gated when they are not. Tiered policy and Smart Approval are dark on a fresh install.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user reads the README"]):::plain
    MID(["it implies tools are gated by default"]):::plain
    START --> MID
    MID -->|"reason: templates set permissions.enabled:false"| OUT(["Tools run ungated on a fresh install"]):::fail
    OUT --> DONE(["the safety story is contradicted by the default"]):::fail
```

---

## The proposed fix

Either enable permissions by default with a safe baseline (ASK for risky actions, ALLOW for reads), or state the disabled default explicitly in the README and warn on first run. Tiered policy and Smart Approval should be visible, not dark.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user reads the README"]):::plain
    MID(["the default matches what the README claims"]):::plain
    START --> MID
    MID -->|"reason: permissions default to a safe baseline"| OUT(["Risky tools prompt before running"]):::fix
    OUT --> DONE(["the documented safety story holds"]):::ok
```
