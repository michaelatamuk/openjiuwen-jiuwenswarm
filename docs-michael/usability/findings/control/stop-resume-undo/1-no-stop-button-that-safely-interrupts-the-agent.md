[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# No stop button that safely interrupts the agent

*Concern: Stop, Resume & Undo*

---

## The problem today

There is no Stop button with defined behaviour. The user can close the tab or kill the process, but the agent may keep running on the server, leaving partial writes or calls in an inconsistent state.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The agent is mid-task and goes wrong"]):::plain
    MID(["there is no safe Stop button"]):::plain
    START --> MID
    MID -->|"reason: closing the tab doesn't stop the server-side agent"| OUT(["The agent keeps running unseen"]):::fail
    OUT --> DONE(["partial work is left in an inconsistent state"]):::fail
```

---

## The proposed fix

A Stop button in the chat panel header that: (1) sends an interrupt to the harness, (2) waits for the current tool call to finish (not mid-write), (3) shows a "Stopped" card listing what completed and what did not, and (4) leaves the conversation resumable with "continue".

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The agent is mid-task and goes wrong"]):::plain
    MID(["a Stop button sends a clean interrupt"]):::plain
    START --> MID
    MID -->|"reason: the current tool call finishes first"| OUT(["The agent stops at a safe point"]):::fix
    OUT --> DONE(["a card shows what completed and what didn't, resumable"]):::ok
```

Concern: [Stop, Resume & Undo](README.md).
