/**
 * TraceHoundPanel — TraceHound / Trajectory Viewer
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTraceHoundStore, type HistoryRecord, type TurnSummary, type AnalysisIssue } from '../../stores/traceHoundStore';
import { webRequest } from '../../services/webClient';
import { C } from './traceTokens';
import { shouldRefetch, POLL_INTERVAL_MS } from './traceLive';

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
    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: color + '18', color, border: `1px solid ${color}44`, marginRight: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {mode}
    </span>
  );
}

// ── Team agent attribution ───────────────────────────────────────────────────

const AGENT_PALETTE = ['#0ea5e9', '#f97316', '#8b5cf6', '#ec4899', '#14b8a6', '#eab308', '#6366f1', '#f43f5e'];

function agentColor(name: string): string {
  if (name === 'leader') return '#475569';
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AGENT_PALETTE[h % AGENT_PALETTE.length];
}

/** Resolve the acting agent (member_name, else 'leader') for a team record. */
function recordAgent(rec: HistoryRecord): string {
  if (rec.member_name) return rec.member_name;
  if (rec.role === 'leader') return 'leader';
  return '';
}

/** Small colored tag for a team agent (leader gets a neutral slate tag). */
function agentTag(name: string, withDot = true): React.ReactNode {
  const color = agentColor(name);
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 3, background: color + '14', color, border: `1px solid ${color}33`, flexShrink: 0, whiteSpace: 'nowrap' }}>
      {name === 'leader' ? '⛨ leader' : (withDot ? `◈ ${name}` : name)}
    </span>
  );
}

// ── Custom tooltip (browser title= is unreliable/slow) ────────────────────────

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handleEnter = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPos({ x: rect.left + rect.width / 2, y: rect.top });
    setShow(true);
  };

  // If child is a React element, attach handlers directly — no wrapper.
  // This lets the child remain a direct flex item in its parent row.
  if (React.isValidElement(children)) {
    return (
      <>
        {React.cloneElement(children, {
          onMouseEnter: handleEnter,
          onMouseLeave: () => setShow(false),
        } as any)}
        {show && text && createPortal(
          <div style={{
            position: 'fixed', top: pos.y - 8, left: pos.x, transform: 'translate(-50%, -100%)',
            background: '#1f2937', color: '#f9fafb', fontSize: 11, padding: '8px 10px',
            borderRadius: 6, whiteSpace: 'pre-wrap', zIndex: 2147483647, minWidth: 180, maxWidth: 300,
            boxShadow: '0 4px 16px rgba(0,0,0,0.35)', pointerEvents: 'none', lineHeight: 1.5,
          }}>
            {text}
            <div style={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #1f2937' }} />
          </div>,
          document.body
        )}
      </>
    );
  }

  // For text / fragment children, fall back to a span wrapper
  return (
    <>
      <span
        style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </span>
      {show && text && createPortal(
        <div style={{
          position: 'fixed', top: pos.y - 8, left: pos.x, transform: 'translate(-50%, -100%)',
          background: '#1f2937', color: '#f9fafb', fontSize: 11, padding: '8px 10px',
          borderRadius: 6, whiteSpace: 'pre-wrap', zIndex: 2147483647, minWidth: 180, maxWidth: 300,
          boxShadow: '0 4px 16px rgba(0,0,0,0.35)', pointerEvents: 'none', lineHeight: 1.5,
        }}>
          {text}
          <div style={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #1f2937' }} />
        </div>,
        document.body
      )}
    </>
  );
}

/** Color for each outcome type — used in charts, badges, timeline bars */
const OUTCOME_COLORS: Record<string, string> = {
  completed: '#2563eb',
  completed_with_issues: '#f59e0b',
  no_response: '#9333ea',
  error: '#ef4444',
  deferred: '#059669',
};

/** Human-readable display name for each outcome */
const OUTCOME_LABELS: Record<string, string> = {
  completed: 'Completed',
  completed_with_issues: 'With problems',
  no_response: 'No response',
  error: 'Error',
  deferred: 'Deferred',
};

/** Approximate bar height score for visual charts */
function outcomeScore(t: TurnSummary): number {
  switch (t.outcome) {
    case 'completed': return 0.9;
    case 'completed_with_issues': return 0.65;
    case 'no_response': return 0.2;
    case 'deferred': return 0.3;
    default: return 0.1;
  }
}

/** Outcome badge — shows the actual outcome name (completed / with problems / no response / error / deferred) */
function OutcomeBadge({ outcome, issues }: { outcome: string; issues: string[] }) {
  const color = OUTCOME_COLORS[outcome] ?? '#6b7280';
  const label = OUTCOME_LABELS[outcome] ?? outcome.replace(/_/g, ' ');
  const tip = issues.length > 0 ? issues.join('\n') : '';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: color + '18', color, border: `1px solid ${color}44`, textTransform: 'capitalize' }}>
        {label}
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

function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function isFailedToolResult(rec: HistoryRecord): boolean {
  if (rec.error_type) return true;
  // Team-mode tool errors serialize into the result string with no structured
  // error fields (e.g. `success=False data=None error='...'`).
  return typeof rec.result === 'string' && rec.result.includes('success=False');
}

function recordHeaderLabel(rec: HistoryRecord): string {
  const key = rec.role === 'user' ? 'user' : (rec.event_type ?? '');
  const meta = EVENT_META[key] ?? { icon: '•', label: rec.event_type ?? rec.role, color: '#6b7280' };
  const subLabel = rec.subagent_type ? ` · subagent: ${rec.subagent_type}` : '';
  const agentName = recordAgent(rec);
  const agentLabel = agentName ? ` · ${agentName}` : '';
  if (key === 'chat.tool_call') return `${meta.label}: ${rec.tool_name ?? (rec.tool_call as Record<string, unknown>)?.name ?? ''}${subLabel}${agentLabel}`;
  if (key === 'chat.tool_result') return `${meta.label}: ${rec.tool_name ?? ''}${subLabel}${agentLabel}`;
  if (key === 'chat.tool_update') return `${meta.label}: ${rec.tool_name ?? ''}${subLabel}${agentLabel}`;
  if (key === 'chat.usage_metadata') return `${meta.label}: ${rec.metadata?.usage_metadata?.model_name ?? ''}${subLabel}${agentLabel}`;
  return `${meta.label}${subLabel}${agentLabel}`;
}

// Serialize a history record as plain text, mirroring exactly what its on-screen
// card shows (header label, body, tool arguments/result, LLM usage + prompt +
// response, session id) so a downloaded page has the same boxes, order and data.
function recordToText(rec: HistoryRecord, allRecords?: HistoryRecord[]): string {
  const key = rec.role === 'user' ? 'user' : (rec.event_type ?? '');
  const meta = EVENT_META[key] ?? { icon: '•', label: rec.event_type ?? rec.role, color: '#6b7280' };
  const icon = key === 'chat.tool_result' ? (isFailedToolResult(rec) ? '❌' : '✅') : meta.icon;
  const header = `${icon} ${recordHeaderLabel(rec)}`;
  const lines: string[] = [header];

  const bodyText = key === 'chat.error' ? (rec.error ?? rec.error_detail ?? rec.content ?? '') : (rec.content ?? '');

  if (key === 'user' || key === 'chat.final') {
    if (bodyText) lines.push('', bodyText);
  } else if (key === 'chat.tool_call') {
    const args = (rec.tool_call as Record<string, unknown>)?.arguments ?? rec.content;
    let fmtArgs = '';
    try { fmtArgs = JSON.stringify(typeof args === 'string' ? JSON.parse(args) : args, null, 2); }
    catch { fmtArgs = String(args ?? ''); }
    if (fmtArgs) lines.push('', 'Arguments:', fmtArgs);
  } else if (key === 'chat.tool_result') {
    const resultText = rec.result ?? rec.content ?? '';
    if (rec.error_type) lines.push('', `Error type: ${rec.error_type}${rec.error_detail ? ` — ${rec.error_detail}` : ''}`);
    else if (isFailedToolResult(rec)) lines.push('', 'Error: tool call failed (success=False)');
    if (resultText) lines.push('', 'Result:', resultText);
    if (rec.raw_output) {
      try { lines.push('', 'Raw Output:', JSON.stringify(rec.raw_output, null, 2)); }
      catch { lines.push('', 'Raw Output:', String(rec.raw_output)); }
    }
  } else if (key === 'chat.reasoning' || key === 'chat.file' || key === 'chat.error') {
    if (bodyText) lines.push('', bodyText);
  } else if (key === 'chat.usage_metadata') {
    const um = rec.metadata?.usage_metadata;
    if (um) {
      const chips: string[] = [];
      if (um.model_name) chips.push(`model: ${um.model_name}`);
      if (um.input_tokens != null && um.output_tokens != null) chips.push(`${um.input_tokens} in / ${um.output_tokens} out = ${um.total_tokens ?? '?'} tot`);
      if (um.cache_tokens != null && um.cache_tokens > 0) chips.push(`cache: ${um.cache_tokens}`);
      if (um.total_cost != null && um.total_cost > 0) chips.push(`cost: $${um.total_cost.toFixed(4)}`);
      if (chips.length) lines.push('', chips.join(' · '));
      if (rec.metadata?.total_latency_ms != null) {
        lines.push(`latency: ${(rec.metadata.total_latency_ms / 1000).toFixed(2)}s total${rec.metadata.ttft_ms != null ? `, TTFT ${rec.metadata.ttft_ms.toFixed(0)}ms` : ''}${rec.metadata.tpot_ms != null ? `, TPOT ${rec.metadata.tpot_ms.toFixed(1)}ms` : ''}`);
      }
      if (um.prompt) lines.push('', 'LLM Prompt:', um.prompt);
      const responseRecs = findLLMResponseForUsage(rec, allRecords ?? []);
      const parts: string[] = [];
      for (const r of responseRecs) {
        if (r.event_type === 'chat.final' && r.content) parts.push(`Response (final):\n${r.content}`);
        else if (r.event_type === 'chat.llm_call_end' && r.content) parts.push(`Response:\n${r.content}`);
        else if (r.event_type === 'chat.tool_call') parts.push(`Tool: ${(r.tool_call as Record<string, unknown>)?.name ?? r.tool_name ?? 'unknown'}`);
        else if (r.event_type === 'chat.reasoning' && r.content) parts.push(`Reasoning:\n${r.content}`);
        else if (r.event_type === 'chat.error') parts.push(`Error: ${r.error ?? r.error_detail ?? r.content ?? ''}`);
      }
      if (parts.length) lines.push('', parts.join('\n\n'));
    }
  }

  if (rec.session_id) lines.push('', `session: ${rec.session_id}`);
  return lines.join('\n');
}

// ── Step-by-step markdown export ──────────────────────────────────────────────
// Mirrors docs-michael/step-by-step.md: one "### N. <Agent> Trace" section per
// sub-agent (plus the main orchestrator), each a markdown table of
// Operation | Technical Telemetry & Metrics | Latency | Input | Output.

function formatLatencyS(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return '';
  if (sec >= 60) {
    let m = Math.floor(sec / 60);
    let s = Math.round(sec % 60);
    if (s === 60) { m += 1; s = 0; }
    return s > 0 ? `~${m}m ${s}s` : `~${m}m`;
  }
  return `~${sec.toFixed(1)}s`;
}

function mdEsc(s: string): string {
  return (s ?? '').replace(/\|/g, '\\|').replace(/\r?\n+/g, ' ');
}

function mdTrunc(s: string, n: number): string {
  const t = s ?? '';
  return t.length > n ? `${t.slice(0, n)}…` : t;
}

// The prompt preview is "<system>…\n<user>…\n…". For a readable table cell the
// useful part is the actual user query, not the system preamble — take the text
// after the last "<user>" marker.
function lastUserSegment(prompt: string): string {
  const idx = prompt.lastIndexOf('<user>');
  return idx >= 0 ? prompt.slice(idx + 6) : prompt;
}

// The main agent's user message is wrapped in an envelope:
// "You receive a new message: {"source": "web", ..., "content": "<real text>"}".
// Unwrap it so the cell shows the actual user message, not the JSON envelope.
function extractUserMessage(prompt: string): string {
  const seg = lastUserSegment(prompt);
  const start = seg.indexOf('{');
  const end = seg.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(seg.slice(start, end + 1));
      const content = parsed?.content;
      if (typeof content === 'string' && content.trim()) return content;
      if (Array.isArray(content)) {
        const text = content
          .filter((p: Record<string, unknown>) => p && p.type === 'text' && typeof p.text === 'string')
          .map((p: Record<string, unknown>) => p.text)
          .join('\n');
        if (text.trim()) return text;
      }
    } catch { /* not the envelope JSON — fall through */ }
  }
  return seg;
}

// Extract the first http(s) URL found anywhere in a tool-call's parsed args.
// Used to pair a tool_result back to its tool_call when several identical tools
// ran in parallel (tool_call_id is the shared card id, not a per-call id).
function extractUrlSignature(fmtArgs: string): string {
  try {
    const parsed = JSON.parse(fmtArgs);
    const stack: unknown[] = [parsed];
    while (stack.length) {
      const v = stack.pop();
      if (typeof v === 'string') {
        const m = v.match(/https?:\/\/[^\s"'\\]+/);
        if (m) return m[0];
      } else if (Array.isArray(v)) {
        stack.push(...v);
      } else if (v && typeof v === 'object') {
        stack.push(...Object.values(v as Record<string, unknown>));
      }
    }
  } catch { /* ignore */ }
  return '';
}

// Host of the call's URL — a weaker but still useful signal: fetch_webpage
// results often echo a redirected URL (captcha, canonical page) that differs
// from the requested one but keeps the same host.
function extractHostSignature(fmtArgs: string): string {
  const url = extractUrlSignature(fmtArgs);
  const m = url.match(/^https?:\/\/([^/]+)/);
  return m ? m[1] : '';
}

// A fetch_webpage result echoes its URL ("URL: <url>\nStatus: 200 ..."), which
// already appears in the Input cell. Drop that first line for the Output cell.
function summarizeToolResult(resultText: string): string {
  const t = resultText.trim();
  if (t.startsWith('URL:')) {
    const nl = t.indexOf('\n');
    return nl >= 0 ? t.slice(nl + 1).trim() : '';
  }
  return t;
}

// Pair each tool_call with its tool_result. Parallel results arrive in
// completion order and can be interleaved with later LLM calls, so this is a
// greedy match over the whole section, in four passes of decreasing precision:
//   0. unique tool_call_id — the call's id appears once and a result carries it
//      (main agent's task_tool calls; sub-agent tools share a stable card id)
//   1. exact URL — the result text contains the call's requested URL
//   2. host — the result text contains the call's host (redirects/captchas)
//   3. same name — earliest unclaimed result of that tool after the call
function buildToolPairings(records: HistoryRecord[]): Map<number, { latency: string; output: string }> {
  const pairings = new Map<number, { latency: string; output: string }>();
  const idCounts = new Map<string, number>();
  records.forEach(r => {
    if ((r.event_type ?? '') === 'chat.tool_call') {
      const cid = String((r.tool_call as Record<string, unknown>)?.tool_call_id ?? '');
      if (cid) idCounts.set(cid, (idCounts.get(cid) ?? 0) + 1);
    }
  });
  const calls: { idx: number; name: string; sig: string; host: string; callId: string }[] = [];
  const results: { idx: number; name: string; text: string; callId: string }[] = [];
  records.forEach((r, i) => {
    const et = r.event_type ?? '';
    if (et === 'chat.tool_call') {
      const name = String(r.tool_name ?? (r.tool_call as Record<string, unknown>)?.name ?? '');
      const args = (r.tool_call as Record<string, unknown>)?.arguments ?? r.content;
      let fmtArgs = '';
      try { fmtArgs = JSON.stringify(typeof args === 'string' ? JSON.parse(args) : args, null, 2); }
      catch { fmtArgs = String(args ?? ''); }
      const cid = String((r.tool_call as Record<string, unknown>)?.tool_call_id ?? '');
      calls.push({
        idx: i, name,
        sig: extractUrlSignature(fmtArgs),
        host: extractHostSignature(fmtArgs),
        callId: cid && idCounts.get(cid) === 1 ? cid : '',
      });
    } else if (et === 'chat.tool_result') {
      results.push({ idx: i, name: r.tool_name ?? '', text: `${r.result ?? ''} ${r.content ?? ''}`, callId: r.tool_call_id ?? '' });
    }
  });

  const used = new Set<number>();
  const pair = (callIdx: number, resIdx: number) => {
    pairings.set(callIdx, {
      latency: formatLatencyS((records[resIdx]?.timestamp ?? 0) - (records[callIdx]?.timestamp ?? 0)),
      output: summarizeToolResult(records[resIdx]?.result ?? records[resIdx]?.content ?? ''),
    });
    used.add(resIdx);
  };

  const matches = (
    call: { idx: number; name: string; sig: string; host: string; callId: string },
    res: { idx: number; name: string; text: string; callId: string },
    mode: 'id' | 'url' | 'host' | 'name',
  ): boolean => {
    if (res.idx <= call.idx) return false;
    if (res.name !== call.name) return false;
    if (mode === 'id') return !!call.callId && res.callId === call.callId;
    if (mode === 'url') return !!call.sig && res.text.includes(call.sig);
    if (mode === 'host') return !!call.host && res.text.includes(call.host);
    return true;
  };

  for (const mode of ['id', 'url', 'host', 'name'] as const) {
    for (const call of calls) {
      if (pairings.has(call.idx)) continue;
      for (const res of results) {
        if (used.has(res.idx)) continue;
        if (matches(call, res, mode)) { pair(call.idx, res.idx); break; }
      }
    }
  }
  return pairings;
}

function recordToStepRow(
  rec: HistoryRecord,
  i: number,
  records: HistoryRecord[],
  nextLlmTurn: () => number,
  pairings?: Map<number, { latency: string; output: string }>,
): string | null {
  const key = rec.role === 'user' ? 'user' : (rec.event_type ?? '');

  // Only LLM calls and tool calls get rows; llm_call_start/llm_call_end,
  // tool_result (merged into its call), user, final and everything else is
  // noise here.
  if (key === 'chat.usage_metadata') {
    const turnNo = nextLlmTurn();
    const um = rec.metadata?.usage_metadata;
    const tele = um
      ? `Tokens: ${um.input_tokens?.toLocaleString() ?? '?'} in / ${um.output_tokens?.toLocaleString() ?? '?'} out${um.cache_tokens && um.cache_tokens > 0 ? `, Cache: ${um.cache_tokens.toLocaleString()} cached` : ''}`
      : '';
    // Real call duration: metadata when present (main agent), else the span
    // from the preceding llm_call_start to the following llm_call_end. A sub-
    // second span is just usage/end being written together — show nothing.
    const latency = rec.metadata?.total_latency_ms != null
      ? formatLatencyS(rec.metadata.total_latency_ms / 1000)
      : (() => {
          let startTs = 0;
          for (let j = i - 1; j >= 0; j--) {
            const rj = records[j];
            if ((rj.event_type ?? '') === 'chat.llm_call_start') { startTs = rj.timestamp ?? 0; break; }
            if (rj.role === 'user') break;
          }
          for (let j = i + 1; j < records.length; j++) {
            const rj = records[j];
            const et = rj.event_type ?? '';
            if (et === 'chat.usage_metadata' || rj.role === 'user') break;
            if (et === 'chat.llm_call_end') {
              const d = (rj.timestamp ?? 0) - startTs;
              return d >= 0.5 ? formatLatencyS(d) : '';
            }
          }
          return '';
        })();
    const input = mdTrunc(extractUserMessage(um?.prompt ?? ''), 160);
    let output = '';
    for (const r of findLLMResponseForUsage(rec, records)) {
      if ((r.event_type === 'chat.final' || r.event_type === 'chat.llm_call_end') && r.content) {
        output = r.content;
        break;
      }
    }
    if (!output) {
      // Tool-calling call: no text answer. Prefer the model's reasoning (stored
      // on the main agent's tool_call records); otherwise summarize the calls.
      const toolNames: string[] = [];
      let reasoning = '';
      for (let j = i + 1; j < records.length; j++) {
        const rj = records[j];
        const et = rj.event_type ?? '';
        if (et === 'chat.usage_metadata' || rj.role === 'user') break;
        if (et === 'chat.tool_call') {
          const nm = String(rj.tool_name ?? (rj.tool_call as Record<string, unknown>)?.name ?? '');
          if (nm) toolNames.push(nm);
          const rc = String((rj as unknown as Record<string, unknown>).reasoning_content ?? '').trim();
          if (!reasoning && rc) reasoning = rc;
        }
        if (et === 'chat.final' && rj.content) {
          output = rj.content;
          break;
        }
      }
      if (!output && reasoning) {
        output = reasoning;
      } else if (!output && toolNames.length) {
        const counts = new Map<string, number>();
        toolNames.forEach(n => counts.set(n, (counts.get(n) ?? 0) + 1));
        const parts = [...counts].map(([n, c]) => (c > 1 ? `${n} ×${c}` : n));
        output = parts.length > 1 ? `→ tool calls: ${parts.join(', ')}` : `→ tool call: ${parts[0]}`;
      }
    }
    return `| LLM Generation (Turn ${turnNo}) | ${mdEsc(tele)} | ${latency} | ${mdEsc(input)} | ${mdEsc(mdTrunc(output, 200))} |`;
  }

  if (key === 'chat.tool_call') {
    const name = rec.tool_name ?? (rec.tool_call as Record<string, unknown>)?.name ?? '';
    const args = (rec.tool_call as Record<string, unknown>)?.arguments ?? rec.content;
    let fmtArgs = '';
    try { fmtArgs = JSON.stringify(typeof args === 'string' ? JSON.parse(args) : args, null, 2); }
    catch { fmtArgs = String(args ?? ''); }
    const pairing = pairings?.get(i);
    const latency = pairing?.latency ?? '';
    const output = pairing?.output ?? '';
    const tele = name === 'task_tool'
      ? 'Type: Subagent Runtime Fork'
      : name === 'fetch_webpage' ? 'Protocol: HTTP GET'
      : '—';
    return `| Tool Call (\`${name}\`) | ${mdEsc(tele)} | ${latency} | ${mdEsc(mdTrunc(fmtArgs, 160))} | ${mdEsc(mdTrunc(output, 200))} |`;
  }

  return null;
}

function turnToStepByStepMarkdown(records: HistoryRecord[]): string {
  const main: HistoryRecord[] = [];
  // Group by sub-session when available (several parallel sub-agents of the
  // same type would otherwise collapse into one section); fall back to type
  // for records recorded before sub_session_id was stamped.
  const subs = new Map<string, HistoryRecord[]>();
  for (const r of records) {
    const key = r.sub_session_id ? `sid:${r.sub_session_id}` : (r.subagent_type ? `type:${r.subagent_type}` : '');
    if (!key) { main.push(r); continue; }
    const arr = subs.get(key) ?? [];
    arr.push(r);
    subs.set(key, arr);
  }
  const groups: { title: string; records: HistoryRecord[] }[] = [];
  if (main.length) groups.push({ title: 'Main Orchestrator Trace', records: main });
  let si = 1;
  for (const [key, recs] of subs) {
    const type = recs[0]?.subagent_type ?? 'subagent';
    const short = key.startsWith('sid:') ? ` (${key.slice(4).slice(-6)})` : '';
    groups.push({ title: `Subagent ${si++}: ${type} Trace${short}`, records: recs });
  }

  const lines: string[] = [];
  groups.forEach((g, gi) => {
    lines.push(`### ${gi + 1}. ${g.title}`, '');
    lines.push('| Operation | Technical Telemetry & Metrics | Latency | Input | Output |');
    lines.push('| :--- | :--- | :--- | :--- | :--- |');
    const pairings = buildToolPairings(g.records);
    let llmTurn = 0;
    for (let i = 0; i < g.records.length; i++) {
      const row = recordToStepRow(g.records[i], i, g.records, () => { llmTurn += 1; return llmTurn; }, pairings);
      if (row) lines.push(row);
    }
    lines.push('');
  });
  return lines.join('\n');
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      title={text}
      style={{ ...btnStyle, fontSize: 11, padding: '2px 8px' }}
      onClick={() => navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })}>
      {copied ? '✓ copied' : '⎘ copy'}
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

/** Find the LLM response events that correspond to a given usage_metadata record.
 *  Scans forward through the timeline to collect chat.final, chat.tool_call,
 *  chat.reasoning, chat.delta, and chat.error events until the next usage_metadata.
 */
function findLLMResponseForUsage(
  usageRec: HistoryRecord,
  allRecords: HistoryRecord[]
): HistoryRecord[] {
  if (!allRecords || allRecords.length === 0) return [];
  // id is NOT unique across events in the same turn (all assistant events share
  // request_id + ":assistant").  Use timestamp + event_type as a composite key
  // to pinpoint the exact record position.
  const usageIndex = allRecords.findIndex(
    r =>
      r.id === usageRec.id &&
      r.timestamp === usageRec.timestamp &&
      r.event_type === usageRec.event_type
  );
  if (usageIndex === -1) return [];

  const responses: HistoryRecord[] = [];
  for (let i = usageIndex + 1; i < allRecords.length; i++) {
    const r = allRecords[i];
    const et = r.event_type ?? '';
    // Stop at the next usage_metadata — that starts a new LLM call
    if (et === 'chat.usage_metadata') break;
    // Stop at user messages — they're not LLM responses
    if (r.role === 'user') break;
    // Collect response-type events. chat.llm_call_end carries the model's
    // answer and lands AFTER the usage_metadata record in history, so it must
    // be counted as a response even though the final text may also appear in
    // chat.final (which can be timestamped before the usage record).
    if (
      et === 'chat.final' ||
      et === 'chat.llm_call_end' ||
      et === 'chat.tool_call' ||
      et === 'chat.reasoning' ||
      et === 'chat.delta' ||
      et === 'chat.error'
    ) {
      responses.push(r);
    }
  }
  return responses;
}

// ── Analytics Panel ───────────────────────────────────────────────────────────

function AnalyticsPanel({ turns }: { turns: TurnSummary[] }) {
  if (turns.length === 0) return null;

  const outcomes = { completed: 0, completed_with_issues: 0, no_response: 0, error: 0, deferred: 0 };
  turns.forEach(t => { const o = t.outcome; if (o && o in outcomes) (outcomes as Record<string, number>)[o]++; });

  const errCats: Record<string, number> = {};
  // Includes turns whose error_category was set from a failed tool result, not
  // only hard chat.error turns — so tool failures surface in the stats pane.
  turns.filter(t => t.error_category).forEach(t => {
    errCats[t.error_category!] = (errCats[t.error_category!] ?? 0) + 1;
  });

  const qtCounts: Record<string, number> = {};
  turns.forEach(t => { if (t.query_type) qtCounts[t.query_type] = (qtCounts[t.query_type] ?? 0) + 1; });

  // Tool usage: merge tool_call names with tool results so failure counts are
  // visible per tool, and never hide a tool that had failures. Failures are
  // attributed to the acting agent (member_name / leader) when available.
  interface ToolUsage { calls: number; results: number; failed: number; byAgent: Record<string, { calls: number; failed: number }>; }
  const toolUsage: Record<string, ToolUsage> = {};
  turns.forEach(t => {
    t.tool_names.forEach(n => {
      const u = (toolUsage[n] ??= { calls: 0, results: 0, failed: 0, byAgent: {} });
      u.calls += 1;
    });
    (t.tool_results_detail ?? []).forEach(r => {
      const key = r.tool_name || '(unknown)';
      const u = (toolUsage[key] ??= { calls: 0, results: 0, failed: 0, byAgent: {} });
      u.results += 1;
      const isFail = r.failed || (typeof r.result === 'string' && r.result.includes('success=False'));
      if (isFail) u.failed += 1;
      if (r.agent) {
        const a = (u.byAgent[r.agent] ??= { calls: 0, failed: 0 });
        a.calls += 1;
        if (isFail) a.failed += 1;
      }
    });
  });
  const topTools = Object.entries(toolUsage).sort((a, b) => b[1].calls - a[1].calls).slice(0, 8);
  const extraFailedTools = Object.entries(toolUsage)
    .filter(([n, u]) => u.failed > 0 && !topTools.some(([tn]) => tn === n))
    .sort((a, b) => b[1].failed - a[1].failed);
  const displayTools = [...topTools, ...extraFailedTools];

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
  const totalToolFailures = turns.reduce((s, t) => s + (t.tool_failures ?? 0), 0);

  return (
    <div style={{ marginBottom: 20, padding: '14px 16px', background: '#fafafa', borderRadius: 8, border: '1px solid #e5e7eb' }}>

      {/* Summary stats */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        {[
          { label: 'Completed', value: String(outcomes.completed), color: '#3b82f6', tip: 'User messages that finished successfully with no problems' },
          { label: 'With problems', value: String(outcomes.completed_with_issues), color: outcomes.completed_with_issues > 0 ? '#f59e0b' : '#9ca3af', tip: 'User messages that completed but had tool failures, retries, or were slow' },
          { label: 'No response', value: String(outcomes.no_response), color: outcomes.no_response > 0 ? '#8b5cf6' : '#9ca3af', tip: 'User messages where the agent produced no output at all' },
          { label: 'Errors', value: String(outcomes.error), color: outcomes.error > 0 ? '#ef4444' : '#9ca3af', tip: 'User messages that ended in a hard error' },
          { label: 'Deferred', value: String(outcomes.deferred), color: outcomes.deferred > 0 ? '#6366f1' : '#9ca3af', tip: 'Messages sent while agent was busy — never processed' },
          { label: 'Total retries', value: String(totalRetries), color: totalRetries > 0 ? '#f59e0b' : '#9ca3af', tip: 'How many times the agent retried a failed request' },
          { label: 'Tool failures', value: String(totalToolFailures), color: totalToolFailures > 0 ? '#dc2626' : '#9ca3af', tip: 'Tool calls that returned success=False or an error' },
          ...(longestCascade >= 2 ? [{ label: 'Longest error streak', value: `${longestCascade} user msgs`, color: '#ef4444', tip: 'Consecutive user messages all with errors' }] : []),
        ].map((s, i) => (
          <Tooltip key={i} text={s.tip ?? ''}>
            <div style={{ background: '#fff', borderRadius: 6, padding: '8px 12px', border: '1px solid #e5e7eb', minWidth: 90, cursor: s.tip ? 'help' : 'default' }}>
              <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          </Tooltip>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>

        {/* Per user message — combined quality, tokens, duration in one card */}
        <div style={{ background: '#fff', borderRadius: 6, padding: 12, border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>Per user message</div>

          {/* Outcome row */}
          <div>
            <div style={{ fontSize: 9, color: '#9ca3af', marginBottom: 3, display: 'flex', justifyContent: 'space-between' }}>
              <span>Outcome</span><span>{turns.length} user msgs</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 28 }}>
              {turns.map(t => {
                const outcome = t.outcome;
                const color = OUTCOME_COLORS[outcome] ?? '#9ca3af';
                const pct = outcomeScore(t);
                const h = Math.max(4, pct * 28);
                const failedCount = t.tool_failures ?? 0;
                const failedTip = failedCount > 0 ? `\n${failedCount} tool call${failedCount !== 1 ? 's' : ''} failed` : '';
                return (
                  <Tooltip key={t.turn_id} text={`Msg ${t.turn_index + 1}: ${OUTCOME_LABELS[outcome] ?? outcome}${failedTip}\n${t.user_content || '(no message)'}`}>
                    <div style={{ flex: 1, minWidth: 0, height: h, background: color, borderRadius: 1, cursor: 'default', opacity: t.outcome === 'deferred' ? 0.4 : 1, boxShadow: failedCount > 0 ? 'inset 0 0 0 1px #dc2626' : undefined }} />
                  </Tooltip>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              {Object.entries(OUTCOME_COLORS).map(([k, c]) => (
                <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 9, color: '#6b7280', textTransform: 'capitalize' }}>
                  <span style={{ width: 6, height: 6, borderRadius: 1, background: c, display: 'inline-block' }} />{OUTCOME_LABELS[k] ?? k.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>

          {/* Tokens row */}
          {maxTok > 0 && (
            <div>
              <div style={{ fontSize: 9, color: '#9ca3af', marginBottom: 3, display: 'flex', justifyContent: 'space-between' }}>
                <span>Tokens</span><span>{turns.reduce((s, t) => s + t.total_tokens, 0).toLocaleString()} total</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 28 }}>
                {turns.map(t => {
                  const h = Math.max(1, (t.total_tokens / maxTok) * 28);
                  return (
                    <Tooltip key={t.turn_id} text={`Msg ${t.turn_index + 1}: ${t.total_tokens.toLocaleString()} tokens`}>
                      <div style={{ flex: 1, minWidth: 0, height: h, background: t.total_tokens > 0 ? '#6366f1' : '#9ca3af', borderRadius: 1, opacity: t.total_tokens > 0 ? 0.65 : 0.5, cursor: 'default' }} />
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          )}

          {/* LLM calls row */}
          {(() => {
            const maxLlm = Math.max(...turns.map(t => t.llm_call_count ?? 0), 1);
            const totalLlm = turns.reduce((s, t) => s + (t.llm_call_count ?? 0), 0);
            if (totalLlm === 0) return null;
            return (
              <div>
                <div style={{ fontSize: 9, color: '#9ca3af', marginBottom: 3, display: 'flex', justifyContent: 'space-between' }}>
                  <span>LLM calls</span><span>{totalLlm} total</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 28 }}>
                  {turns.map(t => {
                    const n = t.llm_call_count ?? 0;
                    const h = Math.max(1, (n / maxLlm) * 28);
                    const color = n === 0 ? '#9ca3af' : n > 10 ? '#ef4444' : n > 4 ? '#f59e0b' : '#10b981';
                    return (
                      <Tooltip key={t.turn_id} text={`Msg ${t.turn_index + 1}: ${n} LLM call${n !== 1 ? 's' : ''}`}>
                        <div style={{ flex: 1, minWidth: 0, height: h, background: color, borderRadius: 1, opacity: n === 0 ? 0.5 : 1, cursor: 'default' }} />
                      </Tooltip>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  {([['#10b981', '1–4'], ['#f59e0b', '5–10'], ['#ef4444', '11+']] as const).map(([c, l]) => (
                    <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 9, color: '#6b7280' }}>
                      <span style={{ width: 6, height: 6, borderRadius: 1, background: c, display: 'inline-block' }} />{l}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Duration row */}
          {maxDur > 0 && (
            <div>
              <div style={{ fontSize: 9, color: '#9ca3af', marginBottom: 3, display: 'flex', justifyContent: 'space-between' }}>
                <span>Duration <span style={{ fontSize: 8 }}>(single-attempt)</span></span><span>slowest {fmtDuration(maxDur)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 28 }}>
                {turns.map(t => {
                  if (t.retry_count > 1) {
                    return (
                        <Tooltip key={t.turn_id} text={`Msg ${t.turn_index + 1}: ${t.retry_count} retries — wall time excluded`}>
                          <div style={{ flex: 1, minWidth: 0, height: 4, background: '#bfdbfe', borderRadius: 1, cursor: 'default', opacity: 0.7 }} />
                        </Tooltip>
                    );
                  }
                  const pct = t.duration_seconds / maxDur;
                  const color = t.duration_seconds === 0 ? '#9ca3af' : pct > 0.75 ? '#ef4444' : pct > 0.4 ? '#f59e0b' : '#10b981';
                  const h = Math.max(1, pct * 28);
                  return (
                    <Tooltip key={t.turn_id} text={`Msg ${t.turn_index + 1}: ${fmtDuration(t.duration_seconds)}`}>
                      <div style={{ flex: 1, minWidth: 0, height: h, background: color, borderRadius: 1, opacity: t.duration_seconds === 0 ? 0.5 : 1, cursor: 'default' }} />
                    </Tooltip>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                {([['#10b981', 'fast'], ['#f59e0b', 'moderate'], ['#ef4444', 'slow']] as const).map(([c, l]) => (
                  <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 9, color: '#6b7280' }}>
                    <span style={{ width: 6, height: 6, borderRadius: 1, background: c, display: 'inline-block' }} />{l}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Retries row */}
          {totalRetries > 0 && (
            <div>
              <div style={{ fontSize: 9, color: '#9ca3af', marginBottom: 3, display: 'flex', justifyContent: 'space-between' }}>
                <span>Retries</span><span>{totalRetries} total</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 28 }}>
                {(() => {
                  const maxRetry = Math.max(...turns.map(t => t.retry_count), 1);
                  return turns.map(t => {
                    const rc = t.retry_count;
                    const pct = rc / maxRetry;
                    const color = rc === 0 ? '#cbd5e1' : rc === 1 ? '#94a3b8' : '#7c3aed';
                    const h = Math.max(rc > 0 ? 3 : 1, pct * 28);
                    return (
                      <Tooltip key={t.turn_id} text={`Msg ${t.turn_index + 1}: ${rc} attempt${rc !== 1 ? 's' : ''}`}>
                        <div style={{ flex: 1, minWidth: 0, height: h, background: color, borderRadius: 1, cursor: 'default' }} />
                      </Tooltip>
                    );
                  });
                })()}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                {([['#cbd5e1', '0 retries'], ['#94a3b8', '1 retry'], ['#7c3aed', '2+ retries']] as const).map(([c, l]) => (
                  <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 9, color: '#6b7280' }}>
                    <span style={{ width: 6, height: 6, borderRadius: 1, background: c, display: 'inline-block' }} />{l}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tools per user message */}
          {(() => {
            const maxTools = Math.max(...turns.map(t => t.tool_names.length), 0);
            const totalTools = turns.reduce((s, t) => s + t.tool_names.length, 0);
            if (maxTools === 0) return null;
            return (
              <div>
                <div style={{ fontSize: 9, color: '#9ca3af', marginBottom: 3, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tools per msg</span><span>{totalTools} total</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 28 }}>
                  {turns.map(t => {
                    const n = t.tool_names.length;
                    const h = Math.max(1, (n / maxTools) * 28);
                    return (
                      <Tooltip key={t.turn_id} text={`Msg ${t.turn_index + 1}: ${n} tool${n !== 1 ? 's' : ''}${n > 0 ? '\n' + t.tool_names.slice(0, 5).join(', ') + (t.tool_names.length > 5 ? '…' : '') : ''}`}>
                        <div style={{ flex: 1, minWidth: 0, height: h, background: n === 0 ? '#9ca3af' : '#f59e0b', borderRadius: 1, cursor: 'default', opacity: n === 0 ? 0.5 : 0.8 }} />
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Skills per user message */}
          {(() => {
            const maxSkills = Math.max(...turns.map(t => t.skill_names.length), 0);
            const totalSkills = turns.reduce((s, t) => s + t.skill_names.length, 0);
            if (maxSkills === 0) return null;
            return (
              <div>
                <div style={{ fontSize: 9, color: '#9ca3af', marginBottom: 3, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Skills per msg</span><span>{totalSkills} total</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 28 }}>
                  {turns.map(t => {
                    const n = t.skill_names.length;
                    const h = Math.max(1, (n / maxSkills) * 28);
                    return (
                      <Tooltip key={t.turn_id} text={`Msg ${t.turn_index + 1}: ${n} skill${n !== 1 ? 's' : ''}${n > 0 ? '\n' + t.skill_names.join(', ') : ''}`}>
                        <div style={{ flex: 1, minWidth: 0, height: h, background: n === 0 ? '#9ca3af' : '#8b5cf6', borderRadius: 1, cursor: 'default', opacity: n === 0 ? 0.5 : 0.8 }} />
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

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
        {displayTools.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 6, padding: 12, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Tool usage</div>
            {displayTools.map(([tool, u]) => {
              const failedAgents = Object.entries(u.byAgent).filter(([, a]) => a.failed > 0);
              return (
                <div key={tool} style={{ marginBottom: 5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                    <span style={{ color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '52%' }}>🔧 {tool}</span>
                    <span style={{ color: u.failed > 0 ? '#dc2626' : '#6b7280', flexShrink: 0, whiteSpace: 'nowrap' }}>
                      {u.failed > 0 ? `×${u.calls} (${u.failed} failed)` : `×${u.calls}`}
                    </span>
                  </div>
                  <div style={{ height: 3, background: '#e5e7eb', borderRadius: 2, marginBottom: 2 }}>
                    <div style={{ height: 3, width: `${(u.calls / displayTools[0][1].calls) * 100}%`, background: u.failed > 0 ? '#ef4444' : '#f59e0b', borderRadius: 2 }} />
                  </div>
                  {failedAgents.length > 0 && (
                    <div style={{ fontSize: 10, color: '#dc2626', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      ✗ failed by {failedAgents.map(([name]) => name === 'leader' ? 'leader' : name).join(' · ')}
                    </div>
                  )}
                </div>
              );
            })}
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

/** Splits "1) ... 2) ..." recommendation text into styled numbered rows.
 *  Handles both multi-line lists and single-line semicolon-separated lists.
 */
function RecommendationList({ text }: { text: string }) {
  // Try to detect numbered items. Supports:
  //   1) ... 2) ...   (inline or multiline)
  //   1. ... 2. ...
  //   (1) ... (2) ...
  //   separated by newlines or by "; " + number pattern
  const items: { num: number; body: string }[] = [];

  // First, try inline pattern: split on "; " followed by a number marker
  // This handles: "1) foo; 2) bar; 3) baz"
  const inlineSplit = text.split(/;\s*(?=(?:\d+[\.)]|\(\d+\))\s)/);

  const processChunk = (chunk: string) => {
    const m = chunk.match(/^(?:(\d+)[\.)]\s*|\((\d+)\)\s*)/);
    if (!m) return null;
    const num = parseInt(m[1] ?? m[2], 10);
    const body = chunk.slice(m[0].length).trim();
    return { num, body };
  };

  for (const chunk of inlineSplit) {
    // A chunk may itself contain newlines; split those too
    const lines = chunk.split(/\n+/).map(l => l.trim()).filter(Boolean);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const parsed = processChunk(line);
      if (parsed) {
        items.push(parsed);
      } else if (items.length > 0) {
        // Continuation line for the previous item
        items[items.length - 1].body += ' ' + line;
      } else {
        // Preamble before any numbered item — create a pseudo-item
        items.push({ num: 0, body: line });
      }
    }
  }

  // Fallback: if no numbered items found, render as plain prose
  if (items.length === 0 || (items.length === 1 && items[0].num === 0)) {
    return (
      <div style={{ fontSize: 13, color: '#14532d', padding: '9px 11px', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
        {text}
      </div>
    );
  }

  return (
    <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item) => (
        <div key={item.num} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{
            flexShrink: 0,
            fontSize: 11, fontWeight: 700, color: '#15803d',
            background: '#bbf7d0', borderRadius: '50%',
            width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginTop: 1,
          }}>
            {item.num}
          </span>
          <span style={{ fontSize: 13, color: '#14532d', lineHeight: 1.55, paddingTop: 2 }}>
            {item.body}
          </span>
        </div>
      ))}
    </div>
  );
}

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
        <div style={{ padding: '14px 16px', borderTop: `1px solid ${pc.border}55`, display: 'flex', flexDirection: 'column', gap: 14, background: '#fff' }}>
          {/* Description — most prominent narrative block */}
          {issue.description && (
            <div style={{ color: '#1f2937', fontSize: 13.5, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
              {issue.description}
            </div>
          )}

          {/* Evidence — visually distinct raw-data / log card */}
          {issue.evidence && (
            <div style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: '#e2e8f0', fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <span>🧾</span> Evidence
              </div>
              <div style={{ fontSize: 12, color: '#334155', padding: '8px 10px', whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', lineHeight: 1.45 }}>
                {issue.evidence}
              </div>
            </div>
          )}

          {/* Impact + Root Cause — side-by-side when both present, stacked otherwise */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
            {issue.impact && (
              <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                  <span style={{ fontSize: 12 }}>⚠️</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Impact</span>
                </div>
                <div style={{ fontSize: 12.5, color: '#78350f', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 5, padding: '7px 9px', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
                  {issue.impact}
                </div>
              </div>
            )}
            {issue.root_cause && (
              <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                  <span style={{ fontSize: 12 }}>🔍</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Root Cause</span>
                </div>
                <div style={{ fontSize: 12.5, color: '#312e81', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 5, padding: '7px 9px', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
                  {issue.root_cause}
                </div>
              </div>
            )}
          </div>

          {/* Recommendation — most visually prominent, actionable */}
          {issue.recommendation && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: '#dcfce7', fontSize: 10, fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <span>💡</span> Recommendation
              </div>
              <RecommendationList text={issue.recommendation} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Turn List ─────────────────────────────────────────────────────────────────

export function TurnListView({ isConnected, embedded = false }: { isConnected: boolean; embedded?: boolean }) {
  const {
    selectedSession, turns, sessionStats, loading, error, selectTurn, back, clearError,
    analysis, analyzing, analyzeError, analyzeSession, clearAnalyzeError,
  } = useTraceHoundStore();
  const [outcomeFilters, setOutcomeFilters] = useState<Set<string>>(new Set());
  const [filterRetries, setFilterRetries] = useState(false);
  const [filterSlow, setFilterSlow] = useState(false);

  // p90 threshold for slow user messages (only from non-retry — wall time is misleading)
  const p90dur = useMemo(() => {
    const sorted = [...turns].filter(t => t.retry_count <= 1).map(t => t.duration_seconds).filter(d => d > 0).sort((a, b) => a - b);
    if (!sorted.length) return 0;
    return sorted[Math.floor(sorted.length * 0.9)] ?? sorted[sorted.length - 1];
  }, [turns]);

  const visibleTurns = useMemo(() => turns.filter(t => {
    if (outcomeFilters.size > 0 && !outcomeFilters.has(t.outcome)) return false;
    if (filterRetries && t.retry_count <= 1) return false;
    if (filterSlow && (t.retry_count > 1 || t.duration_seconds <= p90dur)) return false;
    return true;
  }), [turns, outcomeFilters, filterRetries, filterSlow, p90dur]);

  const anyFilter = outcomeFilters.size > 0 || filterRetries || filterSlow;

  const [analyticsOpen, setAnalyticsOpen] = useState(true);
  const [messagesOpen, setMessagesOpen] = useState(true);

  const [analysisOpen, setAnalysisOpen] = useState(!!analysis);

  // Compute quick summaries for section headers
  const statsSummary = useMemo(() => {
    const completed = turns.filter(t => t.outcome === 'completed').length;
    const withIssues = turns.filter(t => t.outcome === 'completed_with_issues').length;
    const errors = turns.filter(t => t.outcome === 'error').length;
    const noResp = turns.filter(t => t.outcome === 'no_response').length;
    const deferred = turns.filter(t => t.outcome === 'deferred').length;
    const retryCount = turns.filter(t => t.retry_count > 1).length;
    const totalTools = turns.reduce((s, t) => s + t.tool_names.length, 0);
    const totalSkills = new Set(turns.flatMap(t => t.skill_names)).size;
    return { completed, withIssues, errors, noResp, deferred, retryCount, totalTools, totalSkills };
  }, [turns]);

  return (
    <div style={panelStyle}>
      {/* 1. Header — title left, metadata right */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {!embedded && <button style={btnStyle} onClick={back}>← Back</button>}
            <h2 style={{ ...titleStyle, marginBottom: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {modeBadge(selectedSession?.mode)}{selectedSession?.title ?? selectedSession?.session_id}
            </h2>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end', flexShrink: 0 }}>
          {/* Row 1: session id, date, copy button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 11, color: '#9ca3af' }}>
            <span>{selectedSession?.session_id}</span>
            {sessionStats?.date_range && <span>{sessionStats.date_range}</span>}
            {sessionStats?.history_file_path && (
              <Tooltip text={sessionStats.history_file_path}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'help' }}>
                  <span>📁</span>
                  <CopyButton text={sessionStats.history_file_path} />
                </span>
              </Tooltip>
            )}
          </div>
          {/* Row 2: user msgs · llm calls · events · tokens · costs · latencies · models · context */}
          {sessionStats && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', fontSize: 12, color: '#6b7280', marginTop: 6 }}>
              <span><strong style={{ color: '#374151' }}>{sessionStats.total_turns}</strong> user msgs</span>
              <span><strong style={{ color: '#374151' }}>{sessionStats.total_llm_calls ?? 0}</strong> LLM calls</span>
              <span><strong style={{ color: '#374151' }}>{sessionStats.total_events ?? selectedSession?.message_count ?? 0}</strong> events</span>
              <span><strong style={{ color: '#374151' }}>{(sessionStats.total_tokens ?? 0).toLocaleString()}</strong> tokens</span>
              {(sessionStats.total_cache_tokens ?? 0) > 0 && (
                <span>🔄 <strong style={{ color: '#374151' }}>{sessionStats.total_cache_tokens?.toLocaleString()}</strong> cache</span>
              )}
              {sessionStats.error_count > 0 && (
                <span style={{ color: '#dc2626' }}><strong>{sessionStats.error_count}</strong> with errors</span>
              )}
              {(sessionStats.total_cost ?? 0) > 0 && (
                <span>💰 <strong style={{ color: '#374151' }}>${sessionStats.total_cost?.toFixed(4)}</strong></span>
              )}
              {(sessionStats.avg_total_latency_ms ?? 0) > 0 && (
                <Tooltip text={`Avg TTFT ${(sessionStats.avg_ttft_ms ?? 0).toFixed(0)}ms · Avg TPOT ${(sessionStats.avg_tpot_ms ?? 0).toFixed(1)}ms`}>
                  <span style={{ cursor: 'help' }}>⏱️ <strong style={{ color: '#374151' }}>{((sessionStats.avg_total_latency_ms ?? 0) / 1000).toFixed(1)}s</strong> avg latency</span>
                </Tooltip>
              )}
              {(sessionStats.max_context_usage_percent ?? 0) > 0 && (
                <Tooltip text="Max context window usage across all turns">
                  <span style={{ cursor: 'help', color: (sessionStats.max_context_usage_percent ?? 0) > 80 ? '#dc2626' : '#6b7280' }}>
                    📏 <strong style={{ color: (sessionStats.max_context_usage_percent ?? 0) > 80 ? '#dc2626' : '#374151' }}>{sessionStats.max_context_usage_percent?.toFixed(1)}%</strong> context
                  </span>
                </Tooltip>
              )}
              {sessionStats.channel_id && (
                <span>📡 <strong style={{ color: '#374151' }}>{sessionStats.channel_id}</strong></span>
              )}
              {sessionStats.models_used && sessionStats.models_used.length > 0 && (
                <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  🧠 {sessionStats.models_used.map(m => (
                    <span key={m} style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: '#f3f4f6', color: '#374151' }}>{m}</span>
                  ))}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {error && <ErrorBanner message={error} onClose={clearError} />}
      {analyzeError && <ErrorBanner message={`Analysis failed: ${analyzeError}`} onClose={clearAnalyzeError} />}

      {/* 2. Diagnosis — LLM-powered analysis */}
      <div style={{ marginBottom: 20, border: '1px solid #e0e7ff', borderRadius: 8, background: '#f5f3ff08', overflow: 'hidden' }}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f5f3ff', borderBottom: analysisOpen ? '1px solid #e0e7ff' : 'none', cursor: 'pointer' }}
          onClick={() => setAnalysisOpen(x => !x)}
        >
          <span style={{ fontSize: 15 }}>🔬</span>
          <span style={{ fontWeight: 700, fontSize: 13, color: '#4c1d95' }}>
            Diagnosis
            {analysis && (
              <span style={{ fontSize: 11, fontWeight: 400, color: '#7c3aed', marginLeft: 8 }}>
                {analysis.issues.length} issue{analysis.issues.length !== 1 ? 's' : ''}
                {' · '}
                {new Date(analysis.analyzed_at * 1000).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {!analysis && !analyzing && (
              <span style={{ fontSize: 11, fontWeight: 400, color: C.textFaint, marginLeft: 8 }}>
                No diagnosis yet
              </span>
            )}
            {analyzing && (
              <span style={{ fontSize: 11, fontWeight: 400, color: '#7c3aed', marginLeft: 8 }}>
                Running LLM diagnosis…
              </span>
            )}
          </span>
          {/* Right side: LLM disclaimer only */}
          <span style={{ flex: 1, fontSize: 11, color: C.textFaint, textAlign: 'right', paddingRight: 4 }}>
            uses LLM (costs tokens, takes time)
          </span>
          {analysis && sessionStats?.session_fingerprint && analysis.fingerprint !== sessionStats.session_fingerprint && (
            <Tooltip text="The session history has changed since this diagnosis was run. Re-run to get fresh results.">
              <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 4, background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', cursor: 'help' }}>stale</span>
            </Tooltip>
          )}
          <Tooltip text={analysis ? 'Re-run LLM diagnosis on this session (~30-120s, uses tokens)' : 'Run LLM diagnosis to identify issues, root causes and recommendations (~30-120s, uses tokens)'}>
            <button
              style={{ ...btnStyle, fontSize: 11, background: analyzing ? '#f5f3ff' : '#7c3aed', color: analyzing ? '#7c3aed' : '#fff', border: '1px solid #7c3aed', padding: '3px 10px', cursor: analyzing ? 'not-allowed' : 'pointer' }}
              onClick={e => { e.stopPropagation(); analyzeSession(); }}
              disabled={analyzing || !isConnected}
            >
              {analyzing ? '…' : analysis ? '↻ Re-run' : '🔬 Diagnose'}
            </button>
          </Tooltip>
          <span style={{ fontSize: 12, color: '#7c3aed' }}>{analysisOpen ? '▲' : '▼'}</span>
        </div>
        {analysisOpen && (
          <div style={{ padding: '12px 14px' }}>
            {analyzing && (
              <div style={{ padding: '10px 0', fontSize: 13, color: '#7c3aed', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>🔬</span>
                <span>Sending session history to LLM for diagnosis… this may take up to 2 minutes for slow models.</span>
              </div>
            )}
            {!analyzing && !analysis && (
              <div style={{ color: '#9ca3af', fontSize: 12, padding: '4px 0' }}>
                Nothing to show yet. Click <strong style={{ color: '#6b7280' }}>Diagnose</strong> above to start.
              </div>
            )}
            {!analyzing && analysis && (
              <>
                {analysis.issues.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#6b7280', fontSize: 13, padding: '20px 0' }}>No issues found. Session looks healthy!</div>
                ) : (
                  [...analysis.issues]
                    .sort((a, b) => (a.priority ?? 5) - (b.priority ?? 5))
                    .map((issue, i) => <IssueCard key={i} issue={issue} />)
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* 3. Stats — local data summary (charts, counts, distributions) */}
      {!loading && turns.length > 0 && (
        <div style={{ marginBottom: 20, border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: C.surfaceMuted, borderBottom: analyticsOpen ? `1px solid ${C.border}` : 'none', cursor: 'pointer' }}
            onClick={() => setAnalyticsOpen(x => !x)}
          >
            <span style={{ fontSize: 14 }}>📊</span>
            <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>
              Stats
              <span style={{ fontSize: 11, fontWeight: 400, color: C.textMuted, marginLeft: 8 }}>
                {statsSummary.completed} completed · {statsSummary.withIssues} with problems · {statsSummary.noResp} no response · {statsSummary.errors} errors{statsSummary.deferred > 0 ? ` · ${statsSummary.deferred} deferred` : ''} · {statsSummary.totalTools} tool calls{statsSummary.totalSkills > 0 ? ` · ${statsSummary.totalSkills} skills` : ''}
              </span>
            </span>
            <span style={{ flex: 1, fontSize: 11, color: C.textFaint, textAlign: 'right', paddingRight: 4 }}>from session data</span>
            <span style={{ fontSize: 11, color: C.textFaint }}>{analyticsOpen ? '▲' : '▼'}</span>
          </div>
          {analyticsOpen && <AnalyticsPanel turns={turns} />}
        </div>
      )}

      {/* 4. User messages — turn-by-turn list */}
      {turns.length > 0 && (
        <div style={{ marginBottom: 20, border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: C.surfaceMuted, borderBottom: messagesOpen ? `1px solid ${C.border}` : 'none', cursor: 'pointer' }}
            onClick={() => setMessagesOpen(x => !x)}
          >
            <span style={{ fontSize: 14 }}>💬</span>
            <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>User messages</span>
            <span style={{ flex: 1, fontSize: 11, color: C.textMuted, textAlign: 'right', paddingRight: 4 }}>
              {visibleTurns.length} shown · {turns.length} total{anyFilter ? ` (filtered)` : ''}
            </span>
            <span style={{ fontSize: 11, color: C.textFaint, paddingRight: 4 }}>one-by-one log</span>
            <span style={{ fontSize: 11, color: C.textFaint }}>{messagesOpen ? '▲' : '▼'}</span>
          </div>
          {messagesOpen && (
            <div style={{ padding: '12px 14px' }}>
              {/* Filter bar */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
                {/* Outcome filters */}
                {([
                  { key: 'completed_with_issues', label: '⚠ With Problems', count: statsSummary.withIssues, color: '#f59e0b' },
                  { key: 'no_response', label: '❓ No Response', count: statsSummary.noResp, color: '#8b5cf6' },
                  { key: 'error', label: '❌ Errors', count: statsSummary.errors, color: '#ef4444' },
                  { key: 'deferred', label: '⏸ Deferred', count: statsSummary.deferred, color: '#6366f1' },
                ] as const).map((f) => {
                  const active = outcomeFilters.has(f.key);
                  return (
                    <button key={f.key} onClick={(e) => {
                      e.stopPropagation();
                      setOutcomeFilters(prev => {
                        const next = new Set(prev);
                        if (next.has(f.key)) next.delete(f.key);
                        else next.add(f.key);
                        return next;
                      });
                    }} style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 12,
                      border: `1px solid ${active ? f.color : '#e5e7eb'}`,
                      background: active ? f.color + '18' : '#f9fafb',
                      color: active ? f.color : '#6b7280',
                      cursor: 'pointer', fontWeight: active ? 600 : 400,
                    }}>{f.label}{f.count > 0 ? ` ${f.count}` : ''}</button>
                  );
                })}
                {/* Separator */}
                <span style={{ color: '#e5e7eb', fontSize: 14, userSelect: 'none' }}>|</span>
                {/* Behavioral filters */}
                <button onClick={(e) => { e.stopPropagation(); setFilterRetries(x => !x); }} style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 12,
                  border: `1px solid ${filterRetries ? '#0369a1' : '#e5e7eb'}`,
                  background: filterRetries ? '#e0f2fe' : '#f9fafb',
                  color: filterRetries ? '#0369a1' : '#6b7280',
                  cursor: 'pointer', fontWeight: filterRetries ? 600 : 400,
                }}>🔁 With Retries{statsSummary.retryCount > 0 ? ` ${statsSummary.retryCount}` : ''}</button>
                <Tooltip text={`Show slow user messages${p90dur > 0 ? ` (threshold: ${fmtDuration(p90dur)})` : ''}`}>
                  <button onClick={(e) => { e.stopPropagation(); setFilterSlow(x => !x); }} style={{
                    fontSize: 11, padding: '3px 10px', borderRadius: 12,
                    border: `1px solid ${filterSlow ? '#6366f1' : '#e5e7eb'}`,
                    background: filterSlow ? '#eef2ff' : '#f9fafb',
                    color: filterSlow ? '#6366f1' : '#6b7280',
                    cursor: 'pointer', fontWeight: filterSlow ? 600 : 400,
                  }}>⏱ Slow</button>
                </Tooltip>
                {anyFilter && (
                  <button onClick={(e) => { e.stopPropagation(); setOutcomeFilters(new Set()); setFilterRetries(false); setFilterSlow(false); }}
                    style={{ fontSize: 11, padding: '3px 10px', borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', cursor: 'pointer' }}
                  >Reset</button>
                )}
                {anyFilter && <span style={{ fontSize: 11, color: '#9ca3af' }}>{visibleTurns.length}/{turns.length}</span>}
              </div>

              {loading && <div style={emptyStyle}>Loading user messages…</div>}
              {!loading && turns.length === 0 && <div style={emptyStyle}>No user messages found for this session.</div>}
              {!loading && visibleTurns.length === 0 && <div style={emptyStyle}>No user messages match the active filters.</div>}

              {visibleTurns.map((turn) => {
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
                          {turn.agents && turn.agents.length > 0 && turn.agents.map(name => {
                            const act = turn.agent_activity?.find(a => a.name === name);
                            const tip = act
                              ? `${name}${act.role === 'leader' ? ' (leader)' : ''}\n${act.tool_calls} tool calls · ${act.tool_failures} failed · ${act.responses} responses`
                              : name;
                            return (
                              <Tooltip key={name} text={tip}>
                                {agentTag(name, false)}
                              </Tooltip>
                            );
                          })}
                          <OutcomeBadge outcome={turn.outcome} issues={turn.issues} />
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
                      {/* Right: time / duration / tokens / models / latency / context / cost */}
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
                        {(turn.llm_call_count ?? 0) > 0 && (
                          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{turn.llm_call_count} LLM call{turn.llm_call_count !== 1 ? 's' : ''}</div>
                        )}
                        {turn.total_tokens > 0 && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{turn.total_tokens.toLocaleString()} tok</div>}
                        {turn.final_length > 0 && (
                          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{turn.final_length.toLocaleString()} chars</div>
                        )}
                        {(turn.avg_total_latency_ms ?? 0) > 0 && (
                          <Tooltip text={`Avg TTFT ${(turn.avg_ttft_ms ?? 0).toFixed(0)}ms · Avg TPOT ${(turn.avg_tpot_ms ?? 0).toFixed(1)}ms`}>
                            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1, cursor: 'help' }}>⏱️ {((turn.avg_total_latency_ms ?? 0) / 1000).toFixed(1)}s avg</div>
                          </Tooltip>
                        )}
                        {(turn.context_usage_percent ?? 0) > 0 && (
                          <Tooltip text={`Context window: ${turn.context_window_tokens?.toLocaleString() ?? '?'}`}>
                            <div style={{ fontSize: 11, color: (turn.context_usage_percent ?? 0) > 80 ? '#dc2626' : '#9ca3af', marginTop: 1, cursor: 'help' }}>
                              📏 {(turn.context_usage_percent ?? 0).toFixed(1)}%
                            </div>
                          </Tooltip>
                        )}
                        {(turn.total_cost ?? 0) > 0 && (
                          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>💰 ${(turn.total_cost ?? 0).toFixed(4)}</div>
                        )}
                        {turn.models_used && turn.models_used.length > 0 && (
                          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>{turn.models_used.join(', ')}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── View 3: Turn Detail ───────────────────────────────────────────────────────

const EVENT_META: Record<string, { icon: string; label: string; color: string }> = {
  user:                 { icon: '🧑', label: 'User',             color: '#3b82f6' },
  'chat.reasoning':     { icon: '🤔', label: 'Reasoning',        color: '#8b5cf6' },
  'chat.tool_call':     { icon: '🔧', label: 'Tool Call',        color: '#f59e0b' },
  'chat.tool_update':   { icon: '⏳', label: 'Tool Update',      color: '#d97706' },
  'chat.tool_result':   { icon: '',   label: 'Tool Result',      color: '#10b981' },
  'chat.final':         { icon: '💬', label: 'Response',         color: '#6366f1' },
  'chat.file':          { icon: '📄', label: 'File',             color: '#06b6d4' },
  'chat.usage_metadata':{ icon: '⚡', label: 'LLM Call',         color: '#ec4899' },
  'chat.usage_summary': { icon: '📊', label: 'Usage Summary',    color: '#6b7280' },
  'chat.error':         { icon: '🚨', label: 'Error',            color: '#ef4444' },
};

function RecordCard({ rec, isRetry, displayDelta, endDelta, allRecords, expandAll = false }: { rec: HistoryRecord; isRetry: boolean; displayDelta: number | null; endDelta?: number | null; allRecords?: HistoryRecord[]; expandAll?: boolean }) {
  const key = rec.role === 'user' ? 'user' : (rec.event_type ?? '');
  const meta = EVENT_META[key] ?? { icon: '•', label: rec.event_type ?? rec.role, color: '#6b7280' };
  const icon  = key === 'chat.tool_result' ? (isFailedToolResult(rec) ? '❌' : '✅') : meta.icon;
  const color = (key === 'chat.tool_result' && isFailedToolResult(rec)) ? '#ef4444' : meta.color;
  const danger = isDangerous(rec);

  const headerLabel = recordHeaderLabel(rec);

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

  // Extract usage_metadata details
  const um = key === 'chat.usage_metadata' ? rec.metadata?.usage_metadata : null;
  const hasUsageError = um && (um.code !== 0 || um.err_msg);

  // Cards collapse to their header by default so a long trajectory fits on one
  // screen. The user message is always visible; every other card (final
  // response, tool calls/results, reasoning, usage) starts collapsed.
  // `expandAll` (turn-level toggle) overrides; a manual header click pins a
  // per-card override until the toggle is flipped (parent remounts via key).
  const isUser = key === 'user';
  const collapsible = !isUser;
  const [local, setLocal] = useState<boolean | null>(null);
  const shown = local ?? (expandAll ? true : false);

  // displayDelta is computed by TurnDetailView and tracks time within the current attempt,
  // resetting to 0 at the start of each attempt (after a gap separator). This avoids showing
  // "+56s" when the actual attempt took ~1s (the 56s was idle time between retries).

  return (
    <div style={{ border: `1px solid ${color}33`, borderLeft: `3px solid ${danger ? '#ef4444' : color}`, borderRadius: 6, marginBottom: 8, background: '#fff', overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: collapsible ? 'pointer' : 'default', background: danger ? '#fef2f2' : color + '08' }}
        onClick={() => collapsible && setLocal(!shown)}
      >
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontWeight: 600, fontSize: 13, color, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{headerLabel}</span>
        {recordAgent(rec) && agentTag(recordAgent(rec))}
        {rec.mode && <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: '#f3f4f6', color: '#6b7280', flexShrink: 0 }}>{rec.mode}</span>}
        {(key === 'chat.tool_call' || key === 'chat.tool_update' || key === 'chat.tool_result') && rec.tool_call_id && (
          <span style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace', flexShrink: 0 }}>#{String(rec.tool_call_id).slice(-8)}</span>
        )}
        {danger && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}>⚠ DANGEROUS</span>}
        {isRetry && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>↻ retry</span>}
        {/* Timing: absolute time + elapsed time within this attempt */}
        <span style={{ fontSize: 11, color: '#9ca3af', textAlign: 'right', flexShrink: 0 }}>
          <span>{fmtTime(rec.timestamp)}</span>
          {displayDelta != null && displayDelta > 0 && (
            <Tooltip text={
              endDelta != null && endDelta > displayDelta
                ? `LLM call ${fmtDelta(displayDelta)} → response ${fmtDelta(endDelta)}`
                : `${fmtDelta(displayDelta)} since start of this attempt`
            }>
              <span style={{ marginLeft: 5, color: displayDelta > 10 ? '#f59e0b' : '#d1d5db', cursor: 'help' }}>
                {endDelta != null && endDelta > displayDelta
                  ? `${fmtDelta(displayDelta)} → ${fmtDelta(endDelta)}`
                  : fmtDelta(displayDelta)}
              </span>
            </Tooltip>
          )}
        </span>
        {collapsible && <span style={{ fontSize: 12, color: '#9ca3af' }}>{shown ? '▲' : '▼'}</span>}
        {rec.id && <span style={{ fontSize: 9, color: '#d1d5db', fontFamily: 'monospace', flexShrink: 0 }} title={`Record ID: ${rec.id}`}>{rec.id.slice(-12)}</span>}
      </div>

      {/* User message — always visible */}
      {key === 'user' && bodyText && (
        <div style={{ padding: '8px 12px', fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap', wordBreak: 'break-word', borderTop: `1px solid ${color}22` }}>
          {bodyText}
        </div>
      )}
      {/* Final response — collapsed by default, expand on click */}
      {key === 'chat.final' && shown && bodyText && (
        <div style={{ padding: '8px 12px', fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap', wordBreak: 'break-word', borderTop: `1px solid ${color}22` }}>
          {bodyText}
        </div>
      )}

      {/* Tool call arguments (shown when expanded) */}
      {key === 'chat.tool_call' && shown && fmtArgs && (
        <div style={{ padding: '8px 12px', borderTop: `1px solid ${color}22` }}>
          <pre style={{ margin: 0, fontSize: 12, background: '#f8fafc', borderRadius: 4, padding: '8px', overflowX: 'auto', color: '#1e293b', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {fmtArgs}
          </pre>
        </div>
      )}

      {/* Tool result (shown when expanded) */}
      {key === 'chat.tool_result' && shown && (resultText || isFailedToolResult(rec)) && (
        <div style={{ padding: '8px 12px', borderTop: `1px solid ${color}22` }}>
          {isFailedToolResult(rec) && <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 6 }}><strong>{rec.error_type ? `❌ ${rec.error_type}` : '❌ Tool call failed'}</strong>{rec.error_detail ? `: ${rec.error_detail}` : ''}</div>}
          {resultText && (
            <pre style={{ margin: 0, fontSize: 12, background: '#f8fafc', borderRadius: 4, padding: '8px', overflowX: 'auto', color: isFailedToolResult(rec) ? '#b91c1c' : '#1e293b', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 300, overflowY: 'auto' }}>
              {resultText}
            </pre>
          )}
          {rec.raw_output && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, fontWeight: 600 }}>Raw Output</div>
              <pre style={{ margin: 0, fontSize: 11, background: '#f1f5f9', borderRadius: 4, padding: '8px', overflowX: 'auto', color: '#334155', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 300, overflowY: 'auto' }}>
                {(() => {
                  try { return JSON.stringify(rec.raw_output, null, 2); }
                  catch { return String(rec.raw_output); }
                })()}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Other types (reasoning / file / error) — shown when expanded */}
      {(key === 'chat.reasoning' || key === 'chat.file' || key === 'chat.error') && shown && bodyText && (
        <div style={{ padding: '8px 12px', borderTop: `1px solid ${color}22` }}>
          <div style={{ fontSize: 13, color: key === 'chat.error' ? '#dc2626' : '#374151', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontStyle: key === 'chat.reasoning' ? 'italic' : 'normal' }}>
            {bodyText}
          </div>
        </div>
      )}

      {/* Usage metadata: LLM call details (collapsed with the card; hidden via
          display so the prompt/response sub-components keep stable hooks) */}
      {key === 'chat.usage_metadata' && um && (
        <div style={{ padding: '8px 12px', borderTop: `1px solid ${color}22`, display: shown ? 'block' : 'none' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            {um.model_name && <span style={chipStyle}>{um.model_name}</span>}
            {um.input_tokens != null && um.output_tokens != null && (
              <span style={chipStyle}>{um.input_tokens.toLocaleString()} in / {um.output_tokens.toLocaleString()} out = {um.total_tokens?.toLocaleString() ?? '?'} tot</span>
            )}
            {um.cache_tokens != null && um.cache_tokens > 0 && <span style={chipStyle}>🔄 {um.cache_tokens.toLocaleString()} cache</span>}
          </div>
          {shown && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
              {rec.metadata?.total_latency_ms != null && (
                <Tooltip text="Total LLM latency"><span style={{ ...chipStyle, cursor: 'help' }}>{(rec.metadata.total_latency_ms / 1000).toFixed(2)}s total</span></Tooltip>
              )}
              {rec.metadata?.ttft_ms != null && (
                <Tooltip text="Time to first token"><span style={{ ...chipStyle, cursor: 'help' }}>{rec.metadata.ttft_ms.toFixed(0)}ms TTFT</span></Tooltip>
              )}
              {rec.metadata?.tpot_ms != null && (
                <Tooltip text="Time per output token"><span style={{ ...chipStyle, cursor: 'help' }}>{rec.metadata.tpot_ms.toFixed(1)}ms TPOT</span></Tooltip>
              )}
              {um.total_latency != null && um.total_latency > 0 && (
                <Tooltip text="Raw total_latency value"><span style={{ ...chipStyle, cursor: 'help' }}>raw {um.total_latency.toFixed(2)}s</span></Tooltip>
              )}
              {um.input_cost != null && um.input_cost > 0 && um.output_cost != null && um.output_cost > 0 && (
                <span style={chipStyle}>💰 ${um.input_cost.toFixed(4)} in / ${um.output_cost.toFixed(4)} out</span>
              )}
              {um.total_cost != null && um.total_cost > 0 && (
                <span style={chipStyle}>💰 ${um.total_cost.toFixed(4)} total</span>
              )}
              {rec.metadata?.result_type && <span style={chipStyle}>📋 {rec.metadata.result_type}</span>}
              {um.task_id && <span style={chipStyle}>🎯 {um.task_id}</span>}
              {um.first_token_time && <span style={chipStyle}>🕐 FT {um.first_token_time}</span>}
              {um.request_start_time && <span style={chipStyle}>🕐 RS {um.request_start_time}</span>}
            </div>
          )}
          {/* LLM Prompt — always shown so user knows if it's missing */}
          {key === 'chat.usage_metadata' && um && (() => {
            const [showFullPrompt, setShowFullPrompt] = useState(false);
            return (
              <div style={{ marginTop: 8, padding: '8px 10px', background: '#f8fafc', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <strong style={{ color: '#6b7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>LLM Prompt</strong>
                  {um.prompt ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, border: '1px solid #d1d5db', background: '#fff', color: '#6b7280', cursor: 'pointer' }}
                        onClick={() => setShowFullPrompt(x => !x)}
                      >
                        {showFullPrompt ? '▲ Collapse' : '▼ Show full'}
                      </button>
                      <CopyButton text={um.prompt} />
                    </div>
                  ) : null}
                </div>
                {um.prompt ? (
                  <pre style={{ margin: '6px 0 0', fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#334155', maxHeight: showFullPrompt ? undefined : 240, overflowY: 'auto' }}>{um.prompt}</pre>
                ) : (
                  <div style={{ marginTop: 6, fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>
                    Not recorded in history (backend `usage_metadata` events contain empty `prompt` field).
                  </div>
                )}
              </div>
            );
          })()}

          {/* LLM Response — shows the raw LLM output (final text, tool calls, reasoning, errors) that correspond to this usage_metadata record */}
          {key === 'chat.usage_metadata' && um && (() => {
            const responseRecs = findLLMResponseForUsage(rec, allRecords ?? []);
            const [showFullResponse, setShowFullResponse] = useState(false);

            // Build a combined text representation of the response
            const responseParts = responseRecs.map(r => {
              const et = r.event_type ?? '';
              if (et === 'chat.final') {
                return { type: 'text' as const, label: 'Text', content: r.content ?? '' };
              }
              if (et === 'chat.llm_call_end') {
                return { type: 'text' as const, label: 'Text', content: r.content ?? '' };
              }
              if (et === 'chat.tool_call') {
                const tc = r.tool_call as Record<string, unknown> | undefined;
                const name = tc?.name ?? r.tool_name ?? 'unknown';
                const args = tc?.arguments ?? r.content ?? '';
                let fmtArgs = '';
                try { fmtArgs = JSON.stringify(typeof args === 'string' ? JSON.parse(args) : args, null, 2); }
                catch { fmtArgs = String(args ?? ''); }
                return { type: 'tool_call' as const, label: `Tool: ${name}`, content: fmtArgs };
              }
              if (et === 'chat.reasoning') {
                return { type: 'reasoning' as const, label: 'Reasoning', content: r.content ?? '' };
              }
              if (et === 'chat.delta') {
                return { type: 'delta' as const, label: 'Stream delta', content: r.content ?? '' };
              }
              if (et === 'chat.error') {
                return { type: 'error' as const, label: 'Error', content: r.error ?? r.error_detail ?? r.content ?? '' };
              }
              return null;
            }).filter(Boolean) as { type: string; label: string; content: string }[];

            const hasResponse = responseParts.length > 0;
            const combinedText = responseParts.map(p => `[${p.label}]\n${p.content}`).join('\n\n---\n\n');

            return (
              <div style={{ marginTop: 8, padding: '8px 10px', background: '#f0fdf4', borderRadius: 4, border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <strong style={{ color: '#166534', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>LLM Response</strong>
                  {hasResponse ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, border: '1px solid #86efac', background: '#fff', color: '#166534', cursor: 'pointer' }}
                        onClick={() => setShowFullResponse(x => !x)}
                      >
                        {showFullResponse ? '▲ Collapse' : '▼ Show full'}
                      </button>
                      <CopyButton text={combinedText} />
                    </div>
                  ) : null}
                </div>
                {hasResponse ? (
                  <div style={{ marginTop: 6, maxHeight: showFullResponse ? undefined : 240, overflowY: 'auto' }}>
                    {responseParts.map((part, i) => (
                      <div key={i} style={{ marginBottom: i < responseParts.length - 1 ? 8 : 0 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#15803d', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{part.label}</div>
                        <pre style={{ margin: 0, fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#14532d', background: '#dcfce7', borderRadius: 3, padding: '6px 8px' }}>{part.content}</pre>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ marginTop: 6, fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>
                    No response events found after this LLM call in the trajectory. The response may have been dropped, not recorded, or this was a usage-only event.
                  </div>
                )}
              </div>
            );
          })()}
          {rec.session_id && (
            <div style={{ fontSize: 10, color: '#d1d5db', marginTop: 4, fontFamily: 'monospace' }}>session: {rec.session_id}</div>
          )}
          {hasUsageError && (
            <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>
              ⚠ Code {um.code}: {um.err_msg}
            </div>
          )}
        </div>
      )}

      {/* Tool update: status + arguments */}
      {key === 'chat.tool_update' && (
        <div style={{ padding: '8px 12px', borderTop: `1px solid ${color}22` }}>
          {rec.status && (
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: rec.status === 'in_progress' ? '#dbeafe' : '#dcfce7', color: rec.status === 'in_progress' ? '#2563eb' : '#16a34a' }}>
                {rec.status}
              </span>
            </div>
          )}
          {rec.arguments && (
            <pre style={{ margin: 0, fontSize: 12, background: '#f8fafc', borderRadius: 4, padding: '8px', overflowX: 'auto', color: '#1e293b', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {(() => { try { return JSON.stringify(JSON.parse(rec.arguments), null, 2); } catch { return rec.arguments; } })()}
            </pre>
          )}
        </div>
      )}

      {/* Usage summary chips */}
      {key === 'chat.usage_summary' && (
        <div style={{ padding: '6px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {rec.model && <span style={chipStyle}>{rec.model}</span>}
          {rec.total_tokens != null && <span style={chipStyle}>{rec.total_tokens.toLocaleString()} tokens</span>}
          {rec.usage?.input_tokens != null && rec.usage?.output_tokens != null && (
            <span style={chipStyle}>{rec.usage.input_tokens.toLocaleString()} in / {rec.usage.output_tokens.toLocaleString()} out</span>
          )}
          {(rec.usage_percent ?? 0) > 0 && (
            <Tooltip text={`Context window: ${rec.context_window_tokens?.toLocaleString() ?? '?'}`}>
              <span style={{ ...chipStyle, cursor: 'help' }}>{rec.usage_percent?.toFixed(1) ?? '?'}% context</span>
            </Tooltip>
          )}
          {rec.ttft_ms != null && <Tooltip text="Time to first token"><span style={{ ...chipStyle, cursor: 'help' }}>TTFT {rec.ttft_ms.toFixed(0)}ms</span></Tooltip>}
          {rec.tpot_ms != null && <Tooltip text="Time per output token"><span style={{ ...chipStyle, cursor: 'help' }}>TPOT {rec.tpot_ms.toFixed(1)}ms</span></Tooltip>}
          {rec.total_latency_ms != null && <Tooltip text="Total LLM latency"><span style={{ ...chipStyle, cursor: 'help' }}>{(rec.total_latency_ms / 1000).toFixed(1)}s latency</span></Tooltip>}
          {rec.session_id && <span style={{ fontSize: 9, color: '#d1d5db', fontFamily: 'monospace', alignSelf: 'center' }}>{rec.session_id.slice(-12)}</span>}
        </div>
      )}
    </div>
  );
}

/// Gap threshold: if two consecutive records are more than this apart, show an idle separator
const IDLE_GAP_THRESHOLD_S = 30;

export function TurnDetailView() {
  const { selectedSession, selectedTurnId, turns, turnRecords, loading, error, back, clearError } = useTraceHoundStore();
  const turn = turns.find(t => t.turn_id === selectedTurnId);
  const retrySet = useMemo(() => buildRetrySet(turnRecords), [turnRecords]);

  // Collapse-by-default: every card shows only its header until expanded.
  // "Expand all" overrides; toggling it remounts the cards (key) to reset
  // any per-card manual overrides.
  const [expandAll, setExpandAll] = useState(false);

  // Floating "back to top" button — the panel div is the scroll container.
  const panelRef = useRef<HTMLDivElement>(null);
  const [showTop, setShowTop] = useState(false);

  // Build display list: inject idle gap separators between records that are far apart.
  // Also compute displayDelta per record = elapsed time within the current attempt,
  // resetting to 0 whenever a new attempt starts (right after a separator).
  // This means the first record of each attempt shows no "+Xs", and subsequent records
  // show time elapsed within that attempt — never the misleading idle gap duration.
  const displayItems = useMemo(() => {
    type Item =
      | { type: 'record'; rec: HistoryRecord; displayDelta: number | null; endDelta?: number | null }
      | { type: 'gap'; seconds: number };
    const items: Item[] = [];
    let attemptStartTs = 0;
    let prevTs = 0;

    const pushRecord = (rec: HistoryRecord, i: number, displayDelta: number | null) => {
      let endDelta: number | null = null;
      if (rec.event_type === 'chat.usage_metadata') {
        // LLM Call card: show when the call actually ended — the first
        // chat.llm_call_end after this usage record (the response/answer of that
        // call), not later tool execution or the next call.
        let endTs = 0;
        for (let j = i + 1; j < turnRecords.length; j++) {
          const rj = turnRecords[j];
          const et = rj.event_type ?? '';
          if (et === 'chat.usage_metadata' || rj.role === 'user') break;
          if (et === 'chat.llm_call_end') {
            endTs = rj.timestamp ?? 0;
            break;
          }
          if (!endTs && (et === 'chat.final' || et === 'chat.tool_call' || et === 'chat.delta')) {
            endTs = rj.timestamp ?? 0;
          }
        }
        if (endTs > 0) {
          const d = endTs - attemptStartTs;
          endDelta = d > 0 ? d : null;
        }
      }
      items.push({ type: 'record', rec, displayDelta, endDelta });
    };

    turnRecords.forEach((rec, i) => {
      const ts = rec.timestamp ?? 0;

      if (i === 0) {
        attemptStartTs = ts;
        prevTs = ts;
        pushRecord(rec, i, null);
        return;
      }

      const deltaFromPrev = ts - prevTs;
      const prevEt = turnRecords[i - 1]?.event_type ?? '';

      // A tool_result after a tool_call is the same tool execution — the gap is
      // the tool's runtime, not idle time and not a retry. Keep the attempt
      // clock running so the result shows its real elapsed time.
      const isToolResultGap = rec.event_type === 'chat.tool_result' && prevEt === 'chat.tool_call';

      if (deltaFromPrev > IDLE_GAP_THRESHOLD_S && !isToolResultGap) {
        // Large idle gap: separator + reset attempt clock
        items.push({ type: 'gap', seconds: deltaFromPrev });
        attemptStartTs = ts;
        // First record of the new attempt — no delta to show
        pushRecord(rec, i, null);
      } else {
        const attemptDelta = ts - attemptStartTs;
        pushRecord(rec, i, attemptDelta > 0 ? attemptDelta : null);
      }

      prevTs = ts;
    });

    return items;
  }, [turnRecords]);

  const downloadPage = () => {
    const chunks: string[] = [];
    chunks.push(`USER MESSAGE #${(turn?.turn_index ?? 0) + 1}${selectedSession?.title ? ` — ${selectedSession.title}` : ''}`);
    if (turn?.timestamp) {
      let meta = fmtDateTime(turn.timestamp);
      if (turn.duration_seconds > 0 && turn.retry_count <= 1) meta += ` · ${fmtDuration(turn.duration_seconds)}`;
      chunks.push(meta);
    }
    const chips: string[] = [];
    if (turn) {
      if (turn.outcome) chips.push(`outcome: ${turn.outcome}${turn.issues && turn.issues.length > 0 ? ` (${turn.issues.join(', ')})` : ''}`);
      if (turn.total_tokens > 0) chips.push(`${turn.total_tokens.toLocaleString()} tok`);
      if (turn.llm_call_count > 0) chips.push(`${turn.llm_call_count} LLM call${turn.llm_call_count !== 1 ? 's' : ''}`);
      if (turn.tool_names.length > 0) chips.push(`${turn.tool_names.length} tool${turn.tool_names.length !== 1 ? 's' : ''}`);
      if (turn.skill_names.length > 0) chips.push(`${turn.skill_names.length} skill${turn.skill_names.length !== 1 ? 's' : ''}`);
      if (turn.tool_failures > 0) chips.push(`${turn.tool_failures} failed`);
      if (turn.file_count > 0) chips.push(`${turn.file_count} file${turn.file_count !== 1 ? 's' : ''}`);
      if ((turn.avg_total_latency_ms ?? 0) > 0) chips.push(`${((turn.avg_total_latency_ms ?? 0) / 1000).toFixed(1)}s avg`);
      const ctxPct = turn.context_usage_percent ?? 0;
      if (ctxPct > 0) chips.push(`${ctxPct.toFixed(1)}% ctx`);
      if ((turn.total_cost ?? 0) > 0) chips.push(`$${(turn.total_cost ?? 0).toFixed(4)}`);
      if (turn.models_used && turn.models_used.length > 0) chips.push(`models: ${turn.models_used.join(', ')}`);
      if (turn.retry_count > 1) chips.push(`${turn.retry_count} attempts`);
    }
    if (chips.length) chunks.push(chips.join(' · '));

    chunks.push('');
    for (const item of displayItems) {
      if (item.type === 'gap') {
        chunks.push('', `⏸ ${fmtDuration(item.seconds)} idle — retry triggered by next incoming message`, '');
      } else {
        chunks.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        chunks.push(recordToText(item.rec, turnRecords));
      }
    }
    downloadText(chunks.join('\n'), `turn-${selectedTurnId?.slice(0, 8) ?? 'export'}-page.txt`);
  };

  const downloadMd = () => {
    downloadText(turnToStepByStepMarkdown(turnRecords), `turn-${selectedTurnId?.slice(0, 8) ?? 'export'}-step-by-step.md`);
  };

  return (
    <div style={panelStyle} ref={panelRef} onScroll={e => setShowTop((e.target as HTMLDivElement).scrollTop > 400)}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <button style={btnStyle} onClick={back}>← Back</button>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ ...titleStyle, marginBottom: 0, fontSize: 15 }}>
              User Message #{(turn?.turn_index ?? 0) + 1}
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
          {turn && <OutcomeBadge outcome={turn.outcome} issues={turn.issues} />}
          {turn && turn.total_tokens > 0 && <span style={chipStyle}>{turn.total_tokens.toLocaleString()} tok</span>}
          {turn && turn.llm_call_count > 0 && <span style={chipStyle}>{turn.llm_call_count} LLM call{turn.llm_call_count !== 1 ? 's' : ''}</span>}
          {turn && turn.tool_names.length > 0 && <span style={{ ...chipStyle, color: '#f59e0b', background: '#fffbeb', border: '1px solid #fde68a' }}>{turn.tool_names.length} tool{turn.tool_names.length !== 1 ? 's' : ''}</span>}
          {turn && turn.skill_names.length > 0 && <span style={{ ...chipStyle, color: '#7c3aed', background: '#f5f3ff', border: '1px solid #ddd6fe' }}>🎯 {turn.skill_names.length} skill{turn.skill_names.length !== 1 ? 's' : ''}</span>}
          {turn && turn.tool_failures > 0 && <span style={{ ...chipStyle, color: '#dc2626', background: '#fee2e2', border: '1px solid #fca5a5' }}>{turn.tool_failures} failed</span>}
          {turn && turn.file_count > 0 && <span style={{ ...chipStyle, color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0' }}>📄 {turn.file_count}</span>}
          {turn && (turn.avg_total_latency_ms ?? 0) > 0 && (
            <Tooltip text={`Avg TTFT ${(turn.avg_ttft_ms ?? 0).toFixed(0)}ms · Avg TPOT ${(turn.avg_tpot_ms ?? 0).toFixed(1)}ms`}>
              <span style={{ ...chipStyle, cursor: 'help' }}>⏱️ {((turn.avg_total_latency_ms ?? 0) / 1000).toFixed(1)}s avg</span>
            </Tooltip>
          )}
          {turn && (turn.context_usage_percent ?? 0) > 0 && (
            <Tooltip text={`Context window: ${turn.context_window_tokens?.toLocaleString() ?? '?'}`}>
              <span style={{ ...chipStyle, cursor: 'help', color: (turn.context_usage_percent ?? 0) > 80 ? '#dc2626' : '#374151' }}>📏 {(turn.context_usage_percent ?? 0).toFixed(1)}%</span>
            </Tooltip>
          )}
          {turn && (turn.total_cost ?? 0) > 0 && <span style={chipStyle}>💰 ${(turn.total_cost ?? 0).toFixed(4)}</span>}
          {turn && turn.models_used && turn.models_used.length > 0 && (
            <span style={{ ...chipStyle }}>🧠 {turn.models_used.join(', ')}</span>
          )}
          {turn && turn.retry_count > 1 && (
            <Tooltip text={`This request was attempted ${turn.retry_count} times. Each retry was triggered when a new message arrived while the original was still pending. Idle time between attempts is shown as grey separators in the timeline below.`}>
              <span style={{ ...chipStyle, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', cursor: 'help' }}>
                {turn.retry_count} attempts
              </span>
            </Tooltip>
          )}
          <button style={{ ...btnStyle, fontSize: 12 }} title={expandAll ? 'Collapse all cards back to their headers' : 'Expand all cards to show their full content'}
            onClick={() => setExpandAll(x => !x)}
            disabled={turnRecords.length === 0}>
            {expandAll ? '⏫ Collapse all' : '⏬ Expand all'}
          </button>
          <button style={{ ...btnStyle, fontSize: 12 }} title="Download this turn's trajectory as JSON"
            onClick={() => downloadJson(turnRecords, `turn-${selectedTurnId?.slice(0, 8) ?? 'export'}.json`)}
            disabled={turnRecords.length === 0}>
            ⬇ JSON
          </button>
          <button style={{ ...btnStyle, fontSize: 12 }} title="Download this page's content as text — same boxes, order and data as on screen"
            onClick={downloadPage}
            disabled={turnRecords.length === 0}>
            ⬇ Page
          </button>
          <button style={{ ...btnStyle, fontSize: 12 }} title="Download this turn as step-by-step markdown (sections + tables, like docs-michael/step-by-step.md)"
            onClick={downloadMd}
            disabled={turnRecords.length === 0}>
            ⬇ MD
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
        return <RecordCard key={`${expandAll}:${rec.id ?? `${rec.event_type}-${i}`}`} rec={rec} isRetry={retrySet.has(rec.id)} displayDelta={item.displayDelta} endDelta={item.endDelta} allRecords={turnRecords} expandAll={expandAll} />;
      })}

      {/* Floating scroll-to-top button (appears once scrolled down) */}
      {showTop && (
        <button
          onClick={() => panelRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{ position: 'fixed', bottom: 28, right: 28, width: 40, height: 40, borderRadius: '50%', border: '1px solid #d1d5db', background: '#ffffff', color: '#374151', fontSize: 18, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.18)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Scroll to top"
        >
          ↑
        </button>
      )}
    </div>
  );
}

// ── Session-scoped Trajectory Panel (chat integration) ───────────────────────

interface TrajectoryPanelProps {
  sessionId: string;
  sessionTitle: string;
  sessionMode?: string | null;
  isConnected: boolean;
  /** When enabled (tracehound.live_updates_enabled), live-poll the session's
   *  history file mtime and refresh the trajectory only when it changes. */
  liveUpdatesEnabled?: boolean;
  onClose: () => void;
}

/**
 * The Trajectory panel shown in the chat workspace's right slot. Opens the
 * currently active session's turn list directly (skipping the global session
 * browser), scoped via openCurrentSession. Default view is the turn list; the
 * user drills into a turn's detail from there.
 */
export function TrajectoryPanel({ sessionId, sessionTitle, sessionMode, isConnected, liveUpdatesEnabled = false, onClose }: TrajectoryPanelProps) {
  const selectedTurnId = useTraceHoundStore((s) => s.selectedTurnId);
  const openCurrentSession = useTraceHoundStore((s) => s.openCurrentSession);
  const refreshTurns = useTraceHoundStore((s) => s.refreshTurns);
  const analyzing = useTraceHoundStore((s) => s.analyzing);
  const loading = useTraceHoundStore((s) => s.loading);

  useEffect(() => {
    void openCurrentSession(sessionId, sessionTitle, sessionMode ?? undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const [live, setLive] = useState(false);
  const mtimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!liveUpdatesEnabled || !isConnected || analyzing || loading) return;
    let stopped = false;
    const tick = async () => {
      try {
        const r = await webRequest<{ mtime: number | null }>(
          'tracehound.session.mtime',
          { session_id: sessionId }
        );
        if (stopped) return;
        const next = r?.mtime ?? null;
        if (shouldRefetch(mtimeRef.current, next)) {
          await refreshTurns(sessionId);
        }
        if (stopped) return;
        mtimeRef.current = next;
        setLive(true);
      } catch {
        if (!stopped) setLive(false);
      }
    };
    mtimeRef.current = null;
    void tick();
    const id = window.setInterval(tick, POLL_INTERVAL_MS);
    return () => { stopped = true; window.clearInterval(id); setLive(false); };
  }, [sessionId, liveUpdatesEnabled, isConnected, analyzing, loading, refreshTurns]);

  return (
    <div
      className="bg-panel"
      style={{ flex: '1 1 0', minWidth: 300, maxWidth: 720, height: '100%', display: 'flex', flexDirection: 'column' }}
      data-testid="tracehound-trajectory-panel"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 16px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Trajectory</span>
        {live && <span style={{ fontSize: 10, color: C.ok }}>● LIVE</span>}
        <button style={btnStyle} onClick={onClose} title="Close trajectory panel">
          ✕ Close
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {selectedTurnId ? (
          <TurnDetailView />
        ) : (
          <TurnListView isConnected={isConnected} embedded />
        )}
      </div>
    </div>
  );
}
