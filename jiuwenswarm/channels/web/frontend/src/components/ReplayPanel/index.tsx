/**
 * ReplayPanel — Session Replay / Trajectory Viewer
 *
 * Three views:
 *   1. Session List — pick any past session
 *   2. Turn List    — enriched cards + collapsible analytics panel
 *   3. Turn Detail  — filtered trajectory with quality breakdown & JSON export
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useReplayStore, type HistoryRecord, type TurnSummary } from '../../stores/replayStore';

// ── Props ─────────────────────────────────────────────────────────────────────

interface ReplayPanelProps { isConnected: boolean; }

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

/** Show time as HH:MM:SS; for turn cards we want precision, not "3h ago" */
function fmtTime(ts: number): string {
  if (!ts) return '';
  return new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/** Full date+time string for tooltips and headers */
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
  const d = new Date(ts * 1000);
  return d.toLocaleDateString();
}

function fmtDuration(s: number): string {
  if (s <= 0) return '';
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = Math.round(s % 60);
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

function modeBadge(mode?: string | null): React.ReactNode {
  if (!mode || mode === 'unknown') return null;
  const colors: Record<string, string> = {
    'agent.plan': '#3b82f6', 'code.plan': '#8b5cf6', team: '#10b981',
  };
  const color = colors[mode] ?? '#6b7280';
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
      background: color + '18', color, border: `1px solid ${color}44`,
      marginLeft: 6, textTransform: 'uppercase', letterSpacing: '0.04em',
    }}>{mode}</span>
  );
}

/** Quality chip: label + breakdown tooltip */
function qualityChip(label: string | null, breakdown: string[], score: number | null): React.ReactNode {
  if (!label) return null;
  const color = label === 'good' ? '#10b981' : label === 'fair' ? '#f59e0b'
    : label === 'poor' ? '#ef4444' : '#9ca3af';
  const tip = [
    `Score: ${score != null ? score.toFixed(2) : '—'}`,
    '─────────────────',
    ...breakdown,
  ].join('\n');
  return (
    <span title={tip} style={{
      fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 4,
      background: color + '18', color, border: `1px solid ${color}44`, cursor: 'help',
    }}>
      {label.toUpperCase()}
    </span>
  );
}

function queryTypeBadge(qt: string | null | undefined): React.ReactNode {
  if (!qt || qt === 'general') return null;
  const map: Record<string, string> = {
    coding: '💻', debug: '🐛', file_op: '📁', analysis: '🔍', question: '❓',
  };
  return (
    <span style={{
      fontSize: 10, padding: '1px 6px', borderRadius: 3,
      background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb',
    }}>
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
  /sudo\s+rm/i, /mkfs/i, /dd\s+if=/i, /chmod\s+777/i,
  />\s*\/dev\/sd/i, /truncate.*--size\s+0/i,
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
    <button
      style={{ ...btnStyle, fontSize: 11, padding: '2px 8px' }}
      onClick={() => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}
    >
      {copied ? '✓ copied' : '⎘ copy path'}
    </button>
  );
}

function ErrorBanner({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div style={{
      background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6,
      padding: '8px 12px', marginBottom: 12,
      display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#991b1b',
    }}>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#991b1b' }}>×</button>
    </div>
  );
}

// ── Analytics Panel ───────────────────────────────────────────────────────────

function AnalyticsPanel({ turns }: { turns: TurnSummary[] }) {
  if (turns.length === 0) return null;

  // Quality distribution
  const qualCounts: Record<string, number> = { good: 0, fair: 0, poor: 0, failed: 0 };
  turns.forEach(t => { if (t.quality_label) qualCounts[t.quality_label] = (qualCounts[t.quality_label] ?? 0) + 1; });

  // Error category breakdown
  const errCats: Record<string, number> = {};
  turns.filter(t => t.has_error && t.error_category).forEach(t => {
    errCats[t.error_category!] = (errCats[t.error_category!] ?? 0) + 1;
  });

  // Query type breakdown
  const qtCounts: Record<string, number> = {};
  turns.forEach(t => { if (t.query_type) qtCounts[t.query_type] = (qtCounts[t.query_type] ?? 0) + 1; });

  // Tool usage frequency
  const toolCounts: Record<string, number> = {};
  turns.forEach(t => t.tool_names.forEach(n => { toolCounts[n] = (toolCounts[n] ?? 0) + 1; }));
  const topTools = Object.entries(toolCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Max tokens across turns for bar scaling
  const maxTok = Math.max(...turns.map(t => t.total_tokens), 1);
  const maxDur = Math.max(...turns.map(t => t.duration_seconds), 1);

  const qualColor: Record<string, string> = {
    good: '#10b981', fair: '#f59e0b', poor: '#ef4444', failed: '#9ca3af',
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>

        {/* Quality Distribution */}
        <div style={{ background: '#f9fafb', borderRadius: 8, padding: 14, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10 }}>
            Quality distribution
          </div>
          {Object.entries(qualCounts).filter(([, v]) => v > 0).map(([label, count]) => (
            <div key={label} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b7280', marginBottom: 2 }}>
                <span style={{ fontWeight: 600, color: qualColor[label] }}>{label.toUpperCase()}</span>
                <span>{count} turn{count !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3 }}>
                <div style={{ height: 6, width: `${(count / turns.length) * 100}%`, background: qualColor[label], borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Quality timeline */}
        <div style={{ background: '#f9fafb', borderRadius: 8, padding: 14, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10 }}>
            Quality per turn (hover for score)
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 60 }}>
            {turns.map(t => {
              const score = t.quality_score ?? 0;
              const color = qualColor[t.quality_label ?? 'failed'] ?? '#9ca3af';
              return (
                <div
                  key={t.turn_id}
                  title={`Turn #${t.turn_index + 1}: ${t.quality_label?.toUpperCase()} (${score.toFixed(2)})\n${t.user_content || '(no message)'}`}
                  style={{
                    flex: 1, minWidth: 4, maxWidth: 20,
                    height: `${Math.max(8, score * 60)}px`,
                    background: color, borderRadius: 2, cursor: 'default',
                  }}
                />
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9ca3af', marginTop: 4 }}>
            <span>Turn 1</span><span>Turn {turns.length}</span>
          </div>
        </div>

        {/* Token usage per turn */}
        {maxTok > 0 && (
          <div style={{ background: '#f9fafb', borderRadius: 8, padding: 14, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10 }}>
              Tokens per turn
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 60 }}>
              {turns.map(t => (
                <div
                  key={t.turn_id}
                  title={`Turn #${t.turn_index + 1}: ${t.total_tokens.toLocaleString()} tokens`}
                  style={{
                    flex: 1, minWidth: 4, maxWidth: 20,
                    height: `${Math.max(t.total_tokens > 0 ? 4 : 0, (t.total_tokens / maxTok) * 60)}px`,
                    background: '#6366f1', borderRadius: 2, opacity: 0.7, cursor: 'default',
                  }}
                />
              ))}
            </div>
            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>
              Total: {turns.reduce((s, t) => s + t.total_tokens, 0).toLocaleString()} tokens
            </div>
          </div>
        )}

        {/* Duration per turn */}
        {maxDur > 0 && (
          <div style={{ background: '#f9fafb', borderRadius: 8, padding: 14, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10 }}>
              Duration per turn
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 60 }}>
              {turns.map(t => {
                const pct = t.duration_seconds / maxDur;
                const color = pct > 0.9 ? '#ef4444' : pct > 0.6 ? '#f59e0b' : '#10b981';
                return (
                  <div
                    key={t.turn_id}
                    title={`Turn #${t.turn_index + 1}: ${fmtDuration(t.duration_seconds)}`}
                    style={{
                      flex: 1, minWidth: 4, maxWidth: 20,
                      height: `${Math.max(t.duration_seconds > 0 ? 4 : 0, pct * 60)}px`,
                      background: color, borderRadius: 2, cursor: 'default',
                    }}
                  />
                );
              })}
            </div>
            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>
              Slowest: {fmtDuration(maxDur)}
            </div>
          </div>
        )}

        {/* Error breakdown */}
        {Object.keys(errCats).length > 0 && (
          <div style={{ background: '#fff5f5', borderRadius: 8, padding: 14, border: '1px solid #fecaca' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', marginBottom: 10 }}>
              Error categories ({Object.values(errCats).reduce((a, b) => a + b, 0)} errors)
            </div>
            {Object.entries(errCats).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
              <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: '#374151' }}>{cat}</span>
                <span style={{ fontWeight: 600, color: '#dc2626' }}>×{count}</span>
              </div>
            ))}
          </div>
        )}

        {/* Query types */}
        {Object.keys(qtCounts).length > 1 && (
          <div style={{ background: '#f9fafb', borderRadius: 8, padding: 14, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10 }}>
              Query types
            </div>
            {Object.entries(qtCounts).sort((a, b) => b[1] - a[1]).map(([qt, count]) => {
              const icons: Record<string, string> = { coding: '💻', debug: '🐛', file_op: '📁', analysis: '🔍', question: '❓', general: '💬' };
              return (
                <div key={qt} style={{ marginBottom: 5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                    <span style={{ color: '#374151' }}>{icons[qt] ?? ''} {qt}</span>
                    <span style={{ color: '#6b7280' }}>{count}</span>
                  </div>
                  <div style={{ height: 4, background: '#e5e7eb', borderRadius: 2 }}>
                    <div style={{ height: 4, width: `${(count / turns.length) * 100}%`, background: '#6366f1', borderRadius: 2 }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tool usage */}
        {topTools.length > 0 && (
          <div style={{ background: '#f9fafb', borderRadius: 8, padding: 14, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10 }}>
              Tool usage (top {topTools.length})
            </div>
            {topTools.map(([tool, count]) => (
              <div key={tool} style={{ marginBottom: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                  <span style={{ color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>🔧 {tool}</span>
                  <span style={{ color: '#6b7280', flexShrink: 0 }}>×{count}</span>
                </div>
                <div style={{ height: 4, background: '#e5e7eb', borderRadius: 2 }}>
                  <div style={{ height: 4, width: `${(count / topTools[0][1]) * 100}%`, background: '#f59e0b', borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

// ── View 1: Session List ──────────────────────────────────────────────────────

function SessionListView({ isConnected }: { isConnected: boolean }) {
  const { sessions, loading, error, loadSessions, selectSession, clearError } = useReplayStore();
  useEffect(() => { loadSessions(); }, []); // eslint-disable-line

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>Session Replay</h2>
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
            <span style={{ fontSize: 12, color: '#6b7280', flexShrink: 0 }}>
              {relativeTime(s.last_message_at ?? s.created_at ?? 0)}
            </span>
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
  const { selectedSession, turns, sessionStats, loading, error, selectTurn, back, clearError } = useReplayStore();
  const [filterErrors, setFilterErrors] = useState(false);
  const [filterTools,  setFilterTools]  = useState(false);
  const [filterSlow,   setFilterSlow]   = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const p90dur = useMemo(() => {
    const sorted = [...turns].map(t => t.duration_seconds).filter(d => d > 0).sort((a, b) => a - b);
    if (!sorted.length) return 0;
    return sorted[Math.floor(sorted.length * 0.9)] ?? sorted[sorted.length - 1];
  }, [turns]);

  const visibleTurns = useMemo(() => turns.filter(t => {
    if (filterErrors && !t.has_error) return false;
    if (filterTools  && t.tool_names.length === 0) return false;
    if (filterSlow   && t.duration_seconds <= p90dur) return false;
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
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <button
            style={{ ...btnStyle, fontSize: 12, color: showAnalytics ? '#6366f1' : '#374151', borderColor: showAnalytics ? '#6366f1' : '#d1d5db' }}
            onClick={() => setShowAnalytics(x => !x)}
          >
            📊 Analytics
          </button>
          <span style={{ fontSize: 13, color: '#6b7280' }}>{turns.length} turns</span>
        </div>
      </div>

      {error && <ErrorBanner message={error} onClose={clearError} />}

      {/* Session stats bar */}
      {sessionStats && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', padding: '8px 0 10px', fontSize: 12, color: '#6b7280', borderBottom: '1px solid #f3f4f6' }}>
            <span><strong style={{ color: '#374151' }}>{sessionStats.total_turns}</strong> turns</span>
            {sessionStats.error_count > 0 && (
              <span style={{ color: '#dc2626' }}><strong>{sessionStats.error_count}</strong> with errors</span>
            )}
            {sessionStats.total_tokens > 0 && (
              <span><strong style={{ color: '#374151' }}>{sessionStats.total_tokens.toLocaleString()}</strong> tokens</span>
            )}
            {sessionStats.date_range && <span>{sessionStats.date_range}</span>}
          </div>
          {/* Raw log file path */}
          {sessionStats.history_file_path && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 11, color: '#9ca3af', flexWrap: 'wrap' }}>
              <span>📁 Raw log:</span>
              <code style={{ fontSize: 10, color: '#6b7280', background: '#f3f4f6', padding: '1px 5px', borderRadius: 3, wordBreak: 'break-all' }}>
                {sessionStats.history_file_path}
              </code>
              <CopyButton text={sessionStats.history_file_path} />
            </div>
          )}
        </div>
      )}

      {/* Analytics panel (collapsible) */}
      {showAnalytics && <AnalyticsPanel turns={turns} />}

      {/* Filter bar */}
      {turns.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
          {([
            { key: 'errors', label: '⚠ Errors only', active: filterErrors, toggle: () => setFilterErrors(x => !x) },
            { key: 'tools',  label: '🔧 Has tools',   active: filterTools,  toggle: () => setFilterTools(x => !x) },
            { key: 'slow',   label: '⏱ Slow turns',   active: filterSlow,   toggle: () => setFilterSlow(x => !x),
              title: `Show turns that took longer than 90% of other turns in this session (threshold: ${fmtDuration(p90dur)})` },
          ] as const).map((f) => (
            <button key={f.key} onClick={f.toggle} title={'title' in f ? f.title : undefined} style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 12,
              border: `1px solid ${f.active ? '#6366f1' : '#e5e7eb'}`,
              background: f.active ? '#eef2ff' : '#f9fafb',
              color: f.active ? '#6366f1' : '#6b7280',
              cursor: 'pointer', fontWeight: f.active ? 600 : 400,
            }}>
              {f.label}
            </button>
          ))}
          {anyFilter && <span style={{ fontSize: 11, color: '#9ca3af' }}>{visibleTurns.length}/{turns.length}</span>}
        </div>
      )}

      {loading && <div style={emptyStyle}>Loading turns…</div>}
      {!loading && turns.length === 0 && <div style={emptyStyle}>No turns found for this session.</div>}
      {!loading && turns.length > 0 && visibleTurns.length === 0 && <div style={emptyStyle}>No turns match the active filters.</div>}

      {visibleTurns.map((turn) => {
        const rLabel = responseLabel(turn.final_length);
        const isSlow = p90dur > 0 && turn.duration_seconds > p90dur;
        return (
          <div key={turn.turn_id}
            style={{ ...cardStyle, borderLeftWidth: turn.has_error ? 3 : 1, borderLeftColor: turn.has_error ? '#fca5a5' : '#e5e7eb' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366f1')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = turn.has_error ? '#fca5a5' : '#e5e7eb')}
            onClick={() => isConnected && selectTurn(turn.turn_id)}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Row 1: badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', background: '#eef2ff', borderRadius: 4, padding: '1px 6px', flexShrink: 0 }}>
                    #{turn.turn_index + 1}
                  </span>
                  {modeBadge(turn.mode)}
                  {qualityChip(turn.quality_label, turn.quality_breakdown, turn.quality_score)}
                  {queryTypeBadge(turn.query_type)}
                  {turn.has_error && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}>
                      ⚠ {turn.error_category ?? 'error'}
                    </span>
                  )}
                  {turn.retry_count > 1 && (
                    <span
                      title={`The agent attempted this request ${turn.retry_count} times before stopping`}
                      style={{ fontSize: 11, padding: '1px 6px', borderRadius: 4, background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', cursor: 'help' }}
                    >
                      {turn.retry_count} retries
                    </span>
                  )}
                </div>
                {/* Row 2: user message */}
                <div style={{ fontSize: 13, color: turn.user_content ? '#111827' : '#9ca3af', fontStyle: turn.user_content ? 'normal' : 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {turn.user_content || '(no user message)'}
                </div>
                {/* Row 3: tool / file badges */}
                {(turn.tool_names.length > 0 || turn.tool_failures > 0 || turn.file_count > 0) && (
                  <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                    {turn.tool_names.slice(0, 3).map((t, i) => (
                      <span key={i} style={{ fontSize: 11, padding: '1px 7px', borderRadius: 3, background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' }}>
                        🔧 {t}
                      </span>
                    ))}
                    {turn.tool_names.length > 3 && <span style={{ fontSize: 11, color: '#6b7280' }}>+{turn.tool_names.length - 3} more</span>}
                    {turn.tool_failures > 0 && (
                      <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 3, background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}>
                        {turn.tool_failures} failed
                      </span>
                    )}
                    {turn.file_count > 0 && (
                      <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 3, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                        📄 {turn.file_count} file{turn.file_count > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {/* Right: time + duration + response label */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 12, color: '#6b7280' }} title={fmtDateTime(turn.timestamp)}>
                  {fmtTime(turn.timestamp)}
                </div>
                {turn.duration_seconds > 0 && (
                  <div style={{ fontSize: 11, marginTop: 2, color: isSlow ? '#f59e0b' : '#9ca3af', fontWeight: isSlow ? 600 : 400 }}
                    title={isSlow ? `Slower than 90% of turns (slowest 10% threshold: ${fmtDuration(p90dur)})` : `Duration: ${fmtDuration(turn.duration_seconds)}`}>
                    {fmtDuration(turn.duration_seconds)}
                  </div>
                )}
                {turn.total_tokens > 0 && (
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
                    {turn.total_tokens.toLocaleString()} tok
                  </div>
                )}
                {rLabel && (
                  <div style={{ marginTop: 3 }}>
                    <span title={`Response length: ${turn.final_length} characters`} style={{ fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 3, background: rLabel.color + '15', color: rLabel.color, border: `1px solid ${rLabel.color}33` }}>
                      {rLabel.label}
                    </span>
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

// ── View 3: Turn Detail (Trajectory) ─────────────────────────────────────────

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

function RecordCard({ rec, isRetry }: { rec: HistoryRecord; isRetry: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const key = rec.role === 'user' ? 'user' : (rec.event_type ?? '');
  const meta = EVENT_META[key] ?? { icon: '•', label: rec.event_type ?? rec.role, color: '#6b7280' };
  const icon  = key === 'chat.tool_result' ? (rec.error_type ? '❌' : '✅') : meta.icon;
  const color = (key === 'chat.tool_result' && rec.error_type) ? '#ef4444' : meta.color;
  const danger = isDangerous(rec);

  const headerLabel = key === 'chat.tool_call'
    ? `${meta.label}: ${rec.tool_name ?? (rec.tool_call as Record<string, unknown>)?.name ?? ''}`
    : key === 'chat.tool_result' ? `${meta.label}: ${rec.tool_name ?? ''}`
    : meta.label;

  const isExpandable = ['chat.reasoning', 'chat.tool_call', 'chat.tool_result', 'chat.file', 'chat.error'].includes(key);
  const bodyText = key === 'chat.error'
    ? (rec.error ?? rec.error_detail ?? rec.content ?? '')
    : (rec.content ?? '');
  const previewText = bodyText.slice(0, 120);

  return (
    <div style={{ border: `1px solid ${color}33`, borderLeft: `3px solid ${danger ? '#ef4444' : color}`, borderRadius: 6, marginBottom: 8, background: '#fff', overflow: 'hidden' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: isExpandable ? 'pointer' : 'default', background: danger ? '#fef2f2' : color + '08' }}
        onClick={() => isExpandable && setExpanded(x => !x)}
      >
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontWeight: 600, fontSize: 13, color, flex: 1 }}>{headerLabel}</span>
        {danger && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}>⚠ DANGEROUS</span>
        )}
        {isRetry && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>↻ retry</span>
        )}
        <span style={{ fontSize: 11, color: '#9ca3af' }}>{fmtTime(rec.timestamp)}</span>
        {isExpandable && <span style={{ fontSize: 12, color: '#9ca3af' }}>{expanded ? '▲' : '▼'}</span>}
      </div>

      {(key === 'user' || key === 'chat.final') && rec.content && (
        <div style={{ padding: '8px 12px', fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap', wordBreak: 'break-word', borderTop: `1px solid ${color}22` }}>
          {rec.content}
        </div>
      )}

      {isExpandable && !expanded && previewText && (
        <div style={{ padding: '4px 12px 8px', fontSize: 12, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {previewText}{previewText.length >= 120 ? '…' : ''}
        </div>
      )}

      {isExpandable && expanded && (
        <div style={{ padding: '8px 12px', borderTop: `1px solid ${color}22` }}>
          {key === 'chat.tool_call' && (
            <pre style={{ margin: 0, fontSize: 12, background: '#f8fafc', borderRadius: 4, padding: '8px', overflowX: 'auto', color: '#1e293b', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {(() => {
                const args = (rec.tool_call as Record<string, unknown>)?.arguments ?? rec.content;
                try { return JSON.stringify(typeof args === 'string' ? JSON.parse(args) : args, null, 2); }
                catch { return String(args); }
              })()}
            </pre>
          )}
          {key === 'chat.tool_result' && (
            <>
              {rec.error_type && (
                <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 6 }}>
                  <strong>{rec.error_type}</strong>{rec.error_detail ? `: ${rec.error_detail}` : ''}
                </div>
              )}
              <pre style={{ margin: 0, fontSize: 12, background: '#f8fafc', borderRadius: 4, padding: '8px', overflowX: 'auto', color: '#1e293b', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 300, overflowY: 'auto' }}>
                {rec.result ?? rec.content}
              </pre>
            </>
          )}
          {key === 'chat.error' && (
            <div style={{ fontSize: 13, color: '#dc2626', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {rec.error ?? rec.error_detail ?? rec.content}
            </div>
          )}
          {(key === 'chat.reasoning' || key === 'chat.file') && (
            <div style={{ fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontStyle: key === 'chat.reasoning' ? 'italic' : 'normal' }}>
              {rec.content}
            </div>
          )}
        </div>
      )}

      {key === 'chat.usage_summary' && (
        <div style={{ padding: '6px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {rec.total_tokens != null && <span style={chipStyle}>{rec.total_tokens.toLocaleString()} tokens</span>}
          {rec.ttft_ms != null && <span style={chipStyle} title="Time to first token">TTFT {rec.ttft_ms.toFixed(0)}ms</span>}
          {rec.tpot_ms != null && <span style={chipStyle} title="Time per output token">TPOT {rec.tpot_ms.toFixed(1)}ms</span>}
          {rec.total_latency_ms != null && <span style={chipStyle} title="Total LLM latency">{(rec.total_latency_ms / 1000).toFixed(1)}s latency</span>}
        </div>
      )}
    </div>
  );
}

function TurnDetailView() {
  const { selectedSession, selectedTurnId, turns, turnRecords, loading, error, back, clearError } = useReplayStore();
  const turn = turns.find(t => t.turn_id === selectedTurnId);
  const retrySet = useMemo(() => buildRetrySet(turnRecords), [turnRecords]);

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <button style={btnStyle} onClick={back}>← Back</button>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ ...titleStyle, marginBottom: 0, fontSize: 15 }}>
              Turn #{(turn?.turn_index ?? 0) + 1}
              {selectedSession?.title && (
                <span style={{ fontWeight: 400, color: '#6b7280', fontSize: 13, marginLeft: 8 }}>— {selectedSession.title}</span>
              )}
            </h2>
            {turn?.timestamp && (
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                {fmtDateTime(turn.timestamp)}
                {turn.duration_seconds > 0 && <span style={{ marginLeft: 8 }}>· {fmtDuration(turn.duration_seconds)}</span>}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
          {turn && qualityChip(turn.quality_label, turn.quality_breakdown, turn.quality_score)}
          {turn && turn.total_tokens > 0 && <span style={chipStyle}>{turn.total_tokens.toLocaleString()} tok</span>}
          {turn && turn.tool_names.length > 0 && (
            <span style={{ ...chipStyle, color: '#f59e0b', background: '#fffbeb', border: '1px solid #fde68a' }}>
              {turn.tool_names.length} tool{turn.tool_names.length !== 1 ? 's' : ''}
            </span>
          )}
          {turn && turn.tool_failures > 0 && (
            <span style={{ ...chipStyle, color: '#dc2626', background: '#fee2e2', border: '1px solid #fca5a5' }}>
              {turn.tool_failures} failed
            </span>
          )}
          {turn && turn.file_count > 0 && (
            <span style={{ ...chipStyle, color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
              📄 {turn.file_count}
            </span>
          )}
          {turn && turn.retry_count > 1 && (
            <span title={`This request was attempted ${turn.retry_count} times`}
              style={{ ...chipStyle, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', cursor: 'help' }}>
              {turn.retry_count} retries
            </span>
          )}
          <button
            style={{ ...btnStyle, fontSize: 12 }}
            title="Download this turn's full trajectory as JSON"
            onClick={() => downloadJson(turnRecords, `turn-${selectedTurnId?.slice(0, 8) ?? 'export'}.json`)}
            disabled={turnRecords.length === 0}
          >
            ⬇ JSON
          </button>
        </div>
      </div>

      {/* Quality breakdown card */}
      {turn && turn.quality_breakdown && turn.quality_breakdown.length > 0 && (
        <div style={{
          marginBottom: 14, padding: '10px 14px', borderRadius: 6,
          background: '#f9fafb', border: '1px solid #e5e7eb', fontSize: 12,
        }}>
          <div style={{ fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            Why this score?
          </div>
          {turn.quality_breakdown.map((line, i) => (
            <div key={i} style={{
              color: line.startsWith('Base') ? '#6b7280' : line.includes('−') ? '#dc2626' : '#059669',
              marginBottom: 2,
            }}>
              {line}
            </div>
          ))}
        </div>
      )}

      {error && <ErrorBanner message={error} onClose={clearError} />}
      {loading && <div style={emptyStyle}>Loading trajectory…</div>}
      {!loading && turnRecords.length === 0 && <div style={emptyStyle}>No records found for this turn.</div>}

      {turnRecords.map((rec, i) => (
        <RecordCard key={rec.id ?? `${rec.event_type}-${i}`} rec={rec} isRetry={retrySet.has(rec.id)} />
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ReplayPanel({ isConnected }: ReplayPanelProps) {
  const { selectedSessionId, selectedTurnId } = useReplayStore();
  if (selectedTurnId) return <TurnDetailView />;
  if (selectedSessionId) return <TurnListView isConnected={isConnected} />;
  return <SessionListView isConnected={isConnected} />;
}
