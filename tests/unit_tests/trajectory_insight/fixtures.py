# coding: utf-8
# Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.

"""Synthetic OTLP fixtures shared by trajectory_insight tests."""

from __future__ import annotations

import json


def _attribute(key: str, value) -> dict:
    if isinstance(value, bool):
        encoded = {"boolValue": value}
    elif isinstance(value, int):
        encoded = {"intValue": value}
    else:
        encoded = {"stringValue": str(value)}
    return {"key": key, "value": encoded}


def build_record(
    *,
    trace_id: str,
    span_id: str,
    name: str = "",
    start_ns: int = 0,
    attrs: dict | None = None,
    status_message: str | None = None,
    status_code: int | None = None,
    session_id: str = "session-1",
    raw_sha256: str = "",
) -> dict:
    """Build one archive-row shaped record with an embedded OTLP span."""
    if status_code is None:
        status_code = 2 if status_message is not None else 0
    status = (
        {"code": status_code, "message": status_message}
        if status_message is not None
        else {"code": status_code}
    )
    otlp = {
        "resourceSpans": [
            {
                "resource": {"attributes": []},
                "scopeSpans": [
                    {
                        "scope": {},
                        "spans": [
                            {
                                "traceId": trace_id,
                                "spanId": span_id,
                                "name": name,
                                "status": status,
                                "startTimeUnixNano": start_ns,
                                "attributes": [
                                    _attribute(key, value)
                                    for key, value in (attrs or {}).items()
                                ],
                            }
                        ],
                    }
                ],
            }
        ]
    }
    return {
        "session_id": session_id,
        "trace_id": trace_id,
        "span_id": span_id,
        "parent_span_id": None,
        "record_revision": 1,
        "raw_sha256": raw_sha256 or f"sha-{span_id}",
        "start_time_unix_nano": start_ns,
        "raw_json": json.dumps(otlp),
    }


def llm_span(*, trace_id: str, start_ns: int, text: str = "", model: str = "m1") -> dict:
    attrs = {
        "gen_ai.operation.name": "chat",
        "gen_ai.response.model": model,
        "gen_ai.output.messages": json.dumps(
            [{"role": "assistant", "content": text}]
        ),
    }
    return build_record(
        trace_id=trace_id,
        span_id=f"{trace_id[-16:]}a1",
        name="chat",
        start_ns=start_ns,
        attrs=attrs,
    )


def tool_span(
    *,
    trace_id: str,
    start_ns: int,
    tool: str = "bash",
    result: str = "",
    status_message: str | None = None,
) -> dict:
    attrs = {
        "gen_ai.tool.name": tool,
        "gen_ai.tool.call.result": result,
    }
    return build_record(
        trace_id=trace_id,
        span_id=f"{trace_id[-16:]}b2",
        name=f"{tool}_call",
        start_ns=start_ns,
        attrs=attrs,
        status_message=status_message,
    )
