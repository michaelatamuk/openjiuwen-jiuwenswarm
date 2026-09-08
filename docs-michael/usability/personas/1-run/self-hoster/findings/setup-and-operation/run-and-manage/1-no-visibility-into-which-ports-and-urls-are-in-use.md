---

# No visibility into which ports and URLs are in use

*Concern: Running & Managing the Instance*

---

## The problem today

After `jiuwenswarm-start --name alice` there is no output telling you which ports were assigned, which URL to open, or what is running; port conflicts fall back silently.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["An operator starts an instance"]):::plain
    MID(["no output lists ports or URLs"]):::plain
    START --> MID
    MID -->|"reason: startup gives no running summary"| OUT(["The operator doesn't know what's where"]):::fail
    OUT --> DONE(["conflicts happen silently"]):::fail
```

---

## The proposed fix

Print a clear startup summary (agent server / gateway / web UI URLs), and on a port conflict show the offending PID and the exact command to stop it or use another base port.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["An operator starts an instance"]):::plain
    MID(["startup prints ports and URLs clearly"]):::plain
    START --> MID
    MID -->|"reason: a run summary and conflict guidance exist"| OUT(["The operator knows what's running"]):::fix
    OUT --> DONE(["resolves conflicts with one command"]):::ok
```
