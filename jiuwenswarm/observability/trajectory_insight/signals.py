# Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.

"""Deterministic issue-seed detection over a session read model.

These detectors are cheap and free: they never call an LLM. Their output is a
list of :class:`IssueSeed` records that are (a) shown even when the LLM stage is
disabled and (b) used as corroboration context for the LLM diagnosis pass.
"""

from __future__ import annotations

from collections import Counter
from typing import Iterable

from jiuwenswarm.observability.trajectory_insight.schemas import (
    EventKind,
    IssueSeed,
    SessionReadModel,
)

_MAX_SEEDS = 40
_CONTEXT_OVERFLOW_PCT = 85.0
_TOKEN_SPIKE_FLOOR = 200_000
_RETRY_STORM_THRESHOLD = 3


def detect(read_model: SessionReadModel, *, max_seeds: int = _MAX_SEEDS) -> list[IssueSeed]:
    """Run every deterministic detector and return deduplicated seeds."""
    seeds: list[IssueSeed] = []
    for turn in read_model.turns:
        seeds.extend(_detect_turn(read_model, turn))

    seeds.extend(_detect_cross_turn(read_model))
    deduplicated: list[IssueSeed] = []
    seen: set[tuple[str, str, str | None]] = set()
    for seed in sorted(seeds, key=lambda item: (item.severity, item.turn_index)):
        key = (seed.code, seed.trace_id, seed.span_id)
        if key in seen:
            continue
        seen.add(key)
        deduplicated.append(seed)
        if len(deduplicated) >= max_seeds:
            break
    return deduplicated


def _detect_turn(read_model: SessionReadModel, turn) -> list[IssueSeed]:
    seeds: list[IssueSeed] = []
    for event in turn.events:
        if event.kind in {EventKind.TOOL_RESULT, EventKind.TOOL_CALL} and event.error:
            seeds.append(_seed(
                code="tool_execution_error",
                severity=1,
                title=f"Tool execution failed: {event.tool_name or event.name or 'tool'}",
                evidence=(f"turn {turn.turn_index + 1} · tool={event.tool_name or '?'} · "
                          f"trace={event.trace_id} span={event.span_id} · "
                          f"{_truncate(event.error, 220)}"),
                trace_id=event.trace_id,
                span_id=event.span_id,
                turn_index=turn.turn_index,
                tool_name=event.tool_name,
                subject_id=turn.subject_id,
            ))
        if event.kind == EventKind.LLM_CALL and event.error:
            seeds.append(_seed(
                code="llm_call_error",
                severity=2,
                title="LLM call returned an error",
                evidence=(f"turn {turn.turn_index + 1} · trace={event.trace_id} "
                          f"span={event.span_id} · {_truncate(event.error, 220)}"),
                trace_id=event.trace_id,
                span_id=event.span_id,
                turn_index=turn.turn_index,
                subject_id=turn.subject_id,
            ))

    if turn.tool_calls > 0 and not any(
        seed.code == "tool_execution_error" for seed in seeds
    ) and not turn.has_final_response:
        seeds.append(_seed(
            code="no_final_response",
            severity=2,
            title="Turn ended without a final answer",
            evidence=(f"turn {turn.turn_index + 1} · trace={turn.trace_id} · "
                      f"tool_calls={turn.tool_calls} llm_calls={turn.llm_calls}"),
            trace_id=turn.trace_id,
            span_id=None,
            turn_index=turn.turn_index,
            subject_id=turn.subject_id,
        ))

    if turn.retries >= _RETRY_STORM_THRESHOLD:
        seeds.append(_seed(
            code="retry_storm",
            severity=2,
            title="Turn retried repeatedly",
            evidence=(f"turn {turn.turn_index + 1} · trace={turn.trace_id} · "
                      f"retries={turn.retries}"),
            trace_id=turn.trace_id,
            span_id=None,
            turn_index=turn.turn_index,
            subject_id=turn.subject_id,
        ))

    if turn.context_usage_pct is not None and turn.context_usage_pct >= _CONTEXT_OVERFLOW_PCT:
        seeds.append(_seed(
            code="context_near_overflow",
            severity=2,
            title="Context window near overflow",
            evidence=(f"turn {turn.turn_index + 1} · trace={turn.trace_id} · "
                      f"context_usage={turn.context_usage_pct:.1f}%"),
            trace_id=turn.trace_id,
            span_id=None,
            turn_index=turn.turn_index,
            subject_id=turn.subject_id,
        ))
    return seeds


def _detect_cross_turn(read_model: SessionReadModel) -> list[IssueSeed]:
    """Detect signals that require more than one turn."""
    seeds: list[IssueSeed] = []
    durations = [
        turn.duration_s for turn in read_model.turns if turn.duration_s > 0
    ]
    median_duration = _median(durations)

    tokens = [turn.total_tokens for turn in read_model.turns]
    token_p90 = _percentile(sorted(tokens), 0.90)

    tool_failure_counts: Counter[str] = Counter()
    for turn in read_model.turns:
        for event in turn.events:
            if event.error and event.tool_name:
                tool_failure_counts[event.tool_name] += 1
    for tool_name, count in tool_failure_counts.items():
        if count < 2:
            continue
        turn = next(
            (
                turn for turn in read_model.turns
                if any(event.tool_name == tool_name and event.error for event in turn.events)
            ),
            None,
        )
        if turn is None:
            continue
        event = next(
            event for event in turn.events
            if event.tool_name == tool_name and event.error
        )
        seeds.append(IssueSeed(
            code="repeat_failure_tool",
            severity=2,
            title=f"Tool '{tool_name}' failed in {count} turns",
            evidence=(f"turns with failure={count} · trace={event.trace_id} span={event.span_id}"),
            trace_id=event.trace_id,
            span_id=event.span_id,
            turn_index=turn.turn_index,
            tool_name=tool_name,
            subject_id=turn.subject_id,
        ))

    for turn in read_model.turns:
        if turn.duration_s > 0 and median_duration:
            if turn.duration_s > max(60.0, 5 * median_duration):
                seeds.append(_seed(
                    code="latency_spike",
                    severity=3,
                    title="Turn took unusually long",
                    evidence=(f"turn {turn.turn_index + 1} · trace={turn.trace_id} · "
                              f"duration={turn.duration_s:.1f}s · median={median_duration:.1f}s"),
                    trace_id=turn.trace_id,
                    span_id=None,
                    turn_index=turn.turn_index,
                    subject_id=turn.subject_id,
                ))
        if token_p90 and turn.total_tokens > max(_TOKEN_SPIKE_FLOOR, token_p90):
            seeds.append(_seed(
                code="token_spike",
                severity=3,
                title="Turn consumed a large token budget",
                evidence=(f"turn {turn.turn_index + 1} · trace={turn.trace_id} · "
                          f"tokens={turn.total_tokens} · p90={token_p90:.0f}"),
                trace_id=turn.trace_id,
                span_id=None,
                turn_index=turn.turn_index,
                subject_id=turn.subject_id,
            ))
    return seeds


def _seed(
    code: str,
    severity: int,
    title: str,
    evidence: str,
    trace_id: str,
    span_id: str | None,
    turn_index: int,
    subject_id: str | None,
    tool_name: str | None = None,
) -> IssueSeed:
    return IssueSeed(
        code=code,
        severity=severity,
        title=title,
        evidence=evidence,
        trace_id=trace_id,
        span_id=span_id,
        turn_index=turn_index,
        tool_name=tool_name,
        subject_id=subject_id,
    )


def _truncate(text: str, limit: int) -> str:
    if len(text) <= limit:
        return text
    return f"{text[:limit]}…"


def _median(values: Iterable[float]) -> float | None:
    ordered = sorted(values)
    if not ordered:
        return None
    middle = len(ordered) // 2
    if len(ordered) % 2 == 1:
        return float(ordered[middle])
    return float((ordered[middle - 1] + ordered[middle]) / 2)


def _percentile(values: list[float], fraction: float) -> float | None:
    if not values:
        return None
    index = min(len(values) - 1, int(fraction * len(values)))
    return values[index]
