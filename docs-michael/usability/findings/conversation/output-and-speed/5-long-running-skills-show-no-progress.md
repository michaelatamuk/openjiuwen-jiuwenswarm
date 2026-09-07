[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# Long-running skills show no progress

*Concern: Output & Perceived Speed*

---

## The problem today

When a skill is executing (potentially for minutes), the user sees only a generic tool-call card — no progress bar, step count, or estimate.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A skill runs for minutes"]):::plain
    MID(["the UI shows only a generic tool card"]):::plain
    START --> MID
    MID -->|"reason: no progress events are surfaced"| OUT(["The user can't tell how far it is"]):::fail
    OUT --> DONE(["waits in the dark or assumes it's stuck"]):::fail
```

---

## The proposed fix

Skills should emit progress events that render as a live progress bar in the tool card — "parse-invoice: processed 3 of 12 files…". This needs a lightweight progress protocol in the harness; the UI (`HarnessProgressBar`) already exists.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A skill runs for minutes"]):::plain
    MID(["progress events render a live bar"]):::plain
    START --> MID
    MID -->|"reason: the skill reports '3 of 12 files'"| OUT(["The user sees live progress"]):::fix
    OUT --> DONE(["knows it's working and roughly when it'll end"]):::ok
```

Concern: [Output & Perceived Speed](README.md).
