[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# Skills can only be tested through a live chat

*Concern: Skill Authoring & Dependencies*

---

## The problem today

There's no way to test a skill with sample input from the UI before live use — it must be triggered through a real chat session.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["An author wants to test a skill"]):::plain
    MID(["they must run it in live chat"]):::plain
    START --> MID
    MID -->|"reason: no sandbox/test panel exists"| OUT(["A broken skill affects real use"]):::fail
    OUT --> DONE(["testing is risky and slow"]):::fail
```

---

## The proposed fix

A "Test run" panel in the skill view: paste sample input, run, see output — the skill's unit test. Trajectory already captures the data; wiring a test UI is achievable.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["An author wants to test a skill"]):::plain
    MID(["a 'Test run' panel runs sample input"]):::plain
    START --> MID
    MID -->|"reason: a sandboxed test UI exists"| OUT(["The skill is validated before live use"]):::fix
    OUT --> DONE(["authors test safely"]):::ok
```

Concern: [Skill Authoring & Dependencies](README.md).
