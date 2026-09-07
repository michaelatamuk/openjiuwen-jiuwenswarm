[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# Rate limits and API failures hang or show nothing useful

*Concern: Health & Degradation*

---

## The problem today

When the model returns a 429/503 or an API rate limit is hit, the user sees a generic error or a silent hang — no backoff indicator, no "retrying in 15s", no suggestion to switch models.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The model is rate-limited or failing"]):::plain
    MID(["the UI shows a generic error or hangs"]):::plain
    START --> MID
    MID -->|"reason: no backoff/retry feedback is shown"| OUT(["The user waits, not knowing what's happening"]):::fail
    OUT --> DONE(["cannot tell retry from a hang"]):::fail
```

---

## The proposed fix

Show a visible "Rate limited — retrying in 15s" countdown; after 3 consecutive errors, offer "The model is repeatedly failing — try deepseek-v3?" with one-click switch; include the HTTP status and the model's verbatim error; log provider failures at WARNING for monitors.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The model is rate-limited or failing"]):::plain
    MID(["the UI shows a retry countdown and the real error"]):::plain
    START --> MID
    MID -->|"reason: backoff and status are surfaced"| OUT(["The user sees it's retrying and can switch models"]):::fix
    OUT --> DONE(["knows the real cause and next step"]):::ok
```

Concern: [Health & Degradation](README.md).
