/**
 * TraceHoundPanel — TraceHound / Trajectory Viewer
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useTraceHoundStore, type HistoryRecord, type TurnSummary, type AnalysisIssue, type SessionAnalysis } from '../../stores/traceHoundStore';

interface TraceHoundPanelProps { isConnected: boolean; }

// ── Shared styles ─────────────────────────────────────────────────────────────

const panelStyle: React.CSSProperties = {
  padding: '20px 24px', height: '100%', width: '100%', flex: 1,
  overflowY: 'auto', boxSizing: 'border-box',
  fontFamily: 'var(--font-family, sans-serif)', minWidth: 0,
};
const headerStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  marginBottom: 20, gap: 12, flexWrap: 'wrap',
};
const titleStyle: React.CSSProperties = {
  fontSize: 18, fontWeight: 700, color: 'var(--text-primary, #111)', margin: 0,
};
const btnStyle: React.CSSProperties = {
  padding: '5px 12px', borderRadius: 6, border: '1px solid #d1d5db',
  background: '#f9fafb', cursor: 'pointer', fontSize: 13, color: '#374151',
  whiteSpace: 'nowrap',
};
const cardStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 16px',
  marginBottom: 10, cursor: 'pointer', background: '#fff', transition: 'border-color 0.15s',
};
const emptyStyle: React.CSSProperties = {
  padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 14,
};
const chipStyle: React.CSSProperties = {
  fontSize: 12, padding: '2px 8px', borderRadius: 4,
  background: '#f3f4f6', color: '#374151',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(ts: number): string {
  if (!ts) return '';
  return new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
function fmtDateTime(ts: number): string {
  if (!ts) return '';
  return new Date(ts * 1000).toLocaleString([], {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}
function relativeTime(ts: number): string {
  if (!ts) return '';
  const diff = Date.now() / 1000 - ts;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts * 1000).toLocaleDateString();
}
function fmtDuration(s: number): string {
  if (s <= 0) return '';
  if (s < 60) return `${Math.round(s)}s`;
  const m = Math.floor(s / 60);
  const rem = Math.round(s % 60);
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}
function fmtDelta(s: number): string {
  if (s <= 0) return '+0s';
  if (s < 60) return `+${s.toFixed(s < 10 ? 1 : 0)}s`;
  return `+${fmtDuration(s)}`;
}

function modeBadge(mode?: string | null): React.ReactNode {
  if (!mode || mode === 'unknown') return null;
  const colors: Record<string, string> = { 'agent.plan': '#3b82f6', 'code.plan': '#8b5cf6', team: '#10b981' };
  const color = colors[mode] ?? '#6b7280';
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: color + '18', color, border: `1px solid ${color}44`, marginLeft: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {mode}
    </span>
  );
}

// ── Custom tooltip (browser title= is unreliable/slow) ────────────────────────

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && text && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)',
          background: '#1f2937', color: '#f9fafb', fontSize: 11, padding: '8px 10px',
          borderRadius: 6, whiteSpace: 'pre-wrap', zIndex: 9999, minWidth: 180, maxWidth: 300,
          boxShadow: '0 4px 16px rgba(0,0,0,0.35)', pointerEvents: 'none', lineHeight: 1.5,
        }}>
          {text}
          <div style={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #1f2937' }} />
        </div>
      )}
    </span>
  );
}

const QUAL_COLORS: Record<string, string> = {
  good: '#10b981', fair: '#f59e0b', poor: '#ef4444', failed: '#9ca3af', deferred: '#6366f1',
};

// TraceHound uses `outcome` + `issues` instead of `quality_label`/`quality_score`/`quality_breakdown`
const OUTCOME_TO_LABEL: Record<string, string> = {
  completed: 'good',
  completed_with_issues: 'fair',
  no_response: 'poor',
  error: 'failed',
  deferred: 'deferred',
};
function outcomeLabel(t: TurnSummary): string {
  return OUTCOME_TO_LABEL[t.outcome] ?? 'failed';
}
/** Approximate bar height score for visual charts — TraceHound has no numeric quality score */
function outcomeScore(t: TurnSummary): number {
  switch (t.outcome) {
    case 'completed': return 0.9;
    case 'completed_with_issues': return 0.65;
    case 'no_response': return 0.2;
    case 'deferred': return 0.3;
    default: return 0.1;
  }
}

/** Quality chip with inline "?" that shows breakdown in a custom hover tooltip */
function QualityChip({ label, breakdown, score }: { label: string | null; breakdown: string[]; score: number | null }) {
  if (!label) return null;
  const color = QUAL_COLORS[label] ?? '#6b7280';
  const tip = breakdown.join('\n') + (score != null ? `\n\nScore: ${score.toFixed(2)}` : '');
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 4, background: color + '18', color, border: `1px solid ${color}44` }}>
        {label.toUpperCase()}
      </span>
      {tip && (
        <Tooltip text={tip}>
          <span style={{ fontSize: 11, color: '#9ca3af', cursor: 'help', fontWeight: 700, lineHeight: 1 }}>?</span>
        </Tooltip>
      )}
    </span>
  );
}

function queryTypeBadge(qt: string | null | undefined): React.ReactNode {
  if (!qt || qt === 'general') return null;
  const map: Record<string, string> = { coding: '💻', debug: '🐛', file_op: '📁', analysis: '🔍', question: '❓' };
  return (
    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' }}>
      {map[qt] ?? ''} {qt}
    </span>
  );
}

function responseLabel(len: number): { label: string; color: string } | null {
  if (len <= 0) return null;
  if (len < 100)  return { label: 'terse',   color: '#f59e0b' };
  if (len < 500)  return { label: 'normal',  color: '#10b981' };
  if (len < 1500) return { label: 'verbose', color: '#6366f1' };
  return              { label: 'essay',   color: '#8b5cf6' };
}

const DANGEROUS_PATTERNS = [
  /rm\s+-rf/i, /rm\s+-r\s+-f/i, /DROP\s+TABLE/i, /DROP\s+DATABASE/i,
  /sudo\s+rm/i, /mkfs/i, /dd\s+if=/i, /chmod\s+777/i, />\s*\/dev\/sd/i, /truncate.*--size\s+0/i,
];
function isDangerous(rec: HistoryRecord): boolean {
  if (rec.event_type !== 'chat.tool_call') return false;
  const args = JSON.stringify((rec.tool_call as Record<string, unknown>)?.arguments ?? '') + (rec.content ?? '');
  return DANGEROUS_PATTERNS.some(p => p.test(args));
}

function buildRetrySet(records: HistoryRecord[]): Set<string> {
  const seen: Record<string, number> = {};
  const retries = new Set<string>();
  for (const r of records) {
    if (r.event_type === 'chat.tool_call') {
      const name = r.tool_name ?? (r.tool_call as Record<string, unknown>)?.name as string ?? '';
      seen[name] = (seen[name] ?? 0) + 1;
      if (seen[name] > 1) retries.add(r.id);
    }
  }
  return retries;
}

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button style={{ ...btnStyle, fontSize: 11, padding: '2px 8px' }}
      onClick={() => navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })}>
      {copied ? '✓ copied' : '⎘ copy path'}
    </button>
  );
}

function ErrorBanner({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, padding: '8px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#991b1b' }}>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#991b1b' }}>×</button>
    </div>
  );
}

// ── Analytics Panel ───────────────────────────────────────────────────────────

function AnalyticsPanel({ turns }: { turns: TurnSummary[] }) {
  if (turns.length === 0) return null;

  const outcomes = { good: 0, fair: 0, poor: 0, failed: 0, deferred: 0 };
  turns.forEach(t => { const l = outcomeLabel(t) as keyof typeof outcomes; if (l && l in outcomes) outcomes[l]++; });
  const successful = outcomes.good + outcomes.fair;
  const failed = outcomes.poor + outcomes.failed;
  const deferred = outcomes.deferred;

  const errCats: Record<string, number> = {};
  turns.filter(t => t.has_error && t.error_category).forEach(t => {
    errCats[t.error_category!] = (errCats[t.error_category!] ?? 0) + 1;
  });

  const qtCounts: Record<string, number> = {};
  turns.forEach(t => { if (t.query_type) qtCounts[t.query_type] = (qtCounts[t.query_type] ?? 0) + 1; });

  const toolCounts: Record<string, number> = {};
  turns.forEach(t => t.tool_names.forEach(n => { toolCounts[n] = (toolCounts[n] ?? 0) + 1; }));
  const topTools = Object.entries(toolCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const skillCounts: Record<string, number> = {};
  turns.forEach(t => t.skill_names.forEach(n => { skillCounts[n] = (skillCounts[n] ?? 0) + 1; }));
  const topSkills = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const maxTok = Math.max(...turns.map(t => t.total_tokens), 1);
  // For duration chart, only use non-retry turns (wall time is misleading for retry turns)
  const durationTurns = turns.filter(t => t.retry_count <= 1 && t.duration_seconds > 0);
  const maxDur = durationTurns.length > 0 ? Math.max(...durationTurns.map(t => t.duration_seconds)) : 0;

  let longestCascade = 0; let currentCascade = 0;
  turns.forEach(t => {
    if (t.has_error) { currentCascade++; longestCascade = Math.max(longestCascade, currentCascade); }
    else { currentCascade = 0; }
  });

  const totalRetries = turns.reduce((s, t) => s + Math.max(0, t.retry_count - 1), 0);
  const avgTokens = turns.length > 0 ? Math.round(turns.reduce((s, t) => s + t.total_tokens, 0) / turns.length) : 0;

  return (
    <div style={{ marginBottom: 20, padding: '14px 16px', background: '#fafafa', borderRadius: 8, border: '1px solid #e5e7eb' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 14 }}>📊 Session Analytics</div>

      {/* Summary stats */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        {[
          { label: 'Successful turns', value: `${successful}/${turns.length}`, color: '#10b981' },
          { label: 'Failed turns', value: String(failed), color: failed > 0 ? '#ef4444' : '#9ca3af', tip: 'Turns that ended with an error or no response' },
          { label: 'Deferred', value: String(deferred), color: deferred > 0 ? '#6366f1' : '#9ca3af', tip: 'Messages sent while agent was busy — never processed' },
          { label: 'Total retries', value: String(totalRetries), color: totalRetries > 0 ? '#f59e0b' : '#9ca3af', tip: 'How many times the agent retried a failed request' },
          { label: 'Avg tokens/turn', value: avgTokens > 0 ? avgTokens.toLocaleString() : '—', color: '#374151' },
          ...(longestCascade >= 2 ? [{ label: 'Longest error streak', value: `${longestCascade} turns`, color: '#ef4444', tip: 'Consecutive turns all with errors' }] : []),
        ].map((s, i) => (
          <Tooltip key={i} text={s.tip ?? ''}>
            <div style={{ background: '#fff', borderRadius: 6, padding: '8px 12px', border: '1px solid #e5e7eb', minWidth: 100, cursor: s.tip ? 'help' : 'default' }}>
              <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          </Tooltip>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>

        {/* Quality per turn */}
        <div style={{ background: '#fff', borderRadius: 6, padding: 12, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Quality per turn</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 50 }}>
            {turns.map(t => {
              const label = outcomeLabel(t);
              const color = QUAL_COLORS[label] ?? '#9ca3af';
              const pct = outcomeScore(t);
              return (
                <Tooltip key={t.turn_id} text={`#${t.turn_index + 1}: ${label.toUpperCase()}\n${t.user_content || '(no message)'}`}>
                  <div
                    style={{ flex: 1, minWidth: 4, maxWidth: 20, height: `${Math.max(6, pct * 50)}px`, background: color, borderRadius: 2, cursor: 'default', opacity: t.outcome === 'deferred' ? 0.4 : 1 }}
                  />
                </Tooltip>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#9ca3af', marginTop: 3 }}>
            <span>#1</span><span>#{turns.length}</span>
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            {Object.entries(QUAL_COLORS).map(([k, c]) => (
              <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, color: '#6b7280' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: c, display: 'inline-block' }} />
                {k}
              </span>
            ))}
          </div>
        </div>

        {/* Token usage */}
        {maxTok > 0 && (
          <div style={{ background: '#fff', borderRadius: 6, padding: 12, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Tokens per turn</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 50 }}>
              {turns.map(t => (
                <Tooltip key={t.turn_id} text={`#${t.turn_index + 1}: ${t.total_tokens.toLocaleString()} tokens`}>
                  <div style={{ flex: 1, minWidth: 4, maxWidth: 20, height: `${Math.max(t.total_tokens > 0 ? 3 : 0, (t.total_tokens / maxTok) * 50)}px`, background: '#6366f1', borderRadius: 2, opacity: 0.65, cursor: 'default' }} />
                </Tooltip>
              ))}
            </div>
            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 3 }}>Total: {turns.reduce((s, t) => s + t.total_tokens, 0).toLocaleString()} tokens</div>
          </div>
        )}

        {/* Duration per turn — only non-retry turns, since wall time is misleading for retried turns */}
        {maxDur > 0 && (
          <div style={{ background: '#fff', borderRadius: 6, padding: 12, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
              Duration per turn
              <span style={{ fontSize: 9, fontWeight: 400, color: '#9ca3af', marginLeft: 6 }}>(single-attempt turns only)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 50 }}>
              {turns.map(t => {
                if (t.retry_count > 1) {
                  return (
                    <Tooltip key={t.turn_id} text={`#${t.turn_index + 1}: ${t.retry_count} retries — wall time excluded (includes idle gaps)`}>
                      <div style={{ flex: 1, minWidth: 4, maxWidth: 20, height: 6, background: '#e5e7eb', borderRadius: 2, cursor: 'default', opacity: 0.4 }} />
                    </Tooltip>
                  );
                }
                const pct = t.duration_seconds / maxDur;
                const color = pct > 0.75 ? '#ef4444' : pct > 0.4 ? '#f59e0b' : '#10b981';
                return (
                  <Tooltip key={t.turn_id} text={`#${t.turn_index + 1}: ${fmtDuration(t.duration_seconds)}`}>
                    <div style={{ flex: 1, minWidth: 4, maxWidth: 20, height: `${Math.max(t.duration_seconds > 0 ? 3 : 0, pct * 50)}px`, background: color, borderRadius: 2, cursor: 'default' }} />
                  </Tooltip>
                );
              })}
            </div>
            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 3 }}>Slowest: {fmtDuration(maxDur)}</div>
            {/* Legend */}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              {[['#10b981', 'fast'], ['#f59e0b', 'moderate'], ['#ef4444', 'slow']].map(([c, l]) => (
                <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, color: '#6b7280' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: c, display: 'inline-block' }} />
                  {l}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Error categories */}
        {Object.keys(errCats).length > 0 && (
          <div style={{ background: '#fff5f5', borderRadius: 6, padding: 12, border: '1px solid #fecaca' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>Error categories</div>
            {Object.entries(errCats).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
              <div key={cat} style={{ marginBottom: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                  <span style={{ color: '#374151' }}>{cat}</span>
                  <span style={{ fontWeight: 600, color: '#dc2626' }}>×{count}</span>
                </div>
                <div style={{ height: 3, background: '#fee2e2', borderRadius: 2 }}>
                  <div style={{ height: 3, width: `${(count / Object.values(errCats).reduce((a, b) => a + b, 0)) * 100}%`, background: '#ef4444', borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Query types */}
        {Object.keys(qtCounts).length > 1 && (
          <div style={{ background: '#fff', borderRadius: 6, padding: 12, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Query types</div>
            {Object.entries(qtCounts).sort((a, b) => b[1] - a[1]).map(([qt, count]) => {
              const icons: Record<string, string> = { coding: '💻', debug: '🐛', file_op: '📁', analysis: '🔍', question: '❓', general: '💬' };
              return (
                <div key={qt} style={{ marginBottom: 5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                    <span style={{ color: '#374151' }}>{icons[qt] ?? ''} {qt}</span>
                    <span style={{ color: '#6b7280' }}>{count}</span>
                  </div>
                  <div style={{ height: 3, background: '#e5e7eb', borderRadius: 2 }}>
                    <div style={{ height: 3, width: `${(count / turns.length) * 100}%`, background: '#6366f1', borderRadius: 2 }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tool frequency */}
        {topTools.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 6, padding: 12, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Tool usage</div>
            {topTools.map(([tool, count]) => (
              <div key={tool} style={{ marginBottom: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                  <span style={{ color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '78%' }}>🔧 {tool}</span>
                  <span style={{ color: '#6b7280', flexShrink: 0 }}>×{count}</span>
                </div>
                <div style={{ height: 3, background: '#e5e7eb', borderRadius: 2 }}>
                  <div style={{ height: 3, width: `${(count / topTools[0][1]) * 100}%`, background: '#f59e0b', borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Skill frequency */}
        {topSkills.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 6, padding: 12, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Skill usage</div>
            {topSkills.map(([skill, count]) => (
              <div key={skill} style={{ marginBottom: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                  <span style={{ color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '78%' }}>🎯 {skill}</span>
                  <span style={{ color: '#6b7280', flexShrink: 0 }}>×{count}</span>
                </div>
                <div style={{ height: 3, background: '#e5e7eb', borderRadius: 2 }}>
                  <div style={{ height: 3, width: `${(count / topSkills[0][1]) * 100}%`, background: '#8b5cf6', borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

// ── LLM Analysis Panel ────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<number, { bg: string; border: string; text: string; label: string }> = {
  1: { bg: '#fee2e2', border: '#fca5a5', text: '#dc2626', label: 'P1' },
  2: { bg: '#ffedd5', border: '#fdba74', text: '#ea580c', label: 'P2' },
  3: { bg: '#fef9c3', border: '#fde047', text: '#ca8a04', label: 'P3' },
  4: { bg: '#dbeafe', border: '#93c5fd', text: '#1d4ed8', label: 'P4' },
  5: { bg: '#f3f4f6', border: '#d1d5db', text: '#6b7280', label: 'P5' },
};

function IssueCard({ issue }: { issue: AnalysisIssue }) {
  const [expanded, setExpanded] = useState(false);
  const p = Math.min(5, Math.max(1, issue.priority ?? 5));
  const pc = PRIORITY_COLORS[p];

  return (
    <div style={{ border: `1px solid ${pc.border}`, borderLeft: `3px solid ${pc.text}`, borderRadius: 6, marginBottom: 8, background: '#fff', overflow: 'hidden' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', cursor: 'pointer', background: pc.bg + '88' }}
        onClick={() => setExpanded(x => !x)}
      >
        <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 7px', borderRadius: 4, background: pc.bg, color: pc.text, border: `1px solid ${pc.border}`, flexShrink: 0 }}>
          {pc.label}
        </span>
        <span style={{ fontWeight: 600, fontSize: 13, color: '#111827', flex: 1 }}>{issue.title}</span>
        <span style={{ fontSize: 12, color: '#9ca3af', flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && (
        <div style={{ padding: '10px 14px', borderTop: `1px solid ${pc.border}66`, display: 'flex', flexDirection: 'column', gap: 9 }}>
          {issue.description && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Description</div>
              <div style={{ fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap' }}>{issue.description}</div>
            </div>
          )}
          {issue.evidence && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Evidence</div>
              <div style={{ fontSize: 12, color: '#374151', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, padding: '6px 8px', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{issue.evidence}</div>
            </div>
          )}
          {issue.impact && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Impact</div>
              <div style={{ fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap' }}>{issue.impact}</div>
            </div>
          )}
          {issue.root_cause && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Root Cause</div>
              <div style={{ fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap' }}>{issue.root_cause}</div>
            </div>
          )}
          {issue.recommendation && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Recommendation</div>
              <div style={{ fontSize: 13, color: '#065f46', whiteSpace: 'pre-wrap', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 4, padding: '6px 8px' }}>{issue.recommendation}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AnalysisPanelView({ analysis, sessionFingerprint }: { analysis: SessionAnalysis; sessionFingerprint?: string }) {
  const isStale = sessionFingerprint != null && sessionFingerprint !== '' && analysis.fingerprint !== sessionFingerprint;
  const { analyzeSession, analyzing } = useTraceHoundStore();
  const [collapsed, setCollapsed] = useState(false);

  const sortedIssues = useMemo(
    () => [...analysis.issues].sort((a, b) => (a.priority ?? 5) - (b.priority ?? 5)),
    [analysis.issues]
  );

  return (
    <div style={{ marginBottom: 20, border: '1px solid #e0e7ff', borderRadius: 8, background: '#f5f3ff08', overflow: 'hidden' }}>
      {/* Panel header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f5f3ff', borderBottom: collapsed ? 'none' : '1px solid #e0e7ff', cursor: 'pointer' }}
        onClick={() => setCollapsed(x => !x)}>
        <span style={{ fontSize: 15 }}>🔬</span>
        <span style={{ fontWeight: 700, fontSize: 13, color: '#4c1d95', flex: 1 }}>
          LLM Analysis
          <span style={{ fontSize: 11, fontWeight: 400, color: '#7c3aed', marginLeft: 8 }}>
            {sortedIssues.length} issue{sortedIssues.length !== 1 ? 's' : ''} found
          </span>
        </span>
        <span style={{ fontSize: 11, color: '#9ca3af' }}>
          {new Date(analysis.analyzed_at * 1000).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
        {isStale && (
          <Tooltip text="The session history has changed since this analysis was run. Re-run to get fresh results.">
            <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 4, background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', cursor: 'help' }}>
              stale
            </span>
          </Tooltip>
        )}
        {isStale && (
          <button
            style={{ ...btnStyle, fontSize: 11, background: '#7c3aed', color: '#fff', border: 'none', padding: '3px 10px' }}
            onClick={e => { e.stopPropagation(); analyzeSession(); }}
            disabled={analyzing}
          >
            {analyzing ? '…' : '↻ Re-analyze'}
          </button>
        )}
        <span style={{ fontSize: 12, color: '#7c3aed' }}>{collapsed ? '▼' : '▲'}</span>
      </div>

      {/* Issues list */}
      {!collapsed && (
        <div style={{ padding: '12px 14px' }}>
          {sortedIssues.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7280', fontSize: 13, padding: '20px 0' }}>
              No issues found. Session looks healthy!
            </div>
          ) : (
            sortedIssues.map((issue, i) => <IssueCard key={i} issue={issue} />)
          )}
        </div>
      )}
    </div>
  );
}

// ── View 1: Session List ──────────────────────────────────────────────────────

function SessionListView({ isConnected }: { isConnected: boolean }) {
  const { sessions, loading, error, loadSessions, selectSession, clearError } = useTraceHoundStore();
  useEffect(() => { loadSessions(); }, []); // eslint-disable-line

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>TraceHound</h2>
        <button style={btnStyle} onClick={loadSessions} disabled={loading || !isConnected} title="Reload session list">
          {loading ? 'Loading…' : '↻ Refresh'}
        </button>
      </div>
      {error && <ErrorBanner message={error} onClose={clearError} />}
      {sessions.length === 0 && !loading && <div style={emptyStyle}>No sessions found.</div>}
      {sessions.map((s) => (
        <div key={s.session_id} style={cardStyle}
          onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366f1')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
          onClick={() => selectSession(s)}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#111827', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {s.title ?? s.session_id.slice(0, 24) + '…'}{modeBadge(s.mode)}
            </span>
            <span style={{ fontSize: 12, color: '#6b7280', flexShrink: 0 }}>{relativeTime(s.last_message_at ?? s.created_at ?? 0)}</span>
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: '#9ca3af' }}>
            {s.session_id.slice(0, 20)}…
            {s.message_count != null && <span style={{ marginLeft: 8 }}>{s.message_count} messages</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── View 2: Turn List ─────────────────────────────────────────────────────────

function TurnListView({ isConnected }: { isConnected: boolean }) {
  const {
    selectedSession, turns, sessionStats, loading, error, selectTurn, back, clearError,
    analysis, analyzing, analyzeError, analyzeSession, clearAnalyzeError,
  } = useTraceHoundStore();
  const [filterErrors, setFilterErrors] = useState(false);
  const [filterTools,  setFilterTools]  = useState(false);
  const [filterSlow,   setFilterSlow]   = useState(false);

  // p90 threshold for slow turns (only from non-retry turns — retry wall time is misleading)
  const p90dur = useMemo(() => {
    const sorted = [...turns].filter(t => t.retry_count <= 1).map(t => t.duration_seconds).filter(d => d > 0).sort((a, b) => a - b);
    if (!sorted.length) return 0;
    return sorted[Math.floor(sorted.length * 0.9)] ?? sorted[sorted.length - 1];
  }, [turns]);

  const visibleTurns = useMemo(() => turns.filter(t => {
    if (filterErrors && !t.has_error) return false;
    if (filterTools  && t.tool_names.length === 0) return false;
    if (filterSlow   && (t.retry_count > 1 || t.duration_seconds <= p90dur)) return false;
    return true;
  }), [turns, filterErrors, filterTools, filterSlow, p90dur]);

  const anyFilter = filterErrors || filterTools || filterSlow;

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <button style={btnStyle} onClick={back}>← Back</button>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ ...titleStyle, marginBottom: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedSession?.title ?? selectedSession?.session_id?.slice(0, 24)}{modeBadge(selectedSession?.mode)}
            </h2>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{selectedSession?.session_id}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 13, color: '#6b7280' }}>{turns.length} turns</span>
          <Tooltip text={analysis ? 'Re-run LLM deep analysis on this session' : 'Run LLM deep analysis to identify issues, root causes and recommendations'}>
            <button
              style={{ ...btnStyle, fontSize: 12, background: analyzing ? '#f5f3ff' : '#7c3aed', color: analyzing ? '#7c3aed' : '#fff', border: '1px solid #7c3aed', padding: '5px 12px', cursor: analyzing ? 'not-allowed' : 'pointer' }}
              onClick={analyzeSession}
              disabled={analyzing || !isConnected}
            >
              {analyzing ? '🔬 Analyzing…' : analysis ? '↻ Re-analyze' : '🔬 Diagnose'}
            </button>
          </Tooltip>
        </div>
      </div>

      {error && <ErrorBanner message={error} onClose={clearError} />}
      {analyzeError && <ErrorBanner message={`Analysis failed: ${analyzeError}`} onClose={clearAnalyzeError} />}

      {/* LLM Analysis result */}
      {analyzing && !analysis && (
        <div style={{ padding: '14px 16px', marginBottom: 16, border: '1px solid #e0e7ff', borderRadius: 8, background: '#f5f3ff', fontSize: 13, color: '#7c3aed', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>🔬</span>
          <span>Sending session history to LLM for deep analysis… this may take 10-30 seconds.</span>
        </div>
      )}
      {analysis && !analyzing && (
        <AnalysisPanelView analysis={analysis} sessionFingerprint={sessionStats?.session_fingerprint} />
      )}

      {/* Session stats + file path */}
      {sessionStats && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', padding: '8px 0 10px', fontSize: 12, color: '#6b7280', borderBottom: '1px solid #f3f4f6' }}>
            <span><strong style={{ color: '#374151' }}>{sessionStats.total_turns}</strong> turns</span>
            {sessionStats.error_count > 0 && <span style={{ color: '#dc2626' }}><strong>{sessionStats.error_count}</strong> with errors</span>}
            {sessionStats.total_tokens > 0 && <span><strong style={{ color: '#374151' }}>{sessionStats.total_tokens.toLocaleString()}</strong> tokens</span>}
            {sessionStats.date_range && <span>{sessionStats.date_range}</span>}
          </div>
          {sessionStats.history_file_path && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 11, color: '#9ca3af', flexWrap: 'wrap' }}>
              <span>📁 Raw log:</span>
              <code style={{ fontSize: 10, color: '#6b7280', background: '#f3f4f6', padding: '1px 5px', borderRadius: 3, wordBreak: 'break-all' }}>{sessionStats.history_file_path}</code>
              <CopyButton text={sessionStats.history_file_path} />
            </div>
          )}
        </div>
      )}

      {/* Analytics — always shown */}
      {!loading && turns.length > 0 && <AnalyticsPanel turns={turns} />}

      {/* Filter bar */}
      {turns.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
          {([
            { key: 'errors', label: '⚠ Errors only',  active: filterErrors, toggle: () => setFilterErrors(x => !x) },
            { key: 'tools',  label: '🔧 Has tools',    active: filterTools,  toggle: () => setFilterTools(x => !x) },
            {
              key: 'slow', label: '⏱ Slow turns', active: filterSlow, toggle: () => setFilterSlow(x => !x),
              tip: `Show turns that took longer than 90% of others${p90dur > 0 ? ` (threshold: ${fmtDuration(p90dur)})` : ''}`,
            },
          ] as const).map((f) => (
            <Tooltip key={f.key} text={'tip' in f ? f.tip : ''}>
              <button onClick={f.toggle} style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 12,
                border: `1px solid ${f.active ? '#6366f1' : '#e5e7eb'}`,
                background: f.active ? '#eef2ff' : '#f9fafb',
                color: f.active ? '#6366f1' : '#6b7280',
                cursor: 'pointer', fontWeight: f.active ? 600 : 400,
              }}>{f.label}</button>
            </Tooltip>
          ))}
          {anyFilter && <span style={{ fontSize: 11, color: '#9ca3af' }}>{visibleTurns.length}/{turns.length}</span>}
        </div>
      )}

      {loading && <div style={emptyStyle}>Loading turns…</div>}
      {!loading && turns.length === 0 && <div style={emptyStyle}>No turns found for this session.</div>}
      {!loading && turns.length > 0 && visibleTurns.length === 0 && <div style={emptyStyle}>No turns match the active filters.</div>}

      {visibleTurns.map((turn) => {
        const rLabel = responseLabel(turn.final_length);
        const isSlow = p90dur > 0 && turn.retry_count <= 1 && turn.duration_seconds > p90dur;
        const isDeferred = turn.was_deferred;
        return (
          <div key={turn.turn_id}
            style={{ ...cardStyle, borderLeftWidth: (turn.has_error || isDeferred) ? 3 : 1, borderLeftColor: isDeferred ? '#a5b4fc' : turn.has_error ? '#fca5a5' : '#e5e7eb', opacity: isDeferred ? 0.75 : 1 }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366f1')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = isDeferred ? '#a5b4fc' : turn.has_error ? '#fca5a5' : '#e5e7eb')}
            onClick={() => isConnected && selectTurn(turn.turn_id)}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Row 1: badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', background: '#eef2ff', borderRadius: 4, padding: '1px 6px', flexShrink: 0 }}>#{turn.turn_index + 1}</span>
                  {modeBadge(turn.mode)}
                  <QualityChip label={outcomeLabel(turn)} breakdown={turn.issues} score={null} />
                  {queryTypeBadge(turn.query_type)}
                  {turn.has_error && !isDeferred && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}>
                      ⚠ {turn.error_category ?? 'error'}
                    </span>
                  )}
                  {isDeferred && (
                    <Tooltip text="This message was sent while the agent was busy with another request. It was queued but never actually processed.">
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: '#ede9fe', color: '#7c3aed', border: '1px solid #c4b5fd', cursor: 'help' }}>
                        ⏸ never processed
                      </span>
                    </Tooltip>
                  )}
                  {turn.retry_count > 1 && (
                    <Tooltip text={`The agent attempted this request ${turn.retry_count} times. Each retry was triggered when a new message arrived while the original was still pending.`}>
                      <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 4, background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', cursor: 'help' }}>
                        {turn.retry_count} attempts
                      </span>
                    </Tooltip>
                  )}
                </div>
                {/* Row 2: user message */}
                <div style={{ fontSize: 13, color: turn.user_content ? '#111827' : '#9ca3af', fontStyle: turn.user_content ? 'normal' : 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {turn.user_content || '(no user message)'}
                </div>
                {/* Row 3: tool/file/skill badges */}
                {(turn.tool_names.length > 0 || turn.skill_names.length > 0 || turn.tool_failures > 0 || turn.file_count > 0) && (
                  <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                    {turn.tool_names.slice(0, 3).map((t, i) => (
                      <span key={i} style={{ fontSize: 11, padding: '1px 7px', borderRadius: 3, background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' }}>🔧 {t}</span>
                    ))}
                    {turn.tool_names.length > 3 && <span style={{ fontSize: 11, color: '#6b7280' }}>+{turn.tool_names.length - 3} more</span>}
                    {turn.skill_names.slice(0, 2).map((s, i) => (
                      <span key={`sk-${i}`} style={{ fontSize: 11, padding: '1px 7px', borderRadius: 3, background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}>🎯 {s}</span>
                    ))}
                    {turn.skill_names.length > 2 && <span style={{ fontSize: 11, color: '#6b7280' }}>+{turn.skill_names.length - 2} more</span>}
                    {turn.tool_failures > 0 && <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 3, background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}>{turn.tool_failures} failed</span>}
                    {turn.file_count > 0 && <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 3, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>📄 {turn.file_count}</span>}
                  </div>
                )}
              </div>
              {/* Right: time / duration / tokens / response label */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <Tooltip text={fmtDateTime(turn.timestamp)}>
                  <div style={{ fontSize: 12, color: '#6b7280', cursor: 'default' }}>{fmtTime(turn.timestamp)}</div>
                </Tooltip>
                {/* Duration: only show for non-retry turns — wall time is misleading for retried turns */}
                {turn.duration_seconds > 0 && turn.retry_count <= 1 && (
                  <div style={{ fontSize: 11, marginTop: 2, color: isSlow ? '#f59e0b' : '#9ca3af', fontWeight: isSlow ? 600 : 400 }}>
                    {fmtDuration(turn.duration_seconds)}
                  </div>
                )}
                {turn.total_tokens > 0 && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{turn.total_tokens.toLocaleString()} tok</div>}
                {rLabel && (
                  <div style={{ marginTop: 3 }}>
                    <Tooltip text={`Response length: ${turn.final_length} chars`}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 3, background: rLabel.color + '15', color: rLabel.color, border: `1px solid ${rLabel.color}33`, cursor: 'default' }}>
                        {rLabel.label}
                      </span>
                    </Tooltip>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── View 3: Turn Detail ───────────────────────────────────────────────────────

const EVENT_META: Record<string, { icon: string; label: string; color: string }> = {
  user:                 { icon: '🧑', label: 'User',        color: '#3b82f6' },
  'chat.reasoning':     { icon: '🤔', label: 'Reasoning',   color: '#8b5cf6' },
  'chat.tool_call':     { icon: '🔧', label: 'Tool Call',   color: '#f59e0b' },
  'chat.tool_result':   { icon: '',  label: 'Tool Result', color: '#10b981' },
  'chat.final':         { icon: '💬', label: 'Response',    color: '#6366f1' },
  'chat.file':          { icon: '📄', label: 'File',        color: '#06b6d4' },
  'chat.usage_summary': { icon: '📊', label: 'Usage',       color: '#6b7280' },
  'chat.error':         { icon: '🚨', label: 'Error',       color: '#ef4444' },
};

function RecordCard({ rec, isRetry, displayDelta }: { rec: HistoryRecord; isRetry: boolean; displayDelta: number | null }) {
  const key = rec.role === 'user' ? 'user' : (rec.event_type ?? '');
  const meta = EVENT_META[key] ?? { icon: '•', label: rec.event_type ?? rec.role, color: '#6b7280' };
  const icon  = key === 'chat.tool_result' ? (rec.error_type ? '❌' : '✅') : meta.icon;
  const color = (key === 'chat.tool_result' && rec.error_type) ? '#ef4444' : meta.color;
  const danger = isDangerous(rec);

  const headerLabel = key === 'chat.tool_call'
    ? `${meta.label}: ${rec.tool_name ?? (rec.tool_call as Record<string, unknown>)?.name ?? ''}`
    : key === 'chat.tool_result' ? `${meta.label}: ${rec.tool_name ?? ''}` : meta.label;

  // Body text
  const bodyText = key === 'chat.error'
    ? (rec.error ?? rec.error_detail ?? rec.content ?? '')
    : (rec.content ?? '');

  // Pre-format tool call arguments
  const fmtArgs = key === 'chat.tool_call' ? (() => {
    const args = (rec.tool_call as Record<string, unknown>)?.arguments ?? rec.content;
    try { return JSON.stringify(typeof args === 'string' ? JSON.parse(args) : args, null, 2); }
    catch { return String(args ?? ''); }
  })() : '';

  const resultText = key === 'chat.tool_result' ? (rec.result ?? rec.content ?? '') : '';

  // Collapse only when content is actually long (>1200 chars)
  const COLLAPSE_THRESHOLD = 1200;
  const needsExpand =
    (key === 'chat.reasoning' && bodyText.length > COLLAPSE_THRESHOLD)
    || (key === 'chat.tool_call' && fmtArgs.length > COLLAPSE_THRESHOLD)
    || (key === 'chat.tool_result' && (!!rec.error_type || resultText.length > COLLAPSE_THRESHOLD))
    || (key === 'chat.file' && bodyText.length > COLLAPSE_THRESHOLD)
    || (key === 'chat.error' && bodyText.length > COLLAPSE_THRESHOLD);

  const [expanded, setExpanded] = useState(false);

  // displayDelta is computed by TurnDetailView and tracks time within the current attempt,
  // resetting to 0 at the start of each attempt (after a gap separator). This avoids showing
  // "+56s" when the actual attempt took ~1s (the 56s was idle time between retries).

  return (
    <div style={{ border: `1px solid ${color}33`, borderLeft: `3px solid ${danger ? '#ef4444' : color}`, borderRadius: 6, marginBottom: 8, background: '#fff', overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: needsExpand ? 'pointer' : 'default', background: danger ? '#fef2f2' : color + '08' }}
        onClick={() => needsExpand && setExpanded(x => !x)}
      >
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontWeight: 600, fontSize: 13, color, flex: 1 }}>{headerLabel}</span>
        {danger && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}>⚠ DANGEROUS</span>}
        {isRetry && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>↻ retry</span>}
        {/* Timing: absolute time + elapsed time within this attempt */}
        <span style={{ fontSize: 11, color: '#9ca3af', textAlign: 'right', flexShrink: 0 }}>
          <span>{fmtTime(rec.timestamp)}</span>
          {displayDelta != null && displayDelta > 0 && (
            <Tooltip text={`${fmtDelta(displayDelta)} since start of this attempt`}>
              <span style={{ marginLeft: 5, color: displayDelta > 10 ? '#f59e0b' : '#d1d5db', cursor: 'help' }}>
                {fmtDelta(displayDelta)}
              </span>
            </Tooltip>
          )}
        </span>
        {needsExpand && <span style={{ fontSize: 12, color: '#9ca3af' }}>{expanded ? '▲' : '▼'}</span>}
      </div>

      {/* Always-visible body for user + response */}
      {(key === 'user' || key === 'chat.final') && bodyText && (
        <div style={{ padding: '8px 12px', fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap', wordBreak: 'break-word', borderTop: `1px solid ${color}22` }}>
          {bodyText}
        </div>
      )}

      {/* Tool call: show formatted args inline when short, expanded when long */}
      {key === 'chat.tool_call' && !needsExpand && fmtArgs && (
        <pre style={{ margin: 0, padding: '8px 12px', fontSize: 12, color: '#1e293b', whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#f8fafc', borderTop: `1px solid ${color}22` }}>
          {fmtArgs}
        </pre>
      )}
      {key === 'chat.tool_call' && needsExpand && expanded && (
        <div style={{ padding: '8px 12px', borderTop: `1px solid ${color}22` }}>
          <pre style={{ margin: 0, fontSize: 12, background: '#f8fafc', borderRadius: 4, padding: '8px', overflowX: 'auto', color: '#1e293b', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {fmtArgs}
          </pre>
        </div>
      )}
      {key === 'chat.tool_call' && needsExpand && !expanded && (
        <div style={{ padding: '4px 12px 8px', fontSize: 12, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderTop: `1px solid ${color}22` }}>
          {fmtArgs.slice(0, 200)}…
        </div>
      )}

      {/* Tool result: show inline when short */}
      {key === 'chat.tool_result' && !needsExpand && resultText && (
        <pre style={{ margin: 0, padding: '8px 12px', fontSize: 12, color: '#374151', whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#f8fafc', borderTop: `1px solid ${color}22`, maxHeight: 200, overflowY: 'auto' }}>
          {resultText}
        </pre>
      )}
      {key === 'chat.tool_result' && needsExpand && expanded && (
        <div style={{ padding: '8px 12px', borderTop: `1px solid ${color}22` }}>
          {rec.error_type && <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 6 }}><strong>{rec.error_type}</strong>{rec.error_detail ? `: ${rec.error_detail}` : ''}</div>}
          <pre style={{ margin: 0, fontSize: 12, background: '#f8fafc', borderRadius: 4, padding: '8px', overflowX: 'auto', color: '#1e293b', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 300, overflowY: 'auto' }}>
            {resultText}
          </pre>
        </div>
      )}
      {key === 'chat.tool_result' && needsExpand && !expanded && (
        <div style={{ padding: '4px 12px 8px', fontSize: 12, color: rec.error_type ? '#dc2626' : '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderTop: `1px solid ${color}22` }}>
          {rec.error_type ? `${rec.error_type}: ` : ''}{resultText.slice(0, 200)}…
        </div>
      )}

      {/* Other types: short content inline, long content collapsible */}
      {(key === 'chat.reasoning' || key === 'chat.file' || key === 'chat.error') && !needsExpand && bodyText && (
        <div style={{ padding: '6px 12px 8px', fontSize: 12, color: key === 'chat.error' ? '#dc2626' : '#374151', whiteSpace: 'pre-wrap', wordBreak: 'break-word', borderTop: `1px solid ${color}22`, fontStyle: key === 'chat.reasoning' ? 'italic' : 'normal' }}>
          {bodyText}
        </div>
      )}
      {(key === 'chat.reasoning' || key === 'chat.file' || key === 'chat.error') && needsExpand && !expanded && (
        <div style={{ padding: '4px 12px 8px', fontSize: 12, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderTop: `1px solid ${color}22` }}>
          {bodyText.slice(0, 200)}…
        </div>
      )}
      {(key === 'chat.reasoning' || key === 'chat.file' || key === 'chat.error') && needsExpand && expanded && (
        <div style={{ padding: '8px 12px', borderTop: `1px solid ${color}22` }}>
          <div style={{ fontSize: 13, color: key === 'chat.error' ? '#dc2626' : '#374151', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontStyle: key === 'chat.reasoning' ? 'italic' : 'normal' }}>
            {bodyText}
          </div>
        </div>
      )}

      {/* Usage summary chips */}
      {key === 'chat.usage_summary' && (
        <div style={{ padding: '6px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {rec.total_tokens != null && <span style={chipStyle}>{rec.total_tokens.toLocaleString()} tokens</span>}
          {rec.ttft_ms != null && <Tooltip text="Time to first token"><span style={{ ...chipStyle, cursor: 'help' }}>TTFT {rec.ttft_ms.toFixed(0)}ms</span></Tooltip>}
          {rec.tpot_ms != null && <Tooltip text="Time per output token"><span style={{ ...chipStyle, cursor: 'help' }}>TPOT {rec.tpot_ms.toFixed(1)}ms</span></Tooltip>}
          {rec.total_latency_ms != null && <Tooltip text="Total LLM latency"><span style={{ ...chipStyle, cursor: 'help' }}>{(rec.total_latency_ms / 1000).toFixed(1)}s latency</span></Tooltip>}
        </div>
      )}
    </div>
  );
}

/// Gap threshold: if two consecutive records are more than this apart, show an idle separator
const IDLE_GAP_THRESHOLD_S = 30;

function TurnDetailView() {
  const { selectedSession, selectedTurnId, turns, turnRecords, loading, error, back, clearError } = useTraceHoundStore();
  const turn = turns.find(t => t.turn_id === selectedTurnId);
  const retrySet = useMemo(() => buildRetrySet(turnRecords), [turnRecords]);

  // Build display list: inject idle gap separators between records that are far apart.
  // Also compute displayDelta per record = elapsed time within the current attempt,
  // resetting to 0 whenever a new attempt starts (right after a separator).
  // This means the first record of each attempt shows no "+Xs", and subsequent records
  // show time elapsed within that attempt — never the misleading idle gap duration.
  const displayItems = useMemo(() => {
    type Item =
      | { type: 'record'; rec: HistoryRecord; displayDelta: number | null }
      | { type: 'gap'; seconds: number };
    const items: Item[] = [];
    let attemptStartTs = 0;
    let prevTs = 0;

    turnRecords.forEach((rec, i) => {
      const ts = rec.timestamp ?? 0;

      if (i === 0) {
        attemptStartTs = ts;
        prevTs = ts;
        items.push({ type: 'record', rec, displayDelta: null });
        return;
      }

      const deltaFromPrev = ts - prevTs;

      if (deltaFromPrev > IDLE_GAP_THRESHOLD_S) {
        // Large idle gap: separator + reset attempt clock
        items.push({ type: 'gap', seconds: deltaFromPrev });
        attemptStartTs = ts;
        // First record of the new attempt — no delta to show
        items.push({ type: 'record', rec, displayDelta: null });
      } else {
        const attemptDelta = ts - attemptStartTs;
        items.push({ type: 'record', rec, displayDelta: attemptDelta > 0 ? attemptDelta : null });
      }

      prevTs = ts;
    });

    return items;
  }, [turnRecords]);

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <button style={btnStyle} onClick={back}>← Back</button>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ ...titleStyle, marginBottom: 0, fontSize: 15 }}>
              Turn #{(turn?.turn_index ?? 0) + 1}
              {selectedSession?.title && <span style={{ fontWeight: 400, color: '#6b7280', fontSize: 13, marginLeft: 8 }}>— {selectedSession.title}</span>}
            </h2>
            {turn?.timestamp && (
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                {fmtDateTime(turn.timestamp)}
                {/* Don't show total wall-time duration for retried turns — it includes idle gaps between retries */}
                {turn.duration_seconds > 0 && turn.retry_count <= 1 && (
                  <span style={{ marginLeft: 8 }}>· {fmtDuration(turn.duration_seconds)}</span>
                )}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
          {turn && <QualityChip label={outcomeLabel(turn)} breakdown={turn.issues} score={null} />}
          {turn && turn.total_tokens > 0 && <span style={chipStyle}>{turn.total_tokens.toLocaleString()} tok</span>}
          {turn && turn.tool_names.length > 0 && <span style={{ ...chipStyle, color: '#f59e0b', background: '#fffbeb', border: '1px solid #fde68a' }}>{turn.tool_names.length} tool{turn.tool_names.length !== 1 ? 's' : ''}</span>}
          {turn && turn.skill_names.length > 0 && <span style={{ ...chipStyle, color: '#7c3aed', background: '#f5f3ff', border: '1px solid #ddd6fe' }}>🎯 {turn.skill_names.length} skill{turn.skill_names.length !== 1 ? 's' : ''}</span>}
          {turn && turn.tool_failures > 0 && <span style={{ ...chipStyle, color: '#dc2626', background: '#fee2e2', border: '1px solid #fca5a5' }}>{turn.tool_failures} failed</span>}
          {turn && turn.file_count > 0 && <span style={{ ...chipStyle, color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0' }}>📄 {turn.file_count}</span>}
          {turn && turn.retry_count > 1 && (
            <Tooltip text={`This request was attempted ${turn.retry_count} times. Each retry was triggered when a new message arrived while the original was still pending. Idle time between attempts is shown as grey separators in the timeline below.`}>
              <span style={{ ...chipStyle, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', cursor: 'help' }}>
                {turn.retry_count} attempts
              </span>
            </Tooltip>
          )}
          <button style={{ ...btnStyle, fontSize: 12 }} title="Download this turn's trajectory as JSON"
            onClick={() => downloadJson(turnRecords, `turn-${selectedTurnId?.slice(0, 8) ?? 'export'}.json`)}
            disabled={turnRecords.length === 0}>
            ⬇ JSON
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onClose={clearError} />}
      {loading && <div style={emptyStyle}>Loading trajectory…</div>}
      {!loading && turnRecords.length === 0 && <div style={emptyStyle}>No records found for this turn.</div>}

      {displayItems.map((item, i) => {
        if (item.type === 'gap') {
          return (
            <div key={`gap-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 8px', color: '#9ca3af', fontSize: 11 }}>
              <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
              <span style={{ flexShrink: 0, background: '#f9fafb', border: '1px solid #e5e7eb', padding: '2px 10px', borderRadius: 10, color: '#9ca3af', fontSize: 11 }}>
                ⏸ {fmtDuration(item.seconds)} idle — retry triggered by next incoming message
              </span>
              <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            </div>
          );
        }
        const rec = item.rec;
        return <RecordCard key={rec.id ?? `${rec.event_type}-${i}`} rec={rec} isRetry={retrySet.has(rec.id)} displayDelta={item.displayDelta} />;
      })}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function TraceHoundPanel({ isConnected }: TraceHoundPanelProps) {
  const { selectedSessionId, selectedTurnId } = useTraceHoundStore();
  if (selectedTurnId) return <TurnDetailView />;
  if (selectedSessionId) return <TurnListView isConnected={isConnected} />;
  return <SessionListView isConnected={isConnected} />;
}
