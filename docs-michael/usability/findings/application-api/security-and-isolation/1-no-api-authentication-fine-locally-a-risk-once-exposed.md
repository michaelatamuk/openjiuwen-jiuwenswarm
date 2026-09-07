[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# No API authentication: fine locally, a real risk once exposed

*Concern: Connection Security*

---

## The problem today

`E2AAuth` is carried but never validated — anyone reaching the WebSocket port can send any request. This is acceptable for a personal agent installed on your own machine, where the only protection needed is not exposing the port; it becomes a real risk only once the instance is reachable beyond localhost (a shared bot, a deployed or multi-user instance, or another device on the network).

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["An app connects to the gateway"]):::plain
    MID(["no credential is checked"]):::plain
    START --> MID
    MID -->|"reason: E2AAuth is never validated"| OUT(["Anyone reaching the port has full access"]):::fail
    OUT --> DONE(["exposing it to the internet is unsafe"]):::fail
```

---

## The proposed fix

A configurable gateway auth gate (`none` / `api_key` / `bearer`) that rejects unauthenticated connections at the WebSocket handshake (401), not after.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["An app connects to the gateway"]):::plain
    MID(["a configurable auth gate checks the key"]):::plain
    START --> MID
    MID -->|"reason: authentication fails at handshake"| OUT(["Only authorized apps connect"]):::fix
    OUT --> DONE(["the API can be exposed safely"]):::ok
```

Concern: [Connection Security](README.md).
