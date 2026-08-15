# Plan: Session Replay / Trajectory Viewer

## Context

JiuwenSwarm already records every agent turn in full detail — user messages, LLM
reasoning, tool calls with arguments, tool results, final responses, and token
usage — stored as JSONL in `~/.jiuwenswarm/sessions/{session_id}/history.jsonl`.
There is currently no UI to browse this data in a structured, step-by-step way.
The goal is to surface it as a **Replay panel**: pick any past session, browse
its turns, and step through each turn's full ReAct trajectory (Thought → Tool
Call → Tool Result → … → Final Response).

---

## Key Insight: Zero New Recording Needed

All required data is already persisted. Each history record has:

| Field | Description |
|---|---|
| `request_id` | Groups all events of one turn together |
| `event_type` | `chat.tool_call`, `chat.tool_result`, `chat.reasoning`, `chat.final`, `chat.usage_summary`, `chat.file`, … |
| `content` | Text content of the step |
| `timestamp` | Unix float |
| `mode` | `agent.plan`, `code.plan`, `team`, … |
| `role` | `user` or `assistant` |
| `tool_name` | (extra) Tool invoked |
| `tool_call` | (extra) `{id, name, arguments}` dict |
| `result` | (extra) Tool result text |
| `error_type` / `error_detail` | (extra) Error info |
| `total_tokens` | (extra, on usage_summary) Token count |

Storage location: `../../jiuwenswarm/server/runtime/session/session_history.py`
Read function: `read_session_history_records(session_id) → list[dict]`

---

## Architecture

```
ReplayPanel (React, 3-view)
    │
    ├─ View 1: Session List     ← calls existing  session.list
    ├─ View 2: Turn List        ← calls new        replay.turns.list
    └─ View 3: Turn Detail      ← calls new        replay.turn.get
                                    reads from     session_history.py
```

Gateway routing pattern: same as all other panels —
`_FORWARD_REQ_METHODS` + `_FORWARD_NO_LOCAL_HANDLER_METHODS` in
`gateway/channel_manager/web/app_web_handlers.py`.

---

## Backend Changes

### 1. `message.py` — 2 new ReqMethod entries

**File:** `../../jiuwenswarm/common/schema/message.py`

Add after the `EVALUATION_GATE_CHECK` line:

```python
# Session Replay
REPLAY_TURNS_LIST = "replay.turns.list"
REPLAY_TURN_GET   = "replay.turn.get"
```

### 2. `agent_ws_server.py` — dispatch + handler

**File:** `../../jiuwenswarm/server/agent_ws_server.py`

Add 2 dispatch entries in the `if/elif` block (after the evaluation block):

```python
if request.req_method == ReqMethod.REPLAY_TURNS_LIST:
    await self._handle_replay_request(ws, request, send_lock, "turns_list")
    return
if request.req_method == ReqMethod.REPLAY_TURN_GET:
    await self._handle_replay_request(ws, request, send_lock, "turn_get")
    return
```

Add handler method at the bottom of the class. No new module needed — reads
from the already-existing `read_session_history_records`:

```python
async def _handle_replay_request(self, ws, request, send_lock, action):
    from jiuwenswarm.server.runtime.session.session_history import (
        read_session_history_records,
    )
    session_id = request.params.get("session_id", "")
    try:
        if action == "turns_list":
            records = read_session_history_records(session_id)
            turns: dict[str, dict] = {}
            for rec in records:
                rid = rec.get("request_id") or rec.get("id", "")
                if not rid:
                    continue
                if rid not in turns:
                    turns[rid] = {
                        "turn_id":      rid,
                        "turn_index":   len(turns),
                        "user_content": "",
                        "timestamp":    rec.get("timestamp", 0),
                        "tool_names":   [],
                        "has_final":    False,
                        "total_tokens": 0,
                        "mode":         rec.get("mode"),
                    }
                role = rec.get("role", "")
                et   = rec.get("event_type", "")
                if role == "user" and not turns[rid]["user_content"]:
                    turns[rid]["user_content"] = (rec.get("content") or "")[:120]
                elif et == "chat.tool_call":
                    tn = rec.get("tool_name") or (rec.get("tool_call") or {}).get("name", "")
                    if tn:
                        turns[rid]["tool_names"].append(tn)
                elif et == "chat.final":
                    turns[rid]["has_final"] = True
                elif et == "chat.usage_summary":
                    turns[rid]["total_tokens"] += (rec.get("total_tokens") or 0)
            payload = {"ok": True, "turns": list(turns.values())}

        elif action == "turn_get":
            turn_id = request.params.get("turn_id", "")
            records = read_session_history_records(session_id)
            turn_records = [
                r for r in records
                if (r.get("request_id") or r.get("id", "")) == turn_id
            ]
            payload = {"ok": True, "records": turn_records}

        else:
            payload = {"ok": False, "error": f"unknown action: {action}"}

    except Exception as e:
        payload = {"ok": False, "error": str(e)}

    await self._send_response(ws, request, send_lock, payload)
```

### 3. `app_web_handlers.py` — routing

**File:** `../../jiuwenswarm/gateway/channel_manager/web/app_web_handlers.py`

Append to **both** `_FORWARD_REQ_METHODS` and `_FORWARD_NO_LOCAL_HANDLER_METHODS`:

```python
# Session Replay
"replay.turns.list",
"replay.turn.get",
```

---

## Frontend Changes

### 4. SVG icon

**File:** `src/assets/sidebar/replay.svg`

Timeline/play icon — right-pointing triangle with horizontal progress lines,
16×16 viewBox, using `currentColor` stroke. Example:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"
     stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
  <!-- Play triangle -->
  <polygon points="3,2 13,8 3,14" fill="currentColor" stroke="none" opacity="0.85"/>
  <!-- Timeline lines on right -->
  <!-- (adjust to taste; simple triangle works fine) -->
</svg>
```

### 5. i18n

**File:** `src/i18n/locales/en.json` — add to `"nav"`:
```json
"replay": "Replay"
```

**File:** `src/i18n/locales/zh.json` — add to `"nav"`:
```json
"replay": "回放"
```

### 6. SessionSidebar

**File:** `src/components/SessionSidebar/index.tsx`

```typescript
// Add import
import replayIcon from '../../assets/sidebar/replay.svg';

// Extend local MainNavKey type (line 34)
type MainNavKey = '...' | 'replay';

// Add nav item after 'sessions' in mainNavItems array
{ key: 'replay', labelKey: 'nav.replay', icon: <img src={replayIcon} alt="" /> },
```

### 7. App.tsx

**File:** `src/App.tsx`

```typescript
// Import
import { ReplayPanel } from './components/ReplayPanel';

// Extend MainNavKey type
type MainNavKey = '...' | 'replay';

// Render block (after the sessions block)
{activeNav === 'replay' && (
  <div className="app-section">
    <ReplayPanel isConnected={isConnected} request={request} />
  </div>
)}
```

### 8. Zustand store

**File:** `src/stores/replayStore.ts`

```typescript
import { create } from 'zustand';
import { webRequest } from '../services/webClient';

export interface TurnSummary {
  turn_id: string;
  turn_index: number;
  user_content: string;   // first 120 chars of user message
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

export interface SessionItem {
  session_id: string;
  title?: string;
  channel_id?: string;
  last_message_at?: number;
  created_at?: number;
  message_count?: number;
  mode?: string;
}

interface ReplayState {
  sessions: SessionItem[];
  selectedSessionId: string | null;
  selectedSession: SessionItem | null;
  turns: TurnSummary[];
  selectedTurnId: string | null;
  turnRecords: HistoryRecord[];
  loading: boolean;
  error: string | null;

  loadSessions: () => Promise<void>;
  selectSession: (session: SessionItem) => Promise<void>;
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
      const res = await webRequest<{ sessions: SessionItem[] }>('session.list', { limit: 100 });
      set({ sessions: res.sessions ?? [], loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  selectSession: async (session) => {
    set({ loading: true, error: null, selectedSessionId: session.session_id,
          selectedSession: session, turns: [], selectedTurnId: null, turnRecords: [] });
    try {
      const res = await webRequest<{ turns: TurnSummary[] }>('replay.turns.list',
        { session_id: session.session_id });
      set({ turns: res.turns ?? [], loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  selectTurn: async (turnId) => {
    const { selectedSessionId } = get();
    if (!selectedSessionId) return;
    set({ loading: true, error: null, selectedTurnId: turnId, turnRecords: [] });
    try {
      const res = await webRequest<{ records: HistoryRecord[] }>('replay.turn.get',
        { session_id: selectedSessionId, turn_id: turnId });
      const records = (res.records ?? []).sort((a, b) => a.timestamp - b.timestamp);
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
```

### 9. ReplayPanel component

**File:** `src/components/ReplayPanel/index.tsx`

Three views driven by `selectedSessionId` and `selectedTurnId`:

#### View 1 — Session List

```
┌─────────────────────────────────────────┐
│  Session Replay                          │
│  ──────────────────────────────────────  │
│  [session card]  title   mode   date     │
│  [session card]  title   mode   date     │
│  ...                                     │
└─────────────────────────────────────────┘
```

- Loads on mount via `loadSessions()`
- Each card: session title (or truncated id), mode badge, `last_message_at`
  date, message count chip
- Click → `selectSession(session)`

#### View 2 — Turn List

```
┌─────────────────────────────────────────┐
│  ← Back   "Session title"               │
│  ──────────────────────────────────────  │
│  Turn 1  "user message preview…"        │
│           🔧 bash  🔧 python   2h ago   │
│  Turn 2  "another user message…"        │
│           (no tools)             3h ago  │
└─────────────────────────────────────────┘
```

- Turn index + user content preview (first 80 chars)
- Tool name badges (up to 3, then "+N more")
- Token count chip if > 0
- Relative timestamp
- Click → `selectTurn(turn.turn_id)`

#### View 3 — Trajectory Detail

```
┌─────────────────────────────────────────┐
│  ← Back   Turn 3 · 2025-07-08 14:32    │
│  ──────────────────────────────────────  │
│  🧑 User                                │
│     "How do I sort a list in Python?"   │
│                                          │
│  🤔 Reasoning                  [expand] │
│     The user wants...                    │
│                                          │
│  🔧 Tool Call: bash            [expand] │
│     { "command": "python3 -c ..." }     │
│                                          │
│  ✅ Tool Result: bash          [expand] │
│     [1, 2, 3, 4, 5]                     │
│                                          │
│  💬 Final Response                       │
│     You can use `list.sort()` or...     │
│                                          │
│  📊 Usage  1,234 tokens · 0.002 USD    │
└─────────────────────────────────────────┘
```

Timeline cards per `event_type`:

| event_type | Icon | Label | Expandable |
|---|---|---|---|
| (role=user) | 🧑 | User | no |
| `chat.reasoning` | 🤔 | Reasoning | yes (italic text) |
| `chat.tool_call` | 🔧 | Tool Call: `{tool_name}` | yes (JSON args) |
| `chat.tool_result` | ✅/❌ | Tool Result: `{tool_name}` | yes (result text) |
| `chat.final` | 💬 | Final Response | no (always shown) |
| `chat.file` | 📄 | File: `{filename}` | yes |
| `chat.usage_summary` | 📊 | Usage | no (chip row) |
| `chat.error` | 🚨 | Error | yes (error_detail) |

All cards use the same inline-expand toggle (click header to expand/collapse).
Cards are rendered in `timestamp` order.

---

## Full File List

| Action | Path |
|--------|------|
| Modify | `../../jiuwenswarm/common/schema/message.py` |
| Modify | `../../jiuwenswarm/server/agent_ws_server.py` |
| Modify | `../../jiuwenswarm/gateway/channel_manager/web/app_web_handlers.py` |
| Create | `src/assets/sidebar/replay.svg` |
| Modify | `src/i18n/locales/en.json` |
| Modify | `src/i18n/locales/zh.json` |
| Modify | `src/components/SessionSidebar/index.tsx` |
| Modify | `src/App.tsx` |
| Create | `src/stores/replayStore.ts` |
| Create | `src/components/ReplayPanel/index.tsx` |

Total: 4 new files, 6 modified files. No new Python modules needed — backend
handler is self-contained in `agent_ws_server.py` and calls existing
`read_session_history_records()`.

---

## Verification Checklist

1. **Backend smoke** — call `replay.turns.list` via browser WebSocket DevTools
   with a known `session_id`. Should return `{ok: true, turns: [...]}`.

2. **Gateway routing** — call `replay.turn.get` with a `turn_id` from step 1.
   Should return `{ok: true, records: [...]}` with the raw history records.

3. **Sidebar visible** — rebuild frontend + copy dist + restart. "Replay" icon
   appears in sidebar between Sessions and Heartbeat.

4. **Session list loads** — open Replay panel; list matches Sessions panel count.

5. **Turn list loads** — click any session; turns appear with correct previews,
   tool badges, and timestamps.

6. **Trajectory view** — click any turn; timeline shows all ReAct steps in
   timestamp order; tool call cards expand/collapse.

7. **Edge cases**:
   - Session with no tools: only User + Final cards visible
   - Session with errors: `chat.error` card shows `error_detail`
   - Session with reasoning: `chat.reasoning` card collapsible
   - Empty session: shows "No turns found" empty state

---

## Notes

- `session.list` already exists and is routed — no changes needed for session
  listing.
- `read_session_history_records()` already handles both `.jsonl` and legacy
  `.json` formats, and retries on concurrent writes.
- The grouping by `request_id` is pure Python/TypeScript logic on top of the
  existing flat record list — no schema changes required.
- For very large sessions (1000+ records), the `turns_list` grouping is O(n)
  and fast. `turn_get` scans the same list once to filter by `turn_id`.
- Future enhancement: add `replay.session.export` to download a full session
  as structured JSON/HTML for sharing or offline viewing.
