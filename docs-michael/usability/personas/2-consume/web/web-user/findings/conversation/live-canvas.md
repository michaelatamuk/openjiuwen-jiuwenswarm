---

# The agent's output only lands as one final message

*Concern: Conversation*

---

## The problem today

There is no live canvas on which a document, diagram or report re-renders in place as the agent works; the artifact appears only when the agent finishes.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The agent builds a document/report"]):::plain
    MID(["updates stream as chat text, not as the artifact"]):::plain
    START --> MID
    MID -->|"reason: no live canvas renders the artifact"| OUT(["The user sees only the final message"]):::fail
    OUT --> DONE(["intermediate work is invisible, and trust is low"]):::fail
```

---

## The proposed fix

Add a live canvas panel that renders the current artifact (document/diagram/report) and re-renders it as new artifact content streams in, so the user watches it take shape rather than waiting for the final message.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The agent builds a document/report"]):::plain
    MID(["a canvas re-renders it as content arrives"]):::plain
    START --> MID
    MID -->|"reason: artifact updates are streamed to the canvas"| OUT(["The user watches it build live"]):::fix
    OUT --> DONE(["progress is visible and interruptible"]):::ok
```
