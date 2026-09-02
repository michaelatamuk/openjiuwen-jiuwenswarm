# coding: utf-8
# Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.

"""Unit tests for deterministic signal detection."""

from __future__ import annotations

from jiuwenswarm.trajectory_insight.readmodel import build_session_read_model
from jiuwenswarm.trajectory_insight.signals import detect
from tests.unit_tests.trajectory_insight.fixtures import build_record, llm_span, tool_span


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
