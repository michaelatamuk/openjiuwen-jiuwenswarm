---

# No per-model budget dashboard

*Concern: Cost & Tokens*

---

## The problem today

There is no token/cost dashboard broken down per model, session or team member, and no activity heatmap or error/latency sparklines. Spend is only visible by reading logs or usage records directly.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["An operator wants to know what this instance costs"]):::plain
    MID(["tokens and cost exist only in raw records"]):::plain
    START --> MID
    MID -->|"reason: no dashboard aggregates them"| OUT(["Spend is discovered after the fact"]):::fail
    OUT --> DONE(["no way to budget per model or member"]):::fail
```

---

## The proposed fix

Build the dashboard on data already recorded: the session usage/cost accumulator and the trajectory store. Show tokens and cost per model, session and member, plus an activity heatmap and error/latency sparklines.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["An operator wants to know what this instance costs"]):::plain
    MID(["a dashboard aggregates usage and cost"]):::plain
    START --> MID
    MID -->|"reason: usage and trajectory data already exist"| OUT(["Spend is visible per model/session/member"]):::fix
    OUT --> DONE(["they set budgets with confidence"]):::ok
```
