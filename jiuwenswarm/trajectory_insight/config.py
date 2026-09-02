# Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.

"""Resolved settings for the trajectory analysis feature.

Settings live under the ``trajectory_ui.analysis`` block. The module reads the
shared JiuwenSwarm configuration without mutating it, mirroring the pattern used
by ``observability.config.load_trajectory_store_settings``.
"""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any

from jiuwenswarm.common.config import get_config

DEFAULT_ENABLED = False
DEFAULT_MODEL = ""
DEFAULT_MAX_INPUT_CHARS = 8000
DEFAULT_MAX_REPORT_TURNS = 60
DEFAULT_JOB_TIMEOUT_S = 600
DEFAULT_JOB_TTL_S = 3600
DEFAULT_MAX_CONCURRENT_JOBS = 4
DEFAULT_ALLOW_APPLY_SKILL = False
DEFAULT_ALLOW_CODE_PATCH = False
DEFAULT_LANGUAGE = "en"


@dataclass(frozen=True, slots=True)
class AnalysisSettings:
    """Resolved analysis settings."""

    enabled: bool = DEFAULT_ENABLED
    model: str = DEFAULT_MODEL
    max_input_chars: int = DEFAULT_MAX_INPUT_CHARS
    max_report_turns: int = DEFAULT_MAX_REPORT_TURNS
    job_timeout_s: int = DEFAULT_JOB_TIMEOUT_S
    job_ttl_s: int = DEFAULT_JOB_TTL_S
    max_concurrent_jobs: int = DEFAULT_MAX_CONCURRENT_JOBS
    allow_apply_skill: bool = DEFAULT_ALLOW_APPLY_SKILL
    allow_code_patch: bool = DEFAULT_ALLOW_CODE_PATCH
    language: str = DEFAULT_LANGUAGE


def _as_bool(value: Any, default: bool) -> bool:
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    normalized = str(value).strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off"}:
        return False
    return default


def _positive_int(value: Any, default: int, *, minimum: int = 0) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return default
    return parsed if parsed >= minimum else default


def analysis_settings_from(source: Mapping[str, Any]) -> AnalysisSettings:
    """Resolve the ``analysis`` block from a configuration mapping."""
    raw_section = source.get("trajectory_ui", {}) if isinstance(source, Mapping) else {}
    section = raw_section if isinstance(raw_section, Mapping) else {}
    analysis = section.get("analysis") if isinstance(section.get("analysis"), Mapping) else {}
    return AnalysisSettings(
        enabled=section.get("enabled", False) is True and _as_bool(analysis.get("enabled"), DEFAULT_ENABLED),
        model=str(analysis.get("model") or DEFAULT_MODEL),
        max_input_chars=_positive_int(analysis.get("max_input_chars"), DEFAULT_MAX_INPUT_CHARS),
        max_report_turns=_positive_int(analysis.get("max_report_turns"), DEFAULT_MAX_REPORT_TURNS),
        job_timeout_s=_positive_int(analysis.get("job_timeout_s"), DEFAULT_JOB_TIMEOUT_S, minimum=1),
        job_ttl_s=_positive_int(analysis.get("job_ttl_s"), DEFAULT_JOB_TTL_S, minimum=1),
        max_concurrent_jobs=_positive_int(
            analysis.get("max_concurrent_jobs"),
            DEFAULT_MAX_CONCURRENT_JOBS,
            minimum=1,
        ),
        allow_apply_skill=_as_bool(analysis.get("allow_apply_skill"), DEFAULT_ALLOW_APPLY_SKILL),
        allow_code_patch=_as_bool(analysis.get("allow_code_patch"), DEFAULT_ALLOW_CODE_PATCH),
        language=str(analysis.get("language") or DEFAULT_LANGUAGE),
    )


def get_analysis_settings(config: Mapping[str, Any] | None = None) -> AnalysisSettings:
    """Resolve analysis settings from live or supplied configuration."""
    return analysis_settings_from(config if config is not None else get_config())
