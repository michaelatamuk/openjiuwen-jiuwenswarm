// Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.

/** Trajectory AI analysis feature exports. */

export { TrajectoryAnalysisPanel } from './TrajectoryAnalysisPanel';
export type { TrajectoryAnalysisPanelProps } from './TrajectoryAnalysisPanel';
export {
  TrajectoryAnalysisApiError,
  cancelTrajectoryAnalysis,
  confirmTrajectoryApply,
  getTrajectoryAnalysis,
  getTrajectoryProposal,
  previewTrajectoryApply,
  startTrajectoryAnalysis,
} from './api';
export type {
  AnalysisIssue,
  AnalysisJob,
  AnalysisJobStatus,
  ApplyResult,
  EvolutionSuggestion,
  ProposalResult,
  SessionAnalysisReport,
  SuggestionAction,
  SuggestionKind,
} from './types';
