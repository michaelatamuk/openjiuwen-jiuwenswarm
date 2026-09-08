---

# The activity view is hidden behind an unclear name

*Concern: Navigation & Settings*

---

## The problem today

The trajectory system lives in the right panel but needs knowing to look for it, and its nav item is labeled "TraceHound" — meaningless to a new user.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user wants to see what the agent did"]):::plain
    MID(["the activity view is hidden behind 'TraceHound'"]):::plain
    START --> MID
    MID -->|"reason: no clear name or default placement exists"| OUT(["The user can't find it"]):::fail
    OUT --> DONE(["the feature stays invisible"]):::fail
```

---

## The proposed fix

Rename to "Agent activity" (or "What happened") and surface it as a default sub-tab in the right panel. Related: [Agent reasoning is hidden in a separate panel](../../../../web-user-code/findings/conversation/explanation/1-agent-reasoning-is-hidden-in-a-separate-panel.md).

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user wants to see what the agent did"]):::plain
    MID(["'Agent activity' is a default right-panel tab"]):::plain
    START --> MID
    MID -->|"reason: a clear name + default placement exist"| OUT(["The user finds it"]):::fix
    OUT --> DONE(["can review what the agent did"]):::ok
```
