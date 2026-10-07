# Build: Personal Trainer (daily fitness coach) in 2 days (on openjiuwen)

**The idea.** A coach you open every day. It gives you *today's* session — warm-up, main work, cool-down — tailored to your goal, level, equipment, and injuries. You log what you did and how hard it felt; tomorrow's session adapts.

**Zero third-party integrations.** Your profile and logs are local files; only the model is called.

**The 60-second demo.** Set a profile ("build strength, 3×/week, dumbbells only, bad knee") → it shows a knee-safe session → mark it "too easy" → ask for tomorrow → the plan has progressed.

---

## 1. Scope for two days

| Keep real | Fake / simplify |
|---|---|
| The agent loop and session generation | Progressions — a step, not a full periodization science |
| Adaptation from your logs (memory) | Wearables/heart-rate — you type how it felt |
| A small UI to log a session | Accounts, sync, charts beyond a simple list |

Rule: **local files + model only.** No calendar, no health app.

---

## 2. openjiuwen pieces used

| Piece | What it gives us | Where |
|---|---|---|
| `create_deep_agent(...)` | The agent with tools, prompt, rails | `openjiuwen/harness/factory.py` |
| `@tool` | Profile / plan / log actions | `openjiuwen/core/foundation/tool/tool.py` |
| `MemoryRail` | Remembers injuries, dislikes, progress | `openjiuwen/harness/rails/memory/memory_rail.py` |
| `Runner.run_agent(agent, {...})` | Runs the agent | `openjiuwen/core/runner` |
| Streamlit (or `jiuwenswarm-web`) | The daily screen | `jiuwenswarm/channels/web/app_web.py` |

---

## 3. Architecture

```
profile.json + logs.json
        │
        ▼
 ┌───────────────────────────┐
 │ Personal Trainer (agent)  │
 │ prompt + MemoryRail       │
 └────────────┬──────────────┘
              │ calls tools
   ┌──────────┼──────────────┬───────────────┐
   ▼          ▼              ▼               ▼
get_profile save_plan   log_session    recent_sessions
   │          │              │               │
   └──────────┴──────────────┴───────────────┘
              ▼
      plan.json / logs.json
              ▼
        Streamlit UI
   (Today's session · Log · History)
```

---

## 4. Day 1 — make the agent work (8h)

**0–1h · Scaffold + profile.** Create the project and `data/profile.json` (goal, level, days/week, equipment, injuries) and an empty `data/logs.json`.

**1–3h · Define the tools.** `app/tools.py`:

```python
from openjiuwen.core.foundation.tool import tool
import json
from pathlib import Path

PROFILE = Path("data/profile.json")
LOGS = Path("data/logs.json")
PLAN = Path("data/plan.json")

def _read(p, default):
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else default

def _write(p, data):
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

@tool(name="get_profile", description="Return the athlete profile as JSON.")
def get_profile() -> str:
    return json.dumps(_read(PROFILE, {}), ensure_ascii=False)

@tool(name="save_profile", description="Save the athlete profile. profile_json has keys: goal, level, days_per_week, equipment (list), injuries (list).")
def save_profile(profile_json: str) -> str:
    _write(PROFILE, json.loads(profile_json) if isinstance(profile_json, str) else profile_json)
    return "profile saved"

@tool(name="recent_sessions", description="Return the most recent logged sessions as JSON (newest first).")
def recent_sessions() -> str:
    return json.dumps(_read(LOGS, [])[-10:], ensure_ascii=False)

@tool(name="save_plan", description="Save today's session. plan_json: {date, objective, blocks: [{name, items: [str]}], notes}.")
def save_plan(plan_json: str) -> str:
    plan = json.loads(plan_json) if isinstance(plan_json, str) else plan_json
    _write(PLAN, plan)
    return "plan saved"

@tool(name="log_session", description="Log a completed session. entry_json: {date, focus, difficulty (1-5), note}.")
def log_session(entry_json: str) -> str:
    entry = json.loads(entry_json) if isinstance(entry_json, str) else entry_json
    logs = _read(LOGS, [])
    logs.append(entry)
    _write(LOGS, logs)
    return "session logged"
```

**3–5h · Wire the agent.** `app/agent.py`:

```python
from openjiuwen.harness import create_deep_agent
from openjiuwen.harness.rails import MemoryRail
from openjiuwen.core.runner import Runner
from app import tools

SYSTEM = """You are Personal Trainer. Build safe, practical daily workouts.
Always: (1) call get_profile and recent_sessions first; (2) respect injuries and
available equipment; (3) progress load only if the last sessions felt easy;
(4) keep sessions 30-50 minutes; (5) save with save_plan.
Never prescribe an exercise that conflicts with a listed injury.
If memory knows dislikes or injuries, honor them."""

agent = create_deep_agent(
    model=llm_model,                         # configured Model
    system_prompt=SYSTEM,
    tools=[tools.get_profile, tools.save_profile, tools.recent_sessions,
           tools.save_plan, tools.log_session],
    rails=[MemoryRail(embedding_config=embedding_config)],
    enable_task_loop=False,
    max_iterations=20,
)

async def today() -> str:
    result = await Runner.run_agent(agent, {"query":
        "Give me today's session. Check my profile and recent logs first, then save the plan."})
    return result.get("output")
```

**5–7h · Tune the happy path.** Run `today()` until: sessions match equipment, no injury-conflicting moves, difficulty progresses when last logs say "easy". Lower temperature for stability.

**7–8h · Lock it.** Save a known-good plan to `data/golden.json` as the demo fallback.

---

## 5. Day 2 — adaptation loop, UI, rehearsal (8h)

**0–2h · Memory.** Teach constraints, then prove they persist:

```python
await Runner.run_agent(agent, {"query": "Remember: my left knee is injured and I dislike burpees."})
# later plans avoid both
```

**2–4h · The adaptation loop (the trust story).** Log "too easy" → next day progresses; log "sore knee" → it swaps the movement. This is the moment that shows it's a coach, not a generator.

**4–6h · UI.** Streamlit tabs **Today · Log · History**, reading `plan.json` / `logs.json`. Or run `jiuwenswarm-start` and use the web chat.

**6–7h · Polish + `golden.json` fallback.** Cache a good day's plan; record a backup run.

**7–8h · Rehearsal.** The 60-second script below, twice.

---

## 6. Demo script (60s)

1. "I work out 3 times a week, dumbbells only, and my knee hurts." Set the profile.
2. Today's session appears — knee-safe, dumbbell-only.
3. Log it: "felt easy."
4. Ask for tomorrow — it's progressed.
5. Log "knee sore" — it swaps the movement and explains why.

---

## 7. Risks & fallbacks

| Risk | Fix |
|---|---|
| Unsafe advice | strong prompt (respect injuries), temperature ≈ 0, `golden.json` fallback; add a disclaimer |
| Over-progressing too fast | cap weekly progression in the prompt; review before demo |
| Memory needs embeddings | fall back to `profile.json` (injuries) read into the prompt |
| UI eats the budget | use `jiuwenswarm-web` as-is |

## 8. Stretch (only if time)

A 4-week plan with deload weeks · a progress chart from logs · equipment-aware swaps · a "5-minute version" for busy days.
