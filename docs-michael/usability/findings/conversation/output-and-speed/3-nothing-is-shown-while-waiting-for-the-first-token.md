[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# Nothing is shown while waiting for the first token

*Concern: Output & Perceived Speed*

---

## The problem today

`StreamingContent.tsx` renders tokens as they arrive, but between submitting a message and the first token there is a gap (warm-up, context assembly, routing). During that gap the user sees nothing — no spinner, no progress.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["User sends a message"]):::plain
    MID(["nothing appears before the first token"]):::plain
    START --> MID
    MID -->|"reason: no indicator shows during the latency gap"| OUT(["User stares at a frozen screen"]):::fail
    OUT --> DONE(["thinks it's broken or hangs"]):::fail
```

---

## The proposed fix

Show an animated "thinking" indicator (three dots / pulsing bar) the moment the message is submitted, removed when the first token arrives. `HarnessProgressBar` already exists — it should be visible from submit.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["User sends a message"]):::plain
    MID(["a 'thinking' indicator shows immediately"]):::plain
    START --> MID
    MID -->|"reason: an indicator covers the latency gap"| OUT(["User sees the system is working"]):::fix
    OUT --> DONE(["stays until the first token arrives"]):::ok
```

Concern: [Output & Perceived Speed](README.md).
