[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# No visibility into token usage or session cost

*Concern: Cost & Token Economics*

---

## The problem today

Users have no visibility into how many tokens each conversation consumes. With large memory snapshots, many skills, long history, and subagents, context can exceed 30K tokens per call — with no counter, cost estimate, or warning.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A session accumulates context"]):::plain
    MID(["no token counter or cost estimate is shown"]):::plain
    START --> MID
    MID -->|"reason: usage is not surfaced anywhere"| OUT(["The user can't see how much this costs"]):::fail
    OUT --> DONE(["spend surprises them at the end"]):::fail
```

---

## The proposed fix

A token counter in the chat panel (input + output), a per-message token annotation (collapsible), a cost estimate from per-model pricing, and an end-of-session card: "This session used 48,320 tokens (~$0.14)."

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A session accumulates context"]):::plain
    MID(["a live token counter and cost estimate are shown"]):::plain
    START --> MID
    MID -->|"reason: usage is surfaced per session"| OUT(["The user sees the running cost"]):::fix
    OUT --> DONE(["can budget before it grows"]):::ok
```

Concern: [Cost & Token Economics](README.md).
