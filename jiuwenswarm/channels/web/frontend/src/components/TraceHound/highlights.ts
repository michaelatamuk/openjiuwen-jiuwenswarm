import type { TurnSummary } from '../../stores/traceHoundStore';

export interface Highlight {
  id: string;
  icon: string;
  kind: 'retries' | 'toolFailures' | 'slowest' | 'context' | 'problems';
  label: string;
  turnIds: string[];
}

export function buildHighlights(turns: TurnSummary[]): Highlight[] {
  const out: Highlight[] = [];
  if (turns.length === 0) return out;

  const topRetry = [...turns].sort((a, b) => b.retry_count - a.retry_count)[0];
  if (topRetry.retry_count > 1) {
    out.push({ id: 'retries', icon: '🔁', kind: 'retries',
      label: `#${topRetry.turn_index + 1} — ${topRetry.retry_count} attempts`, turnIds: [topRetry.turn_id] });
  }

  const totalFail = turns.reduce((s, t) => s + (t.tool_failures ?? 0), 0);
  if (totalFail > 0) {
    const ids = turns.filter(t => (t.tool_failures ?? 0) > 0).map(t => t.turn_id);
    out.push({ id: 'toolFailures', icon: '✗', kind: 'toolFailures', label: `${totalFail} tool failures`, turnIds: ids });
  }

  const timed = turns.filter(t => t.retry_count <= 1 && t.duration_seconds > 0);
  const slowest = [...timed].sort((a, b) => b.duration_seconds - a.duration_seconds)[0];
  if (slowest && slowest.duration_seconds > 60) {
    out.push({ id: 'slowest', icon: '⏱', kind: 'slowest',
      label: `#${slowest.turn_index + 1} took ${Math.round(slowest.duration_seconds)}s`, turnIds: [slowest.turn_id] });
  }

  const maxCtx = Math.max(...turns.map(t => t.context_usage_percent ?? 0), 0);
  if (maxCtx > 80) {
    const ids = turns.filter(t => (t.context_usage_percent ?? 0) > 80).map(t => t.turn_id);
    out.push({ id: 'context', icon: '📏', kind: 'context', label: `context ${maxCtx.toFixed(0)}%`, turnIds: ids });
  }

  const withProblems = turns.filter(t => t.outcome !== 'completed' && t.outcome !== 'deferred');
  if (withProblems.length > 0) {
    out.push({ id: 'problems', icon: '⚠', kind: 'problems',
      label: `${withProblems.length} of ${turns.length} with problems`, turnIds: withProblems.map(t => t.turn_id) });
  }

  return out.slice(0, 4);
}
