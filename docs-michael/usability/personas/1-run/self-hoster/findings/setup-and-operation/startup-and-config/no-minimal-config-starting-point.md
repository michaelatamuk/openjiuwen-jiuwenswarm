---

# No minimal starting point for config (818 keys)

*Concern: Startup & Configuration*

---

## The problem today

The shipped `config.yaml` is 1,510 lines, 818 keys, eight levels deep, with mixed-language comments. Only a handful of keys matter on day one, but there is no ~30-line minimal config, so a newcomer either copies the whole file or guesses which keys are required.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A new operator opens config.yaml"]):::plain
    MID(["818 keys, 8 levels deep, only a few required"]):::plain
    START --> MID
    MID -->|"reason: no minimal config is shipped"| OUT(["They copy the whole file or guess"]):::fail
    OUT --> DONE(["startup surprises from irrelevant keys"]):::fail
```

---

## The proposed fix

Ship a `config.minimal.yaml` (~30 lines) that boots a working agent and carries a comment per required key; keep the full file as the reference. Point the README and `jiuwenswarm init` at the minimal file first, and grow it by copying sections on demand.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A new operator opens config.yaml"]):::plain
    MID(["a ~30-line minimal config is the starting point"]):::plain
    START --> MID
    MID -->|"reason: only required keys are present"| OUT(["They boot immediately"]):::fix
    OUT --> DONE(["they add sections as they need them"]):::ok
```
