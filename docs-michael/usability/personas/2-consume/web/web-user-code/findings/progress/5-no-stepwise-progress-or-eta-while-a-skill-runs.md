---

# No step-wise progress or ETA while a skill runs

*Concern: Output & Perceived Speed*

---

## The problem today

While a turn is active the UI does show that the agent is working (a per-turn running spinner plus live elapsed timer, and any activity the skill emits). But a long-running skill itself exposes no **step/fractional progress or ETA**: the tool card marks `success`/`failed` only after the call finishes, and there is no generic in-skill progress protocol (staged progress exists only for specific flows such as skill *generation* and harness extensions). So the user can't tell how far along a skill is or roughly when it will finish.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A skill runs for minutes"]):::plain
    MID(["the turn timer runs but the skill shows no step/ETA"]):::plain
    START --> MID
    MID -->|"reason: no in-skill progress protocol is surfaced"| OUT(["can't tell how far along the skill is"]):::fail
    OUT --> DONE(["only knows it is still working"]):::fail
```

The user is not in the dark about *whether* it is working (spinner + elapsed are shown); the gap is *how far* it has gone and *when* it will finish.

---

## The proposed fix

Skills should emit lightweight progress events that render as a live step/progress indicator in the tool card — "parse-invoice: processed 3 of 12 files…" — with an ETA where feasible. The existing stage model (`HarnessProgressBar`) can be reused for this.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A skill runs for minutes"]):::plain
    MID(["progress events render a live '3 of 12 files' step"]):::plain
    START --> MID
    MID -->|"reason: the skill reports incremental progress"| OUT(["The user sees how far it is"]):::fix
    OUT --> DONE(["knows it's working and roughly when it'll end"]):::ok
```
