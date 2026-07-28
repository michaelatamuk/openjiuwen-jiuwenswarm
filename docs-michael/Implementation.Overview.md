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

Every rail in this project attaches to one or more of these numbered hook points. The group deep-dives reference them by number.

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

Rails write sections at hook point **[D]** (`before_model_call`) or at session start **[B]** for pinned content. The assembled prompt is then passed to the LLM at **[E]**.

### Session State — Where Rails Read and Write

Stateful rails persist data between turns using the `AgentCallbackContext` passed to every hook. In jiuwenswarm this is backed by:

- `agents/harness/common/session_ops_service.py` — mutable per-session state store
- `server/runtime/session/` — durable session history (used by evolution layer)

Rails that need a persistent counter or log (e.g., failure counts, verifier fingerprints) write to a key in the session state dict at hook **[I]** and read from it at hook **[D]** on the next turn.

---

## 2. Group-by-Group Overview

Each section below identifies: the failure mode, which hook points are used, which files are touched, and the PR(s). Each group has a separate deep-dive document linked at the end of this file.

---

### Group 1 — Stability: Stop the agent from crashing before it even starts

**Items:** #1, #2, #3 | **PRs:** agent-core #28, jiuwenswarm #119, #139

**Failure mode:** The process hangs or crashes before any iteration fires, producing zero output.

**Two independent root causes:**

| # | Repo | Root cause | Fix location |
|---|------|-----------|-------------|
| 1 | agent-core | `asyncio` event-loop blocking call in `Runner` startup | `core/runner/runner.py` |
| 2 | jiuwenswarm | Same blocking-call pattern in AutoHarness service | `agents/harness/common/auto_harness/service.py` |
| 3 | jiuwenswarm | ACP `check_permission()` resolves wrong identity for sub-agent calls | `acp/stdio_client.py` + `rails/permissions/` |

**Hook points used:** None — these are crash fixes at process/session init, before any hook fires.

**Key interfaces touched:**
- `Runner.__init__` / startup sequence (agent-core #28)
- `ACPClient.request_permission()` — identity-resolution path for sub-agent caller context (jiuwenswarm #139)

---

### Group 2 — Scale: Try more than one approach, submit the best

**Items:** #4, #5, #6 | **PRs:** agent-core #38, #37; jiuwenswarm #1425

**Failure mode:** A single deterministic attempt on a hard task has a low per-attempt success probability. Running once is insufficient.

| # | Mechanism | Where it lives |
|---|-----------|---------------|
| 4 | Clones workspace N times; different strategy prompt per clone; runs parallel; selector picks winner | `auto_harness/` + new `MultiRolloutRunner` in agent-core #38 |
| 5 | On CI failure inside a run: N repair-strategy clones; score by `(tests_passed / diff_size / lint_errors)`; promote best | `auto_harness/` in agent-core #37 |
| 6 | RLAF-P: RL-style loop generates N prompt candidates; scores via `CompositeReward`; persists winner to JSONL knowledge base; review-queue rail surfaces to leader | `symphony/optimization/` in jiuwenswarm #1425 |

**Hook points used:**
- #4, #5: wrap the entire `DeepAgent.invoke()` call — sit outside hook points **[A]**–**[K]**
- #6: `optimize_prompt` tool + `PromptOptimizerReviewRail` at **[D]** (`before_model_call`) for leader only

**Key new classes (agent-core #38, #37):**
- `MultiRolloutRunner` — orchestrates N parallel workspace clones
- `RolloutSelector` — configurable: `first_successful` / `longest_output` / `shortest_output`
- `BestOfNRepair` — CI-failure repair harness with scoring

**Key new classes (jiuwenswarm #1425 — `symphony/optimization/`):**
- `PromptPolicy` — LLM-based candidate generation
- `PromptEnvironment` — executes candidates via LLM/workflow/callable
- `CompositeReward` — weighted scoring (correctness 1.0, completeness 0.3, latency/tokens 0.1)
- `LLMDriftJudge` — prevents objective drift
- `ConvergenceDetector` — stopping criterion
- `PromptMemory` — JSONL or FAISS-backed persistence
- `PromptOptimizerReviewRail` — surfaces pending winners to leader at **[D]**

**Config keys introduced:**
- `multi_rollout.n` (Runner, int, default 1)
- `auto_harness.best_of_n` (Runner, int, default 1)
- `symphony.optimization.enabled` (bool, default false)

---

### Group 3 — Session Start: Make sure the agent begins with everything it needs

**Items:** #7, #8, #9 | **PRs:** jiuwenswarm #371, #401, #214

**Failure mode:** The agent starts each task with no knowledge of the output contract or available tools. After compression, even its memory of the goal becomes lossy.

| # | What is injected | When | Pinned? | Source |
|---|-----------------|------|---------|--------|
| 7 | Full `task.md` content | Session init (once) | Yes — `pinned=True` | `/app/task.md` |
| 8 | Output-format contract: final 2 paragraphs of `task.md` + fenced `json`/`yaml`/`csv` blocks | Session init (once) | Yes | `/app/task.md` |
| 9 | Index of available `SKILL.md` files: name + one-line summary per skill | Session init (once) | Yes | `/app/environment/skills/*/SKILL.md` |

**Hook points used:** **[B]** (`before_task_iteration`, first iteration only) — content is added to `SystemPromptBuilder` as pinned sections.

**Rail files:**
- `rails/task_description_rail.py` — implements #7
- `rails/output_format_rail.py` — implements #8
- (new rail or extension of `runtime_prompt_rail.py`) — implements #9

**Key implementation detail:** All three items write `PromptSection(pinned=True)` so `ContextEngine` cannot drop them during summarisation. They fire once at the start of the session and are not re-injected on subsequent iterations.

---

### Group 4 — Budget Awareness: Don't waste the limited number of steps

**Items:** #10, #11, #12 | **PRs:** jiuwenswarm #368, #372, #370

**Failure mode:** The agent exhausts its iteration budget on redundant reads, confirmation pauses, and exploration without ever writing output.

| # | Mechanism | Hook point | Rail file |
|---|-----------|-----------|----------|
| 10 | Tracks `max_iterations - current_turn`; at threshold (default 5) injects "write output now" directive | **[D]** before_model_call | `rails/iteration_budget_rail.py` |
| 11 | Per-session `(tool_name, sha256(args)) → result` cache; returns cached result without executing | **[G]** before_tool_call | `rails/tool_dedup_rail.py` |
| 12 | Detects hedging phrases and confirmation requests in LLM output; replaces with direct execution language | **[G]** before_tool_call (post-processes LLM output) | `rails/autonomous_mode_rail.py` |

**Key implementation details:**
- #11 cache is keyed on `(tool_name, args_hash)` where `args_hash = sha256(canonical_json(args))`. Cache lives in session state; TTL = session lifetime only.
- #12 operates as a string replacement pass on the LLM's text output before the tool call is dispatched. Patterns are defined in `autonomous_mode_rail.py` as a list of `(regex, replacement)` pairs.
- #10 reads `AgentCallbackContext.current_turn` and `AgentCallbackContext.max_iterations`.

---

### Group 5 — Loop Breaking: Escape patterns that consume steps without progress

**Items:** #13, #14, #15, #16 | **PRs:** agent-core #26; jiuwenswarm #396, #399, #409

**Failure mode:** The agent enters a repetition or patch loop, consuming the entire iteration budget without changing strategy.

| # | Trigger | Action | Hook points | Rail / location |
|---|---------|--------|------------|-----------------|
| 13 | ReAct prompt has no anti-repetition constraint | Add explicit "do not repeat Thought/Action" instruction to ReAct system prompt | Prompt template (no runtime hook) | `harness/prompts/` in agent-core #26 |
| 14 | Tool call returns non-zero exit | Serialise `(tool, args_summary, exit_code, stderr_tail)` to session-state failure log; prepend "do not repeat" list to system prompt next turn | **[I]** write, **[D]** read | `rails/failure_memory_rail.py` |
| 15 | N consecutive non-zero shell exits | Inject "stop and rethink strategy" directive; at 2N escalate to "abandon approach" | **[I]** count, **[D]** inject | `rails/step_back_rail.py` |
| 16 | N consecutive identical verifier failure fingerprints | Inject rethink directive; at 2N inject "abandon approach entirely" | **[I]** fingerprint + count, **[D]** inject | `rails/verifier_circuit_breaker_rail.py` |

**Failure fingerprint (item #16):** `sha256(failing_test_name + assertion_text + exit_code)` — two verifier runs are considered "identical" only when all three fields match exactly. This avoids false positives when the agent is making genuine but slow progress on a multi-assertion test.

**Session-state keys written:**
- `failure_memory.log` — list of failure records (item #14)
- `step_back.consecutive_count` — integer (item #15)
- `verifier_cb.fingerprint` — last fingerprint (item #16)
- `verifier_cb.consecutive_count` — integer (item #16)

---

### Group 6 — Context Management: Keep important information from getting lost

**Items:** #17, #18 | **PRs:** jiuwenswarm #397; agent-core #21

**Failure mode:** The context window fills, triggering destructive automatic summarisation that discards working state; or prompt regressions go undetected.

| # | Mechanism | Hook point | Location |
|---|-----------|-----------|---------|
| 17 | Monitor `current_tokens / context_window`; at 60% inject conciseness nudge; at 80% inject critical directive to use terse tool calls | **[D]** before_model_call | `rails/context_headroom_rail.py` |
| 18 | Serialise fully-rendered system prompt (post all rail injections) to deterministic JSON before each LLM call; enables diff-based regression detection | **[D]** before_model_call (after all other rails have run) | agent-core `harness/prompts/builder.py` serialisation path, #21 |

**Key implementation detail (item #17):** `ContextEngine` exposes `token_count()` and `context_window_size()`. The rail computes the ratio after `ContextEngine` builds the messages list but before the LLM call. The two thresholds (60%, 80%) and both directive texts are configurable.

**Key implementation detail (item #18):** The serialised prompt snapshot is written to a per-turn log file (e.g., `workspace/.prompt_log/turn_{n}.json`). Downstream tooling (TraceHound, the evaluation framework) can load these snapshots to diff prompts across runs and detect when a rail change caused a regression.

---

### Group 7 — Output Quality: Make sure the final answer is correct and in the right place

**Items:** #19, #20 | **PRs:** jiuwenswarm #334, #328

**Failure mode:** The agent produces a correct answer but (a) cannot read the verifier's error because it was truncated, or (b) submits without first checking whether the verifier passes.

| # | Mechanism | Hook point | Location |
|---|-----------|-----------|---------|
| 19 | Replace head-only shell output truncation with head+tail: keep first K and last K lines; insert `... [N lines truncated] ...` separator | **[I]** after_tool_call — post-process tool result before returning to LLM | jiuwenswarm tool output handler, #334 |
| 20 | After any output file is written, run the task's verifier script as a tool call; if non-zero exit, re-enter iteration loop with stderr as new context | **[J]** after_task_iteration — or via dedicated completion-check hook | `agents/harness/common/rails/` self-verification logic, #328 |

**Key implementation detail (item #19):** `K` defaults to 50 lines (configurable). The separator line includes the count of dropped lines for transparency. This runs as a post-processor on the raw bytes returned by the shell tool, before they are packaged as a `ToolMessage`.

**Key implementation detail (item #20):** The self-verification loop is implemented as a conditional within the outer task-loop completion check. When the agent produces a file at any known output path, the harness calls the verifier script (`verifier/test_outputs.py` or equivalent) as a synthetic tool call. A passing verifier exits the loop; a failing verifier re-injects stderr as a `system` message and continues the iteration.

---

### Group 8 — Multi-Agent Verification: Add a second reviewer in team mode

**Items:** #21 | **PRs:** agent-core #123, jiuwenswarm #121

**Failure mode:** In leader/sub-agent sessions, the leader receives bare sub-agent results and consolidates them without knowing whether any are incorrect.

**Architecture:**

```
Leader agent
  │  assigns task
  ▼
Sub-agent executes → returns result
  │
  ▼  (new)
Reviewer agent independently scores result:
  - correctness
  - completeness
  - format compliance
  → returns {result, score: float, reviewer_notes: str}
  │
  ▼
Leader receives scored result — can reason about score before consolidating
```

**Hook point used:** Between sub-agent completion and result delivery to leader — sits inside the sub-agent orchestration layer, not a standard rail hook point. Implemented as a post-processor in the team orchestration path.

**Key files:**
- agent-core #123: `agent_teams/` or `harness/subagents/` — `TeamVerificationRail` base logic and scoring rubric
- jiuwenswarm #121: `agents/harness/team/` — mounts the rail on the leader; wires the team-monitor event pipeline

**Config key:**
- `team_verification.enabled` (AgentConfig bool, default false)
- When false: sub-agent result passes through unchanged; zero overhead.

---

## 3. Cross-Cutting Concerns

### Prompt Section Priority Ordering

All rails that inject text compete for space in the assembled prompt. The priority scheme (higher = appears earlier / survives compression longer) used across this set:

| Content | Suggested priority | Pinned |
|---------|-------------------|--------|
| Task description (#7) | 1000 | Yes |
| Output format contract (#8) | 950 | Yes |
| Skill index (#9) | 900 | Yes |
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
| 1 | Event Loop Fix | agent-core | #28 | Branch open |
| 2 | Event Loop Fix | jiuwenswarm | #119 | Branch open |
| 3 | ACP Tool Unblock | jiuwenswarm | #139 | Branch open |
| 4 | Multi-Rollout | agent-core | #38 | Branch open |
| 5 | Auto-Harness Best-of-N | agent-core | #37 | Branch open |
| 6 | RLAF-P Prompt Optimizer | jiuwenswarm | #1425 | Branch open, 25 unit tests passing |
| 7 | Task Description Re-injection | jiuwenswarm | #371 | Branch open |
| 8 | Output Format Reminder | jiuwenswarm | #401 | Branch open |
| 9 | External Skill Discovery | jiuwenswarm | #214 | Branch open |
| 10 | Iteration Budget Awareness | jiuwenswarm | #368 | Branch open |
| 11 | Tool Call Dedup Cache | jiuwenswarm | #372 | Branch open |
| 12 | Autonomous Execution Mode | jiuwenswarm | #370 | Branch open |
| 13 | Anti-Repetition Prompt Fix | agent-core | #26 | Branch open |
| 14 | Failure Pattern Memory | jiuwenswarm | #396 | Branch open |
| 15 | Step-Back Rail | jiuwenswarm | #399 | Branch open |
| 16 | Verifier Circuit Breaker | jiuwenswarm | #409 | Branch open |
| 17 | Context Headroom Guard | jiuwenswarm | #397 | Branch open |
| 18 | Prompt Serialisation | agent-core | #21 | Branch open |
| 19 | Bash Output Head+Tail | jiuwenswarm | #334 | Branch open |
| 20 | Self-Verification Loop | jiuwenswarm | #328 | Branch open |
| 21 | Team Verification Layer | agent-core + jiuwenswarm | #123 + #121 | Branch open |

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
