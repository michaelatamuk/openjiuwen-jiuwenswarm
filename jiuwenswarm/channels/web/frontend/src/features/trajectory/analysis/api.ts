// Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.

/** Same-origin HTTP client for the trajectory analysis API. */

import { getApiBase } from '../../../utils/env';
import type {
  AnalysisJob,
  AnalysisJobStatus,
  ApplyResult,
  EvolutionSuggestion,
  ProposalResult,
  SessionAnalysisReport,
  SuggestionAction,
  SuggestionKind,
} from './types';

export class TrajectoryAnalysisApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'TrajectoryAnalysisApiError';
    this.status = status;
    this.code = code;
  }
}

function analysisUrl(path: string): string {
  return `${getApiBase()}${path}`;
}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function readJson(response: Response): Promise<unknown> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }
  if (response.ok) return payload;
  const body = object(payload) ? payload : {};
  const message = typeof body.error === 'string'
    ? body.error
    : `Trajectory analysis request failed (${response.status})`;
  throw new TrajectoryAnalysisApiError(
    message,
    response.status,
    typeof body.code === 'string' ? body.code : undefined,
  );
}

function jobStatus(value: unknown): value is AnalysisJobStatus {
  return value === 'running' || value === 'completed' || value === 'failed';
}

function kindOf(value: unknown): SuggestionKind {
  const text = String(value ?? 'none');
  if (['skill', 'prompt', 'tool', 'rail', 'config', 'none'].includes(text)) {
    return text as SuggestionKind;
  }
  return 'none';
}

function actionOf(value: unknown): SuggestionAction {
  const text = String(value ?? 'review');
  if (['add', 'modify', 'remove', 'review'].includes(text)) {
    return text as SuggestionAction;
  }
  return 'review';
}

function suggestionOf(value: unknown): EvolutionSuggestion | null {
  if (!object(value)) return null;
  const artifacts = Array.isArray(value.artifacts)
    ? value.artifacts.filter(object)
    : [];
  return {
    kind: kindOf(value.kind),
    action: actionOf(value.action),
    target: typeof value.target === 'string' ? value.target : null,
    section: typeof value.section === 'string' ? value.section : null,
    rationale: typeof value.rationale === 'string' ? value.rationale : '',
    risk: typeof value.risk === 'string' ? value.risk : 'unknown',
    confidence: typeof value.confidence === 'number'
      ? Math.max(0, Math.min(1, value.confidence))
      : 0,
    artifacts,
  };
}

function issueOf(value: unknown): { priority: number; title: string; description: string; evidence: string; impact: string; root_cause: string; recommendation: string; trace_id: string | null; span_id: string | null; turn_index: number | null; subject_id: string | null; evolution: EvolutionSuggestion | null } | null {
  if (!object(value)) return null;
  const priority = typeof value.priority === 'number' ? value.priority : 3;
  const traceId = typeof value.trace_id === 'string' ? value.trace_id : null;
  const spanId = typeof value.span_id === 'string' ? value.span_id : null;
  const turnIndex = typeof value.turn_index === 'number' ? value.turn_index : null;
  const subjectId = typeof value.subject_id === 'string' ? value.subject_id : null;
  return {
    priority,
    title: typeof value.title === 'string' ? value.title : 'Untitled issue',
    description: typeof value.description === 'string' ? value.description : '',
    evidence: typeof value.evidence === 'string' ? value.evidence : '',
    impact: typeof value.impact === 'string' ? value.impact : '',
    root_cause: typeof value.root_cause === 'string' ? value.root_cause : '',
    recommendation: typeof value.recommendation === 'string' ? value.recommendation : '',
    trace_id: traceId,
    span_id: spanId,
    turn_index: turnIndex,
    subject_id: subjectId,
    evolution: suggestionOf(value.evolution),
  };
}

function reportOf(value: unknown): SessionAnalysisReport | null {
  if (!object(value)) return null;
  const issues = Array.isArray(value.issues)
    ? value.issues.map(issueOf).filter((issue): issue is NonNullable<typeof issue> => issue !== null)
    : [];
  const fingerprint = typeof value.fingerprint === 'string' ? value.fingerprint : '';
  return {
    session_id: typeof value.session_id === 'string' ? value.session_id : '',
    analysis_id: typeof value.analysis_id === 'string' ? value.analysis_id : '',
    fingerprint,
    analyzed_at: typeof value.analyzed_at === 'number' ? value.analyzed_at : 0,
    truncated: value.truncated === true,
    issues,
  };
}

function jobOf(value: unknown): AnalysisJob | null {
  if (!object(value) || !jobStatus(value.status)) return null;
  const analysisId = typeof value.analysis_id === 'string' ? value.analysis_id : '';
  const sessionId = typeof value.session_id === 'string' ? value.session_id : '';
  if (analysisId.length === 0 || sessionId.length === 0) return null;
  const report = reportOf(value.report);
  return {
    analysis_id: analysisId,
    session_id: sessionId,
    status: value.status,
    store_epoch: typeof value.store_epoch === 'string' ? value.store_epoch : '',
    stale: value.stale === true,
    created_at: typeof value.created_at === 'number' ? value.created_at : 0,
    ...(typeof value.stage === 'string' ? { stage: value.stage } : {}),
    ...(typeof value.records === 'number' ? { records: value.records } : {}),
    ...(typeof value.turns === 'number' ? { turns: value.turns } : {}),
    ...(typeof value.seeds === 'number' ? { seeds: value.seeds } : {}),
    ...(typeof value.started_at === 'number' ? { started_at: value.started_at } : {}),
    ...(typeof value.fingerprint === 'string' ? { fingerprint: value.fingerprint } : {}),
    ...(typeof value.finished_at === 'number' ? { finished_at: value.finished_at } : {}),
    ...(typeof value.error === 'string' ? { error: value.error } : {}),
    ...(report === null ? {} : { report }),
  };
}

function applyResultOf(value: unknown): ApplyResult {
  if (!object(value)) return { status: 'failed', error: 'Invalid apply response' };
  const result: ApplyResult = {
    status: typeof value.status === 'string' ? value.status : 'failed',
  };
  for (const key of ['allowed', 'apply_allowed']) {
    if (typeof value[key] === 'boolean') {
      (result as unknown as Record<string, unknown>)[key] = value[key];
    }
  }
  for (const key of ['target', 'kind', 'path', 'before', 'after', 'diff', 'error', 'note']) {
    if (typeof value[key] === 'string') {
      (result as unknown as Record<string, unknown>)[key] = value[key];
    }
  }
  for (const key of ['applied_at']) {
    if (typeof value[key] === 'number') {
      (result as unknown as Record<string, unknown>)[key] = value[key];
    }
  }
  if (typeof value.apply_id === 'string') {
    result.apply_id = value.apply_id;
  }
  if (object(value.verification)) {
    const verification: ApplyResult['verification'] = {};
    if (typeof value.verification.accepted === 'boolean') {
      verification.accepted = value.verification.accepted;
    }
    if (typeof value.verification.method === 'string') {
      verification.method = value.verification.method;
    }
    if (typeof value.verification.reason === 'string') {
      verification.reason = value.verification.reason;
    }
    result.verification = verification;
  }
  return result;
}

function proposalOf(value: unknown): ProposalResult | null {
  if (!object(value)) return null;
  const artifacts = Array.isArray(value.artifacts)
    ? value.artifacts.filter(object)
    : [];
  return {
    kind: typeof value.kind === 'string' ? value.kind : 'none',
    action: typeof value.action === 'string' ? value.action : 'review',
    target: typeof value.target === 'string' ? value.target : null,
    rationale: typeof value.rationale === 'string' ? value.rationale : '',
    risk: typeof value.risk === 'string' ? value.risk : 'unknown',
    artifacts,
    ...(typeof value.location_hint === 'string' ? { location_hint: value.location_hint } : {}),
    note: typeof value.note === 'string' ? value.note : '',
  };
}

export async function startTrajectoryAnalysis(
  sessionId: string,
  options: { signal?: AbortSignal } = {},
): Promise<AnalysisJob> {
  const response = await fetch(analysisUrl(
    `/api/trajectory/sessions/${encodeURIComponent(sessionId)}/analyses`,
  ), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
    cache: 'no-store',
    signal: options.signal,
  });
  const payload = await readJson(response);
  const job = jobOf(payload);
  if (job === null) {
    throw new TrajectoryAnalysisApiError('Invalid analysis response', 502, 'INVALID_RESPONSE');
  }
  return job;
}

export async function getTrajectoryAnalysis(
  analysisId: string,
  options: { signal?: AbortSignal } = {},
): Promise<AnalysisJob> {
  const response = await fetch(analysisUrl(
    `/api/trajectory/analyses/${encodeURIComponent(analysisId)}`,
  ), {
    cache: 'no-store',
    signal: options.signal,
  });
  const payload = await readJson(response);
  const job = jobOf(payload);
  if (job === null) {
    throw new TrajectoryAnalysisApiError('Invalid analysis response', 502, 'INVALID_RESPONSE');
  }
  return job;
}

export async function cancelTrajectoryAnalysis(
  analysisId: string,
  options: { signal?: AbortSignal } = {},
): Promise<void> {
  await fetch(analysisUrl(
    `/api/trajectory/analyses/${encodeURIComponent(analysisId)}`,
  ), {
    method: 'DELETE',
    cache: 'no-store',
    signal: options.signal,
  });
}

async function postIssueAction(
  sessionId: string,
  analysisId: string,
  action: 'apply' | 'proposal',
  issueIndex: number,
  preview: boolean,
  options: { signal?: AbortSignal } = {},
): Promise<unknown> {
  const response = await fetch(analysisUrl(
    `/api/trajectory/sessions/${encodeURIComponent(sessionId)}`
    + `/analyses/${encodeURIComponent(analysisId)}/${action}`,
  ), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ issue_index: issueIndex, preview }),
    cache: 'no-store',
    signal: options.signal,
  });
  return readJson(response);
}

export async function previewTrajectoryApply(
  sessionId: string,
  analysisId: string,
  issueIndex: number,
  options: { signal?: AbortSignal } = {},
): Promise<ApplyResult> {
  return applyResultOf(await postIssueAction(sessionId, analysisId, 'apply', issueIndex, true, options));
}

export async function confirmTrajectoryApply(
  sessionId: string,
  analysisId: string,
  issueIndex: number,
  options: { signal?: AbortSignal } = {},
): Promise<ApplyResult> {
  return applyResultOf(await postIssueAction(sessionId, analysisId, 'apply', issueIndex, false, options));
}

export async function getTrajectoryProposal(
  sessionId: string,
  analysisId: string,
  issueIndex: number,
  options: { signal?: AbortSignal } = {},
): Promise<ProposalResult | null> {
  const payload = await postIssueAction(sessionId, analysisId, 'proposal', issueIndex, false, options);
  return proposalOf(payload);
}
