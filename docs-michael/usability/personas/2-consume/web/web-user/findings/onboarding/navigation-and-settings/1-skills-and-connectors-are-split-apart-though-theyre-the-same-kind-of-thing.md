---

# Skills and connectors are split apart though they're the same kind of thing

*Concern: Navigation & Settings*

---

## The problem today

`SessionSidebar` lists "Skills" and "Connector Market" (plugins, MCP) as separate top-level sections, though both extend agent capabilities.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user wants to add a capability"]):::plain
    MID(["skills and connectors are in separate navs"]):::plain
    START --> MID
    MID -->|"reason: similar items are split apart"| OUT(["The user must know the category first"]):::fail
    OUT --> DONE(["hunts between two sections"]):::fail
```

---

## The proposed fix

A unified "Capabilities" section — skills, MCP servers, plugins, and browser tools in one place, filterable by type — so adding a capability needs no category knowledge.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user wants to add a capability"]):::plain
    MID(["skills and connectors live in one 'Capabilities' place"]):::plain
    START --> MID
    MID -->|"reason: items are filterable by type"| OUT(["The user finds it in one place"]):::fix
    OUT --> DONE(["adds a capability easily"]):::ok
```
