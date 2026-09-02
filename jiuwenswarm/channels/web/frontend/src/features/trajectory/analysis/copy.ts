// Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.

/** Bilingual in-panel copy for the trajectory analysis feature. */

import { useTranslation } from 'react-i18next';

export function useTrajectoryAnalysisCopy(): { zh: boolean; copy: Record<string, string> } {
  const { i18n } = useTranslation();
  const zh = (i18n.resolvedLanguage ?? i18n.language).toLowerCase().startsWith('zh');
  const copy = zh ? {
    run: '分析',
    rerun: '重新分析',
    running: '正在分析…（使用 LLM，约需 1–2 分钟）',
    runningHint: 'LLM 分析进行中',
    noRun: '点击“分析”以识别会话中的问题与改进建议。',
    issues: '发现的问题',
    noIssues: '未发现问题，会话看起来健康。',
    failed: '分析失败',
    stale: '会话自上次分析后有变化，建议重新分析。',
    truncated: '会话较大，仅分析了部分轮次。',
    priority: '优先级',
    impact: '影响',
    rootCause: '根因',
    recommendation: '建议',
    evidence: '证据',
    preview: '预览变更',
    apply: '应用到技能',
    applying: '校验中…',
    applied: '已应用',
    rejected: '被拒绝',
    previewing: '生成预览…',
    showProposal: '查看补丁方案',
    proposalOnly: '当前仅生成补丁方案（代码改动需走 PR 流程）。',
    proposalDisabled: '补丁方案已被服务端禁用。',
    costNote: '分析消耗 LLM tokens',
    noSession: '尚无会话可分析。',
    disabled: '轨迹 AI 分析未启用。',
    notApplicable: '该问题没有可执行的技能变更。',
    verifyNote: '校验结果',
  } : {
    run: 'Analyze',
    rerun: 'Analyze again',
    running: 'Analyzing… (uses LLM, ~1–2 min)',
    runningHint: 'LLM analysis in progress',
    noRun: 'Click Analyze to identify issues and improvement suggestions in this session.',
    issues: 'Issues found',
    noIssues: 'No issues found. This session looks healthy.',
    failed: 'Analysis failed',
    stale: 'This session changed since the last analysis. Consider re-running.',
    truncated: 'This session is large; only part of the turns were analyzed.',
    priority: 'Priority',
    impact: 'Impact',
    rootCause: 'Root cause',
    recommendation: 'Recommendation',
    evidence: 'Evidence',
    preview: 'Preview change',
    apply: 'Apply to skill',
    applying: 'Verifying…',
    applied: 'Applied',
    rejected: 'Rejected',
    previewing: 'Building preview…',
    showProposal: 'Show patch proposal',
    proposalOnly: 'Proposal only — code changes go through a normal PR.',
    proposalDisabled: 'Patch proposals are disabled by the server.',
    costNote: 'Uses LLM tokens and takes time',
    noSession: 'No session to analyze yet.',
    disabled: 'Trajectory AI analysis is not enabled.',
    notApplicable: 'This issue has no applicable skill change.',
    verifyNote: 'Verification',
  };
  return { zh, copy };
}
