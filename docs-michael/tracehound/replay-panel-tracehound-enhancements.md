# Replay Panel — TraceHound Enhancements Plan

Inspired by feature analysis of **TraceHound** (the jiuwenswarm trajectory analysis desktop app).
All features add signal to the existing three-view Replay Panel without changing its fundamental
structure (Session List → Turn List → Turn Detail).

---

## Overview of changes

| # | Feature | Backend | Frontend | Complexity |
|---|---------|---------|----------|------------|
| 1 | Per-turn quality score badge | ✅ add field to TurnSummary | ✅ chip on turn card | Medium |
| 2 | Turn duration chip | ✅ add field to TurnSummary | ✅ chip on turn card | Low |
| 3 | Error category label | ✅ add field to TurnSummary | ✅ badge on turn card | Low |
| 4 | Tool failure indicator | ✅ add fields to TurnSummary | ✅ badges in detail view | Low |
| 5 | Session summary stats bar | ✅ add session_stats to response | ✅ stat row in TurnListView | Low |
| 6 | Filter bar in Turn List | — | ✅ pure frontend state | Low |
| 7 | Response length classification | ✅ add field to TurnSummary | ✅ label on turn card | Low |
| 8 | Dangerous command flag | — | ✅ pattern match in RecordCard | Low |
| 9 | Export turn as JSON | — | ✅ download button | Low |
| 10 | LLM timing on Usage card | ✅ pass through raw_output fields | ✅ TTFT/TPOT chips | Medium |

---

## Files touched

### Backend
- `../../jiuwenswarm/server/agent_ws_server.py` — `_handle_replay_request` method

### Frontend
- `src/stores/replayStore.ts` — extend `TurnSummary` and `HistoryRecord` types
- `src/components/ReplayPanel/index.tsx` — all visual changes

No new files, no new API methods, no new Python modules.

---

## Feature specifications

---

### Feature 1 — Per-turn quality score badge

**What:** A `[0.0–1.0]` coloured chip on every turn card in the Turn List, mirroring
TraceHound's `scorer.py` heuristic. Lets you spot poor turns at a glance without clicking in.

**Colour scale:** `>= 0.75` → green, `0.50–0.74` → yellow, `< 0.50` → red.

#### Backend (`_handle_replay_request`, `turns_list` branch)

Add quality score computation while building the `turns` dict. After the loop that reads
all records, compute per-turn:

```python
def _quality_score(turn: dict) -> float:
    score = 0.5
    if turn.get("has_final"):
        score += 0.2
    n_fail = turn.get("tool_failures", 0)
    score -= min(0.15, 0.05 * n_fail)
    dur = turn.get("duration_seconds", 0.0)
    if dur > 60:
        score -= 0.08
    elif dur > 30:
        score -= 0.05
    return round(max(0.0, min(1.0, score)), 2)
```

Set `turns[rid]["quality_score"] = _quality_score(turns[rid])` after the loop completes.
(This requires `tool_failures` and `duration_seconds` to be computed first — see features 2 and 4.)

#### `TurnSummary` type (replayStore.ts)

```typescript
quality_score: number | null;   // add
```

#### `TurnListView` (ReplayPanel/index.tsx)

Add helper:
```typescript
function qualityChip(score: number | null): React.ReactNode {
  if (score == null) return null;
  const color = score >= 0.75 ? '#10b981' : score >= 0.5 ? '#f59e0b' : '#ef4444';
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
      background: color + '18', color, border: `1px solid ${color}44`,
    }}>
      Q {score.toFixed(2)}
    </span>
  );
}
```

Render inside the turn card's top-right area alongside the timestamp.

---

### Feature 2 — Turn duration chip

**What:** Wall-clock time from first to last record in a turn, shown as a `Xs` chip on the
turn card. Colour-coded against a soft p90 threshold computed over the session.
TraceHound calls this `duration_seconds`.

#### Backend (`_handle_replay_request`, `turns_list` branch)

Track first and last timestamp per turn while building the dict:

```python
# Inside the per-record loop:
ts = rec.get("timestamp", 0)
if ts:
    if not turns[rid].get("_first_ts") or ts < turns[rid]["_first_ts"]:
        turns[rid]["_first_ts"] = ts
    if not turns[rid].get("_last_ts") or ts > turns[rid]["_last_ts"]:
        turns[rid]["_last_ts"] = ts

# After the loop, for each turn:
dur = turn.get("_last_ts", 0) - turn.get("_first_ts", 0)
turn["duration_seconds"] = round(max(0.0, dur), 1)
# Remove temp keys before serialising
turn.pop("_first_ts", None)
turn.pop("_last_ts", None)
```

#### `TurnSummary` type

```typescript
duration_seconds: number;   // add, default 0
```

#### `TurnListView`

In the right column below the token count chip:
```tsx
{turn.duration_seconds > 0 && (
  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
    {turn.duration_seconds}s
  </div>
)}
```

For colour-coding, compute p90 over the loaded turns array in the component:
```typescript
const p90dur = useMemo(() => {
  const sorted = [...turns].map(t => t.duration_seconds).sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * 0.9)] ?? 0;
}, [turns]);
```

Colour the chip orange if `duration_seconds > p90dur`.

---

### Feature 3 — Error category label

**What:** When a turn contains error records, show the error category as a small red badge
on the turn card (e.g. `timeout`, `filesystem`, `api_auth`). Matches TraceHound's
`ErrorCategoryAnalyzer`.

#### Backend — category detection

Add a helper to `_handle_replay_request`:

```python
_ERROR_PATTERNS = [
    ("api_auth",    ["401", "403", "authentication", "unauthorized", "token"]),
    ("timeout",     ["timeout", "timed out", "deadline"]),
    ("filesystem",  ["no such file", "permission denied", "filenotfound", "isdirectory"]),
    ("network",     ["connection refused", "network", "dns", "socket"]),
    ("syntax",      ["syntaxerror", "invalid syntax"]),
    ("import",      ["modulenotfounderror", "importerror", "no module"]),
    ("model",       ["model", "context length", "max tokens"]),
    ("execution",   ["returncode", "exit code", "subprocess"]),
]

def _classify_error(text: str) -> str:
    low = text.lower()
    for category, keywords in _ERROR_PATTERNS:
        if any(k in low for k in keywords):
            return category
    return "other"
```

While iterating records in `turns_list`, when `event_type == "chat.error"` or
`error_type` is set, call `_classify_error(rec.get("content", "") + rec.get("error_detail", "") or ""))`
and store `turns[rid]["error_category"] = category` (only set the first one found per turn).
Also track `turns[rid]["has_error"] = True`.

#### `TurnSummary` type

```typescript
has_error: boolean;
error_category: string | null;
```

#### `TurnListView`

Add error badge next to the turn index chip:
```tsx
{turn.has_error && (
  <span style={{
    fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
    background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5',
  }}>
    ⚠ {turn.error_category ?? 'error'}
  </span>
)}
```

---

### Feature 4 — Tool failure indicator

**What:** Track per-turn tool failure count and tool call count. Used by the quality score
(Feature 1) and displayed as a `N/M failed` red sub-chip on the tool badges row in
TurnListView. Also highlights retry loops (same tool ≥ 2× in one turn) in TurnDetailView.

#### Backend (`turns_list` branch)

Add to the per-record loop:
```python
elif et == "chat.tool_result" and rec.get("error_type"):
    turns[rid]["tool_failures"] = turns[rid].get("tool_failures", 0) + 1
```

Also track `tool_call_count` (already via `tool_names` length — no new backend field needed
for the count, just `tool_failures`).

#### `TurnSummary` type

```typescript
tool_failures: number;   // add
```

#### `TurnListView` — failure badge

After the tool badges row, if `turn.tool_failures > 0`:
```tsx
<span style={{
  fontSize: 11, padding: '1px 7px', borderRadius: 3,
  background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5',
}}>
  {turn.tool_failures} failed
</span>
```

#### `TurnDetailView` — retry detection

In `RecordCard`, detect retry loops. Add a helper outside the component:
```typescript
function buildRetrySet(records: HistoryRecord[]): Set<string> {
  // returns IDs of tool_call records where the same tool was called before in this turn
  const seen: Record<string, number> = {};
  const retries = new Set<string>();
  for (const r of records) {
    if (r.event_type === 'chat.tool_call') {
      const name = r.tool_name ?? (r.tool_call as any)?.name ?? '';
      seen[name] = (seen[name] ?? 0) + 1;
      if (seen[name] > 1) retries.add(r.id);
    }
  }
  return retries;
}
```

Pass `isRetry: boolean` as a prop to `RecordCard`. When true, show a small orange
`↻ retry` badge in the tool call card header.

---

### Feature 5 — Session summary stats bar

**What:** A compact horizontal stats row at the top of TurnListView (below the session
title, above the turn cards) showing: total turns, error count, total tokens, date range.
Same concept as TraceHound's Overview dashboard mode.

#### Backend — add `session_stats` to `turns_list` response

```python
# After building the turns dict:
all_tokens = sum(t.get("total_tokens", 0) for t in turns.values())
error_count = sum(1 for t in turns.values() if t.get("has_error"))
timestamps = [t["timestamp"] for t in turns.values() if t.get("timestamp")]
date_range = ""
if timestamps:
    lo = datetime.utcfromtimestamp(min(timestamps)).strftime("%Y-%m-%d")
    hi = datetime.utcfromtimestamp(max(timestamps)).strftime("%Y-%m-%d")
    date_range = lo if lo == hi else f"{lo} → {hi}"

payload = {
    "ok": True,
    "turns": list(turns.values()),
    "session_stats": {
        "total_turns": len(turns),
        "error_count": error_count,
        "total_tokens": all_tokens,
        "date_range": date_range,
    },
}
```

#### `replayStore.ts` — add `sessionStats` state

```typescript
interface SessionStats {
  total_turns: number;
  error_count: number;
  total_tokens: number;
  date_range: string;
}

// Add to ReplayState:
sessionStats: SessionStats | null;

// In selectSession action, after receiving response:
set({
  turns: ...,
  sessionStats: res?.session_stats ?? null,
  loading: false,
});

// Reset on back():
set({ selectedSessionId: null, selectedSession: null, turns: [], sessionStats: null });
```

#### `TurnListView`

Add stat bar between the header and the turn cards:
```tsx
{sessionStats && (
  <div style={{
    display: 'flex', gap: 16, flexWrap: 'wrap',
    padding: '8px 0 14px', fontSize: 12, color: '#6b7280',
    borderBottom: '1px solid #f3f4f6', marginBottom: 12,
  }}>
    <span><strong>{sessionStats.total_turns}</strong> turns</span>
    {sessionStats.error_count > 0 && (
      <span style={{ color: '#dc2626' }}>
        <strong>{sessionStats.error_count}</strong> errors
      </span>
    )}
    <span><strong>{sessionStats.total_tokens.toLocaleString()}</strong> tokens</span>
    {sessionStats.date_range && <span>{sessionStats.date_range}</span>}
  </div>
)}
```

---

### Feature 6 — Filter bar in Turn List

**What:** Three quick-filter toggles above the turn cards. Pure frontend — no backend change.
Inspired by TraceHound's per-tab filtering (Error Turns, Slowest Turns, etc.)

#### `TurnListView` — local filter state

```typescript
const [filterErrors, setFilterErrors] = useState(false);
const [filterTools, setFilterTools]   = useState(false);
const [filterSlow, setFilterSlow]     = useState(false);
```

Compute `p90dur` (see Feature 2). Then:

```typescript
const visibleTurns = turns.filter(t => {
  if (filterErrors && !t.has_error) return false;
  if (filterTools  && t.tool_names.length === 0) return false;
  if (filterSlow   && t.duration_seconds <= p90dur) return false;
  return true;
});
```

Render toggle buttons styled as active/inactive chips:
```tsx
<div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
  {[
    { key: 'errors', label: '⚠ Errors only',    active: filterErrors, toggle: () => setFilterErrors(x => !x) },
    { key: 'tools',  label: '🔧 Has tool calls', active: filterTools,  toggle: () => setFilterTools(x => !x) },
    { key: 'slow',   label: '🐢 Slow (>p90)',    active: filterSlow,   toggle: () => setFilterSlow(x => !x) },
  ].map(f => (
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
  {(filterErrors || filterTools || filterSlow) && (
    <span style={{ fontSize: 11, color: '#9ca3af', alignSelf: 'center' }}>
      {visibleTurns.length}/{turns.length}
    </span>
  )}
</div>
```

---

### Feature 7 — Response length classification

**What:** A small label on the turn card classifying the final response as
`terse` / `normal` / `verbose` / `essay`, matching TraceHound's ContentDeliveryAnalyzer.

| Bucket | Char count |
|--------|-----------|
| terse  | 0–99 |
| normal | 100–499 |
| verbose | 500–1499 |
| essay | 1500+ |

#### Backend — add `final_length` to TurnSummary

```python
# In the per-record loop, when et == "chat.final":
turns[rid]["final_length"] = len(rec.get("content") or "")
```

#### `TurnSummary` type

```typescript
final_length: number;   // 0 if no final
```

#### Helpers + `TurnListView`

```typescript
function responseLabel(len: number): { label: string; color: string } | null {
  if (len === 0) return null;
  if (len < 100)  return { label: 'terse',   color: '#f59e0b' };
  if (len < 500)  return { label: 'normal',  color: '#10b981' };
  if (len < 1500) return { label: 'verbose', color: '#6366f1' };
  return            { label: 'essay',   color: '#8b5cf6' };
}
```

Render as small label in the bottom-right of each turn card, next to duration.

---

### Feature 8 — Dangerous command flag

**What:** When a `chat.tool_call` card contains shell arguments matching known dangerous
patterns, show a red ⚠ badge in the card header. Pure frontend pattern matching.
Inspired by TraceHound's `ToolArgumentAnalyzer._is_dangerous()`.

No backend change needed — arguments are already in `tool_call.arguments` or `content`
on the `HistoryRecord`.

#### `RecordCard` (ReplayPanel/index.tsx)

Add constant:
```typescript
const DANGEROUS_PATTERNS = [
  /rm\s+-rf/i, /rm\s+-r\s+-f/i,
  /DROP\s+TABLE/i, /DROP\s+DATABASE/i,
  /sudo\s+rm/i,
  /mkfs/i,
  /dd\s+if=/i,
  /chmod\s+777/i,
  />\s*\/dev\/sd/i,
  /truncate.*--size\s+0/i,
];

function isDangerous(rec: HistoryRecord): boolean {
  if (rec.event_type !== 'chat.tool_call') return false;
  const args = JSON.stringify((rec.tool_call as any)?.arguments ?? '') + (rec.content ?? '');
  return DANGEROUS_PATTERNS.some(p => p.test(args));
}
```

In `RecordCard`, after computing `headerLabel`, if `isDangerous(rec)`:

```tsx
// Append to header row:
{isDangerous(rec) && (
  <span style={{
    fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3,
    background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5',
    marginLeft: 4,
  }}>
    ⚠ DANGEROUS
  </span>
)}
```

---

### Feature 9 — Export turn as JSON

**What:** A single "⬇ JSON" button in the TurnDetailView header that triggers a browser
download of the raw `HistoryRecord[]` for the current turn. No backend change.

#### `TurnDetailView` (ReplayPanel/index.tsx)

Add helper:
```typescript
function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

Add button to header, next to the existing chips:
```tsx
<button
  style={{ ...btnStyle, fontSize: 12 }}
  onClick={() => downloadJson(turnRecords, `turn-${selectedTurnId?.slice(0,8)}.json`)}
  disabled={turnRecords.length === 0}
>
  ⬇ JSON
</button>
```

---

### Feature 10 — LLM timing on Usage card

**What:** Show TTFT (time-to-first-token) and TPOT (time-per-output-token) as chips on the
`chat.usage_summary` record card in TurnDetailView. TraceHound extracts these from
`raw_output` on usage records.

**Uncertainty:** Whether `ttft_ms` and `tpot_ms` are actually stored in the
`raw_output` field of `chat.usage_summary` records depends on the LLM provider
response format. Verify before implementing.

#### Backend verification step

Add debug logging or a check in `_handle_replay_request` for `turn_get`:
```python
# In turn_get branch, pass records through as-is (already done).
# The raw_output field is already serialised in HistoryRecord.
```

Check a real session's `history.jsonl` for a `chat.usage_summary` record's `raw_output`
to confirm which sub-fields exist (look for `ttft_ms`, `tpot_ms`, `first_token_ms`, etc.)

#### `HistoryRecord` type — add optional fields

```typescript
ttft_ms?: number | null;
tpot_ms?: number | null;
```

These can be sourced from `raw_output` in the backend before sending, if they exist:

```python
# In turn_get branch, before returning records, optionally enrich:
for r in turn_records:
    ro = r.get("raw_output") or {}
    if isinstance(ro, dict):
        if "ttft_ms" in ro:
            r["ttft_ms"] = ro["ttft_ms"]
        if "tpot_ms" in ro:
            r["tpot_ms"] = ro["tpot_ms"]
```

#### `RecordCard` — usage summary section

```tsx
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
  </div>
)}
```

Where `chipStyle = { fontSize: 12, padding: '2px 8px', borderRadius: 4, background: '#f3f4f6', color: '#374151' }`.

---

## Recommended implementation order

1. **Features 2 + 3 + 4** — all backend-only additions to `turns_list`; low risk.
   Get the new TurnSummary fields flowing first.
2. **Feature 1** — quality score can only be done after 2 + 4 supply `duration_seconds`
   and `tool_failures`.
3. **Feature 7** — backend adds `final_length`; straightforward.
4. **Feature 5** — `session_stats` block added to `turns_list` response; requires
   `replayStore.ts` update for new state field.
5. **Feature 6** — pure frontend filter bar; do after types stabilise.
6. **Feature 8 + 9** — pure frontend; can be done any time.
7. **Feature 10** — do last; requires verifying `raw_output` schema from real session data.

---

## Build + deploy checklist (after all changes)

```bash
cd jiuwenswarm/channels/web/frontend
npm run build
cp -r dist/* ~/.jiuwenswarm/channels/web/frontend/dist/
# restart jiuwenswarm to pick up agent_ws_server.py changes
```
