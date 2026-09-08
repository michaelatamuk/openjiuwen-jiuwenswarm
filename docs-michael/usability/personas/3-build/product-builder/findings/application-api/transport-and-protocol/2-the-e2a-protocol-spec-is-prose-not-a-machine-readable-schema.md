---

# The E2A protocol spec is prose, not a machine-readable schema

*Concern: Transport & Protocol*

---

## The problem today

The E2A spec lives in two Markdown files with no JSON Schema, AsyncAPI spec, or type stubs — clients must cross-reference prose against the source dataclasses, and there's no structured changelog.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["An app implements an E2A client"]):::plain
    MID(["the spec is only prose"]):::plain
    START --> MID
    MID -->|"reason: no machine-readable schema exists"| OUT(["They cross-reference source to get types"]):::fail
    OUT --> DONE(["spec and code drift apart"]):::fail
```

---

## The proposed fix

An AsyncAPI 3.0 spec (`e2a-asyncapi.yaml`) describing schemas, methods, error codes, and streaming — usable to auto-generate SDKs and the ground truth that prevents drift.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["An app implements an E2A client"]):::plain
    MID(["an AsyncAPI spec defines everything"]):::plain
    START --> MID
    MID -->|"reason: the protocol is machine-readable"| OUT(["They generate clients from the spec"]):::fix
    OUT --> DONE(["spec and code stay in sync"]):::ok
```
