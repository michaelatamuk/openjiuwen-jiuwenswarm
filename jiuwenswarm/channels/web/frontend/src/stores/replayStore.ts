/**
 * Replay Store — Session Replay / Trajectory Viewer
 *
 * Manages state for browsing past sessions turn-by-turn and viewing
 * each turn's full ReAct trajectory (reasoning → tool calls → final response).
 */

import { create } from 'zustand';
import { webRequest } from '../services/webClient';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ReplaySessionItem {
  session_id: string;
  title?: string;
  channel_id?: string;
  last_message_at?: number;
  created_at?: number;
  message_count?: number;
  mode?: string;
}

export interface TurnSummary {
  turn_id: string;
  turn_index: number;
  /** First 120 chars of the user message for this turn */
  user_content: string;
  timestamp: number;
  tool_names: string[];
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
  quality_score: number | null;
  quality_label: string | null;
  quality_breakdown: string[];
  mode: string | null;
}

export interface SessionStats {
  total_turns: number;
  error_count: number;
  total_tokens: number;
  date_range: string;
  history_file_path: string;
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

interface ReplayState {
  sessions: ReplaySessionItem[];
  selectedSessionId: string | null;
  selectedSession: ReplaySessionItem | null;
  turns: TurnSummary[];
  sessionStats: SessionStats | null;
  selectedTurnId: string | null;
  turnRecords: HistoryRecord[];
  loading: boolean;
  error: string | null;

  loadSessions: () => Promise<void>;
  selectSession: (session: ReplaySessionItem) => Promise<void>;
  selectTurn: (turnId: string) => Promise<void>;
  back: () => void;
  clearError: () => void;
}

export const useReplayStore = create<ReplayState>((set, get) => ({
  sessions: [],
  selectedSessionId: null,
  selectedSession: null,
  turns: [],
  sessionStats: null,
  selectedTurnId: null,
  turnRecords: [],
  loading: false,
  error: null,

  loadSessions: async () => {
    set({ loading: true, error: null });
    try {
      const res = await webRequest<{ sessions: ReplaySessionItem[] }>('session.list', {
        limit: 100,
      });
      set({ sessions: Array.isArray(res?.sessions) ? res.sessions : [], loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  selectSession: async (session) => {
    set({
      loading: true,
      error: null,
      selectedSessionId: session.session_id,
      selectedSession: session,
      turns: [],
      sessionStats: null,
      selectedTurnId: null,
      turnRecords: [],
    });
    try {
      const res = await webRequest<{ ok: boolean; turns: TurnSummary[]; session_stats: SessionStats }>(
        'replay.turns.list',
        { session_id: session.session_id }
      );
      set({
        turns: Array.isArray(res?.turns) ? res.turns : [],
        sessionStats: res?.session_stats ?? null,
        loading: false,
      });
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
        'replay.turn.get',
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
      set({ selectedSessionId: null, selectedSession: null, turns: [], sessionStats: null });
    }
  },

  clearError: () => set({ error: null }),
}));
