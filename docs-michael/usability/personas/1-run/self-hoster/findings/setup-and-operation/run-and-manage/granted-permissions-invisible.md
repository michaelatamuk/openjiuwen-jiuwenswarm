---

# Granted permissions are invisible once granted

*Concern: Running & Managing the Instance*

---

## The problem today

"Always allow" choices write into `approval_overrides`, but there is no in-UI view of what has accumulated. A user cannot see or revoke what they have allowed.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user clicks 'Always allow'"]):::plain
    MID(["the rule is written to approval_overrides"]):::plain
    START --> MID
    MID -->|"reason: no UI lists the accumulated rules"| OUT(["The user forgets what was granted"]):::fail
    OUT --> DONE(["permissions drift with no way to revoke"]):::fail
```

---

## The proposed fix

Add a "Granted permissions" settings view that lists every active `approval_overrides` rule with its scope and a one-click revoke, plus an audit line showing when and from which prompt each was granted.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user clicks 'Always allow'"]):::plain
    MID(["a settings view lists active grants"]):::plain
    START --> MID
    MID -->|"reason: each rule is visible and revocable"| OUT(["The user reviews and revokes grants"]):::fix
    OUT --> DONE(["granted permissions stay intentional"]):::ok
```
