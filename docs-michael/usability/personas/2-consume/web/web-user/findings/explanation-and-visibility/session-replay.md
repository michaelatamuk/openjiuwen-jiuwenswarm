---

# Can't scrub back through what the agent did, turn by turn

*Concern: Explanation & Visibility*

---

## The problem today

There is no timeline to replay turns and tasks, expand sub-agent trees, and see per-turn tokens and diff snapshots — so a finished run cannot be reviewed step by step.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A run has completed"]):::plain
    MID(["only the final transcript is available"]):::plain
    START --> MID
    MID -->|"reason: no timeline/scrubber exists"| OUT(["The user can't inspect what happened when"]):::fail
    OUT --> DONE(["debugging a bad run means re-running it"]):::fail
```

---

## The proposed fix

Build a replay timeline on the trajectory store: scrub through turns and tasks, expand sub-agent trees nested under their parent turn, and show per-turn tokens and artifact diff snapshots at each step.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A run has completed"]):::plain
    MID(["a timeline replays turns, tasks and sub-agents"]):::plain
    START --> MID
    MID -->|"reason: the trajectory store already records spans"| OUT(["The user scrubs to any step"]):::fix
    OUT --> DONE(["runs are reviewable without re-running"]):::ok
```
