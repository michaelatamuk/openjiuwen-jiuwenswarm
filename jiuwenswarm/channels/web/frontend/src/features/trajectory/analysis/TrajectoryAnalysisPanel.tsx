// Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.

/** Session analysis: professional report surface mounted as its own tab. */

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

function severityOf(priority: number): { label: keyof Record<string, string>; tone: 1 | 2 | 3 | 4 | 5 } {
  if (priority <= 1) return { label: 'severityCritical', tone: 1 };
  if (priority === 2) return { label: 'severityHigh', tone: 2 };
  if (priority === 3) return { label: 'severityMedium', tone: 3 };
  if (priority === 4) return { label: 'severityLow', tone: 4 };
  return { label: 'severityInfo', tone: 5 };
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

  const handleApply = useCallback(async (index: number, mode = 'patch') => {
    if (!job) return;
    patchUi(index, { loading: true, error: null });
    try {
      const result = await confirmTrajectoryApply(sessionId, job.analysis_id, index, mode);
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

  const countLabel = useMemo(() => {
    const word = issues.length === 1 ? copy.issueWord : copy.issuesWord;
    return `${issues.length} ${word}`;
  }, [issues.length, copy]);

  if (!enabled || !sessionId) return null;

  const busy = phase === 'running';
  const actionLabel = phase === 'done' || phase === 'failed' ? copy.rerun : copy.run;

  return (
    <section className={css.page} data-testid="trajectory-analysis" aria-label="Analysis">
      <div className={css.toolbar}>
        <button
          type="button"
          className={css.primary}
          disabled={busy}
          onClick={() => { void run(); }}
          data-testid="trajectory-analysis-run"
        >
          {busy ? copy.running : actionLabel}
        </button>
        <span className={css.hint}>{copy.costNote}</span>
      </div>

      <div className={css.body}>
        {phase === 'idle' ? (
          <div className={css.stateCard} data-testid="trajectory-analysis-idle">
            <h2 className={css.stateTitle}>{copy.idleTitle}</h2>
            <p className={css.stateText}>{copy.idleText}</p>
          </div>
        ) : null}

        {phase === 'running' ? (
          <div className={css.progressCard} data-testid="trajectory-analysis-progress">
            <span className={css.progressStage}>
              {stageText}
              {elapsedSec !== null ? ` · ${elapsedSec}s` : ''}
            </span>
            {detailText !== '' ? <span className={css.progressDetail}>{detailText}</span> : null}
          </div>
        ) : null}

        {phase === 'failed' ? (
          <div className={css.stateCard} data-testid="trajectory-analysis-failed">
            <h2 className={css.stateTitle}>{copy.failedTitle}</h2>
            <p className={css.stateText}>{error}</p>
          </div>
        ) : null}

        {phase === 'done' && issues.length === 0 ? (
          <div className={`${css.stateCard} ${css.stateCardOk}`} data-testid="trajectory-analysis-healthy">
            <h2 className={css.stateTitle}>{copy.healthyTitle}</h2>
            <p className={css.stateText}>{copy.healthyText}</p>
          </div>
        ) : null}

        {phase === 'done' && issues.length > 0 ? (
          <div className={css.report} data-testid="trajectory-analysis-report">
            {job?.report?.truncated === true ? (
              <p className={css.notice}>{copy.truncated}</p>
            ) : null}
            <div className={css.summary}>
              <span className={css.summaryDot} aria-hidden="true" />
              <div className={css.summaryText}>
                <h2 className={css.summaryTitle}>{copy.summaryTitle}</h2>
                <p className={css.summarySub}>{copy.summarySub}</p>
              </div>
              <span className={css.summaryCount}>{countLabel}</span>
            </div>
            <div className={css.incidentList}>
              {issues.map((issue, index) => (
                <IncidentCard
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

function IncidentCard({
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
  onApply: (index: number, mode: string) => void;
}) {
  const evolution = issue.evolution;
  const skillAction = evolution !== null && evolution.kind === 'skill'
    && (evolution.action === 'add' || evolution.action === 'modify' || evolution.action === 'remove');
  const codeAction = evolution !== null && !skillAction
    && (evolution.kind === 'config' || evolution.kind === 'tool'
      || evolution.kind === 'rail' || evolution.kind === 'prompt');
  const applyable = skillAction || codeAction;
  const severity = severityOf(issue.priority);
  const severityLabel = copy[severity.label];
  const showGuidance = Boolean(issue.root_cause || issue.impact || issue.recommendation);
  return (
    <section className={css.incident} data-tone={severity.tone}>
      <header className={css.incidentHeader}>
        <span className={css.pill} data-tone={severity.tone}>{severityLabel}</span>
        <h3 className={css.incidentTitle}>{issue.title}</h3>
      </header>
      {issue.description ? <p className={css.incidentSummary}>{issue.description}</p> : null}
      {issue.evidence ? (
        <div className={css.evidence}>
          <span className={css.evidenceLabel}>{copy.evidenceLabel}</span>
          <pre className={css.evidenceBody}>{issue.evidence}</pre>
        </div>
      ) : null}
      {showGuidance ? (
        <div className={css.guidance}>
          {issue.root_cause ? (
            <div className={css.guidanceBlock}>
              <span className={css.guidanceLabel}>{copy.why}</span>
              <p className={css.guidanceText}>{issue.root_cause}</p>
            </div>
          ) : null}
          {issue.impact ? (
            <div className={css.guidanceBlock}>
              <span className={css.guidanceLabel}>{copy.affects}</span>
              <p className={css.guidanceText}>{issue.impact}</p>
            </div>
          ) : null}
          {issue.recommendation ? (
            <div className={css.guidanceBlock}>
              <span className={css.guidanceLabel}>{copy.nextStep}</span>
              <p className={css.guidanceText}>{issue.recommendation}</p>
            </div>
          ) : null}
        </div>
      ) : null}
      <footer className={css.incidentFooter}>
        {applyable ? (
          <div className={css.actions}>
            {ui.loading ? (
              <span className={css.hint}>{ui.applied === null ? copy.previewing : copy.applying}</span>
            ) : null}
            <button
              type="button"
              className={css.action}
              disabled={ui.loading}
              onClick={() => { void onPreview(index); }}
            >
              {copy.preview}
            </button>
            {ui.preview !== null && ui.preview.allowed === true && skillAction ? (
              <button
                type="button"
                className={css.actionPrimary}
                disabled={ui.loading || ui.preview.apply_allowed !== true}
                title={ui.preview.apply_allowed === true ? undefined : copy.proposalOnly}
                onClick={() => { void onApply(index, 'patch'); }}
              >
                {copy.apply}
              </button>
            ) : null}
            {ui.preview !== null && ui.preview.allowed === true && codeAction ? (
              <>
                {ui.preview.can_in_place === true ? (
                  <button
                    type="button"
                    className={css.actionPrimary}
                    disabled={ui.loading}
                    onClick={() => { void onApply(index, 'in_place'); }}
                  >
                    {copy.applyInPlace}
                  </button>
                ) : null}
                <button
                  type="button"
                  className={ui.preview.can_in_place === true ? css.action : css.actionPrimary}
                  disabled={ui.loading}
                  onClick={() => { void onApply(index, 'patch'); }}
                >
                  {copy.generatePatch}
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </footer>
      {ui.error !== null ? <p className={css.errorText}>{ui.error}</p> : null}
      {ui.preview !== null && ui.preview.allowed === true ? (
        ui.preview.diff !== undefined ? (
          <pre className={css.diff}>{ui.preview.diff}</pre>
        ) : codeAction ? (
          <p className={css.appliedText}>
            {ui.preview.can_in_place === true ? copy.canInPlaceNote : copy.patchOnlyNote}
          </p>
        ) : null
      ) : null}
      {ui.applied !== null ? (
        ui.applied.status === 'patch_generated' ? (
          <pre className={css.diff}>{JSON.stringify(ui.applied.patch ?? {}, null, 2)}</pre>
        ) : ui.applied.status === 'applied' ? (
          <p className={css.appliedText}>{copy.applied}{ui.applied.path ? ` · ${ui.applied.path}` : ''}</p>
        ) : (
          <p className={css.errorText}>{copy.rejected}: {ui.applied.error ?? 'apply failed'}</p>
        )
      ) : null}
    </section>
  );
}
