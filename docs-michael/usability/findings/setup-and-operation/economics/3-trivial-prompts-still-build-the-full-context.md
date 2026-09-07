[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# Trivial prompts still build the full context

*Concern: Cost & Token Economics*

---

## The problem today

Every request assembles the complete context regardless of how simple the prompt is: many static system sections (identity, strategy, output rules, code-mode rules, tone), plus dynamic sections rebuilt before every call (runtime environment, git status, memory, all installed skills) and the full tool schemas. A trivial query such as “how much is 2+2?” therefore carries the same large fixed context as a hard task — reaching tens of thousands of tokens when memory, skills, and tools are many — and the user cannot see it or control it.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user asks a trivial question"]):::plain
    MID(["the full context is assembled anyway"]):::plain
    START --> MID
    MID -->|"reason: memory, all skills, and tool schemas are always attached"| OUT(["Every request pays the full fixed context"]):::fail
    OUT --> DONE(["simple tasks waste tokens and context for no benefit"]):::fail
```

---

## The proposed fix

Assemble context selectively: always keep a minimal core, but lazy-load memory and only attach the skills and tools a task plausibly needs, and show the user the token count per request so the overhead is visible and controllable.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user asks a trivial question"]):::plain
    MID(["only the needed context is attached"]):::plain
    START --> MID
    MID -->|"reason: memory and skills load on demand"| OUT(["Trivial requests stay small"]):::fix
    OUT --> DONE(["users can see and control the context cost"]):::ok
```

Concern: [Cost & Token Economics](README.md).
