[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# The structured error API isn't documented for rail authors

*Concern: Rails & Context API*

---

## The problem today

A rail that hits an error either raises a plain exception (losing `recoverable`/`fatal`/`code`) or must discover an undocumented error framework (`raise_error`).

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A rail hits an error"]):::plain
    MID(["the author raises a plain exception"]):::plain
    START --> MID
    MID -->|"reason: the structured error API is undocumented"| OUT(["recoverable/fatal metadata is lost"]):::fail
    OUT --> DONE(["the agent can't retry/surface correctly"]):::fail
```

---

## The proposed fix

Document the error framework in the rail guide, showing `raise_error(StatusCode..., recoverable=...)` — `recoverable=True` retries, `False` aborts.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A rail hits an error"]):::plain
    MID(["the author uses the documented error API"]):::plain
    START --> MID
    MID -->|"reason: raise_error + semantics are documented"| OUT(["the agent retries or aborts as intended"]):::fix
    OUT --> DONE(["errors carry the right intent"]):::ok
```

Concern: [Rails & Context API](README.md).
