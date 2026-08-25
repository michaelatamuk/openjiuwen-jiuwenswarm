# TeamPulse — Overlap Assessment vs. OpenJiuwen Developments

> Purpose: record the analysis of how the proposed **TeamPulse** runtime module
> overlaps with work already developed in this repo. Sources reviewed:
> `docs-michael/openjiuwen-cortex.md` and the issues under `docs-michael/issues/`.
>
> Date: 2026-08-25. Author: analysis session.

---

## The TeamPulse proposal (what it claims)

> A lightweight runtime module within JiuwenSwarm Team Mode. It observes the existing
> Task lifecycle, team communication, tool execution, and workspace outputs to maintain
> a **live coordination map** for the active Team. It identifies **cross-event mismatches**
> that create extra turns (unresolved Tasks after report delivery, failed Task references
> or handoffs, repeated operations without progress), and uses existing Team Mode
> interfaces for **bounded recovery** or provides the responsible Team Leader/Teammate
> with a concise, evidence-based correction in the next native turn. The map can appear
> in the frontend as a **mind-map style Team Pulse view**. (Frontend scope has passed RAT.)

---

## Bottom line

**Substantial overlap, but not a duplicate.** TeamPulse is best understood as a
**composition / correlation layer** built on top of primitives the OpenJiuwen team already
owns — not as net-new low-level infrastructure. Its genuinely new contribution is a thin
**cross-event correlation engine** plus a **persistent live coordination map** that turns
existing point signals into coordination-level insights and corrections.

---

## Direct overlap (already implemented)

| TeamPulse element | OpenJiuwen equivalent | Source |
|---|---|---|
| **Live coordination map input** — observe task lifecycle, tools, outputs | Real-time team observability: full `team → agent.task_iteration → llm.call / tool.*` span hierarchy; ordered trajectory events; per-task multi-agent contribution aggregation | cortex §Observability (Agent-Core OTel) |
| **Live per-worker activity** | `AGENT_ACTIVITY` progress events (`SwarmflowActivityRail`) → `team.member.activity_changed`; live per-worker view | issues `agent-core/0748`, `jiuwenswarm/2578` |
| **Mind-map "Team Pulse" view** | Existing **Swarm Map** web UI (the proposed Pulse view is an enhancement of it) | issues `0748`, `2578` |
| **Repeated operations without progress** | Loop-prevention rails: `FailureMemoryRail`, `StepBackRail`, `Verifier Circuit Breaker`, `Tool Call Dedup Cache`, Anti-Repetition Prompt, ATM `ToolRepairRail` | cortex §Execution Control & Loop Prevention; issues `0396`, `0399`, `0409`, `0372` |
| **Evidence-based correction to Teammate in next turn** | Team Verification Layer `auto_rework` — returns task to originating agent with reviewer feedback | cortex §Team Verification; issues `0123`, `0121` |
| **Unresolved task after report delivery** | Team Verification `NEEDS_REWORK`/`FAIL` verdicts on `TASK_COMPLETED`; ATM topology mutation / role-entropy handling | cortex §Team Verification, §Multi-Agent Safety |
| **Bounded recovery** | ATM `OBSERVE_ONLY` default + commit/rollback on live mutation | cortex §ATM Algorithm 3 |

---

## What is genuinely new in TeamPulse (the incremental build)

1. **Cross-event correlation** — the current rails each watch a *single* signal
   (tool exit codes, verifier fingerprints, task-completion scores). TeamPulse correlates
   **across event streams** (task lifecycle × team communication × tool execution ×
   workspace outputs) to find mismatches such as:
   - task closed as done, but its handoff reference failed;
   - report delivered, yet the underlying task is still unresolved;
   - stale or duplicated task references producing extra turns.
   No existing issue implements this cross-signal correlation.

2. **A persistent coordination map as a first-class artifact** — an aggregated team-state
   model maintained over time, distinct from point-in-time OTel spans or ephemeral
   streamed activity events.

3. **Generalized mismatch-driven correction** — Team Verification is *quality-gated
   rework* (score-based); TeamPulse generalizes to *coordination mismatches* (stale
   references, double-turns, stalled handoffs), not just output scoring.

---

## Recommended framing (for communicating to the other team)

> "We already own the raw infrastructure TeamPulse needs — real-time team observability
> (OTel + swarmflow activity), loop/failure-detection rails, and a team verification layer
> with auto-rework — plus a Swarm Map frontend. TeamPulse's distinctive value is the thin
> **cross-event correlation** layer that turns those point signals into a persistent live
> coordination map and derives bounded corrections from mismatches. So it **composes with
> what we've built rather than duplicating it**; the incremental build is mostly the
> correlation engine and mapping existing events into the pulse view."

---

## Suggested next step before relying on this

Confirm the implemented state (not just docs) of the closest overlaps in the codebase:
- Team Verification `auto_rework` and `block_on_fail` behaviour;
- Verifier Circuit Breaker escalation logic;
- Whether the Swarm Map UI already aggregates per-worker activity into a map (vs. a flat
  activity list).
