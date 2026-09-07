[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# Session API methods have no documented response shapes

*Concern: Transport & Protocol*

---

## The problem today

The E2A session lifecycle (~30 methods) has no documented request/response shapes — a developer must read `session_metadata.py` to learn what `session.create` returns.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["An app calls session.create"]):::plain
    MID(["its response shape is undocumented"]):::plain
    START --> MID
    MID -->|"reason: no method reference exists"| OUT(["They read source to learn the shape"]):::fail
    OUT --> DONE(["calls are written against guesses"]):::fail
```

---

## The proposed fix

A method reference (or the [E2A AsyncAPI spec](2-the-e2a-protocol-spec-is-prose-not-a-machine-readable-schema.md)) listing every method's params and response data.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["An app calls session.create"]):::plain
    MID(["the response shape is documented"]):::plain
    START --> MID
    MID -->|"reason: a method reference exists"| OUT(["They know what the API returns"]):::fix
    OUT --> DONE(["calls are written correctly"]):::ok
```

Concern: [Transport & Protocol](README.md).
