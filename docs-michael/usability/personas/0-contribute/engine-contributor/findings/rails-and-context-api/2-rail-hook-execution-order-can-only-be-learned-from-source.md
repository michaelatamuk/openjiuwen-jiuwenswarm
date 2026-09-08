---

# Rail hook execution order can only be learned from source

*Concern: Rails & Context API*

---

## The problem today

Whether `before_model_call` fires before the prompt is assembled, or where `after_tool_call` lands relative to history, is undocumented — and rail `priority` ordering isn't stated beyond "higher runs first".

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A developer needs hook timing"]):::plain
    MID(["the order is undocumented"]):::plain
    START --> MID
    MID -->|"reason: no lifecycle diagram exists"| OUT(["They must read the agent execution loop"]):::fail
    OUT --> DONE(["timing-sensitive rails are written blind"]):::fail
```

---

## The proposed fix

A lifecycle diagram showing the agent loop with each hook point, and an explicit statement of priority ordering.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A developer needs hook timing"]):::plain
    MID(["a lifecycle diagram shows hook order"]):::plain
    START --> MID
    MID -->|"reason: hook timing is documented"| OUT(["They know when each hook fires"]):::fix
    OUT --> DONE(["timing-sensitive rails are correct"]):::ok
```
