# Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.

"""Orchestrate deterministic + LLM analysis into a session report."""

from __future__ import annotations

import json
import re
import time
from typing import Any

from jiuwenswarm.trajectory_insight.prompts import build_analysis_prompt, build_retry_prompt
from jiuwenswarm.trajectory_insight.schemas import (
    AnalysisIssue,
    EvolutionSuggestion,
    IssueSeed,
    SessionAnalysisReport,
    SuggestionAction,
    SuggestionKind,
)

_MAX_SEED_LINES = 30
_DEFAULT_MAX_INPUT_CHARS = 8000
_DEFAULT_LANGUAGE = "en"

_SECRET_PATTERNS = [
    re.compile(r"\bsk-[A-Za-z0-9_-]{8,}\b"),
    re.compile(r"\b(Bearer|Authorization)\s+[A-Za-z0-9._~+/=-]{8,}", re.IGNORECASE),
    re.compile(r"\b(api[_-]?key|apikey|token|secret|password)\s*[:=]\s*[^\s,;]{4,}", re.IGNORECASE),
    re.compile(r"\bx-api-key['\"]?\s*[:=]\s*[^\s,;]{4,}", re.IGNORECASE),
]


def redact_secrets(text: str) -> str:
    """Replace common secret-shaped substrings so they never reach an LLM."""
    result = text
    for pattern in _SECRET_PATTERNS:
        result = pattern.sub("<redacted>", result)
    return result


def build_digest(
    read_model,
    seeds: list[IssueSeed],
    *,
    max_input_chars: int = _DEFAULT_MAX_INPUT_CHARS,
) -> str:
    """Render a capped, redacted digest for the diagnosis pass."""
    lines: list[str] = []
    lines.append(f"session_id: {read_model.session_id}")
    lines.append(f"turns: {len(read_model.turns)} ({read_model.turn_count_total} total)"
                 f"{' [truncated]' if read_model.truncated else ''}")

    lines.append("")
    lines.append("DETERMINISTIC FINDINGS:")
    if seeds:
        for seed in seeds[:_MAX_SEED_LINES]:
            lines.append(f"- [{seed.severity}] {seed.code} | {seed.title} | {seed.evidence}")
        if len(seeds) > _MAX_SEED_LINES:
            lines.append(f"- … and {len(seeds) - _MAX_SEED_LINES} more findings")
    else:
        lines.append("- none")

    lines.append("")
    lines.append("PER-TURN TRANSCRIPT:")
    for turn in read_model.turns:
        stats = (
            f"llm={turn.llm_calls} tools={turn.tool_calls} failures={turn.tool_failures} "
            f"tokens={turn.total_tokens} duration={turn.duration_s:.1f}s"
        )
        lines.append(f"--- turn {turn.turn_index} trace={turn.trace_id} {stats} ---")
        user = turn.user_content.strip()
        if user:
            lines.append(f"user: {_shorten(user, 400)}")
        for event in turn.events:
            label = _event_line(event)
            if label:
                lines.append(label)

    digest = "\n".join(lines)
    digest = redact_secrets(digest)
    if len(digest) > max_input_chars:
        digest = digest[:max_input_chars]
        digest += "\n…[digest truncated]"
    return digest


async def analyze_session(
    read_model,
    seeds: list[IssueSeed],
    *,
    model=None,
    language: str = _DEFAULT_LANGUAGE,
    max_input_chars: int = _DEFAULT_MAX_INPUT_CHARS,
) -> SessionAnalysisReport:
    """Produce a structured report.

    When ``model`` is None only deterministic findings are reported (issues carry
    no evolution suggestion). The caller controls model resolution so tests can
    exercise both paths without a live LLM.
    """
    digest = build_digest(read_model, seeds, max_input_chars=max_input_chars)
    issues: list[AnalysisIssue] | None = None
    if model is not None:
        issues = await _run_llm_pass(read_model, digest, model, language=language)
    if issues is None:
        issues = _seeds_to_issues(seeds)
    else:
        # Recorded error statuses are high-precision facts: never let an
        # under-reporting LLM erase a concrete tool/LLM failure.
        issues = _merge_recorded_failures(seeds, issues)
    return SessionAnalysisReport(
        session_id=read_model.session_id,
        analysis_id="",
        fingerprint=read_model.fingerprint,
        analyzed_at=time.time(),
        truncated=read_model.truncated,
        issues=tuple(issues),
    )


async def _run_llm_pass(read_model, digest: str, model, *, language: str) -> list[AnalysisIssue] | None:
    from openjiuwen.core.foundation.llm.schema.message import UserMessage

    prompt = build_analysis_prompt(digest, language=language)
    try:
        response = await model.invoke([UserMessage(content=prompt)], temperature=0.2)
    except Exception:  # noqa: BLE001
        return None
    text = (getattr(response, "content", None) or str(response)).strip()
    parsed = _parse_issue_json(text)
    if parsed is None:
        retry_prompt = build_retry_prompt(digest, text[:2000], language=language)
        try:
            retry = await model.invoke([UserMessage(content=retry_prompt)], temperature=0.0)
        except Exception:  # noqa: BLE001
            return None
        parsed = _parse_issue_json((getattr(retry, "content", None) or str(retry)).strip())
    if parsed is None:
        return None
    return _normalize_issues(read_model, parsed)


def _normalize_issues(read_model, parsed: Any) -> list[AnalysisIssue]:
    items = parsed if isinstance(parsed, list) else []
    issues: list[AnalysisIssue] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        evidence = str(item.get("evidence") or "").strip()
        if not evidence:
            continue
        priority = max(1, min(5, int(item.get("priority") or 3) if str(item.get("priority") or 3).isdigit() else 3))
        evolution = _parse_suggestion(item.get("evolution"))
        issues.append(AnalysisIssue(
            priority=priority,
            title=str(item.get("title") or "Untitled issue")[:120],
            description=str(item.get("description") or ""),
            evidence=evidence,
            impact=str(item.get("impact") or ""),
            root_cause=str(item.get("root_cause") or ""),
            recommendation=str(item.get("recommendation") or ""),
            trace_id=_optional_text(item.get("trace_id")),
            span_id=_optional_text(item.get("span_id")),
            turn_index=_optional_int(item.get("turn_index")),
            subject_id=_optional_text(item.get("subject_id")),
            evolution=evolution,
        ))
    issues.sort(key=lambda issue: issue.priority)
    return issues


def _parse_suggestion(value: Any) -> EvolutionSuggestion | None:
    if not isinstance(value, dict):
        return None
    kind_text = str(value.get("kind") or "none").strip().lower()
    kind = _coerce_kind(kind_text)
    action_text = str(value.get("action") or "review").strip().lower()
    action = _coerce_action(action_text)
    artifacts = value.get("artifacts")
    artifact_list = (
        [dict(item) for item in artifacts if isinstance(item, dict)]
        if isinstance(artifacts, list)
        else []
    )
    return EvolutionSuggestion(
        kind=kind,
        action=action,
        target=_optional_text(value.get("target")),
        section=_optional_text(value.get("section")),
        rationale=str(value.get("rationale") or ""),
        risk=str(value.get("risk") or "unknown"),
        confidence=max(0.0, min(1.0, float(value.get("confidence") or 0.0) if _is_float(value.get("confidence")) else 0.0)),
        artifacts=tuple(artifact_list),
    )


def _seeds_to_issues(seeds: list[IssueSeed]) -> list[AnalysisIssue]:
    return [
        AnalysisIssue(
            priority=seed.severity,
            title=seed.title,
            description=seed.evidence,
            evidence=seed.evidence,
            impact="",
            root_cause="",
            recommendation="",
            trace_id=seed.trace_id,
            span_id=seed.span_id,
            turn_index=seed.turn_index,
            subject_id=seed.subject_id,
            evolution=None,
        )
        for seed in seeds
    ]


_RECORDED_FAILURE_CODES = frozenset({"tool_execution_error", "llm_call_error"})


def _merge_recorded_failures(
    seeds: list[IssueSeed],
    issues: list[AnalysisIssue],
) -> list[AnalysisIssue]:
    """Append deterministic recorded failures the LLM report omitted."""
    merged = list(issues)
    covered: set[tuple[str | None, str | None]] = set()

    def is_covered(seed: IssueSeed) -> bool:
        for issue in merged:
            if issue.trace_id != seed.trace_id:
                continue
            if issue.span_id is None or seed.span_id is None or issue.span_id == seed.span_id:
                return True
        return False

    for seed in seeds:
        if seed.code not in _RECORDED_FAILURE_CODES:
            continue
        key = (seed.trace_id, seed.span_id)
        if key in covered or is_covered(seed):
            covered.add(key)
            continue
        merged.append(
            AnalysisIssue(
                priority=seed.severity,
                title=seed.title,
                description=seed.evidence,
                evidence=seed.evidence,
                impact="",
                root_cause="",
                recommendation="",
                trace_id=seed.trace_id,
                span_id=seed.span_id,
                turn_index=seed.turn_index,
                subject_id=seed.subject_id,
                evolution=None,
            )
        )
        covered.add(key)
    merged.sort(key=lambda issue: issue.priority)
    return merged


def _parse_issue_json(text: str) -> Any:
    if not text:
        return None
    try:
        return json.loads(text)
    except (ValueError, TypeError):
        match = re.search(r"\[[\s\S]*\]", text)
        if match:
            try:
                return json.loads(match.group(0))
            except (ValueError, TypeError):
                return None
    return None


def _event_line(event) -> str | None:
    if event.kind.value == "user_message" or (event.kind.value == "system" and event.role == "user"):
        return f"user: {_shorten(event.text, 300)}"
    if event.kind.value == "llm_call":
        return f"assistant: {_shorten(event.text, 300)}"
    if event.kind.value == "tool_call":
        return f"tool_call {event.tool_name or event.name}: {_shorten(event.text, 200)}"
    if event.kind.value == "tool_result":
        marker = "ERROR" if event.error else "result"
        return f"tool_{marker} {event.tool_name or event.name}: {_shorten(event.error or event.text, 240)}"
    if event.kind.value == "error" or (event.error and event.kind.value == "system"):
        return f"error: {_shorten(event.error or event.text, 240)}"
    if event.error:
        return f"error: {_shorten(event.error, 240)}"
    return None


def _shorten(text: str, limit: int) -> str:
    if len(text) <= limit:
        return text
    return f"{text[:limit]}…"


def _optional_text(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _optional_int(value: Any) -> int | None:
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _is_float(value: Any) -> bool:
    try:
        float(value)
        return True
    except (TypeError, ValueError):
        return False


def _coerce_kind(text: str) -> SuggestionKind:
    try:
        return SuggestionKind(text)
    except ValueError:
        return SuggestionKind.NONE


def _coerce_action(text: str) -> SuggestionAction:
    try:
        return SuggestionAction(text)
    except ValueError:
        return SuggestionAction.REVIEW
