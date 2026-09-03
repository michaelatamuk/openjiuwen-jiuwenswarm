# coding: utf-8
# Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.

"""Unit tests for the skill apply flow and code proposals."""

from __future__ import annotations

import asyncio
from pathlib import Path

from jiuwenswarm.trajectory_insight.config import AnalysisSettings
from jiuwenswarm.trajectory_insight.evolution import (
    SkillApplyService,
    build_code_proposal,
)
from jiuwenswarm.trajectory_insight.schemas import (
    AnalysisIssue,
    EvolutionSuggestion,
    SuggestionAction,
    SuggestionKind,
)

_settings = AnalysisSettings(enabled=True, allow_apply_skill=True)


def _issue(kind: SuggestionKind = SuggestionKind.SKILL, target: str = "demo") -> AnalysisIssue:
    return AnalysisIssue(
        priority=1,
        title="Tool error guidance missing",
        description="d",
        evidence="turn 0 trace=abc span=bash",
        impact="i",
        root_cause="skill lacks guidance",
        recommendation="Document that full names must be used",
        trace_id="abc",
        span_id="bash",
        turn_index=0,
        subject_id=None,
        evolution=EvolutionSuggestion(
            kind=kind,
            action=SuggestionAction.MODIFY if kind == SuggestionKind.SKILL else SuggestionAction.REVIEW,
            target=target,
            section="Troubleshooting",
            rationale="r",
            risk="low",
            confidence=0.8,
        ),
    )


def test_preview_returns_exact_change_without_writing(tmp_path: Path) -> None:
    skill_dir = tmp_path / "demo"
    skill_dir.mkdir()
    skill_md = skill_dir / "SKILL.md"
    skill_md.write_text("existing guidance\n", encoding="utf-8")

    service = SkillApplyService(_settings, skill_roots=[tmp_path])
    result = service.preview(_issue(target="demo"))
    assert result is not None
    assert result["allowed"] is True
    assert result["apply_allowed"] is True
    assert "existing guidance" in result["after"]
    assert skill_md.read_text(encoding="utf-8") == "existing guidance\n"


def test_confirm_applies_only_after_verification(tmp_path: Path) -> None:
    skill_dir = tmp_path / "demo"
    skill_dir.mkdir()
    skill_md = skill_dir / "SKILL.md"
    skill_md.write_text("existing guidance\n", encoding="utf-8")

    service = SkillApplyService(_settings, skill_roots=[tmp_path])
    result = asyncio.run(service.confirm(_issue(target="demo")))
    assert result["status"] == "applied"
    content = skill_md.read_text(encoding="utf-8")
    assert "Troubleshooting" in content


def test_apply_disabled_is_rejected(tmp_path: Path) -> None:
    disabled = AnalysisSettings(enabled=True, allow_apply_skill=False)
    service = SkillApplyService(disabled, skill_roots=[tmp_path])
    result = asyncio.run(service.confirm(_issue(target="demo")))
    assert result["status"] == "rejected"


def test_code_proposal_gated_by_config() -> None:
    disabled = AnalysisSettings(enabled=True, allow_code_patch=False)
    assert build_code_proposal(_issue(kind=SuggestionKind.RAIL), disabled) is None

    enabled = AnalysisSettings(enabled=True, allow_code_patch=True)
    proposal = build_code_proposal(_issue(kind=SuggestionKind.RAIL), enabled)
    assert proposal is not None
    assert proposal["kind"] == "rail"


def test_patch_mode_changes_nothing() -> None:
    from jiuwenswarm.trajectory_insight.evolution import apply_evolution

    settings = AnalysisSettings(enabled=True, allow_code_patch=True, apply_in_place=False)
    result = asyncio.run(apply_evolution(_issue(kind=SuggestionKind.RAIL), settings, mode="patch"))
    assert result["status"] == "patch_generated"


def test_in_place_source_requires_enabled_flag_and_artifact() -> None:
    from jiuwenswarm.trajectory_insight.evolution import apply_evolution

    disabled = AnalysisSettings(enabled=True, allow_code_patch=True, apply_in_place=False)
    issue = _issue(kind=SuggestionKind.RAIL)
    result = asyncio.run(apply_evolution(issue, disabled, mode="in_place"))
    assert result["status"] == "patch_generated"

    enabled = AnalysisSettings(enabled=True, allow_code_patch=True, apply_in_place=True)
    result = asyncio.run(apply_evolution(issue, enabled, mode="in_place"))
    assert result["status"] == "rejected"
    assert result["error"] == "ARTIFACT_NOT_GENERATED"
