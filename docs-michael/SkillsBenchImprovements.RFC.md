# [RFC]: JiuwenSwarm Agent Quality & Reliability Improvements — 21-Rail Integration

---

## Background and Goal Description

JiuwenSwarm is designed to solve coding and data-processing tasks autonomously. Analysis of recorded session trajectories reveals that a significant portion of task failures are not reasoning failures — they are operational failures: the agent crashes before doing any work, burns its iteration budget in a repetition loop, writes a correct answer to the wrong file path, or loses the task goal to context compression mid-run.

Each failure class has a targeted engineering fix. This RFC proposes integrating 21 such fixes — 6 in `agent-core` and 15 in `jiuwenswarm` — that together cover every major failure category observed in production session traces. All 21 items are scoped to read-only additions (new rails, new prompt injections, new caches) or isolated bug fixes; none alter the agent's core reasoning loop or existing public APIs in a breaking way.

The goal is to raise JiuwenSwarm's task completion quality and reliability across all use cases by shipping all 21 items as a single integrated milestone, with the `New-Features-Integration` branch in each repo serving as the joint test surface.

---

## Proposed Solution

The 21 items are grouped by the problem they solve. Each entry states what it changes and the specific failure mode it addresses.

---

### Group 1 — Stability: Stop the agent from crashing before it even starts

**1. Event Loop Fix — agent-core (`fix/event-loop-blocking` #28)**
Corrects an incorrect `asyncio` event-loop lifecycle in the agent-core task runner. An unhandled blocking call during startup causes the entire task process to hang silently. Fix: replace the blocking call with a proper async await. This is a prerequisite for all subsequent items; a hung process produces no output and fails silently.

**2. Event Loop Fix — jiuwenswarm (`bugfix/event-loop-blocking` #119)**
Identical root cause at the jiuwenswarm runtime layer. The two fixes are independent; both must be applied. Symptom: jiuwenswarm sessions hang or raise `RuntimeError: This event loop is already running` mid-task.

**3. ACP Runtime Tool Unblock (`fix/acp-runtime-tool-blocking` #139)**
The ACP permission layer incorrectly rejects tool calls that are within the agent's declared permissions when the call arrives from a sub-agent context. Fix: correct the identity-resolution path in the ACP runtime check. Symptom: tasks that require writing files or running shell commands fail immediately with a permission error even when the tool is listed in the agent's tool card.

---

### Group 2 — Scale: Try more than one approach, submit the best

**4. Multi-Rollout Task Execution (agent-core `feat/multi-rollout-task-execution` #38)**
Clones the task workspace N times, injects a distinct strategy prompt into each clone (Correctness-focused / Minimal-diff / Edge-case-focused), runs all N clones in parallel, and exposes a configurable selector (`first_successful` / `longest_output` / `shortest_output`) to pick the winner. This converts a single-attempt system into a pass@k system; the expected pass rate for a task with per-attempt pass probability p rises from p to 1-(1-p)^N.

**5. Auto-Harness Best-of-N (agent-core `feat/auto-harness-best-of-n` #37)**
Activated when the CI/verifier step inside a run fails. Clones the failing workspace N times, applies a different repair strategy to each clone, scores each repaired clone by `(tests_passed / diff_size / lint_errors)`, and promotes the highest-scoring patch back into the run. This is a self-healing step; it does not require user intervention.

**6. RLAF-P Runtime Prompt Optimizer (jiuwenswarm [`feat/optimization` #1425](https://github.com/openJiuwen-ai/jiuwenswarm/pull/1425))**
Runs an RL-style feedback loop — gated by `symphony.optimization.enabled` (default false) and restricted to the team leader role — that generates N candidate prompts, executes each, scores results via a composite reward (correctness, completeness, latency, token cost, drift from objective), and persists the best performer to a JSONL prompt knowledge base for reuse across sessions. A review-queue rail surfaces winning candidates to the leader for human confirmation before any prompt goes live. Applies the same "try N variants, keep the best" principle as items 4–5, but at the prompt level rather than the solution level.

---

### Group 3 — Session Start: Make sure the agent begins with everything it needs

**7. Task Description Re-injection (`feat/task-description-reinjection` #371)**
Reads `/app/task.md` at session start and appends its full content as a permanent `system`-role section in the prompt. The section is exempt from the context manager's summarisation pass (implemented via a `pinned=True` flag on the message). Addresses the most common form of task drift: after 20+ turns of context compression, the agent's working summary of the goal is lossy, causing misaligned final output.

**8. Output Format Reminder Rail (`feat/output-format-reminder-rail` #401)**
At session start, parses `task.md` for output-format signals: the final two paragraphs (which typically contain the output contract) and any fenced code blocks with a `json`, `yaml`, or `csv` language tag. Extracts expected output path, required keys, and format constraints; pins them as a permanent system-prompt section. One wrong key name or wrong file extension can render output unusable even when the answer content is fully correct.

**9. External Skill Discovery (`feat/external-skill-discovery` #214)**
At session start, scans `/app/environment/skills/` for `SKILL.md` files and injects a formatted index (skill name + one-line summary per skill) into the system prompt. Tasks in this class are built around specialist skills that implement the correct workflow, output format, and API usage pattern. Agents that do not know a skill exists re-implement its logic from scratch, producing incorrect output formats and missing task-specific validation.

---

### Group 4 — Budget Awareness: Don't waste the limited number of steps

**10. Iteration Budget Awareness Rail (`feat/iteration-budget-awareness` #368)**
Tracks `(max_iterations - current_turn)`. When the remaining budget falls below a configurable threshold (default: 5 turns), injects a high-priority directive: stop exploring, write the best available output now, and run the verifier. Prevents the agent from running out of turns mid-solution.

**11. Tool Call Deduplication Cache (`feat/tool-call-dedup-cache` #372)**
Maintains a per-session `(tool_name, args_hash) → result` cache. Before dispatching any tool call, checks the cache; returns the cached result immediately if the call is identical to one already made. Prevents the agent from re-reading the same file or re-running the same search command on every turn, which was observed to consume 30–40% of iteration budgets in recorded session traces.

**12. Autonomous Execution Mode (`feat/autonomous-execution-mode` #370)**
Post-processes the LLM output before tool dispatch. Detects hedging phrases ("I would recommend", "you might want to", "should I proceed") and confirmation requests ("please confirm", "let me know if"). Replaces them with direct execution language. Removes the class of failures where the agent produces a correct plan but stalls waiting for a human confirmation that will never come in a non-interactive autonomous execution environment.

---

### Group 5 — Loop Breaking: Escape patterns that consume steps without progress

**13. Anti-Repetition Prompt Fix (agent-core `fix/react-anti-repetition-prompt` #26)**
Modifies the ReAct system prompt to explicitly instruct the model not to repeat a Thought/Action pair it has already produced in the current session. The existing prompt contained no such constraint; repetition loops were the second most common cause of iteration budget exhaustion in production session traces.

**14. Failure Pattern Memory Rail (`feat/failure-pattern-memory-rail` #396)**
Maintains a session-state failure log: after each tool call that returns non-zero, serialises `(tool_name, args_summary, exit_code, stderr_tail)` into the log. Before each LLM call, prepends a formatted "Do not repeat these failed approaches" block to the system prompt. The list grows as more failures accumulate, preventing the agent from retrying approaches it has already proven do not work.

**15. Step-Back Rail (`feat/step-back-rail` #399)**
Counts consecutive non-zero shell exit codes in session state. After N consecutive failures (default: 3), injects a "stop and reconsider your strategy entirely" directive. After 2N consecutive failures, escalates to "your current approach is fundamentally wrong; start from a different angle." Breaks the most common stuck pattern: marginal one-line patches to the same broken implementation, repeated until timeout.

**16. Verifier Circuit Breaker Rail (`feat/verifier-circuit-breaker-rail` #409)**
After each verifier run, extracts a failure fingerprint: `(failing_test_name, assertion_text, exit_code)` and tracks a consecutive-identical-failure counter in session state. After N consecutive identical verifier failures (default: 3), injects a rethink directive before the next LLM call. After 2N, injects an "abandon this approach entirely" directive. Specifically targets the most destructive failure loop: same test assertion fails → agent patches one line → verifier re-runs → same assertion fails → repeat × 15 → timeout.

---

### Group 6 — Context Management: Keep important information from getting lost

**17. Context Headroom Guard (`feat/context-headroom-guard` #397)**
Monitors `current_tokens / context_window`. At 60% fill, injects a conciseness nudge. At 80% fill, injects a critical directive to stop issuing long explanations and to use terse tool calls only. Slows the rate at which the context window fills, delaying the onset of destructive automatic summarisation.

**18. Prompt Serialisation (agent-core `feat/react-agent-prompt-serialization` #21)**
Serialises the fully-rendered ReAct system prompt (after all rail injections) to a deterministic JSON structure before each LLM call. Enables exact diff-based comparison between runs, regression detection when rails change, and reproducible replay of any agent session.

---

### Group 7 — Output Quality: Make sure the final answer is correct and in the right place

**19. Bash Output Head+Tail Truncation (`feat/bash-output-head-tail-truncation` #334)**
Replaces the default head-only truncation of long shell output with a head+tail strategy: keeps the first K lines and the last K lines, with a `... [N lines truncated] ...` separator. Verifier error messages and pytest failure details always appear at the end of stdout/stderr. The previous head-only truncation was silently discarding all diagnostic information from the verifier, leaving the agent blind to the reason its output was rejected.

**20. Self-Verification Loop (`feat/self-verification-loop` #328)**
After the agent produces any output file, before declaring the task done, runs the task's verifier script as a shell tool call. If the verifier exits non-zero, the agent re-enters the iteration loop with the verifier's stderr as the new context. Only exits cleanly when the verifier exits zero. This catches avoidable output errors before they reach the user, at the cost of one additional verifier run per output attempt.

---

### Group 8 — Multi-Agent Verification: Add a second reviewer in team mode

**21. Team Verification Layer (agent-core `feat/team-verification-layer` #123 / jiuwenswarm `feat/team-verification-layer` #121)**
In sessions where the leader spawns sub-agents: after each sub-agent completes its assigned task, a lightweight reviewer agent independently scores the sub-agent's output against a quality rubric (correctness, completeness, format compliance) before returning it to the leader. The leader receives `{result, score, reviewer_notes}` rather than a bare result. Implemented as a rail on the leader agent in jiuwenswarm (#121), backed by the scoring logic in agent-core (#123). Prevents the leader from consolidating sub-agent outputs that contain undetected errors.

---

## Involved Public APIs

All 21 items are additive or corrective. No existing public API is removed or given a breaking signature change.

| Change | API surface affected |
|--------|---------------------|
| `fix/event-loop-blocking` #28, #119 | Internal `Runner` lifecycle — no public interface change |
| `fix/acp-runtime-tool-blocking` #139 | ACP `check_permission()` — behaviour fix, no signature change |
| `feat/multi-rollout-task-execution` #38 | New `Runner` config key: `multi_rollout.n` (int, default 1 = disabled). Existing single-run behaviour is the default. |
| `feat/auto-harness-best-of-n` #37 | New `Runner` config key: `auto_harness.best_of_n` (int, default 1 = disabled). |
| `feat/team-verification-layer` #123, #121 | New `AgentConfig` key: `team_verification.enabled` (bool, default false). When false, the rail is a no-op and the sub-agent result passes through unchanged. |
| All rails (#368, #397, #396, #399, #409, #26, #21, #372, #370, #334, #328, #371, #401, #214) | No public API changes. Rails are injected at the `SessionContext` prompt-assembly stage, which is an internal interface. |

The `New-Features-Integration` branch in each repo combines all changes for joint integration testing. No individual feature branch adds a dependency not already present in `develop`.

---

## Test Verification

### Unit tests (required before merge of each feature branch)

Each rail or fix must have targeted unit tests covering:

- **Happy path**: rail fires when its trigger condition is met; injected text appears in the assembled prompt.
- **No-op path**: rail does not fire when its trigger condition is not met; prompt is unmodified.
- **Session-state correctness**: for stateful rails (#396, #409), session state is written on failure and read correctly on the next turn.
- **Edge cases**: empty output, zero remaining iterations, context at exactly the threshold boundary.

The existing test suite at `tests/unit_tests/` must continue to pass after each merge. Run with `make test`.

### Integration test (required before merge to `develop`)

The `New-Features-Integration` branch enables all 21 items simultaneously. Integration test procedure:

1. Run the full integration test suite against the integration branch.
2. Record the task completion rate. The gate: the completion rate must exceed the current baseline by a statistically significant margin (≥ 10 additional tasks completing successfully).
3. Inspect the lowest-performing tasks manually to confirm no new failure modes were introduced by the combined rails (e.g., conflicting directives, prompt bloat exceeding context limits).
4. Confirm multi-rollout with N=3 produces a higher aggregate success rate than N=1 on the same task set, at acceptable cost increase.

### Regression test (required before production rollout)

Run the existing agent-core and jiuwenswarm regression suites:

```
make test TESTFLAGS="tests/unit_tests/"
make type-check
make check COMMITS=5
```

All must pass clean. Any type error or lint failure introduced by the new code must be resolved before merge.

### Rollout gate

No rollout to production until:
- All unit tests pass.
- Integration branch test run shows ≥ 10 net new successful task completions vs. baseline.
- At least one team member outside the implementation team has reviewed the combined diff of the integration branch.

---

## Expected Feedback Deadline

No fixed deadline. Feedback requested before integration branch is merged to `develop`.

---

## CC List

_To be filled in by the author before submission._

---

## Additional Supplementary Information

**Branch map:**

| Repo | Integration branch | Component branches |
|------|-------------------|-------------------|
| `agent-core` | `New-Features-Integration` | #28, #38, #37, #26, #21, #123 |
| `jiuwenswarm` | `New-Features-Integration` | #119, #139, #214, #328, #334, #121, #368, #370, #371, #372, #396, #397, #399, #401, #409, #1425 |

**Cost note:** Multi-rollout (#38) with N=3 triples compute usage per task during evaluation runs. This is intentional and acceptable for evaluation; for production deployments, N should default to 1 and be raised only for high-value tasks where the cost/quality tradeoff is justified.

**Relationship to other RFCs:** The self-evolution engine (`feature/self-evolution_hermess_style` on Gitcode) and the built-in evaluation framework (`swarm_evaluation`) are complementary long-term investments but are out of scope for this RFC. This RFC focuses solely on the 20 operational improvements that directly raise the agent's task completion quality and reliability.
