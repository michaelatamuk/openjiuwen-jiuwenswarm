# Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.

"""In-process asyncio job registry for session analyses.

Analysis jobs are long running (store read + capped LLM call) and must never be
executed inline inside an HTTP handler. The registry starts one background task
per analysis, enforces a global concurrency bound and a per-job timeout, and
keeps completed reports for a TTL so the UI can poll them.
"""

from __future__ import annotations

import asyncio
import time
import uuid
from dataclasses import dataclass
from typing import Awaitable, Callable

from jiuwenswarm.observability.trajectory_insight.schemas import SessionAnalysisReport

AnalysisRunner = Callable[["JobProgress"], Awaitable[SessionAnalysisReport]]

_STREAM_TEXT_MAX = 8000


class JobProgress:
    """Live progress handle passed to an analysis runner."""

    def __init__(self, job: "AnalysisJob") -> None:
        self._job = job

    def set_stage(
        self,
        stage: str,
        *,
        records: int | None = None,
        turns: int | None = None,
        seeds: int | None = None,
    ) -> None:
        """Publish the current stage plus any real counters known so far."""
        job = self._job
        job.stage = stage
        if records is not None:
            job.records = records
        if turns is not None:
            job.turns = turns
        if seeds is not None:
            job.seeds = seeds

    def add_chunk(self) -> None:
        self._job.chunks += 1

    def append_text(self, text: str) -> None:
        """Append streamed response text for live display (bounded)."""
        if not text:
            return
        job = self._job
        job.stream_text = (job.stream_text + text)[-_STREAM_TEXT_MAX:]
        job.chars += len(text)

    def add_chars(self, count: int) -> None:
        """Accumulate streamed response characters for live progress."""
        if count:
            self._job.chars += count


@dataclass
class AnalysisJob:
    """Mutable state of one analysis run."""

    analysis_id: str
    session_id: str
    store_epoch: str
    created_at: float
    started_at: float | None = None
    finished_at: float | None = None
    status: str = "running"
    stage: str = "reading"
    records: int | None = None
    turns: int | None = None
    seeds: int | None = None
    chars: int = 0
    chunks: int = 0
    stream_text: str = ""
    fingerprint: str | None = None
    error: str | None = None
    report: SessionAnalysisReport | None = None

    def to_dict(self) -> dict:
        """Serialize for the HTTP boundary."""
        payload = {
            "analysis_id": self.analysis_id,
            "session_id": self.session_id,
            "status": self.status,
            "store_epoch": self.store_epoch,
            "stale": False,
            "created_at": self.created_at,
            "stage": self.stage,
        }
        if self.records is not None:
            payload["records"] = self.records
        if self.turns is not None:
            payload["turns"] = self.turns
        if self.seeds is not None:
            payload["seeds"] = self.seeds
        if self.chars:
            payload["chars"] = self.chars
        if self.chunks:
            payload["chunks"] = self.chunks
        if self.stream_text:
            payload["stream_text"] = self.stream_text
        if self.started_at is not None:
            payload["started_at"] = self.started_at
        if self.finished_at is not None:
            payload["finished_at"] = self.finished_at
        if self.fingerprint is not None:
            payload["fingerprint"] = self.fingerprint
        if self.error is not None:
            payload["error"] = self.error
        if self.report is not None:
            payload["report"] = self.report.to_dict()
        return payload


class AnalysisJobRegistry:
    """Owns background analysis tasks for the gateway process."""

    def __init__(
        self,
        *,
        max_concurrent: int = 4,
        timeout_s: int = 600,
        ttl_s: int = 3600,
    ) -> None:
        self._max_concurrent = max(1, max_concurrent)
        self._timeout_s = max(1, timeout_s)
        self._ttl_s = max(1, ttl_s)
        self._semaphore = asyncio.Semaphore(self._max_concurrent)
        self._jobs: dict[str, AnalysisJob] = {}
        self._tasks: dict[str, asyncio.Task] = {}
        self._lock = asyncio.Lock()

    async def start(self, session_id: str, store_epoch: str, runner: AnalysisRunner) -> AnalysisJob:
        """Start a background analysis, returning the running or existing job."""
        async with self._lock:
            existing = next(
                (
                    job for job in self._jobs.values()
                    if job.session_id == session_id and job.status == "running"
                ),
                None,
            )
            if existing is not None:
                return existing
            job = AnalysisJob(
                analysis_id=uuid.uuid4().hex,
                session_id=session_id,
                store_epoch=store_epoch,
                created_at=time.time(),
            )
            self._jobs[job.analysis_id] = job
            task = asyncio.create_task(self._execute(job, runner))
            self._tasks[job.analysis_id] = task
            self._gc()
            return job

    def get(self, analysis_id: str) -> AnalysisJob | None:
        """Return a job by id, or None when unknown or evicted."""
        return self._jobs.get(analysis_id)

    async def cancel(self, analysis_id: str) -> bool:
        """Cancel a running job and mark it failed."""
        async with self._lock:
            job = self._jobs.get(analysis_id)
            task = self._tasks.get(analysis_id)
            if job is None:
                return False
            if task is not None and not task.done():
                task.cancel()
            if job.status == "running":
                job.status = "failed"
                job.error = "cancelled"
                job.finished_at = time.time()
            return True

    async def _execute(self, job: AnalysisJob, runner: AnalysisRunner) -> None:
        async with self._semaphore:
            if job.status != "running":
                return
            job.started_at = time.time()
            progress = JobProgress(job)
            try:
                report = await asyncio.wait_for(
                    runner(progress),
                    timeout=self._timeout_s,
                )
            except asyncio.TimeoutError:
                job.status = "failed"
                job.error = "ANALYSIS_TIMEOUT"
                job.finished_at = time.time()
            except Exception as exc:  # noqa: BLE001
                job.status = "failed"
                job.error = str(exc)
                job.finished_at = time.time()
            else:
                job.status = "completed"
                job.stage = "completed"
                job.report = report
                job.fingerprint = report.fingerprint
                job.finished_at = time.time()
            finally:
                self._tasks.pop(job.analysis_id, None)

    def _gc(self) -> None:
        cutoff = time.time() - self._ttl_s
        for analysis_id in list(self._jobs):
            job = self._jobs[analysis_id]
            if job.status in {"completed", "failed"} and job.finished_at and job.finished_at < cutoff:
                self._jobs.pop(analysis_id, None)


@dataclass
class ApplyJob:
    """Mutable state of one apply/preview job (preview or approved write)."""

    apply_id: str
    created_at: float
    started_at: float | None = None
    finished_at: float | None = None
    status: str = "running"
    error: str | None = None
    result: dict | None = None

    def to_dict(self) -> dict:
        payload = {
            "apply_id": self.apply_id,
            "status": self.status,
            "created_at": self.created_at,
        }
        if self.finished_at is not None:
            payload["finished_at"] = self.finished_at
        if self.error is not None:
            payload["error"] = self.error
        if self.result is not None:
            payload["result"] = self.result
        return payload


class ApplyJobRegistry:
    """Owns background preview/apply jobs that make slow LLM calls."""

    def __init__(self, *, timeout_s: int = 150, ttl_s: int = 1800, max_concurrent: int = 4) -> None:
        self._timeout_s = max(1, timeout_s)
        self._ttl_s = max(1, ttl_s)
        self._semaphore = asyncio.Semaphore(max(1, max_concurrent))
        self._jobs: dict[str, ApplyJob] = {}
        self._tasks: dict[str, asyncio.Task] = {}

    def start(self, runner) -> ApplyJob:
        """Start a background apply/preview task and return the job."""
        job = ApplyJob(apply_id=uuid.uuid4().hex, created_at=time.time())
        self._jobs[job.apply_id] = job
        task = asyncio.create_task(self._execute(job, runner))
        self._tasks[job.apply_id] = task
        self._gc()
        return job

    def get(self, apply_id: str) -> ApplyJob | None:
        return self._jobs.get(apply_id)

    async def _execute(self, job: ApplyJob, runner) -> None:
        async with self._semaphore:
            job.started_at = time.time()
            try:
                result = await asyncio.wait_for(runner(), timeout=self._timeout_s)
            except Exception as exc:  # noqa: BLE001
                job.status = "failed"
                job.error = str(exc)
                job.finished_at = time.time()
            else:
                job.status = "completed"
                job.result = result
                job.finished_at = time.time()
            finally:
                self._tasks.pop(job.apply_id, None)

    def _gc(self) -> None:
        cutoff = time.time() - self._ttl_s
        for apply_id in list(self._jobs):
            job = self._jobs[apply_id]
            if job.status in {"completed", "failed"} and job.finished_at and job.finished_at < cutoff:
                self._jobs.pop(apply_id, None)
