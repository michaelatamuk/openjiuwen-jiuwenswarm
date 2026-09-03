// Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.

/** Trajectory AI analysis surface (Analyze button + results panel). */

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
import type { AnalysisIssue, AnalysisJob, ApplyResult, ProposalResult } from './types';
import {
  confirmTrajectoryApply,
  getTrajectoryAnalysis,
  getTrajectoryProposal,
  previewTrajectoryApply,
  startTrajectoryAnalysis,
  TrajectoryAnalysisApiError,
} from './api';
import css from './TrajectoryAnalysisPanel.module.css';

export interface TrajectoryAnalysisPanelProps {
  /** Session being shown in the trajectory view. */
  sessionId: string;
  /** Whether the trajectory tab is the visible surface (pauses polling). */
  active: boolean;
}

type Phase = 'idle' | 'running' | 'done' | 'failed';

interface IssueUi {
  loading: boolean;
  error: string | null;
  preview: ApplyResult | null;
  applied: ApplyResult | null;
  proposal: ProposalResult | null;
  proposalDisabled: boolean;
}

function emptyIssueUi(): IssueUi {
  return {
    loading: false,
    error: null,
    preview: null,
    applied: null,
    proposal: null,
    proposalDisabled: false,
  };
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
      // Tab hidden: keep the loop alive but do not fetch.
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
  const [expanded, setExpanded] = useState(true);
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
    patchUi(index, { loading: true, error: null, preview: null, proposalDisabled: false });
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
    patchUi(index, { loading: true, error: null, proposalDisabled: false });
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

  const handleProposal = useCallback(async (index: number) => {
    if (!job) return;
    patchUi(index, { loading: true, error: null, proposal: null, proposalDisabled: false });
    try {
      const proposal = await getTrajectoryProposal(sessionId, job.analysis_id, index);
      patchUi(index, { loading: false, proposal });
    } catch (caught) {
      if (caught instanceof TrajectoryAnalysisApiError && caught.code === 'PROPOSAL_DISABLED') {
        patchUi(index, { loading: false, proposalDisabled: true });
        return;
      }
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
    if (stage === 'analyzing') return copy.stageAnalyzing;
    return copy.stageReading;
  }, [phase, job?.stage, copy]);

  const header = useMemo(() => (
    <div className={css.header}>
      <button
        type="button"
        className={css.run}
        disabled={phase === 'running' || !enabled}
        onClick={() => { void run(); }}
        data-testid="trajectory-analysis-run"
      >
        {phase === 'running' ? copy.running : phase === 'done' ? copy.rerun : copy.run}
      </button>
      <span className={css.note}>{copy.costNote}</span>
      {phase === 'done' && issues.length > 0 ? (
        <button
          type="button"
          className={css.toggle}
          onClick={() => setExpanded(value => !value)}
        >
          {expanded ? '▾' : '▸'}
        </button>
      ) : null}
    </div>
  ), [copy, enabled, expanded, issues.length, phase, run]);

  if (!enabled || !sessionId) return null;

  return (
    <section className={css.root} data-testid="trajectory-analysis" aria-label="AI Analysis">
      {header}
      {phase === 'running' ? (
        <div className={css.progress} data-testid="trajectory-analysis-progress">
          <span className={css.progressStage}>
            {stageText}
            {elapsedSec !== null ? ` · ${elapsedSec}s` : ''}
          </span>
          <span className={css.progressNote}>{copy.runningEstimate}</span>
        </div>
      ) : null}
      {phase === 'failed' && error !== null ? (
        <p className={css.error} role="alert">{error}</p>
      ) : null}
      {phase === 'done' ? (
        <div className={css.result}>
          {job?.report?.truncated === true ? <p className={css.warning}>{copy.truncated}</p> : null}
          {issues.length === 0 ? (
            <p className={css.empty}>{copy.noIssues}</p>
          ) : (
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
                  onProposal={handleProposal}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
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
  onProposal,
}: {
  issue: AnalysisIssue;
  index: number;
  copy: Record<string, string>;
  ui: IssueUi;
  onPreview: (index: number) => void;
  onApply: (index: number) => void;
  onProposal: (index: number) => void;
}) {
  const evolution = issue.evolution;
  const skillAction = evolution !== null && evolution.kind === 'skill'
    && (evolution.action === 'add' || evolution.action === 'modify' || evolution.action === 'remove');
  return (
    <article className={css.card}>
      <div className={css.cardHead}>
        <span className={css.priority} data-priority={issue.priority}>P{issue.priority}</span>
        <h4 className={css.cardTitle}>{issue.title}</h4>
      </div>
      {issue.description ? <p className={css.text}>{issue.description}</p> : null}
      {issue.evidence ? <pre className={css.evidence}>{issue.evidence}</pre> : null}
      {issue.impact ? <p className={css.field}><strong>{copy.impact}: </strong>{issue.impact}</p> : null}
      {issue.root_cause ? <p className={css.field}><strong>{copy.rootCause}: </strong>{issue.root_cause}</p> : null}
      {issue.recommendation ? <p className={css.field}><strong>{copy.recommendation}: </strong>{issue.recommendation}</p> : null}
      {evolution !== null && evolution.kind !== 'none' ? (
        <p className={css.badge}>
          {evolution.kind} · {evolution.action}{evolution.target ? ` · ${evolution.target}` : ''}
        </p>
      ) : null}
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
      ) : evolution !== null && evolution.kind !== 'none' ? (
        <div className={css.actions}>
          {ui.loading ? <span className={css.note}>{copy.showProposal}…</span> : null}
          <button
            type="button"
            className={css.action}
            disabled={ui.loading}
            onClick={() => { void onProposal(index); }}
          >
            {copy.showProposal}
          </button>
        </div>
      ) : null}
      {ui.error !== null ? <p className={css.error}>{ui.error}</p> : null}
      {ui.proposalDisabled ? <p className={css.note}>{copy.proposalDisabled}</p> : null}
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
      {ui.proposal !== null ? (
        <div className={css.diffBlock}>
          <pre className={css.diff}>
            {ui.proposal.location_hint ? `${ui.proposal.location_hint}\n\n` : ''}
            {`${copy.suggestedChange}: ${ui.proposal.rationale || ui.proposal.note}`}
            {ui.proposal.artifacts && ui.proposal.artifacts.length > 0
              ? `\n\n${JSON.stringify(ui.proposal.artifacts, null, 2)}`
              : ''}
          </pre>
        </div>
      ) : null}
    </article>
  );
}
