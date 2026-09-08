---

# No CLI to scaffold a new rail or skill

*Concern: Extension Testing & Tooling*

---

## The problem today

Creating a rail means writing boilerplate by hand — no `openjiuwen new rail`, no template, no example to copy.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A developer starts a new rail"]):::plain
    MID(["they write all boilerplate by hand"]):::plain
    START --> MID
    MID -->|"reason: no scaffold command exists"| OUT(["Cold-start friction every time"]):::fail
    OUT --> DONE(["new rails are slow to begin"]):::fail
```

---

## The proposed fix

An `openjiuwen new rail` command that generates a rail file and a working test from a template.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A developer starts a new rail"]):::plain
    MID(["a scaffold command generates files"]):::plain
    START --> MID
    MID -->|"reason: a template + CLI exist"| OUT(["They start from a correct skeleton"]):::fix
    OUT --> DONE(["new rails begin fast"]):::ok
```
