---

# No immediate feedback between submit and the first chat event

*Concern: Output & Perceived Speed*

---

## The problem today

Once a turn is active, the UI shows live progress (a running timer/spinner, streaming reasoning, and tool activity). But in the brief window between clicking **send** and the first `chat.reasoning` / `chat.processing_status` event — routing, context assembly, model warm-up — no turn is active yet, so there is no indicator: the last message simply sits there for a moment.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["User clicks send"]):::plain
    MID(["no turn is active yet, no indicator"]):::plain
    START --> MID
    MID -->|"reason: indicator starts only when the first chat event lands"| OUT(["a short blank pause before progress appears"]):::fail
    OUT --> DONE(["wonders whether the message registered"]):::fail
```

Once the first `chat.reasoning` / `chat.processing_status` event arrives, the active-turn indicators (running timer/spinner, reasoning, tool progress) cover the rest of the response.

---

## The proposed fix

Show an animated "thinking" indicator (three dots / pulsing bar) the moment the message is submitted, and clear it when the first chat event (reasoning or token) arrives. The existing per-turn running spinner already covers everything after that point.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["User clicks send"]):::plain
    MID(["a 'thinking' indicator shows immediately"]):::plain
    START --> MID
    MID -->|"reason: an indicator covers the routing/warm-up window"| OUT(["no blank pause before progress starts"]):::fix
    OUT --> DONE(["feedback is continuous from submit to first token"]):::ok
```
