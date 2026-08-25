## See: What's happening

The raw activity and events a coordination map would be built from.

**Swarmflow live activity.**
Streams each worker's mid-run tool calls into the workflow progress stream and surfaces
them in the UI as per-member activity events, so workers no longer look idle.

**LLM call start/end events.**
Emits `llm_call_start`/`llm_call_end` events so clients can show a "Thinking…" state and
attribute activity to the correct agent lane in team mode.

**Agent-Core OTel.**
Instruments team agents with OpenTelemetry, exporting live execution traces
(team → iteration → LLM call / tool) and per-task multi-agent contribution aggregation.

**TraceHound.**
Analyzes finished session-history files and reports diagnostics across eleven dimensions
including session flow, tool success rates, and error categorisation.

**Standalone DeepAgent observability.**
Adds tracing and observability for standalone DeepAgents, separate from the team-mode
OTel tracing, so single-agent runs are also visible in traces.

**Boundary exception recording on OTel spans.**
Records exceptions that cross service boundaries onto OpenTelemetry spans and narrows the
token-manager catch, so failures are visible in traces.

**Unified error base + span-recording helper.**
Adds a shared JiuwenError base class and a boundary span-recording helper so errors from
different components are recorded consistently on traces.

**Session task cost limits.**
Tracks per-session task cost limits so spend on a session can be monitored and bounded.

---

## Detect: Going in circles

Detect and break repeated operations that make no progress.

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

**Anti-repetition prompt.**
Strengthens the identity prompt with an explicit instruction not to repeat a tool call
that already returned empty or errored, ending repetition loops.

---

## Detect: Spot bad output

Look at output and gate it, without improving it themselves.

**Evaluation Framework.**
Defines test suites and runs them against the live agent, scoring results and enforcing a
quality gate before deploys.

**Structural self-verification gate.**
Enforces a structural self-verification gate for code agents, so the agent checks the
shape/structure of its output against requirements before finishing.

**Bash output head+tail.**
Truncates long shell output by keeping both the head and tail, so error messages at the
end of logs are no longer lost.

---

## Improve: Make the output better

Check output and feed corrections back so it gets better.

**Team Verification Layer.**
Adds automatic quality review to team sessions: when a teammate finishes a task, a
reviewer scores the work and, if set, sends it back to the originating agent with
feedback for rework.

**Self-verification prompt.**
Injects a verification step into code tasks so the agent runs the test script after
writing output and retries until it passes.

---

## Recover: Getting unstuck

Get the agent unstuck and recover from failures.

**Autonomous Topology Mutation — topology mutation pipeline.**
Detects when a single agent is overloaded for several consecutive ticks and restructures
the team live (spawning specialised child agents), with a safe observe-only default and
commit/rollback.

**Autonomous Topology Mutation — tool repair.**
Fires on every failed tool call, classifies the failure, and makes a small isolated
repair call so the agent can retry instead of failing.

**Autonomous execution mode.**
Injects a high-priority directive for unattended environments (mainly CI and benchmark
runs) telling the agent to act decisively and finish without waiting for confirmation.

---

## Prevent: Long-session failures

Stop the agent from failing as the session grows long.

**Task-description reinjection.**
Pins the full task description in a never-compressed system-prompt section so the
original instructions always stay visible.

**Output-format reminder.**
Extracts the required output format from the task file and pins it in the system prompt
so it survives compression.

**Context-headroom guard.**
Monitors context fill and injects escalating conciseness directives (at 60% and 80%) so
the agent shortens responses before compression erases history.

**Iteration-budget awareness.**
Warns the agent how many iterations remain near the limit so it finishes current work and
produces a clean partial result instead of being cut off.

---

## Choose: The best attempt

Run the same task several times with different strategies, then select the best result.
Both items here are optional — a new option, not turned on by default.

**Multi-rollout.**
Runs several copies of the same general-purpose subagent in parallel, each given a
different strategy hint (correctness, minimal-diff, edge-case), and keeps the best
result.

**Auto-Harness Best-of-N.**
Replaces the single sequential CI-repair loop with several independent repair attempts and
promotes the highest-scoring workspace.

---

## Efficiency: Waste less

Spend context and memory wisely.

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
