# coding: utf-8
# Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.

"""Unit tests for the trajectory analysis read model."""

from __future__ import annotations



from jiuwenswarm.observability.trajectory_insight.readmodel import build_session_read_model
from tests.unit_tests.observability.trajectory_insight.fixtures import (
    build_record,
    llm_span,
    tool_span,
)


def _synthetic_error_record(trace_id: str) -> dict:
    attrs = {
        "gen_ai.tool.name": "bash",
        "gen_ai.tool.call.result": "command returned: traceback: boom",
    }
    return build_record(
        trace_id=trace_id,
        span_id=f"{trace_id[-16:]}c3",
        name="bash_call",
        start_ns=1_000,
        attrs=attrs,
        status_message="error",
    )


def test_builds_read_model_from_records() -> None:
    records = [
        llm_span(trace_id="a" * 32, start_ns=0, text="hi there"),
        tool_span(trace_id="b" * 32, start_ns=10),
    ]
    model = build_session_read_model(records)
    assert model.session_id == "session-1"
    assert model.truncated is False
    assert model.turn_count_total == 2
    assert len(model.turns) == 2


def test_detects_tool_error_and_tracks_turn() -> None:
    record = _synthetic_error_record("c" * 32)
    model = build_session_read_model([record])
    assert model.turn_count_total == 1
    turn = model.turns[0]
    assert turn.tool_failures >= 1
    assert turn.has_error is True
    failing = [event for event in turn.events if event.error]
    assert failing
    assert failing[0].tool_name == "bash"


def test_truncates_turns_and_marks_model() -> None:
    records = [
        llm_span(trace_id=f"{i:032x}", start_ns=i * 100)
        for i in range(5)
    ]
    model = build_session_read_model(records, max_turns=2)
    assert model.truncated is True
    assert len(model.turns) == 2
    assert model.turn_count_total == 5


def test_malformed_records_are_skipped() -> None:
    good = llm_span(trace_id="d" * 32, start_ns=0)
    malformed = {"session_id": "session-1", "raw_json": "{not json"}
    model = build_session_read_model([good, malformed])
    assert model.turn_count_total == 1
    assert model.skipped_malformed_records == 1


def test_fingerprint_is_stable_for_same_records() -> None:
    records = [llm_span(trace_id="e" * 32, start_ns=0)]
    first = build_session_read_model(list(records))
    second = build_session_read_model(list(records))
    assert first.fingerprint == second.fingerprint


def test_empty_records_produce_empty_model() -> None:
    model = build_session_read_model([])
    assert model.turns == ()
    assert model.turn_count_total == 0


def test_gateway_reader_otlp_shape_is_accepted() -> None:
    import json

    from jiuwenswarm.observability.trajectory_insight.signals import detect

    base = build_record(
        trace_id="a" * 32,
        span_id="bbbbbbbbbbbbbbbb",
        name="tool.read_file",
        start_ns=0,
        status_code=2,
        status_message="file system operation execution error: File not found",
        attrs={"gen_ai.tool.name": "read_file"},
    )
    reader_record = dict(base)
    reader_record["otlp"] = json.loads(reader_record.pop("raw_json"))
    reader_record["raw_json_base64"] = ""
    model = build_session_read_model([reader_record])
    assert model.skipped_malformed_records == 0
    assert any(seed.code == "tool_execution_error" for seed in detect(model))
