---

# Browser runs stop at a blocker with nowhere to go

*Concern: Integration & Tooling*

---

## The problem today

agent-core detects verification walls and records them as blockers, but there is no human handoff. An unattended run simply dies instead of pausing for a person to clear the blocker.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A browser run hits a verification wall"]):::plain
    MID(["the wall is recorded as a blocker"]):::plain
    START --> MID
    MID -->|"reason: no handoff path to a human"| OUT(["The unattended run terminates"]):::fail
    OUT --> DONE(["the task is abandoned, not paused"]):::fail
```

---

## The proposed fix

Route a detected blocker to a human via the existing interrupt/approval mechanism: pause the run, surface the wall (CAPTCHA, login, interstitial) with a "take over" prompt, and resume from the same step once cleared.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A browser run hits a verification wall"]):::plain
    MID(["the run pauses and asks the human to clear it"]):::plain
    START --> MID
    MID -->|"reason: blockers map onto the interrupt path"| OUT(["The human clears it, the run resumes"]):::fix
    OUT --> DONE(["unattended runs survive human-only walls"]):::ok
```
