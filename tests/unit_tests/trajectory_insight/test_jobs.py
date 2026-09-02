# coding: utf-8
# Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.

"""Unit tests for the in-process analysis job registry."""

from __future__ import annotations

import asyncio

from jiuwenswarm.trajectory_insight.jobs import AnalysisJobRegistry
from jiuwenswarm.trajectory_insight.schemas import SessionAnalysisReport


def _report(session_id: str) -> SessionAnalysisReport:
    return SessionAnalysisReport(
        session_id=session_id,
        analysis_id="",
        fingerprint="fp",
        analyzed_at=1.0,
        truncated=False,
        issues=(),
    )


def test_job_completes_and_is_pollable() -> None:
    async def scenario() -> None:
        registry = AnalysisJobRegistry(max_concurrent=2, timeout_s=10, ttl_s=60)

        async def runner():
            await asyncio.sleep(0.01)
            return _report("s1")

        job = await registry.start("s1", store_epoch="", runner=runner)
        for _ in range(50):
            if job.status != "running":
                break
            await asyncio.sleep(0.01)
        assert job.status == "completed"
        assert job.report is not None
        assert registry.get(job.analysis_id) is job

    asyncio.run(scenario())


def test_single_flight_per_session() -> None:
    async def scenario() -> None:
        registry = AnalysisJobRegistry()

        async def runner():
            await asyncio.sleep(0.02)
            return _report("s2")

        first = await registry.start("s2", store_epoch="", runner=runner)
        second = await registry.start("s2", store_epoch="", runner=runner)
        assert first.analysis_id == second.analysis_id

    asyncio.run(scenario())


def test_timeout_marks_job_failed() -> None:
    async def scenario() -> None:
        registry = AnalysisJobRegistry(max_concurrent=1, timeout_s=1, ttl_s=60)

        async def slow_runner():
            await asyncio.sleep(5)
            return _report("s3")

        job = await registry.start("s3", store_epoch="", runner=slow_runner)
        await asyncio.sleep(1.5)
        assert job.status == "failed"
        assert job.error == "ANALYSIS_TIMEOUT"

    asyncio.run(scenario())


def test_cancel_marks_failed() -> None:
    async def scenario() -> None:
        registry = AnalysisJobRegistry(timeout_s=30, ttl_s=60)

        async def slow_runner():
            await asyncio.sleep(30)
            return _report("s4")

        job = await registry.start("s4", store_epoch="", runner=slow_runner)
        cancelled = await registry.cancel(job.analysis_id)
        assert cancelled is True
        assert job.status == "failed"

    asyncio.run(scenario())
