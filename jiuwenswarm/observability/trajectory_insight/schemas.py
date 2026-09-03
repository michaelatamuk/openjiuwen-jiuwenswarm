# Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.

"""Typed data structures shared by the trajectory analysis pipeline.

The analysis pipeline materializes the persisted OTLP trajectory of one session
into a compact read model (see ``readmodel.py``), extracts deterministic issue
seeds (see ``signals.py``), produces a structured report (see ``analyzer.py``)
and maps findings to evolution suggestions (see ``evolution.py``).

All objects in this module are immutable dataclasses so stages can be reasoned
about and unit tested in isolation.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class EventKind(str, Enum):
    """Coarse kinds a normalized span is classified into."""

    USER_MESSAGE = "user_message"
    LLM_CALL = "llm_call"
    TOOL_CALL = "tool_call"
    TOOL_RESULT = "tool_result"
    SYSTEM = "system"
    ERROR = "error"


class SuggestionKind(str, Enum):
    """Optimizable surfaces the evolution stage understands."""

    SKILL = "skill"
    PROMPT = "prompt"
    TOOL = "tool"
    RAIL = "rail"
    CONFIG = "config"
    NONE = "none"


class SuggestionAction(str, Enum):
    """Operations an evolution suggestion requests."""

    ADD = "add"
    MODIFY = "modify"
    REMOVE = "remove"
    REVIEW = "review"


class ApplyStatus(str, Enum):
    """Lifecycle of a human-approved apply attempt."""

    PENDING = "pending"
    PREVIEWED = "previewed"
    VERIFYING = "verifying"
    APPLIED = "applied"
    REJECTED = "rejected"
    FAILED = "failed"


@dataclass(frozen=True)
class TrajectoryUsage:
    """Token usage compatible with the trajectory UI usage shape."""

    input_tokens: int = 0
    output_tokens: int = 0
    cache_read_tokens: int = 0
    cache_write_tokens: int = 0
    reasoning_tokens: int = 0
    total_tokens: int = 0


@dataclass(frozen=True)
class TrajectoryEvent:
    """One normalized span event inside a turn."""

    seq: int
    kind: EventKind
    trace_id: str
    span_id: str
    parent_span_id: str | None
    ts_ns: int
    name: str | None = None
    role: str | None = None
    text: str = ""
    tool_name: str | None = None
    tool_call_id: str | None = None
    error: str | None = None
    error_type: str | None = None
    status: str | None = None
    model: str | None = None
    usage: TrajectoryUsage | None = None
    latency_ms: float | None = None
    subject_id: str | None = None
    agent: str | None = None
    retry_count: int = 0


@dataclass(frozen=True)
class TrajectoryTurn:
    """One user-turn of a session with its aggregates."""

    turn_index: int
    trace_id: str
    request_id: str | None
    start_ns: int
    end_ns: int | None
    user_content: str
    events: tuple[TrajectoryEvent, ...]
    llm_calls: int = 0
    tool_calls: int = 0
    tool_failures: int = 0
    retries: int = 0
    has_final_response: bool = False
    has_error: bool = False
    total_tokens: int = 0
    duration_s: float = 0.0
    context_usage_pct: float | None = None
    subject_id: str | None = None
    agent: str | None = None

    @property
    def tool_names(self) -> list[str]:
        """Return distinct tool names observed in this turn."""
        names: list[str] = []
        seen: set[str] = set()
        for event in self.events:
            name = event.tool_name
            if name and name not in seen:
                seen.add(name)
                names.append(name)
        return names


@dataclass(frozen=True)
class SessionReadModel:
    """Normalized view of one session used by the analysis stages."""

    session_id: str
    fingerprint: str
    truncated: bool
    subject_id: str | None
    turns: tuple[TrajectoryTurn, ...]
    turn_count_total: int
    skipped_malformed_records: int = 0

    @property
    def all_events(self) -> tuple[TrajectoryEvent, ...]:
        """Flattened events across all retained turns."""
        return tuple(event for turn in self.turns for event in turn.events)


@dataclass(frozen=True)
class IssueSeed:
    """Deterministic finding that is fed into the LLM stage."""

    code: str
    severity: int
    title: str
    evidence: str
    trace_id: str
    span_id: str | None
    turn_index: int
    tool_name: str | None = None
    subject_id: str | None = None


@dataclass(frozen=True)
class EvolutionSuggestion:
    """Structured suggestion that maps a finding to an optimizable surface."""

    kind: SuggestionKind
    action: SuggestionAction
    target: str | None
    rationale: str
    risk: str
    confidence: float
    section: str | None = None
    artifacts: tuple[dict[str, Any], ...] = field(default_factory=tuple)


@dataclass(frozen=True)
class AnalysisIssue:
    """One prioritized finding in a session analysis report."""

    priority: int
    title: str
    description: str
    evidence: str
    impact: str
    root_cause: str
    recommendation: str
    trace_id: str | None
    span_id: str | None
    turn_index: int | None
    subject_id: str | None
    evolution: EvolutionSuggestion | None = None

    def to_dict(self) -> dict[str, Any]:
        """Serialize an issue for the HTTP boundary."""
        payload: dict[str, Any] = {
            "priority": self.priority,
            "title": self.title,
            "description": self.description,
            "evidence": self.evidence,
            "impact": self.impact,
            "root_cause": self.root_cause,
            "recommendation": self.recommendation,
            "trace_id": self.trace_id,
            "span_id": self.span_id,
            "turn_index": self.turn_index,
            "subject_id": self.subject_id,
        }
        if self.evolution is not None:
            suggestion = self.evolution
            payload["evolution"] = {
                "kind": suggestion.kind.value,
                "action": suggestion.action.value,
                "target": suggestion.target,
                "section": suggestion.section,
                "rationale": suggestion.rationale,
                "risk": suggestion.risk,
                "confidence": suggestion.confidence,
                "artifacts": [dict(artifact) for artifact in suggestion.artifacts],
            }
        return payload


@dataclass(frozen=True)
class SessionAnalysisReport:
    """Final report returned by the analyzer."""

    session_id: str
    analysis_id: str
    fingerprint: str
    analyzed_at: float
    truncated: bool
    issues: tuple[AnalysisIssue, ...]

    def to_dict(self) -> dict[str, Any]:
        """Serialize a report for the HTTP boundary."""
        return {
            "session_id": self.session_id,
            "analysis_id": self.analysis_id,
            "fingerprint": self.fingerprint,
            "analyzed_at": self.analyzed_at,
            "truncated": self.truncated,
            "issues": [issue.to_dict() for issue in self.issues],
        }
