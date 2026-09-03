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
    target = suggestion.target
    return {
        "kind": suggestion.kind.value,
        "action": suggestion.action.value,
        "target": target,
        "rationale": suggestion.rationale,
        "risk": suggestion.risk,
        "artifacts": [dict(artifact) for artifact in suggestion.artifacts],
        "location_hint": _location_hint(suggestion.kind, target),
        "note": "This change is in JiuwenSwarm framework code, not your conversation. "
        "Ship it through a normal code review/PR; it is never auto-applied.",
    }


def _location_hint(kind: SuggestionKind, target: str | None) -> str:
    name = target or "the reported surface"
    hints = {
        SuggestionKind.TOOL: (
            f"Where to fix: the implementation of the `{name}` tool in the agent "
            "harness (search the repo for its tool definition/executor). Suggest "
            "the change there and open a PR."
        ),
        SuggestionKind.RAIL: (
            f"Where to fix: the harness rail/policy named `{name}` (rails are "
            "Python policies in the framework). Edit it in a branch and open a PR."
        ),
        SuggestionKind.PROMPT: (
            f"Where to fix: the prompt section referenced by `{name}` in the "
            "harness prompt files. Adjust the wording and open a PR."
        ),
        SuggestionKind.CONFIG: (
            f"Where to fix: the `{name}` configuration value in your config file. "
            "This one you can change directly; no code PR needed."
        ),
        SuggestionKind.NONE: "",
        SuggestionKind.SKILL: "",
    }
    return hints.get(kind, "")


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


_APPLYABLE_KINDS = frozenset({
    SuggestionKind.SKILL,
    SuggestionKind.CONFIG,
    SuggestionKind.TOOL,
    SuggestionKind.RAIL,
    SuggestionKind.PROMPT,
})


def _first_artifact(suggestion) -> dict[str, Any]:
    if suggestion is None or not suggestion.artifacts:
        return {}
    first = suggestion.artifacts[0]
    return first if isinstance(first, dict) else {}


def _package_source_root() -> Path:
    """Repo source package root that in-place source writes are confined to."""
    return Path(__file__).resolve().parents[1]


def _in_place_possible(kind: SuggestionKind, artifact: dict[str, Any]) -> bool:
    if kind == SuggestionKind.CONFIG:
        return bool(artifact.get("key")) and "value" in artifact
    return bool(artifact.get("path")) and isinstance(artifact.get("content"), str)


def _skill_preview_payload(issue: AnalysisIssue, settings: AnalysisSettings) -> dict[str, Any] | None:
    return SkillApplyService(settings).preview(issue)


def build_apply_preview(issue: AnalysisIssue, settings: AnalysisSettings) -> dict[str, Any] | None:
    """Return what approving this issue would do (never writes)."""
    suggestion = issue.evolution
    if suggestion is None or suggestion.kind not in _APPLYABLE_KINDS:
        return None
    artifact = _first_artifact(suggestion)
    if suggestion.kind == SuggestionKind.SKILL:
        return _skill_preview_payload(issue, settings)
    patch = build_code_proposal(issue, settings) or {}
    return {
        "allowed": True,
        "apply_allowed": True,
        "kind": suggestion.kind.value,
        "target": suggestion.target,
        "can_in_place": settings.apply_in_place and _in_place_possible(suggestion.kind, artifact),
        "patch": patch,
        "status": ApplyStatus.PREVIEWED.value,
    }


async def apply_evolution(
    issue: AnalysisIssue,
    settings: AnalysisSettings,
    *,
    mode: str = "patch",
    model_provider=None,
) -> dict[str, Any]:
    """Apply an approved evolution suggestion.

    ``mode`` is the human's choice at approval time:
    - ``patch``  -> returns a change artifact, writes nothing.
    - ``in_place`` -> writes to config (or to an allowlisted source file when the
      artifact carries an exact relative ``path`` + ``content`` and
      ``settings.apply_in_place`` is enabled).
    """
    suggestion = issue.evolution
    if suggestion is None or suggestion.kind not in _APPLYABLE_KINDS:
        return {"status": ApplyStatus.REJECTED.value, "error": "NOT_APPLICABLE"}

    if suggestion.kind == SuggestionKind.SKILL:
        return await SkillApplyService(settings, model_provider=model_provider).confirm(issue)

    if mode == "in_place" and settings.apply_in_place:
        if suggestion.kind == SuggestionKind.CONFIG:
            return _apply_config_value(issue)
        return _apply_source_value(issue)

    patch = build_code_proposal(issue, settings) or {}
    return {
        "status": "patch_generated",
        "kind": suggestion.kind.value,
        "target": suggestion.target,
        "patch": patch,
        "note": "No file was changed. Review the artifact and ship it through a normal PR.",
    }


def _apply_config_value(issue: AnalysisIssue) -> dict[str, Any]:
    suggestion = issue.evolution
    artifact = _first_artifact(suggestion)
    key = str(artifact.get("key") or suggestion.target or "").strip()
    value = artifact.get("value")
    if not key or "value" not in artifact:
        return {"status": ApplyStatus.REJECTED.value, "error": "CONFIG_NEEDS_ARTIFACT"}
    from jiuwenswarm.common.config import (
        CONFIG_YAML_PATH,
        dump_yaml_round_trip,
        load_yaml_round_trip,
    )

    data = load_yaml_round_trip(CONFIG_YAML_PATH)
    node: Any = data
    parts = key.split(".")
    for part in parts[:-1]:
        if not isinstance(node, dict) or part not in node:
            return {"status": ApplyStatus.REJECTED.value, "error": f"CONFIG_KEY_NOT_FOUND: {key}"}
        node = node[part]
    leaf = parts[-1]
    if not isinstance(node, dict) or leaf not in node:
        return {"status": ApplyStatus.REJECTED.value, "error": f"CONFIG_KEY_NOT_FOUND: {key}"}
    old = node[leaf]
    node[leaf] = _coerce_config_value(old, value)
    dump_yaml_round_trip(CONFIG_YAML_PATH, data)
    return {
        "status": ApplyStatus.APPLIED.value,
        "kind": "config",
        "path": key,
        "before": old,
        "after": node[leaf],
        "note": "Config updated in your config file; restart for it to take effect.",
    }


def _coerce_config_value(current: Any, value: Any) -> Any:
    if isinstance(current, bool):
        return str(value).strip().lower() in {"1", "true", "yes", "on"}
    if isinstance(current, int):
        try:
            return int(value)
        except (TypeError, ValueError):
            return current
    if isinstance(current, float):
        try:
            return float(value)
        except (TypeError, ValueError):
            return current
    return value


def _apply_source_value(issue: AnalysisIssue) -> dict[str, Any]:
    suggestion = issue.evolution
    artifact = _first_artifact(suggestion)
    relpath = str(artifact.get("path") or "").strip()
    content = artifact.get("content")
    if not relpath or not isinstance(content, str):
        return {"status": ApplyStatus.REJECTED.value, "error": "SOURCE_NEEDS_ARTIFACT"}
    root = _package_source_root()
    try:
        target = (root / relpath).resolve()
        if not target.is_relative_to(root):
            return {"status": ApplyStatus.REJECTED.value, "error": "PATH_OUTSIDE_SOURCE"}
        if not target.is_file():
            return {"status": ApplyStatus.REJECTED.value, "error": f"SOURCE_FILE_NOT_FOUND: {relpath}"}
    except OSError as exc:
        return {"status": ApplyStatus.FAILED.value, "error": f"PATH_ERROR: {exc}"}
    try:
        before = _read_text(target)
        _atomic_write(target, content)
    except OSError as exc:
        return {"status": ApplyStatus.FAILED.value, "error": f"WRITE_FAILED: {exc}"}
    return {
        "status": ApplyStatus.APPLIED.value,
        "kind": suggestion.kind.value,
        "path": str(target),
        "diff": _unified_diff(before, content),
        "note": "Source file updated in place. Rebuild/restart for it to take effect.",
    }
