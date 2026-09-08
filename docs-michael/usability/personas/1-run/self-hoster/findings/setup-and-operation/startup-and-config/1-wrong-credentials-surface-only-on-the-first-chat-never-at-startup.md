---

# Wrong credentials surface only on the first chat, never at startup

*Concern: Startup & Configuration*

---

## The problem today

Model credentials and channel tokens are never validated at startup. `jiuwenswarm-init` completes, the web UI loads, and the first failure only appears on the first chat message; a wrong `app_secret`/`bot_token` fails silently.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The operator starts jiuwenswarm"]):::plain
    MID(["nothing checks the credentials at startup"]):::plain
    START --> MID
    MID -->|"reason: no startup validation exists"| OUT(["The first failure appears on the first chat"]):::fail
    OUT --> DONE(["an operator finds out from a user report"]):::fail
```

---

## The proposed fix

A startup health check before the first request: validate model config (test request, HTTP 200), each enabled channel (token format/test call), workspace permissions, and optional deps. Print a health report to stdout.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The operator starts jiuwenswarm"]):::plain
    MID(["a health check validates model + channels"]):::plain
    START --> MID
    MID -->|"reason: a startup report prints ✓/✗/⚠"| OUT(["Broken credentials are caught at startup"]):::fix
    OUT --> DONE(["the operator fixes them before anyone chats"]):::ok
```
