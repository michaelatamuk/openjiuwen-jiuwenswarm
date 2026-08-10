# OpenJiuwen Cortex

OpenJiuwen Cortex is a collection of independent projects — algorithms, systems, and tools — each addressing a different weakness or opportunity in JiuwenSwarm. There is no single line of improvement: some tackle routing and cost, some tackle memory, some tackle how skills are written and maintained, some tackle multi-agent safety, and some tackle developer experience. Each project can be useful on its own; together they form a coherent effort to make JiuwenSwarm faster, cheaper, smarter, and more robust.

---

## Skills

### SkillTend — Online Skill Maintenance
*Solution + Research*

**Skill Review Rail.** A background rail that keeps skills and memory current during live agent sessions without interrupting the agent. It fires after a configurable number of tool calls or user turns, snapshots the conversation, and asks an LLM to propose small, targeted patches to SKILL.md files and memory entries rather than full rewrites — preserving stable content while fixing what has drifted. All review work is serialised and non-blocking.

**Curator.** A companion daemon that monitors skill usage over time and transitions skills through a lifecycle (ACTIVE → STALE → ARCHIVED), retiring skills that are no longer used and preventing the skill library from growing unbounded.

**Research.** The research component (`skilltend_research/`) runs eight interdependent empirical studies:

- **Study 01** — validates four quality metrics (Retrieval Relevance, Information Density, Task Success Rate, Patch Stability) against human-labeled ground truth; gate: inter-rater κ > 0.65; must pass before any other study proceeds.
- **Study 02** — sweeps trigger intervals across 7,680 simulated sessions and evaluates an AdaptiveTrigger that fires on conversation embedding divergence rather than fixed counts.
- **Study 03** — identifies the minimum-cost LLM that achieves ≥95% of frontier-model review quality.
- **Study 04** — compares four memory injection strategies at varying character limits.
- **Study 05** — uses survival analysis and an XGBoost predictor (target AUC > 0.75) to replace the fixed-threshold lifecycle FSM with a learned one.
- **Study 06** — prompt ablations: which parts of the review prompt drive quality gains.
- **Study 07** — mid-session patch interference: whether review patches applied during a session destabilise ongoing agent behaviour.
- **Study 08** — library-level coverage gaps: which skill types are systematically under-reviewed or under-triggered.

### SkillForge — Offline Skill Optimisation
*Solution + Research*

**Solution.** SkillForge automatically evolves JiuwenSwarm SKILL.md files between sessions using a genetic algorithm called GEPA (Genetic Evolutionary Prompt Adaptation). It maintains a population of skill variants and concentrates the optimisation budget on candidates most likely to improve.

**Fitness evaluation** — each variant is scored against seven complementary metrics: bag-of-words, F1, ROUGE, semantic similarity, graph structure, checklist coverage, and cross-skill consistency.

**Thompson Sampling** focuses the budget at three levels:
- *Skill scheduling* — which skills to evolve next
- *Training example selection* — which examples to evaluate against
- *Acceptance gating* — whether to promote a new variant

**Safety gate** — a regression-aware holdout check prevents any evolved skill from being deployed if it degrades performance on examples that were already passing.

**Research.** The paper (`docs/skillforge_paper.md`) identifies three structural problems the solution does not fully close:

- **Structural Semantic Stagnation** — frozen base text masked by growing history
- **Regression Trap** — local patches degrading other behaviour
- **Production Trust Gap** — macro evolution requiring multi-dimensional verification before deployment

Nine open research directions follow from these:

- Formalising fitness traps and Goodhart's Law in evolutionary prompt systems
- AutoML for fitness function selection (replacing the fixed 7-metric weighted average with a learned one)
- Holdout gate composition theory
- Early gate rejection prediction to cut wasted evaluation budget
- Discriminative trace construction via optimal experimental design
- Multi-objective Pareto evolution that makes quality-cost trade-offs explicit
- Online versus batch evolution dynamics
- Cross-task transfer of evolutionary progress between skill domains

---

## Multi-Agent Safety & Topology Adaptation (jiuwen_atm)

JiuwenSwarm ATM (Autonomous Topology Mutation) addresses three failure modes that appear on the very first realistic multi-step agent task:

- **Malformed tool calls** that abort tasks before any work is done
- **Role entropy** — one agent accumulates too many responsibilities until it stalls
- **Credential / PII leakage** — session memory leaks unfiltered into cloud model calls

All three are handled by independent rails attached through exactly two hooks (`before_tool_call` / `after_tool_call` and a periodic `on_tick`) — no agent code changes are required.

| Metric | A0 baseline | A3 full ATM |
|---|---|---|
| Task success rate (code/debug) | 0.20 | 1.00 |
| Credential exposure events (security workloads) | 2.0 | 0.0 |
| Latency overhead | — | ~2–3× |

### ATM Algorithm 1 — Tool Repair
*Solution*

ToolRepairRail fires on every failed tool call. It classifies the failure, then — for repairable failures — makes an isolated repair call where the LLM sees only the tool schema, the failing arguments, and the error (not full session history), keeping context minimal and cost low. Recent successful calls for the same tool are fed as few-shot examples, so repair quality improves within a session.

| Failure type | Description | Confidence gate |
|---|---|---|
| HARD | Bad arguments (e.g. string passed where int expected) | ≥ 0.75 |
| SOFT | Network / timeout — recoverable without repair | skipped |
| UNKNOWN | Unclassifiable failure | ≥ 0.90 |

The key safety contract is **fail-equal-to-baseline**: if repair fails or confidence is too low, the call fails exactly as it would with no rail at all — the rail can only help or do nothing, never make things worse.

### ATM Algorithm 2 — Memory Guard
*Solution*

MemoryGuardRail fires before every model call and enforces a five-level Privacy Level (PL) classification on all memory content:

| Level | Label | Accessible by |
|---|---|---|
| PL0 | Public | All endpoints |
| PL1 | Low | `cloud_public` and above |
| PL2 | Internal | `cloud_trusted` and above |
| PL3 | PII / paths | Local models only |
| PL4 | Credentials | Local models only |

Content above the ceiling for the target endpoint is redacted before the model call is made. Critically, this is a **code gate, not a prompt instruction**: the model never receives the redacted content and has no way to repeat or leak it. This is what allows the A3 condition to achieve zero credential exposure events on workloads where the A0 baseline leaked credentials on every run.

### ATM Algorithm 3 — Topology Mutation Pipeline
*Solution + Research*

**Solution.** ATMPipeline detects when a single agent is overloaded — specifically when its busyness metric B_i exceeds threshold τ for **3 consecutive ticks** — and restructures the team live in four stages:

1. **Detect** — sustained overload confirmed (not just a transient spike)
2. **Factorize** — LLM proposes 2–4 specialised child roles; invariant check verifies each child gets only the tools it needs
3. **Distill** — memory atoms routed to shared / role-specific / quarantine buckets
4. **Hot-swap** — parent agent becomes a coordinator; child agents spawn and take over the workload

Default mode is `OBSERVE_ONLY` — the pipeline detects and logs overload events but never mutates a live agent until `enable_live_mutate()` is called explicitly, making it safe to deploy for monitoring before enabling restructuring. After enough post-mutation tasks, results are evaluated: if success rate held or improved the new topology is committed; if it regressed the system rolls back automatically, tears down the child agents, and enters a cooldown period.

**Research.** The pipeline design is documented in a formal arXiv paper covering the theoretical foundations of autonomous topology mutation — the conditions under which restructuring is safe to trigger, the invariant checks that govern role factorisation, and the commit/rollback decision criteria. The implementation is validated with 55 unit tests covering the full pipeline from overload detection through hot-swap and rollback.

---

## Agent Quality

### Stability, Session Initialisation & Scale
*Solution*

A first group of improvements ensures the agent starts cleanly and with full context, and can try more than one approach when a single attempt is insufficient.

**Stability:** A foundational event loop fix eliminates a silent hang and `RuntimeError` in both the agent-core `Runner` startup and the jiuwenswarm `AutoHarness` service — without this fix, the agent produces zero output before a single hook fires.

**Session initialisation — three rails:**
- **Task Description Re-injection** — pins the full task goal into the system prompt as a permanent `PromptSection` so context compression can never lose it
- **Output Format Reminder** — extracts and pins the last format-signal paragraphs and fenced code blocks from `task.md`
- **External Skill Directories** — loads skills from configurable paths (or `EXTERNAL_SKILL_DIRS` env var); `external_only` flag suppresses personal skills in CI and benchmark environments

**Scale — three mechanisms:**
- **Multi-Rollout** — runs N workspace clones in parallel with different strategies (correctness, minimal-diff, edge-case) and picks the best result via a configurable selector
- **Auto-Harness Best-of-N** — replaces the sequential fix loop with N scored workspace clones when CI fails; winner selected by tests passed → diff size → lint errors
- **RLAF-P Prompt Optimizer** — generates N candidate prompts, scores with a composite reward (correctness × 1.0, completeness × 0.3, latency × 0.1), persists the winner to a prompt knowledge base pending human review before it goes live

### Execution Control & Loop Prevention
*Solution*

A second group keeps the agent productive throughout a session by managing its iteration budget and breaking out of unproductive patterns.

**Budget exhaustion — three rails:**
- **Iteration Budget Rail** — injects an urgency warning when remaining iterations fall below a threshold, preventing new long subtasks in the final turns
- **Tool Call Deduplication Cache** — suppresses identical read-only tool calls within a single LLM response; warns on cross-turn repetition
- **Autonomous Execution Mode** — injects a directive block preventing the agent from asking for confirmation, hedging, or pausing for review; designed for CI environments where no human response will arrive

**Loop prevention — five mechanisms:**
- **Anti-Repetition Prompt** — explicit no-repeat instruction in the identity section
- **Failure Pattern Memory** — logs failed tool calls and prepends a "do not repeat these approaches" list before every model call
- **Step-Back Rail** — counts consecutive non-zero shell exit codes and injects a four-step rethink directive
- **Verifier Circuit Breaker** — fingerprints verifier failure signatures; escalates from a rethink directive to "abandon everything and start from scratch" at 2× the threshold
- **Context Headroom Guard** — monitors token fill ratio; injects conciseness directives at 60% and critical brevity directives at 80%

### Output Quality & Observability
*Solution*

A third group improves the correctness and visibility of final outputs:

- **Bash Output Head+Tail** — replaces head-only truncation of long shell output with a combined head+tail view, preserving verifier error messages at the end of long logs that were previously invisible to the model
- **Self-Verification Prompt** — injects a system-prompt section instructing the agent to run a configured verifier command after writing output files and iterate until it passes, rather than declaring completion on the first attempt
- **Prompt Serialization** — captures the fully assembled prompt in `usage_metadata.prompt` after every LLM call (both streaming and non-streaming), making the exact model input available for logging and debugging without separate instrumentation

### Evaluation Framework
*Solution*

The Evaluation Framework gives JiuwenSwarm a structured way to define test suites, run them against the live agent, score results automatically, and enforce quality gates — all from the web UI, without external tooling. A suite is a named collection of test cases, each with an input, an expected output, a scoring method, and optional free-text criteria.

| Scoring method | How it works | Best for |
|---|---|---|
| `exact_match` | Byte equality after trimming | Deterministic short answers (IDs, numbers, status codes) |
| `contains` | Expected text appears anywhere in the response | When extra explanation around required content is acceptable |
| `llm_judge` | LLM returns boolean verdict + reason; retries once on malformed JSON, falls back to `contains` | Open-ended answers, synonymous phrasing, conversational replies |

**Running a suite** executes all cases sequentially, recording status, score, duration, and LLM reason per case.

**Gate Check** runs the suite and compares the pass rate against a configurable threshold (default 80 %). The result — `PASS` or `FAIL` — is shown inline in the UI and is also callable programmatically via `run_eval_gate()`, making it usable as a quality gate before deploying Harness changes or publishing new skills.

**Storage:** suites and run records are plain JSON files under `~/.jiuwenswarm/evaluations/`, surviving restarts and shared across all sessions.

**Auto Harness integration:** the framework shares its `EvalRunner` and `judge()` primitives with Auto Harness, which uses the same machinery for its autonomous benchmark loop.

### Team Verification Layer
*Solution*

The Team Verification Layer adds automatic quality assurance to Agent Team sessions. It fires asynchronously after every `TASK_COMPLETED` event — intercepted by `TeamVerificationRail`, a `DeepAgentRail` subclass that requires no changes to the agent loop itself — and asks a `VerificationReviewer` LLM to score the completed work.

| Quality dimension | Weight |
|---|---|
| Correctness | 25% |
| Completeness | 20% |
| Consistency | 20% |
| Clarity | 15% |
| Security | 10% |
| Performance | 10% |

| Score | Verdict |
|---|---|
| ≥ 70 | PASS |
| 40–69 | NEEDS_REWORK |
| < 40 | FAIL |

Results are stored persistently in `TEAM_MEMORY.md` by a `VerificationMemory` component, making quality history available to subsequent tasks and agents in the same session. Two configuration flags govern escalation: `block_on_fail` holds the task until the verdict is returned; `auto_rework` automatically sends the task back to the originating agent with the reviewer's feedback. On completion the rail emits `team.verification.completed` (or `team.verification.error` on failure), which the IDE Swarm Map and OTel tracing consume like any other team event.

Agent Team mode only — no effect on single-agent or DeepAgent-only sessions. The five implementation components are `TeamVerificationRail`, `VerificationReviewer`, `VerificationMemory`, `VerificationResult`, and `VerificationConfig`.

---

## Intelligent Routing & Context Selection

### Thalamus — Context Selection at Runtime
*Solution + Research*

**Solution.** Thalamus solves context saturation — the problem where an agent's context window fills with irrelevant skill instructions, memory sections, and tool definitions before the actual task even begins. It operates through two complementary paths:

- **Path A (offline precomputation)** — uses evolutionary search and K-means clustering to find the optimal subset of context components for each task profile. At runtime the right subset is retrieved in under 10 ms with no LLM calls.
- **Path B (online learning)** — trains logistic regression classifiers on operational turn logs and makes per-component inclusion decisions independently of the cluster assignments. Serves as a fallback when a turn's profile does not match any cluster centroid closely, and feeds a co-inclusion signal back into Path A's fitness function.

**Research.** The `thalamus_research/` module runs five phases validating nine testable claims against a fixed 120-task evaluation suite:

- **R1** — establishes baselines (AllSelector, TF-IDF, BM25, Dense) and the evaluation protocol
- **R2** — ablates each architectural element (GA search, budget adaptation, bookend ordering, Path A fallback) to isolate contributions
- **R3a** — extracts a co-inclusion matrix from Path B's classifier weights and injects it back into the GA fitness as a regulariser, creating a feedback loop between the two paths
- **R3b** — derives the minimum exploration rate ε* analytically; tracks convergence via Jaccard agreement between successive Path B models
- **R4** — replaces the hand-crafted fitness formula with a GradientBoostingRegressor trained on a 14-feature set (individual scores, type counts, co-inclusion scores, cluster metadata), requiring ~200–500 labeled turns
- **R5** — adds cross-deployment transfer: components fingerprinted by content hash; mean outcomes blend with local evidence using α = exp(−n_turns/200), giving a freshly deployed agent a warm start from prior knowledge

### optmod — Local Model Routing Proxy
*Solution*

optmod is a local OpenAI-compatible HTTP proxy (FastAPI, Python 3.11+) that sits between any agent and its LLM provider and transparently selects the cheapest model that can handle each request. Its key design principle is **same-turn escalation**: the agent sends one request and gets one response; optmod may silently try multiple models internally — starting cheap and stepping up only on failure — without requiring a second round-trip. Feature extraction takes under 1 ms using compiled regex with no ML, no file I/O, and no network calls in the hot path.

**Model tier pool:**

| Tier | Model | Cost | Notes |
|---|---|---|---|
| 0 — fast | `qwen2.5:7b` | Local, free | Default for simple tasks |
| 1 — reasoning | `qwen3:8b` | Local, free | Thinking-mode toggle via `/think` |
| 2 — oracle | `deepseek-v4` | Paid | 128k context |

**Router types** (hot-swappable at runtime via a single POST call):
- **Passthrough** — no routing; all requests go to a fixed model
- **Rule-based** — 9 deterministic rules in order (hard/long → oracle, reasoning → Qwen3, short extract → fast, Hebrew content → reasoning, etc.)
- **Decision tree** — scikit-learn model trained on WildClawBench

Everything is logged to an append-only JSONL file; no database. PerfRouter (below) is the planned Phase 2 router backend.

### PerfRouter — Benchmark-Driven Model Router
*Solution + Research*

**Solution.** PerfRouter is the Phase 2 router backend for optmod, replacing the rule-based approach with a learned quality predictor. It routes using three components:

1. **sentence-BERT task classifier** — maps each prompt to one of 33 task types by cosine similarity
2. **XGBoost quality predictor** — predicts expected quality per candidate model using a 46-feature vector (33 task-type affinities built from benchmark scores, 9 structural features like parameter count and context window, 5 boolean capability flags, and 3 WildClawBench seed scores)
3. **Cost-adjusted selection** — picks the model maximising `quality − α × normalised_cost` subject to context-window and capability filters

A new model requires only a `models.yaml` entry and a 2-minute pipeline re-run — no benchmark runs needed. Pricing is applied at decision time from runtime config, not baked into the trained model, so cost changes take effect on restart without retraining.

**Research.** Training data comes from three sources:

| Source | What it provides |
|---|---|
| Artificial Analysis API | Objective benchmark scores across 527 models |
| Arena ELO | Human preference scores across 5 categories |
| WildClawBench | Ground truth for the 3 models already measured |

Evaluated at a 25% quality degradation tolerance versus DeepSeek V4 Pro, the current 10-model pool achieves **32.2% cost reduction** (80.1% if the baseline is V4 Flash).

---

## Memory

### jiuwenswarm-memtier — Tiered Agent Memory
*Solution + Research*

**Solution.** MEMTIER replaces the flat-file memory system used by JiuwenSwarm with a tiered architecture designed to survive long, complex sessions. It addresses four failure modes in the existing approach:

- **Context collapse** — memory exceeds the context window
- **Information loss** — content is lost during compaction
- **Keyword-only retrieval** — inability to retrieve by meaning rather than keywords
- **Missing feedback loop** — tool outcomes do not feed back into memory quality

The system stores full episodic history in an append-only JSONL log, retrieves relevant passages with a two-stage pipeline (BM25 shortlist → five-signal reranking), maintains a distilled semantic tier of entity-relation facts, and learns cognitive weights from observed tool success and failure.

**Research.** The system is evaluated on LongMemEval-S, achieving +33 percentage points over the no-retrieval baseline. The evaluation methodology and tiered architecture design support an EMNLP 2026 industry-track submission.

---

## Observability

### Agent-Core OTel — Live Execution Tracing
*Solution*

Agent-Core OTel is the OpenTelemetry instrumentation layer for agent-core, exporting structured traces to Langfuse and metrics to Prometheus across all agent types (team agents, standalone DeepAgents, single BaseAgents). Two independent OTel systems exist in the codebase:

- **System A** — wires into `Runner.callback_framework` (the global event bus); produces a full span hierarchy for team agents (`team → agent.task_iteration → llm.call / tool.{name}`) with production-hardened asyncio cancellation handling
- **System B** — covers standalone BaseAgents and workflows via `core.session.tracer`; uses a separate TracerProvider that deliberately does not conflict with System A

Five phases of remaining work:

1. Fix standalone DeepAgent iteration spans (2 file changes, no new files)
2. Add a long-lived session root span grouping all iterations in one trace
3. Add ordered trajectory events per iteration (seq, kind, model/tool, tokens, latency as span events)
4. Introduce a MeterProvider with token counters, latency histograms, and error rate gauges
5. Add per-task multi-agent contribution aggregation and USD cost estimation

All work lands on `feature-observability-enhancement`.

### TraceHound — Session Diagnostics and Observability
*Solution*

TraceHound analyzes JiuwenSwarm session-history JSONL files after sessions complete and produces structured diagnostics. It covers eleven dimensions:

data health · conversation length · time bottlenecks · token usage · LLM performance · tool success rates · error categorisation · user query patterns · session flow · tool argument analysis · content delivery quality

Results are available as a structured report object or human-readable text. Three usage modes:

- **Batch analysis** — run against a finished session file on demand
- **HoundAgent** — autonomous variant that watches a directory and triggers analysis automatically on new session files
- **GUI analyzer** — interactive exploration for debugging a specific session

TraceHound handles post-session forensics; Agent-Core OTel handles real-time instrumentation.

---

## Meet users where they work

### jiuwenswarm-ide — IDE Plugin
*Solution*

JiuwenSwarm IDE puts the agent directly inside the developer's editor — available as both a VS Code extension and a JetBrains plugin. The agent is aware of what the developer is currently looking at: open files, recent errors, git state, and project-level rules. This awareness is automatic — the developer does not need to paste context into a chat window.

**What developers can do:**
- Chat with the agent without leaving the editor
- Review proposed code changes as a diff before accepting or rejecting them
- Rewind to an earlier point in a session if a direction turns out to be wrong
- Navigate directly from an agent response to the relevant file or symbol in the editor
- Let the agent run terminal commands as part of a task
- Monitor a live multi-agent team through a visual panel that shows which agents are active and what they are working on

Targets software engineers and engineering teams who spend most of their working time in an IDE.

### jiuwenswarm-jupyterlab — JupyterLab Extension
*Solution*

jiuwenswarm-jupyterlab puts JiuwenSwarm inside Jupyter notebooks, where data scientists and ML researchers actually work. The agent has direct access to the live notebook environment — it can see the current state of variables, datasets, and cell outputs without the user copying anything. It works in JupyterLab, classic Notebook, VS Code Notebooks, Colab, and Kaggle.

**What data scientists can do:**
- Ask the agent a question or give it a task from inside a notebook cell, without switching windows
- Get agent responses and generated code written directly into the notebook
- Have the agent reason over live data — it sees actual variable values and DataFrame contents, not just code
- Use the sidebar chat panel for a longer back-and-forth conversation while keeping the notebook in view
- Track multi-agent work on a visual swarm map panel

Targets data scientists and ML researchers who work in notebooks rather than IDEs.

### jiuwenswarm-browser — Chromium Extension
*Solution*

jiuwenswarm-browser puts JiuwenSwarm into the browser as an ambient research assistant. Where the IDE plugin understands code and the JupyterLab extension understands data, the browser extension understands web content — articles, papers, filings, threads, transcripts. Works on Chrome and on Chromium-based browsers without the Side Panel API (major Chinese browsers included), where the panel opens as a popup window automatically.

**What researchers and analysts can do:**
- Pin pages from multiple tabs into a named session; the agent treats all of them as one unified context
- Ask cross-source questions against 9 specialized content types (arXiv, GitHub, SEC EDGAR, PubMed, Wikipedia, YouTube, Twitter/X, Hacker News, generic articles)
- Let the agent act on pages — highlight cited passages, scroll to sections, fill forms, take screenshots, open follow-up URLs
- Manage sessions with templates, export to JSON or Markdown, import, and open directly in the web app
- Save highlights and session notes persistently; notes are injected as context with every message

Targets researchers, analysts, journalists, and professionals who work primarily in the browser rather than an IDE or notebook.
