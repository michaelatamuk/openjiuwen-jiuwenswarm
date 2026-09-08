---

# No guidance introduces features after first run

*Concern: Progressive Discovery*

---

## The problem today

After the setup wizard there's no further onboarding — trajectory, skills, team mode, memory, and the connector market are never introduced unless the user stumbles on them.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user keeps using the app"]):::plain
    MID(["new features are never introduced"]):::plain
    START --> MID
    MID -->|"reason: no post-first-run onboarding exists"| OUT(["Capable features stay undiscovered"]):::fail
    OUT --> DONE(["the user never uses them"]):::fail
```

---

## The proposed fix

A "tip of the session" system: once per new feature area, show a small non-blocking tooltip at the right moment (first multi-step task → "open the Trajectory panel"; first file write → "review changes"; after 5 sessions → "memory").

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user keeps using the app"]):::plain
    MID(["features are introduced at the right moment"]):::plain
    START --> MID
    MID -->|"reason: a tip-of-the-session system exists"| OUT(["The user discovers features in context"]):::fix
    OUT --> DONE(["gradually learns the power of the tool"]):::ok
```
