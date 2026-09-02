# Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.

"""Session trajectory analysis and evolution support for the Trajectory UI.

Pipeline: persisted OTLP records → read model (``readmodel``) → deterministic
seeds (``signals``) → structured report (``analyzer``) → evolution suggestions
(``evolution``). Long runs are executed in the gateway process by the job
registry (``jobs``) behind the ``/api/trajectory`` HTTP routes.
"""

from jiuwenswarm.trajectory_insight.analyzer import analyze_session, build_digest, redact_secrets
from jiuwenswarm.trajectory_insight.config import (
    AnalysisSettings,
    analysis_settings_from,
    get_analysis_settings,
)
from jiuwenswarm.trajectory_insight.evolution import (
    SkillApplyService,
    build_code_proposal,
    derive_issue,
)
from jiuwenswarm.trajectory_insight.jobs import AnalysisJob, AnalysisJobRegistry
from jiuwenswarm.trajectory_insight.model import resolve_model_for_analysis
from jiuwenswarm.trajectory_insight.readmodel import build_session_read_model
from jiuwenswarm.trajectory_insight.schemas import (
    AnalysisIssue,
    ApplyStatus,
    EventKind,
    EvolutionSuggestion,
    IssueSeed,
    SessionAnalysisReport,
    SessionReadModel,
    SuggestionAction,
    SuggestionKind,
    TrajectoryEvent,
    TrajectoryTurn,
    TrajectoryUsage,
)
from jiuwenswarm.trajectory_insight.signals import detect

__all__ = [
    "AnalysisIssue",
    "AnalysisJob",
    "AnalysisJobRegistry",
    "AnalysisSettings",
    "ApplyStatus",
    "EventKind",
    "EvolutionSuggestion",
    "IssueSeed",
    "SessionAnalysisReport",
    "SessionReadModel",
    "SkillApplyService",
    "SuggestionAction",
    "SuggestionKind",
    "TrajectoryEvent",
    "TrajectoryTurn",
    "TrajectoryUsage",
    "analysis_settings_from",
    "analyze_session",
    "build_code_proposal",
    "build_digest",
    "build_session_read_model",
    "derive_issue",
    "detect",
    "get_analysis_settings",
    "redact_secrets",
    "resolve_model_for_analysis",
]
