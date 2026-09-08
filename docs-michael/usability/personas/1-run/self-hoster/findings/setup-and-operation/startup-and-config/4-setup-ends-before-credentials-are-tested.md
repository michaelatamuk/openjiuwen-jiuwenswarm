---

# Setup ends before credentials are tested

*Concern: Startup & Configuration*

---

## The problem today

`ModelSetupGuide.tsx` runs a 3-step spotlight tour that ends at the models panel. The user must fill in API key/base/model themselves; a wrong value isn't caught until the first chat.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A new user runs the setup wizard"]):::plain
    MID(["it ends at the models panel"]):::plain
    START --> MID
    MID -->|"reason: no credential test runs inline"| OUT(["A wrong key isn't caught until chat"]):::fail
    OUT --> DONE(["the user is stuck with no validation"]):::fail
```

---

## The proposed fix

The wizard should not finish until the model works: choose a provider, enter the API key, press "Test" for a live ✓/✗, optionally set up a channel the same way, then "Start your first conversation". Re-enterable from a `?` icon.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A new user runs the setup wizard"]):::plain
    MID(["it tests credentials inline before finishing"]):::plain
    START --> MID
    MID -->|"reason: a 'Test' button validates the key"| OUT(["The model is confirmed working"]):::fix
    OUT --> DONE(["the user proceeds past setup confidently"]):::ok
```
