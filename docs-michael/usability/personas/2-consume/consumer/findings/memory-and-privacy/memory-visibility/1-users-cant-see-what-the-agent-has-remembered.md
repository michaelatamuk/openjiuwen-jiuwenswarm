---

# Users can't see what the agent has remembered

*Concern: Memory Visibility*

---

## The problem today

The memory system stores facts, daily logs, and profile data in `~/.jiuwenswarm/workspace/`. Users have no UI to browse, search, edit, or delete what the agent has remembered about them.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The agent remembers things about the user"]):::plain
    MID(["there is no UI to browse memory"]):::plain
    START --> MID
    MID -->|"reason: memory is only on disk, not surfaced"| OUT(["The user can't see or correct what's stored"]):::fail
    OUT --> DONE(["wrong or outdated facts persist silently"]):::fail
```

---

## The proposed fix

A "My memory" panel (from the sidebar) showing: `USER.md` as a profile card, `MEMORY.md` as a searchable fact list, recent daily entries, a "Delete fact" button on each item, and a confirmed "Clear all memory" action.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The agent remembers things about the user"]):::plain
    MID(["a 'My memory' panel lists and edits facts"]):::plain
    START --> MID
    MID -->|"reason: memory is shown and editable"| OUT(["The user sees and corrects what's stored"]):::fix
    OUT --> DONE(["wrong facts can be removed"]):::ok
```
