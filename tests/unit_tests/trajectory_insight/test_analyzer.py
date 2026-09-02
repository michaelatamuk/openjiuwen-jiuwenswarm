# coding: utf-8
# Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.

"""Unit tests for the analyzer orchestrator (deterministic + LLM paths)."""

from __future__ import annotations

import asyncio


from jiuwenswarm.trajectory_insight.analyzer import analyze_session, build_digest, redact_secrets
from jiuwenswarm.trajectory_insight.readmodel import build_session_read_model
from jiuwenswarm.trajectory_insight.schemas import IssueSeed
from jiuwenswarm.trajectory_insight.signals import detect
from tests.unit_tests.trajectory_insight.fixtures import build_record, llm_span


def _seed(trace_id: str, code: str = "tool_execution_error") -> IssueSeed:
    return IssueSeed(
        code=code,
        severity=1,
        title="Tool failed",
        evidence=f"trace={trace_id} span=abc",
        trace_id=trace_id,
        span_id="abc",
        turn_index=0,
    )


class _FakeModel:
    def __init__(self, content: str) -> None:
        self._content = content

    async def invoke(self, messages, **_kwargs):
        class _Response:
            content = self._content

        return _Response()


def test_deterministic_only_when_no_model() -> None:
    records = [
        build_record(
            trace_id="1" * 32,
            span_id="1" * 16,
            name="x",
            attrs={"gen_ai.tool.name": "bash", "gen_ai.tool.call.result": "boom"},
            status_message="error",
        ),
        llm_span(trace_id="1" * 32, start_ns=1, text=""),
    ]
    model = build_session_read_model(records)
    seeds = detect(model)
    report = asyncio.run(analyze_session(model, seeds, model=None))
    assert len(report.issues) == len(seeds)
    assert all(issue.evolution is None for issue in report.issues)


def test_llm_report_normalization() -> None:
    records = [llm_span(trace_id="2" * 32, start_ns=0, text="answer")]
    model = build_session_read_model(records)
    seeds = [_seed("2" * 32)]
    payload = (
        '[{"priority": 1, "title": "Retry storm", "description": "d", '
        '"evidence": "trace=222", "impact": "i", "root_cause": "rc", '
        '"recommendation": "rec", "trace_id": "' + "2" * 32 + '", "span_id": null, "turn_index": 0, '
        '"evolution": {"kind": "skill", "action": "modify", "target": "debugging", '
        '"section": "Troubleshooting", "rationale": "r", "risk": "low", '
        '"confidence": 0.9, "artifacts": []}}]'
    )
    fake = _FakeModel(payload)
    report = asyncio.run(analyze_session(model, seeds, model=fake))
    assert len(report.issues) == 1
    issue = report.issues[0]
    assert issue.evolution is not None
    assert issue.evolution.kind.value == "skill"
    assert issue.evolution.target == "debugging"
    assert issue.priority == 1


def test_empty_json_array_produces_no_issues() -> None:
    records = [llm_span(trace_id="3" * 32, start_ns=0, text="ok")]
    model = build_session_read_model(records)
    seeds = [_seed("3" * 32, code="context_near_overflow")]
    fake = _FakeModel("[]")
    report = asyncio.run(analyze_session(model, seeds, model=fake))
    assert report.issues == ()


def test_llm_fallback_to_deterministic_on_invalid() -> None:
    records = [llm_span(trace_id="4" * 32, start_ns=0, text="ok")]
    model = build_session_read_model(records)
    seeds = [_seed("4" * 32)]
    fake = _FakeModel("totally invalid output")
    report = asyncio.run(analyze_session(model, seeds, model=fake))
    assert len(report.issues) == len(seeds)


def test_digest_redacts_secrets() -> None:
    records = [llm_span(trace_id="5" * 32, start_ns=0, text="api_key=sk-abcdef123456789")]
    model = build_session_read_model(records)
    digest = build_digest(model, [])
    assert "sk-abcdef123456789" not in digest
    assert redact_secrets("Bearer abcdefghijklmnop") == "<redacted>"


def test_recorded_tool_failure_is_never_silenced() -> None:
    records = [
        build_record(
            trace_id="8" * 32,
            span_id="8888888888888888",
            name="tool.read_file",
            start_ns=0,
            status_code=2,
            status_message="file system operation execution error: File not found",
            attrs={"gen_ai.tool.name": "read_file"},
        )
    ]
    model = build_session_read_model(records)
    seeds = detect(model)
    assert seeds
    # LLM reports a healthy session -> recorded failure must still surface.
    report = asyncio.run(analyze_session(model, seeds, model=_FakeModel("[]")))
    assert any("read_file" in issue.title or "8888888888888888" in issue.evidence for issue in report.issues)


def test_recorded_failure_is_not_duplicated_when_llm_reports_it() -> None:
    records = [
        build_record(
            trace_id="9" * 32,
            span_id="9999999999999999",
            name="tool.read_file",
            start_ns=0,
            status_code=2,
            status_message="file system operation execution error: File not found",
            attrs={"gen_ai.tool.name": "read_file"},
        )
    ]
    model = build_session_read_model(records)
    seeds = detect(model)
    payload = (
        '[{"priority": 1, "title": "read_file failed", "description": "d", '
        '"evidence": "trace=999 span=9999999999999999", "impact": "i", '
        '"root_cause": "rc", "recommendation": "rec", "trace_id": "' + "9" * 32 + '", '
        '"span_id": "9999999999999999", "turn_index": 0, "evolution": null}]'
    )
    report = asyncio.run(analyze_session(model, seeds, model=_FakeModel(payload)))
    assert len(report.issues) == 1
