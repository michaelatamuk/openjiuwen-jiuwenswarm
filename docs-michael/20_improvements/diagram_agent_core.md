# Agent Core — Features Overview

```mermaid
flowchart TD
    T(["📋 Task"])

    T --> EL

    subgraph Infra["⚙️ Infrastructure"]
        EL["⚡ fix/event-loop-blocking  #28
        Prevents async crashes
        mid-run"]
    end

    EL --> MR

    subgraph Scale["🚀 Scale & Selection"]
        direction TB
        MR["🔄 feat/multi-rollout-task-execution  #38
        Runs the same task N times
        in parallel — independently"]

        MR --> R1["🤖 Run 1"] & R2["🤖 Run 2"] & RN["🤖 … Run N"]

        R1 & R2 & RN --> BN["🏆 feat/auto-harness-best-of-n  #37
        Auto-harness picks the strongest
        result across all N runs"]
    end

    BN --> ReactFix

    subgraph ReactFix["🔁 ReAct Loop Quality"]
        direction LR
        AR["🔂 fix/react-anti-repetition-prompt  #26
        Breaks endless reasoning loops
        that waste iteration budget"]

        PS["📝 feat/react-agent-prompt-serialization  #21
        Serialises the full ReAct prompt
        for reproducibility & regression testing"]
    end

    ReactFix --> Out(["✅ Final Output"])
```

## Reading the diagram

| Phase | What happens | Feature(s) |
|-------|-------------|------------|
| **Infrastructure** | Async event loop is stabilised before any work starts | #28 |
| **Scale** | Task is run N independent times; strongest result is selected | #38 → #37 |
| **ReAct quality** | Each individual run has loop-breaking and prompt capture | #26, #21 |

> **Core idea:** instead of betting everything on one run, run N times in parallel and pick the winner — while keeping each run stable and loop-free.
