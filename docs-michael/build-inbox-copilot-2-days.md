# Build: Inbox Copilot in 2 days (on openjiuwen)

**The idea.** You come back from a week off to 200 unread emails. Inbox Copilot reads them, labels each one, drafts the routine replies in your voice, and hands you a short list of the few that actually need *you*. Nothing is sent without your approval.

**The 60-second demo.** Drop a fake inbox into the app → the agent triages every message, drafts 3 replies, flags 2 → show it signs the way you do *because it remembered your preference* → show it refuse to auto-reply to an invoice.

---

## 1. Scope for two days

| Keep real | Fake / simplify |
|---|---|
| The agent loop and tool calling | The inbox — a JSON fixture, not a real mail server |
| Triage logic, draft generation, flags | Sending — drafts are saved, never sent |
| Memory of user preferences | Real Gmail/Outlook — a mock inbox file |
| A small UI to show the result | Auth, multi-user, production storage |

Rule: **every tool is deterministic and local**, so the demo never fails on stage.

---

## 2. openjiuwen pieces used

| Piece | What it gives us | Where |
|---|---|---|
| `create_deep_agent(...)` | Creates the agent with tools, prompt, rails | `openjiuwen/harness/factory.py` |
| `@tool` | Defines each inbox action as a callable tool | `openjiuwen/core/foundation/tool/tool.py` |
| `MemoryRail` | Remembers your style/preferences across runs | `openjiuwen/harness/rails/memory/memory_rail.py` |
| `Runner.run_agent(agent, {...})` | Runs the agent on a query | `openjiuwen/core/runner` |
| Streamlit (or `jiuwenswarm-web`) | The screen we show | `jiuwenswarm/channels/web/app_web.py` |

Optional later: swap the mock inbox for a real one via an **MCP** email server (`jiuwenswarm/server/runtime/mcp/registry.py`).

---

## 3. Architecture

```
inbox.json ─┐
            ▼
     ┌───────────────────────────┐
     │  Inbox Copilot (agent)    │
     │  prompt + MemoryRail      │
     └────────────┬──────────────┘
                  │ calls tools
   ┌──────────────┼───────────────────────────┐
   ▼              ▼              ▼            ▼
list_inbox  read_email    draft_reply   label_email   flag_for_human
   │              │              │            │
   └──────────────┴──────────────┴────────────┘
                  ▼
            drafts.json / triage.json
                  ▼
            Streamlit 3-pane UI
        (Inbox · Drafts · Needs you)
```

---

## 4. Day 1 — make the agent work (8h)

**0–1h · Scaffold + fake inbox.**
Create the project and `data/inbox.json` with ~12 emails across five kinds: routine, FYI, invoice, urgent, spam. Deterministic content only.

**1–3h · Define the tools.** `app/tools.py`:

```python
import json
from openjiuwen.core.foundation.tool import tool

INBOX = json.load(open("data/inbox.json"))
_drafts, _labels, _flags = {}, {}, {}

@tool(name="list_inbox", description="List inbox emails: id, from, subject, 80-char preview.")
def list_inbox() -> list:
    return [{"id": e["id"], "from": e["from"], "subject": e["subject"],
             "preview": e["body"][:80]} for e in INBOX]

@tool(name="read_email", description="Read the full body of one email by id.")
def read_email(id: str) -> str:
    return next(e["body"] for e in INBOX if e["id"] == id)

@tool(name="draft_reply", description="Save a draft reply to an email (never sends).")
def draft_reply(id: str, body: str) -> str:
    _drafts[id] = body
    return f"draft saved for {id}"

@tool(name="label_email", description="Triage label for an email: routine | fyi | invoice | spam.")
def label_email(id: str, label: str) -> str:
    _labels[id] = label
    return f"{id} -> {label}"

@tool(name="flag_for_human", description="Flag an email that needs the user's decision.")
def flag_for_human(id: str, reason: str) -> str:
    _flags[id] = reason
    return f"flagged {id}"
```

**3–5h · Wire the agent.** `app/agent.py`:

```python
from openjiuwen.harness import create_deep_agent
from openjiuwen.harness.rails import MemoryRail
from openjiuwen.core.runner import Runner
from app import tools

SYSTEM = """You are Inbox Copilot. Work through my inbox and, for each email:
1) label it (routine / fyi / invoice / spam),
2) if it is routine, draft a short reply in my voice,
3) if it needs my decision, call flag_for_human with a reason.
Never auto-reply to invoices. Never invent emails. Always use the tools."""

agent = create_deep_agent(
    model=llm_model,                      # a configured Model instance
    system_prompt=SYSTEM,
    tools=[tools.list_inbox, tools.read_email, tools.draft_reply,
           tools.label_email, tools.flag_for_human],   # pass .card if required
    rails=[MemoryRail(embedding_config=embedding_config)],
    enable_task_loop=False,
    max_iterations=25,
)

async def run_inbox() -> str:
    result = await Runner.run_agent(agent, {"query":
        "Go through my whole inbox now: triage every email, draft the routine replies, "
        "and flag the ones that need me."})
    return result.get("output")
```

Model/embedding config comes from env (`MODEL_NAME`, `MODEL_PROVIDER`, `API_KEY`, `API_BASE`) — the same pattern as `openjiuwen` docs.

**5–7h · Tune until the happy path is right.** Run `run_inbox()` in a CLI loop against `inbox.json` until: every email is labeled, 3 routine drafts exist, 2 urgent items are flagged, the invoice is *not* auto-replied. Lower temperature for stability.

**7–8h · Lock it.** Save a known-good run (drafts + labels + flags) to `data/golden.json` as the demo fallback.

---

## 5. Day 2 — memory, second path, UI, rehearsal (8h)

**0–2h · Memory.** Teach a preference, then prove it persists:

```python
await Runner.run_agent(agent, {"query": "Remember: I always sign emails as '— Michael'."})
await Runner.run_agent(agent, {"query": "Remember: never auto-reply to invoices."})
# later run — drafts come out signed "— Michael"
```
If embeddings aren't ready, fall back to a plain `data/preferences.json` read by the prompt.

**2–4h · The second path (the trust story).** Deliberately include an invoice and an angry customer. Confirm the agent **flags** them instead of replying — this is the moment that shows it's safe.

**4–6h · UI.** Two options:
- Fast: a Streamlit app with three columns (Inbox, Drafts, Needs you) reading `_drafts/_labels/_flags`.
- Built-in: run `jiuwenswarm-start` and use the local web chat at `http://localhost:5173` (`channels/web/app_web.py`).

**6–7h · Polish + rehearsed fallback.** Cache outputs; record a backup run in case the model hiccups live.

**7–8h · Rehearsal.** The 60-second script below, twice.

---

## 6. Demo script (60s)

1. "Two hundred emails after a week off." Drop the inbox in.
2. Watch it triage: labels appear, drafts appear, 2 flags appear.
3. Open a draft — "it already sounds like me." Click memory: *"I always sign as Michael."*
4. Open the invoice — "it refused to touch it, and told me why." That's the trust moment.
5. "Nothing sent. Everything's waiting for my yes."

---

## 7. Risks & fallbacks

| Risk | Fix |
|---|---|
| Model nondeterminism on stage | temperature ≈ 0, deterministic mock tools, `golden.json` fallback |
| Memory needs embeddings | swap to `preferences.json` read into the prompt |
| UI eats the budget | use `jiuwenswarm-web` as-is instead of building Streamlit |
| Agent loops too long | `max_iterations=25`, cap inbox at 12 emails |

## 8. Stretch (only if time)

Real inbox via an MCP email server · calendar-aware replies ("propose Tuesday 10:00") · a "summary of what I missed" email to yourself.
