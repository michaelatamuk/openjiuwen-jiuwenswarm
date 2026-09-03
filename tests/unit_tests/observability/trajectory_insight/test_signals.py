# coding: utf-8
# Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.

"""Unit tests for deterministic signal detection."""

from __future__ import annotations

from jiuwenswarm.observability.trajectory_insight.readmodel import build_session_read_model
from jiuwenswarm.observability.trajectory_insight.signals import detect
from tests.unit_tests.observability.trajectory_insight.fixtures import build_record, llm_span, tool_span


def _error_record(trace_id: str, tool: str = "bash", start_ns: int = 0) -> dict:
    return build_record(
        trace_id=trace_id,
        span_id=f"{trace_id[-16:]}d4",
        name=f"{tool}_call",
        start_ns=start_ns,
        attrs={"gen_ai.tool.name": tool, "gen_ai.tool.call.result": "traceback boom"},
        status_message="error",
    )


def test_tool_execution_error_seed() -> None:
    model = build_session_read_model([_error_record("1" * 32)])
    seeds = detect(model)
    codes = {seed.code for seed in seeds}
    assert "tool_execution_error" in codes


def test_no_final_response_seed() -> None:
    tool = tool_span(trace_id="2" * 32, start_ns=10, tool="bash", result="")
    llm = llm_span(trace_id="2" * 32, start_ns=20, text="")
    model = build_session_read_model([tool, llm])
    seeds = detect(model)
    assert any(seed.code == "no_final_response" for seed in seeds)


def test_retry_storm_seed() -> None:
    record = build_record(
        trace_id="3" * 32,
        span_id=f"{'3' * 32}"[-16:],
        name="bash_call",
        start_ns=0,
        attrs={
            "gen_ai.tool.name": "bash",
            "gen_ai.tool.call.result": "",
            "dsh.request.retry_count": 3,
        },
    )
    model = build_session_read_model([record])
    seeds = detect(model)
    assert any(seed.code == "retry_storm" for seed in seeds)


def test_repeat_failure_tool_requires_two_turns() -> None:
    records = [
        _error_record("4" * 32, tool="bash", start_ns=0),
        _error_record("5" * 32, tool="bash", start_ns=100),
    ]
    model = build_session_read_model(records)
    seeds = detect(model)
    assert any(seed.code == "repeat_failure_tool" for seed in seeds)


def test_seeds_are_deduplicated() -> None:
    model = build_session_read_model([_error_record("6" * 32)])
    seeds = detect(model)
    keys = {(seed.code, seed.trace_id, seed.span_id) for seed in seeds}
    assert len(keys) == len(seeds)


def test_real_otlp_shape_ok_spans_are_not_failures() -> None:
    llm_ok = build_record(
        trace_id="7" * 32,
        span_id="7" * 16,
        name="llm.call",
        start_ns=0,
        status_code=1,
        attrs={"gen_ai.operation.name": "chat", "gen_ai.response.model": "m1"},
    )
    tool_error = build_record(
        trace_id="7" * 32,
        span_id="777777777777777a",
        name="tool.read_file",
        start_ns=10,
        status_code=2,
        status_message="file system operation execution error, execution: read_file, "
        "reason: File not found: this_file_does_not_exist.txt",
        attrs={"gen_ai.tool.name": "read_file", "gen_ai.tool.call.result": "{}"},
    )
    model = build_session_read_model([llm_ok, tool_error])
    assert model.turn_count_total == 1
    turn = model.turns[0]
    assert turn.has_error is True
    assert turn.tool_failures == 1
    ok_events = [event for event in turn.events if "llm.call" in (event.name or "")]
    assert ok_events
    assert all(event.error is None for event in ok_events)
    seeds = detect(model)
    codes = {seed.code for seed in seeds}
    assert "tool_execution_error" in codes
    assert "llm_call_error" not in codes


def test_handled_single_tool_error_is_still_observed() -> None:
    tool_error = build_record(
        trace_id="a" * 32,
        span_id="aaaaaaaaaaaaaaaa",
        name="tool.read_file",
        start_ns=0,
        status_code=2,
        status_message="file system operation execution error: File not found",
        attrs={"gen_ai.tool.name": "read_file"},
    )
    recovery = llm_span(trace_id="a" * 32, start_ns=10, text="The file does not exist.")
    model = build_session_read_model([tool_error, recovery])
    seeds = detect(model)
    assert any(seed.code == "tool_execution_error" for seed in seeds)
