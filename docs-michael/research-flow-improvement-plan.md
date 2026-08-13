# Research-Flow Improvement Plan

## Context

A single-prompt run of JiuwenSwarm produced a long, repetitive research flow: the
orchestrator delegated to parallel `general-purpose` subagents that spent most of their
budget re-discovering broken tools and blocked sources, re-fetching garbage pages, and
continuing past the point of enough data.

The concrete case analysed was travel destination research (two candidate cities, weather
and live pricing) — but the failure modes are generic and apply to any long research loop:
web search, price/product data, news monitoring, literature review, competitor research,
and so on. Weather/flights are used below only as a worked example.

## Generic symptoms (not specific to travel)

1. **No shared state across parallel workers** — subagents independently re-discover the
   same broken skill and the same blocked/unusable sources, wasting identical turns.
2. **No fail-fast / circuit breaker** on broken tools and sources that return blocked,
   empty, or wrong content.
3. **No stopping criterion / over-persistence** — research continues after enough evidence
   has been gathered.
4. **Unbounded context growth** with no compaction (observed 16k → 61k tokens), slowing
   late turns and inflating cost.
5. **No content-quality validation** — pages that return HTTP 200 but unrelated or empty
   content are treated as evidence.
6. **Unwinnable subgoals** — the prompt demands "real/current/live" values from
   bot-hostile sources, so the agent fights captchas and JS shells for most of the run
   instead of gathering good-enough data and labelling confidence.
7. **Narration-heavy turns** — the model announces intent ("let me try X") without
   producing new evidence.

## Plan overview

| # | Work item | Where it lives | Fixes |
|---|---|---|---|
| 1 | Source-health registry + rail (fail-fast on dead tools/sources) | new `harness/rails/source_health_rail.py` | duplicated failure discovery, re-hitting 403/empty/garbage sites |
| 2 | Content-validity verdict (200-but-wrong detection) | `fetch_webpage` output + `after_tool_call` rail | unrelated/empty pages treated as data |
| 3 | Context compaction for research loops | new `harness/rails/context_compaction_rail.py` + existing `rule_compression` offloader | unbounded token growth, late-turn latency, cost |
| 4 | Progress-based stop (diminishing-returns gate) | new evaluator in `schema/stop_condition.py` + `TaskCompletionRail` | over-persistence past the point of enough data |
| 5 | Anti-loiter / narration suppression | new `harness/rails/progress_budget_rail.py` | "let me try X" turns with no new signal |
| 6 | Research pre-flight plan for subagents | new prompt section + `TaskTool`/subagent prompt assembly | unwinnable "real/live data" chases |
| 7 | (Phase 0) decision metrics in OTel spans | `harness/rails/*` span events | measuring before/after; tuning thresholds |

---

## Item 1 — Source-health registry (biggest ROI)

**What:** A process-global store (like `reliability_components` on the team side — a shared
singleton injected into rails) keyed by `(tool_name, url_domain)` and, for search,
`(tool, query_signature)`. Each entry records outcome: `ok / empty / http_403 / blocked /
low_signal / garbage`, plus latency.

Two consumers, both in one `SourceHealthRail` (priority ~75):

- `after_tool_call` — classify the result and write it back. Empty search results, 403s,
  `[empty]` content, or 200-with-wrong-location → all become typed registry entries.
- `before_tool_call` — if a tool/domain is already flagged dead for this session's
  pattern, either rewrite the args to skip it or inject a steering directive
  ("this source returned 403 earlier; use an alternative"). Optionally hard-block after a
  configurable threshold.

**Example from the analysed case:** both subagents independently spent turns discovering a
search skill returned "No results found", then separately re-hit the same blocked search
endpoints and re-fetched the same low-value aggregators with different URLs. A shared
registry means the *first* failure in either worker blocks or steers the same call in the
other — removing ~10–12 redundant tool calls in that single trace.

---

## Item 2 — Content-validity verdict

**What:** An `after_tool_call` rail (or direct extension of `WebFetchWebpageTool.invoke`)
that stamps every fetched page with a quality verdict:

- cheap heuristics first: title/URL entity mismatch (query says "Barcelona", page is
  "Tongling"/"Canutillo"), empty extracted text, generic-landing-page markers, redirect to
  an unrelated domain;
- ambiguous cases only → one `llm_judge` call: "does this page contain the requested entity
  and type of data?";
- verdict appended to the tool result text (so the model sees
  `Content quality: UNRELATED — ignore`) and fed to the registry from Item 1.

**Why it matters:** Unrelated, empty, or JS-shell pages regularly return `Status: 200` and
are treated as evidence. With a verdict, those pages either don't enter the context or
enter explicitly marked as worthless, and the final report carries a confidence marker on
each data point (the agent's own final text often admits data could not be verified — that
should be a *structured* field, not prose).

---

## Item 3 — Context compaction for research loops

**What:** A `ContextCompactionRail` (DeepAgentRail) that runs on
`AFTER_REACT_ITERATION`/`AFTER_TASK_ITERATION` and, once the context exceeds a threshold,
rewrites the message history: old large fetch/bash transcripts get replaced by a short
extracted-facts summary (or dropped), recent turns stay verbatim. Reuse the existing
`core/context_engine/processor/forked/offloader/rule_compression` pipeline rather than
building a new compressor. Add a headroom guard (inject conciseness at 60% fill, brevity at
80%) — the Cortex "Context Headroom Guard" concept, currently not active for these
subagents.

**Why it matters:** Input tokens grow monotonically with each turn (observed 16k → 61k) and
late turns get slow, because full history — including repeated identical task descriptions
and full fetch bodies — is re-sent every call. Compaction cuts latency and cost roughly in
proportion to how much of the window is stale tool output, and prevents hard context-limit
failures on long runs.

---

## Item 4 + 5 — Progress gate and anti-loiter (can be one rail)

**What:** Add a `DiminishingReturnsEvaluator` to the `TaskCompletionRail` evaluator chain
(which today only has `MaxRoundsEvaluator`, `TimeoutEvaluator`, `CompletionPromiseEvaluator`
— none of which fire for a research loop that keeps producing *some* output, hence the
long runs). New evaluator + a `ProgressBudgetRail`:

- track per-turn *novel evidence*: distinct facts extracted, or at least one successful
  non-empty tool result;
- if **N consecutive turns produce no new evidence**, push a "synthesize best-effort now"
  steering directive (`ctx.push_steering`);
- if still no progress, force finish (`ctx.request_force_finish`) with a structured
  best-effort report.
- also detect *narration-only* turns (model announces intent, tool results add nothing) and
  suppress with a "act or synthesize" instruction.

**Why it matters:** Agents commonly announce "I have enough data" and then continue chasing
an unfetchable remaining subgoal for several turns. A progress gate converts those runs to
roughly a third fewer turns, cutting wall-clock and tokens ~30–40%, and guarantees the
orchestrator receives a best-effort answer instead of a hung loop.

---

## Item 6 — Research pre-flight plan

**What:** Two-part: (a) a `research_planning` prompt section attached to research subagent
spawns (in `TaskTool` prompt assembly or a rail on `run_kind == research`), and (b) a small
feasibility check before delegating in `TaskTool`.

The plan template explicitly sequences the work and classifies data by how it should be
gathered:

- *static/derivable data* (climate averages, well-known facts) → exactly one call to a known
  source, done;
- *dynamic/live data* (real-time prices, stock, availability) → one attempt per sanctioned
  source, then **immediately** switch to estimates with explicit confidence labels;
- any 403/blocked source → mark blocked once, never retry.

**Why it matters:** Prompts that demand "real, current, live" values from bot-hostile
sources push the agent into an unwinnable scrape that consumes most of the runtime. The
pre-flight also lets the *orchestrator* tell the subagent what precision it actually needs
(an estimate with a confidence label is usually fine). This turns the flow from "fight every
captcha" into "gather good-enough data in a handful of turns, label confidence."

---

## Item 7 — Decision metrics (do this first, it's small)

**What:** Emit span events / counters from the new rails: `source.blocked`,
`source.garbage`, `turn.loitering`, `turn.novel_evidence`, `context.compacted_bytes`,
`stopped.reason`. The trace log already has the raw telemetry; these become structured
signals that (a) let you measure before/after per item, and (b) let you tune thresholds
(N turns, fill ratios, retry budgets) from real data instead of guesses.

---

## Suggested sequencing

1. **Item 7** (instrumentation) — establish the baseline. ½ day.
2. **Items 1+2** (source health + content verdict) — the single biggest reduction in
   wasted turns, and reusable across every research/coding agent. 2–3 days.
3. **Item 3** (compaction) — cost/latency wins on all long loops. 2 days.
4. **Items 4+5** (stop + anti-loiter) — turn-count and wall-clock control. 2 days.
5. **Item 6** (research pre-flight) — prevents the whole class of unwinnable-chase tasks.
   1–2 days.

## Benchmarking

Pick a small set of representative research prompts across different domains (not just the
original example). For each, record: turn count, total tokens, wall-clock, and the number
of "blocked/empty/garbage" fetches accepted. Use the same prompts to measure before/after
for every item.
