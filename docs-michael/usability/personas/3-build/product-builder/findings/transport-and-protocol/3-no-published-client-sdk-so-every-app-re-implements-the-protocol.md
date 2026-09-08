---

# No published client SDK, so every app re-implements the protocol

*Concern: Transport & Protocol*

---

## The problem today

The only client (`WebSocketAgentServerClient`) is internal and unpublished; every external app must copy it or implement E2A from scratch, and JS/TS has no reference at all.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["An app wants to talk E2A"]):::plain
    MID(["no SDK is published"]):::plain
    START --> MID
    MID -->|"reason: the only client is internal"| OUT(["Every app re-implements the protocol"]):::fail
    OUT --> DONE(["integrations are duplicated and fragile"]):::fail
```

---

## The proposed fix

Publish `jiuwenswarm-client` (PyPI) and `@jiuwenswarm/client` (npm), generated from the [E2A AsyncAPI spec](2-the-e2a-protocol-spec-is-prose-not-a-machine-readable-schema.md) so they stay in sync.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["An app wants to talk E2A"]):::plain
    MID(["a published SDK wraps the protocol"]):::plain
    START --> MID
    MID -->|"reason: clients are generated from the spec"| OUT(["Apps use a maintained SDK"]):::fix
    OUT --> DONE(["no one re-implements E2A"]):::ok
```
