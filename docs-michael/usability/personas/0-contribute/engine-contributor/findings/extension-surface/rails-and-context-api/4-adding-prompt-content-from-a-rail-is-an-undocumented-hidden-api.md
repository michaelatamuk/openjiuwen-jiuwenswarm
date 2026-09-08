---

# Adding prompt content from a rail is an undocumented hidden API

*Concern: Rails & Context API*

---

## The problem today

Adding custom instructions to the system prompt from a rail (`system_prompt_builder.add_section(...)`) is the most common extension use case, but the API and priority model are documented nowhere.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A developer adds prompt content from a rail"]):::plain
    MID(["the API and priority are undocumented"]):::plain
    START --> MID
    MID -->|"reason: no guide or priority table exists"| OUT(["They can't wire it without reading source"]):::fail
    OUT --> DONE(["custom prompt sections are never added"]):::fail
```

---

## The proposed fix

An "Adding prompt content from a rail" guide with a working example, plus a table of reserved priority ranges so custom sections don't collide with built-ins.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A developer adds prompt content from a rail"]):::plain
    MID(["a guide + priority table show how"]):::plain
    START --> MID
    MID -->|"reason: the API is documented"| OUT(["They add custom instructions safely"]):::fix
    OUT --> DONE(["their section lands in the right slot"]):::ok
```
