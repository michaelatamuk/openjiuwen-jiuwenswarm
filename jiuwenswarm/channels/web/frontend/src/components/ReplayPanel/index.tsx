/**
 * ReplayPanel — Session Replay / Trajectory Viewer
 *
 * Three views:
 *   1. Session List    — pick any past session
 *   2. Turn List       — enriched turn cards with quality / duration / error info
 *   3. Turn Detail     — full ReAct trajectory (noise filtered, JSON export, danger flags)
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  useReplayStore,
  type HistoryRecord,
} from '../../stores/replayStore';

// ── Props ─────────────────────────────────────────────────────────────────────

interface ReplayPanelProps {
  isConnected: boolean;
}

// ── Shared styles ─────────────────────────────────────────────────────────────

/** Full-width panel that fills whatever space the app-section flex container gives it */
const panelStyle: React.CSSProperties = {
  padding: '20px 24px',
  height: '100%',
  width: '100%',
  flex: 1,
  overflowY: 'auto',
  boxSizing: 'border-box',
  fontFamily: 'var(--font-family, sans-serif)',
  minWidth: 0,
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 20,
  gap: 12,
  flexWrap: 'wrap',
};

const titleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: 'var(--text-primary, #111)',
  margin: 0,
};

const btnStyle: React.CSSProperties = {
  padding: '5px 12px',
  borderRadius: 6,
  border: '1px solid #d1d5db',
  background: '#f9fafb',
  cursor: 'pointer',
  fontSize: 13,
  color: '#374151',
  whiteSpace: 'nowrap',
};

const cardStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: '12px 16px',
  marginBottom: 10,
  cursor: 'pointer',
  background: '#fff',
  transition: 'border-color 0.15s',
};

const emptyStyle: React.CSSProperties = {
  padding: 40,
  textAlign: 'center',
  color: '#9ca3af',
  fontSize: 14,
};

const chipStyle: React.CSSProperties = {
  fontSize: 12,
  padding: '2px 8px',
  borderRadius: 4,
  background: '#f3f4f6',
  color: '#374151',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(ts: number): string {
  if (!ts) return '';
  const diff = Date.now() / 1000 - ts;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const d = new Date(ts * 1000);
  return d.toLocaleDateString();
}

function modeBadge(mode?: string | null): React.ReactNode {
  if (!mode || mode === 'unknown') return null;
  const colors: Record<string, string> = {
    'agent.plan': '#3b82f6',
    'code.plan':  '#8b5cf6',
    team:         '#10b981',
  };
  const color = colors[mode] ?? '#6b7280';
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
      background: color + '18', color, border: `1px solid ${color}44`,
      marginLeft: 6, textTransform: 'uppercase', letterSpacing: '0.04em',
    }}>
      {mode}
    </span>
  );
}

/** Quality label chip — label computed by backend, number in tooltip */
function qualityChip(score: number | null, label: string | null): React.ReactNode {
  if (score == null || label == null) return null;
  const color = label === 'good' ? '#10b981'
    : label === 'fair'   ? '#f59e0b'
    : label === 'poor'   ? '#ef4444'
    : '#9ca3af';  // failed
  const tooltip =
    `Quality score: ${score.toFixed(2)}\n` +
    `Scoring: base 0.5, +0.2 if response received,\n` +
    `-0.1 per error, -0.05 per tool failure (up to -0.15),\n` +
    `-0.05 if >30 s, -0.08 if >60 s, -0.03 per extra retry`;
  return (
    <span
      title={tooltip}
      style={{
        fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 4,
        background: color + '18', color, border: `1px solid ${color}44`,
        cursor: 'help',
      }}
    >
      {label.toUpperCase()}
    </span>
  );
}

function queryTypeBadge(qt: string | null | undefined): React.ReactNode {
  if (!qt || qt === 'general') return null;
  const icons: Record<string, string> = {
    coding: '💻', debug: '🐛', file_op: '📁', analysis: '🔍', question: '❓',
  };
  return (
    <span style={{
      fontSize: 10, padding: '1px 6px', borderRadius: 3,
      background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb',
    }}>
      {icons[qt] ?? ''} {qt}
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
  /rm\s+-rf/i, /rm\s+-r\s+-f/i,
  /DROP\s+TABLE/i, /DROP\s+DATABASE/i,
  /sudo\s+rm/i, /mkfs/i, /dd\s+if=/i,
  /chmod\s+777/i, />\s*\/dev\/sd/i,
  /truncate.*--size\s+0/i,
];

function isDangerous(rec: HistoryRecord): boolean {
  if (rec.event_type !== 'chat.tool_call') return false;
  const args = JSON.stringify((rec.tool_call as Record<string, unknown>)?.arguments ?? '')
    + (rec.content ?? '');
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
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ErrorBanner({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div style={{
      background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6,
      padding: '8px 12px', marginBottom: 12,
      display: 'flex', alignItems: 'center', gap: 8,
      fontSize: 13, color: '#991b1b',
    }}>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#991b1b' }}>
        ×
      </button>
    </div>
  );
}

// ── View 1: Session List ──────────────────────────────────────────────────────

function SessionListView({ isConnected }: { isConnected: boolean }) {
  const { sessions, loading, error, loadSessions, selectSession, clearError } = useReplayStore();

  useEffect(() => {
    loadSessions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>Session Replay</h2>
        <button
          style={btnStyle}
          onClick={loadSessions}
          disabled={loading || !isConnected}
          title="Reload session list"
        >
          {loading ? 'Loading…' : '↻ Refresh'}
        </button>
      </div>

      {error && <ErrorBanner message={error} onClose={clearError} />}

      {sessions.length === 0 && !loading && (
        <div style={emptyStyle}>No sessions found.</div>
      )}

      {sessions.map((s) => (
        <div
          key={s.session_id}
          style={cardStyle}
          onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366f1')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
          onClick={() => selectSession(s)}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#111827', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {s.title ?? s.session_id.slice(0, 24) + '…'}
              {modeBadge(s.mode)}
            </span>
            <span style={{ fontSize: 12, color: '#6b7280', flexShrink: 0 }}>
              {relativeTime(s.last_message_at ?? s.created_at ?? 0)}
            </span>
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: '#9ca3af' }}>
            {s.session_id.slice(0, 20)}…
            {s.message_count != null && (
              <span style={{ marginLeft: 8 }}>{s.message_count} messages</span>
            )}
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

  const p90dur = useMemo(() => {
    const sorted = [...turns]
      .map(t => t.duration_seconds)
      .filter(d => d > 0)
      .sort((a, b) => a - b);
    if (sorted.length === 0) return 0;
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
              {selectedSession?.title ?? selectedSession?.session_id?.slice(0, 24)}
              {modeBadge(selectedSession?.mode)}
            </h2>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
              {selectedSession?.session_id}
            </div>
          </div>
        </div>
        <span style={{ fontSize: 13, color: '#6b7280', flexShrink: 0 }}>{turns.length} turns</span>
      </div>

      {error && <ErrorBanner message={error} onClose={clearError} />}

      {/* Session stats bar */}
      {sessionStats && (
        <div style={{
          display: 'flex', gap: 20, flexWrap: 'wrap',
          padding: '8px 0 14px', fontSize: 12, color: '#6b7280',
          borderBottom: '1px solid #f3f4f6', marginBottom: 14,
        }}>
          <span><strong style={{ color: '#374151' }}>{sessionStats.total_turns}</strong> turns</span>
          {sessionStats.error_count > 0 && (
            <span style={{ color: '#dc2626' }}>
              <strong>{sessionStats.error_count}</strong> with errors
            </span>
          )}
          {sessionStats.total_tokens > 0 && (
            <span><strong style={{ color: '#374151' }}>{sessionStats.total_tokens.toLocaleString()}</strong> tokens</span>
          )}
          {sessionStats.date_range && <span>{sessionStats.date_range}</span>}
        </div>
      )}

      {/* Filter bar */}
      {turns.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
          {([
            { key: 'errors', label: '⚠ Errors',        active: filterErrors, toggle: () => setFilterErrors(x => !x) },
            { key: 'tools',  label: '🔧 Has tool calls', active: filterTools,  toggle: () => setFilterTools(x => !x) },
            { key: 'slow',   label: '🐢 Slow (>p90)',    active: filterSlow,   toggle: () => setFilterSlow(x => !x) },
          ] as const).map(f => (
            <button key={f.key} onClick={f.toggle} style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 12,
              border: `1px solid ${f.active ? '#6366f1' : '#e5e7eb'}`,
              background: f.active ? '#eef2ff' : '#f9fafb',
              color: f.active ? '#6366f1' : '#6b7280',
              cursor: 'pointer', fontWeight: f.active ? 600 : 400,
            }}>
              {f.label}
            </button>
          ))}
          {anyFilter && (
            <span style={{ fontSize: 11, color: '#9ca3af' }}>
              {visibleTurns.length}/{turns.length}
            </span>
          )}
        </div>
      )}

      {loading && <div style={emptyStyle}>Loading turns…</div>}
      {!loading && turns.length === 0 && <div style={emptyStyle}>No turns found for this session.</div>}
      {!loading && turns.length > 0 && visibleTurns.length === 0 && (
        <div style={emptyStyle}>No turns match the active filters.</div>
      )}

      {visibleTurns.map((turn) => {
        const rLabel = responseLabel(turn.final_length);
        const isSlow = p90dur > 0 && turn.duration_seconds > p90dur;
        return (
          <div
            key={turn.turn_id}
            style={{
              ...cardStyle,
              borderLeftWidth: turn.has_error ? 3 : 1,
              borderLeftColor: turn.has_error ? '#fca5a5' : '#e5e7eb',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366f1')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = turn.has_error ? '#fca5a5' : '#e5e7eb')}
            onClick={() => isConnected && selectTurn(turn.turn_id)}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Row 1: index + mode + quality label + error category */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: '#6366f1',
                    background: '#eef2ff', borderRadius: 4, padding: '1px 6px', flexShrink: 0,
                  }}>
                    #{turn.turn_index + 1}
                  </span>
                  {modeBadge(turn.mode)}
                  {qualityChip(turn.quality_score, turn.quality_label)}
                  {queryTypeBadge(turn.query_type)}
                  {turn.has_error && (
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                      background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5',
                    }}>
                      ⚠ {turn.error_category ?? 'error'}
                    </span>
                  )}
                  {turn.retry_count > 1 && (
                    <span style={{
                      fontSize: 11, padding: '1px 6px', borderRadius: 4,
                      background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a',
                    }}
                      title={`This request was attempted ${turn.retry_count} times`}
                    >
                      ↻ ×{turn.retry_count}
                    </span>
                  )}
                </div>

                {/* Row 2: user message preview */}
                <div style={{
                  fontSize: 13,
                  color: turn.user_content ? '#111827' : '#9ca3af',
                  fontStyle: turn.user_content ? 'normal' : 'italic',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {turn.user_content || '(no user message)'}
                </div>

                {/* Row 3: tool badges + failure count + file count */}
                {(turn.tool_names.length > 0 || turn.tool_failures > 0 || turn.file_count > 0) && (
                  <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                    {turn.tool_names.slice(0, 3).map((t, i) => (
                      <span key={i} style={{
                        fontSize: 11, padding: '1px 7px', borderRadius: 3,
                        background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb',
                      }}>
                        🔧 {t}
                      </span>
                    ))}
                    {turn.tool_names.length > 3 && (
                      <span style={{ fontSize: 11, color: '#6b7280' }}>
                        +{turn.tool_names.length - 3} more
                      </span>
                    )}
                    {turn.tool_failures > 0 && (
                      <span style={{
                        fontSize: 11, padding: '1px 7px', borderRadius: 3,
                        background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5',
                      }}>
                        {turn.tool_failures} failed
                      </span>
                    )}
                    {turn.file_count > 0 && (
                      <span style={{
                        fontSize: 11, padding: '1px 7px', borderRadius: 3,
                        background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0',
                      }}>
                        📄 {turn.file_count} file{turn.file_count > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Right column: time / tokens / duration / response label */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{relativeTime(turn.timestamp)}</div>
                {turn.total_tokens > 0 && (
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                    {turn.total_tokens.toLocaleString()} tok
                  </div>
                )}
                {turn.duration_seconds > 0 && (
                  <div style={{
                    fontSize: 11, marginTop: 2,
                    color: isSlow ? '#f59e0b' : '#9ca3af',
                    fontWeight: isSlow ? 600 : 400,
                  }}
                    title={isSlow ? `Slow (p90 is ${p90dur}s)` : undefined}
                  >
                    {turn.duration_seconds}s
                  </div>
                )}
                {rLabel && (
                  <div style={{ marginTop: 3 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 3,
                      background: rLabel.color + '15', color: rLabel.color,
                      border: `1px solid ${rLabel.color}33`,
                    }}
                      title={`Response length: ${turn.final_length} chars`}
                    >
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

  const icon  = (key === 'chat.tool_result')
    ? (rec.error_type ? '❌' : '✅')
    : meta.icon;
  const color = (key === 'chat.tool_result' && rec.error_type) ? '#ef4444' : meta.color;
  const danger = isDangerous(rec);

  const headerLabel = key === 'chat.tool_call'
    ? `${meta.label}: ${rec.tool_name ?? (rec.tool_call as Record<string, unknown>)?.name ?? ''}`
    : key === 'chat.tool_result'
    ? `${meta.label}: ${rec.tool_name ?? ''}`
    : meta.label;

  const isExpandable = [
    'chat.reasoning', 'chat.tool_call', 'chat.tool_result', 'chat.file', 'chat.error',
  ].includes(key);

  // For error records, use the error field as preview text; otherwise content
  const bodyText = key === 'chat.error'
    ? (rec.error ?? rec.error_detail ?? rec.content ?? '')
    : (rec.content ?? '');
  const previewText = bodyText.slice(0, 120);

  return (
    <div style={{
      border: `1px solid ${color}33`,
      borderLeft: `3px solid ${danger ? '#ef4444' : color}`,
      borderRadius: 6,
      marginBottom: 8,
      background: '#fff',
      overflow: 'hidden',
    }}>
      {/* Header row */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px',
          cursor: isExpandable ? 'pointer' : 'default',
          background: danger ? '#fef2f2' : color + '08',
        }}
        onClick={() => isExpandable && setExpanded(x => !x)}
      >
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontWeight: 600, fontSize: 13, color, flex: 1 }}>{headerLabel}</span>

        {danger && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3,
            background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5',
          }}>
            ⚠ DANGEROUS
          </span>
        )}
        {isRetry && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3,
            background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a',
          }}>
            ↻ retry
          </span>
        )}

        <span style={{ fontSize: 11, color: '#9ca3af' }}>
          {new Date(rec.timestamp * 1000).toLocaleTimeString()}
        </span>
        {isExpandable && (
          <span style={{ fontSize: 12, color: '#9ca3af' }}>{expanded ? '▲' : '▼'}</span>
        )}
      </div>

      {/* Always-visible body for user + response */}
      {(key === 'user' || key === 'chat.final') && rec.content && (
        <div style={{
          padding: '8px 12px', fontSize: 13, color: '#374151',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          borderTop: `1px solid ${color}22`,
        }}>
          {rec.content}
        </div>
      )}

      {/* Collapsed preview */}
      {isExpandable && !expanded && previewText && (
        <div style={{
          padding: '4px 12px 8px', fontSize: 12, color: '#6b7280',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {previewText}{previewText.length >= 120 ? '…' : ''}
        </div>
      )}

      {/* Expanded detail */}
      {isExpandable && expanded && (
        <div style={{ padding: '8px 12px', borderTop: `1px solid ${color}22` }}>
          {key === 'chat.tool_call' && (
            <pre style={{
              margin: 0, fontSize: 12, background: '#f8fafc', borderRadius: 4,
              padding: '8px', overflowX: 'auto', color: '#1e293b',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
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
                  <strong>{rec.error_type}</strong>
                  {rec.error_detail ? `: ${rec.error_detail}` : ''}
                </div>
              )}
              <pre style={{
                margin: 0, fontSize: 12, background: '#f8fafc', borderRadius: 4,
                padding: '8px', overflowX: 'auto', color: '#1e293b',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                maxHeight: 300, overflowY: 'auto',
              }}>
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
            <div style={{
              fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontStyle: key === 'chat.reasoning' ? 'italic' : 'normal',
            }}>
              {rec.content}
            </div>
          )}
        </div>
      )}

      {/* Usage summary chips */}
      {key === 'chat.usage_summary' && (
        <div style={{ padding: '6px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {rec.total_tokens != null && (
            <span style={chipStyle}>{rec.total_tokens.toLocaleString()} tokens</span>
          )}
          {rec.ttft_ms != null && (
            <span style={chipStyle} title="Time to first token">TTFT {rec.ttft_ms.toFixed(0)}ms</span>
          )}
          {rec.tpot_ms != null && (
            <span style={chipStyle} title="Time per output token">TPOT {rec.tpot_ms.toFixed(1)}ms</span>
          )}
          {rec.total_latency_ms != null && (
            <span style={chipStyle} title="Total LLM latency">
              {(rec.total_latency_ms / 1000).toFixed(1)}s latency
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function TurnDetailView() {
  const {
    selectedSession, selectedTurnId, turns, turnRecords,
    loading, error, back, clearError,
  } = useReplayStore();

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
                <span style={{ fontWeight: 400, color: '#6b7280', fontSize: 13, marginLeft: 8 }}>
                  — {selectedSession.title}
                </span>
              )}
            </h2>
            {turn?.timestamp && (
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                {new Date(turn.timestamp * 1000).toLocaleString()}
                {turn.duration_seconds > 0 && (
                  <span style={{ marginLeft: 8 }}>{turn.duration_seconds}s</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Header chips */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
          {turn && qualityChip(turn.quality_score, turn.quality_label)}
          {turn && turn.total_tokens > 0 && (
            <span style={chipStyle}>{turn.total_tokens.toLocaleString()} tok</span>
          )}
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
            <span
              style={{ ...chipStyle, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a' }}
              title={`Request was attempted ${turn.retry_count} times`}
            >
              ↻ ×{turn.retry_count}
            </span>
          )}
          <button
            style={{ ...btnStyle, fontSize: 12 }}
            title="Download trajectory as JSON"
            onClick={() => downloadJson(turnRecords, `turn-${selectedTurnId?.slice(0, 8) ?? 'export'}.json`)}
            disabled={turnRecords.length === 0}
          >
            ⬇ JSON
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onClose={clearError} />}
      {loading && <div style={emptyStyle}>Loading trajectory…</div>}
      {!loading && turnRecords.length === 0 && (
        <div style={emptyStyle}>No records found for this turn.</div>
      )}

      {turnRecords.map((rec, i) => (
        <RecordCard
          key={rec.id ?? `${rec.event_type}-${i}`}
          rec={rec}
          isRetry={retrySet.has(rec.id)}
        />
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
