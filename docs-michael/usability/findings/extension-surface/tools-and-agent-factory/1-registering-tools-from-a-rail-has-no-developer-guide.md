[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# Registering tools from a rail has no developer guide

*Concern: Tools & Agent Factory*

---

## The problem today

Registering a tool from a rail requires knowing `ability_manager.add(ToolCard)`, cleanup in `uninit()`, and that `input_params` is a JSON Schema — all only visible in a test file, with the `ToolCard`/`LocalFunction` split unexplained.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A developer registers a tool from a rail"]):::plain
    MID(["no guide explains the pattern"]):::plain
    START --> MID
    MID -->|"reason: the API exists only in a test file"| OUT(["They can't discover the correct flow"]):::fail
    OUT --> DONE(["tools aren't registered or leak on uninit"]):::fail
```

---

## The proposed fix

An "Adding a tool from a rail" guide with the full pattern, and a diagram of `ToolCard` (schema the LLM sees) vs `LocalFunction` (the Python that runs).

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A developer registers a tool from a rail"]):::plain
    MID(["a guide shows the full pattern"]):::plain
    START --> MID
    MID -->|"reason: ToolCard vs LocalFunction is clear"| OUT(["They register and clean up tools correctly"]):::fix
    OUT --> DONE(["tools work end-to-end"]):::ok
```

Concern: [Tools & Agent Factory](README.md).
