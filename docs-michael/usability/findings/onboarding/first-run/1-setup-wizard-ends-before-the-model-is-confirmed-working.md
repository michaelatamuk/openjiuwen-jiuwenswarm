[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# Setup wizard ends before the model is confirmed working

*Concern: First Run*

---

## The problem today

`ModelSetupGuide.tsx` runs a 3-step tour that ends at the models panel. The user must figure out credentials alone, and a misconfigured model only errors on the first chat.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A new user runs the wizard"]):::plain
    MID(["it ends before the model is confirmed"]):::plain
    START --> MID
    MID -->|"reason: credentials are never tested inline"| OUT(["A wrong key fails only on the first chat"]):::fail
    OUT --> DONE(["the new user is stuck at step one"]):::fail
```

---

## The proposed fix

The wizard finishes only after one successful message, every step testable inline: welcome, choose provider, enter key with a live "Test connection" ✓/✗, optional channel setup, then a prefilled first message. Re-enterable from a `?` icon.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A new user runs the wizard"]):::plain
    MID(["it confirms the model works before finishing"]):::plain
    START --> MID
    MID -->|"reason: a live 'Test connection' validates the key"| OUT(["The model is confirmed working"]):::fix
    OUT --> DONE(["the user reaches first success in one pass"]):::ok
```

Concern: [First Run](README.md).
