# Branches & Features

---

## Agent Core

### `develop`

Base development branch. All new independent features are branched from here and merged back via PR.

### GitHub (`michael/`)

| Branch | PR | Description & Benchmark Impact |
|--------|----|-------------------------------|
| `feat/multi-rollout-task-execution` | [#38](https://github.com/openJiuwen-ai/agent-core/pull/38) | Run the same task N times independently.<br>_Multiple independent attempts cover different solution paths; directly improves pass@k._ |
| `feat/auto-harness-best-of-n` | [#37](https://github.com/openJiuwen-ai/agent-core/pull/37) | Auto-harness selects best result across N runs.<br>_Aggregate pass rate increases because the strongest of N solutions is submitted._ |
| `fix/event-loop-blocking` | [#28](https://github.com/openJiuwen-ai/agent-core/pull/28) | Fix async event loop blocking during task execution.<br>_Prevents mid-task crashes from async stalls; improves overall task completion rate and reliability._ |
| `fix/react-anti-repetition-prompt` | [#26](https://github.com/openJiuwen-ai/agent-core/pull/26) | Prompt fix reducing ReAct repetition loops.<br>_Repetition loops burn iteration budget without progress; fixing them frees budget for productive work, increasing tasks completed._ |
| `feat/react-agent-prompt-serialization` | [#21](https://github.com/openJiuwen-ai/agent-core/pull/21) | Serialize ReAct agent prompt for reproducibility.<br>_Enables systematic prompt comparison and regression testing; identifies prompt-level score regressions._ |
| `feat/team-verification-layer` | [#123](https://github.com/openJiuwen-ai/agent-core/pull/123) | Team quality-verification rail for multi-agent teams: a secondary reviewer checks teammate task outputs against quality dimensions and gates leader consolidation.<br>_Independent review catches errors the primary agent missed; higher final pass rate._ |
| `New-Features-Integration` | — | Integration branch — combines all feature branches: [#38](https://github.com/openJiuwen-ai/agent-core/pull/38), [#37](https://github.com/openJiuwen-ai/agent-core/pull/37), [#28](https://github.com/openJiuwen-ai/agent-core/pull/28), [#26](https://github.com/openJiuwen-ai/agent-core/pull/26), [#21](https://github.com/openJiuwen-ai/agent-core/pull/21), [#123](https://github.com/openJiuwen-ai/agent-core/pull/123) for joint testing.<br>_All improvements active together; cumulative benchmark benefit across multi-rollout, best-of-N, async stability, anti-repetition, prompt serialization, and team verification._ |

### Gitcode (`gitcode_michael/`)

| Branch | Description |
|--------|-------------|
| `feature/self-evolution_hermess_style` | GEPA-based skills evolution engine: automatically discovers successful task patterns, promotes them to reusable skills, and injects a recommendation rail that surfaces relevant skills at the start of each task |

### Not yet implemented

| # | Type | Feature & Benchmark Impact |
|---|------|---------------------------|
| A | **Extension** of `fix/react-anti-repetition-prompt` [#26](https://github.com/openJiuwen-ai/agent-core/pull/26) | **Complete anti-repetition fix** — extend the prompt fix with a runtime detector that identifies repeated reasoning blocks in the message history and actively interrupts the loop.<br>_#26 reduces repetition at the prompt level; the runtime detector adds a second layer that catches loops the prompt alone does not prevent; together they virtually eliminate iteration budget loss from repetition._ |
| B | **Extension** of `feat/multi-rollout-task-execution` [#38](https://github.com/openJiuwen-ai/agent-core/pull/38) + `feat/auto-harness-best-of-n` [#37](https://github.com/openJiuwen-ai/agent-core/pull/37) | **Multi-rollout + best-of-N (full integration)** — run the same task N times in parallel and let the auto-harness select the best result via the verifier.<br>_The individual branches (#38, #37) exist but are not yet active together end-to-end; enabling both jointly delivers the direct pass@k gain: the strongest of N independent attempts is submitted rather than a single attempt._ |
| C | **New** | **Compression-safe pinned context** — mark the task description and the most recent verifier stderr as compression-exempt at the agent-core context layer, so they survive automatic summarisation unconditionally.<br>_Prevents the most destructive form of context loss: the agent re-attempting tasks with a lossy memory of the goal, or re-diagnosing failures it has already seen. Stronger guarantee than `feat/task-description-reinjection` [#371] which re-injects but does not prevent compression._ |

---

## jiuwenswarm

### `develop`

Base development branch. All new independent features are branched from here and merged back via PR.

### GitHub (`michael/`)

| Branch | PR | Description & Benchmark Impact |
|--------|----|-------------------------------|
| `bugfix/event-loop-blocking` | [#119](https://github.com/openJiuwen-ai/jiuwenswarm/pull/119) | Same async event loop blocking fix as in agent-core, applied to jiuwenswarm.<br>_Prevents mid-task crashes from async stalls; improves task completion rate._ |
| `fix/acp-runtime-tool-blocking` | [#139](https://github.com/openJiuwen-ai/jiuwenswarm/pull/139) | Fix for ACP runtime incorrectly blocking tools at runtime.<br>_Tasks that were failing because required tools were wrongly blocked now complete successfully._ |
| `feat/external-skill-discovery` | [#214](https://github.com/openJiuwen-ai/jiuwenswarm/pull/214) | Discovers and exposes skills provided by the task environment.<br>_Agent finds and uses the correct task-specific tools; fewer failures caused by missing skill visibility._ |
| `feat/self-verification-loop` | [#328](https://github.com/openJiuwen-ai/jiuwenswarm/pull/328) | Agent self-checks its output after completing a task.<br>_Catches output errors before the verifier runs; increases first-attempt pass rate._ |
| `feat/bash-output-head-tail-truncation` | [#334](https://github.com/openJiuwen-ai/jiuwenswarm/pull/334) | Truncates long shell output preserving both the head and the tail.<br>_Verifier error messages (typically at the end of output) are never truncated; agent can read and act on failure diagnostics._ |
| `feat/team-verification-layer` | [#121](https://github.com/openJiuwen-ai/jiuwenswarm/pull/121) | JiuwenSwarm integration for the agent-core team verification rail: config loading, rail mounting on the leader agent, and team-monitor event pipeline.<br>_Enables the agent-core verification rail within JiuwenSwarm team sessions._ |
| `feat/iteration-budget-awareness` | [#368](https://github.com/openJiuwen-ai/jiuwenswarm/pull/368) | Injects a warning into the system prompt when remaining iterations fall below a threshold.<br>_Agent shifts focus to completing the task before the budget runs out, reducing timeouts and partial solutions._ |
| `feat/autonomous-execution-mode` | [#370](https://github.com/openJiuwen-ai/jiuwenswarm/pull/370) | Replaces hedging and confirmation-request language with autonomous-execution directives.<br>_Removes confirmation pauses and indecision; agent acts decisively without stalling for human input, completing more tasks per budget._ |
| `feat/task-description-reinjection` | [#371](https://github.com/openJiuwen-ai/jiuwenswarm/pull/371) | Pins `/app/task.md` content as a permanent system-prompt section.<br>_Task goal survives context compression; agent does not drift from requirements mid-task, preventing misaligned final output._ |
| `feat/tool-call-dedup-cache` | [#372](https://github.com/openJiuwen-ai/jiuwenswarm/pull/372) | Deduplicates identical tool calls within and across turns.<br>_Prevents iteration budget waste on redundant reads and searches; more budget available for productive progress._ |
| `feat/failure-pattern-memory-rail` | [#396](https://github.com/openJiuwen-ai/jiuwenswarm/pull/396) | Tracks failed tool calls in session state; injects a growing "do not repeat" notice.<br>_Prevents wasted iterations on approaches already proven not to work; agent explores alternative strategies instead._ |
| `feat/context-headroom-guard` | [#397](https://github.com/openJiuwen-ai/jiuwenswarm/pull/397) | Monitors context token usage and injects escalating conciseness directives at 60% and 80% fill.<br>_Reduces token waste from verbose responses; slows the rate of destructive context compression; agent retains more useful working context._ |
| `feat/step-back-rail` | [#399](https://github.com/openJiuwen-ai/jiuwenswarm/pull/399) | Counts consecutive non-zero shell exits; injects a "stop and rethink strategy" directive after N failures.<br>_Breaks stuck retry loops before the iteration budget is exhausted; forces a strategy change that incremental tweaks would never produce._ |
| `feat/output-format-reminder-rail` | [#401](https://github.com/openJiuwen-ai/jiuwenswarm/pull/401) | Extracts output-format hints from `task.md` (final paragraphs + structured code blocks) and pins them in the system prompt.<br>_Agent always knows exactly what format and file path the output must take; prevents format-mismatch verifier failures caused by context compression._ |
| `feat/verifier-circuit-breaker-rail` | [#409](https://github.com/openJiuwen-ai/jiuwenswarm/pull/409) | Tracks identical verifier failure signatures across turns; injects a rethink directive after N consecutive identical failures and escalates to "abandon approach entirely" at 2N.<br>_Breaks the most destructive SkillsBench loop: same test fails → marginal patch → repeat × 15 → timeout. Forces a genuine strategy change before the iteration budget is exhausted._ |
| `New-Features-Integration` | — | Integration branch — combines all feature branches for joint testing.<br>_All rails active together; cumulative benchmark benefit across all improvements._ |

### Gitcode (`gitcode_michael/`)

| Branch | Description |
|--------|-------------|
| `swarm_trajectory_viewer` | **TraceHound** — JiuwenSwarm's built-in session trajectory viewer and analyser. Inspect any past agent session turn-by-turn, measure performance, diagnose failures, and run an LLM-powered deep analysis to surface improvement opportunities — all without re-running the agent |
| `swarm_evaluation` | **Built-in Evaluation Framework** — structured way to define test suites, run them against the live agent, score results automatically (exact_match / contains / llm_judge), and enforce quality gates — all from the web UI, without any external tooling. Supports gate checks with a configurable pass-rate threshold for use as a pre-deploy quality gate |

### Not yet implemented

| # | Type | Feature & Benchmark Impact |
|---|------|---------------------------|
| 4 | **New** | **HTTP response caching rail** — session-scoped cache for external API/HTTP calls; intercepts `curl`/`requests` invocations and returns cached results for identical URLs within a session.<br>_Tasks requiring multiple external API calls (citation checks via CrossRef/Semantic Scholar, dependency audits, SEC EDGAR queries) currently get rate-limited and enter silent retry loops that consume the entire time budget. Caching prevents duplicate requests; pairs with #19 which handles the backoff behaviour on fresh calls._ |
| 8 | **Extension** of `feat/external-skill-discovery` [#214](https://github.com/openJiuwen-ai/jiuwenswarm/pull/214) | **Two-phase distractor skill filter** — before reading any skill in full, the agent reads only the first-paragraph summary of every available skill, identifies the 1–3 most relevant ones, then reads those in full. Distractor skills (intentionally irrelevant, placed alongside useful ones) are skipped.<br>_Distractor skills currently waste iteration budget on irrelevant skill reads. Two-phase filtering saves that budget for task execution and prevents skill-confusion where the agent follows an irrelevant guide._ |
| 9 | **Extension** of `feat/tool-call-dedup-cache` [#372](https://github.com/openJiuwen-ai/jiuwenswarm/pull/372) | **Skill outcome caching rail** — cache successful skill invocations across sessions; skip redundant re-runs entirely.<br>_Eliminates repeated execution of identical skill calls; saves iteration budget for unique work; stacks on top of the per-session dedup already gained from #372._ |
| 10 | **Extension** of `feat/failure-pattern-memory-rail` [#396](https://github.com/openJiuwen-ai/jiuwenswarm/pull/396) | **Structured error extraction rail** — parse stderr and exit codes into typed error categories (ImportError, PermissionError, NetworkError, …) and route each category to a specific recovery hint.<br>_More precise recovery guidance than the generic "do not repeat" notice in #396; typed categories enable targeted fix strategies, further reducing wasted iterations._ |
| 12 | **New** | **Progressive context summarisation rail** — before context compression fires automatically (and destructively), proactively summarise stale turns: condense completed reasoning chains into a single "summary of what I have done" block while keeping key findings verbatim.<br>_Automatic compression discards whole turns blindly; progressive summarisation preserves the essential information in a fraction of the tokens, so the agent retains its working memory after compression instead of starting effectively blind._ |
| 13 | **New** | **Shell safety guard rail** — intercept destructive shell patterns (`rm -rf`, `truncate`, `dd`, `mkfs`, …) before execution; inject a confirmation prompt or block entirely.<br>_Prevents self-inflicted task failures where the agent accidentally deletes its own working files or corrupts the task environment._ |
| 14 | **New** | **Exploration budget rail** — track the ratio of read/search tool calls vs. write/action tool calls per session; inject a directive to stop exploring and start producing output when the ratio exceeds a threshold.<br>_Combats over-researching: agents that spend most of their budget reading files and grepping never reach the output stage; this rail forces a transition from exploration to execution._ |
| 15 | **New** | **Structured output checkpointing** — prompt the agent to write intermediate results to clearly named checkpoint files (e.g., `/root/checkpoint_step1.json`) after each major milestone; on re-run, check for checkpoints and resume from the last one.<br>_Low value for short SkillsBench tasks (< 5 min timeout), but high value for long tasks (1–2 hour timeout) where a crash or timeout erases all progress. No infrastructure change required — pure prompt convention._ |
| 16 | **New** | **Verifier pre-read rail** — at task start, read `verifier/test_outputs.py` from inside the container and inject a concise summary of the exact pytest assertions into the system prompt: expected output path, required JSON keys, format constraints, and tolerance rules.<br>_SkillsBench uses binary scoring — one wrong field or wrong file path scores 0 even if all other output is correct. The verifier script is available to the agent but never read. Pre-reading turns hidden requirements into explicit ones, eliminating the entire class of format-mismatch and wrong-path failures at zero iteration cost._ |
| 17 | **New** | **Output path pinning rail** — parse the task prompt and skill SKILL.md files for expected output filesystem paths (e.g., `/root/answer.json`, `/root/output/output.pdf`) and pin them as a permanent system-prompt section throughout the run.<br>_Agents write correct content to wrong paths and score 0. After many turns of context the original path specification is compressed or forgotten. Path pinning ensures the final write always goes to the exact location the verifier checks; complements task-description-reinjection [#371] which pins the goal, not the output contract._ |
| 18 | **New** | **Skill-first orientation rail** — before the first model call, inject a high-priority directive: "Skills are available under `/app/environment/skills/`. Read each `SKILL.md` before attempting anything." Optionally check after turn 2 whether any skill file has been read; if not, re-inject.<br>_SkillsBench tasks are designed around skills that already implement the correct workflow, output format, and API usage. Agents that bypass skills and reimplement from scratch spend extra iterations, frequently produce wrong output formats, and miss task-specific validation logic already encoded in the skill scripts. This rail costs nothing when the agent already reads skills._ |
| 19 | **New** | **API rate-limit backoff rail** — detect repeated `429`/`503` responses in tool output; inject per-provider backoff knowledge (CrossRef: 50 req/s, Semantic Scholar: 100 req/5 min, SEC EDGAR: 10 req/s) and a "wait N seconds before retrying" directive as a system-prompt section.<br>_Rate-limited API tasks silently exhaust the entire time budget in a retry loop with no progress. This pairs with #4 (which caches identical URLs) by handling the backoff behaviour on fresh calls that the cache cannot serve._ |
