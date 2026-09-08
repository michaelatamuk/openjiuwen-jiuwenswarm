---

# Users aren't told what the agent is allowed to do before it acts

*Concern: Permissions*

---

## The problem today

The agent can run bash, read/write files, send Feishu messages, call web APIs, and spawn subagents. Before a session starts, the user sees no summary of current permissions. `PermissionWarningDialog` only shows a generic "full access warning" — it never lists what is specifically permitted.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A session is about to start"]):::plain
    MID(["no summary of the agent's permissions is shown"]):::plain
    START --> MID
    MID -->|"reason: the warning is a generic 'full access' message"| OUT(["The user doesn't know what the agent can do"]):::fail
    OUT --> DONE(["it may act far beyond what they expected"]):::fail
```

---

## The proposed fix

A "Session capabilities" summary as a collapsible banner at the top of a new conversation:

```
This agent can: read/write files in /home/mishka/invoices/ · send Feishu messages
                · run bash commands · call the parse-invoice skill
This agent cannot: access the internet · modify files outside the project directory
```

Click any item to see the permission rule behind it, and toggle tool access for this session without editing config.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A session is about to start"]):::plain
    MID(["a 'session capabilities' banner lists can / cannot"]):::plain
    START --> MID
    MID -->|"reason: the summary shows the real permission rules"| OUT(["The user sees exactly what the agent may do"]):::fix
    OUT --> DONE(["can decide whether to let it proceed"]):::ok
```
