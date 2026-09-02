# Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.

"""Evolution suggestions and the approval-driven skill apply flow.

The analysis stage only *suggests*; nothing in this module writes without an
explicit human ``confirm`` call from an HTTP handler. Skills are the only
surface that can be applied in v1: ``SKILL.md`` files are data read fresh each
session, so an atomic replace plus judge-based verification is reversible and
safe. Tool/rail/prompt/config surfaces always return a reviewable proposal and
are never auto-applied.
"""

from __future__ import annotations

import difflib
import hashlib
import logging
import os
import time
from pathlib import Path
from typing import Any

from jiuwenswarm.common.utils import get_agent_skills_dir
from jiuwenswarm.trajectory_insight.config import AnalysisSettings
from jiuwenswarm.trajectory_insight.schemas import (
    AnalysisIssue,
    ApplyStatus,
    SuggestionAction,
    SuggestionKind,
)

logger = logging.getLogger(__name__)


def derive_issue(report, issue_index: int) -> AnalysisIssue | None:
    """Return the issue for an index, resolved from the server report."""
    if report is None or not 0 <= issue_index < len(report.issues):
        return None
    return report.issues[issue_index]


class SkillApplyService:
    """Staged, verified writer for skill evolution suggestions."""

    def __init__(
        self,
        settings: AnalysisSettings,
        *,
        model_provider=None,
        skill_roots: list[Path] | None = None,
    ) -> None:
        self._settings = settings
        self._model_provider = model_provider or (lambda: None)
        self._roots = skill_roots or _default_skill_roots()

    def preview(self, issue: AnalysisIssue) -> dict[str, Any] | None:
        """Return the exact change that ``confirm`` would apply (no write)."""
        suggestion = issue.evolution
        if suggestion is None or suggestion.kind != SuggestionKind.SKILL:
            return None
        target = suggestion.target or ""
        if not _safe_skill_name(target):
            return {"allowed": False, "error": "INVALID_SKILL_TARGET"}
        path, body = self._resolve_skill_path(issue)
        proposed, kind = self._proposed_body(body, issue)
        return {
            "allowed": True,
            "apply_allowed": self._settings.allow_apply_skill,
            "target": target,
            "kind": kind,
            "path": str(path) if path is not None else None,
            "before": body,
            "after": proposed,
            "diff": _unified_diff(body, proposed),
            "status": ApplyStatus.PREVIEWED.value,
        }

    async def confirm(self, issue: AnalysisIssue) -> dict[str, Any]:
        """Verify then apply the change described by ``preview``."""
        suggestion = issue.evolution
        if suggestion is None or suggestion.kind != SuggestionKind.SKILL:
            return {"status": ApplyStatus.REJECTED.value, "error": "NOT_SKILL_SUGGESTION"}
        if not self._settings.allow_apply_skill:
            return {"status": ApplyStatus.REJECTED.value, "error": "APPLY_SKILL_DISABLED"}
        target = suggestion.target or ""
        if not _safe_skill_name(target):
            return {"status": ApplyStatus.REJECTED.value, "error": "INVALID_SKILL_TARGET"}

        path, body = self._resolve_skill_path(issue)
        if path is None:
            return {"status": ApplyStatus.REJECTED.value, "error": "SKILL_NOT_FOUND"}
        proposed, kind = self._proposed_body(body, issue)
        if proposed == body:
            return {"status": ApplyStatus.REJECTED.value, "error": "NO_CHANGE"}

        verification = await self._verify(issue, body, proposed)
        if not verification.get("accepted"):
            return {
                "status": ApplyStatus.REJECTED.value,
                "error": "VERIFICATION_FAILED",
                "verification": verification,
            }

        try:
            _atomic_write(path, proposed)
        except OSError as exc:
            logger.exception("[trajectory.apply] failed to write %s", path)
            return {
                "status": ApplyStatus.FAILED.value,
                "error": f"WRITE_FAILED: {exc}",
                "verification": verification,
            }
        notify_skill_library_changed(target)
        return {
            "status": ApplyStatus.APPLIED.value,
            "path": str(path),
            "target": target,
            "kind": kind,
            "applied_at": time.time(),
            "apply_id": _apply_id(target, proposed),
            "diff": _unified_diff(body, proposed),
            "verification": verification,
        }

    def resolve_skill_path(self, issue: AnalysisIssue) -> Path | None:
        """Expose the resolved SKILL.md path (used by proposals/tests)."""
        path, _ = self._resolve_skill_path(issue)
        return path

    def _resolve_skill_path(self, issue: AnalysisIssue) -> tuple[Path | None, str]:
        suggestion = issue.evolution
        target = suggestion.target or "" if suggestion else ""
        for root in self._roots:
            candidate = root / target / "SKILL.md"
            if candidate.is_file():
                return candidate, _read_text(candidate)
        # ADD action: allow scaffolding a new skill under the first writable root.
        for root in self._roots:
            if root.is_dir():
                candidate = root / target / "SKILL.md"
                return candidate, ""
        return None, ""

    def _proposed_body(self, body: str, issue: AnalysisIssue) -> tuple[str, str]:
        suggestion = issue.evolution
        action = suggestion.action if suggestion else SuggestionAction.MODIFY
        section = (suggestion.section if suggestion else None) or "Troubleshooting"
        block = _skill_block(issue, section)
        if action == SuggestionAction.ADD and not body.strip():
            scaffold = (
                f"---\nname: {suggestion.target if suggestion else 'skill'}\n"
                f"description: {issue.title}\n---\n\n# {issue.title}\n\n"
            )
            return f"{scaffold}\n{block}", "add"
        if action == SuggestionAction.REMOVE:
            return body, "remove"
        if body.strip():
            return f"{body.rstrip()}\n\n{block}\n", "modify"
        return f"{block}\n", "add"

    async def _verify(self, issue: AnalysisIssue, before: str, after: str) -> dict[str, Any]:
        model = self._model_provider() if self._model_provider else None
        if model is None:
            # Without a judge we accept the deterministic change but flag it so
            # operators know the apply was unverified.
            return {"accepted": True, "method": "none", "reason": "no judge model available"}
        prompt = _verification_prompt(issue, before, after)
        try:
            from openjiuwen.core.foundation.llm.schema.message import UserMessage

            response = await model.invoke([UserMessage(content=prompt)], temperature=0.0)
            text = (getattr(response, "content", None) or str(response)).strip().lower()
            accepted = "yes" in text[:400] and "no" not in text[:200]
            return {
                "accepted": accepted,
                "method": "judge",
                "reason": text[:500],
            }
        except Exception as exc:  # noqa: BLE001
            logger.warning("[trajectory.apply] verification failed: %s", exc)
            return {"accepted": False, "method": "judge", "reason": f"judge error: {exc}"}


def build_code_proposal(issue: AnalysisIssue, settings: AnalysisSettings) -> dict[str, Any] | None:
    """Return a reviewable proposal for code-surface suggestions (never applied)."""
    if not settings.allow_code_patch:
        return None
    suggestion = issue.evolution
    if suggestion is None or suggestion.kind in {SuggestionKind.NONE, SuggestionKind.SKILL}:
        return None
    if suggestion.kind == SuggestionKind.CONFIG and suggestion.action == SuggestionAction.REVIEW:
        return None
    return {
        "kind": suggestion.kind.value,
        "action": suggestion.action.value,
        "target": suggestion.target,
        "rationale": suggestion.rationale,
        "risk": suggestion.risk,
        "artifacts": [dict(artifact) for artifact in suggestion.artifacts],
        "note": "Code-surface change. Review and merge through a normal PR; never auto-applied.",
    }


def notify_skill_library_changed(skill_name: str) -> None:
    """Hook for runtime skill-library reload; new sessions read files fresh."""
    logger.info("[trajectory.apply] skill '%s' updated; new sessions pick it up", skill_name)


def _default_skill_roots() -> list[Path]:
    roots = [Path(get_agent_skills_dir()).expanduser()]
    workspace = os.getenv("JIUWENSWARM_WORKSPACE_DIR")
    if workspace:
        roots.append(Path(workspace).expanduser() / ".jiuwenswarm" / "skills")
    return roots


def _safe_skill_name(name: str) -> bool:
    return bool(name) and not any(character in name for character in ("/", "\\", "..", "\x00"))


def _read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except OSError:
        return ""


def _atomic_write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(".tmp")
    temporary.write_text(content, encoding="utf-8")
    os.replace(temporary, path)


def _apply_id(target: str, content: str) -> str:
    digest = hashlib.sha256(f"{target}\n{content}".encode("utf-8")).hexdigest()[:16]
    return f"{target}:{digest}"


def _skill_block(issue: AnalysisIssue, section: str) -> str:
    return (
        f"## {section}\n\n"
        f"- **Observed failure:** {issue.title}\n"
        f"  - Evidence: {issue.evidence}\n"
        f"- **Guidance:** {issue.recommendation or issue.root_cause}\n"
    )


def _verification_prompt(issue: AnalysisIssue, before: str, after: str) -> str:
    return (
        "You are a strict skill-change verifier. Decide whether the proposed change "
        "to a SKILL.md file would plausibly prevent the observed failure without "
        "contradicting other parts of the skill.\n\n"
        f"OBSERVED FAILURE / EVIDENCE:\n{issue.evidence}\n\n"
        f"ORIGINAL SKILL (excerpt):\n{before[:4000]}\n\n"
        f"PROPOSED SKILL (excerpt):\n{after[:4000]}\n\n"
        'Answer with a single word "yes" or "no".'
    )


def _unified_diff(before: str, after: str) -> str:
    return "".join(
        difflib.unified_diff(before.splitlines(keepends=True), after.splitlines(keepends=True))
    )
