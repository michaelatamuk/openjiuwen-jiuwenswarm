/**
 * TraceHound Store — Session Trajectory Viewer
 *
 * Manages state for browsing past sessions turn-by-turn and viewing
 * each turn's full ReAct trajectory (reasoning → tool calls → final response).
 */

import { create } from 'zustand';
import { webRequest } from '../services/webClient';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TraceHoundSessionItem {
  session_id: string;
  title?: string;
  channel_id?: string;
  last_message_at?: number;
  created_at?: number;
  message_count?: number;
  round_id?: number;      // how many user message turns occurred
  total_tokens?: number;  // cumulative tokens consumed
  llm_calls?: number;     // total LLM API calls across all turns
  total_events?: number;  // total non-noise events across all turns
  mode?: string;
}

export interface TurnSummary {
  turn_id: string;
  turn_index: number;
  /** First 120 chars of the user message for this turn */
  user_content: string;
  timestamp: number;
  tool_names: string[];
  skill_names: string[];
  has_final: boolean;
  has_error: boolean;
  error_category: string | null;
  total_tokens: number;
  tool_failures: number;
  file_count: number;
  final_length: number;
  duration_seconds: number;
  retry_count: number;
  was_deferred: boolean;
  query_type: string;
  outcome: 'completed' | 'completed_with_issues' | 'no_response' | 'error' | 'deferred';
  issues: string[];
  mode: string | null;
  llm_call_count: number;
  event_count: number;
}

export interface SessionStats {
  total_turns: number;
  error_count: number;
  total_tokens: number;
  total_llm_calls: number;
  total_events: number;
  date_range: string;
  history_file_path: string;
  session_fingerprint?: string;
}

export interface AnalysisIssue {
  priority: number;          // 1 (highest) – 5 (lowest)
  title: string;
  description: string;
  evidence: string;
  impact: string;
  root_cause: string;
  recommendation: string;
}

export interface SessionAnalysis {
  session_id: string;
  fingerprint: string;       // matches SessionStats.session_fingerprint when fresh
  analyzed_at: number;       // unix timestamp
  issues: AnalysisIssue[];
}

export interface HistoryRecord {
  id: string;
  role: 'user' | 'assistant';
  request_id: string;
  event_type: string | null;
  content: string;
  timestamp: number;
  mode: string | null;
  tool_name?: string;
  tool_call?: { id: string; name: string; arguments: unknown };
  result?: string;
  raw_output?: unknown;
  error_type?: string | null;
  error_detail?: string | null;
  error?: string | null;
  total_tokens?: number;
  // LLM timing (populated from raw_output when present)
  ttft_ms?: number | null;
  tpot_ms?: number | null;
  total_latency_ms?: number | null;
  // Per-event timing computed by backend
  delta_from_prev_s?: number;
  elapsed_from_start_s?: number;
}

// ── Store ─────────────────────────────────────────────────────────────────────

const ANALYSIS_LS_PREFIX = 'tracehound_analysis_';

function loadAnalysisFromStorage(sessionId: string): SessionAnalysis | null {
  try {
    const raw = localStorage.getItem(ANALYSIS_LS_PREFIX + sessionId);
    if (!raw) return null;
    return JSON.parse(raw) as SessionAnalysis;
  } catch { return null; }
}

function saveAnalysisToStorage(analysis: SessionAnalysis) {
  try {
    localStorage.setItem(ANALYSIS_LS_PREFIX + analysis.session_id, JSON.stringify(analysis));
  } catch { /* ignore quota errors */ }
}

interface TraceHoundState {
  sessions: TraceHoundSessionItem[];
  selectedSessionId: string | null;
  selectedSession: TraceHoundSessionItem | null;
  turns: TurnSummary[];
  sessionStats: SessionStats | null;
  selectedTurnId: string | null;
  turnRecords: HistoryRecord[];
  loading: boolean;
  error: string | null;

  // LLM analysis
  analysis: SessionAnalysis | null;
  analyzing: boolean;
  analyzeError: string | null;

  loadSessions: () => Promise<void>;
  selectSession: (session: TraceHoundSessionItem) => Promise<void>;
  selectTurn: (turnId: string) => Promise<void>;
  back: () => void;
  clearError: () => void;
  analyzeSession: () => Promise<void>;
  clearAnalyzeError: () => void;
}

export const useTraceHoundStore = create<TraceHoundState>((set, get) => ({
  sessions: [],
  selectedSessionId: null,
  selectedSession: null,
  turns: [],
  sessionStats: null,
  selectedTurnId: null,
  turnRecords: [],
  loading: false,
  error: null,

  analysis: null,
  analyzing: false,
  analyzeError: null,

  loadSessions: async () => {
    set({ loading: true, error: null });
    try {
      const res = await webRequest<{ sessions: TraceHoundSessionItem[] }>('session.list', {
        limit: 100,
      });
      set({ sessions: Array.isArray(res?.sessions) ? res.sessions : [], loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  selectSession: async (session) => {
    // Load cached analysis from localStorage immediately so it shows while the
    // turn list is still loading (may be stale — staleness detected later).
    const cachedAnalysis = loadAnalysisFromStorage(session.session_id);
    set({
      loading: true,
      error: null,
      selectedSessionId: session.session_id,
      selectedSession: session,
      turns: [],
      sessionStats: null,
      selectedTurnId: null,
      turnRecords: [],
      analysis: cachedAnalysis,
      analyzeError: null,
    });
    try {
      const res = await webRequest<{ ok: boolean; turns: TurnSummary[]; session_stats: SessionStats }>(
        'tracehound.turns.list',
        { session_id: session.session_id }
      );
      set({
        turns: Array.isArray(res?.turns) ? res.turns : [],
        sessionStats: res?.session_stats ?? null,
        loading: false,
      });
      // Refresh session list so metadata caches (round_id, total_tokens) are reflected
      void get().loadSessions();
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  selectTurn: async (turnId) => {
    const { selectedSessionId } = get();
    if (!selectedSessionId) return;
    set({ loading: true, error: null, selectedTurnId: turnId, turnRecords: [] });
    try {
      const res = await webRequest<{ ok: boolean; records: HistoryRecord[] }>(
        'tracehound.turn.get',
        { session_id: selectedSessionId, turn_id: turnId }
      );
      const records = (Array.isArray(res?.records) ? res.records : []).sort(
        (a, b) => a.timestamp - b.timestamp
      );
      set({ turnRecords: records, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  back: () => {
    const { selectedTurnId } = get();
    if (selectedTurnId) {
      set({ selectedTurnId: null, turnRecords: [] });
    } else {
      set({ selectedSessionId: null, selectedSession: null, turns: [], sessionStats: null, analysis: null, analyzeError: null });
    }
  },

  clearError: () => set({ error: null }),

  analyzeSession: async () => {
    const { selectedSessionId, analyzing } = get();
    if (!selectedSessionId || analyzing) return;
    set({ analyzing: true, analyzeError: null });
    try {
      const res = await webRequest<{
        ok: boolean;
        issues: AnalysisIssue[];
        fingerprint: string;
        analyzed_at: number;
        error?: string;
      }>('tracehound.analyze', { session_id: selectedSessionId }, { timeoutMs: 1_200_000 });

      if (!res?.ok) {
        set({ analyzing: false, analyzeError: res?.error ?? 'Analysis failed' });
        return;
      }

      const analysis: SessionAnalysis = {
        session_id: selectedSessionId,
        fingerprint: res.fingerprint ?? '',
        analyzed_at: res.analyzed_at ?? Date.now() / 1000,
        issues: Array.isArray(res.issues) ? res.issues : [],
      };
      saveAnalysisToStorage(analysis);
      set({ analyzing: false, analysis });
    } catch (e) {
      set({ analyzing: false, analyzeError: String(e) });
    }
  },

  clearAnalyzeError: () => set({ analyzeError: null }),
}));
