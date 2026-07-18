# Branches & Features

---

## Agent Core

### GitHub (`michael/`)

| Branch | Description | Benchmark Impact |
|--------|-------------|-----------------|
| `main` | Main stable branch | — |
| `feat/multi-rollout-task-execution` | Run the same task N times independently | Multiple independent attempts cover different solution paths; directly improves pass@k |
| `feat/auto-harness-best-of-n` | Auto-harness selects best result across N runs | Aggregate pass rate increases because the strongest of N solutions is submitted |
| `feat/react-agent-prompt-serialization` | Serialize ReAct agent prompt for reproducibility | Enables systematic prompt comparison and regression testing; identifies prompt-level score regressions |
| `fix/react-anti-repetition-prompt` | Prompt fix reducing ReAct repetition loops | Repetition loops burn iteration budget without progress; fixing them frees budget for productive work, increasing tasks completed |
| `fix/event-loop-blocking` | Fix async event loop blocking during task execution | Prevents mid-task crashes from async stalls; improves overall task completion rate and reliability |

### Gitcode (`gitcode_michael/`)

| Branch | Description |
|--------|-------------|
| `develop` | Main development base |
| `bugfix/event-loop-blocking` | Same async event loop blocking fix as `fix/event-loop-blocking` on GitHub |
| `feature/self-evolution_hermess_style` | Self-evolution engine (Hermes style) |
| `feature/self-healing-engine` | Self-healing engine for failed tasks |
| `browser-component` | — |
| `fix/mcp-openapi-parameters` | — |
| `ftp_component` | — |
| `rest_api_curl` | — |
| `trajectories_analyzer` | — |

### Local only

| Branch | Description |
|--------|-------------|
| `origin-develop` | Current working branch, tracking `origin/develop` |

---

## jiuwenswarm

### `develop`

Base development branch. All new independent features are branched from here and merged back via PR.

### GitHub (`michael/`)

| Branch | Description | Benchmark Impact |
|--------|-------------|-----------------|
| `develop` | Main development base | — |
| `New-Features-Integration` | Integration branch — combines all feature branches for joint testing | All rails active together; cumulative benchmark benefit across all improvements |
| `bugfix/event-loop-blocking` | Same async event loop blocking fix as in agent-core, applied to jiuwenswarm | Prevents mid-task crashes from async stalls; improves task completion rate |
| `feat/iteration-budget-awareness` | Injects a warning into the system prompt when remaining iterations fall below a threshold | Agent shifts focus to completing the task before the budget runs out, reducing timeouts and partial solutions |
| `feat/autonomous-execution-mode` | Replaces hedging and confirmation-request language with autonomous-execution directives | Removes confirmation pauses and indecision; agent acts decisively without stalling for human input, completing more tasks per budget |
| `feat/task-description-reinjection` | Pins `/app/task.md` content as a permanent system-prompt section | Task goal survives context compression; agent does not drift from requirements mid-task, preventing misaligned final output |
| `feat/tool-call-dedup-cache` | Deduplicates identical tool calls within and across turns | Prevents iteration budget waste on redundant reads and searches; more budget available for productive progress |
| `feat/self-verification-loop` | Agent self-checks its output after completing a task | Catches output errors before the verifier runs; increases first-attempt pass rate |
| `feat/bash-output-head-tail-truncation` | Truncates long shell output preserving both the head and the tail | Verifier error messages (typically at the end of output) are never truncated; agent can read and act on failure diagnostics |
| `feat/external-skill-discovery` | Discovers and exposes skills provided by the task environment | Agent finds and uses the correct task-specific tools; fewer failures caused by missing skill visibility |
| `feat/team-verification-layer` | Secondary agent independently verifies the primary agent's output | Independent review catches errors the primary agent missed; higher final pass rate |
| `feat/failure-pattern-memory-rail` | Tracks failed tool calls in session state; injects a growing "do not repeat" notice | Prevents wasted iterations on approaches already proven not to work; agent explores alternative strategies instead |
| `feat/context-headroom-guard` | Monitors context token usage and injects escalating conciseness directives at 60% and 80% fill | Reduces token waste from verbose responses; slows the rate of destructive context compression; agent retains more useful working context |
| `feat/step-back-rail` | Counts consecutive non-zero shell exits; injects a "stop and rethink strategy" directive after N failures | Breaks stuck retry loops before the iteration budget is exhausted; forces a strategy change that incremental tweaks would never produce |
| `feat/output-format-reminder-rail` | Extracts output-format hints from `task.md` (final paragraphs + structured code blocks) and pins them in the system prompt | Agent always knows exactly what format and file path the output must take; prevents format-mismatch verifier failures caused by context compression |
| `fix/acp-runtime-tool-blocking` | Fix for ACP runtime incorrectly blocking tools at runtime | Tasks that were failing because required tools were wrongly blocked now complete successfully |

### Gitcode (`gitcode_michael/`)

| Branch | Description |
|--------|-------------|
| `develop` | — |
| `my_branch` | — |
| `swarm_evaluation` | — |
| `swarm_trajectory_viewer` | — |
| `team_verification_layer` | Team verification layer (same feature as `feat/team-verification-layer` on GitHub) |

### Local only

| Branch | Description |
|--------|-------------|
| `michael-develop` | — |
| `my_branch` | — |
| `swarm_openjiuwen-develop` | — |
| `swarm_evaluation` | — |
| `swarm_trajectory_viewer` | — |

---

## Suggested — Not yet implemented

| # | Repo | Feature | Benchmark Impact |
|---|------|---------|-----------------|
| 9 | jiuwenswarm | Skill outcome caching rail | Cache successful skill invocations; skip redundant re-runs to save iteration budget |
| 10 | jiuwenswarm | Structured error extraction rail | Parse stderr and exit codes into typed error categories to guide recovery strategy |
| 13 | jiuwenswarm | Shell safety guard rail | Warn before destructive shell patterns to prevent self-inflicted task failures |
| 14 | jiuwenswarm | Exploration budget rail | Track read/search vs write/action ratio; nudge agent to stop over-researching and start producing output |
| A | agent-core | Complete anti-repetition fix (`fix/react-anti-repetition-prompt`) | Reduce repetition loops that burn iteration budget without progress |
| B | agent-core | Multi-rollout + best-of-N (`feat/multi-rollout-task-execution`) | Run task N times and select best — directly raises aggregate pass rate |
