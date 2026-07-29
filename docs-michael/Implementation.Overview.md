# JiuwenSwarm Quality Improvements — Technical Overview

**Audience:** architects and developers of `agent-core` and `jiuwenswarm`
**Purpose:** master orientation document; each of the 8 groups has its own deep-dive

---

## 1. Architecture Context

### Layer Map

```
┌─────────────────────────────────────────────────────────┐
│  jiuwenswarm                                            │
│  ┌──────────────────────────────────────────────────┐  │
│  │  AutoHarness  (agents/harness/common/auto_harness │  │
│  │               /service.py)                        │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │  Symphony rails  (agents/harness/common/   │  │  │
│  │  │                   rails/*.py)              │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
│  ACP permission client  (acp/stdio_client.py)           │
└────────────────────┬────────────────────────────────────┘
                     │ uses
┌────────────────────▼────────────────────────────────────┐
│  agent-core / harness                                   │
│  DeepAgent  (harness/deep_agent.py)                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │  DeepAgentRail  (harness/rails/base.py)          │  │
│  │  hooks: before/after_task_iteration               │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  ReActAgent  (core/single_agent/agents/           │  │
│  │               react_agent.py)                     │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │  AgentRail  (core/single_agent/rail/base.py│  │  │
│  │  │  hooks: before/after_model_call             │  │  │
│  │  │           before/after_tool_call            │  │  │
│  │  │           before/after_invoke               │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
│  Runner + ResourceMgr  (core/runner/runner.py)          │
│  ContextEngine  (core/context_engine/)                  │
│  SystemPromptBuilder  (core/single_agent/prompts/       │
│                        builder.py)                      │
└─────────────────────────────────────────────────────────┘
```

### Execution Pipeline — Hook Points

Every rail in this project attaches to one or more of these labeled hook points. Group deep-dives reference them by letter.

```
[A]  ReActAgent.invoke() — before_invoke
[B]  DeepAgent outer loop — before_task_iteration
       ↓
[C]  SystemPromptBuilder assembles system prompt
     (ContextEngine builds full messages list)
       ↓
[D]  AgentRail — before_model_call
       ↓
[E]  LLM call
       ↓
[F]  AgentRail — after_model_call
       ↓
     Parse tool calls from LLM response
       ↓  (per tool call)
[G]  AgentRail — before_tool_call
       ↓
[H]  AbilityManager dispatches via Runner.resource_mgr
     → ACP permission check (acp/stdio_client.py)
     → Tool executes
       ↓
[I]  AgentRail — after_tool_call
       ↓
     Completion check — if done, exit inner loop
       ↓  (if not done, back to [C])
[J]  DeepAgent outer loop — after_task_iteration
       ↓
     Outer completion check — if done, exit
       ↓  (if not done, back to [B])
[K]  ReActAgent.invoke() — after_invoke
```

### How Rails Inject Into the System Prompt

Rails that need to inject text into the prompt do so via `SystemPromptBuilder`. Each `PromptSection` has:
- `content` — the text
- `priority` — sections are sorted; higher priority renders closer to the top
- `pinned=True` — exempt from `ContextEngine`'s automatic summarisation pass

Rails write sections at `AgentRail.before_model_call` or at session start `DeepAgentRail.before_task_iteration` for pinned content. The assembled prompt is then passed to the LLM at LLM call.

### Session State — Where Rails Read and Write

Stateful rails persist data between turns using the `AgentCallbackContext` passed to every hook. In jiuwenswarm this is backed by:

- `agents/harness/common/session_ops_service.py` — mutable per-session state store
- `server/runtime/session/` — durable session history (used by evolution layer)

Rails that need a persistent counter or log (e.g., failure counts, verifier fingerprints) write to a key in the session state dict at `AgentRail.after_tool_call` and read from it at `AgentRail.before_model_call` on the next turn.

---

## 2. Group-by-Group Overview

Each section below identifies: the failure mode, a feature summary, prior art, a data flow diagram, which hook points are used, and which files are touched.

---

#### <strong>Group 1 — Stability: Stop the agent from crashing before it even starts</strong>
<details><summary>Items #1–#3 &nbsp;|&nbsp; PRs: agent-core (PR #28) · jiuwenswarm (PR #119), (PR #139)</summary>

**Failure mode:<br>** The process hangs or crashes before any iteration fires, producing zero output.

**Feature summary:<br>**
These are prerequisites — if any of them is missing, the agent produces zero output before a single hook fires. Items #1 and #2 fix the same asyncio lifecycle bug at two independent layers. Item #3 fixes a tool duplication problem on the ACP channel: before this change, ACP tools were simply added on top of the existing default tools, leaving the agent with both registered simultaneously. Now when the ACP client declares fs/terminal capabilities, the default equivalents are removed first and then replaced by the ACP-specific tools; when the ACP client declares no capabilities (e.g. benchmark sandboxes), the defaults stay so the agent can still act autonomously.

| # | Feature | What it does |
|---|---|---|
| #1 | Event Loop Fix — agent-core | Replaces blocking asyncio call in `Runner` startup; prevents silent hang |
| #2 | Event Loop Fix — jiuwenswarm | Same asyncio fix at jiuwenswarm `AutoHarness` layer; independent of #1, both required |
| #3 | ACP Tool Deduplication Guard | Before this PR, ACP tools were added alongside default tools, causing duplication; now the default equivalents are removed first when the ACP client declares fs/terminal capabilities, and kept when it does not (e.g. benchmark sandboxes) |

**Prior art (Comptetitors):**

| Feature | System | Equivalent |
|---|---|---|
| #1 #2 | SWE-agent | Had identical asyncio lifecycle bug in early release |
| #1 #2 | OpenHands | Had identical asyncio lifecycle bug in early release |
| #1 #2 | AutoGPT | Had identical asyncio lifecycle bug in early release |
| #1 #2 | Note | Universal early-stage issue in Python async agent frameworks |
| #3 ACP Tool Filter | LangChain / LangGraph | Capability-scoped tool sets: tools declared in `allowed_tools` per agent/chain; no-op when capability not advertised |
| #3 | OpenAI Assistants API | Tool availability controlled by `tools` array on the assistant; omitting a tool removes it without breaking non-capable clients |
| #3 | OpenClaw | `before-tool-call` policy hooks (`agent-tools.before-tool-call.policy.ts`) — tool availability decided at dispatch time by capability flags in the channel context |
| #3 | Hermes | Toolset `check_fn()` inspects request context before registering a tool; `tools.disabled` list removes tools for channels lacking the matching capability |

<b>Data Flow</b>

```mermaid
flowchart TD
    classDef fix  fill:#2E7D32,color:#fff,stroke:#1B5E20
    classDef fail fill:#B71C1C,color:#fff,stroke:#7f0000
    classDef ok   fill:#01579B,color:#fff,stroke:#003c74
    classDef cfg  fill:#37474F,color:#fff,stroke:#263238

    T(["📋 Task"])

    T --> AC["agent-core Runner startup
    core/runner/runner.py"]

    AC -->|"❌ blocking asyncio call"| H1(["hangs silently"]):::fail
    AC -->|"✅ (PR #28) — async await replaces blocking call"| JW["jiuwenswarm AutoHarness startup
    auto_harness/service.py"]:::fix

    JW -->|"❌ same blocking-call pattern"| H2(["RuntimeError: loop already running"]):::fail
    JW -->|"✅ (PR #119) — same fix at jiuwenswarm layer"| ADP["JiuWenSwarmDeepAdapter
    _refresh_runtime_tools()"]:::fix

    ADP --> CH{"channel_id == 'acp'?"}:::cfg

    CH -->|"no (web / CLI / etc.)"| RUN1(["Default tools kept, agent runs ✅"]):::ok

    CH -->|"yes"| CAP{"ACP client declares
    fs or terminal capabilities?
    (acp_client_capabilities in metadata)
    (PR #139)"}:::cfg

    CAP -->|"yes — ACP provides
    replacement runtime tools"| STRIP["Strip _ACP_BLOCKED_DEFAULT_TOOL_NAMES
    (read_file, write_file, bash, …)
    Register ACP runtime tools instead"]:::fix

    CAP -->|"no — e.g. benchmark sandbox,
    no UI to provide replacements"| KEEP["Keep default file/shell tools
    agent can still work autonomously"]:::ok

    STRIP & KEEP --> RUN2(["Agent runs normally ✅"]):::ok
```

<u>Technical Details</u>

<details>
<summary><strong>#1 — Event Loop Fix — agent-core</strong> &nbsp;(<code>fix/event-loop-blocking</code> (PR #28))</summary>

<br>

**How it works**

- Root cause: blocking `asyncio` call inside `Runner` startup sequence
- Symptom: entire task process hangs silently — zero output, no error message
- Fix: replace the blocking call with proper `async/await`
- This must be fixed before any hook fires; a hung process produces nothing

**Technical metadata**

| | |
|---|---|
| **Hook points** | None — process-level fix, before any hook fires |
| **Files** | `core/runner/runner.py` — `Runner.__init__` / startup sequence |

</details>

<br>

<details>
<summary><strong>#2 — Event Loop Fix — jiuwenswarm</strong> &nbsp;(<code>bugfix/event-loop-blocking</code> (PR #119))</summary>

<br>

**How it works**

- Same root cause as #1 — blocking `asyncio` call, at the jiuwenswarm `AutoHarness` layer instead of agent-core
- Symptom: sessions hang or raise `RuntimeError: This event loop is already running` mid-task
- Fixes #1 and #2 are independent — both must be applied
- Fix: same `async/await` replacement at the jiuwenswarm layer

**Technical metadata**

| | |
|---|---|
| **Hook points** | None — service-level startup fix |
| **Files** | `agents/harness/common/auto_harness/service.py` |

</details>

<br>

<details>
<summary><strong>#3 — ACP Tool Deduplication Guard</strong> &nbsp;(<code>feat/acp-runtime-tool-blocking</code> (PR #139))</summary>

<br>

**How it works**

- The ACP channel provides its own runtime tools for file and terminal access (`read_text_file`, `write_text_file`, `create_terminal`, etc.) when the ACP client has the corresponding capabilities
- **Problem before this PR:** `_refresh_acp_runtime_tools()` only added ACP tools — it never removed the default equivalents (`read_file`, `write_file`, `bash`, etc.). The agent ended up with both sets registered simultaneously, creating tool duplication and ambiguity
- **Fix (two new code blocks added):**
  - **Block 1 — remove defaults before adding ACP tools:** `if channel_id == "acp" and can_register_acp_runtime_tools`: iterate `ability_manager`, remove any tool whose name is in `_ACP_BLOCKED_DEFAULT_TOOL_NAMES`; this runs only when the ACP client actually has capabilities, so benchmark sandboxes and other ACP callers without caps keep their defaults and can still act autonomously
  - **Block 2 — clean up stale ACP tools:** always remove previously registered ACP tool names before re-registering; prevents accumulation across re-entrant calls on the same session
- `_acp_runtime_tools_enabled(request_metadata)` reads `caps["fs"]` and `caps["terminal"]` from `acp_client_capabilities` in the request metadata to determine which replacement tools the client can provide
- `_should_register_acp_runtime_tools(channel_id, request_id, session_id, has_runtime_capability)` returns `True` only when channel is `"acp"`, both `request_id` and `session_id` are set, and at least one capability is declared

**Technical metadata**

| | |
|---|---|
| **Hook points** | Request-level adapter — `JiuWenSwarmDeepAdapter._refresh_runtime_tools()`, not a standard rail hook |
| **Key methods** | `_acp_runtime_tools_enabled()`, `_should_register_acp_runtime_tools()` (both in `interface_deep.py`) |
| **Files** | `jiuwenswarm/server/runtime/agent_adapter/interface_deep.py` (only changed file in this PR) |

</details>

</details>

---

#### <strong>Group 2 — Scale: Try more than one approach, submit the best</strong>
<details><summary>Items #4–#6 &nbsp;|&nbsp; PRs: agent-core (PR #38), (PR #37) · jiuwenswarm (PR #1425)</summary>

**Failure mode:<br>** A single deterministic attempt on a hard task has a low per-attempt success probability. Running once is insufficient.

**Feature summary:<br>**
All three features apply the same principle — "try N variants, keep the best" — but at different levels and with different entry points. #4 and #6 are triggered by a regular user task (agent invocation). #5 is triggered by the developer manually running `openjiuwen auto-harness run` (CLI or REPL), which executes its own Assess → Plan → Implement → Verify pipeline independent of the agent's task loop.

| # | Feature | What it does |
|---|---|---|
| #4 | Multi-Rollout | Runs N workspace clones in parallel with different strategies; `FirstSuccessfulSelector` / `LongestOutputSelector` / `ShortestOutputSelector` picks the best output |
| #5 | Auto-Harness Best-of-N | When CI fails in the verify stage, runs N fix agents on workspace clones (one per strategy); `BestOfNSelector` promotes the winner by `tests_passed` → `diff_lines` → `lint_errors` |
| #6 | RLAF-P Prompt Optimizer | RL loop generating N prompt candidates; scored by composite reward; winner persisted to `PromptMemory` for reuse |

**Prior art (Comptetitors):**

| Feature | System | Equivalent |
|---|---|---|
| #4 | SWE-agent | `--num_attempts N` flag |
| #4 | LATS (Language Agent Tree Search) | Tree of attempts with backtracking |
| #4 | AlphaCode | Samples thousands of candidates; filters by test pass rate |
| #4 | Claude Code | Internal pass@k evaluation harness |
| #4 | OpenHands | `--num_experiments` flag |
| #4 | Hermes | MoA loop (`moa_loop.py`) — up to 8 concurrent reference advisors run in parallel; most direct internal precedent for multi-rollout |
| #5 | AlphaCode | Candidate filtering by test pass rate |
| #5 | SWE-bench | Evaluation scripts pick best patch per model |
| #5 | Devin | Internal retry-with-repair mechanism |
| #5 | OpenHands | Patch ranking across repair attempts |
| #6 | DSPy (Stanford) | `MIPROv2` / `BootstrapFewShot` — closest direct equivalent |
| #6 | OPRO (Google DeepMind) | Uses an LLM as optimizer to iteratively improve prompts |
| #6 | TextGrad | Gradient-based text/prompt optimization |
| #6 | APE (Zhou et al. 2022) | Automatic Prompt Engineer — generates and scores candidates |
| #6 | PE2 / ProTeGi | Evolutionary and error-analysis-based prompt improvement |
| #6 | Hermes | `learn_prompt.py` — skill learning from turn feedback (direct RLAF-P equivalent); `background_review.py` — post-turn daemon reviews and updates skill prompts |

<b>Data Flow</b>

```mermaid
flowchart TD
    classDef ac     fill:#2E86AB,color:#fff,stroke:#1a5f7a
    classDef cli    fill:#6A1B9A,color:#fff,stroke:#4A148C
    classDef opt    fill:#5E35B1,color:#fff,stroke:#311B92
    classDef run    fill:#01579B,color:#fff,stroke:#003c74
    classDef done   fill:#2E7D32,color:#fff,stroke:#1B5E20
    classDef repair fill:#E65100,color:#fff,stroke:#BF360C
    classDef old    fill:#546E7A,color:#fff,stroke:#263238
    classDef stage  fill:#37474F,color:#fff,stroke:#263238

    %% ── #4 Multi-Rollout: triggered by a regular user task ──────────────
    T(["📋 User Task"])

    T --> MR["MultiRolloutExecutor  (PR #38)
    harness/multi_rollout/executor.py
    DeepAgent.invoke() early-return gate"]:::ac

    MR --> R1(["Run 1 — Correctness strategy"]):::run
    MR --> R2(["Run 2 — Minimal-diff strategy"]):::run
    MR --> RN(["Run N — Edge-case strategy"]):::run

    R1 & R2 & RN --> GATHER["asyncio.gather — all N run in parallel"]

    GATHER --> SEL["selector  (PR #38)  harness/multi_rollout/selector.py
    FirstSuccessfulSelector (default)
    LongestOutputSelector · ShortestOutputSelector"]:::ac
    SEL --> OUT4(["🏁 Best output returned to user"]):::done

    %% ── #5 Best-of-N: triggered by developer CLI / REPL ─────────────────
    DEV(["🔧 Developer:
    openjiuwen auto-harness run
    (CLI or REPL command)"]):::cli

    DEV --> ORCH["AutoHarnessOrchestrator
    auto_harness/orchestrator.py"]:::cli

    ORCH --> S1["Assess stage"]:::stage
    S1 --> S2["Plan stage"]:::stage
    S2 --> S3["Implement stage"]:::stage
    S3 --> VER["MetaVerifyStage
    auto_harness/stages/verify.py"]:::stage

    VER --> CI{"CI gate
    lint + type-check + tests"}
    CI -->|passed| S4["Commit / Publish stages"]:::stage

    CI -->|"failed + best_of_n_enabled=False
    existing path"| FL["FixLoopController
    phase 1: up to 10 attempts
    phase 2: up to 9 attempts
    19 sequential fix tries total"]:::old
    FL --> S4

    CI -->|"failed + best_of_n_enabled=True
    new path  (PR #37)"| BON["BestOfNController
    auto_harness/pipelines/best_of_n/controller.py
    clone workspace N times"]:::repair

    BON -->|"sequential"| A1(["Attempt 1"]):::run
    A1 -->|"sequential"| A2(["Attempt 2"]):::run
    A2 -->|"sequential"| AN(["Attempt N"]):::run

    AN --> SCORE["AttemptScorer
    tests_passed · diff_lines · lint_errors"]:::repair
    SCORE --> PICK["BestOfNSelector
    max tests_passed → min diff → min lint"]:::repair
    PICK --> PROMOTE["promote winner workspace
    clean up losers"]:::repair
    PROMOTE --> S4

    S4 --> OUT5(["🏁 Improved harness committed"]):::done

    %% ── #6 RLAF-P: leader agent calls optimize_prompt tool ─────────────
    T --> LEADER["Leader Agent workflow
    PromptOptimizerPromptRail injects guidance
    on when to call optimize_prompt"]:::opt
    LEADER -->|"calls optimize_prompt tool  (PR #1425)"| PP["PromptPolicy
    generate N prompt candidates
    symphony/optimization/"]:::opt
    PP --> PE["PromptEnvironment
    execute each candidate in parallel"]:::opt
    PE --> CR["CompositeReward
    correctness ×1.0  completeness ×0.3
    latency ×0.1  drift penalty"]:::opt
    CR --> PM["PromptMemory
    JSONL / FAISS — persist winner"]:::opt
    PM --> RQ["PromptOptimizerReviewRail
    surfaces pending results to leader
    human reviews before going live"]:::opt
    RQ -->|"approved — prompt published"| PP
    RQ -->|"next session reuse"| OUT4
```

<u>Technical Details</u>

<details>
<summary><strong>#4 — Multi-Rollout Task Execution</strong> &nbsp;(agent-core <code>feat/multi-rollout-task-execution</code> (PR #38))</summary>

<br>

**How it works**

- Early-return gate in `DeepAgent.invoke()`: if `deep_config.multi_rollout.enabled`, delegate to `MultiRolloutExecutor` before the standard pipeline starts
- `MultiRolloutExecutor._create_subagents(n)`: create N isolated subagents
- `_build_attempt_inputs()`: inject a strategy prefix into the query for each subagent:
  - Attempt 0: focus on correctness and thoroughness
  - Attempt 1: focus on minimal changes — change as few lines as possible
  - Attempt 2: focus on edge cases and defensive programming
- `_execute_parallel()`: run all N via `asyncio.gather` with `asyncio.Semaphore(max_parallel)` for concurrency control; each attempt has an individual `timeout_per_rollout` (default 600 s)
- Selector picks the winner from `RolloutResult` objects: `FirstSuccessfulSelector` (default) / `LongestOutputSelector` / `ShortestOutputSelector`
- Converts single-attempt to pass@k: expected pass rate rises from p → 1-(1-p)^N

**Technical metadata**

| | |
|---|---|
| **Hook points** | Early-return in `DeepAgent.invoke()` before `ReActAgent.before_invoke` — bypasses the standard pipeline entirely |
| **New classes** | `MultiRolloutExecutor`, `MultiRolloutConfig`, `RolloutResult`, `FirstSuccessfulSelector`, `LongestOutputSelector`, `ShortestOutputSelector` |
| **Config** | `multi_rollout.enabled` (bool, default `False`); `multi_rollout.n_rollouts` (int, default 3); `multi_rollout.selector_kind` (str, default `"first_successful"`); `multi_rollout.timeout_per_rollout` (float, default 600.0 s) |
| **Files** | `openjiuwen/harness/multi_rollout/executor.py`, `config.py`, `selector.py`; `openjiuwen/harness/schema/config.py` (`DeepConfig.multi_rollout` field); `openjiuwen/harness/deep_agent.py` (early-return gate in `invoke()`) |

</details>

<br>

<details>
<summary><strong>#5 — Auto-Harness Best-of-N</strong> &nbsp;(agent-core <code>feat/auto-harness-best-of-n</code> (PR #37))</summary>

<br>

**How it works**

- **Entry point:** this is not triggered by a user task. It runs inside the `openjiuwen auto-harness run` CLI / REPL pipeline — a developer tool that runs its own Assess → Plan → Implement → Verify → Commit pipeline to improve the harness itself
- Replaces the iterative fix loop (phase 1: 10 tries + phase 2: 9 tries = 19 sequential attempts) when enabled
- Trigger: `MetaVerifyStage.stream()` — fires after the implement stage when `CIGateRunner` reports CI failure AND `best_of_n_enabled = True`
- Clone the current workspace N times via `WorkspaceCloner.clone_n_async()` (default N = 3)
- For each clone, run the fix agent **sequentially** (sequential is required; each attempt calls `os.chdir` into its clone) with a strategy-specific prompt:
  - Attempt 0: "CI failed — fix focusing on correctness"
  - Attempt 1: "CI failed — minimal code changes, change as few lines as possible"
  - Attempt 2: "CI failed — fix focusing on edge cases and boundary conditions"
- Score each completed workspace via `AttemptScorer`:
  - `tests_passed`: result from `CIGateRunner.run("all")` on the clone
  - `diff_lines`: total insertions + deletions from `git diff HEAD --stat`
  - `lint_errors`: violation count from `ruff check --output-format json`
- `BestOfNSelector` picks winner: max `tests_passed` → min `diff_lines` → min `lint_errors`
- Promote winning workspace back to the original path; clean up all other clones

**Technical metadata**

| | |
|---|---|
| **Hook points** | `MetaVerifyStage.stream()` in the auto-harness verify stage — not a standard rail hook point |
| **New classes** | `BestOfNController`, `AttemptScorer`, `AttemptScore`, `ScoredAttempt`, `BestOfNSelector`, `BestOfNResult` |
| **Config** | `best_of_n_enabled` (bool, default `False`); `best_of_n_attempts` (int, default 3) — both in `AutoHarnessConfig` |
| **Files** | `openjiuwen/auto_harness/pipelines/best_of_n/controller.py`, `attempt_scorer.py`, `attempt_selector.py`; `openjiuwen/auto_harness/stages/verify.py` (MetaVerifyStage); `openjiuwen/auto_harness/orchestrator.py` (BestOfNController init) |

</details>

<br>

<details>
<summary><strong>#6 — RLAF-P Runtime Prompt Optimizer</strong> &nbsp;(jiuwenswarm <a href="https://github.com/openJiuwen-ai/jiuwenswarm/pull/1425"><code>feat/optimization</code> (PR #1425)</a>)</summary>

<br>

**How it works**

- Gated by `symphony.optimization.enabled` (default false); restricted to team leader role
- Generate N candidate prompts via `PromptPolicy`
- Execute each candidate via `PromptEnvironment`
- Score with composite reward: correctness ×1.0 · completeness ×0.3 · latency ×0.1 · token cost · drift penalty
- Persist best performer to JSONL prompt knowledge base (`PromptMemory`) for reuse across sessions
- `PromptOptimizerReviewRail` surfaces winning candidates to the leader for human confirmation before any prompt goes live

**Technical metadata**

| | |
|---|---|
| **Hook points** | `optimize_prompt` tool call + `PromptOptimizerReviewRail` at `AgentRail.before_model_call` for leader only |
| **New classes** | `PromptPolicy`, `PromptEnvironment`, `CompositeReward`, `LLMDriftJudge`, `ConvergenceDetector`, `PromptMemory`, `PromptOptimizerReviewRail` |
| **Config** | `symphony.optimization.enabled` (bool, default false) |

</details>

</details>

---

#### <strong>Group 3 — Session Start: Make sure the agent begins with everything it needs</strong>
<details><summary>Items #7–#9 &nbsp;|&nbsp; PRs: jiuwenswarm (PR #371), (PR #401), (PR #214)</summary>

***Failure mode:<br>** The agent starts each task with no knowledge of the output contract or available tools. After compression, even its memory of the goal becomes lossy.

**Feature summary:<br>**
All three rails add a permanent section to `SystemPromptBuilder` so the content lives in the system prompt rather than the conversation history and is therefore never removed by context compression. #7 and #8 hook into `ReActAgent.before_invoke` (fires at the start of each task iteration) with a `before_model_call` retry in case the file is not yet available at invoke time. #9 scans external skill dirs at the same point.

| # | Feature | What it does |
|---|---|---|
| #7 | Task Description Re-injection | Reads `task.md` in full and adds it as a `PromptSection(priority=12)` in the system prompt; the agent always has the original goal regardless of how long the conversation has grown |
| #8 | Output Format Reminder | Extracts the last 1–2 format-signal paragraphs and fenced code blocks (json/csv/yaml/xml/…) from `task.md`; adds as `PromptSection(priority=14)`; capped at 800 chars |
| #9 | External Skill Directories | Loads skills from configurable paths (`skills.external_dirs` in config or `EXTERNAL_SKILL_DIRS` env var); injects skill catalogue into system prompt at `priority=900`; `external_only` flag isolates the agent to task-provided skills only (CI/benchmark use) |

**Prior art (Competitors):**

| Feature | System | Equivalent |
|---|---|---|
| #7 | SWE-agent | `{issue}` template variable injects task description verbatim into every model call |
| #7 | Claude Code | Reinjects active task/todo content into each call |
| #7 | OpenHands | Pins task description in system prompt |
| #7 | Devin | Maintains persistent task context throughout the session |
| #7 | Hermes | Persistent task goal injection in system prompt via `turn_context.py:compose_user_api_content()` |
| #7 | OpenClaw | Task passed as `params.prompt` — injected into agent context before first turn |
| #8 | SWE-agent | Patch format requirements in every prompt: "must be in unified diff format" |
| #8 | Aider | Diff format instructions pinned permanently in system prompt |
| #8 | Claude Code | Output format instructions included in system prompt |
| #8 | Hermes | Output contract pinned for each skill invocation |
| #9 | SWE-agent | **RepoMap** — compressed repo structure injected at session start |
| #9 | Aider | Uses RepoMap identically |
| #9 | Claude Code | File and tool discovery at startup |
| #9 | GitHub Copilot Workspace | Scans repo structure before generating a plan |
| #9 | Hermes | Core feature: `prompt_builder.py` scans `skills/` for `SKILL.md` files and injects catalogue into system prompt at session start — direct equivalent |

<b>Data Flow</b>

```mermaid
flowchart TD
    classDef init fill:#00695C,color:#fff,stroke:#004D40
    classDef pin  fill:#2E86AB,color:#fff,stroke:#1a5f7a
    classDef eng  fill:#37474F,color:#fff,stroke:#263238

    INIT(["🚀 Session Start
    DeepAgentRail.before_task_iteration
    first iteration only"])

    INIT --> TD_GATE{"task_description.enabled?"}
    INIT --> OF_GATE{"output_format.enabled?"}
    TD_GATE -->|"yes"| TDR["task_description_rail.py  (PR #371)
    reads /app/task.md → full content
    PromptSection priority=12"]:::init
    TD_GATE -->|"no"| SPB

    OF_GATE -->|"yes"| OFR["output_format_rail.py  (PR #401)
    reads /app/task.md → last 1-2 paras
    + fenced code blocks (json/csv/yaml/…)
    PromptSection priority=14  max 800 chars"]:::init
    OF_GATE -->|"no"| SPB

    INIT --> SKILL_GATE{"external_dirs
    provided in config?"}

    SKILL_GATE -->|"no"| PERS_ONLY["SkillUseRail:
    personal skills dir only
    (existing path)"]:::init

    SKILL_GATE -->|"yes"| EXT_ONLY{"external_only?"}

    EXT_ONLY -->|"yes"| ESD_ONLY["SkillUseRail:
    only external skill dirs
    personal skills suppressed"]:::init

    EXT_ONLY -->|"no"| ESD_BOTH["SkillUseRail:
    personal + external dirs
    merged"]:::init

    PERS_ONLY & ESD_ONLY & ESD_BOTH --> SKILLS_SECT["skills catalogue
    PromptSection priority=40
    one-line summary per skill"]:::init

    TDR & OFR & SKILLS_SECT --> SPB["SystemPromptBuilder
    pinned=True → ContextEngine cannot drop
    these sections during summarisation"]:::pin

    SPB --> ALL(["Every subsequent iteration
    all 3 sections always present in prompt"]):::eng
```

<u>Technical Details</u>

<details>
<summary><strong>#7 — Task Description Re-injection</strong> &nbsp;(<code>feat/task-description-reinjection</code> (PR #371))</summary>

<br>

**How it works**

- `before_invoke` fires at the start of each task iteration: clears any previous section, then calls `_try_inject()` to read the file and add a fresh section
- `before_model_call` also calls `_try_inject()` on every model call until `self._injected` is `True` — handles the case where the file is mounted asynchronously and not yet present at invoke time
- Once injected, the section lives in `SystemPromptBuilder` for the remainder of the invocation — it is part of the system prompt, not the conversation history, so context compression never touches it
- Content injected: `# Task Description\n\n<full file content>` as `PromptSection(name="task_description", priority=12)` — sits just after the INTRO section (10) and before SYSTEM (15), so the agent reads the full goal at the very top of every system prompt
- If the file is absent or unreadable: logs a warning and skips — no crash, no side effect
- Addresses the most common form of task drift: after 20+ turns of context compression, the agent's working memory of the goal becomes lossy; the system-prompt section never moves

**Technical metadata**

| | |
|---|---|
| **Hook points** | `ReActAgent.before_invoke` (each task iteration) + `AgentRail.before_model_call` (retry until file available) |
| **Config** | `task_description.enabled` (bool, default `false`); `task_description.path` (str, default `/app/task.md`) |
| **Prompt position** | `PromptSection(priority=12)` — after INTRO (10), before SYSTEM (15) |
| **File** | `agents/harness/common/rails/task_description_rail.py` |

</details>

<br>

<details>
<summary><strong>#8 — Output Format Reminder Rail</strong> &nbsp;(<code>feat/output-format-reminder-rail</code> (PR #401))</summary>

<br>

**How it works**

- Same lifecycle as #7: `before_invoke` clears and re-injects at each invocation; `before_model_call` retries until `self._injected` is `True`
- **Extraction pipeline** (all steps operate on the YAML-frontmatter-stripped body):
  - `_last_paragraphs(body, n=2)` — takes the last 2 non-empty paragraphs
  - `_has_format_signal(para)` — filters: only keeps paragraphs containing words like `output`, `save`, `write`, `store`, `produce`, `generate`, `file`, `path`, `csv`, `json`, `yaml`, etc.
  - `_output_code_blocks(body, max_blocks=2)` — finds fenced code blocks tagged with any of: `json`, `csv`, `tsv`, `yaml`, `yml`, `xml`, `toml`, `txt`, `text`, `plaintext`
  - If neither relevant paragraphs nor code blocks are found: section is silently skipped
- Builds snippet: filtered paragraphs first, then code blocks; hard-truncated at `max_chars` (default 800) on a newline boundary
- Injects: `# Required Output Format\n\n{snippet}` as `PromptSection(name="output_format_reminder", priority=14)` — sits just after the full task description (12) and before SYSTEM (15)
- One wrong key name or wrong file extension renders output unusable even when the answer content is correct; this section keeps the format contract visible regardless of context length

**Technical metadata**

| | |
|---|---|
| **Hook points** | `ReActAgent.before_invoke` (each task iteration) + `AgentRail.before_model_call` (retry until file available) |
| **Config** | `output_format.enabled` (bool, default `false`); `output_format.path` (str, default `/app/task.md`); `output_format.max_chars` (int, default `800`) |
| **Prompt position** | `PromptSection(priority=14)` — after task description (12), before SYSTEM (15) |
| **File** | `agents/harness/common/rails/output_format_rail.py` |

</details>

<br>

<details>
<summary><strong>#9 — External Skill Directories</strong> &nbsp;(<code>feat/external-skill-discovery</code> (PR #214))</summary>

<br>

**How it works**

- Fires once at session start — `DeepAgentRail.before_task_iteration`, first iteration only; no-op on all subsequent turns
- Skills are loaded from **configurable external directories** — two equivalent config methods, merged together:
  - **YAML**: `skills.external_dirs` in `config.yaml` — a list of paths on disk
  - **Env var**: `EXTERNAL_SKILL_DIRS` — semicolon-separated paths (useful in CI where config files are not mounted)
- Each configured directory is scanned for `SKILL.md` files; the first paragraph of each file is extracted as a one-line summary
- Result injected into the system prompt as `PromptSection(pinned=True, priority=900)` — one entry per skill: name + summary; `ContextEngine` cannot drop this section during summarisation
- **`external_only: true`** (config flag): when external dirs are non-empty, suppresses the agent's personal installed-skills dir entirely — only the task-provided skills are visible; falls back to personal dir if external dirs are empty; designed for CI and benchmark pipelines where personal skills would be distractors
- **Precedence**: if a skill with the same name exists in both the personal dir and an external dir, the personal dir wins; external duplicates are silently skipped
- **Primary use cases**: CI / benchmark pipelines that mount task-specific skills at a known path; development workflows where skills live in a project repo and should be testable without installing via the UI
- Without this: agents in benchmark / CI environments have no knowledge of task-specific `SKILL.md` files → re-implement skill logic from scratch → wrong output formats, missing validation rules

**Technical metadata**

| | |
|---|---|
| **Hook points** | `DeepAgentRail.before_task_iteration` first iteration only; `PromptSection(pinned=True, priority=900)` |
| **Config** | `skills.external_dirs` (YAML list of paths); `EXTERNAL_SKILL_DIRS` (env var, semicolon-separated); `skills.external_only` (bool, default `false`) |
| **File** | `rails/runtime_prompt_rail.py` (or dedicated skill-discovery rail) |

</details>

</details>

---

#### <strong>Group 4 — Budget Awareness: Don't waste the limited number of steps</strong>
<details><summary>Items #10–#12 &nbsp;|&nbsp; PRs: jiuwenswarm (PR #368), (PR #372), (PR #370)</summary>

***Failure mode:<br>** The agent exhausts its iteration budget on redundant reads, confirmation pauses, and exploration without ever writing output.

**Feature summary:<br>**
Each rail targets a different cause of budget exhaustion. #10 and #11 hook into `AgentRail.before_model_call` / `before_tool_call`. #12 is different — it injects directives into the system prompt at agent initialisation so the LLM never produces hedging or confirmation requests in the first place.

| # | Feature | What it does |
|---|---|---|
| #10 | Iteration Budget Rail | On each `before_model_call` computes `remaining = max_iterations − iteration`; injects a budget-warning section (priority 96) when `remaining ≤ threshold` (default 10); section removed when back above threshold |
| #11 | Tool Call Dedup Cache | Per-turn: suppresses identical repeat calls within one LLM response (MD5-8 key); cross-turn: injects a prompt warning (priority 97) after `warn_after` real executions of the same call |
| #12 | Autonomous Execution Mode | Injects a static directive block (priority 9, before INTRO) at agent init and each `before_invoke`; directs the LLM to never ask for clarification, never hedge, act and verify autonomously |

**Prior art (Comptetitors):**

| Feature | System | Equivalent |
|---|---|---|
| #10 | SWE-agent | `Current step: N / max_steps` counter in every prompt |
| #10 | OpenHands | `max_iterations` parameter with visible counter |
| #10 | Claude Code | Communicates remaining turns to the agent |
| #10 | AutoGPT | Configurable step limits |
| #10 | Hermes | `IterationBudget` class (`iteration_budget.py`) — `max_iterations` (default 500 parent / 50 subagents); `consume()` / `refund()` / `remaining`; graceful fallback via `_handle_max_iterations()` |
| #10 | OpenClaw | Lane-based queueing instead of iteration cap — no hard max-iterations limit; contrast: opposite design choice |
| #11 | LangChain `InMemoryCache` | Caches LLM calls by prompt hash — same concept, one layer up |
| #11 | LangSmith / Helicone | Tool result caching across calls |
| #11 | SWE-agent | Implicit dedup via structured ACI history — no explicit cache |
| #11 | OpenClaw | `hashToolCall` / `digestStable` (SHA-256) in `tool-loop-detection.ts` — hashes tool call arguments for repeat detection; closest equivalent |
| #12 | Claude Code | `--dangerously-skip-permissions`; system prompt written to never ask for confirmation |
| #12 | SWE-agent | ACI prompt explicitly: "Do not ask for confirmation — just do it" |
| #12 | Devin | Fully autonomous execution by design; no confirmation prompts |
| #12 | OpenHands | Headless mode — no human-in-the-loop confirmation |
| #12 | Hermes | System prompt instructs direct action without confirmation |

<b>Data Flow</b>

```mermaid
flowchart TD
    classDef pre  fill:#E65100,color:#fff,stroke:#BF360C
    classDef done fill:#2E7D32,color:#fff,stroke:#1B5E20
    classDef io   fill:#37474F,color:#fff,stroke:#263238
    classDef sys  fill:#4A148C,color:#fff,stroke:#311B92

    INIT(["⚙️ Agent initialised"])

    INIT --> AM_ENABLED{"autonomy.enabled?"}

    AM_ENABLED -->|"yes"| AM["autonomous_mode_rail.py  (PR #370)
    AutonomousModeRail.init() + before_invoke
    inject PromptSection priority=9
    (before INTRO at 10)
    'Never ask · Never hedge · Act & verify'"]:::sys

    AM_ENABLED -->|"no"| ITER
    AM --> ITER(["🔁 Each iteration"])

    ITER --> IBA_CHK{"remaining ≤ threshold?
    remaining = max_iterations − iteration
    AgentRail.before_model_call"}

    IBA_CHK -->|"yes"| IBA["iteration_budget_rail.py  (PR #368)
    inject PromptSection priority=96
    'You have N iterations left.
    Finish and write output now.'"]:::pre

    IBA_CHK -->|"no — section removed if present"| LLM
    IBA --> LLM(["LLM call
    (reads system prompt with
    autonomous directives + any budget warning)"]):::io

    LLM --> TOOL_REQ["Tool call requested
    AgentRail.before_tool_call"]

    TOOL_REQ --> DEDUP{"per-turn cache hit?
    key = tool_name:md5(args)[:8]
    tool_dedup_rail.py  (PR #372)
    only cacheable read-only tools"}

    DEDUP -->|"hit — same call already in
    this model response"| CACHED(["Return cached result
    real tool never invoked"]):::done

    DEDUP -->|"miss"| EXEC["Tool executes
    AgentRail.after_tool_call"]:::io

    EXEC --> CNT{"cross-turn count
    ≥ warn_after?"}
    CNT -->|"yes — first time only"| WARN["queues PromptSection priority=97
    'tool X called N× already —
    result unlikely to change'
    → visible in next before_model_call"]:::pre
    CNT -->|"no"| NEXT
    WARN --> NEXT(["Next iteration"])
```

<u>Technical Details</u>

<details>
<summary><strong>#10 — Iteration Budget Awareness Rail</strong> &nbsp;(<code>feat/iteration-budget-awareness</code> (PR #368))</summary>

<br>

**How it works**

- Rail is **always attached** — no `enabled` flag; reads `max_iterations` and `budget_warning_threshold` directly from the `react` config block
- `before_invoke`: clears any stale warning section at the start of each invocation
- `before_model_call`: reads `ctx.session.get_state("iteration")` to get the current iteration count; computes `remaining = max_iterations − iteration`; removes the previous section, then re-evaluates:
  - If `remaining ≤ warning_threshold` → inject `PromptSection(name="iteration_budget_warning", priority=96)` with the text: *"You have used N of M iterations and have approximately R remaining. Prioritise completing or cleanly summarising your current task. Do not start new long subtasks. If you cannot finish, produce the best partial result you can and clearly state what remains."*
  - If above threshold → section is not added (or was already removed)
- Section priority 96 places it just after `runtime.model_answer_policy` (95), so the urgency message sits near the top of what the LLM reads
- Prevents the agent from starting new long subtasks in the final turns, which would exhaust the budget without producing output

**Technical metadata**

| | |
|---|---|
| **Hook points** | `ReActAgent.before_invoke` (clear); `AgentRail.before_model_call` (evaluate and inject/remove each turn) |
| **Config** | `react.max_iterations` (int, default `100`); `react.budget_warning_threshold` (int, default `10`) |
| **Prompt position** | `PromptSection(priority=96)` — just after runtime.model_answer_policy (95) |
| **File** | `agents/harness/common/rails/iteration_budget_rail.py` |

</details>

<br>

<details>
<summary><strong>#11 — Tool Call Deduplication Cache</strong> &nbsp;(<code>feat/tool-call-dedup-cache</code> (PR #372))</summary>

<br>

**How it works**

Two independent mechanisms are active simultaneously:

**Mechanism 1 — Per-turn deduplication** (within one LLM response):
- `before_model_call`: clears `_turn_cache` at the start of every model call (fresh cache per LLM response)
- `before_tool_call`: computes `key = f"{tool_name}:{md5(json.dumps(args, sort_keys=True))[:8]}"` for cacheable tools only; if key is in `_turn_cache` → sets `ctx.extra["_skip_tool"] = True`, writes cached result back to `ctx.inputs.tool_result` and `ctx.inputs.tool_msg` — the real tool is never invoked
- `after_tool_call`: stores the result of a fresh (non-cached) execution into `_turn_cache`

**Mechanism 2 — Cross-turn repetition warning** (across the whole session):
- `after_tool_call`: increments `_exec_counts[key]`; when count first reaches `warn_after` → calls `_inject_warning()`
- `_inject_warning()`: builds an aggregated notice listing all over-threshold tool+fingerprint pairs with their counts; injects as `PromptSection(name="tool_dedup_warning", priority=97)`

**Cacheable tool whitelist** (side-effecting tools are never intercepted):
`read_file`, `read_text_file`, `read`, `glob`, `glob_file_search`, `list_dir`, `list_files`, `grep`, `search`

**Technical metadata**

| | |
|---|---|
| **Hook points** | `AgentRail.before_model_call` (clear per-turn cache); `AgentRail.before_tool_call` (hit check); `AgentRail.after_tool_call` (cache write + cross-turn counter) |
| **Config** | `tool_dedup.enabled` (bool, default `false`); `tool_dedup.warn_after` (int, default `3`) |
| **Prompt position** | Warning: `PromptSection(priority=97)` |
| **File** | `agents/harness/common/rails/tool_dedup_rail.py` |

</details>

<br>

<details>
<summary><strong>#12 — Autonomous Execution Mode</strong> &nbsp;(<code>feat/autonomous-execution-mode</code> (PR #370))</summary>

<br>

**How it works**

- This rail does **not** post-process LLM output — it prevents hedging and confirmation requests from appearing in the first place by injecting directives into the system prompt
- `init()`: immediately on agent construction, if `autonomy.enabled` is `true`, adds a `PromptSection(name="autonomous_mode", priority=9)` — priority 9 places it directly before INTRO (10), making it one of the very first lines the LLM reads in every system prompt
- `before_invoke`: re-asserts the section at the start of each task iteration (clears + re-adds) to ensure it is never accidentally removed
- **`_AUTONOMOUS_DIRECTIVE` content** (injected verbatim):
  - Never ask for clarification or confirmation — the task description is complete; proceed directly
  - Never ask permission before acting — all tool use is pre-authorised; execute read/write/edit/shell without prompting
  - Never hedge or express uncertainty — make a decision and act on it; choose the most reasonable interpretation
  - Verify your own work — use available tools (tests, linters, build commands) to confirm correctness; iterate on failures autonomously
  - Complete the task end-to-end — do not stop mid-task to report progress; finish, verify, then report the final outcome
- Rail is **always attached** (no `enabled` check at attachment time) but only injects content when `autonomy.enabled` is `true`; when `false`, the `init()` and `before_invoke` hooks are no-ops
- Target failure: in a CI/benchmark environment the agent produces correct plans but stalls waiting for human confirmation that will never arrive

**Technical metadata**

| | |
|---|---|
| **Hook points** | `DeepAgentRail.init()` (inject immediately on construction); `ReActAgent.before_invoke` (re-assert each iteration) |
| **Config** | `autonomy.enabled` (bool, default `false`) |
| **Prompt position** | `PromptSection(priority=9)` — before INTRO (10); first directive the LLM reads |
| **File** | `agents/harness/common/rails/autonomous_mode_rail.py` |

</details>

</details>

---

#### <strong>Group 5 — Loop Breaking: Escape patterns that consume steps without progress</strong>
<details><summary>Items #13–#16 &nbsp;|&nbsp; PRs: agent-core (PR #26) · jiuwenswarm (PR #396), (PR #399), (PR #409)</summary>

***Failure mode:<br>** The agent enters a repetition or patch loop, consuming the entire iteration budget without changing strategy.

**Feature summary:<br>**
Four mechanisms, each targeting a different loop pattern and operating at a different granularity. They are independent and complementary — a session can trigger all four simultaneously.

| # | Feature | What it does |
|---|---|---|
| #13 | Anti-Repetition Prompt | System prompt instruction not to repeat Thought/Action pairs already produced in the session |
| #14 | Failure Pattern Memory | Logs each failed tool call; prepends "do not repeat these approaches" block before every LLM call |
| #15 | Step-Back Rail | Counts consecutive non-zero exit codes; injects escalating "rethink strategy" directive at N and 2N |
| #16 | Verifier Circuit Breaker | Fingerprints verifier failure (test + assertion + exit code); injects escalating "abandon approach" directive at N and 2N identical failures |

**Prior art (Comptetitors):**

| Feature | System | Equivalent |
|---|---|---|
| #13 | SWE-agent | ACI prompt: "Do not repeat a command you have already run"; command history in observation |
| #13 | Claude Code | Implicit dedup through tool call history |
| #13 | Reflexion (Shinn et al. 2023) | Verbal reinforcement to break repetition loops |
| #13 | OpenClaw | `generic_repeat` detector (`tool-loop-detection.ts`) — detects repeated identical tool calls by hashing arguments |
| #13 | Hermes | Explicit no-repeat constraint in ReAct-style prompt |
| #14 | Reflexion (Shinn et al. 2023) | Defining paper: verbal reinforcement from failure stored in memory, injected into next attempt |
| #14 | SWE-agent | Tracks failed patch applications in structured history |
| #14 | Devin | Maintains running log of failed approaches |
| #14 | OpenHands | Tracks failed actions across turns |
| #14 | OpenClaw | `argument_churn` detector — tracks incremental argument drift; flags when args keep changing without progress |
| #14 | Hermes | Failure history maintained across iterations |
| #15 | Step-Back Prompting (Zheng et al. 2023, Google DeepMind) | Instruct model to abstract and reflect before diving back into tactics |
| #15 | SWE-agent | Dedicated `think` action that forces a reflection step |
| #15 | OpenHands | Reflection mechanism on consecutive failures |
| #15 | Reflexion (Shinn et al. 2023) | Core loop: failure → reflect → retry with new strategy |
| #15 | OpenClaw | `known_poll_no_progress` detector — warning/critical thresholds before escalating loop verdict |
| #15 | Hermes | `_handle_max_iterations()` — graceful strategy-change fallback when iteration limit is reached |
| #16 | Netflix Hystrix | Origin of the "circuit breaker" pattern in distributed systems |
| #16 | Aider | Detects repeated test failure signatures; modifies retry strategy |
| #16 | SWE-agent | Early-stopping heuristics on repeated identical patches |
| #16 | OpenClaw | `global_circuit_breaker` (hard threshold 30); `unknown_tool_repeat` detector; `ping_pong` detector for A→B→A tool flip loops — all in `tool-loop-detection.ts` |
| #16 | Note | Fingerprinting verifier output specifically is a JiuwenSwarm-original implementation |

<b>Data Flow</b>

```mermaid
flowchart TD
    classDef ac   fill:#2E86AB,color:#fff,stroke:#1a5f7a
    classDef pre  fill:#E65100,color:#fff,stroke:#BF360C
    classDef post fill:#BF360C,color:#fff,stroke:#7f2407
    classDef io   fill:#37474F,color:#fff,stroke:#263238

    PROMPT(["Prompt build · SystemPromptBuilder"])

    PROMPT --> AR["Anti-Repetition (PR #26) · agent-core
    harness/prompts/ — ReAct system prompt
    explicit: do not repeat Thought/Action pairs"]:::ac

    AR --> DMEM["failure_memory_rail.py (PR #396) · before_model_call
    read _failure_memory · if non-empty
    inject numbered list into system prompt (priority 95)"]:::pre

    DMEM --> SB_CHK{"_step_back_consecutive_failures"}

    SB_CHK -->|"< N"| VCB_CHK
    SB_CHK -->|"≥ N (default 3)"| SB1["step_back_rail.py (PR #399)
    inject 4-step rethink directive (priority 94)
    single level — no 2N escalation"]:::pre

    SB1 --> VCB_CHK{"_vcb_consecutive"}

    VCB_CHK -->|"< N"| LLM
    VCB_CHK -->|"≥ N (default 3)"| VCB1["verifier_circuit_breaker_rail.py (PR #409)
    inject: rethink directive (priority 96)"]:::pre
    VCB_CHK -->|"≥ 2N"| VCB2["inject: CIRCUIT BREAKER
    ABANDON everything · start from scratch"]:::pre

    VCB1 & VCB2 --> LLM(["LLM call"]):::io

    %% ── after_tool_call: three sequential filter passes ──

    LLM --> FM_CHK{"error strings in result?
    (15+ patterns: Traceback / Error: /
    FAILED / SyntaxError …)
    or tool exception?"}

    FM_CHK -->|"yes"| FM_W["append to _failure_memory
    tool + args_120chars + error_snippet_300chars
    skip if duplicate of last · keep max 10"]:::post
    FM_CHK -->|"no"| SH_CHK

    FM_W --> SH_CHK{"shell tool?
    bash / run_bash /
    mcp_exec_command …"}

    SH_CHK -->|"not a shell tool"| VER_CHK
    SH_CHK -->|"exit code = 0"| SB_RST["reset
    _step_back_consecutive_failures = 0"]:::post
    SH_CHK -->|"exit code ≠ 0"| SB_INC["increment
    _step_back_consecutive_failures"]:::post

    SB_RST & SB_INC --> VER_CHK{"≥ 2 verifier markers?
    pytest / PASSED / FAILED /
    AssertionError / reward.txt …"}

    VER_CHK -->|"no verifier output"| PROMPT
    VER_CHK -->|"success
    (N passed / reward:1)"| VCB_CLR["clear _vcb_failure_sig
    clear _vcb_consecutive"]:::post
    VER_CHK -->|"failure"| VER_FP["normalize FAILED/AssertionError lines
    compute MD5 fingerprint (16 hex chars)"]:::post

    VER_FP --> SAME{"same as _vcb_failure_sig?"}
    SAME -->|"yes"| VCB_INC["increment _vcb_consecutive"]:::post
    SAME -->|"no"| VCB_RST["reset _vcb_consecutive = 1
    store new _vcb_failure_sig"]:::post

    VCB_CLR & VCB_INC & VCB_RST --> PROMPT
```

<u>Technical Details</u>

<details>
<summary><strong>#13 — Anti-Repetition Prompt Fix</strong> &nbsp;(agent-core <code>fix/react-anti-repetition-prompt</code> (PR #26))</summary>

<br>

**How it works**

- Changes the ReAct system prompt template — not a runtime hook; takes effect at every LLM call automatically
- Adds explicit instruction: "Do not repeat a Thought/Action pair already produced in this session"
- The previous prompt contained no such constraint
- Impact: repetition loops were the second most common cause of budget exhaustion in production traces

**Technical metadata**

| | |
|---|---|
| **Hook points** | Prompt template change — no runtime hook; fires at every LLM call because it is baked into the system prompt |
| **File** | `harness/prompts/` in agent-core |

</details>

<br>

<details>
<summary><strong>#14 — Failure Pattern Memory Rail</strong> &nbsp;(<code>feat/failure-pattern-memory-rail</code> (PR #396))</summary>

<br>

**How it works**

- `DeepAgentRail.after_tool_call`: inspects the tool result string for 15+ error substrings (`Traceback`, `Error:`, `FAILED`, `exit code 1`, `SyntaxError`, `FileNotFoundError`, etc.); if matched, extracts the error line plus up to 5 following lines (max 300 chars) and appends `(tool_name, args_120chars, error_snippet)` to the session failure log
- `DeepAgentRail.on_tool_exception`: also appends exception text (max 300 chars) when a tool raises an exception instead of returning a result
- Deduplication: skips if the new entry is identical to the most recent one; keeps at most `max_failures` entries (default 10, rolling window)
- `DeepAgentRail.before_model_call`: if the failure log is non-empty, injects a numbered-list system-prompt section at priority 95: `{i}. \`{tool}\` → {error_snippet}`
- Prevents the agent from retrying approaches that have already been proven to fail

**Technical metadata**

| | |
|---|---|
| **Hook points** | `after_tool_call` + `on_tool_exception` write; `before_model_call` read and inject |
| **File** | `rails/failure_memory_rail.py`; session-state key `_failure_memory`; config `failure_memory.max_failures: 10` |

</details>

<br>

<details>
<summary><strong>#15 — Step-Back Rail</strong> &nbsp;(<code>feat/step-back-rail</code> (PR #399))</summary>

<br>

**How it works**

- Only monitors shell tools: `mcp_exec_command`, `bash`, `run_bash`, `execute_command`, `run_command`, `run_shell`
- `DeepAgentRail.after_tool_call`: parses exit code from the JSON result (accepts `exit_code`, `exitCode`, `returncode`, `return_code` keys); exit code 0 resets the counter to 0; any non-zero value increments it; result stored in session state
- `DeepAgentRail.on_tool_exception`: also increments the counter when a shell tool raises an exception
- `DeepAgentRail.before_model_call`: if `consecutive ≥ step_back_after` (default 3), injects a 4-step rethink directive into the system prompt (priority 94): re-read the task → identify root cause → design a different strategy → execute; otherwise removes the section
- Single-level only — no escalation at 2N
- Target failure: marginal one-line patches to the same broken implementation, repeated until timeout

**Technical metadata**

| | |
|---|---|
| **Hook points** | `after_tool_call` + `on_tool_exception` count; `before_model_call` inject |
| **File** | `rails/step_back_rail.py`; session-state key `_step_back_consecutive_failures`; config `step_back.step_back_after: 3` |

</details>

<br>

<details>
<summary><strong>#16 — Verifier Circuit Breaker Rail</strong> &nbsp;(<code>feat/verifier-circuit-breaker-rail</code> (PR #409))</summary>

<br>

**How it works**

- `DeepAgentRail.after_tool_call`: first checks if the tool output is actually verifier output — requires ≥ 2 of 10 markers: `pytest`, `PASSED`, `FAILED`, `AssertionError`, `reward.txt`, etc.; non-verifier tool output is ignored entirely
- **Success path**: if the output contains `"{N} passed"` with no `"failed"` string, or `"reward: 1"`, both session-state keys are cleared and the circuit-breaker section is removed
- **Failure path**: extracts `FAILED`, `AssertionError`, and `E ` lines (up to 20), normalizes away `/tmp/` paths, timestamps, line numbers, and memory addresses, then computes an MD5 fingerprint (first 16 hex chars)
  - Different signature from last run → resets counter to 1, stores new signature
  - Same signature → increments counter
- `DeepAgentRail.before_model_call`: removes any existing section; if `consecutive ≥ break_after` (default 3), injects a rethink directive (priority 96); if `consecutive ≥ break_after × 2`, escalates to a "CIRCUIT BREAKER — ABANDON everything and start from scratch" directive
- Priority 96 > StepBackRail (94), so the circuit-breaker directive takes precedence when both rails are active simultaneously
- Target failure: same assertion fails → agent patches one line → verifier re-runs → same assertion fails → repeat ×15 → timeout

**Technical metadata**

| | |
|---|---|
| **Hook points** | `after_tool_call` fingerprint and count; `before_model_call` inject |
| **File** | `rails/verifier_circuit_breaker_rail.py`; session-state keys `_vcb_failure_sig`, `_vcb_consecutive`; default `break_after=3` |
| **Fingerprint** | MD5 first 16 hex chars of normalized FAILED/AssertionError lines — identical only when the same assertion fails in the same location |

</details>

</details>

---

#### <strong>Group 6 — Context Management: Keep important information from getting lost</strong>
<details><summary>Items #17–#18 &nbsp;|&nbsp; PRs: jiuwenswarm (PR #397) · agent-core (PR #21)</summary>

***Failure mode:<br>** The context window fills, triggering destructive automatic summarisation that discards working state; or prompt regressions go undetected across runs.

**Feature summary:<br>**
Two complementary features: #17 slows context consumption to delay summarisation; #18 logs the fully-assembled prompt before each LLM call, making changes between sessions diff-able.

| # | Feature | What it does |
|---|---|---|
| #17 | Context Headroom Guard | Monitors token fill ratio; injects conciseness directive at 60%, urgent terse-mode directive at 80% |
| #18 | Prompt Serialisation | Writes fully-rendered prompt to `workspace/.prompt_log/turn_N.json` after all rail injections, before each LLM call |

**Prior art (Comptetitors):**

| Feature | System | Equivalent |
|---|---|---|
| #17 | Aider | `--max-chat-history-tokens` caps consumption and forces summarisation of old messages |
| #17 | LangChain `ConversationSummaryMemory` | Proactively compresses old turns |
| #17 | Claude Code | Built-in context management with auto-summarisation |
| #17 | SWE-agent | Structured ACI formatting keeps outputs compact |
| #17 | Hermes | `context_compressor.py` + `context_engine.py` — automatic compression with multiple retry strategies; cache control markers on pinned sections; closest internal equivalent |
| #17 | Note | 60%/80% dual-threshold is JiuwenSwarm-specific; other systems typically use a single hard cutoff |
| #18 | DSPy | Compiles and serialises prompt programs for reproducibility |
| #18 | LangSmith | Logs the fully rendered prompt for every LLM call |
| #18 | Weights & Biases Prompts | Tracks prompt versions across runs |
| #18 | Helicone / PromptLayer | Dedicated prompt logging and diffing services |

<b>Data Flow</b>

```mermaid
flowchart TD
    classDef pre  fill:#E65100,color:#fff,stroke:#BF360C
    classDef ac   fill:#2E86AB,color:#fff,stroke:#1a5f7a
    classDef log  fill:#00838F,color:#fff,stroke:#006064
    classDef io   fill:#37474F,color:#fff,stroke:#263238

    MSG(["ContextEngine builds messages list
    SystemPromptBuilder"])

    MSG --> RATIO["compute
    current_tokens / context_window"]

    RATIO -->|"< 60%"| PASS["no injection"]
    RATIO -->|"≥ 60%"| NUDGE["context_headroom_rail.py  (PR #397)
    inject: be concise"]:::pre
    RATIO -->|"≥ 80%"| CRIT["inject: use terse tool calls only
    stop long explanations"]:::pre

    PASS & NUDGE & CRIT --> ALL["all AgentRail.before_model_call rails have run"]

    ALL --> SER["Prompt Serialisation  (PR #21)  agent-core
    harness/prompts/builder.py
    serialise full rendered prompt to JSON"]:::ac

    SER --> LLM(["LLM call  LLM call"]):::io

    SER --> LOG(["workspace/.prompt_log/turn_N.json
    compare across sessions to detect
    prompt regressions between runs"]):::log
```

<u>Technical Details</u>

<details>
<summary><strong>#17 — Context Headroom Guard</strong> &nbsp;(<code>feat/context-headroom-guard</code> (PR #397))</summary>

<br>

**How it works**

- `AgentRail.before_model_call`: compute `fill_ratio = current_tokens / context_window`
  - `≥ 60%`: inject conciseness nudge — "be brief in explanations"
  - `≥ 80%`: inject critical directive — "use terse tool calls only; stop long explanations"
- Slows the rate at which the context window fills
- Delays the onset of destructive automatic summarisation
- Dual-threshold is JiuwenSwarm-specific; most systems use a single hard cutoff

**Technical metadata**

| | |
|---|---|
| **Hook points** | `AgentRail.before_model_call`; reads `ContextEngine.token_count()` and `.context_window_size()` |
| **File** | `rails/context_headroom_rail.py`; thresholds and directives are configurable; session-state key prefix `context_headroom.*` |

</details>

<br>

<details>
<summary><strong>#18 — Prompt Serialisation</strong> &nbsp;(agent-core <code>feat/react-agent-prompt-serialization</code> (PR #21))</summary>

<br>

**How it works**

- `AgentRail.before_model_call`: runs last — after all other rails have injected their sections
- Serialize the fully-rendered system prompt (all sections assembled, all priorities applied) to deterministic JSON
- Write to `workspace/.prompt_log/turn_{n}.json` — one file per turn, one directory per session
- Enables: exact diff-based comparison between runs; regression detection when rails change

**Technical metadata**

| | |
|---|---|
| **Hook points** | `AgentRail.before_model_call`, runs last (after all other rails have injected) |
| **Output** | `workspace/.prompt_log/turn_{n}.json` — one file per turn, one directory per session |
| **File** | `harness/prompts/builder.py` serialisation path in agent-core (PR #21) |

</details>

</details>

---

#### <strong>Group 7 — Output Quality: Make sure the final answer is correct and in the right place</strong>
<details><summary>Items #19–#20 &nbsp;|&nbsp; PRs: jiuwenswarm (PR #334), (PR #328)</summary>

***Failure mode:<br>** The agent produces a correct answer but (a) cannot read the verifier's error because it was truncated from the head, or (b) submits output without first checking whether the verifier passes.

**Feature summary:<br>**
The two rails act on adjacent failure points in a single end-to-end flow: #19 fixes what the agent *reads* from each shell call; #20 fixes what happens *after* the agent writes its final output.

| # | Feature | What it does |
|---|---|---|
| #19 | Bash Output Head+Tail | Replaces head-only truncation; keeps first K + last K lines so verifier error messages at the end of stdout/stderr are never dropped |
| #20 | Self-Verification Loop | After writing output, runs verifier before declaring done; re-enters iteration loop with verifier stderr on non-zero exit |

**Prior art (Competitors):**

| Feature | System | Equivalent |
|---|---|---|
| #19 | SWE-agent | Smart output truncation preserving end of command output where errors appear |
| #19 | OpenHands | Processes tool output to keep diagnostics visible |
| #19 | Claude Code | Truncates long outputs but preserves error context |
| #19 | Hermes | `_REFERENCE_TOOL_RESULT_BUDGET = 4000` chars in `moa_loop.py` — head+tail budget applied to each reference advisor's tool results |
| #19 | Note | Head+tail (vs. head-only) is a simple but high-impact fix that most frameworks adopt after observing the same failure mode |
| #20 | SWE-agent | Runs `pytest` after each patch; uses result to decide whether to continue |
| #20 | Devin | Runs tests after every code change; iterates until they pass |
| #20 | Aider | `--auto-test` mode runs tests after each edit and loops on failure |
| #20 | Claude Code | Runs shell commands to verify changes work before completing a task; iterates on failures |
| #20 | OpenHands | Runs test suite and feeds results back to the agent before completion |
| #20 | OpenClaw | `before-agent-reply` plugin hooks — intercept before final reply; enables pre-reply verification step |
| #20 | Hermes | `verify_on_stop` (`verification_stop.py`) — runs verification after code edits before completing; config `agent.verify_on_stop`; surface-aware (ON for CLI, OFF for messaging) |
| #20 | Reflexion (Shinn et al. 2023) | Direct academic precedent: evaluate output → reflect on failure → retry |

<b>Data Flow</b>

```mermaid
flowchart TD
    classDef post fill:#BF360C,color:#fff,stroke:#7f2407
    classDef done fill:#2E7D32,color:#fff,stroke:#1B5E20
    classDef io   fill:#37474F,color:#fff,stroke:#263238

    SHELL(["Shell tool executes  AbilityManager"])

    SHELL --> RAW["raw stdout/stderr"]

    RAW --> LEN{"output length
    > 2K lines?"}

    LEN -->|"yes"| HT["bash_output_truncation  (PR #334)  AgentRail.after_tool_call
    keep first K lines + last K lines
    insert: ... N lines truncated ...
    verifier errors at end are always preserved"]:::post

    LEN -->|"no"| FULL["full output — no change"]

    HT & FULL --> LLM_READ(["LLM reads output
    error diagnostics never cut off"]):::io

    LLM_READ --> AGENT["Agent writes output file"]:::io

    AGENT --> SV["self_verification_loop  (PR #328)  DeepAgentRail.after_task_iteration
    run task verifier script as synthetic tool call
    verifier/test_outputs.py"]:::post

    SV -->|"exit 0"| DONE(["Task complete ✅"]):::done

    SV -->|"exit ≠ 0"| REINJ["inject verifier stderr
    as new system message"]:::post

    REINJ --> LOOP(["Re-enter iteration loop"])
    LOOP --> AGENT
```

<u>Technical Details</u>

<details>
<summary><strong>#19 — Bash Output Head+Tail Truncation</strong> &nbsp;(<code>feat/bash-output-head-tail-truncation</code> (PR #334))</summary>

<br>

**How it works**

- `AgentRail.after_tool_call`: post-process raw tool output bytes before packaging as `ToolMessage`
- If output length exceeds threshold, apply head+tail strategy:
  - Keep first K lines (default K = 50)
  - Keep last K lines
  - Insert `... [N lines truncated] ...` separator between them
- Verifier error messages and pytest failure details always appear at the end of stdout/stderr — they are always preserved
- Previous head-only truncation silently discarded all verifier diagnostics, leaving the agent blind to why its output was rejected

**Technical metadata**

| | |
|---|---|
| **Hook points** | `AgentRail.after_tool_call` — post-processes raw tool output bytes before packaging as `ToolMessage` |
| **Default** | K = 50 lines (configurable); separator includes dropped-line count for transparency |

</details>

<br>

<details>
<summary><strong>#20 — Self-Verification Loop</strong> &nbsp;(<code>feat/self-verification-loop</code> (PR #328))</summary>

<br>

**How it works**

- `DeepAgentRail.after_task_iteration`: triggers after the agent writes any output file, before declaring the task done
- Run the task verifier script as a synthetic shell tool call (`verifier/test_outputs.py`)
- If `exit 0`: task complete ✅
- If `exit ≠ 0`: inject verifier stderr as a new `system` message → re-enter the iteration loop
- Only exits cleanly when the verifier exits zero
- Cost: one additional verifier run per output attempt

**Technical metadata**

| | |
|---|---|
| **Hook points** | `DeepAgentRail.after_task_iteration` — conditional on output file detection; verifier is called as a synthetic tool call; failure re-injects stderr as `system` message |
| **File** | `agents/harness/common/rails/` self-verification logic |

</details>

</details>

---

#### <strong>Group 8 — Multi-Agent Verification: Add a second reviewer in team mode</strong>
<details><summary>Item #21 &nbsp;|&nbsp; PRs: agent-core (PR #123) · jiuwenswarm (PR #121)</summary>

***Failure mode:<br>** In leader/sub-agent sessions, the leader receives bare sub-agent results and consolidates them without knowing whether any are incorrect.

**Feature summary:<br>**
A single additional review stage inserted between sub-agent completion and result delivery to the leader. Zero overhead when disabled (default).

| # | Feature | What it does |
|---|---|---|
| #21 | Team Verification Layer | Lightweight reviewer agent scores sub-agent output (correctness / completeness / format compliance) and attaches `score` + `reviewer_notes` before the leader receives the result |

**Prior art (Competitors):**

| System | Equivalent |
|---|---|
| AutoGen (Microsoft) | Critic agent pattern — first-class primitive; separate LLM agent reviews output before acceptance |
| MetaGPT | Dedicated QA Engineer role reviews code produced by the Code role |
| CrewAI | Reviewer agents in crew workflows with explicit task handoff |
| ChatDev (paper) | Dedicated review stage with a reviewer agent |
| LangGraph | Reviewer nodes definable in the agent execution graph |
| OpenClaw | Sub-agent tool with built-in loop guard — prevents reviewer from entering the same loop patterns as the primary agent |
| Hermes | `background_review.py` — daemon thread that reviews skill/memory quality after each sub-agent turn; `SubagentLifecycleService` manages sub-agent lifecycle and review handoff |

<b>Data Flow</b>

```mermaid
flowchart TD
    classDef leader fill:#01579B,color:#fff,stroke:#003c74
    classDef sub    fill:#2E86AB,color:#fff,stroke:#1a5f7a
    classDef rev    fill:#5E35B1,color:#fff,stroke:#311B92
    classDef done   fill:#2E7D32,color:#fff,stroke:#1B5E20
    classDef cfg    fill:#37474F,color:#fff,stroke:#263238

    LEADER(["👑 Leader agent"]):::leader

    LEADER --> ASSIGN["assigns subtask"]

    ASSIGN --> SUB(["🤖 Sub-agent executes"]):::sub

    SUB --> RESULT["bare result"]

    RESULT --> CFG{"team_verification
    .enabled?"}:::cfg

    CFG -->|"false (default)"| PASS["result passes through
    zero overhead"]
    PASS --> RECV

    CFG -->|"true"| REV["TeamVerificationRail  (PR #123) / (PR #121)
    lightweight reviewer agent
    scores against quality rubric:
    · correctness
    · completeness
    · format compliance"]:::rev

    REV --> SCORED["{result, score: float, reviewer_notes: str}"]:::rev

    SCORED --> RECV(["👑 Leader receives scored result
    can reason about score
    before consolidating"]):::leader

    RECV --> CONSOLIDATE(["Final consolidated output ✅"]):::done
```

<u>Technical Details</u>

<details>
<summary><strong>#21 — Team Verification Layer</strong> &nbsp;(agent-core <code>feat/team-verification-layer</code> (PR #123) / jiuwenswarm <code>feat/team-verification-layer</code> (PR #121))</summary>

<br>

**How it works**

- Triggers after each sub-agent completes its assigned task (only when `team_verification.enabled = true`)
- A lightweight reviewer agent independently scores the output against a quality rubric:
  - Correctness
  - Completeness
  - Format compliance
- Leader receives `{result, score: float, reviewer_notes: str}` instead of a bare result
- Leader can reason about the score before consolidating sub-agent outputs
- Implementation: rail on the leader agent in jiuwenswarm (PR #121); scoring logic in agent-core (PR #123)
- When disabled (default): result passes through unchanged with zero overhead

**Technical metadata**

| | |
|---|---|
| **Hook points** | Post-processor between sub-agent completion and result delivery to leader — sits inside `agents/harness/team/`, not a standard rail hook point |
| **Config** | `team_verification.enabled` (AgentConfig bool, default false); when false, result passes through unchanged with zero overhead |
| **Key files** | agent-core (PR #123): `agent_teams/` or `harness/subagents/` — scoring rubric; jiuwenswarm (PR #121): `agents/harness/team/` — mounts the rail |

</details>

</details>

---

## 3. Cross-Cutting Concerns

### Prompt Section Priority Ordering

All rails that inject text compete for space in the assembled prompt. The priority scheme (higher = appears earlier / survives compression longer) used across this set:

| Content | Suggested priority | Pinned |
|---------|-------------------|--------|
| Task description (#7) | 12 | Yes |
| Output format contract (#8) | 14 | Yes |
| External skill catalogue (#9) | 900 | Yes |
| Anti-repetition instruction (#13) | 800 | No |
| "Do not repeat failures" list (#14) | 700 | No |
| Iteration budget warning (#10) | 600 | No |
| Step-back / rethink directive (#15, #16) | 600 | No |
| Context headroom nudge (#17) | 500 | No |

Pinned sections are never summarised. Non-pinned sections at lower priority are the first to be condensed when `ContextEngine` needs to shrink the context.

### Session-State Key Namespace

To avoid collisions between rails, each rail owns a prefixed key namespace:

| Rail | Session-state key prefix |
|------|--------------------------|
| Failure Pattern Memory (#14) | `failure_memory.*` |
| Step-Back (#15) | `step_back.*` |
| Verifier Circuit Breaker (#16) | `verifier_cb.*` |
| Tool Dedup Cache (#11) | `tool_dedup.*` |
| Context Headroom (#17) | `context_headroom.*` |
| Iteration Budget (#10) | `iter_budget.*` |

### Testing Conventions

Each rail must have unit tests covering:

1. **No-op path** — trigger condition not met; session state and prompt unchanged
2. **Single trigger** — trigger fires once; correct text injected; session state updated
3. **Escalation path** (where applicable, #15 and #16) — counter increments correctly; directive escalates from rethink to abandon at the right threshold
4. **Pinned sections** (#7, #8, #9) — `ContextEngine` summarisation pass does not drop the section

Run with: `make test TESTFLAGS="tests/unit_tests/rails/"`

---

## 4. Implementation Status by PR

| # | Item | Repo | PR / Branch | Status |
|---|------|------|------------|--------|
| 1 | Event Loop Fix | agent-core | (PR #28) | Branch open |
| 2 | Event Loop Fix | jiuwenswarm | (PR #119) | Branch open |
| 3 | ACP Tool Deduplication Guard | jiuwenswarm | (PR #139) | Branch open |
| 4 | Multi-Rollout | agent-core | (PR #38) | Branch open |
| 5 | Auto-Harness Best-of-N | agent-core | (PR #37) | Branch open |
| 6 | RLAF-P Prompt Optimizer | jiuwenswarm | (PR #1425) | Branch open · 25 unit tests passing |
| 7 | Task Description Re-injection | jiuwenswarm | (PR #371) | Branch open |
| 8 | Output Format Reminder | jiuwenswarm | (PR #401) | Branch open |
| 9 | External Skill Directories | jiuwenswarm | (PR #214) | Branch open |
| 10 | Iteration Budget Awareness | jiuwenswarm | (PR #368) | Branch open |
| 11 | Tool Call Dedup Cache | jiuwenswarm | (PR #372) | Branch open |
| 12 | Autonomous Execution Mode | jiuwenswarm | (PR #370) | Branch open |
| 13 | Anti-Repetition Prompt Fix | agent-core | (PR #26) | Branch open |
| 14 | Failure Pattern Memory | jiuwenswarm | (PR #396) | Branch open |
| 15 | Step-Back Rail | jiuwenswarm | (PR #399) | Branch open |
| 16 | Verifier Circuit Breaker | jiuwenswarm | (PR #409) | Branch open |
| 17 | Context Headroom Guard | jiuwenswarm | (PR #397) | Branch open |
| 18 | Prompt Serialisation | agent-core | (PR #21) | Branch open |
| 19 | Bash Output Head+Tail | jiuwenswarm | (PR #334) | Branch open |
| 20 | Self-Verification Loop | jiuwenswarm | (PR #328) | Branch open |
| 21 | Team Verification Layer | agent-core + jiuwenswarm | (PR #123) + (PR #121) | Branch open |

Integration branch combining all: `New-Features-Integration` (both repos)

---

## 5. Per-Group Deep-Dive Documents

Each group will be covered in its own document with: full implementation walkthrough, class/method signatures, data flow diagrams, edge cases, and test plan.

| Group | Document |
|-------|---------|
| Group 1 — Stability | `Group1.Stability.md` _(to be created)_ |
| Group 2 — Scale | `Group2.Scale.md` _(to be created)_ |
| Group 3 — Session Start | `Group3.SessionStart.md` _(to be created)_ |
| Group 4 — Budget Awareness | `Group4.BudgetAwareness.md` _(to be created)_ |
| Group 5 — Loop Breaking | `Group5.LoopBreaking.md` _(to be created)_ |
| Group 6 — Context Management | `Group6.ContextManagement.md` _(to be created)_ |
| Group 7 — Output Quality | `Group7.OutputQuality.md` _(to be created)_ |
| Group 8 — Multi-Agent Verification | `Group8.TeamVerification.md` _(to be created)_ |
