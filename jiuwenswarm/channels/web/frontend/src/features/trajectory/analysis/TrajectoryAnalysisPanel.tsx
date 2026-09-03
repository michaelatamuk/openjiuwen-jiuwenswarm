// Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.

/** Session analysis surface mounted as its own Chat/Trajectory/Analysis tab. */

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { useTrajectoryAnalysisEnabled } from '../featureConfig';
import { useTrajectoryAnalysisCopy } from './copy';
import type { AnalysisIssue, AnalysisJob, ApplyResult } from './types';
import {
  confirmTrajectoryApply,
  getTrajectoryAnalysis,
  previewTrajectoryApply,
  startTrajectoryAnalysis,
} from './api';
import css from './TrajectoryAnalysisPanel.module.css';

export interface TrajectoryAnalysisPanelProps {
  /** Session being analyzed. */
  sessionId: string;
  /** Whether the analysis tab is the visible surface (pauses polling). */
  active: boolean;
}

type Phase = 'idle' | 'running' | 'done' | 'failed';

interface IssueUi {
  loading: boolean;
  error: string | null;
  preview: ApplyResult | null;
  applied: ApplyResult | null;
}

function emptyIssueUi(): IssueUi {
  return { loading: false, error: null, preview: null, applied: null };
}

async function pollJob(
  job: AnalysisJob,
  activeRef: RefObject<boolean>,
  runRef: RefObject<number>,
  onCompleted: (job: AnalysisJob) => void,
  onFailed: (message: string) => void,
  onUpdated: (job: AnalysisJob) => void,
): Promise<void> {
  const runId = runRef.current;
  let current: AnalysisJob = job;
  for (;;) {
    if (runRef.current !== runId) return;
    if (!activeRef.current) {
      await new Promise(resolve => window.setTimeout(resolve, 2000));
      continue;
    }
    await new Promise(resolve => window.setTimeout(resolve, 2000));
    if (runRef.current !== runId) return;
    try {
      current = await getTrajectoryAnalysis(current.analysis_id);
      onUpdated(current);
    } catch {
      continue;
    }
    if (current.status === 'completed') {
      onCompleted(current);
      return;
    }
    if (current.status === 'failed') {
      onFailed(current.error ?? 'Analysis failed');
      return;
    }
  }
}

export const TrajectoryAnalysisPanel = memo(function TrajectoryAnalysisPanel({
  sessionId,
  active,
}: TrajectoryAnalysisPanelProps) {
  const enabled = useTrajectoryAnalysisEnabled();
  const { copy } = useTrajectoryAnalysisCopy();
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<AnalysisJob | null>(null);
  const [issues, setIssues] = useState<AnalysisIssue[]>([]);
  const issueUiRef = useRef<Record<string, IssueUi>>({});
  const [, forceRender] = useState(0);
  const runRef = useRef(0);
  const activeRef = useRef(active);
  activeRef.current = active;
  const [runStartedAt, setRunStartedAt] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    if (phase !== 'running') return undefined;
    const timer = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  const elapsedSec = runStartedAt === null
    ? null
    : Math.max(0, Math.floor((nowTick - runStartedAt) / 1000));

  const bump = useCallback(() => forceRender(value => value + 1), []);
  const uiFor = useCallback((index: number): IssueUi => {
    const key = String(index);
    if (!issueUiRef.current[key]) issueUiRef.current[key] = emptyIssueUi();
    return issueUiRef.current[key];
  }, []);
  const patchUi = useCallback((index: number, patch: Partial<IssueUi>) => {
    const key = String(index);
    const current = issueUiRef.current[key] ?? emptyIssueUi();
    issueUiRef.current[key] = { ...current, ...patch };
    bump();
  }, [bump]);

  useEffect(() => {
    runRef.current += 1;
    setPhase('idle');
    setError(null);
    setJob(null);
    setIssues([]);
    setRunStartedAt(null);
    issueUiRef.current = {};
    bump();
  }, [sessionId, bump]);

  const run = useCallback(async () => {
    if (!sessionId) return;
    runRef.current += 1;
    const runId = runRef.current;
    setPhase('running');
    setError(null);
    setJob(null);
    setIssues([]);
    setRunStartedAt(Date.now());
    issueUiRef.current = {};
    bump();
    let started: AnalysisJob;
    try {
      started = await startTrajectoryAnalysis(sessionId);
    } catch (caught) {
      if (runRef.current !== runId) return;
      setPhase('failed');
      setError(caught instanceof Error ? caught.message : String(caught));
      return;
    }
    if (runRef.current !== runId) return;
    setJob(started);
    if (started.status === 'completed') {
      setIssues(started.report?.issues ?? []);
      setPhase('done');
      return;
    }
    await pollJob(
      started,
      activeRef,
      runRef,
      (finished) => {
        setJob(finished);
        setIssues(finished.report?.issues ?? []);
        setPhase('done');
      },
      (message) => {
        setError(message);
        setPhase('failed');
      },
      (updated) => { setJob(updated); },
    );
  }, [sessionId, bump]);

  const handlePreview = useCallback(async (index: number) => {
    if (!job) return;
    patchUi(index, { loading: true, error: null, preview: null });
    try {
      const result = await previewTrajectoryApply(sessionId, job.analysis_id, index);
      patchUi(index, { loading: false, preview: result });
    } catch (caught) {
      patchUi(index, {
        loading: false,
        error: caught instanceof Error ? caught.message : String(caught),
      });
    }
  }, [job, sessionId, patchUi]);

  const handleApply = useCallback(async (index: number) => {
    if (!job) return;
    patchUi(index, { loading: true, error: null });
    try {
      const result = await confirmTrajectoryApply(sessionId, job.analysis_id, index);
      patchUi(index, { loading: false, applied: result });
    } catch (caught) {
      patchUi(index, {
        loading: false,
        error: caught instanceof Error ? caught.message : String(caught),
      });
    }
  }, [job, sessionId, patchUi]);

  const stageText = useMemo(() => {
    if (phase !== 'running') return '';
    const stage = job?.stage;
    if (stage === 'diagnosing') return copy.stageDiagnosing;
    if (stage === 'scanning') return copy.stageScanning;
    if (stage === 'completed') return copy.stageCompleted;
    return copy.stageReading;
  }, [phase, job?.stage, copy]);

  const detailText = useMemo(() => {
    if (phase !== 'running') return '';
    const stage = job?.stage;
    if (stage === 'scanning') {
      return job?.records !== undefined
        ? copy.detailScanning.replace('{records}', String(job.records))
        : '';
    }
    if (stage === 'diagnosing') {
      return job?.seeds !== undefined
        ? copy.detailDiagnosing.replace('{seeds}', String(job.seeds))
        : '';
    }
    return '';
  }, [phase, job, copy]);

  if (!enabled || !sessionId) return null;

  const busy = phase === 'running';
  const actionLabel = phase === 'done' || phase === 'failed' ? copy.rerun : copy.run;
  const issueCountLabel = issues.length === 1 ? `${issues.length} ${copy.issueWord}` : `${issues.length} ${copy.issuesWord}`;

  return (
    <section className={css.page} data-testid="trajectory-analysis" aria-label="Analysis">
      <header className={css.pageHeader}>
        <button
          type="button"
          className={css.primary}
          disabled={busy}
          onClick={() => { void run(); }}
          data-testid="trajectory-analysis-run"
        >
          {busy ? copy.running : actionLabel}
        </button>
        <span className={css.note}>{copy.costNote}</span>
      </header>
      <div className={css.pageBody}>
        {phase === 'running' ? (
          <div className={css.progress} data-testid="trajectory-analysis-progress">
            <span className={css.progressStage}>
              {stageText}
              {elapsedSec !== null ? ` · ${elapsedSec}s` : ''}
            </span>
            {detailText !== '' ? <span className={css.progressNote}>{detailText}</span> : null}
          </div>
        ) : null}
        {phase === 'failed' && error !== null ? (
          <p className={css.error} role="alert">{error}</p>
        ) : null}
        {phase === 'done' && issues.length === 0 ? (
          <p className={css.empty}>{copy.noIssues}</p>
        ) : null}
        {phase === 'done' && issues.length > 0 ? (
          <div className={css.result}>
            {job?.report?.truncated === true ? <p className={css.warning}>{copy.truncated}</p> : null}
            <h3 className={css.summaryHeading}>{issueCountLabel}</h3>
            <p className={css.legend}>{copy.severityLegend}</p>
            <div className={css.issueList}>
              {issues.map((issue, index) => (
                <IssueCard
                  key={`${issue.trace_id ?? ''}-${index}`}
                  issue={issue}
                  index={index}
                  copy={copy}
                  ui={uiFor(index)}
                  onPreview={handlePreview}
                  onApply={handleApply}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
});

function IssueCard({
  issue,
  index,
  copy,
  ui,
  onPreview,
  onApply,
}: {
  issue: AnalysisIssue;
  index: number;
  copy: Record<string, string>;
  ui: IssueUi;
  onPreview: (index: number) => void;
  onApply: (index: number) => void;
}) {
  const evolution = issue.evolution;
  const skillAction = evolution !== null && evolution.kind === 'skill'
    && (evolution.action === 'add' || evolution.action === 'modify' || evolution.action === 'remove');
  const severityWord = issue.priority <= 1
    ? copy.severityCritical
    : issue.priority === 2 ? copy.severityHigh
      : issue.priority === 3 ? copy.severityMedium
        : issue.priority === 4 ? copy.severityLow : copy.severityInfo;
  const evidence = issue.evidence ? (
    <details className={css.evidenceWrap}>
      <summary className={css.evidenceSummary}>{copy.evidenceLabel}</summary>
      <pre className={css.evidence}>{issue.evidence}</pre>
    </details>
  ) : null;
  return (
    <article className={css.card}>
      <div className={css.cardHead}>
        <span className={css.severity} data-priority={issue.priority}>
          <span className={css.severityDot} data-priority={issue.priority} aria-hidden="true" />
          {severityWord}
        </span>
        <h4 className={css.cardTitle}>{issue.title}</h4>
      </div>
      {issue.description ? <p className={css.text}>{issue.description}</p> : null}
      {evidence}
      {issue.root_cause ? <p className={css.field}><strong>{copy.why}: </strong>{issue.root_cause}</p> : null}
      {issue.impact ? <p className={css.field}><strong>{copy.affects}: </strong>{issue.impact}</p> : null}
      {issue.recommendation ? <p className={css.field}><strong>{copy.nextStep}: </strong>{issue.recommendation}</p> : null}
      {skillAction ? (
        <div className={css.actions}>
          {ui.loading ? (
            <span className={css.note}>{ui.applied === null ? copy.previewing : copy.applying}</span>
          ) : null}
          <button
            type="button"
            className={css.action}
            disabled={ui.loading}
            onClick={() => { void onPreview(index); }}
          >
            {copy.preview}
          </button>
          {ui.preview !== null && ui.preview.allowed === true ? (
            <button
              type="button"
              className={css.actionPrimary}
              disabled={ui.loading || ui.preview.apply_allowed !== true}
              title={ui.preview.apply_allowed === true ? undefined : copy.proposalOnly}
              onClick={() => { void onApply(index); }}
            >
              {copy.apply}
            </button>
          ) : null}
        </div>
      ) : null}
      {ui.error !== null ? <p className={css.error}>{ui.error}</p> : null}
      {ui.preview !== null && ui.preview.allowed === true ? (
        <div className={css.diffBlock}>
          <pre className={css.diff}>{ui.preview.diff ?? '(no diff)'}</pre>
        </div>
      ) : null}
      {ui.applied !== null ? (
        <p className={css.applied}>
          {ui.applied.status === 'applied' ? copy.applied : `${copy.rejected}: ${ui.applied.error ?? ''}`}
        </p>
      ) : null}
    </article>
  );
}
