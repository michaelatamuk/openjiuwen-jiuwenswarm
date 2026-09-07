[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# No local stub or dev mode for testing integrations

*Concern: Integration & Local Development*

---

## The problem today

Testing an integration means running the full real stack (agent + gateway + model API) — slow, expensive, and non-deterministic; there's no stub, echo mode, playback, or Docker Compose for CI.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A developer tests an integration"]):::plain
    MID(["they must run the full real stack"]):::plain
    START --> MID
    MID -->|"reason: no stub or dev mode exists"| OUT(["Tests are slow and non-deterministic"]):::fail
    OUT --> DONE(["the dev loop is painful"]):::fail
```

---

## The proposed fix

A `jiuwenswarm-dev --stub` mode serving canned replies with no LLM/keys, plus a Docker Compose file for the real stack in one command.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A developer tests an integration"]):::plain
    MID(["a stub gateway answers with canned replies"]):::plain
    START --> MID
    MID -->|"reason: a dev mode exists"| OUT(["Tests are fast and deterministic"]):::fix
    OUT --> DONE(["the dev loop is smooth"]):::ok
```

Concern: [Integration & Local Development](README.md).
