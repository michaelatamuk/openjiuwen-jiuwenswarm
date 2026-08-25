# TeamPulse — Inventory of Existing Tasks (Issues + Cortex)

> Complete inventory of every task in the issues folder (`docs-michael/issues/`) and
> every independent item in the cortex (`docs-michael/openjiuwen-cortex.md`), grouped by
> relevance to the TeamPulse proposal. Each bullet states only what the task does
> (bug fix or feature) — no comparison. Items present in both issues and cortex are
> listed from the issues only. Same-fix-across-repos issue pairs are grouped into one
> bullet so nothing is double-counted.
>
> Date: 2026-08-25.

---

## Most relevant

**Team Verification Layer.**
Adds automatic quality review to team sessions: when a teammate finishes a task, a
reviewer scores the work and, if set, sends it back to the originating agent with
feedback for rework.

**Swarmflow live activity.**
Streams each worker's mid-run tool calls into the workflow progress stream and surfaces
them in the UI as per-member activity events, so workers no longer look idle.

**Step-back rail.**
Counts consecutive failed shell commands and, past a threshold, injects a high-urgency
instruction telling the agent to stop tweaking and rethink its whole strategy.

**Verifier circuit breaker.**
Fingerprints repeated identical test failures and injects an escalating directive
(rethink at 3, start from scratch at 6) to break verifier-failure loops.

**Failure-pattern memory.**
Remembers failed tool calls and lists them in the system prompt so the agent stops
repeating known-bad approaches.

**Tool-call dedup cache.**
Returns cached results for repeated identical read-only tool calls within a turn, and
warns the agent when it repeats a call too many times across turns.

**LLM call start/end events.**
Emits `llm_call_start`/`llm_call_end` events so clients can show a "Thinking…" state and
attribute activity to the correct agent lane in team mode.

**Anti-repetition prompt.**
Strengthens the identity prompt with an explicit instruction not to repeat a tool call
that already returned empty or errored, ending repetition loops.

**Agent-Core OTel.**
Instruments team agents with OpenTelemetry, exporting live execution traces
(team → iteration → LLM call / tool) and per-task multi-agent contribution aggregation.

**Autonomous Topology Mutation — topology mutation pipeline.**
Detects when a single agent is overloaded for several consecutive ticks and restructures
the team live (spawning specialised child agents), with a safe observe-only default and
commit/rollback.

**Autonomous Topology Mutation — tool repair.**
Fires on every failed tool call, classifies the failure, and makes a small isolated
repair call so the agent can retry instead of failing.

**TraceHound.**
Analyzes finished session-history files and reports diagnostics across eleven dimensions
including session flow, tool success rates, and error categorisation.

**Standalone DeepAgent observability.**
Adds tracing and observability for standalone DeepAgents, separate from the team-mode
OTel tracing, so single-agent runs are also visible in traces.

---

## Partially relevant

**Self-verification prompt.**
Injects a verification step into code tasks so the agent runs the test script after
writing output and retries until it passes.

**Bash output head+tail.**
Truncates long shell output by keeping both the head and tail, so error messages at the
end of logs are no longer lost.

**Iteration-budget awareness.**
Warns the agent how many iterations remain near the limit so it finishes current work and
produces a clean partial result instead of being cut off.

**Autonomous execution mode.**
Injects a high-priority directive for unattended environments telling the agent to act
decisively and finish without waiting for confirmation.

**Task-description reinjection.**
Pins the full task description in a never-compressed system-prompt section so the
original instructions always stay visible.

**Context-headroom guard.**
Monitors context fill and injects escalating conciseness directives (at 60% and 80%) so
the agent shortens responses before compression erases history.

**Output-format reminder.**
Extracts the required output format from the task file and pins it in the system prompt
so it survives compression.

**Multi-rollout.**
Runs several copies of the same general-purpose subagent in parallel, each given a
different strategy hint (correctness, minimal-diff, edge-case), and keeps the best
result.

**Auto-Harness Best-of-N.**
Replaces the single sequential CI-repair loop with several independent repair attempts and
promotes the highest-scoring workspace.

**Evaluation Framework.**
Defines test suites and runs them against the live agent, scoring results and enforcing a
quality gate before deploys.

**memtier.**
Replaces the flat-file memory with a tiered system that stores episodic history, retrieves
by meaning, and learns from tool success/failure.

**Thalamus.**
Picks which context components (skills, memory sections, tool definitions) to load for
each task so the context window isn't filled with irrelevant content before the task
begins. An offline phase precomputes the best subset per task profile via evolutionary
search and clustering, with an online learned classifier as a fallback — all without an
LLM call in the hot path.

**Autonomous Topology Mutation — memory guard.**
Classifies memory into privacy levels and redacts content above a model's ceiling before
every call, as a code gate.

**Prompt serialization.**
Captures the fully assembled prompt into usage metadata after every LLM call for logging
and debugging.

**Structural self-verification gate.**
Enforces a structural self-verification gate for code agents, so the agent checks the
shape/structure of its output against requirements before finishing.

**Session task cost limits.**
Tracks per-session task cost limits so spend on a session can be monitored and bounded.

**Boundary exception recording on OTel spans.**
Records exceptions that cross service boundaries onto OpenTelemetry spans and narrows the
token-manager catch, so failures are visible in traces.

**Unified error base + span-recording helper.**
Adds a shared JiuwenError base class and a boundary span-recording helper so errors from
different components are recorded consistently on traces.

---

## Non-relevant

**Event-loop blocking fix.**
Replaces blocking synchronous calls (`time.sleep`, `requests.get`) inside async code with
async equivalents so the shared event loop never freezes.

**Image-modality probe.**
Detects whether a model supports native image input by sending a dummy image, and caches
the verdict so it doesn't re-probe.

**fetch_webpage fallback.**
Adds HTTP 202/499 (JS-rendered and paywalled pages) to the jina.ai reader fallback so page
fetching returns real content.

**External skill discovery.**
Lets the agent load skills from external directories (or an env var) so task-provided
benchmark skills become visible and usable.

**SkillTend.**
Keeps skills and memory current during live sessions by proposing small targeted patches
to SKILL.md files, plus a curator that retires unused skills.

**SkillForge.**
Evolves SKILL.md files between sessions using a genetic algorithm, scoring variants and
promoting only safe improvements.

**optmod.**
A local routing proxy that transparently picks the cheapest model that can handle each
request, stepping up on failure within the same turn.

**PerfRouter.**
A benchmark-trained model router that predicts quality per candidate model and selects by
quality minus cost.

**Silent-exception lint gate.**
Adds semgrep rules banning silent `except` blocks and an except-Exception ratchet, so the
codebase stops swallowing errors silently.

**Store error + super-step status.**
Adds a StoreError type and a status code for pregel super-steps in the workflow engine.

**Workflow/Engine error rename.**
Renames the engine-local WorkflowError to EngineError for clarity.

**Typed errors at the pregel boundary.**
Adds typed errors at the graph/agent boundary and tracebacks in the tool invoker, so error
details propagate correctly through the workflow engine.

**Docs: repo URLs and setup paths.**
Updates git repository URLs and fixes outdated setup paths in the documentation.

**General-purpose subagent for team modes.**
Enables the general-purpose subagent type to be used in team modes.

**Re-parent errors under JiuwenError.**
Re-parents TeamError, A2XError, and LLMClientError under the shared JiuwenError base class.

---

## Notes

- **Pairings:** same-fix-across-repos issue pairs (event-loop, team verification,
  swarmflow activity) are each written as one bullet.
- **Deduplication:** anything also described in the cortex is listed from the issues
  only (e.g. Team Verification, swarmflow activity, step-back, circuit breaker, failure
  memory, dedup). The cortex is only mentioned for items that have no corresponding issue.
- **Coverage:** all issue files and all independent cortex items are represented once.
