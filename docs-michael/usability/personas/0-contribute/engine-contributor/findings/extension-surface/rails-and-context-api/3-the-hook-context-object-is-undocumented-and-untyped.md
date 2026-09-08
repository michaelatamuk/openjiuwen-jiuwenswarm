---

# The hook context object is undocumented and untyped

*Concern: Rails & Context API*

---

## The problem today

Every hook gets `ctx: AgentCallbackContext`, but what's on it (and which fields are mutable) is only discoverable by reading the dataclass — e.g. does `ctx.messages` reflect the assembled prompt or raw history?

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A developer reads ctx in a hook"]):::plain
    MID(["its fields and mutability are unknown"]):::plain
    START --> MID
    MID -->|"reason: no context reference exists"| OUT(["They guess what ctx carries"]):::fail
    OUT --> DONE(["a writable field is misused"]):::fail
```

---

## The proposed fix

A context reference table: each attribute's type, whether it's mutable, and which hooks it's populated in.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A developer reads ctx in a hook"]):::plain
    MID(["a context table documents fields"]):::plain
    START --> MID
    MID -->|"reason: attribute types/mutability are listed"| OUT(["They use ctx correctly"]):::fix
    OUT --> DONE(["hooks behave predictably"]):::ok
```
