# Unified Features Diagram

> **Blue** = agent-core &nbsp;|&nbsp; **Dark green** = jiuwenswarm session &nbsp;|&nbsp; **Orange** = jiuwenswarm per-iteration &nbsp;|&nbsp; **Navy** = parallel run slot

```mermaid
flowchart TD
    classDef ac     fill:#2E86AB,color:#fff,stroke:#1a5f7a
    classDef infra  fill:#455A64,color:#fff,stroke:#263238
    classDef init   fill:#00695C,color:#fff,stroke:#004D40
    classDef pre    fill:#E65100,color:#fff,stroke:#BF360C
    classDef post   fill:#BF360C,color:#fff,stroke:#7f2407
    classDef done   fill:#2E7D32,color:#fff,stroke:#1B5E20
    classDef io     fill:#37474F,color:#fff,stroke:#263238
    classDef run    fill:#01579B,color:#fff,stroke:#003c74
    classDef repair fill:#5E35B1,color:#fff,stroke:#311B92
    classDef side   fill:#00838F,color:#fff,stroke:#006064

    T(["📋 Task"]):::io

    %%──────────────── agent-core: stability ────────────────
    T --> EL28["Prevents async crash before any run starts
    ─── event-loop-blocking  #28"]:::ac

    %%──────────────── agent-core: multi-rollout ─────────────
    EL28 --> MR38["Clones workspace N times · injects a different strategy
    prompt into each clone · runs all clones in parallel
    ─── multi-rollout  #38"]:::ac

    %%── N runs fan out — each gets its own strategy prompt ──
    MR38 --> R1 & R2 & RN

    R1(["🤖 Run 1
    strategy: Correctness-focused
    explore deeply, all implications"]):::run

    R2(["🤖 Run 2
    strategy: Minimal-diff
    change as few lines as possible"]):::run

    RN(["🤖 ··· Run N
    strategy: Edge-case-focused
    boundaries, errors, defensive code"]):::run

    %%──────────────── jiuwenswarm: infra ───────────────────
    R1 & R2 & RN --> EL119["Prevents async crash inside jiuwenswarm runtime
    ─── event-loop-blocking  #119"]:::infra

    R1 & R2 & RN --> ACP139["Unblocks tools wrongly rejected by ACP runtime layer
    ─── acp-tool-blocking  #139"]:::infra

    EL119 & ACP139 --> Init

    %%──────────────── jiuwenswarm: session start ───────────
    subgraph Init["🚀  Session Start — injected once, pinned for whole run, survive compression"]
        direction LR
        TDR["Pins full task.md as permanent system-prompt section
        ─── task-description-reinjection  #371"]:::init
        OFR["Extracts output format hints from task.md and pins them
        ─── output-format-reminder  #401"]:::init
        ESD["Discovers and exposes task-environment skill scripts
        ─── external-skill-discovery  #214"]:::init
    end

    Init --> LoopLabel(["🔁  Iteration loop — repeats until done or budget exhausted"]):::io

    %%──────────────── team-verification side annotation ────
    TV["👥  In leader/sub-agent mode: reviewer agent independently
    scores each sub-agent's output and returns result + score
    to the leader — leader does not get a bare result, it gets
    a scored result it can reason about
    ─── team-verification-layer  #121"]:::side
    TV -.->|"scores sub-agents\ninside each run"| LoopLabel

    %%──────────────── jiuwenswarm: loop – before LLM ───────
    subgraph PreLLM["Before every LLM call"]
        direction LR
        IBA["Warns when remaining iterations are low
        ─── iteration-budget-awareness  #368"]:::pre
        CHG["Conciseness nudge at 60 % fill · critical directive at 80 %
        ─── context-headroom-guard  #397"]:::pre
        FPM1["Injects growing list of failed calls — do not repeat them
        ─── failure-pattern-memory  #396"]:::pre
        SBR["Forces full strategy rethink after N consecutive shell failures
        ─── step-back-rail  #399"]:::pre
    end

    LoopLabel --> PreLLM

    %%──────────────── LLM call (+ agent-core ReAct fixes) ──
    PreLLM --> LLM(["🤖  LLM call
    agent-core  ─── #26 anti-repetition prompt fix
    agent-core  ─── #21 prompt serialisation"]):::ac

    %%──────────────── jiuwenswarm: loop – before tool ──────
    subgraph PreTool["Before tool executes"]
        direction LR
        DD["Returns cached result for identical repeated calls
        ─── tool-call-dedup-cache  #372"]:::pre
        AU["Replaces hedging language with autonomous directives
        ─── autonomous-execution-mode  #370"]:::pre
    end

    LLM --> PreTool
    PreTool --> ToolNode(["🔧  Tool executes"]):::io

    %%──────────────── jiuwenswarm: loop – after tool ───────
    subgraph PostTool["After tool returns"]
        direction LR
        TR["Head + tail preserved — verifier errors never cut off
        ─── bash-output-truncation  #334"]:::post
        FPM2["Records error in session state if tool returned non-zero
        ─── failure-pattern-memory  #396"]:::post
    end

    ToolNode --> PostTool
    PostTool -->|"not done — next iteration"| LoopLabel

    %%──────────────── self-verification: conditional loop ──
    PostTool -->|"output produced"| SV

    SV["Agent runs the benchmark verifier script itself
    after producing any output file
    ─── self-verification-loop  #328"]:::done

    SV -->|"❌ verifier fails — go back and fix"| LoopLabel
    SV -->|"✅ verifier passes"| RS1 & RS2 & RSN

    %%── N results fan in ────────────────────────────────────
    RS1(["📄 Result 1"]):::run
    RS2(["📄 Result 2"]):::run
    RSN(["📄 ··· Result N"]):::run

    %%──────────────── agent-core: multi-rollout selector ───
    RS1 & RS2 & RSN --> Sel["Picks the winner from N completed runs
    Selector strategies (configurable):
    first_successful · longest_output · shortest_output
    ─── multi-rollout selector  #38"]:::ac

    Sel --> Out(["🏁 Final Output"]):::io

    %%──────────────── agent-core: best-of-N (CI repair) ────
    subgraph CIRepair["🔧  Auto-Harness CI Repair — separate flow, triggers only when CI fails inside a run"]
        BN37["When CI fails: clones workspace N times · repairs each clone
        with a different strategy (correctness · minimal-diff · edge-cases)
        · scores each by tests-passed / diff-size / lint-errors
        · promotes the highest-scoring patch back to the workspace
        ─── auto-harness-best-of-n  #37"]:::repair
    end

    Sel -.->|"if CI fails\ninside a run"| CIRepair
    CIRepair -.->|"repaired result\nback into run"| RS1
```

---

## Phase summary

| Phase | Who | What fires | PR(s) |
|-------|-----|-----------|-------|
| **Stability** | agent-core | Event loop fix | #28 |
| **Scale** | agent-core | Clones workspace N times, different strategy per run | #38 |
| **Runtime stability** | jiuwenswarm | Event loop fix, ACP tool unblock | #119, #139 |
| **Session start** | jiuwenswarm | Task pin, format pin, skill discovery | #371, #401, #214 |
| **Leader/sub-agent mode** | jiuwenswarm | Reviewer scores each sub-agent; leader gets result + score | #121 |
| **Before LLM call** | jiuwenswarm | Budget warn, context guard, failure list, step-back | #368, #397, #396, #399 |
| **LLM call** | agent-core | Anti-repetition prompt, prompt serialisation | #26, #21 |
| **Before tool** | jiuwenswarm | Dedup cache, autonomous mode | #372, #370 |
| **After tool** | jiuwenswarm | Bash truncation, record failure | #334, #396 |
| **Self-verification** | jiuwenswarm | Runs verifier; loops back to fix if it fails | #328 |
| **Multi-rollout selector** | agent-core | Picks winner: first\_successful / longest / shortest | #38 |
| **CI repair (if CI fails)** | agent-core | N repair strategies → score → promote best patch | #37 |
