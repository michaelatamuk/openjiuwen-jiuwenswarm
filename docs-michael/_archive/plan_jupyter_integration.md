# JiuwenSwarm Jupyter Integration — Development Plan

## Goal

Make JiuwenSwarm usable directly inside Jupyter notebooks and JupyterLab, so that data scientists and ML researchers can invoke single agents and multi-agent swarms from within their existing notebook workflow — without starting a separate server, opening a browser tab, or leaving their environment.

The integration should feel native: results stream into cells, tool calls are visible, the agent can read notebook context, and the whole thing installs with `pip install`.

---

## What already exists (relevant to this plan)

- `JiuWenSwarm` — a Python facade class with `process_message_stream()` that streams `AgentResponseChunk` objects. This is the direct in-process entry point; no HTTP or WebSocket needed.
- Session ID convention already anticipates `jupyter_<uuid>` as a channel pattern.
- Streaming event types are well-defined: `chat.delta`, `chat.final`, `chat.error`, `tool.call`, `tool.result`.
- Agent modes available: `agent`, `code`, `team`, `code.team` — all accessible via the same API.
- Workspace at `~/.jiuwenswarm/` is already used for config, history, and skills.

No new protocol work is needed. The integration is a new surface on top of the existing Python API.

---

## Architecture decision

**In-process Python SDK** (not a separate server or WebSocket channel).

The `JiuWenSwarm` class is imported directly into the notebook process. This means:
- Works in any Jupyter environment: JupyterLab, classic Notebook, VS Code Notebooks, Google Colab, Kaggle Notebooks.
- Single `pip install` — no daemon to start, no port to configure.
- The agent runs in the same Python process as the notebook, so it can directly access notebook variables and dataframes.

A richer JupyterLab sidebar panel (Phase 2) adds the visual experience on top, but is not required for the core capability.

---

## User experience (what users write)

### Option 1 — Cell magic (lowest friction)

```python
%%jiuwen
Analyse the dataframe `df` loaded above and identify the three most correlated features with the target column.
```

The agent sees the notebook context (variables, recent cell outputs), executes tools as needed, and streams the response into the cell output area in real time.

### Option 2 — Python API (programmatic use)

```python
from jiuwenswarm.jupyter import JupyterSwarm

swarm = JupyterSwarm()
result = await swarm.run("Write a preprocessing pipeline for df", mode="code")
```

### Option 3 — Multi-agent swarm from a cell

```python
%%jiuwen --mode team
Research the top 3 open-source alternatives to XGBoost for tabular data.
Assign one agent per library, have them benchmark each on the attached dataset, and produce a comparison table.
```

### Option 4 — JupyterLab sidebar panel (Phase 2)

A persistent chat panel in the JupyterLab sidebar, similar to the IDE plugin, connected to the same in-process agent. Supports swarm map view showing agent activity.

---

## Components

### Package: `jiuwenswarm-jupyter`

A standalone pip-installable package that depends on `jiuwenswarm` and `ipython`. Registers the IPython magic and exposes the Python API.

```
jiuwenswarm-jupyter/
├── jiuwenswarm_jupyter/
│   ├── __init__.py              # JupyterSwarm class + magic registration
│   ├── magic.py                 # %%jiuwen / %jiuwen cell and line magic
│   ├── client.py                # Thin wrapper around JiuWenSwarm facade
│   ├── context.py               # Notebook context extractor
│   ├── display.py               # IPython output rendering (streaming)
│   └── session.py               # Session ID management (jupyter_<uuid>)
├── pyproject.toml
└── README.md
```

### JupyterLab extension: `@jiuwenswarm/jupyterlab` (Phase 2)

A TypeScript JupyterLab frontend extension providing the sidebar panel and swarm map view. Communicates with the Python kernel via Jupyter comm messages (no additional server needed).

```
jiuwenswarm-jupyterlab/
├── src/
│   ├── index.ts                 # Extension entry point
│   ├── panel.ts                 # Sidebar chat panel (mirrors chat.html)
│   ├── swarm_map.ts             # Agent swarm visualisation
│   └── comm.ts                  # Jupyter comm ↔ Python kernel bridge
├── package.json
└── pyproject.toml               # Python side of the JupyterLab extension
```

---

## Implementation plan

### Phase 1 — Core in-process API (minimum viable integration)

**Goal:** `pip install jiuwenswarm-jupyter` → `%%jiuwen` works in any notebook.

#### Step 1.1 — `JupyterSwarm` client wrapper

Wrap `JiuWenSwarm` with notebook-specific defaults:

```python
class JupyterSwarm:
    def __init__(self, mode="agent", session_id=None):
        self._swarm = JiuWenSwarm()
        self._session_id = session_id or f"jupyter_{uuid4().hex[:12]}"
        self._mode = mode

    async def run(self, query: str, mode: str | None = None) -> str:
        # Builds AgentRequest with channel_id="jupyter"
        # Calls process_message_stream()
        # Renders output via display.py
        ...
```

#### Step 1.2 — Streaming output renderer

IPython supports live-updating output via `display(obj, display_id=True)` and `update_display()`. Use this to stream `chat.delta` events into a single output cell that updates in place, rather than printing chunks as separate lines.

Tool call events (`tool.call`, `tool.result`) render as collapsible blocks so the user can see what the agent did without it dominating the output.

```
▸ tool: read_file("data/train.csv")       [collapsible]
▸ tool: bash("df.describe()")             [collapsible]

The dataset has 10,000 rows and 15 columns. The three features most
correlated with `target` are: `feature_3` (r=0.82), `feature_7` (r=0.71),
`feature_1` (r=0.68). ...
```

#### Step 1.3 — Notebook context extractor

Before sending a query to the agent, extract relevant context from the running notebook:

- Variable names and types from the IPython namespace (`ip.user_ns`)
- The last N cell inputs and outputs (configurable, default 5)
- Any pandas DataFrames: shape, dtypes, `.head(3)` summary
- Installed packages (from `sys.modules`)

This context is injected into the system prompt as a `PromptSection` so the agent knows what exists in the notebook without the user having to explain it.

#### Step 1.4 — `%%jiuwen` cell magic and `%jiuwen` line magic

```python
@register_cell_magic
def jiuwen(line, cell):
    # Parse options from `line` (e.g. --mode team, --session my_session)
    # Inject notebook context
    # Call JupyterSwarm.run(cell)
    # Block until complete (sync wrapper around async run)
```

Supported options:
- `--mode agent|code|team|code.team`
- `--session <name>` — reuse a named session across cells
- `--no-context` — skip notebook context injection
- `--timeout <seconds>`

#### Step 1.5 — Session persistence across cells

By default, each notebook gets one persistent `JupyterSwarm` instance stored in the IPython namespace. Subsequent `%%jiuwen` cells in the same notebook continue the same conversation, so the agent remembers previous exchanges and can build on earlier analysis.

Named sessions (`--session research`) allow multiple independent threads within one notebook.

---

### Phase 2 — JupyterLab sidebar panel

**Goal:** A persistent chat panel in JupyterLab with swarm map visualization, matching the experience of the IDE plugin.

#### Step 2.1 — Jupyter comm bridge

JupyterLab extensions communicate with the Python kernel via `comm` messages. The TypeScript extension sends user messages to the kernel; the Python side routes them through `JupyterSwarm` and streams events back.

This reuses the existing event schema (`chat.delta`, `chat.final`, `tool.call`, etc.) without any protocol changes.

#### Step 2.2 — Chat panel

Port the shared `chat.html` webview logic to a JupyterLab React panel. The panel is a sidebar widget that persists across notebook tabs.

Since `chat.html` is already vanilla JS with a clear message protocol, the port is largely a matter of replacing the plugin bridge (`window.__jb_send` / `vscodeApi.postMessage`) with Jupyter comm calls.

#### Step 2.3 — Swarm map panel

Port `swarm_map.html` (Map / List / Board views) to a second JupyterLab panel tab. Team events (`team.member.spawned`, `team.task.created`, etc.) route from the Python kernel to the frontend via comm, same pattern as the chat panel.

---

### Phase 3 — Notebook-native agent capabilities

**Goal:** The agent can read and write notebook cells, not just respond in output areas.

#### Step 3.1 — Cell read tool

A `read_notebook_cell(cell_index)` tool that returns the source and output of a specific cell. Lets the agent reference earlier analysis without the user copy-pasting it into the prompt.

#### Step 3.2 — Cell write tool

An `insert_notebook_cell(source, cell_type="code")` tool that inserts a new code or markdown cell below the current one. The agent can generate code, insert it as a runnable cell, and leave execution to the user — or auto-execute if the user approves.

This is the notebook-native equivalent of the IDE plugin's file-edit diff workflow: the agent proposes a cell, the user sees it and decides whether to run it.

#### Step 3.3 — Variable read tool

A `read_variable(name)` tool that returns a serialized view of a Python variable from the notebook namespace. Lets the agent inspect a specific DataFrame, model, or result without having to re-run cells.

---

## Installation and setup

```bash
# Minimum (cell magic + Python API, any Jupyter environment)
pip install jiuwenswarm-jupyter

# Full (includes JupyterLab sidebar panel)
pip install jiuwenswarm-jupyter[lab]
jupyter labextension install @jiuwenswarm/jupyterlab
```

Auto-loads the magic if `jiuwenswarm_jupyter` is in `ipython_config.py`:

```python
# ~/.ipython/profile_default/ipython_config.py
c.InteractiveShellApp.extensions = ["jiuwenswarm_jupyter"]
```

Or manually in a cell:

```python
%load_ext jiuwenswarm_jupyter
```

---

## Configuration

Inherits all JiuwenSwarm configuration from `~/.jiuwenswarm/config/config.yaml`. Notebook-specific overrides can be set per-notebook via a metadata block or in-cell:

```python
from jiuwenswarm.jupyter import JupyterSwarm
swarm = JupyterSwarm(mode="code.team")  # Use multi-agent team mode
```

---

## Out of scope for this plan

- Google Colab-specific packaging (follows from Phase 1 with no changes; Colab supports standard pip packages and IPython magics)
- Remote Jupyter servers / JupyterHub multi-user deployment (follows naturally from the in-process architecture; each kernel has its own swarm instance)
- Notebook diff / version control integration (separate project)

---

## Files to create / modify

| File | Action | Notes |
|---|---|---|
| `packages/jiuwenswarm-jupyter/` | Create new package | Phase 1 |
| `jiuwenswarm_jupyter/client.py` | Create | Wraps `JiuWenSwarm` facade |
| `jiuwenswarm_jupyter/magic.py` | Create | `%%jiuwen` / `%jiuwen` |
| `jiuwenswarm_jupyter/context.py` | Create | Notebook context extractor |
| `jiuwenswarm_jupyter/display.py` | Create | Streaming IPython output |
| `jiuwenswarm_jupyter/session.py` | Create | Session ID + persistence |
| `packages/jiuwenswarm-jupyterlab/` | Create new package | Phase 2 |
| `jiuwenswarm/server/runtime/agent_adapter/interface.py` | No changes needed | Existing API is sufficient |
| `jiuwenswarm/common/schema/agent.py` | No changes needed | `jupyter` is a valid `channel_id` string |

No changes to the core `jiuwenswarm` or `agent-core` packages are required for Phase 1. The integration is entirely additive.
