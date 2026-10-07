# Build: Study Coach in 2 days (on openjiuwen)

**The idea.** Drop in any dense study material — lecture notes, a chapter, a PDF text dump. Study Coach turns it into a structured study guide, 10 flashcards, and a 5-question quiz, then remembers the topics you get wrong so next time it drills those first.

**Zero third-party integrations.** Input is a local file; output is local files. Only the model is called.

**The 60-second demo.** Upload a chapter → a guide + flashcards + quiz appear → answer 2 wrong → next session it leads with your weak topics.

---

## 1. Scope for two days

| Keep real | Fake / simplify |
|---|---|
| The agent loop, tool calling, quiz generation | The material — a sample markdown/text file we ship |
| Memory of weak topics | PDF parsing — start with plain text / markdown |
| A small UI to show the guide and quiz | Accounts, saving to a database, spaced-repetition scheduling |

Rule: **only local files and the model** — the demo can't fail on a network service.

---

## 2. openjiuwen pieces used

| Piece | What it gives us | Where |
|---|---|---|
| `create_deep_agent(...)` | The agent with tools, prompt, rails | `openjiuwen/harness/factory.py` |
| `@tool` | Each study action as a callable tool | `openjiuwen/core/foundation/tool/tool.py` |
| `MemoryRail` | Remembers weak topics across runs | `openjiuwen/harness/rails/memory/memory_rail.py` |
| `Runner.run_agent(agent, {...})` | Runs the agent | `openjiuwen/core/runner` |
| Streamlit (or `jiuwenswarm-web`) | The study screen | `jiuwenswarm/channels/web/app_web.py` |

Optional later: index the material with openjiuwen retrieval (`openjiuwen/core/retrieval/`) so long books are chunked and cited instead of pasted whole.

---

## 3. Architecture

```
material.md ─┐
             ▼
      ┌──────────────────────────┐
      │   Study Coach (agent)    │
      │   prompt + MemoryRail    │
      └───────────┬──────────────┘
                  │ calls tools
   ┌──────────────┼───────────────────────────────┐
   ▼              ▼              ▼        ▼        ▼
load_material  save_guide  save_flashcards save_quiz  record_result
   │              │              │        │        │
   └──────────────┴──────────────┴────────┘        │
                  ▼                                 ▼
        guide / cards / quiz  ───────────►  weak topics (memory)
                  ▼
            Streamlit UI
   (Guide · Flashcards · Quiz · Weak topics)
```

---

## 4. Day 1 — make the agent work (8h)

**0–1h · Scaffold + sample material.** Create the project and `data/material.md` — one dense chapter on a real topic (e.g. an intro to probability). Deterministic content only.

**1–3h · Define the tools.** `app/tools.py`:

```python
from openjiuwen.core.foundation.tool import tool

_state = {"guide": [], "cards": [], "quiz": [], "results": {}}

@tool(name="load_material", description="Load study material text from a local file path.")
def load_material(path: str) -> str:
    return open(path, encoding="utf-8").read()

@tool(name="save_guide", description="Save the study guide as a list of sections {title, summary, key_points}.")
def save_guide(sections: list) -> str:
    _state["guide"] = sections
    return f"saved {len(sections)} sections"

@tool(name="save_flashcards", description="Save flashcards as a list of {question, answer}.")
def save_flashcards(cards: list) -> str:
    _state["cards"] = cards
    return f"saved {len(cards)} cards"

@tool(name="save_quiz", description="Save a quiz as a list of {question, options, answer, topic}.")
def save_quiz(quiz: list) -> str:
    _state["quiz"] = quiz
    return f"saved {len(quiz)} questions"

@tool(name="record_result", description="Record whether the learner answered a topic correctly.")
def record_result(topic: str, correct: bool) -> str:
    _state["results"].setdefault(topic, []).append(correct)
    return "ok"
```

**3–5h · Wire the agent.** `app/agent.py`:

```python
from openjiuwen.harness import create_deep_agent
from openjiuwen.harness.rails import MemoryRail
from openjiuwen.core.runner import Runner
from app import tools

SYSTEM = """You are Study Coach. From the material the learner gives you:
1) build a study guide of sections (title, 2-line summary, key points),
2) write 10 flashcards,
3) write a 5-question multiple-choice quiz, one correct option each.
Use the tools to save everything. Base every question ONLY on the material.
If memory shows weak topics, lead the guide and quiz with those."""

agent = create_deep_agent(
    model=llm_model,                      # a configured Model instance
    system_prompt=SYSTEM,
    tools=[tools.load_material, tools.save_guide, tools.save_flashcards,
           tools.save_quiz, tools.record_result],
    rails=[MemoryRail(embedding_config=embedding_config)],
    enable_task_loop=False,
    max_iterations=25,
)

async def study(path: str) -> str:
    result = await Runner.run_agent(agent, {"query":
        f"Load {path} and build my study guide, flashcards, and quiz. "
        "Emphasize whatever topics I got wrong last time."})
    return result.get("output")
```

Model/embedding config comes from env (`MODEL_NAME`, `MODEL_PROVIDER`, `API_KEY`, `API_BASE`) — the same pattern as the openjiuwen docs.

**5–7h · Tune the happy path.** Run `study("data/material.md")` until the guide is coherent, there are 10 cards and 5 questions, and every quiz answer is grounded in the material (spot-check for invented facts). Lower temperature for stability.

**7–8h · Lock it.** Save a known-good guide/cards/quiz to `data/golden.json` as the demo fallback.

---

## 5. Day 2 — memory, quiz loop, UI, rehearsal (8h)

**0–2h · Memory of weak topics.** Record misses, then prove they come back:

```python
await Runner.run_agent(agent, {"query":
    "Remember these as my weak topics: Bayes' theorem, derivatives."})
# next study run leads with those
```
If embeddings aren't ready, fall back to a plain `data/weak_topics.json` read into the prompt.

**2–4h · The quiz loop (the trust story).** Show a learner answering; two are wrong → `record_result` is called → the weak-topic list updates. This is the moment that shows it adapts.

**4–6h · UI.** Two options:
- Fast: a Streamlit app with tabs **Guide · Flashcards · Quiz · Weak topics**, reading `_state`.
- Built-in: run `jiuwenswarm-start` and use the local web chat at `http://localhost:5173` (`channels/web/app_web.py`).

**6–7h · Polish + `golden.json` fallback.** Cache outputs; record a backup run.

**7–8h · Rehearsal.** The 60-second script below, twice.

---

## 6. Demo script (60s)

1. "Here's a chapter nobody wants to read." Drop `material.md` in.
2. The guide builds itself; flashcards and a 5-question quiz appear.
3. Take the quiz — get 2 wrong.
4. "It remembers what I missed." Show the weak-topic list update.
5. Start a new session — "it leads with Bayes' theorem now, because I missed it."

---

## 7. Risks & fallbacks

| Risk | Fix |
|---|---|
| Model invents facts not in the material | temperature ≈ 0, prompt "base everything on the material", spot-check; `golden.json` fallback |
| Long material overflows context | start with one chapter; index with `core/retrieval` if needed |
| Memory needs embeddings | swap to `weak_topics.json` read into the prompt |
| UI eats the budget | use `jiuwenswarm-web` as-is |

## 8. Stretch (only if time)

Index the material with openjiuwen retrieval for multi-chapter books with citations · spaced-repetition scheduling · export the guide to PDF · photo/OCR input of handwritten notes.
