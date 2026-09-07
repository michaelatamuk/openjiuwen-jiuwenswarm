[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# File changes are applied with no preview or approval

*Concern: Approval & Preview*

---

## The problem today

The agent can create, edit, and delete files in the project directory. The Web UI has a `CodeChangesCard` in `ChatPanel/index.tsx`, but it is unclear whether it previews changes before they are made or just summarizes them after.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The agent wants to change a file"]):::plain
    MID(["the change is applied with no preview first"]):::plain
    START --> MID
    MID -->|"reason: no diff is shown before the write"| OUT(["The user sees the edit only after it lands"]):::fail
    OUT --> DONE(["a wrong change is already on disk"]):::fail
```

---

## The proposed fix

Before committing any file write, show a diff in the chat panel:

```
Proposed change to src/parser.py:
- def parse(file):
+ def parse(file, encoding="utf-8"):
[Apply] [Edit] [Skip]
```

This requires separating the "compute change" step from the "commit change" step — architecturally non-trivial, but the highest-leverage trust feature in a coding assistant.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The agent wants to change a file"]):::plain
    MID(["a diff is shown with Apply / Edit / Skip"]):::plain
    START --> MID
    MID -->|"reason: the change is previewed before commit"| OUT(["The user reviews and approves the exact edit"]):::fix
    OUT --> DONE(["only the approved change lands"]):::ok
```

Concern: [Approval & Preview](README.md).
