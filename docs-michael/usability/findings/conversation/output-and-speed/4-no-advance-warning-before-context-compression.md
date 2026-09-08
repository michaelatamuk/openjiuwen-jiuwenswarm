[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# No advance warning before context compression

*Concern: Output & Perceived Speed*

---

## The problem today

When a session gets long, older context is proactively compressed (summarized). The UI does surface this **in-conversation while it runs and after it completes** (`ContextCompressionLines`: a "compressing…" line, then "N places compressed" with a summary). But there is no **advance** warning: the user only learns compression is happening once it has already started, and there is no live token/percentage gauge to prompt them to start a new session before memory is condensed.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A session grows long"]):::plain
    MID(["the user learns compression only as it runs/completes"]):::plain
    START --> MID
    MID -->|"reason: no advance or percentage warning"| OUT(["can't start a new session before older context is condensed"]):::fail
    OUT --> DONE(["memory is summarized without a heads-up"]):::fail
```

The compression itself is announced in-chat with a summary; what's missing is a heads-up **before** it triggers.

---

## The proposed fix

A small live token counter in the chat input area. At ~70% it turns yellow; at ~90% it warns "Approaching context limit — older messages may be summarized." That gives the user time to start a new session before the agent's older context is condensed.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A session grows long"]):::plain
    MID(["a live token counter warns before the cap"]):::plain
    START --> MID
    MID -->|"reason: the counter warns at 70%/90%"| OUT(["The user is warned in time"]):::fix
    OUT --> DONE(["can start a new session before memory is condensed"]):::ok
```

Concern: [Output & Perceived Speed](README.md).
