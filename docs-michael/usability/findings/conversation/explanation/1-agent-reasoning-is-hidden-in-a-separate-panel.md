[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# Agent reasoning is hidden in a separate panel

*Concern: Agent Explanation*

---

## The problem today

`TrajectoryTable.tsx` shows `thinkingDetail` per trajectory cell, but only inside the Trajectory panel — a separate panel the user must know to open. During a conversation the user sees only streaming text and tool-call cards.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The agent is answering"]):::plain
    MID(["reasoning only lives in the Trajectory panel"]):::plain
    START --> MID
    MID -->|"reason: no inline 'reasoning' view in the chat"| OUT(["User can't see why the agent did something"]):::fail
    OUT --> DONE(["must switch to a separate panel to follow along"]):::fail
```

---

## The proposed fix

Two levels of transparency:

- **Inline (default):** a collapsed "Reasoning" chip on each assistant message; clicking expands the thinking inline, no panel switch.
- **Full (Trajectory panel):** the structured trace with timing, tokens, and tool details.

The chip shows the first 1–2 sentences of reasoning as a preview before expanding.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The agent is answering"]):::plain
    MID(["a collapsed 'Reasoning' chip is on each message"]):::plain
    START --> MID
    MID -->|"reason: reasoning is shown inline; the full trace stays in Trajectory"| OUT(["User expands the reasoning inline"]):::fix
    OUT --> DONE(["understands why and can trust the answer"]):::ok
```

Related: [The activity view is hidden behind an unclear name](../../onboarding/navigation-and-settings/3-the-activity-view-is-hidden-behind-an-unclear-name.md).
