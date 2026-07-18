# Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.

"""Team Verification Layer — Quality assurance for Agent Team outputs.

Provides:
- TeamVerificationRail: intercepts task completions and triggers verification
- VerificationReviewer: lightweight subagent that reviews teammate outputs
- VerificationResult: structured quality assessment with pass/fail/needs-rework
- VerificationMemory: persists results to TEAM_MEMORY.md for accountability
"""

from jiuwenswarm.agents.harness.team.verification.rail import TeamVerificationRail
from jiuwenswarm.agents.harness.team.verification.reviewer import VerificationReviewer
from jiuwenswarm.agents.harness.team.verification.result import (
    VerificationResult,
    VerificationStatus,
    QualityDimension,
)
from jiuwenswarm.agents.harness.team.verification.memory import VerificationMemory

__all__ = [
    "TeamVerificationRail",
    "VerificationReviewer",
    "VerificationResult",
    "VerificationStatus",
    "QualityDimension",
    "VerificationMemory",
]
