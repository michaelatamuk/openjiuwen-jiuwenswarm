# OpenJiuwen Cortex

OpenJiuwen Cortex is a collection of independent projects — algorithms, systems, and tools — each addressing a different weakness or opportunity in JiuwenSwarm. There is no single line of improvement: some tackle routing and cost, some tackle memory, some tackle how skills are written and maintained, some tackle multi-agent safety, and some tackle developer experience. Each project can be useful on its own; together they form a coherent effort to make JiuwenSwarm faster, cheaper, smarter, and more robust.

---

## Skills

### SkillTend — Online Skill Maintenance
*Solution + Research*

**Solution — Skill Review Rail.** A background rail that keeps skills and memory current during live agent sessions without interrupting the agent. It fires after a configurable number of tool calls or user turns, snapshots the conversation, and asks an LLM to propose small, targeted patches to SKILL.md files and memory entries rather than full rewrites — preserving stable content while fixing what has drifted. All review work is serialised and non-blocking.

**Solution — Curator.** A companion daemon that monitors skill usage over time and transitions skills through a lifecycle (ACTIVE → STALE → ARCHIVED), retiring skills that are no longer used and preventing the skill library from growing unbounded.

**Research.** The research component (`skilltend_research/`) runs eight interdependent empirical studies. Study 01 validates the four quality metrics — Retrieval Relevance, Information Density, Task Success Rate, and Patch Stability — against human-labeled ground truth (gate: inter-rater κ > 0.65) before any other study can proceed. Study 02 sweeps trigger intervals across 7,680 simulated sessions and evaluates an AdaptiveTrigger that fires on conversation embedding divergence rather than fixed counts. Study 03 identifies the minimum-cost LLM that achieves ≥95% of frontier-model review quality. Study 04 compares four memory injection strategies at varying character limits. Study 05 uses survival analysis and an XGBoost predictor (target AUC > 0.75) to replace the fixed-threshold lifecycle FSM with a learned one. Studies 06–08 cover prompt ablations, mid-session patch interference, and library-level coverage gaps.

### SkillForge — Offline Skill Optimisation
*Solution + Research*

**Solution.** SkillForge automatically evolves JiuwenSwarm SKILL.md files between sessions using a genetic algorithm called GEPA (Genetic Evolutionary Prompt Adaptation). It maintains a population of skill variants, evaluates each against seven complementary fitness metrics (bag-of-words, F1, ROUGE, semantic similarity, graph structure, checklist coverage, and cross-skill consistency), and uses Thompson Sampling at three levels — skill scheduling, training example selection, and acceptance gating — to concentrate the optimisation budget on skills most likely to improve. A regression-aware holdout gate prevents any evolved skill from being deployed if it degrades performance on examples that were already passing.

**Research.** The paper (`docs/skillforge_paper.md`) identifies three structural problems the solution solves but does not fully close: Structural Semantic Stagnation (frozen base text masked by growing history), the Regression Trap (local patches degrading other behaviour), and the Production Trust Gap (macro evolution requiring multi-dimensional verification before deployment). Nine open research directions follow from these: formalising fitness traps and Goodhart's Law in evolutionary prompt systems, AutoML for fitness function selection (replacing the fixed 7-metric weighted average with a learned one), holdout gate composition theory, early gate rejection prediction to cut wasted evaluation budget, discriminative trace construction via optimal experimental design, multi-objective Pareto evolution that makes quality-cost trade-offs explicit, online versus batch evolution dynamics, and cross-task transfer of evolutionary progress between skill domains.

---

## Multi-Agent Safety & Topology Adaptation (jiuwen_atm)

JiuwenSwarm ATM (Autonomous Topology Mutation) addresses three failure modes that appear on the very first realistic multi-step agent task: malformed tool calls that abort tasks, role entropy where one agent accumulates too many responsibilities until it stalls, and credentials or PII in session memory that leak unfiltered into cloud model calls. All three are handled by independent rails that attach to the existing agent loop through exactly two hooks (`before_tool_call` / `after_tool_call` and a periodic `on_tick`) — no agent code changes are required. Measured results: task success rate on code/debug workloads went from 0.20 to 1.00 (A0 baseline vs A3 full ATM), credential exposure events dropped from 2.0 to 0.0 on security-sensitive workloads, at a ~2–3× latency cost from the additional LLM calls.

### ATM Algorithm 1 — Tool Repair
*Solution*

ToolRepairRail fires on every failed tool call. It first classifies the failure into HARD (bad arguments — e.g. string passed where int expected), SOFT (network/timeout, recoverable without repair), or UNKNOWN. For HARD and UNKNOWN failures it makes an isolated repair call: the LLM sees only the tool schema, the failing arguments, and the error — not full session history — keeping the repair context minimal and the cost low. Recent successful calls for the same tool are fed as few-shot examples, so repair quality improves within a session. A confidence gate enforces that the repair must reach ≥0.75 confidence (HARD) or ≥0.90 (UNKNOWN) before the fixed arguments are applied. The key safety contract is **fail-equal-to-baseline**: if repair fails or confidence is too low, the call fails exactly as it would have with no rail at all — the rail can only help or do nothing, never make things worse.

### ATM Algorithm 2 — Memory Guard
*Solution*

MemoryGuardRail fires before every model call and enforces a five-level Privacy Level (PL) classification on all memory content: PL0 Public, PL1 Low, PL2 Internal, PL3 PII/paths, PL4 Credentials. Each trust tier has a ceiling — `cloud_public` endpoints may see up to PL1, `cloud_trusted` up to PL2, local models are unrestricted (PL4). Content above the ceiling for the target endpoint is redacted before the model call is made. Critically, this is a **code gate, not a prompt instruction**: the model never receives the redacted content and has no way to repeat or leak it. This is what allows the A3 condition to achieve zero credential exposure events on workloads where the A0 baseline leaked credentials on every run.

### ATM Algorithm 3 — Topology Mutation Pipeline
*Solution + Research*

**Solution.** ATMPipeline detects when a single agent is overloaded — specifically when its busyness metric B_i exceeds threshold τ for **3 consecutive ticks** (not just a spike) — and restructures the team live in four stages: **Detect** (sustained overload confirmed), **Factorize** (LLM proposes 2–4 specialised child roles; invariant check verifies each child gets only the tools it needs), **Distill** (memory atoms routed to shared / role-specific / quarantine buckets), and **Hot-swap** (parent agent becomes a coordinator; child agents spawn and take over the workload). Default mode is `OBSERVE_ONLY` — the pipeline detects and logs overload events but never mutates a live agent until `enable_live_mutate()` is called explicitly, making it safe to deploy for monitoring before enabling restructuring. After enough post-mutation tasks, results are evaluated: if success rate held or improved the new topology is committed; if it regressed the system rolls back automatically, tears down the child agents, and enters a cooldown period.

**Research.** The pipeline design is documented in a formal arXiv paper covering the theoretical foundations of autonomous topology mutation — the conditions under which restructuring is safe to trigger, the invariant checks that govern role factorisation, and the commit/rollback decision criteria. The implementation is validated with 55 unit tests covering the full pipeline from overload detection through hot-swap and rollback.

---

## Agent Quality

### Stability, Session Initialisation & Scale
*Solution*

A first group of improvements ensures the agent starts cleanly and with full context, and can try more than one approach when a single attempt is insufficient. A foundational event loop fix eliminates a silent hang and `RuntimeError` in both the agent-core `Runner` startup and the jiuwenswarm `AutoHarness` service — without this fix, the agent produces zero output before a single hook fires. Four session-start rails then ensure the agent begins each task with everything it needs: ACP Tool Deduplication removes duplicate tools when the ACP channel provides its own file/terminal tools; Task Description Re-injection pins the full task goal into the system prompt as a permanent `PromptSection` so context compression can never lose it; Output Format Reminder extracts and pins the last format-signal paragraphs and fenced code blocks from `task.md`; and External Skill Directories loads skills from configurable paths (or the `EXTERNAL_SKILL_DIRS` env var) and injects them into the system prompt, with an `external_only` flag to suppress personal skills in CI and benchmark environments. On the scale side, Multi-Rollout runs N workspace clones in parallel with different strategies (correctness, minimal-diff, edge-case) and picks the best result via a configurable selector; Auto-Harness Best-of-N replaces the sequential fix loop with N scored workspace clones when CI fails; and RLAF-P Prompt Optimizer generates N candidate prompts, scores them with a composite reward (correctness × 1.0, completeness × 0.3, latency × 0.1), and persists the winner to a prompt knowledge base pending human review before it goes live.

### Execution Control & Loop Prevention
*Solution*

A second group keeps the agent productive throughout a session by managing its iteration budget and breaking out of unproductive patterns. Three rails address budget exhaustion: the Iteration Budget Rail injects an urgency warning when remaining iterations fall below a threshold, preventing the agent from starting new long subtasks in its final turns; the Tool Call Deduplication Cache suppresses identical read-only tool calls within a single LLM response and warns on cross-turn repetition; and Autonomous Execution Mode injects a directive block before every system prompt that prevents the agent from asking for confirmation, hedging, or pausing for review — designed for CI and benchmark environments where no human response will arrive. Five complementary mechanisms target loop patterns: an Anti-Repetition instruction in the identity prompt; Failure Pattern Memory, which logs failed tool calls and prepends a "do not repeat these approaches" list before every model call; Step-Back Rail, which counts consecutive non-zero shell exit codes and injects a four-step rethink directive; Verifier Circuit Breaker, which fingerprints verifier failure signatures and escalates from a rethink directive to "abandon everything and start from scratch" at 2× the threshold; and Context Headroom Guard, which monitors the token fill ratio and injects conciseness directives at 60% and critical brevity directives at 80% to slow the rate of context saturation.

### Output Quality & Observability
*Solution*

A third group improves the correctness and visibility of final outputs. Bash Output Head+Tail replaces the head-only truncation of long shell output with a combined head+tail view, preserving verifier error messages that appear at the end of long logs and were previously invisible to the model. Self-Verification Prompt injects a system-prompt section instructing the agent to run a configured verifier command after writing output files and iterate until it passes, rather than declaring completion on the first attempt. Prompt Serialisation captures the fully assembled prompt in `usage_metadata.prompt` after every LLM call — both streaming and non-streaming — making the exact input sent to the model available for logging, telemetry, and debugging without any separate instrumentation.

### Evaluation Framework
*Solution*

The Evaluation Framework gives JiuwenSwarm a structured way to define test suites, run them against the live agent, score results automatically, and enforce quality gates — all from the web UI, without external tooling. A suite is a named collection of test cases, each with an input, an expected output, a scoring method, and optional free-text criteria. Three scoring methods are available: `exact_match` (byte equality after trimming), `contains` (expected text appears anywhere in the response), and `llm_judge` (sends both outputs to the configured LLM, which returns a boolean verdict and a reason; on malformed JSON it retries once before falling back to `contains`). Running a suite executes all cases sequentially against the live agent and records status, score, duration, and LLM reason per case. A Gate Check runs the suite and compares the pass rate against a configurable threshold (default 80 %); the result is a PASS or FAIL verdict displayed inline in the UI and also callable programmatically via `run_eval_gate()` — designed for use as a quality gate before deploying Harness changes or publishing new skills. Suites and run records are stored as plain JSON under `~/.jiuwenswarm/evaluations/` and survive restarts. The framework shares its `EvalRunner` and `judge()` primitives with Auto Harness, which uses the same machinery for its autonomous benchmark loop.

### Team Verification Layer
*Solution*

The Team Verification Layer adds automatic quality assurance to Agent Team sessions. It fires asynchronously after every `TASK_COMPLETED` event — intercepted by `TeamVerificationRail`, a `DeepAgentRail` subclass that requires no changes to the agent loop itself — and asks a `VerificationReviewer` LLM to score the completed work across six weighted dimensions: correctness (25%), completeness (20%), consistency (20%), clarity (15%), security (10%), and performance (10%). The combined weighted score maps to three outcomes: **PASS** (≥ 70), **NEEDS_REWORK** (40–69), or **FAIL** (< 40). Results are stored persistently in `TEAM_MEMORY.md` by a `VerificationMemory` component, making quality history available to subsequent tasks and agents in the same session. Two configuration flags govern escalation behaviour: `block_on_fail` holds the task until the verdict is returned, and `auto_rework` automatically sends the task back to the originating agent with the reviewer's feedback if the score falls below the PASS threshold. On completion the rail emits a `team.verification.completed` event (or `team.verification.error` on failure), which the IDE Swarm Map and OTel tracing consume like any other team event. The five core components — `TeamVerificationRail`, `VerificationReviewer`, `VerificationMemory`, `VerificationResult`, and `VerificationConfig` — are Agent Team mode only and have no effect on single-agent or DeepAgent-only sessions.

---

## Intelligent Routing & Context Selection

### Thalamus — Context Selection at Runtime
*Solution + Research*

**Solution.** Thalamus solves context saturation: the problem where an agent's context window fills with irrelevant skill instructions, memory sections, and tool definitions before the actual task even begins. It precomputes optimal component combinations offline using evolutionary search and K-means clustering, then retrieves the right subset at runtime in under 10 ms with no LLM calls. A second path (Path B) trains logistic regression classifiers on operational turn logs and makes per-component inclusion decisions independently of the cluster assignments, providing a fallback that works even when a turn's profile doesn't match any cluster centroid closely.

**Research.** The `thalamus_research/` module runs five phases validating nine testable claims against a fixed 120-task evaluation suite. R1 establishes baselines (AllSelector, TF-IDF, BM25, Dense) and the evaluation protocol. R2 ablates each architectural element — GA search, budget adaptation, bookend ordering, Path A fallback — to isolate contributions. R3a extracts a co-inclusion matrix from Path B's classifier weights and injects it back into the GA fitness as a regulariser, creating a feedback loop between the two paths. R3b derives the minimum exploration rate ε* analytically from the requirement that every component receives at least n_min training examples within T_target turns, and tracks convergence via Jaccard agreement between successive Path B models. R4 replaces the hand-crafted fitness formula with a GradientBoostingRegressor trained on a 14-feature set (individual scores, type counts, co-inclusion scores, cluster metadata), requiring ~200–500 labeled turns. R5 adds cross-deployment transfer: components are fingerprinted by content hash, and a shared knowledge base of mean outcomes blends with local evidence using α = exp(−n_turns/200), so a freshly deployed agent starts from prior knowledge rather than cold random weights.

### optmod — Local Model Routing Proxy
*Solution*

optmod is a local OpenAI-compatible HTTP proxy (FastAPI, Python 3.11+) that sits between any agent and its LLM provider and transparently selects the cheapest model that can handle each request. Its key design principle is **same-turn escalation**: the agent sends one request and gets one response; optmod may silently try multiple models internally — starting cheap and stepping up only on failure — without requiring a second round-trip from the agent. Feature extraction takes under 1 ms using compiled regex with no ML, no file I/O, and no network calls in the hot path. The default router evaluates 9 deterministic rules in order (hard/long tasks → oracle, reasoning tasks → Qwen3 with `/think`, short extract/summarise → fast, Hebrew content → reasoning, etc.) across a three-tier pool: Tier 0 fast (`qwen2.5:7b`, local, free), Tier 1 reasoning (`qwen3:8b`, local, free, with thinking-mode toggle), and Tier 2 oracle (`deepseek-v4`, paid, 128k context). Three router types — passthrough, rule-based, and a scikit-learn decision tree trained on WildClawBench — can be hot-swapped at runtime via a single POST call. Everything is logged to an append-only JSONL file; no database. PerfRouter (below) is the planned Phase 2 router backend.

### PerfRouter — Benchmark-Driven Model Router
*Solution + Research*

**Solution.** PerfRouter is the Phase 2 router backend for optmod, replacing the rule-based approach with a learned quality predictor. It routes using three components: a sentence-BERT task classifier that maps each prompt to one of 33 task types by cosine similarity, an XGBoost model that predicts expected quality for each candidate model using a 46-feature vector (33 task-type affinities built from benchmark scores, 9 structural features like parameter count and context window, 5 boolean capability flags, and 3 WildClawBench seed scores), and a cost-adjusted decision that picks the model maximising `quality − α × normalised_cost` subject to context-window and capability filters. A new model requires only a `models.yaml` entry and a 2-minute pipeline re-run — no benchmark runs needed. Pricing is applied at decision time from runtime config, not baked into the trained model, so cost changes take effect on restart without retraining.

**Research.** Quality and cost data come from three sources: Artificial Analysis API (objective benchmark scores across 527 models), Arena ELO (human preference scores in 5 categories), and WildClawBench ground truth for the 3 models already measured. Evaluated against the current 10-model pool at a 25% quality degradation tolerance versus DeepSeek V4 Pro, PerfRouter achieves **32.2% cost reduction** (80.1% if the baseline is V4 Flash).

---

## Memory

### jiuwenswarm-memtier — Tiered Agent Memory
*Solution + Research*

**Solution.** MEMTIER replaces the flat-file memory system used by JiuwenSwarm with a tiered architecture designed to survive long, complex sessions. It addresses four failure modes in the existing approach: context collapse when memory exceeds the context window, information loss during compaction, inability to retrieve by meaning rather than keywords, and lack of feedback from tool outcomes back into memory quality. The system stores full episodic history in an append-only JSONL log, retrieves relevant passages with a two-stage pipeline (BM25 shortlist → five-signal reranking), maintains a distilled semantic tier of entity-relation facts, and learns cognitive weights from observed tool success and failure.

**Research.** The system is evaluated on LongMemEval-S, achieving +33 percentage points over the no-retrieval baseline. The evaluation methodology and tiered architecture design support an EMNLP 2026 industry-track submission.

---

## Observability

### Agent-Core OTel — Live Execution Tracing
*Solution*

Agent-Core OTel is the OpenTelemetry instrumentation layer for agent-core, providing live tracing of agent execution across all agent types (team agents, standalone DeepAgents, single BaseAgents) and exporting structured traces to Langfuse and metrics to Prometheus. Two independent OTel systems already exist in the codebase: System A wires into `Runner.callback_framework` (the global event bus) and produces a full span hierarchy for team agents — `team → agent.task_iteration → llm.call / tool.{name}` — with production-hardened span lifecycle management that handles asyncio cancellation cleanly; System B covers standalone BaseAgents and workflows via `core.session.tracer` using a separate TracerProvider that deliberately does not conflict with System A. Five phases of work remain: Phase 1 fixes standalone DeepAgent iteration spans (2 file changes, no new files), Phase 2 adds a long-lived session root span that groups all iterations in one trace, Phase 3 adds ordered trajectory events per iteration (seq, kind, model/tool, tokens, latency as span events), Phase 4 introduces a MeterProvider with token counters, latency histograms, and error rate gauges, and Phase 5 adds per-task multi-agent contribution aggregation and USD cost estimation. All work lands on `feature-observability-enhancement`.

### TraceHound — Session Diagnostics and Observability
*Solution*

TraceHound reads JiuwenSwarm session-history JSONL files after sessions complete and produces structured, actionable diagnostics across eleven dimensions: data health, conversation length, time bottlenecks, token usage, LLM performance, tool success rates, error categorisation, user query patterns, session flow, tool argument analysis, and content delivery quality. Results are available both as a structured report object and as human-readable text output. An autonomous HoundAgent variant runs continuously and watches a session log directory for new files, triggering analysis automatically. A GUI analyzer provides interactive exploration for developers digging into a specific session. TraceHound is complementary to the live OTel tracing above — it handles post-session forensics rather than real-time instrumentation.

---

## IDE Integration

### jiuwenswarm-ide — IDE Plugin
*Solution*

JiuwenSwarm IDE brings the full JiuwenSwarm multi-agent experience directly into the developer's editor through a JetBrains plugin and a VS Code extension. Both plugins share the same webview UI (`chat.html`, `swarm_map.html`) and connect to a locally running JiuwenSwarm server over WebSocket. Features include streaming chat with full tool-call transparency, automatic IDE context injection (active file, cursor position, diagnostics, git state, project rules), file-edit diff viewers with approval workflows, per-turn checkpoint rewind, clickable file and symbol links, terminal integration, session management, and a real-time Swarm Map panel with Map, List, and Board (kanban) views for watching multi-agent sessions unfold. The plugin is infrastructure — agent logic runs in JiuwenSwarm; the IDE wraps it.
