---

# Headline capabilities ship undocumented

*Concern: Documentation*

---

## The problem today

Heartbeat, trajectory replay and the connector marketplace have no page in `docs/en` — exactly the primitives a builder composes with (scheduling, run forensics, distributing a plugin).

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A builder looks for heartbeat / replay / marketplace docs"]):::plain
    MID(["there is no page for them in docs/en"]):::plain
    START --> MID
    MID -->|"reason: headline capabilities were never documented"| OUT(["They can't compose with them"]):::fail
    OUT --> DONE(["key primitives are invisible to builders"]):::fail
```

---

## The proposed fix

Write a page for each capability (heartbeat/scheduling, trajectory replay, connector marketplace) with what it does, how to enable it and a worked example, and link them from the docs index so they are discoverable.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A builder looks for heartbeat / replay / marketplace docs"]):::plain
    MID(["each has a page with an example"]):::plain
    START --> MID
    MID -->|"reason: pages are linked from the index"| OUT(["They compose with the primitives"]):::fix
    OUT --> DONE(["headline capabilities are usable"]):::ok
```
