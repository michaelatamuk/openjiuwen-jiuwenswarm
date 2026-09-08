---

# External apps can only reach the agent over WebSocket, with no REST

*Concern: Transport & Protocol*

---

## The problem today

jiuwenswarm's external interface is E2A over WebSocket only — there is no HTTP REST API, so even a one-shot request needs full WebSocket machinery (async, reconnect, multiplexing).

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["An app sends one request"]):::plain
    MID(["it must hold a WebSocket connection"]):::plain
    START --> MID
    MID -->|"reason: no REST endpoint exists"| OUT(["REST-native apps face a big barrier"]):::fail
    OUT --> DONE(["simple automation is over-engineered"]):::fail
```

---

## The proposed fix

A thin REST wrapper for single-shot cases: `POST /api/chat`, `GET /api/sessions`, `GET /api/sessions/:id/history` — the gateway translates REST into E2A; WebSocket stays for streaming.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["An app sends one request"]):::plain
    MID(["a REST endpoint answers it simply"]):::plain
    START --> MID
    MID -->|"reason: the gateway bridges REST and E2A"| OUT(["One-shot calls need no WebSocket"]):::fix
    OUT --> DONE(["simple integrations become trivial"]):::ok
```
