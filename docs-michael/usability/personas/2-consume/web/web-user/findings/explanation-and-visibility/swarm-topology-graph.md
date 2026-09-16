---

# No live picture of how the swarm is coordinating

*Concern: Explanation & Visibility*

---

## The problem today

Team state is shown as flat lists. There is no graph showing the leader, members, message routing and task dependencies in real time.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A team run is in progress"]):::plain
    MID(["members and tasks appear as flat lists"]):::plain
    START --> MID
    MID -->|"reason: no topology view is rendered"| OUT(["Coordination is impossible to follow"]):::fail
    OUT --> DONE(["the user can't see who is doing what"]):::fail
```

---

## The proposed fix

Render a live topology graph from the existing team runtime signals — leader and members as nodes, message routing as edges — overlaid with task-dependency links and current per-member status.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A team run is in progress"]):::plain
    MID(["a live graph shows members, routing and dependencies"]):::plain
    START --> MID
    MID -->|"reason: routing and task data already exist"| OUT(["Coordination is visible as it happens"]):::fix
    OUT --> DONE(["bottlenecks and loops are obvious"]):::ok
```
