[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# No control over reply length or writing style

*Concern: Output & Perceived Speed*

---

## The problem today

There is no global setting or per-message instruction for response length or style. If the agent tends to be verbose, the user must type "be brief" into every single message.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The agent answers"]):::plain
    MID(["there is no length/style preference to set"]):::plain
    START --> MID
    MID -->|"reason: no persistent style preference exists"| OUT(["The agent answers at the same verbosity every time"]):::fail
    OUT --> DONE(["the user keeps re-adding 'be brief' each message"]):::fail
```

---

## The proposed fix

A persistent preference (saved to MEMORY.md or user config) for response style — terse / standard / detailed — plus a per-message override via a small pill next to the send button. The agent reads the preference from memory and applies it without being reminded.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The agent answers"]):::plain
    MID(["a terse/standard/detailed preference is saved"]):::plain
    START --> MID
    MID -->|"reason: a persistent style preference is read from memory"| OUT(["The agent matches the chosen style automatically"]):::fix
    OUT --> DONE(["no need to re-state it every message"]):::ok
```

Concern: [Output & Perceived Speed](README.md).
