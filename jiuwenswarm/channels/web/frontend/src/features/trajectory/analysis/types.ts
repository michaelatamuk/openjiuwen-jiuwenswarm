// Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.

/** Response types for the trajectory analysis HTTP API. */

export type AnalysisJobStatus = 'running' | 'completed' | 'failed';

export type SuggestionKind = 'skill' | 'prompt' | 'tool' | 'rail' | 'config' | 'none';
export type SuggestionAction = 'add' | 'modify' | 'remove' | 'review';

export interface EvolutionArtifact {
  [key: string]: unknown;
}

export interface EvolutionSuggestion {
  kind: SuggestionKind;
  action: SuggestionAction;
  target: string | null;
  section: string | null;
  rationale: string;
  risk: string;
  confidence: number;
  artifacts: EvolutionArtifact[];
}

export interface AnalysisIssue {
  priority: number;
  title: string;
  description: string;
  evidence: string;
  impact: string;
  root_cause: string;
  recommendation: string;
  trace_id: string | null;
  span_id: string | null;
  turn_index: number | null;
  subject_id: string | null;
  evolution: EvolutionSuggestion | null;
}

export interface SessionAnalysisReport {
  session_id: string;
  analysis_id: string;
  fingerprint: string;
  analyzed_at: number;
  truncated: boolean;
  issues: AnalysisIssue[];
}

export interface AnalysisJob {
  analysis_id: string;
  session_id: string;
  status: AnalysisJobStatus;
  store_epoch: string;
  stale: boolean;
  created_at: number;
  stage?: string;
  records?: number;
  turns?: number;
  seeds?: number;
  started_at?: number;
  finished_at?: number;
  fingerprint?: string;
  error?: string;
  report?: SessionAnalysisReport;
}

export interface ApplyResult {
  status: string;
  allowed?: boolean;
  apply_allowed?: boolean;
  target?: string | null;
  kind?: string;
  path?: string | null;
  before?: string;
  after?: string;
  diff?: string;
  applied_at?: number;
  apply_id?: string;
  verification?: {
    accepted?: boolean;
    method?: string;
    reason?: string;
  };
  error?: string;
  note?: string;
  rationale?: string;
  risk?: string;
  artifacts?: EvolutionArtifact[];
}

export interface ProposalResult {
  kind: string;
  action: string;
  target: string | null;
  rationale: string;
  risk: string;
  artifacts: EvolutionArtifact[];
  location_hint?: string;
  note: string;
}
