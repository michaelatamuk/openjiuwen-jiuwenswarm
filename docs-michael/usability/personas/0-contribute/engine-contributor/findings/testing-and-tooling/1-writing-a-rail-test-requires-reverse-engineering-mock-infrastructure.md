---

# Writing a rail test requires reverse-engineering mock infrastructure

*Concern: Extension Testing & Tooling*

---

## The problem today

The mock test infra (`MockLLMModel`) is excellent but undocumented and internal; `_make_agent()` is a private helper, so writing a rail test means reading test source.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A developer tests their rail"]):::plain
    MID(["the mock infra is undocumented/internal"]):::plain
    START --> MID
    MID -->|"reason: no public testing module exists"| OUT(["They reverse-engineer the test helpers"]):::fail
    OUT --> DONE(["writing a test is slow and fragile"]):::fail
```

---

## The proposed fix

A public `openjiuwen.testing` module (`make_test_agent`, `MockLLMModel`, ...) and a "Testing your rail" guide so a test fits in under 20 lines.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A developer tests their rail"]):::plain
    MID(["public test helpers + a guide exist"]):::plain
    START --> MID
    MID -->|"reason: openjiuwen.testing is exposed"| OUT(["They write a test quickly"]):::fix
    OUT --> DONE(["rails are tested reliably"]):::ok
```
