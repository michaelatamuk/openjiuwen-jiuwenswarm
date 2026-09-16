---

# The SDK has no reference cron backend

*Concern: Integration & Tooling*

---

## The problem today

The SDK exposes only the `CronToolBackend` protocol and `create_cron_tools`, so a third party building on the SDK alone gets cron tools the model can call but nothing that actually runs them.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A builder uses the SDK directly"]):::plain
    MID(["only the CronToolBackend protocol is exported"]):::plain
    START --> MID
    MID -->|"reason: no reference backend ships with the SDK"| OUT(["Cron tools exist but nothing schedules them"]):::fail
    OUT --> DONE(["the cron feature is effectively broken"]):::fail
```

---

## The proposed fix

Ship a reference cron backend with the SDK — a simple scheduler that implements `CronToolBackend`, persists jobs, and executes them — so the protocol is usable out of the box and serves as the template for custom implementations.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A builder uses the SDK directly"]):::plain
    MID(["a reference cron backend ships alongside the protocol"]):::plain
    START --> MID
    MID -->|"reason: the scheduler implements CronToolBackend"| OUT(["Cron tools run without custom code"]):::fix
    OUT --> DONE(["the builder swaps in their own backend later"]):::ok
```
