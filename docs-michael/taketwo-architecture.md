# TakeTwo — technical architecture (mirrors `topspin-review`)

This is the engineering counterpart to `build-video-to-fix-bug-bot.md`. It copies the
**structural DNA** of `C:\Workspace\openjiuwendemos\topspin-review` exactly, so the two projects
read the same way and enforce the same separations. Read `topspin_review/docs/architecture.md`
side by side with this file.

---

## 0. The DNA we are copying (the rules)

1. **Layered, hexagonal. Dependencies point inward only**, enforced by an AST test
   (`tests/unit/test_architecture.py`), not by convention.
2. **One façade per framework.** All openjiuwen access lives in `backend/`; nothing else imports
   it. `backend/__init__.py` exposes a tiny surface; everything else is internal.
3. **Params objects, not argument piles.** Callers describe a request with one dataclass and hand
   it to a single entry point (`backend.build(TextParams|VisionParams)`,
   `pipeline.<Strategy>.analyze(Params)`).
4. **Template-method strategies.** A `Strategy` base owns the fixed prologue/epilogue; concrete
   strategies implement only their real difference; a registry (`resolve_strategy.py`) hands them
   out. Callers import the `pipeline` package, never a concrete strategy module.
5. **Stages are self-contained folders.** Each stage owns its logic, its `build_agent.py` (thin
   policy over `backend.build`), and its `prompts.py`. Stages never import `pipeline`.
6. **Neutral leaves.** Cross-cutting, side-effect-free helpers live at a leaf: `analysis/progress.py`,
   `config.py`, `storage/runtime.py`, and the pure `domain/`.
7. **Shared primitives are explicit folders** used by 2+ consumers (`analysis/video/` in topspin →
   `analysis/{media,browser,forge}/` here). One consumer ⇒ it stays inside that consumer.
8. **`__init__.py` is imports + docstring only.** No side effects; `bootstrap.setup()` is the one
   explicit place that creates dirs and configures logging.
9. **Long runs stream progress** through a thread-safe `Progress`, written to JSON by a separate
   `worker` process and polled by the UI.
10. **Business/operation names only.** Nothing applicative is named after the framework; nothing
    is named "agent" unless it is one.

---

## 1. Layers

```
interfaces  ──▶  analysis  ──▶  backend  ──▶  domain
                     │
                     └────▶  storage / reporting / config
```

| Layer | Package | Responsibility | May depend on |
|---|---|---|---|
| Domain | `domain/` | Pure rules: submission/repro/fix schemas, timeline math, verify, render, evaluate, compare. No I/O, no third-party. | stdlib only |
| Backend | `backend/` | The single home for openjiuwen: settings, models, agent builder, rails, tools, runner, logs, telemetry. Imports no application module. | stdlib, openjiuwen |
| Primitives | `analysis/media/`, `analysis/browser/`, `analysis/forge/` | Shared, capability-level building blocks (video, browser automation, git/GitHub). Used by 2+ stages. | stdlib, third-party libs, storage, config |
| Analysis | `analysis/stages/`, `analysis/pipeline/` | The pipeline: understand → reproduce → repair → prove → deliver, run by two strategies, over the shared primitives. | backend, analysis.media/browser/forge, storage, domain, reporting, config |
| Storage | `storage/` | Runtime path layout, JSON helpers, per-submission store, repo cache. | config |
| Reporting | `reporting.py` | Outbound artifacts: `issue.md`, `pr.md`, proof manifest, exports. | domain, storage |
| Interfaces | `interfaces/` | Adapters: CLI, HTTP API / GitHub webhook, MCP, Streamlit UI, service façade, worker. | anything |

Enforced by `tests/unit/test_architecture.py`:

```python
FORBIDDEN = {
    "domain":    {"analysis", "backend", "storage", "reporting", "interfaces"},
    "backend":   {"domain", "analysis", "reporting", "interfaces"},
    "storage":   {"domain", "analysis", "backend", "reporting", "interfaces"},
    "reporting": {"analysis", "backend", "interfaces"},
    "analysis":  {"interfaces"},
}
```

Plus `test_domain_is_pure()` forbidding `playwright, opencv/numpy/PIL, openjiuwen, streamlit,
fastapi, mcp, PyGithub` inside `domain/`.

---

## 2. Package map

```
taketwo/
├── pyproject.toml                 # packaging + extras (browser/ocr/api/mcp/web/dev/all), ruff, pytest
├── requirements.txt
├── .env.example
├── conftest.py                    # insert root on sys.path; call bootstrap.setup()
├── README.md  QUICKSTART.md  docs/architecture.md
├── run.ps1
├── runtime/                       # generated, gitignored
│   ├── workspace/                 # DeepAgent workspace scaffold
│   ├── logs/
│   └── data/                      # submissions/, repos/, artifacts/, exports/, cache/
├── taketwo/
│   ├── __init__.py                # version only (no side effects)
│   ├── bootstrap.py               # setup() (dirs + logging) + run(coro) (quiet loop)
│   ├── config.py                  # APPLICATION behaviour (sampling, thresholds, limits, toggles)
│   ├── reporting.py               # issue.md / pr.md / proof manifest
│   ├── domain/                    # PURE rules
│   │   ├── submission.py          #   Submission/Clip schema + normalize/validate
│   │   ├── timeline.py            #   Step list model + coercion/diffing
│   │   ├── repro.py               #   Reproduction schema (steps, evidence, verdict)
│   │   ├── fix.py                 #   Patch model (paths, hunks, test)
│   │   ├── verify.py              #   acceptance: repro red→green, tests pass
│   │   ├── render.py              #   issue.md / pr.md text
│   │   ├── evaluate.py            #   score a reproduction (evidence coverage, grounding)
│   │   └── compare.py             #   before/after run comparison
│   ├── backend/                   # OPENJIUWEN ONLY (single home)
│   │   ├── __init__.py            #   façade: build, TextParams, VisionParams, run_agent,
│   │   │                          #           run_text, ConfigError, configure_logging
│   │   ├── settings.py            #   endpoints/keys/model names/timeouts/embed/budget/tracing
│   │   ├── logs.py                #   route openjiuwen logging to a dir
│   │   ├── agent/
│   │   │   ├── builder/{build,base,params,text,vision,result}.py
│   │   │   ├── models/{builder,params}.py
│   │   │   ├── rails.py           #   AgentRail base + TokenBudgetRail + memory_rail() + resolve()
│   │   │   ├── tools.py           #   make_tool()/make_tools() (openjiuwen tool decoration)
│   │   │   └── runner.py          #   Runner lifecycle, run_agent(), callback-event bridge
│   │   └── telemetry/{usage,traces,recorder}.py
│   ├── analysis/
│   │   ├── __init__.py
│   │   ├── progress.py            #   NEUTRAL LEAF: Progress + tick()
│   │   ├── media/                 # SHARED: frames, cursor, ocr, clips, encode, contact_sheet
│   │   ├── browser/               # SHARED: session, act, console, snapshot, record (Playwright)
│   │   ├── forge/                 # SHARED: clone, search, blame, read_file, open_issue, open_pr
│   │   ├── stages/
│   │   │   ├── understand/        #   stage 1: recording  → timeline + failure hypothesis
│   │   │   ├── reproduce/         #   stage 2: timeline   → reproduced run + evidence + before clip
│   │   │   ├── repair/            #   stage 3: evidence   → localized cause + patch + test
│   │   │   ├── prove/             #   stage 4: patch      → after clip + before/after proof
│   │   │   └── deliver/           #   stage 5: artifacts  → issue + draft PR
│   │   └── pipeline/              #   the orchestrator
│   │       ├── params.py          #     Params: request + run state
│   │       ├── run_session.py     #     shared run state: recorder, browser session, vision agent
│   │       └── strategies/{base,resolve_strategy,deterministic,agentic}.py
│   ├── storage/                   # runtime, json_store, jobs, cache
│   └── interfaces/                # cli, api, service, worker, mcp/, web/
├── scripts/                       # make_sample_bug.py, evaluate_repros.py
└── tests/
    ├── unit/{test_architecture.py, test_pipeline.py}
    ├── integration/
    └── eval/expected.json
```

---

## 3. Mapping: topspin-review → TakeTwo

| topspin-review | TakeTwo | Why the same |
|---|---|---|
| `analysis/video/` (media primitives) | `analysis/media/` + `analysis/browser/` + `analysis/forge/` | Shared capability leaves, used by 2+ stages |
| `stages/measure, observe, coach` | `stages/understand, reproduce, repair, prove, deliver` | Self-contained stage folders |
| `pipeline/strategies/{deterministic,agentic}` | same names, same base class | Two interchangeable modes over one template |
| `backend` (openjiuwen façade + builder + telemetry) | **identical** | Framework isolation is the whole point |
| `domain/{report,progress,compare,evaluate,render}` | `domain/{submission,timeline,repro,fix,verify,render,evaluate,compare}` | Pure rules, stdlib only |
| `interfaces/{cli,api,service,worker,mcp,web}` | **identical** + GitHub webhook in `api.py` | Inbound adapters |
| `storage/{runtime,store,json_store,cache}` | **identical**, keyed by job instead of video | Local state layout |
| `reporting.py` (Markdown/HTML/PDF) | `reporting.py` (issue.md/pr.md/proof manifest) | Outbound artifacts |
| `config.py` (sampling/toggles) vs `backend/settings.py` (endpoints) | **same split** | Keep behaviour and credentials apart |
| `analysis/progress.py` (neutral leaf) | **identical** | Worker/UI progress streaming |
| “video in → report out” | “recording in → issue + PR + proof out” | Same shape, different artifacts |

---

## 4. Contracts (copy these signatures)

**Backend façade** (`taketwo/backend/__init__.py`):

```python
from .agent.builder import TextParams, VisionParams, build
from .agent.runner import run_agent, run_text
from .logs import configure as configure_logging
from .settings import ConfigError
__all__ = ["ConfigError", "TextParams", "VisionParams", "build",
           "configure_logging", "run_agent", "run_text"]
```

**Agent builder** (`backend/agent/builder/`): `build(params) -> BuildResult(agent, recorder)`;
`AgentBuilder` owns the recorder + model instrumentation; `TextBuilder`/`VisionBuilder` only
construct the DeepAgent. `TextParams` takes `tools=[plain callables]`, `rails=[names]`.

**Pipeline** (`analysis/pipeline/__init__.py`):

```python
from .params import Params
from .strategies import (DETERMINISTIC, AGENTIC, STRATEGIES, Strategy,
                         default_name, get_strategy, resolve)
```

**Strategy** (`strategies/base.py`) — same template as topspin:

```python
class Strategy:
    async def analyze(self, params: Params) -> dict:
        self._prepare(params)
        result, extras = await self._run(params, params.progress)
        return await self._finalize(params, result, extras, params.progress)
    async def _run(...) -> tuple[Any, dict]: ...      # concrete strategies implement this
    async def _after_report(...) -> dict: ...          # optional hook
```

**Params** (`pipeline/params.py`):

```python
@dataclass
class Params:
    video_path: str
    repo: str | None = None
    base_branch: str = "main"
    app_url: str | None = None
    progress: Progress | None = None
    # populated during the run
    timeline: dict = field(default_factory=dict)
    reproduction: dict = field(default_factory=dict)
    fix: dict = field(default_factory=dict)
    proof: dict = field(default_factory=dict)
    session: Any = None
    artifact_paths: dict = field(default_factory=dict)
    state: dict = field(default_factory=dict)
```

**Service** (`interfaces/service.py`): `replay_video(...)` (async) + `replay_video_sync(...)` +
`describe()` (the single source of truth for the MCP tool contract). MCP exposes it via FastMCP in
`interfaces/mcp/server.py` — the tool decorator stays in `backend`.

---

## 5. Stages

Each folder = `<stage>.py` (the function), `build_agent.py` (thin policy over `backend.build`),
`prompts.py`, and any stage-only tool modules. Stages import primitives, never `pipeline`.

| Stage | Function | Consumes | Produces | Primitives |
|---|---|---|---|---|
| `understand` | `understand(video, progress) -> Timeline` | a screen recording | ordered, timestamped steps + failure hypothesis + last-good/bad frames | `media/` |
| `reproduce` | `reproduce(timeline, app_url, progress) -> Reproduction` | timeline | `steps[] + evidence{console,network,dom} + before_clip` (or one clarifying question) | `browser/`, `media/` |
| `repair` | `repair(repro, repo, progress) -> Fix` | repro + repo | culprit commit/files + `fix.diff` + regression test (run in sandbox) | `forge/`, `backend` |
| `prove` | `prove(repro, fix, progress) -> Proof` | repro + patch | `after_clip` + labelled `proof.mp4` (before \| after) | `browser/`, `media/` |
| `deliver` | `deliver(repro, fix, proof, progress) -> dict` | all artifacts | issue + draft PR (human-approved) | `forge/`, `reporting` |

The **shared prologue** (`Strategy._prepare`) clones the repo, runs `understand`, and starts the
run session — exactly as topspin’s `_prepare` samples + measures. The **shared epilogue**
(`_finalize`) records usage, patches the job state, and writes exports/observability.

---

## 6. Runtime layout & artifacts

```
runtime/
├── workspace/                         # DeepAgent workspace (memory/, todo/, ...)
├── logs/                              # openjiuwen logs
└── data/
    ├── repos/<owner>__<name>/         # shallow clone per job
    ├── <job>_repro.json               # reproduction (steps + evidence + verdict)
    ├── <job>_fix.json                 # patch + test + culprits
    ├── <job>_observability.json       # model/tool calls, usage, traces
    ├── cache/<job>/                   # sampled frames, OCR
    ├── artifacts/<job>/               # before.mp4, after.mp4, proof.mp4, frames, snapshots
    └── exports/<job>_issue.md, <job>_pr.md
```

`storage/runtime.py` owns the paths (mirror topspin’s `runtime.py`); `storage/store.py` reads/writes
the per-job JSON via `storage/json_store.py`.

---

## 7. Configuration split (same rule as topspin)

- `config.py` — **application behaviour**: `FRAME_FPS`, `MAX_FRAMES`, `OCR_LANG`,
  `CURSOR_MOTION_THRESHOLD`, `REPRO_MAX_STEPS`, `STEP_TIMEOUT_S`, `PROOF_WIDTH`,
  `AGENTIC_MODE`, `VERIFY_FIX`, `RAILS`, `retrieval_enabled()`, sandbox limits.
- `backend/settings.py` — **reaching endpoints**: `MODEL_PROVIDER`, `API_KEY`, `API_BASE`,
  `MODEL_NAME`, `VISION_MODEL_NAME`, temperatures, `LLM_TIMEOUT`, `TOKEN_BUDGET`,
  `TRACE_CALLBACKS`, `EMBED_*`.
- `analysis/forge/auth.py` — the **GitHub App** credentials (the integration owns its secret;
  `backend` never learns about GitHub).

---

## 8. Telemetry & observability

Copy `backend/telemetry/` verbatim in spirit: the builder creates a run **Recorder**; `make_tool`
and the model instrumentation capture usage/traces automatically; `RunSession.save_details()` writes
`<job>_observability.json`. The UI shapes traces for display in `interfaces/web/`, never in backend.

---

## 9. Packaging & CI (copy `pyproject.toml` shape)

```toml
[project.optional-dependencies]
browser = ["playwright>=1.44"]
ocr     = ["paddleocr>=2.7"]          # or: pytesseract, plus system tesseract
video   = ["imageio>=2.34", "imageio-ffmpeg>=0.4", "opencv-python>=4.9"]
forge   = ["PyGithub>=2.3"]
api     = ["fastapi>=0.110", "uvicorn>=0.29"]
mcp     = ["mcp>=1.2"]
web     = ["streamlit>=1.36"]
dev     = ["pytest>=7", "ruff>=0.6"]
all     = [ ... ]

[project.scripts]
replay = "taketwo.interfaces.cli:main"
```

`tests/unit/test_architecture.py` is copied and re-pointed at `taketwo/`; `conftest.py` calls
`bootstrap.setup()`; CI runs `ruff` + `pytest`. `tests/eval/expected.json` + `scripts/evaluate_repros.py`
mirror topspin’s quality gate.

---

## 10. Build order (dependency-first, so layers stay clean)

1. **Skeleton + rules:** `pyproject.toml`, `conftest.py`, `bootstrap.py`, `config.py`,
   `storage/{runtime,json_store}`, `analysis/progress.py`, and the **architecture test** first — it
   defines "done".
2. **Domain:** `submission`, `timeline`, `repro`, `fix`, `verify`, `render`, `evaluate`, `compare`
   (pure, unit-tested, no deps).
3. **Backend:** copy `backend/` shape (`settings`, `logs`, `agent/builder/{base,params,text,vision}`,
   `models`, `rails`, `tools`, `runner`, `telemetry`) and its façade.
4. **Primitives:** `analysis/media/` (frames, cursor, OCR, clips), `analysis/browser/`
   (Playwright session), `analysis/forge/` (clone, search, blame, PR) — each with a tiny offline test.
5. **Stages:** `understand` → `reproduce` → `repair` → `prove` → `deliver`, each with its
   `build_agent.py` + `prompts.py`.
6. **Pipeline:** `params.py`, `run_session.py`, `strategies/{base,resolve_strategy,deterministic,agentic}`.
7. **Interfaces:** `service.py` → `cli.py` → `worker.py` → `mcp/server.py` → `api.py` → `web/ui.py`.
8. **Reporting + eval:** `reporting.py`, `scripts/make_sample_bug.py`, `scripts/evaluate_repros.py`.

---

## 11. What we deliberately change

- **Two shared primitive leaves** (media + browser) instead of one, plus `forge/` — because the
  capabilities differ. The rule (2+ consumers ⇒ shared leaf) is unchanged.
- **Five stages** instead of three — the job has more distinct concerns (observe/reproduce/fix/prove/deliver).
- **`api.py` also hosts the GitHub webhook** and the sandboxed job queue; `forge/` holds the GitHub App.
- **`domain/fix.py` models a patch** (paths + hunks + test) so verification is a pure function.

Everything else — the façade, params objects, template strategies, neutral leaves, `__init__`
discipline, worker/progress streaming, architecture-as-a-test — is copied as-is.
