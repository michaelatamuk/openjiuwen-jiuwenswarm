---

# No way to see every LLM/tool call and token behind a run

*Concern: Explanation & Visibility*

---

## The problem today

A team run shows only the final answer. There is no interactive span waterfall to inspect prompts, tool calls, tokens, cost, message routing and member lifecycle.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A team run finishes"]):::plain
    MID(["only the final answer is shown"]):::plain
    START --> MID
    MID -->|"reason: no span waterfall is exposed"| OUT(["Calls, tokens and cost are hidden"]):::fail
    OUT --> DONE(["failures and cost spikes can't be diagnosed"]):::fail
```

---

## The proposed fix

Expose the existing span tree as an interactive waterfall: each LLM and tool call as a span with prompt, result, tokens, cost and timing; message routing and member lifecycle shown inline. The trajectory store already records this data.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A team run finishes"]):::plain
    MID(["a span waterfall shows every call, token and cost"]):::plain
    START --> MID
    MID -->|"reason: spans are already recorded per run"| OUT(["Any call can be inspected in place"]):::fix
    OUT --> DONE(["runs are explainable and cost is attributable"]):::ok
```
