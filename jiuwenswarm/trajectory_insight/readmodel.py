# Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.

"""Normalize persisted OTLP trajectory records into the analysis read model.

The reader stores one lossless OTLP export per span row (``raw_json`` plus
denormalized row fields). This module turns those rows into the compact
:class:`SessionReadModel` used by the deterministic and LLM stages. Parsing is
deliberately tolerant: unknown attribute shapes are skipped instead of raising,
so an analysis never takes a live trajectory down.
"""

from __future__ import annotations

import hashlib
import json
import re
from typing import Any, Mapping

from jiuwenswarm.trajectory_insight.schemas import (
    EventKind,
    SessionReadModel,
    TrajectoryEvent,
    TrajectoryTurn,
    TrajectoryUsage,
)

# Well-known semantic attribute keys mirrored from the trajectory viewer's
# semconv vocabulary. Keys are matched loosely (suffix match) so minor schema
# drift in OTLP attributes stays harmless.
_ATTR = {
    "turn_number": "turn.number",
    "request_retry_count": "request.retry_count",
    "request_purpose": "request.purpose",
    "request_number": "request.number",
    "record_kind": "trajectory.record.kind",
    "turn_end_reason": "turn.end_reason",
    "operation_name": "gen_ai.operation.name",
    "request_model": "gen_ai.request.model",
    "response_model": "gen_ai.response.model",
    "tool_name": "gen_ai.tool.name",
    "tool_type": "gen_ai.tool.type",
    "tool_result": "gen_ai.tool.call.result",
    "tool_call_arguments": "gen_ai.tool.call.arguments",
    "input_messages": "gen_ai.input.messages",
    "output_messages": "gen_ai.output.messages",
    "input_tokens": "gen_ai.usage.input_tokens",
    "output_tokens": "gen_ai.usage.output_tokens",
    "reasoning_tokens": "gen_ai.usage.reasoning.output_tokens",
    "cache_read_tokens": "gen_ai.usage.cache_read.input_tokens",
    "cache_creation_tokens": "gen_ai.usage.cache_creation.input_tokens",
    "latency_ms": "response.total_latency_ms",
    "error_type": "error.type",
    "exception_type": "exception.type",
    "exception_message": "exception.message",
    "exception_stacktrace": "exception.stacktrace",
    "execution_subject_id": "execution.subject.id",
    "team_member_name": "team.member.name",
    "stream_text": "stream.text",
    "payload": "trajectory.payload",
}

_GEN_AI_CHAT_OPERATIONS = {
    "chat",
    "generate_content",
    "text_completion",
    "invoke_agent",
    "invoke_workflow",
}

_FAILURE_HINT_RE = re.compile(
    r"error|exception|traceback|failed|failure|timeout|timed out|errno|"
    r"econnrefused|econnreset|enoent|enotfound|denied|not found|"
    r"错误|异常|失败|超时|拒绝",
    re.IGNORECASE,
)

_MAX_EVENT_TEXT = 2000
_DEFAULT_MAX_TURNS = 60


def build_session_read_model(
    records: list[dict[str, Any]],
    *,
    max_turns: int = _DEFAULT_MAX_TURNS,
    max_event_text: int = _MAX_EVENT_TEXT,
) -> SessionReadModel:
    """Build a compact read model from archive record rows.

    Args:
        records: Rows returned by ``AsyncTrajectoryReader.get_session_archive_records``.
        max_turns: Upper bound on turns retained before ``truncated`` is set.
        max_event_text: Per-event text cap used to bound memory and prompt size.

    Returns:
        A normalized :class:`SessionReadModel` for one session.
    """
    spans: list[tuple[Mapping[str, Any], Mapping[str, Any], Mapping[str, Any]]] = []
    session_id = ""
    skipped = 0
    for record in records:
        if not isinstance(record, Mapping):
            skipped += 1
            continue
        if not session_id:
            session_id = str(record.get("session_id") or "")
        raw_json = record.get("raw_json")
        otlp = _parse_otlp(raw_json)
        if otlp is None:
            skipped += 1
            continue
        for resource_span in _as_list(otlp.get("resourceSpans")):
            resource_attrs = _attributes_of(_nested(resource_span, "resource"))
            for scope_span in _as_list(_nested(resource_span, "scopeSpans")):
                scope_attrs = _attributes_of(_nested(scope_span, "scope"))
                for span in _as_list(_nested(scope_span, "spans")):
                    merged_attrs = dict(resource_attrs)
                    merged_attrs.update(scope_attrs)
                    merged_attrs.update(_attributes_of(span))
                    spans.append((span, merged_attrs, record))

    spans.sort(key=lambda item: _span_start(item[0]))

    events: list[TrajectoryEvent] = []
    seq = 0
    for span, attrs, record in spans:
        event = _span_to_event(span, attrs, record, seq, max_event_text)
        if event is not None:
            events.append(event)
            seq += 1

    # Cluster events into turns: prefer explicit turn numbers, then request ids,
    # then trace ids. Ordering is by first event timestamp.
    turn_keys: list[tuple[object, TrajectoryEvent]] = []
    for event in events:
        turn_key = _turn_key_for(event)
        turn_keys.append((turn_key, event))

    ordered_keys: list[object] = []
    seen_keys: set[object] = set()
    for key, _ in turn_keys:
        if key not in seen_keys:
            seen_keys.add(key)
            ordered_keys.append(key)

    turn_count_total = len(ordered_keys)
    if max_turns and turn_count_total > max_turns:
        ordered_keys = ordered_keys[:max_turns]
        truncated = True
    else:
        truncated = False

    key_to_index = {key: index for index, key in enumerate(ordered_keys)}
    buckets: dict[int, list[TrajectoryEvent]] = {index: [] for index in range(len(ordered_keys))}
    for key, event in turn_keys:
        index = key_to_index.get(key)
        if index is not None:
            buckets[index].append(event)

    turns: list[TrajectoryTurn] = []
    for index in range(len(ordered_keys)):
        bucket = buckets[index]
        if not bucket:
            continue
        turns.append(_bucket_to_turn(index, bucket))

    return SessionReadModel(
        session_id=session_id,
        fingerprint=_fingerprint(records),
        truncated=truncated,
        subject_id=_session_subject_id(events),
        turns=tuple(turns),
        turn_count_total=turn_count_total,
        skipped_malformed_records=skipped,
    )


def _parse_otlp(raw_json: Any) -> Mapping[str, Any] | None:
    """Parse one raw OTLP JSON payload tolerantly."""
    if isinstance(raw_json, bytes):
        try:
            raw_json = raw_json.decode("utf-8")
        except UnicodeDecodeError:
            return None
    if not isinstance(raw_json, str):
        return None
    try:
        payload = json.loads(raw_json)
    except (ValueError, TypeError):
        return None
    return payload if isinstance(payload, Mapping) else None


def _as_list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def _nested(mapping: Any, key: str) -> Any:
    if isinstance(mapping, Mapping):
        return mapping.get(key)
    return None


def _attributes_of(owner: Any) -> dict[str, Any]:
    """Decode OTLP key/value attribute lists into a flat mapping."""
    if not isinstance(owner, Mapping):
        return {}
    attributes = owner.get("attributes")
    if not isinstance(attributes, list):
        return {}
    decoded: dict[str, Any] = {}
    for item in attributes:
        if not isinstance(item, Mapping):
            continue
        key = item.get("key")
        value = _decode_value(item.get("value"))
        if isinstance(key, str) and key:
            decoded[key] = value
    return decoded


def _decode_value(value: Any) -> Any:
    """Decode an OTLP AnyValue into a JSON-friendly python value."""
    if isinstance(value, Mapping):
        for kind in (
            "stringValue",
            "boolValue",
            "doubleValue",
            "intValue",
            "bytesValue",
        ):
            if kind in value:
                return value[kind]
        if "arrayValue" in value and isinstance(value["arrayValue"], Mapping):
            return [
                _decode_value(item)
                for item in _as_list(value["arrayValue"].get("values"))
            ]
        if "kvlistValue" in value and isinstance(value["kvlistValue"], Mapping):
            decoded: dict[str, Any] = {}
            for item in _as_list(value["kvlistValue"].get("values")):
                if isinstance(item, Mapping):
                    key = item.get("key")
                    if isinstance(key, str):
                        decoded[key] = _decode_value(item.get("value"))
            return decoded
    return value


def _span_field(span: Mapping[str, Any], record: Mapping[str, Any], field: str) -> Any:
    """Read a span identity field tolerating OTLP camelCase and row fallback."""
    camel = {
        "span_id": "spanId",
        "trace_id": "traceId",
        "parent_span_id": "parentSpanId",
    }.get(field)
    for key in (field, camel):
        if key and span.get(key):
            return span[key]
    return record.get(field)


def _span_start(span: Mapping[str, Any]) -> int:
    raw = span.get("start_time_unix_nano")
    if raw is None:
        raw = span.get("startTimeUnixNano")
    try:
        return int(raw or 0)
    except (TypeError, ValueError):
        return 0


def _span_to_event(
    span: Mapping[str, Any],
    attrs: Mapping[str, Any],
    record: Mapping[str, Any],
    seq: int,
    max_event_text: int,
) -> TrajectoryEvent | None:
    """Convert one OTLP span into a normalized event."""
    span_id = str(_span_field(span, record, "span_id") or "")
    trace_id = str(_span_field(span, record, "trace_id") or "")
    if not span_id and not trace_id:
        return None

    status = _status_text(span)
    kind = _classify_kind(span, attrs)
    tool_name = _lookup(attrs, *_names(_ATTR["tool_name"]), *_names(_ATTR["tool_type"]))
    tool_call_id = str(span.get("name") or "") if kind in {
        EventKind.TOOL_CALL,
        EventKind.TOOL_RESULT,
    } else None

    text, role, error = _extract_event_content(span, attrs, kind, tool_name)
    if len(text) > max_event_text:
        text = f"{text[:max_event_text]}…[truncated]"

    if error is None and status not in {None, "", "ok", "0", "OK", "2"}:
        error = error or status
    if error is None and kind == EventKind.TOOL_RESULT and tool_name is not None:
        if _FAILURE_HINT_RE.search(text or "") or status in {"error", "2"}:
            error = _error_excerpt(text or "", status)

    return TrajectoryEvent(
        seq=seq,
        kind=kind,
        trace_id=trace_id,
        span_id=span_id,
        parent_span_id=_clean_id(_span_field(span, record, "parent_span_id")),
        ts_ns=_span_start(span),
        name=str(span.get("name") or ""),
        role=role,
        text=text,
        tool_name=tool_name,
        tool_call_id=tool_call_id,
        error=error,
        error_type=_first_text(attrs, *_names(_ATTR["error_type"]), *_names(_ATTR["exception_type"])),
        status=status,
        model=_lookup(attrs, *_names(_ATTR["response_model"]), *_names(_ATTR["request_model"])),
        usage=_usage_from_attrs(attrs),
        latency_ms=_as_float(_lookup(attrs, *_names(_ATTR["latency_ms"]))),
        subject_id=_as_text(_lookup(attrs, *_names(_ATTR["execution_subject_id"]))),
        agent=_as_text(_lookup(attrs, *_names(_ATTR["team_member_name"]))),
        retry_count=_as_int(_lookup(attrs, *_names(_ATTR["request_retry_count"]))) or 0,
    )


def _classify_kind(span: Mapping[str, Any], attrs: Mapping[str, Any]) -> EventKind:
    record_kind = _as_text(_lookup(attrs, *_names(_ATTR["record_kind"]))) or ""
    operation = _as_text(_lookup(attrs, *_names(_ATTR["operation_name"]))) or ""
    tool_name = _as_text(_lookup(attrs, *_names(_ATTR["tool_name"]), *_names(_ATTR["tool_type"])))
    name = str(span.get("name") or "").lower()

    if record_kind in {"tool"} or operation in {"execute_tool"} or tool_name or "tool" in name:
        return EventKind.TOOL_RESULT if not tool_name else EventKind.TOOL_CALL
    if record_kind in {"reasoning"}:
        return EventKind.SYSTEM
    if (
        record_kind in {"inference"}
        or operation in _GEN_AI_CHAT_OPERATIONS
        or _lookup(attrs, *_names(_ATTR["response_model"]), *_names(_ATTR["request_model"]))
    ):
        return EventKind.LLM_CALL
    if record_kind in {"turn", "step"}:
        if _as_text(_lookup(attrs, *_names(_ATTR["stream_text"]))) is not None:
            return EventKind.LLM_CALL
        # Turn/step records may embed user messages; keep them as SYSTEM so they
        # can still carry text without polluting tool/LLM accounting.
        return EventKind.SYSTEM
    if record_kind:
        return EventKind.SYSTEM
    return EventKind.SYSTEM


def _extract_event_content(
    span: Mapping[str, Any],
    attrs: Mapping[str, Any],
    kind: EventKind,
    tool_name: str | None,
) -> tuple[str, str | None, str | None]:
    """Best-effort text + role + error extraction from a span."""
    role: str | None = None
    if kind == EventKind.LLM_CALL:
        text = _message_text(
            attrs,
            output_keys=_names(_ATTR["output_messages"]),
            input_keys=_names(_ATTR["input_messages"]),
        )
        role = "assistant"
        return text, role, None
    if kind == EventKind.TOOL_CALL:
        arguments = _lookup(attrs, *_names(_ATTR["tool_call_arguments"]))
        return _as_text(arguments) or "", "tool", None
    if kind == EventKind.TOOL_RESULT:
        result = _lookup(attrs, *_names(_ATTR["tool_result"]), *_names(_ATTR["payload"]))
        return _as_text(result) or "", "tool", None
    text = _as_text(
        _lookup(attrs, *_names(_ATTR["stream_text"]), *_names(_ATTR["payload"]))
    ) or ""
    if text:
        role = "assistant" if kind == EventKind.LLM_CALL else None
    return text, role, None


def _message_text(attrs: Mapping[str, Any], *, output_keys: list[str], input_keys: list[str]) -> str:
    """Extract assistant output text, falling back to user input text."""
    output = _lookup(attrs, *output_keys)
    if output is not None:
        text = _messages_to_text(output)
        if text:
            return text
    input_value = _lookup(attrs, *input_keys)
    if input_value is not None:
        return _messages_to_text(input_value, prefer_role=None)
    return ""


def _messages_to_text(value: Any, prefer_role: str | None = "assistant") -> str:
    """Coerce various message encodings into plain text."""
    parsed = value
    if isinstance(parsed, str):
        try:
            parsed = json.loads(parsed)
        except (ValueError, TypeError):
            return parsed[:4000]
    if isinstance(parsed, Mapping):
        parsed = [parsed]
    if not isinstance(parsed, list):
        return ""

    fragments: list[str] = []
    for message in parsed:
        if not isinstance(message, Mapping):
            fragments.append(str(message))
            continue
        role = _as_text(message.get("role")) or ""
        content = message.get("content")
        if content is None:
            content = message.get("text") or ""
        if isinstance(content, list):
            content = "".join(
                str(part.get("text") or "")
                for part in content
                if isinstance(part, Mapping)
            )
        if isinstance(content, str) and content.strip():
            if prefer_role is None or role == prefer_role or not prefer_role:
                fragments.append(content.strip())
    return "\n".join(fragments)[:4000]


def _status_text(span: Mapping[str, Any]) -> str | None:
    status = span.get("status")
    if not isinstance(status, Mapping):
        return None
    code = status.get("code")
    message = status.get("message")
    # OTel status codes: 0 = UNSET, 1 = OK, 2 = ERROR. Only code 2 surfaces an
    # error; everything else (including absent) is not a failure.
    if code in {0, 1}:
        return None
    normalized_code = str(code or "").strip().lower()
    if normalized_code in {"0", "1", "unset", "status_code_unset", "ok", "status_code_ok", ""}:
        return None
    if code == 2 or normalized_code in {"2", "error", "status_code_error"}:
        return _as_text(message) or "ERROR"
    return None


def _turn_key_for(event: TrajectoryEvent) -> object:
    """Return a stable ordering key grouping events into one user turn."""
    # Single-turn traces usually carry no turn number; group by request then trace.
    return event.trace_id


def _bucket_to_turn(index: int, events: list[TrajectoryEvent]) -> TrajectoryTurn:
    events = sorted(events, key=lambda event: event.ts_ns)
    start_ns = events[0].ts_ns
    end_ns = max((event.ts_ns for event in events), default=None)

    user_content = ""
    for event in events:
        if event.role == "user" or (event.kind == EventKind.SYSTEM and _looks_like_user(event)):
            user_content = event.text
            break
    if not user_content:
        for event in events:
            if event.text:
                user_content = event.text
                break

    llm_calls = sum(1 for event in events if event.kind == EventKind.LLM_CALL)
    tool_calls = sum(
        1 for event in events if event.kind in {EventKind.TOOL_CALL, EventKind.TOOL_RESULT}
    )
    tool_failures = sum(1 for event in events if event.error is not None)
    retries = max((event.retry_count for event in events), default=0)
    has_error = any(event.error is not None for event in events)
    has_final = any(
        event.kind == EventKind.LLM_CALL and bool(event.text) for event in events
    )
    total_tokens = sum(
        event.usage.total_tokens for event in events if event.usage is not None
    )
    duration_s = ((end_ns or start_ns) - start_ns) / 1_000_000_000.0

    subject_id = next(
        (event.subject_id for event in events if event.subject_id), None
    )
    agent = next((event.agent for event in events if event.agent), None)
    return TrajectoryTurn(
        turn_index=index,
        trace_id=events[0].trace_id,
        request_id=None,
        start_ns=start_ns,
        end_ns=end_ns,
        user_content=user_content,
        events=tuple(events),
        llm_calls=llm_calls,
        tool_calls=tool_calls,
        tool_failures=tool_failures,
        retries=retries,
        has_final_response=has_final,
        has_error=has_error,
        total_tokens=total_tokens,
        duration_s=duration_s,
        subject_id=subject_id,
        agent=agent,
    )


def _looks_like_user(event: TrajectoryEvent) -> bool:
    text = event.text
    return bool(text) and event.span_id.startswith("user")


def _usage_from_attrs(attrs: Mapping[str, Any]) -> TrajectoryUsage | None:
    input_tokens = _as_int(_lookup(attrs, *_names(_ATTR["input_tokens"]))) or 0
    output_tokens = _as_int(_lookup(attrs, *_names(_ATTR["output_tokens"]))) or 0
    reasoning = _as_int(_lookup(attrs, *_names(_ATTR["reasoning_tokens"]))) or 0
    cache_read = _as_int(_lookup(attrs, *_names(_ATTR["cache_read_tokens"]))) or 0
    cache_write = _as_int(_lookup(attrs, *_names(_ATTR["cache_creation_tokens"]))) or 0
    if not any((input_tokens, output_tokens, reasoning, cache_read, cache_write)):
        return None
    return TrajectoryUsage(
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        reasoning_tokens=reasoning,
        cache_read_tokens=cache_read,
        cache_write_tokens=cache_write,
        total_tokens=input_tokens + output_tokens,
    )


def _session_subject_id(events: list[TrajectoryEvent]) -> str | None:
    return next((event.subject_id for event in events if event.subject_id), None)


def _fingerprint(records: list[dict[str, Any]]) -> str:
    """Stable digest over the record identities feeding an analysis."""
    digest = hashlib.sha256()
    for record in records:
        if not isinstance(record, Mapping):
            continue
        for key in ("trace_id", "span_id", "record_revision", "raw_sha256"):
            value = record.get(key)
            if value is not None:
                digest.update(f"{key}={value}|".encode("utf-8"))
    return digest.hexdigest()


def _names(token: str) -> list[str]:
    """Return all known prefixes for one semantic attribute suffix."""
    prefixes = ("dsh.", "openjiuwen.", "gen_ai.", "")
    return [f"{prefix}{token}" if prefix else token for prefix in prefixes]


def _lookup(attrs: Mapping[str, Any], *keys: str) -> Any:
    for key in keys:
        if key in attrs:
            return attrs[key]
    lowered = {key.lower(): value for key, value in attrs.items()}
    for key in keys:
        match = lowered.get(key.lower())
        if match is not None:
            return match
    return None


def _as_text(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value)
    return text or None


def _as_int(value: Any) -> int | None:
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _as_float(value: Any) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _first_text(attrs: Mapping[str, Any], *keys: str) -> str | None:
    return _as_text(_lookup(attrs, *keys))


def _clean_id(value: Any) -> str | None:
    text = _as_text(value)
    return text or None


def _error_excerpt(text: str, status: str | None) -> str:
    """Return a bounded excerpt around the first failure hint."""
    match = _FAILURE_HINT_RE.search(text or "")
    if not match:
        return (text or "")[:300]
    start = max(0, match.start() - 80)
    return text[start : match.start() + 300]
