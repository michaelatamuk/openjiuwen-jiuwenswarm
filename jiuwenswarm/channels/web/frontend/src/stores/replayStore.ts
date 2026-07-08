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
  total_tokens: number;
  mode: string | null;
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
  total_tokens?: number;
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface ReplayState {
  sessions: ReplaySessionItem[];
  selectedSessionId: string | null;
  selectedSession: ReplaySessionItem | null;
  turns: TurnSummary[];
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
      selectedTurnId: null,
      turnRecords: [],
    });
    try {
      const res = await webRequest<{ ok: boolean; turns: TurnSummary[] }>(
        'replay.turns.list',
        { session_id: session.session_id }
      );
      set({ turns: Array.isArray(res?.turns) ? res.turns : [], loading: false });
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
      set({ selectedSessionId: null, selectedSession: null, turns: [] });
    }
  },

  clearError: () => set({ error: null }),
}));
