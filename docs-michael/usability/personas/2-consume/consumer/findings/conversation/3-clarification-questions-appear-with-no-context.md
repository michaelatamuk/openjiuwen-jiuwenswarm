---

# Clarification questions appear with no context

*Concern: Agent Explanation*

---

## The problem today

When the agent asks for clarification ("Which directory should I write the output to?"), there is no hint of what it was doing when it got stuck, so the user must infer from context.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The agent gets stuck and asks"]):::plain
    MID(["no context about what it was doing"]):::plain
    START --> MID
    MID -->|"reason: the question carries no hint of its goal"| OUT(["User can't tell why the question is asked"]):::fail
    OUT --> DONE(["answers without knowing the agent's intent"]):::fail
```

---

## The proposed fix

Attach a brief context line to every clarification request:

> "I'm about to write the output CSV and wasn't sure of the destination."
> **Which directory should I write the output file to?**

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The agent gets stuck and asks"]):::plain
    MID(["a brief context line states what it was doing"]):::plain
    START --> MID
    MID -->|"reason: the context reveals the goal behind the question"| OUT(["User understands the question's intent"]):::fix
    OUT --> DONE(["answers the right thing"]):::ok
```
