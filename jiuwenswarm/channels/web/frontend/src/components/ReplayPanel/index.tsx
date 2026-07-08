/**
 * ReplayPanel — Session Replay / Trajectory Viewer
 *
 * Three views:
 *   1. Session List    — pick any past session
 *   2. Turn List       — browse turns (user message → agent response cycle)
 *   3. Turn Detail     — full ReAct trajectory for one turn
 */

import React, { useEffect, useState } from 'react';
import {
  useReplayStore,
  type HistoryRecord,
} from '../../stores/replayStore';

// ── Props ─────────────────────────────────────────────────────────────────────

interface ReplayPanelProps {
  isConnected: boolean;
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const panelStyle: React.CSSProperties = {
  padding: '20px 24px',
  height: '100%',
  overflowY: 'auto',
  boxSizing: 'border-box',
  fontFamily: 'var(--font-family, sans-serif)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 20,
  gap: 12,
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
    'code.plan': '#8b5cf6',
    team: '#10b981',
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

function ErrorBanner({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div style={{
      background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6,
      padding: '8px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8,
      fontSize: 13, color: '#991b1b',
    }}>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#991b1b' }}>×</button>
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
        <button style={btnStyle} onClick={loadSessions} disabled={loading || !isConnected}>
          {loading ? '…' : '↻ Refresh'}
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>
              {s.title ?? s.session_id.slice(0, 24) + '…'}
              {modeBadge(s.mode)}
            </span>
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              {relativeTime(s.last_message_at ?? s.created_at ?? 0)}
            </span>
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: '#6b7280' }}>
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
  const { selectedSession, turns, loading, error, selectTurn, back, clearError } = useReplayStore();

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button style={btnStyle} onClick={back}>← Back</button>
          <div>
            <h2 style={{ ...titleStyle, marginBottom: 0 }}>
              {selectedSession?.title ?? selectedSession?.session_id?.slice(0, 24)}
              {modeBadge(selectedSession?.mode)}
            </h2>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
              {selectedSession?.session_id}
            </div>
          </div>
        </div>
        <span style={{ fontSize: 13, color: '#6b7280' }}>{turns.length} turns</span>
      </div>

      {error && <ErrorBanner message={error} onClose={clearError} />}

      {loading && <div style={emptyStyle}>Loading turns…</div>}
      {!loading && turns.length === 0 && (
        <div style={emptyStyle}>No turns found for this session.</div>
      )}

      {turns.map((turn) => (
        <div
          key={turn.turn_id}
          style={cardStyle}
          onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366f1')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
          onClick={() => isConnected && selectTurn(turn.turn_id)}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: '#6366f1',
                  background: '#eef2ff', borderRadius: 4, padding: '1px 6px',
                }}>
                  #{turn.turn_index + 1}
                </span>
                {modeBadge(turn.mode)}
              </div>
              <div style={{
                fontSize: 13, color: turn.user_content ? '#111827' : '#9ca3af',
                fontStyle: turn.user_content ? 'normal' : 'italic',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {turn.user_content || '(no user message)'}
              </div>
              {turn.tool_names.length > 0 && (
                <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
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
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{relativeTime(turn.timestamp)}</div>
              {turn.total_tokens > 0 && (
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                  {turn.total_tokens.toLocaleString()} tokens
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── View 3: Turn Detail (Trajectory) ─────────────────────────────────────────

const EVENT_META: Record<string, { icon: string; label: string; color: string }> = {
  user:                { icon: '🧑', label: 'User',          color: '#3b82f6' },
  'chat.reasoning':    { icon: '🤔', label: 'Reasoning',     color: '#8b5cf6' },
  'chat.tool_call':    { icon: '🔧', label: 'Tool Call',     color: '#f59e0b' },
  'chat.tool_result':  { icon: '',  label: 'Tool Result',   color: '#10b981' },
  'chat.final':        { icon: '💬', label: 'Response',      color: '#6366f1' },
  'chat.file':         { icon: '📄', label: 'File',          color: '#06b6d4' },
  'chat.usage_summary':{ icon: '📊', label: 'Usage',         color: '#6b7280' },
  'chat.error':        { icon: '🚨', label: 'Error',         color: '#ef4444' },
};

function toolResultIcon(rec: HistoryRecord): string {
  if (rec.error_type) return '❌';
  if (rec.result != null) return '✅';
  return '✅';
}

function RecordCard({ rec }: { rec: HistoryRecord }) {
  const [expanded, setExpanded] = useState(false);

  const key = rec.role === 'user' ? 'user' : (rec.event_type ?? '');
  const meta = EVENT_META[key] ?? { icon: '•', label: rec.event_type ?? rec.role, color: '#6b7280' };

  const icon = key === 'chat.tool_result' ? toolResultIcon(rec) : meta.icon;
  const color = (key === 'chat.tool_result' && rec.error_type) ? '#ef4444' : meta.color;

  const headerLabel = key === 'chat.tool_call'
    ? `${meta.label}: ${rec.tool_name ?? (rec.tool_call as any)?.name ?? ''}`
    : key === 'chat.tool_result'
    ? `${meta.label}: ${rec.tool_name ?? ''}`
    : meta.label;

  const isExpandable = [
    'chat.reasoning', 'chat.tool_call', 'chat.tool_result', 'chat.file', 'chat.error',
  ].includes(key);

  const previewText = rec.content?.slice(0, 120) ?? '';

  return (
    <div style={{
      border: `1px solid ${color}33`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 6,
      marginBottom: 8,
      background: '#fff',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px',
          cursor: isExpandable ? 'pointer' : 'default',
          background: color + '08',
        }}
        onClick={() => isExpandable && setExpanded(x => !x)}
      >
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontWeight: 600, fontSize: 13, color, flex: 1 }}>{headerLabel}</span>
        <span style={{ fontSize: 11, color: '#9ca3af' }}>
          {new Date(rec.timestamp * 1000).toLocaleTimeString()}
        </span>
        {isExpandable && (
          <span style={{ fontSize: 12, color: '#9ca3af' }}>{expanded ? '▲' : '▼'}</span>
        )}
      </div>

      {/* Always-visible body for user + final */}
      {(key === 'user' || key === 'chat.final') && rec.content && (
        <div style={{
          padding: '8px 12px', fontSize: 13, color: '#374151',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          borderTop: `1px solid ${color}22`,
        }}>
          {rec.content}
        </div>
      )}

      {/* Preview when collapsed */}
      {isExpandable && !expanded && previewText && (
        <div style={{
          padding: '4px 12px 8px', fontSize: 12, color: '#6b7280',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {previewText}{rec.content && rec.content.length > 120 ? '…' : ''}
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
                const args = (rec.tool_call as any)?.arguments ?? rec.content;
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
              <pre style={{
                margin: 0, fontSize: 12, background: '#f8fafc', borderRadius: 4,
                padding: '8px', overflowX: 'auto', color: '#1e293b',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 300, overflowY: 'auto',
              }}>
                {rec.result ?? rec.content}
              </pre>
            </>
          )}
          {(key === 'chat.reasoning' || key === 'chat.file' || key === 'chat.error') && (
            <div style={{
              fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap',
              wordBreak: 'break-word', fontStyle: key === 'chat.reasoning' ? 'italic' : 'normal',
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
            <span style={{
              fontSize: 12, padding: '2px 8px', borderRadius: 4,
              background: '#f3f4f6', color: '#374151',
            }}>
              {rec.total_tokens.toLocaleString()} tokens
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function TurnDetailView() {
  const { selectedSession, selectedTurnId, turns, turnRecords, loading, error, back, clearError } = useReplayStore();

  const turn = turns.find(t => t.turn_id === selectedTurnId);

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button style={btnStyle} onClick={back}>← Back</button>
          <div>
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
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {turn && turn.total_tokens > 0 && (
            <span style={{
              fontSize: 12, color: '#6b7280', padding: '3px 8px',
              background: '#f3f4f6', borderRadius: 4,
            }}>
              {turn.total_tokens.toLocaleString()} tokens
            </span>
          )}
          {turn && turn.tool_names.length > 0 && (
            <span style={{
              fontSize: 12, color: '#f59e0b', padding: '3px 8px',
              background: '#fffbeb', borderRadius: 4, border: '1px solid #fde68a',
            }}>
              {turn.tool_names.length} tool call{turn.tool_names.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {error && <ErrorBanner message={error} onClose={clearError} />}

      {loading && <div style={emptyStyle}>Loading trajectory…</div>}

      {!loading && turnRecords.length === 0 && (
        <div style={emptyStyle}>No records found for this turn.</div>
      )}

      {turnRecords.map((rec, i) => (
        <RecordCard key={rec.id ?? `${rec.event_type}-${i}`} rec={rec} />
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ReplayPanel({ isConnected }: ReplayPanelProps) {
  const { selectedSessionId, selectedTurnId } = useReplayStore();

  if (selectedTurnId) {
    return <TurnDetailView />;
  }
  if (selectedSessionId) {
    return <TurnListView isConnected={isConnected} />;
  }
  return <SessionListView isConnected={isConnected} />;
}
