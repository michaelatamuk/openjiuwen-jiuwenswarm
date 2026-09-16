---

# Docs are invisible to agents evaluating us (no llms.txt)

*Concern: Documentation & Stability*

---

## The problem today

There is no `llms.txt`/`llms-full.txt` index, so an agent pointed at the docs only gets whatever the crawler happens to find instead of a curated, self-updating summary.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["An agent is pointed at the docs"]):::plain
    MID(["there is no curated index to read"]):::plain
    START --> MID
    MID -->|"reason: no llms.txt is published"| OUT(["It sees an arbitrary crawl"]):::fail
    OUT --> DONE(["evaluation is inaccurate and slow"]):::fail
```

---

## The proposed fix

Publish generated `llms.txt` (curated index) and `llms-full.txt` (full concatenated docs), built from the docs tree in CI so they stay current whenever pages change.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["An agent is pointed at the docs"]):::plain
    MID(["llms.txt and llms-full.txt are published"]):::plain
    START --> MID
    MID -->|"reason: they are generated from the docs tree"| OUT(["It reads a curated summary"]):::fix
    OUT --> DONE(["evaluation is accurate and fast"]):::ok
```
