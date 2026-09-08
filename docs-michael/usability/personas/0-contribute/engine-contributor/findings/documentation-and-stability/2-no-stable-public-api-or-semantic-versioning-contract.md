---

# No stable public API or semantic-versioning contract

*Concern: Extension Documentation & Stability*

---

## The problem today

Both packages are `0.x` and `agent-core` is imported from a git SHA — any import path can change without notice, so developers can't build with confidence.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A developer builds on the API"]):::plain
    MID(["any import path may change between releases"]):::plain
    START --> MID
    MID -->|"reason: no public API contract exists"| OUT(["Their build breaks without notice"]):::fail
    OUT --> DONE(["they can't rely on the API"]):::fail
```

---

## The proposed fix

A `PUBLIC_API.md`, a breaking-change changelog, `@public`/`@internal` markers, and proper semver once stable.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A developer builds on the API"]):::plain
    MID(["stable API is declared and versioned"]):::plain
    START --> MID
    MID -->|"reason: a PUBLIC_API.md + semver exist"| OUT(["They can rely on what's stable"]):::fix
    OUT --> DONE(["upgrades don't surprise them"]):::ok
```
