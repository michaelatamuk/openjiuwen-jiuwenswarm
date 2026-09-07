[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# Permission rules can only be edited in raw YAML

*Concern: Running & Managing the Instance*

---

## The problem today

The tiered permission policy uses a complex regex rule syntax with no Web UI to create, edit, or test rules; the warning dialog only shows a generic "full access" message.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["An operator wants to change a permission"]):::plain
    MID(["rules are only editable in raw YAML"]):::plain
    START --> MID
    MID -->|"reason: no GUI or rule tester exists"| OUT(["A rule can't be tested before it applies"]):::fail
    OUT --> DONE(["the operator risks a wrong or over-broad rule"]):::fail
```

---

## The proposed fix

A permissions panel listing active rules (tool pattern, allowed/denied, who it applies to), an inline editor with regex validation, a "Test" field to see which rule a tool matches, and a plain-language "What can the agent do?" summary.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["An operator wants to change a permission"]):::plain
    MID(["a permissions panel edits and tests rules"]):::plain
    START --> MID
    MID -->|"reason: a GUI + rule tester exist"| OUT(["A rule is validated before it applies"]):::fix
    OUT --> DONE(["the operator knows exactly what it permits"]):::ok
```

Concern: [Running & Managing the Instance](README.md).
