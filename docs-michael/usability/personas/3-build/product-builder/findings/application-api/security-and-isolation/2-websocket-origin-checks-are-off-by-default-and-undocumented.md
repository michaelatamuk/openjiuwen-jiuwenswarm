---

# WebSocket origin checks are off by default and undocumented

*Concern: Connection Security*

---

## The problem today

Origin validation is controlled by two undocumented env vars and is off by default — any origin can connect, so an XSS on any co-served page gets unrestricted WebSocket access.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A browser page connects to the WebSocket"]):::plain
    MID(["no origin is checked"]):::plain
    START --> MID
    MID -->|"reason: origin validation is off by default"| OUT(["Any origin gets agent access"]):::fail
    OUT --> DONE(["an XSS anywhere gains full access"]):::fail
```

---

## The proposed fix

Promote `allowed_origins` to config.yaml and print a startup warning when it's unset and the server isn't loopback-bound.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A browser page connects to the WebSocket"]):::plain
    MID(["allowed origins are enforced"]):::plain
    START --> MID
    MID -->|"reason: origin config is first-class"| OUT(["Only listed origins can connect"]):::fix
    OUT --> DONE(["cross-origin access is closed"]):::ok
```
