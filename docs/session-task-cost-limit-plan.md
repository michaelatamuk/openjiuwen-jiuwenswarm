# TUI/Web Session and Task Cost Visibility With `/limit`

## Summary

Add cost aggregation and cost limiting for the current session/task in TUI and Web. Cost exists only when the provider supplies cost fields in metadata. If no provider cost is available, hide cost displays and ignore cost limits. Default cost limit is infinite.

## Key Changes

- Add backend cost accounting alongside existing usage tracking:
  - Aggregate provider-supplied `input_cost`, `output_cost`, and `total_cost` from `llm_usage` / `usage_metadata`.
  - Track totals by `session_id`, `request_id`, and active task/goal id when available.
  - Support both default single-agent mode and swarm/subagent mode by recording main, leader, teammate, and subagent cost deltas into the same session accumulator.
- Add cost availability semantics:
  - A session/task is cost-aware only after at least one usage event includes numeric cost metadata.
  - If cost metadata is missing, `/usage` and Web UI show tokens only.
  - If cost metadata is missing, any configured cost limit is not enforced.
- Add `/usage` cost display:
  - TUI `/usage` shows current session total tokens as today, plus total cost only when cost is available.
  - Include per-model or per-agent cost breakdown where the data exists.
  - Web shows current session/task total cost in the usage/status area, and continues showing per-message cost when available.
- Add `/limit` command for cost limits:
  - `/limit` shows current cost limit and current cost usage if cost is available; otherwise reports cost tracking unavailable.
  - `/limit cost <amount>` sets a cost limit for the current active task if one exists, otherwise for the current session.
  - `/limit session cost <amount>` explicitly sets the current session limit.
  - `/limit task cost <amount>` explicitly sets the current active task/goal limit; if none exists, return a clear error.
  - `/limit clear`, `/limit session clear`, and `/limit task clear` remove configured limits.
  - Default state is no configured cost limit, equivalent to infinite.
- Enforce limits after cost-bearing usage events:
  - Compare cumulative cost against the applicable task limit first, then session limit.
  - On exceed, stop or pause further work for that task/session and emit a user-visible limit-exceeded event.
  - Do not pre-estimate cost before model calls.

## Public Interfaces

- Extend usage summaries with optional cost totals: `input_cost`, `output_cost`, `total_cost`, and cost availability.
- Add session/task limit state with optional `cost_limit`; omitted/null means infinite.
- Add TUI `/limit` command and Web-visible limit state/events.
- Preserve existing token-only behavior and existing `chat.usage_summary` compatibility.

## Test Plan

- Default mode: provider cost metadata appears in `/usage` and Web session totals.
- Swarm mode: leader, teammate, and subagent cost deltas roll into the current session total.
- Missing cost metadata: cost is hidden, `/limit` is not enforced, token usage still works.
- `/limit cost <amount>`: sets active task limit when a task exists, otherwise session limit.
- Explicit `/limit session ...` and `/limit task ...` scope behavior.
- Limit exceeded: work stops/pauses after a cost-bearing usage update and emits a clear event.
- Infinite default: no limit is enforced until user sets one.

## Assumptions

- Provider cost metadata uses `input_cost`, `output_cost`, and `total_cost`.
- Task maps to the active goal/task id when available; otherwise users should use session scope.
- Cost limits are monetary numeric values in the provider's reported currency, with no local currency conversion.
