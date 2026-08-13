# Research-Flow Improvement Plan

## Analysed prompt

This document is the analysis of a single prompt sent to JiuwenSwarm:

> [Tasks work: destinations]
>
> You are a travel destination expert. Given the traveler context, suggest 2 destinations. Return ONLY a JSON array, no markdown. Each object: { "name": string, "country": string, "description": string (2 sentences), "matchScore": number 0-100, "budgetScore": number 0-100, "weatherScore": number 0-100, "estFlightCost": number, "estHotelPerNight": number, "highlights": [3 strings] }. Use web search to find current real pricing and weather data for the requested dates.
>
> ---
>
> Traveler Profile: 1 adults, 1 children (ages: 5). Special needs: none. Departing from: Paris.
> Budget: 2000 USD ($) total. Dates: 2026-06-01 to 2026-06-03. Flexibility: ±1 week.
> Preferences: Interests: Culture, Food. Style: Mid-range comfort. Priority: Best experience.

The run returned this final result (2 destinations):

```json
[{"name":"Rome","country":"Italy","description":"Rome pairs world-class ancient history with some of the best family-friendly food in Europe — think gladiator tours at the Colosseum and endless gelato in Trastevere. Early June brings dry, sunny weather around 29°C, ideal for sightseeing with a 5-year-old, and direct low-cost flights from Paris keep it comfortably inside a 2000 USD budget.","matchScore":92,"budgetScore":86,"weatherScore":94,"estFlightCost":300,"estHotelPerNight":200,"highlights":["Colosseum gladiator kids' tour and Roman Forum","Gelato crawl, Trevi Fountain coin toss, and Trastevere food stroll","St. Peter's Basilica and Vatican awe factor"]},{"name":"Barcelona","country":"Spain","description":"Barcelona blends Gaudí's colorful architecture with relaxed tapas-and-churros dining, plus a sandy beach right in the city for easy downtime. June weather is sunny and warm (26°C highs), and short Vueling/Air France flights plus mid-range hotels fit the 2000 USD total with room to spare.","matchScore":88,"budgetScore":85,"weatherScore":91,"estFlightCost":270,"estHotelPerNight":210,"highlights":["Sagrada Família towers and Park Güell mosaic terraces","Barceloneta beach and hands-on CosmoCaixa science museum","Gothic Quarter wandering with churros and tapas"]}]
```

**What happened under the hood** (main events during the run):

- The orchestrator delegated to two parallel general-purpose subagents, one per candidate
  city (Rome, Barcelona).
- Both loaded the `ddg-search` skill, but the search script returned "No results found"
  six or more times; each subagent independently re-debugged it before switching to direct
  page fetches.
- Most direct fetches were blocked (HTTP 403): DuckDuckGo html/lite, weatherspark, Brave,
  Mojeek, Startpage; the OTAs (Skyscanner, Google Flights, Kayak, Booking.com, Expedia,
  hotels.com) returned empty content or generic landing pages.
- Some pages returned HTTP 200 with wrong content — Kayak showed "Canutillo" hotels,
  Trip.com showed "Tongling" hotels (a city in China) for Barcelona queries.
- Working sources were eventually found (holiday-weather.com, budgetyourtrip.com,
  rome2rio.com); live flight/hotel prices were never obtained.
- Both subagents finished with estimated prices and prose caveats, yet the orchestrator
  still packaged them as concrete `estFlightCost` / `estHotelPerNight` values with no
  confidence marking.
- Each subagent's context grew to ~54k / ~61k tokens over 13 / 16 turns, with late turns
  taking 15–18s.

The failures above are generic — they apply to any long research loop (web search,
price/product data, news monitoring, literature review, competitor research, and so on),
not just travel. Weather/flights are used in this document only as a worked example. The
rest of the document analyses these failures and proposes fixes.

## Problems identified (generic)

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

---

## Proposed solutions

The items below are suggestions for solutions to the problems above. Each item covers the
evidence from the trace, the problem, the technical solution (split by repo), and the
expected result. They can be adopted independently or together.

---

## Item 1 — Source-health registry

### Evidence (from the logs)
- `ddg-search` skill returned "No results found." **six or more times** across both
  subagents: subagent 1 turns 2–3, subagent 2 turns 2–4, all `Exit Code: 0`.
- Both subagents separately re-hit the same blocked endpoints with different URLs:
  `html.duckduckgo.com` (HTTP 403), `lite.duckduckgo.com` (HTTP 403), `weatherspark`
  (HTTP 403), `search.brave.com` (403), `mojeek.com` (403), `startpage` (blocked),
  `hotels.com`/`expedia` (blocked), `tripadvisor` (403).
- One dead-end fetch (`search.marcia.cc`) cost **15.9s** and ended in `getaddrinfo failed`.
- The identical failure arc (broken search → debug script → switch to direct fetch) was
  re-discovered independently by both agents.

### Problem
Broken tools and unusable sources are discovered repeatedly, including independently
across parallel workers. Agents burn identical turns re-confirming that a search skill
returns nothing, re-hitting blocked endpoints, and re-fetching low-value aggregators with
slightly different URLs.

### Technical Solution
**agent-core:**

- Create a process-global `SourceHealthStore` (a shared singleton injected into rails, like
  `reliability_components` on the team side). Each entry is keyed by
  `(tool_name, url_domain)` for fetch tools and `(tool, query_signature)` for search tools,
  and stores `{outcome, latency, timestamp, fail_count}`.
- Add a `SourceHealthRail` (priority ~75) with two hooks:
  - `after_tool_call` — classify every tool result and write it to the store. Empty search
    output, HTTP 403/429, `[empty]` content, and 200-with-wrong-location each become a
    typed entry (`ok / empty / http_403 / blocked / low_signal / garbage`).
  - `before_tool_call` — look up the tool/domain in the store. If it is flagged dead (e.g.
    `fail_count >= 2`), do one of:
    - rewrite the call's args to skip the dead source (e.g. drop a blocked URL), or
    - inject a steering directive into the prompt: "this source returned 403 earlier; use
      an alternative", or
    - hard-block the call after a configurable threshold.
- Make the store and rail apply to subagents as well as the main agent, so a failure
  recorded by one subagent immediately steers the other.

**jiuwenswarm:**

- Expose the store's per-skill aggregates to the SkillTend lifecycle so a skill that
  consistently fails (e.g. `ddg-search`) is flagged STALE / retired at the library level.

### Expected Result
The first failure in any worker blocks or steers the same call in all other workers. In the
analysed trace this removes ~10–12 redundant tool calls (including the repeated 403 hits and
the 15.9s dead-end fetch), cutting wasted turns and wall-clock with no change to the model
prompt.

---

## Item 2 — Content-validity verdict

### Evidence (from the logs)
- Kayak returned **"16 Best Hotels in Canutillo"** (a town in Texas) for a Barcelona query
  — `Status: 200`.
- Trip.com returned **"Tongling Hotels"** (a city in China) for a Barcelona query —
  `Status: 200`.
- Skyscanner and Google Flights returned `Content: [empty]` with `Status: 200` (subagent 1
  turn 8, subagent 2 turn 7).
- Google Search returned a Hebrew error/captcha page; Bing repeatedly returned "FC
  Barcelona" club noise for price queries.
- Both subagents' final reports admitted the data was approximate in prose ("Live fares on
  Google Flights/Kayak/Skyscanner couldn't be fetched", "blocked automated access
  (captcha), so I used accessible alternatives") — yet the orchestrator packaged the
  results into a clean recommendation with no structured confidence marking.

### Problem
Pages that return HTTP 200 but unrelated, empty, or JS-shell content are treated as
evidence (e.g. hotel pages for the wrong city, `[empty]` flight results). This pollutes
context and produces reports that silently mix real and garbage data.

### Technical Solution
**agent-core:**

- In `WebFetchWebpageTool.invoke`, after the page text is extracted, run a classification
  pass that assigns a verdict to the result:
  - **Entity mismatch** — compare the query terms (city, route, airline, product) against
    the page title and first content blocks; no overlap → `UNRELATED` (catches "Barcelona"
    query vs. "Canutillo"/"Tongling" page).
  - **Empty content** — extracted text is `[empty]` or below a minimum length → `EMPTY`
    (catches Skyscanner/Google Flights).
  - **Generic landing page** — known markers like "Compare 100s of travel sites", "Save
    when you compare", "Find the right flight from 100s of sites" → `LANDING`.
  - Ambiguous cases only → one `llm_judge` call: "does this page contain the requested
    entity and type of data?" → `RELEVANT` / `UNRELATED`.
- Prepend the verdict to the returned tool text, e.g.
  `Content quality: UNRELATED — ignore`, so the model sees it directly.
- Write the verdict into the Item 1 `SourceHealthStore` so the same domain is not fetched
  again.
- Add a `confidence` field to the agent's final structured report (real / estimated /
  unverified per data point) so the orchestrator can weigh the answer instead of reading
  prose caveats.

### Expected Result
Unrelated/empty pages either don't enter context or enter explicitly marked as worthless;
the final report carries a structured confidence marker per data point instead of prose
caveats. Context gets less polluted and answers are more truthful about data provenance.

---

## Item 3 — Context compaction for research loops

### Evidence (from the logs)
- Subagent 1 input tokens grew **16,654 → 54,066** over 13 turns; subagent 2 grew
  **16,673 → 61,220** over 16 turns. Cached-prefix tokens grew in lockstep (up to 44k/53k).
- The full task description (identical every turn) plus every prior fetch body was
  re-sent on each call.
- Late turns got slow: subagent 1 turn 13 = **17.9s**, subagent 2 turn 16 = **15.9s**,
  turns 11–12 = 8.6–9.5s — roughly 2× the 4–6s of early turns.

### Problem
Input tokens grow monotonically with each turn (observed 16k → 61k) and late turns get
slow, because full history — repeated identical task descriptions and full fetch bodies —
is re-sent every call. This inflates cost and can hit the context limit on long runs.

### Technical Solution
**agent-core:**

- Add a `ContextCompactionRail` (DeepAgentRail) hooked on
  `AFTER_REACT_ITERATION`/`AFTER_TASK_ITERATION`.
- After each iteration, estimate the token size of the current message history (from
  `usage_metadata` per call). While the history exceeds a configurable threshold (e.g. 60%
  of the model's context window):
  - take the oldest full `fetch_webpage` / `bash` transcript and replace it with a
    one-sentence extracted-facts summary (reusing the `rule_compression` pipeline);
  - if summaries are already in place, drop the oldest non-essential messages;
  - always keep the last N turns verbatim.
- Track how many bytes/tokens were removed and expose it as
  `context.compacted_bytes` (feeds Item 7).
- Add a headroom guard that, based on current fill ratio, injects a conciseness directive
  into the prompt at 60% fill and a critical-brevity directive at 80% (the Cortex "Context
  Headroom Guard").

### Expected Result
Token usage and latency scale with actual new evidence, not with run length. Late-turn
slowness (17.9s/15.9s) disappears, cost drops roughly in proportion to the stale tool
output removed, and long research loops stop hitting the context limit.

---

## Item 4 — Progress-based stop (diminishing-returns gate)

### Evidence (from the logs)
- Subagent 1 said at turn 11: **"I have solid weather and hotel data. Let me make a few
  more targeted attempts for flight prices"** — then ran two more turns (12–13) chasing
  live fares that were never obtainable.
- Subagent 2 ran **16 turns** and kept searching after it had already gathered weather and
  hotel data; its final report said "I have enough data" only at turn 16.
- Combined: 29 LLM turns for a "suggest 2 destinations" task.

### Problem
Research continues after enough evidence has been gathered. The existing evaluator chain
(`MaxRoundsEvaluator`, `TimeoutEvaluator`, `CompletionPromiseEvaluator`) doesn't fire for
research loops that keep producing *some* output, so agents run far past the point of
diminishing returns.

### Technical Solution
**agent-core:**

- Add a `DiminishingReturnsEvaluator` class to `schema/stop_condition.py` and append it to
  the `TaskCompletionRail` evaluator chain (alongside `MaxRoundsEvaluator`,
  `TimeoutEvaluator`, `CompletionPromiseEvaluator`).
- Implement the evaluator's bookkeeping per turn:
  - count *novel evidence*: distinct facts extracted in this turn, or at least one
    successful non-empty tool result;
  - maintain a rolling counter of consecutive turns with zero novel evidence.
- Wire it to the loop via a `ProgressBudgetRail`:
  - when N consecutive turns (default 3) add no new evidence, call `ctx.push_steering`
    with a "synthesize best-effort now" directive;
  - when a second threshold is reached with still no progress, call
    `ctx.request_force_finish` so the agent returns a structured best-effort report instead
    of looping.
- Make N and the force-finish cap configurable (env/config) so they can be tuned with Item
  7 metrics.

### Expected Result
Runs converge to ~one-third fewer turns (e.g. 16 → ~10, 13 → ~9), cutting wall-clock and
tokens ~30–40%, and the orchestrator always receives a best-effort answer instead of a hung
loop. Thresholds (N, force-finish cap) are configurable and tuned from Item 7 metrics.

---

## Item 5 — Anti-loiter / narration suppression

### Evidence (from the logs)
- Repetitive narration turns that produced no new evidence:
  - Subagent 1 turn 3: "The search script returned no results — let me retry with simpler
    queries" (followed by two more empty searches).
  - Subagent 2 turn 3: "The search returned no results. Let me try simpler queries" (same
    pattern).
  - Subagent 1 turn 9: "The flight aggregators rendered generic pages without live fares.
    Let me try more targeted queries".
  - Subagent 2 turn 9: "Still blocked on the big OTAs. Let me try more accessible search
    engines".
- Output tokens per turn were mostly 300–500 — mostly commentary announcing intent, with
  the actual evidence concentrated in the tool results.

### Problem
Many turns are narration rather than action: the model announces intent ("let me try X",
"Bing gave generic results") without producing new evidence, which looks like progress to a
turn-count-based loop but adds nothing.

### Technical Solution
**agent-core:**

- In `ProgressBudgetRail`, after each turn classify it as *narration-only* when BOTH:
  - the model output makes no tool calls, or its tool calls return nothing new, AND
  - the output text looks like intent rather than evidence (heuristic: starts with "Let me
    ...", contains "try/trying", "I'll attempt", "Let's see"; or contains no concrete
    numbers/facts/entity references).
- When a narration-only turn is detected, inject an "act or synthesize" steering directive
  (`ctx.push_steering`) telling the model to run a concrete tool or start the final
  synthesis.
- If narration-only turns persist (configurable count), escalate to the same
  `request_force_finish` path as Item 4.

### Expected Result
The signal-to-noise ratio of the transcript rises; turns that would have been pure
commentary are either converted into action or skipped. This compounds with Item 4's
turn-count reduction.

---

## Item 6 — Data-acquisition planning

### Evidence (from the logs)
- Both subagents received the same task template demanding **"REAL, CURRENT (2025/2026)
  pricing and weather data"** — the identical framing that pushed both into the same
  scraper fight.
- Every live-fare source was bot-hostile: Skyscanner (`[empty]`), Google Flights
  (`[empty]`), Kayak (redirect → generic landing), Booking.com (blocked), Expedia
  (blocked), hotels.com (blocked).
- The June weather the subagents spent multiple turns scraping is climatological average
  data — available from a single static page, yet it consumed repeated 403-wrangling and
  multiple fallback searches in both subagents.

### Problem
Prompts that demand "real, current, live" values from bot-hostile sources push the agent
into an unwinnable scrape that consumes most of the runtime; the orchestrator also never
tells the subagent what precision is actually needed.

### Technical Solution
**agent-core:**

- Add a `research_planning` prompt section (new file under `harness/prompts/sections/`)
  that is attached to research subagent spawns (in `TaskTool` prompt assembly, or via a
  rail on `run_kind == research`). The section instructs the agent to:
  - classify each requested data point as *static* (one call to a known source, then move
    on) vs. *dynamic/live* (one attempt per sanctioned source, then switch to estimates
    with explicit confidence labels);
  - never retry a 403/blocked source; mark it blocked once and move on.
- Add a feasibility check in `TaskTool.invoke` that scans the `task_description` for
  trigger words ("real", "current", "live", "price", "availability") and, when found,
  attaches the research_planning section plus a precision note telling the subagent what
  accuracy the orchestrator actually needs.

**jiuwenswarm:**

- Create per-domain plan templates (a curated static-source list and a sanctioned
  dynamic-source list per domain, e.g. travel, finance, news) and pass them into subagent
  spawns so the section references real, working sources instead of generic advice.

### Expected Result
Unwinnable subgoals are recognised up front; the flow becomes "gather good-enough data in a
handful of turns, label confidence" instead of "fight every captcha". Data-gathering effort
matches the precision actually required by the orchestrator.

---

## Item 7 — Decision metrics (do this first)

### Evidence (from the logs)
- The trace contained only raw telemetry (tokens in/out, cache hits, latency per call).
- There were **no structured counters** for the problems above — "blocked", "garbage",
  "empty", "loitering turn", "novel evidence per turn", "stopped because X" had to be
  inferred by manually reading the log.

### Problem
There is no structured signal telling the team *why* a run was long or where the waste was,
so thresholds and budgets are tuned by guesswork and improvements can't be measured.

### Technical Solution
**agent-core:**

- In each new rail (Items 1–5), record one span event/counter at the point of decision:
  `source.blocked`, `source.garbage`, `turn.loitering`, `turn.novel_evidence`,
  `context.compacted_bytes`, `stopped.reason`. Emit them through the existing tracer/OTel
  span mechanism (the same path used by Agent-Core OTel).

**jiuwenswarm:**

- Add queries/dashboards over these events in Langfuse (or the OTel backend) and surface
  them as a new dimension in TraceHound, so a run's blocked/loitering/compacted behaviour
  is visible per session without reading raw logs.

### Expected Result
Before/after of every item is measurable from real runs; thresholds (N turns, fill ratios,
retry budgets) are tuned from data instead of guesses.
