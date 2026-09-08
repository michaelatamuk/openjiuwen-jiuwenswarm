---

# You aren't told when a subsystem fails

*Concern: Health & Degradation*

---

## The problem today

When a non-critical subsystem fails — memory provider down, OTel exporter unreachable, a channel fails to init — the system keeps running but the user gets no notice and assumes memory is being saved when it isn't. `config.py:84` logs this at DEBUG.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A subsystem starts failing"]):::plain
    MID(["nothing surfaces to the user"]):::plain
    START --> MID
    MID -->|"reason: failures are logged only at DEBUG"| OUT(["The user assumes all is fine"]):::fail
    OUT --> DONE(["memory/tracing silently stop without notice"]):::fail
```

---

## The proposed fix

A persistent health indicator in the Web UI (a small dot in the sidebar/bottom bar): green = all nominal, yellow = a subsystem degraded (click for details), red = agent unreachable. Hover/click shows "Memory: degraded (disk full). OTel: offline." The same state should be printed to the startup log stream so log-monitored deployments see it. Related: [startup validation](../startup-and-config/1-wrong-credentials-surface-only-on-the-first-chat-never-at-startup.md).

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A subsystem starts failing"]):::plain
    MID(["a health dot turns yellow with details"]):::plain
    START --> MID
    MID -->|"reason: health is surfaced in the UI and startup log"| OUT(["The user/operator sees the degradation"]):::fix
    OUT --> DONE(["can respond instead of assuming all is fine"]):::ok
```
