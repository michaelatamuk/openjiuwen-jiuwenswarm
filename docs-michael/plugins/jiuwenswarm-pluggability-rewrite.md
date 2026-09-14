# Making agent-core + jiuwenswarm "everything is pluggable" — a rewrite architecture

Scope studied (code, not docs):
- `C:\Workspace\openjiuwen\agent-core` — 4,545 Python files; `openjiuwen/{core,harness,harness_protocol,harness_providers,agent_teams,extensions,agent_evolving,rsi,symphony,...}`.
- `C:\Workspace\openjiuwen\jiuwenswarm` — Python package rooted at `jiuwenswarm/`, plus a React/TUI frontend; multi-process (AgentServer + Gateway).

Companion doc: `deepseek-harness-pluggability.md` (the target model this borrows from).

This document is a mandate-style design: what exists, what is actually hardcoded, the target architecture, the `agent-tools` plugin distribution, the exact startup path, and a phased strangler migration that keeps the product identical.

---

## 0. Executive summary

### Recommendation in one screen

`agent-core` is a **framework for many integrators** — jiuwenswarm is only one. That single fact decides the shape.

- **One mechanism, in the framework.** The kernel + loader live in `agent-core`. Any integrator — jiuwenswarm or someone else — mounts their own composition with it. Do not build a separate plugin system per product.
- **Three layers, by who owns them (not by which repo a thing sits in today):**
  - `agent-core` = **framework**: contracts (seams/ABCs/events), the loop, the specs, the loader. Must run standalone, with no jiuwenswarm and no agent-tools. Generic.
  - `agent-tools` = **optional, integrator-agnostic capabilities**: reusable implementations of those seams. Not tied to jiuwenswarm; any integrator may use it, ignore it, or write their own. Generic.
  - `jiuwenswarm` = **one product**: its composition + product-specific plugins. Specific.
- **Dependency direction:** `agent-core` ← `agent-tools` ← `jiuwenswarm` (and ← any other integrator). `agent-core` imports neither; it only *discovers* plugins by entry-point group.
- **The split rule is generic vs specific, not which repo a thing sits in:** generic **contract** → `agent-core`; generic **implementation** → `agent-tools` (from either repo); product-specific → the product repo (`jiuwenswarm` for jiuwenswarm; a third-party integrator keeps theirs).
- **So "move from both repos" is still right, but the criterion is reuse, not origin:**
  - `agent-core` holds generic *implementations* today (rails, tools, subagents, llm adapters, memory, retrieval, fs/shell/sandbox, observability, workflow, harness providers) → `agent-tools`;
  - `jiuwenswarm` holds generic *capabilities* today (tools, code rails, memory, mcp, skill, channels, session store, marketplace/Hub, observability, browser) → `agent-tools`;
  - everything product-specific stays first-party in `jiuwenswarm`.
- **Integrators are first-class.** `agent-core` must document and test the standalone path: mount your own plugins, no `agent-tools`, no jiuwenswarm. `agent-tools` is a convenience, never a requirement.
- **"Plugin" is not "separate dependency".** `agent-core` ships a **first-party default plugin set *inside its own distribution*** (in-box plugins, mounted by rows) so `pip install openjiuwen` + a default composition yields a working agent. Only **optional/extra** implementations move to `agent-tools`. An integrator who never wants `agent-tools` never sees it. (Same shape as deepseek: the in-box bundles live in the repo; the plugin ecosystem is separate.)
- **Order:** (1) `agent-core` kernel + definitions + the `load_deep_agent_spec` loader; (2) `agent-tools` plugins; (3) `jiuwenswarm` composition files + first-party plugins (strangling the monoliths).

Pluggability is decided at two independent layers, and they are in very different states.

**Element layer — already largely pluggable (agent-core).** A manifest catalog with JSON-schema descriptors (`@harness_element`), three name→provider registries for rails/tools/sub-agents, fully JSON-serializable `DeepAgentSpec`/`AgentTemplateSpec`/`PluginSpec`, package loaders for plugin/agent-template packages, meta-providers that load rails/tools from **file / dotted import / entry point** (`openjiuwen.rail`, `openjiuwen.tool`), a provider SPI for whole agent harnesses (`harness_protocol`/`harness_providers`: `native`, `claudecode`, `codex`, `dsh`), and entry-point seams for vector stores and runner adapters. What is missing here is narrow: a config-file → spec loader (an explicit, documented `FUTURE` in `openjiuwen/harness/manifest/__init__.py`) and one kernel with lifecycle + effects + isolation.

**Runtime composition layer — not pluggable (jiuwenswarm).** None of the product's behavior is a plugin. An agent's composition is a hand-maintained Python list inside giant adapter classes (`interface_deep.py` = **897 KB / ~17,948 lines / ~500 methods**; `_build_agent_rails` at `interface_deep.py:8964`; `_get_tool_cards` at `interface_deep.py:10216`; `_TOOL_BUILD_NAMES` at `interface_code.py:402`). Process wiring is imperative. The product carries **four separate, partial extension mechanisms** (§3) and no unified kernel.

The rewrite therefore has a precise shape — and it is a **relocation of existing code**, not a plan for new features:

1. **Promote** the element registry that already exists into a real kernel (services, DI, effects, isolation).
2. **Implement** the config→spec loader that is already designed (`load_deep_agent_spec`).
3. **Move** jiuwenswarm's existing modules — the adapter rail/tool lists, the code rails, the swarm providers, the session/skill/mcp/marketplace subsystems, the gateway channels and message handlers, memory, observability — into plugins, one subsystem at a time, behind the kernel.

§8 is the concrete relocation inventory: each existing module/file is listed with the plugin package it moves to. Behavior must stay identical throughout; the existing test and snapshot suites are the acceptance gate.

---

## 1. The model to copy (from deepseek-harness)

Deepseek's claim rests on four things; each maps cleanly onto Python:

| deepseek-harness (Cordis/TS) | Python equivalent to build |
|---|---|
| Kernel: `Context` proxy, `Service`, `ctx.plugin`, `inject`, `ctx.effect`, `isolate`/`intercept` | `Container`/`Context` with named services, `Plugin`, `mount`, DI by name, effect/disposer, `isolate` |
| Composition as data: loader entry rows in YAML (`id/name/config/disabled/group/isolate`) + patch layers | `harness.yaml` host plane + `agent.yaml` session plane, same row model, patch/overlay layers |
| Capability seam = Service Definition / Provider / Consumer (separate packages) | ABC `Definition` + `Provider` plugin + `Consumer`; already partly the *named-provider* pattern |
| Self-modification + external plugins via manifests/entry points | Python entry points (`importlib.metadata`) + `agent-tools` distribution + package runtime extension |

The critical deepseek lesson to internalize: **a plugin is a lifecycle unit, not just a name→class dict.** Its contributions must be *effects* that unwind on unload, and its dependencies must *gate and re-trigger* it. That is what today's `register_*` dicts lack.

---

## 2. Current state — agent-core (what is already pluggable)

### 2.1 Manifest catalog + provider registries

`openjiuwen/harness/manifest/`:

- `catalog.py` — `@harness_element(kind, name, description, input_model, builder, interface_methods)` records a `HarnessElementDescriptor` (`models.py`: `kind`, `name`, `factory_ref`, `input_schema`, `input_model_ref`, `interface_methods`) into a module-level `_CATALOG`; `list_elements()` returns JSON schemas.
- Three kinds: `ElementKind.TOOL | RAIL | SUBAGENT`.
- `registration.py` — `register_from_catalog()` maps each descriptor to `register_tool_provider` / `register_rail_provider` / `register_subagent_provider` (`harness/schema/deep_agent_spec.py`); `ensure_builtin_elements_registered()` imports `builtin_elements`, `harness_elements`, `meta_elements` once and syncs. A process-level `_REGISTERED` guard; **later populators (team/swarm) must re-call `register_from_catalog()` themselves** — jiuwenswarm does exactly this (`agents/swarm/registry.py`).

### 2.2 Serializable specs

`harness/schema/deep_agent_spec.py`:

- `DeepAgentSpec` — fully JSON-serializable; `build(context)` / `resolve_parts(context)` materialize a live agent.
- `RailSpec(type, params)`, `BuiltinToolSpec(type, params)`, `SubAgentSpec(..., factory_name/factory_kwargs)` resolve by name through the provider registries. `SubAgentSpec` also supports `factory_name` providers.
- `SysOperationSpec`, `WorkspaceSpec`, `ProgressiveToolSpec`, `TeamModelConfig`/`ModelSpec`, `VisionModelSpec`, `AudioModelSpec`.
- **`RailSpec.build()` calls `ensure_builtin_elements_registered()` then looks up `_RAIL_PROVIDER_REGISTRY`** — i.e. the registry is the runtime seam.

### 2.3 External loading already exists — but only for rails/tools

`harness/manifest/meta_elements.py` declares six meta-providers:

- `harness.rail.file` / `harness.tool.file` — load a class from a `.py` file under `source_root`, with an elaborate hermetic importer (`_temporary_sys_path`, `_temporary_extension_alias`, an import-state lock, module-eviction on exit).
- `harness.rail.import` / `harness.tool.import` — dotted `module.ClassName`.
- `harness.rail.entry_point` / `harness.tool.entry_point` — `importlib.metadata` groups **`openjiuwen.rail`** and **`openjiuwen.tool`**.

So third-party rails/tools are loadable **today**, just not discovered automatically and not generalized to other capabilities.

### 2.4 Plugin / AgentTemplate package format + loader

`harness/resources/extension_loader.py` + `harness/schema/extension_spec.py`:

- `package_type=plugin`: `manifest.json` with `id`, `tools`, `mcps`, `rails`, `prompt_sections`, `skills`, `metadata`. Tools/rails are emitted as `BuiltinToolSpec(type="harness.tool.file")` / `RailSpec(type="harness.rail.file")` pointing at package-relative `.py` files.
- `package_type=agent_template`: `persona`, `model`, `tools`, `mcps`, `rails`, `skills`, `memories`, `rubrics`, `subagents` (with `.subagent.json` subtemplates).
- Legacy YAML (`harness_config.yaml` / `expert_harness.yaml` / `harness.yaml`) is normalized into the same specs, including MCP file/dir refs and a `builtin`/`entry_point`/`module.class`/`file` resource-item grammar.
- Bundled Python imports are made hermetic and namespaced under `openjiuwen.extensions.harness.<package>`.

### 2.5 Extension hot-binding

`harness/extension_binder.py` — `apply_extension_hot(agent, parts)` binds tools/mcps/rails/prompt_sections/skills/subagents to a **live** `DeepAgent`, records `ResourceRef`s, and `unapply_extension_hot` rolls them back in reverse order. Bindings are per-kind and hard-coded, but the rollback discipline is real.

### 2.6 Whole-harness provider SPI

`harness_protocol/` (frozen contracts) + `harness_providers/`:

- `SerializedTurnHarness` base owns the turn state machine; providers implement `_open_session`/`_close_session`/`_execute_turn` (+ `_steer`/`_interrupt_turn`).
- `factory.resolve_provider(provider)` supports `native`, `native_v2`, `claudecode`, `codex`, `dsh` — **but via a hardcoded `if/elif` chain**, not discovery.
- `create_harness(manifest, provider=...)` + `build_harness_context(...)` map an `AgentTemplateSpec` onto a provider.

### 2.7 Core-level entry-point seams (already)

- `core/foundation/store/__init__.py` — `openjiuwen.vector_stores` entry-point group + `register_vector_store` in-repo escape hatch.
- `core/runner/drunner/server_adapter/__init__.py` — `SERVER_ADAPTERS_ENTRY_POINT_GROUP`.
- `core/runner/drunner/remote_client/__init__.py` — `REMOTE_CLIENTS_ENTRY_POINT_GROUP`.
- `core/sys_operation/registry.py` — package scanning.

### 2.8 The documented missing piece

`harness/manifest/__init__.py` module docstring states the gap verbatim: a config-file→spec loader is planned and **intentionally not implemented**:

```
FUTURE: a config-file -> harness loader will read a declarative element list
(name + params per tool / rail / sub-agent), validate each params block
against the descriptor's input model, and emit the matching BuiltinToolSpec /
RailSpec / SubAgentSpec into a DeepAgentSpec.
Planned entry point (intentionally NOT implemented yet):
    def load_deep_agent_spec(config: dict[str, Any]) -> DeepAgentSpec: ...
```

**This is the single most important thing to build first.** The descriptor model already carries everything needed (`name` = spec `type`, `input_model_ref` for validation).

---

## 3. Current state — jiuwenswarm (where pluggability is weak)

### 3.1 The monoliths (hardcoded composition)

| File | Size | What is hardcoded |
|---|---|---|
| `server/runtime/agent_adapter/interface_deep.py` | ~897 KB, ~17,948 lines, ~500 methods | `JiuWenSwarmDeepAdapter`: rail list, tool build mapping, session leases, model routing, prompts, permissions, hot-reload |
| `server/runtime/agent_adapter/interface.py` | ~213 KB | `JiuWenSwarm` facade |
| `server/runtime/agent_adapter/interface_code.py` | ~125 KB | `JiuwenSwarmCodeAdapter` — **overrides `_build_agent_rails` (L1429) and `_get_tool_build_func` (L2312)** with another hardcoded list |
| `server/runtime/agent_adapter/team_helpers.py` | ~194 KB | team build helpers |
| `server/agent_ws_server.py` | ~592 KB | the agent server / WS surface |
| `common/config.py` | ~130 KB | untyped dict config with ~80 `update_*` mutators, no schema |

The clearest evidence is `_build_agent_rails` (`interface_deep.py:8964`): a hand-maintained `rail_infos = [_RailBuildInfo(...), ...]` list of ~18 rails plus ~8 optional blocks gated by `config_base.get("<feature>", {}).get("enabled")` — with **duplicated `task_description`/`tool_dedup` blocks** (a hand-maintenance bug symptom). Tools go through a per-adapter `_get_tool_build_func(tool_name, agent_id)`.

The comment in `resources/config.yaml` (L1608) admits the split: dynamic rails are a name list under `modes.code.rails`, but "固定 Rails … 已在代码中固定挂载，无需在此配置" (fixed rails are hardcoded in code).

### 3.2 Four separate, partial plugin systems

1. **openjiuwen manifest catalog** — `agents/swarm/providers/*` declare ~60 `@harness_element`s (rails/tools/subagents); `agents/swarm/registry.py::register_swarm_providers()` calls `register_from_catalog()`. This is the closest thing to a real plugin registry, but only for element kinds and only in-process.
2. **`jiuwenswarm/extensions/`** — `ExtensionLoader` discovers dirs with `extension.yaml`/`extension.py`, auto-installs `dependencies` via `uv pip`/`pip`, imports the module, calls `register_extensions(registry)`. `ExtensionRegistry` (singleton) registers: `agent_server_client`, `crypto_utility`, `third_agent`, `application_plugin`, plus generic callback events. This is an app-extension system, not a runtime capability kernel.
3. **Equipment / marketplace** — `server/runtime/extension_package_manager.py` (~123 KB) manages `agent_templates`, `agent_groups`, `plugins` packages under `resources/agent/workspace/plugins/`, with a **Hub** (`server/runtime/marketplace/{hub_client,hub_asset_installer,hub_package_downloader,hub_install_state,hub_asset_port,hub_asset_type_adapter}.py`) for remote install. Examples exist: `resources/agent/workspace/plugins/agent_groups/sample-expert-group/`.
4. **Adapter factory** — `agent_adapters.py::create_adapter(sdk, mode)` hardcodes `harness → interface_deep/interface_code`, `pi → NotImplementedError`.

### 3.3 Config is a blob, not a composition

`resources/config.yaml` is 1,823 lines across ~60 top-level sections (`models`, `react`, `tools`, `modes`, `channels`, `gateway`, `permissions`, `mcp`, `team`, `extensions`, `hooks`, …). `common/config.py` loads it as a plain dict, resolves env vars, and exposes typed getters + dozens of `update_*_in_config` writers with a file lock. There is no schema, no validation, and no notion of "rows that mount a capability". Composition that does exist (`modes.<mode>.rails/tools`) is name lists consumed by the hardcoded adapter.

### 3.4 The gap, stated plainly

| Concern | agent-core | jiuwenswarm | Target |
|---|---|---|---|
| Element registry (rails/tools/subagents) | yes | re-exports it | unified kernel registry |
| Serializable spec | yes | partial (code spec calls back into adapter) | full config→spec→build |
| Config→spec loader | **documented TODO** | no | yes |
| External discovery | entry points for rails/tools only | dir-based extensions only | entry points for all kinds |
| Lifecycle/effects/disposal | ad-hoc rollback | ad-hoc | first-class |
| Isolation/scoping | agent presets (later) | none | kernel `isolate` |
| Process composition | none (library) | hardcoded adapters | YAML host plane |
| Capability seams | named providers | named providers | Definition/Provider/Consumer |

---

## 4. Target architecture

### 4.1 The kernel ("jiuwen-kernel", new top-level package)

A small, dependency-free Python kernel modeled on Cordis. Nothing else in the system is allowed to import concrete implementations of a capability; everything goes through the container.

```python
# openjiuwen/kernel/context.py  (sketch)
class Context:
    def get(self, name: str) -> Any | None: ...          # global service read
    def require(self, name: str) -> Any: ...             # raises if absent
    def provide(self, name: str, value: Any, *, check=None) -> Disposer: ...
    def mount(self, plugin: Plugin, config: Mapping | None = None) -> Fiber: ...
    @contextmanager
    def isolate(self, name: str, label: str | None = None): ...   # subtree-scoped service realm
    @contextmanager
    def intercept(self, name: str, config: Mapping): ...          # subtree config override
    def effect(self, body: Callable[[], Disposer]) -> Disposer: ...  # contribution bookkeeping
    def on(self, event: str, handler: Callable, *, mode=...) -> Disposer: ...
    def emit/waterfall/serial/parallel(...): ...
```

Kernel rules (copied in spirit from deepseek's rules):
1. **A plugin is a lifecycle unit**, mounted by `ctx.mount`; it becomes active only when all `inject`ed services exist, and is unloaded/reloaded when they change. Implement as a `Fiber` with states `PENDING/ACTIVE/FAILED/DISPOSED`.
2. **Registrations are effects.** Every `provide`, `on`, registry `register`, and tool/rail registration returns a `Disposer`; the fiber tracks and runs them in reverse on unload.
3. **Scopes.** `isolate(name)` makes a service resolve in a per-subtree realm (this is what makes per-session agents possible); `intercept(name, config)` merges config down the tree.
4. **No concrete imports across a seam.** Consumers depend on the *definition* ABC, never a provider module.

`Plugin` shapes (all three, for ergonomics):

```python
@dataclass
class Plugin:
    name: str
    inject: tuple[str, ...] = ()
    provide: tuple[str, ...] = ()
    Config: type[BaseModel] | None = None
    def apply(self, ctx: Context, config): ...     # or a function plugin
```

Also support a bare function and a class with `apply`, mirroring Cordis's three shapes.

### 4.2 Composition as data, two planes

Same as deepseek's split:

**Host plane** (`$JIUWENSWARM_HOME/harness.yaml`, defaults from `jiuwenswarm/resources/harness.default.yaml`):
```yaml
- id: kernel
  type: jiuwenswarm.kernel
- id: llm
  type: jiuwenswarm.llm
- id: llm-deepseek
  type: agent-tools.llm.deepseek
  config: { apiKeyEnv: DEEPSEEK_API_KEY }
- id: session-store
  type: jiuwenswarm.session.jsonl
  config: { root: "{{home}}/sessions" }
- id: gateway
  type: jiuwenswarm.gateway
- id: tool-bash
  type: agent-tools.tool.bash
- id: fs
  type: agent-tools.fs.sandbox
- id: memory
  type: jiuwenswarm.memory
  enabled: "{{env.JIUWENSWARM_MEMORY != '0'}}"
```

**Session/agent plane** (`resources/agents/<preset>/agent.yaml`): per-agent tools, rails, prompt sections, subagents, model route, compaction — mounted under the agent's scope.

The loader (§4.5) applies **patch layers** exactly like deepseek: `bundle defaults → distribution → user home → --patch overlays`, last-write-wins per `id`, `insert` to add rows, `enabled`/`when` for conditional composition, `isolate`/`intercept` per row/group.

### 4.3 Capability seams to define (Definition / Provider / Consumer)

Promote each of these from "a dict in the adapter" to a seam. Consumers depend on the ABC; providers are plugins.

| Service name | Definition (ABC + `Service`) | Providers to ship | Consumers |
|---|---|---|---|
| `kernel` | container/events | `jiuwenswarm.kernel` | everyone |
| `llm` | `ModelClient` | `llm.deepseek`, `llm.openai`, `llm.anthropic`, `llm.pi-ai` | agent loop, title, compaction |
| `tools` | `ToolRegistry` + `ToolDefinition` | per-tool plugins | agent loop, UI |
| `rails` | `AgentRail` + provider registry | per-rail plugins | agent loop |
| `subagents` | `SubagentRegistry` | spawn/fork/codex/claudecode/remote | delegation tools |
| `session_store` | `SessionPersistence` | `session.jsonl`, `session.sqlite` | server, query |
| `memory` | `MemoryProvider` | lite/graph/external/vector | rails, tools |
| `retrieval` | `Retriever` + `VectorStore` | local/remote/disk | tools, RAG |
| `sandbox` | `SandboxProvider` | local/landlock/remote | fs, shell |
| `fs` | `FileSystem` | local/sandbox/remote | tools, rails |
| `shell` | `ShellExecutor` | bash/pwsh/persistent | tools, sys_operation |
| `sys_operation` | `SysOperation` | local/sandbox | tools |
| `permissions` | `PermissionEngine` | preset/auto | rails, tools |
| `channels` | `Channel` | web/tui/acp/im(platform) | gateway |
| `gateway` | `Gateway` | inproc/split/remote | app |
| `observability` | `Tracer` | otel/local/null | everywhere |
| `skills` | `SkillLibrary` | filesystem/remote | rails, tools |
| `mcp` | `McpClient` | stdio/http | tools |
| `marketplace` | `HubClient` | hub/local | equipment manager |
| `storage` | `KVStore` | json/sqlite/redis | projections, cache |
| `harness_provider` | `HarnessProvider` SPI | native/claudecode/codex/dsh | agent factory |
| `adapter` | `AgentAdapter` | harness/code/team/... | facade |

The pipeline *inside* the agent loop becomes waterfall events, not code edits (mirroring deepseek's `tools/pre-execute|execute|post-execute`, `agent/pre-step|request|request-error`):
- `tools/pre-execute` (allow/deny/ask), `tools/execute` (timeout/retry/metrics), `tools/post-execute` (truncate/spill), `tools/result`.
- `agent/pre-step`, `agent/request` (swap model/params), `agent/request-error` (recovery), `agent/turn-stopping`, `session/flush`.
- `system-prompt/assemble`.

This is the mechanism that removes feature-specific `if` blocks from `_build_agent_rails`.

### 4.4 Plugin protocol and manifest

A plugin ships a `plugin.toml` (or `pyproject.toml`) plus code, and declares **contributions** as entry points. One distribution can ship many plugins.

`plugin.toml`:
```toml
[plugin]
id = "agent-tools.web"
version = "0.3.1"
api = "1"                     # kernel plugin API version
description = "web search/fetch tools"
requires = ["tools>=1", "web>=1"]

# Declarative defaults; overridable by the composition YAML.
[[provides]]
service = "web"
[[contributes]]
kind = "tool"
name = "web_search"
factory = "agent_tools.web.tools:web_search"
[[contributes]]
kind = "tool"
name = "web_fetch"
factory = "agent_tools.web.tools:web_fetch"
```

`pyproject.toml` entry points (one group per contribution kind, so the loader never imports a plugin that isn't selected):
```toml
[project.entry-points."openjiuwen.plugins"]
web = "agent_tools.web:plugin"

[project.entry-points."openjiuwen.rail"]
my_rail = "agent_tools.rails:MyRail"
[project.entry-points."openjiuwen.tool"]
my_tool = "agent_tools.tools:my_tool"
```

The loader enumerates `importlib.metadata.entry_points(group="openjiuwen.plugins")` at boot, reads each manifest **without importing**, and imports only selected plugins. (Extends the existing `openjiuwen.rail`/`openjiuwen.tool` groups and the `extension.yaml` dir convention.)

The group names are **framework-level** (`openjiuwen.*`), because the loader belongs to `agent-core` and must serve any integrator. A product may add its own product-scoped group (`jiuwenswarm.plugins`) for plugins it ships itself; the same loader discovers it alongside the framework groups. `agent-tools` publishes only into the framework groups, so it is integrator-agnostic.

### 4.5 The loader + boot

New `openjiuwen/kernel/loader.py` (or `jiuwenswarm/kernel/loader.py`):

1. **Resolve composition**: read the host `harness.yaml`, apply bundle + home + overlay patch layers → a flat entry list.
2. **Validate** each row: known `type` (provider registered), `config` validated against the provider's `Config` Pydantic model, `inject` resolvable.
3. **Mount** rows into the kernel; activation is dependency-gated. Rows whose `enabled`/`when` is false are skipped.
4. **Sweep**: after mount settles, fail loud if any enabled row is `PENDING` (naming unmet deps) or `FAILED` — mirroring deepseek's `assertEntriesActivated` and agent-core's existing fail-loud philosophy.
5. **Agent plane**: per session, resolve the preset `agent.yaml`, mount under `ctx.isolate(...)`, and audit that no row leaked a service into the root realm.

Config→spec conversion (`load_deep_agent_spec`): implement the documented TODO. For each element row, look up the descriptor in the catalog, validate `params` against `input_model_ref`, and emit `RailSpec`/`BuiltinToolSpec`/`SubAgentSpec`. This is a ~100-line function once the kernel exists, and it deletes the `_build_agent_rails` list from jiuwenswarm.

### 4.6 Lifecycle, hot reload, disposal

- Every contribution is an effect; unloading a fiber unwinds its registrations in reverse.
- Config hot reload = re-read composition, diff, and `update()`/`restart()` only changed fibers (deepseek's model). Keep the existing `DeepAgentConfig.configure()` idea, but drive it from the composition diff rather than hand-written `_hot_reload_*`.
- A plugin that owns background work registers a disposer (`ctx.effect`) — the missing discipline behind today's leaked sessions/agents.

### 4.7 Discovery and resolution — how the loader knows what exists

Two distinct questions, two distinct mechanisms. Keep them separate; conflating them is what makes plugin systems confusing.

**Q1 — "what could I load?" = discovery.** Do not scan source trees and do not keep a central list of "all plugins". Python already publishes an index: `importlib.metadata.entry_points()`. A distribution advertises its plugins in its own `pyproject.toml`, so when `agent-tools` is installed (or added to `sys.path`), its plugins become visible **without the kernel knowing `agent-tools` exists by name**:

```toml
# agent-tools/pyproject.toml
[project.entry-points."openjiuwen.plugins"]
web       = "agent_tools.web:plugin"        # one entry point per plugin
feishu    = "agent_tools.channels.feishu:plugin"
otel      = "agent_tools.observability.otel:plugin"

# element-level contributions (extends the groups agent-core already reads)
[project.entry-points."openjiuwen.rail"]
budget_notice = "agent_tools.rails.budget_notice:BudgetNoticeRail"
[project.entry-points."openjiuwen.tool"]
web_fetch     = "agent_tools.tools.web:WebFetchTool"
```

Boot builds an in-memory **plugin index** from three sources, in this order:
1. **Built-in bundles** — the in-box `harness.default.yaml` rows (the current jiuwenswarm subsystems, once relocated).
2. **Installed distributions** — `entry_points(group="openjiuwen.plugins")`, plus the element groups `openjiuwen.rail` / `openjiuwen.tool` that `harness/manifest/meta_elements.py` already consumes.
3. **Local/workspace plugins** — `$JIUWENSWARM_HOME/plugins/*` and `<workspace>/plugins/*` directories with a `plugin.toml` / `extension.yaml`; this is the authoring path already implemented by `jiuwenswarm/extensions/loader.py` (which also auto-installs a plugin's declared `dependencies`).

The index entry is a **lazy reference** (`type` name → `module:attr`), built by reading metadata only — `.load()` is not called during discovery. That is what lets the loader decide before paying an import.

**Q2 — "which ones do I load, and for what?" = resolution.** Discovery produces the index; the *composition* selects from it. A row's `type` is a key into the index:

```yaml
- id: web
  type: agent-tools.web        # == the entry-point name (or its manifest id)
  config: { fetch: true }
```

Resolution: for each enabled row, look up `type` in the index → if absent, **fail loud** (never silently skip); validate `config` against the plugin's `Config` model; then `ctx.mount(ref.load(), config)`. Only selected rows are imported. A row addressed by `id` in a later patch layer can override an earlier row's `config` or set `enabled: false` — so "what loads" is data, not code.

**How element-level plugins resolve.** The element catalog is assembled the same way: built-in `@harness_element` declarations from `harness/manifest/{harness_elements,builtin_elements}.py` **plus** every entry point in `openjiuwen.rail` / `openjiuwen.tool` / (new) `openjiuwen.subagent`. Each descriptor records `name` (the spec `type`), and `load_deep_agent_spec` maps an `agent.yaml` element row `{type: core.budget_notice, params: …}` to a `RailSpec`/`BuiltinToolSpec`/`SubAgentSpec`, validating `params` against `input_model_ref`. So a rail contributed by `agent-tools` needs no core edit — it appears in the catalog when its distribution is installed, and a composition row activates it.

**Two levels, one rule.** A **plugin** provides services and registers elements; an **element** (rail/tool/subagent) is a contribution resolved by name. Both are discovered by entry point and both are selected by composition. The kernel never imports a plugin that no row selects, and the composition never names a module path — only a `type` that discovery resolved.

**Version and compatibility gating.** Each entry point's distribution metadata (`version`, `Requires-Dist`) plus a declared plugin `api = "1"` lets the kernel reject an incompatible major at discovery, before import. Agent/plugin plane separation is enforced at mount time: a per-session row that calls `provide()` for a process-global service is rejected (the `leakedServices` rule), so a plugin that is only meaningful globally must sit in the host plane.

**Marketplace path.** The Hub (`server/runtime/marketplace/*`) already downloads and installs equipment. Extend it to `pip install` a plugin wheel into the environment (or a managed plugins dir on `sys.path`); once installed, its entry points are discoverable on the next boot — no registry file to edit. Uninstall removes the entry points, and a composition row left behind then fails loud rather than silently losing the capability.

### 4.8 Who creates rails — the loop vs the composition

Today two places create rails the caller did not ask for:

1. **`openjiuwen/harness/factory.py::resolve_deep_agent_parts`** auto-adds default policy rails behind boolean flags, deduped by class (`_already_provided` = "add only if the caller didn't"): `SecurityRail` (`enable_security_rail`), `ModelAnomalyDetectionRail` (`enable_model_anomaly_detection_rail`), `TaskPlanningRail` (`enable_task_planning`), `SkillUseRail` (iff skills / `enable_skill_discovery`), `SubagentRail` (iff subagents), `ToolCallResilienceRail` (`enable_tool_resilience_rail`), plus an env-gated `RLOnlineRail`.
2. **`openjiuwen/harness/deep_agent.py`** auto-injects a `TaskCompletionRail` when `enable_task_loop` and no `TaskCompletionRail` is pending (L751-760), and `_setup_task_loop` builds the stop-condition evaluators (`_build_task_loop_evaluators`, L2304).

After the rewrite, split by responsibility:

**The loop plugin (single, swappable) owns loop-contract machinery — not behavior.**
`TaskLoopController` / `LoopCoordinator`, the turn/step state machine, and the stop-condition evaluators (`max_iterations`, `completion_timeout`, tokens) are loop *parameters* read from the spec, not composed rails. The loop **requires a completion policy to exist** and fails loud if the resolved composition supplies none — running a task loop with no stop condition is a bug.

**The composition owns every behavior rail.** `DeepAgent`/the factory no longer auto-adds `SecurityRail`, `ModelAnomalyDetectionRail`, `TaskPlanningRail`, `SkillUseRail`, `SubagentRail`, `ToolCallResilienceRail`, `BudgetNoticeRail`, or any jiuwenswarm rail. They become `rails:` rows in the preset; their default-on status lives in the **shipped default bundle/preset**, so the product behaves identically while a deployment can drop a row.

Rules that follow:

- **Flags become rows.** `enable_security_rail`, `enable_tool_resilience_rail`, `enable_task_planning`, `enable_model_anomaly_detection_rail` stop being factory booleans; presence of the row is the switch. `enable_task_loop` stays a loop parameter (it selects the loop mode), not a rail switch.
- **"Add if not provided" becomes fail-loud dedup.** Today a caller's own rail silently suppresses the default. In the new model, two rows resolving to the same rail type in one preset is a validation error — no accidental double mount.
- **Derived rails become explicit `when:` rows.** `SubagentRail` / `SkillUseRail` were conditional on data; the preset declares them explicitly (optionally `when: "{{ subagents }}"`). If the loader ever inserts a companion row, it logs exactly what it inserted.
- **Mandatory seams are enforced by the consumer, not by a default rail.** The permission engine and the tool registry are required services: a tool dispatch without the permission seam is rejected in the operation that makes the decision. Extra security rails stay optional rows. This keeps the safety default while letting composition vary.
- **`assert_all_active` + a required-capability check** at boot fail loud if the composition omits a loop essential (a stop condition, the tool registry, the model).

Before → after:

```python
# today — factory.py
default_rails = [
    (SecurityRail, enable_security_rail, lambda: SecurityRail()),
    (ModelAnomalyDetectionRail, enable_model_anomaly_detection_rail, lambda: ModelAnomalyDetectionRail()),
    (TaskPlanningRail, enable_task_planning, _make_task_planning_rail),
    (SkillUseRail, bool(skills) or config.enable_skill_discovery, _make_skill_rail),
    (SubagentRail, bool(effective_subagents), lambda: SubagentRail(...)),
    (ToolCallResilienceRail, config.enable_tool_resilience_rail, lambda: ToolCallResilienceRail()),
]
for rail_cls, should_add, make_rail in default_rails:
    if should_add and not _already_provided(rail_cls):
        all_rails.append(make_rail())
```

```yaml
# after — agent.yaml (default-on supplied by the shipped bundle/preset)
rails:
  - { type: agent-tools.rails.security }
  - { type: agent-tools.rails.model-anomaly-detection }
  - { type: agent-tools.rails.tool-call-resilience }
  - { type: agent-tools.rails.task-planning, enabled: "{{ config.task_planning }}" }
  - { type: agent-tools.rails.skill-use,    when: "{{ skills | length > 0 }}" }
  - { type: agent-tools.rails.subagent,     when: "{{ subagents | length > 0 }}" }
```

So the direct answer to "will `DeepAgent` create no rail by itself?": **it creates no *behavior* rail by itself.** It keeps only the loop-contract machinery. Everything else is a row, with the old defaults re-expressed as rows in the shipped default composition — and a boot-time check that the loop essentials are present.

---

## 5. The `agent-tools` project

A separate repository/distribution family where **integrator-agnostic** plugins live: reusable implementations of `agent-core` seams that any integrator — jiuwenswarm or otherwise — may install, and that `agent-core` itself never depends on. Two viable shapes; recommend **A**.

**A. One distribution, many plugin packages, entry-point discovered** (recommended).
```
agent-tools/
  pyproject.toml                # depends on jiuwenswarm-kernel only
  src/agent_tools/
    __init__.py
    llm/deepseek.py             # provider plugin
    fs/sandbox.py
    shell/bash.py
    tool/web.py, tool/bash.py, tool/skill.py, ...
    rails/budget_notice.py, rails/context_compressor.py, ...
    channels/web.py, channels/im/feishu.py, ...
    gateway/...
    observability/otel.py
    memory/vector.py
  plugin.toml files per subpackage (or a single registry module)
  tests/...
```
- `agent-tools` is nothing more than a **registration surface**: importing it (or scanning its entry points) registers providers/contributions. It must not be imported by the kernel directly; the loader discovers it via entry points.
- Versioning: each plugin declares `api = "1"` (kernel plugin API). The kernel refuses incompatible major versions. Multiple `agent-tools-*` distributions coexist (per provider family), sharing the entry-point group.

**B. Namespace packages** (`agent_tools.core`, `agent_tools.web`, …) with optional extras (`pip install agent-tools[web,feishu]`). This is how you avoid installing every optional dependency; the loader only mounts what the composition selects.

Trust/lifecycle:
- Third-party plugins are code, so treat install as privileged: entry points load in-process. For the model-authored/dynamic case, run host code in a sandbox and gate client contributions on approval (the deepseek `cordis-host-runner` model) — but be honest that a Python in-process sandbox is **not containment**; use subprocess/landlock for real isolation.
- The marketplace (`extension_package_manager` + Hub) already handles distribution/install/state; extend it to publish plugin distributions and to write their entry points, rather than inventing a new store.

### 5.1 Which current features move to `agent-tools`

A capability being a *plugin* and a capability *leaving its distribution* are two different questions. Almost everything becomes a plugin (mounted by a row, entry-point discoverable, swappable). Where its **code** lives is a separate decision:

1. **Is it a plugin?** — yes for almost everything; that is the point of the rewrite.
2. **Where does the code live?** — decided by the rule:

> A capability is a plugin. Its code moves to `agent-tools` only if it is **optional/extra or plausibly re-implemented by another deployment**. The **minimum functional set** stays in `agent-core` as **in-box plugins** (shipped in the `openjiuwen` distribution), so a bare install still works.

So the result is: `openjiuwen` = kernel + definitions **+ in-box default plugins**; `agent-tools` = optional/reusable plugins; `jiuwenswarm` = product composition + product-specific plugins. To avoid confusion the subsections are separated by **source repository**, and each "moved" table lists only the **optional/extra** implementations.

#### 5.1.0 Stays in `agent-core` as in-box default plugins (shipped, still rows)

Mounted by the default composition to give a working agent out of the box. They are plugins — rows, effects, swappable — but their code ships with `openjiuwen`, so an integrator who never installs `agent-tools` is fully served:

- loop + stop condition (`TaskCompletionRail`), `agent-loop`, prompt/system-prompt registry;
- **permission/security enforcement** (mandatory seam + a default policy plugin);
- `sys_operation` + local `fs` / `shell` providers;
- the basic coding tools (read / write / edit / glob / grep / bash);
- default task-planning rail, context assembly + basic compaction;
- subagent runtime + the delegation tool;
- one default OpenAI-compatible LLM provider adapter (no vendor key bundled).

An integrator extends this by adding/replacing rows; `agent-tools` is invisible unless they opt in. The two subsections below list only what leaves each repo for `agent-tools` — the optional/extra implementations.

#### 5.1.1 `agent-core` capabilities — **stay in-box; nothing moves**

> **Correction (settled):** nothing moves out of `agent-core`. Integrators will not install `agent-tools`, so any capability moved there would be unavailable to them. Every `agent-core` implementation stays in the `openjiuwen` distribution as an in-box plugin. `agent-tools` only receives capabilities migrated out of `jiuwenswarm` plus new/optional/third-party plugins and opt-in **alternative** implementations that override an in-box row through the same seam.

The earlier table below is retained only as the historical proposal; the final decision is: **no moves from `agent-core`.**

| Feature group | Current code (agent-core) | Target package |
|---|---|---|
| LLM provider adapters | `openjiuwen/core/foundation/llm/model_clients/*`, `openjiuwen/core/foundation/store/*` (vector), `openjiuwen/extensions/store/vector/*` | `agent-tools/llm/*`, `agent-tools/retrieval/vector/*` |
| Whole-harness providers | `openjiuwen/harness_providers/{native,claudecode,codex,dsh}/*` | `agent-tools/harness/*` |
| Rails | `openjiuwen/harness/rails/*` (agent_mode, budget_notice, heartbeat, lsp, mcp, model_anomaly_detection, personal_context, progressive_tool, sys_operation, task_completion, task_planning, tool_call_resilience, context_engineer/*, evolution/*, interrupt/*, memory/*, security/*, skills/*, subagent/*, `_multimodal`) | `agent-tools/rails/*` |
| Tools | `openjiuwen/harness/tools/*` (shell, web, worktree, subagent, skills, lsp_tool, browser_move, mobile_gui, multimodal, tool_discovery) | `agent-tools/tools/*` |
| Subagents + runtime | `openjiuwen/harness/subagents/*`, `openjiuwen/harness/subagent_runtime/*`, `openjiuwen/harness/rails/subagent/*`, `openjiuwen/harness/tools/subagent/*` | `agent-tools/subagents/*` |
| Memory | `openjiuwen/core/memory/*` (lite, graph, external, dreaming, migration, codec, manage) | `agent-tools/memory/*` |
| Retrieval / context | `openjiuwen/core/retrieval/*` (embedding, reranker, vector_store, query_rewriter), `openjiuwen/core/context_engine/*` | `agent-tools/{retrieval,context}/*` |
| FS / shell / sandbox / sysop | `openjiuwen/core/sys_operation/*`, `openjiuwen/extensions/sys_operation/sandbox/*` | `agent-tools/{fs,shell,sandbox,sysop}/*` |
| Security | `openjiuwen/core/security/guardrail/*`, `openjiuwen/harness/security/*` (tiered_policy, file_guard, shell_ast, permission_engine) | `agent-tools/security/*` |
| LSP | `openjiuwen/harness/lsp/*` | `agent-tools/lsp/*` |
| Skills | `openjiuwen/harness/skills/*`, `openjiuwen/harness/tools/skills/*` | `agent-tools/skill/*` |
| Session persistence / checkpoints / storage | `openjiuwen/core/session/checkpointer/*`, `openjiuwen/extensions/checkpointer/redis/*`, `openjiuwen/extensions/store/{db,kv}/*` | `agent-tools/{session,storage}/*` |
| Observability | `openjiuwen/harness/observability/*`, `openjiuwen/extensions/observability/*`, `openjiuwen/extensions/tracer_otel/*` | `agent-tools/observability/*` |
| Workflow / graph / rollout | `openjiuwen/core/graph/*`, `openjiuwen/core/workflow/*`, `openjiuwen/harness/multi_rollout/*` | `agent-tools/workflow/*` |
| Team runtime | `openjiuwen/core/multi_agent/*`, `openjiuwen/agent_teams/*` | `agent-tools/team/*` |
| Goal / KV-cache | `openjiuwen/harness/goal/*`, `openjiuwen/harness/kv_cache/*` | `agent-tools/{goal,kvcache}/*` |
| Optimisation / research subsystems (optional) | `openjiuwen/agent_evolving/*`, `openjiuwen/rsi/*`, `openjiuwen/auto_harness/*`, `openjiuwen/symphony/*`, `openjiuwen/dev_tools/*` | `agent-tools/{evolving,rsi,auto-harness,symphony,devtools}/*` |

#### 5.1.2 Moved out of `jiuwenswarm` → `agent-tools` (optional/extra)

| Feature group | Current code (jiuwenswarm) | Target package |
|---|---|---|
| Tools | `interface_deep.py::_get_tool_cards` (L10216) and `interface_code.py::_TOOL_BUILD_NAMES` (L402) + `_build_*_tool` (L2326-2452); `agents/harness/code/tools/*`; `agents/harness/common/tools/*`; `agents/swarm/providers/{tools,runtime_tools}.py` | `agent-tools/tools/*` |
| Rails | `interface_deep.py::_build_agent_rails` (L8964) + `_build_*_rail` (L8694-9332); `agents/harness/code/rails/*`; `agents/harness/work/rails/*`; `agents/swarm/providers/{builtin_rails,code_rails,member_rails,evolution_rails}.py` | `agent-tools/rails/*` |
| Subagents | `agents/swarm/providers/code_subagents.py`; `server/runtime/agent_adapter/statusline_setup_agent.py`; `code_agent_rail.py` | `agent-tools/subagents/*` |
| Memory | `agents/harness/common/memory/*`, `agents/harness/common/auto_memory/*`, `agents/harness/common/memory_rpc.py` | `agent-tools/memory/*` |
| Retrieval / context optimisation | `jiuwenswarm/tools/context_optimizer/*`, `jiuwenswarm/tools/recommendation_matrix/*` | `agent-tools/{context,recommendation}/*` |
| LLM provider registry | `common/model_vendor_registry.py`, `server/runtime/opencode_zen.py` | `agent-tools/llm/*` |
| MCP | `server/runtime/mcp/*`, `common/mcp_config.py` | `agent-tools/mcp/*` |
| Skills | `server/runtime/skill/*` (`skill_manager.py`), `agents/swarm/providers/skills.py` | `agent-tools/skill/*` |
| Channels | `jiuwenswarm/channels/{web,tui,desktop,ide,acp,process_cli,cli,browser}/*`; `gateway/channel_manager/im_platforms/{feishu,slack,dingtalk,wechat,wecom,telegram,whatsapp,discord,xiaoyi}/*`; `gateway/channel_manager/protocol/{a2a,acp,ssh}/*` | `agent-tools/channels/*` |
| Session store / projections | `server/runtime/session/*` | `agent-tools/session/*` |
| Observability | `jiuwenswarm/observability/*` (`store.py`, `sink.py`, `models.py`, `trajectory_insight/*`) | `agent-tools/observability/*` |
| Marketplace / Hub client | `server/runtime/marketplace/*` (hub_client, downloader, installer, models, port) | `agent-tools/marketplace/*` |
| Browser runtime | `common/playwright_mcp_runtime.py`, `agents/harness/common/browser_defaults.py` | `agent-tools/browser/*` |
| Service extensions | `jiuwenswarm/extensions/{loader,registry}.py`, `extension.yaml` convention | folded into `openjiuwen/kernel/loader` (not a separate package) |

#### 5.1.3 Stays in `agent-core` (kernel + definitions + the in-box defaults of §5.1.0)

- New `openjiuwen/kernel/*`.
- `openjiuwen/core/foundation/{llm,tool,store}` ABCs; `openjiuwen/core/single_agent/*`; `openjiuwen/core/runner/*`; `openjiuwen/core/session` interfaces; `openjiuwen/harness/manifest/*`; `openjiuwen/harness/schema/*`; `openjiuwen/harness_protocol/*`; `openjiuwen/core/scope`; `openjiuwen/harness/workspace/*`; `openjiuwen/core/common/*`.
- The **in-box default plugins** of §5.1.0 (loop, mandatory permission/security, local fs/shell, basic tools, default task planning/compaction, subagent runtime, one default provider adapter) — shipped in the `openjiuwen` distribution, so a bare install is a working agent.
- What remains is the **contract** that `agent-tools` providers implement and `jiuwenswarm` plugins consume, plus the defaults that make the contract usable immediately.

#### 5.1.4 Stays in `jiuwenswarm` (first-party product plugins; not moved to `agent-tools`)

- Agent adapters and modes: `server/runtime/agent_adapter/{interface,interface_deep,interface_code}.py`, `agent_adapters.py`, `agents/harness/{claw,code,team,work}/*`, `agents/swarm/{assembly,config_specs,context,agent_group}.py`, `common/mode_matrix.py`.
- Product policy: session leases, interrupt recovery, model routing defaults, permission presets/policy (`member_rails` team permission), prompt/persona composition.
- Product shell: `server/agent_ws_server.py`, `gateway/app_gateway.py`, `gateway/{message_handler,im_pipeline,routing,cron,heartbeat,health_check,hooks}/*`, `instance_manager/*`, `common/updater.py`, `common/version_source.py`, `common/startup_diagnostics.py`.
- Team/swarm orchestration: `agents/harness/team/*`, `agents/swarm/*`.
- Equipment manager + Hub product layer: `server/runtime/extension_package_manager.py`.
- Product-specific orchestrators: `agents/harness/common/{auto_harness,rsi,recommendation,plugins,eval_framework}/*`, `jiuwenswarm/symphony/*`.
- Config compatibility: `common/config.py` becomes a reader that maps legacy keys onto composition rows (it is not a capability).

#### Decision guidance

Moving a feature to `agent-tools` is not free: it pays a package boundary, a version, and an entry point. Move it only when a real second implementation is plausible (a second model vendor, a second sandbox, a second IM platform, a second memory backend). Keep first-party anything whose behavior *is* the product (how a session leases, how a permission is asked, how team members are orchestrated) — it can still be a plugin without leaving the product repo, which is what makes it swappable without making it generic.

### 5.2 What an integrator's API sees (worked example: `read_file`)

"Move it to `agent-tools`" sounds like it breaks an integrator's code. It does not, because an integrator's code binds to a **seam**, not to a provider's location. Take `read_file`, which currently exists as three distinct things:

| Thing | Where it is today | Does it move? |
|---|---|---|
| **Definition** — the `FileSystem.read_file(...)` contract | `openjiuwen/core/sys_operation/protocal/fs_protocal.py` | **No.** Definitions stay in `agent-core`. |
| **Provider** — the local bytes-on-disk implementation | `openjiuwen/core/sys_operation/local/fs_operation.py` | **No.** It is part of the in-box default set (§5.1.0). A *remote* FS provider would be optional (`agent-tools`). |
| **Model-facing tool** — the `read_file` tool the model calls | registered by `SysOperationRail` into the tool registry | **No.** Stays in the in-box default set. |

So for the specific question — "there is a `read_file` in agent-core, an integrator calls it, it moves to agent-tools, what now?" — **`read_file` is basic and does not move.** Nothing changes for the integrator or the model.

And for a capability that *does* move (say an optional `web_fetch`), there are still exactly two ways an integrator can "call" it, and neither is an import of a moved class:

1. **The model calls the tool at runtime.** The integrator composes it (a preset/tool row). If the row is present, the tool is registered and callable; if absent, the feature is absent — that is the intended swappability, not a breakage. The tool's name and schema (the model-facing contract) do not change when its implementation package moves.
2. **The integrator's Python code uses the service.** It resolves the seam — `ctx.require("fs")`, `ctx.require("web")`, or the `FileSystem`/`WebRuntime` protocol — and calls `read_file(...)`. The **seam name and method signatures live in `agent-core` and never move**, so this code is stable regardless of which provider is mounted underneath.

The only thing that actually relocates is a **concrete provider import** — e.g. `from openjiuwen.core.sys_operation.local.fs_operation import LocalFsOperation`. That is already a non-seam dependency: it names an implementation, not the contract. Integrators who follow the seam (`ctx.get("fs")`) never write it; the rare code that does is exactly the code a swappable design is supposed to force onto the seam.

Two support options when an optional provider does move:
- **Keep the default in-box.** The safe rule: anything in the minimum functional set stays in `agent-core`; only extras move. This is the decision applied to `read_file`.
- **Compatibility re-export.** For a symbol integrators genuinely import directly, `agent-core` can keep a thin re-export that loads the provider from the installed distribution and fails loud with an actionable message when it is absent. Use this sparingly; the seam is the intended interface.

In one line: **`"read_file"` does not "move" — only an optional provider's package can, and even then the integrator's contract (`ctx.fs` / the tool name) stays in `agent-core`.**

### 5.3 Correction: a provider *is* a dependency — the question is *which distribution carries it*

The sentence above must not be read as "providers are not dependencies". They are. There is no runtime magic that makes missing code work: **if the default composition mounts an fs provider, that provider's code must be installed.** The real question is which distribution carries each provider and whether its install is automatic.

| Provider | Lives in | Installed by |
|---|---|---|
| **Required defaults** — loop, mandatory permission/security, `fs.local`, `shell.bash`, basic coding tools, default task-planning/compaction, subagent runtime, one default LLM adapter | `openjiuwen` (in-box) | `pip install openjiuwen` |
| **Optional/extra** — web, vision/audio/video, extra LLM vendors, IM channels, extra memory/retrieval backends, observability exporters, workflow, team, marketplace, extra subagents | `agent-tools` | only when the composition selects them (and the deployment installs the wheel) |

The bare-install promise holds **only** because the required providers are in-box:

- `pip install openjiuwen`, no `agent-tools` → the default composition resolves all its `type`s → `read_file` works, the model can call it, and `ctx.require("fs")` succeeds.
- If a *required* provider were instead put in `agent-tools`, then `agent-tools` (or an equivalent defaults distribution) would be a **mandatory** dependency, and integrators would have to know about it. So do not put required providers in `agent-tools`. That is the whole reason for the §5.1.0 in-box set.

What "indirect" changes: nothing about the dependency. Two indirect path examples:
- `agent.run(...)` → the model calls `read_file` → the tool is registered by the fs/sysop rail, which needs the fs provider mounted. In-box → present.
- `ctx.require("fs").read_file(...)` in integrator code → resolves the service the composition mounted. In-box → present.

Failure modes are loud, never silent:
- A composition row names a `type` whose provider is not installed → the loader fails at boot ("unknown type", with the missing package).
- Integrator code calls a seam no mounted provider supplies → `ctx.require(...)` raises, or the optional service returns `None` and the caller handles it explicitly.
- A "compatibility re-export" only turns a missing distribution into a clearer `ImportError`; it does not make the code exist.

So the precise statement is: **`LocalFsOperation` is a dependency of the default bundle, not of `agent-tools`.** It ships in `openjiuwen` (or in a first-party defaults distribution that `openjiuwen` pulls in), and that is what lets a bare `agent-core` install be a working agent while `agent-tools` stays purely optional.

**Non-mandatory dependencies already exist in the repo as extras.** The rewrite does not invent the concept; it promotes the existing `[project.optional-dependencies]` pattern to first-class plugins. Current examples (from `agent-core/pyproject.toml` and `jiuwenswarm/pyproject.toml`):

| Capability | Non-mandatory dependency | Needed only when |
|---|---|---|
| Claude Code harness provider | `openjiuwen[claude]` → `claude-agent-sdk` | `provider: claudecode` |
| Codex harness provider | `openjiuwen[codex]` → `openai-codex` | `provider: codex` |
| DeepSeek Harness provider | `openjiuwen[dsh]` → `deepseek-harness-sdk` | `provider: dsh` |
| Redis checkpoint backend | `openjiuwen[redis]` → `redis` | a Redis checkpointer is configured |
| Vector stores | `openjiuwen[chromadb]`, `[pgvector]`, `[elasticsearch]`, `[gaussvector]` | that store is selected |
| Sandbox provider | `openjiuwen[sandbox]` → `agent-sandbox` | a sandboxed sys_operation is used |
| Message queue | `openjiuwen[pulsar]`, `[zmq]` | distributed transport is used |
| Observability | `openjiuwen[observability]` → `opentelemetry-*` | OTEL tracing is enabled |
| Mobile GUI | `openjiuwen[mobile-gui]` → `uiautomator2`, `pillow` | the mobile tool is mounted |
| IM channels | `lark-oapi`, `python-telegram-bot`, `discord.py`, `slack-bolt`, `dingtalk-stream`, `wecom-aibot-sdk` | that channel is mounted |
| Desktop / TUI shells | `jiuwenswarm[desktop]` → `pywebview`, `jiuwenswarm[tui]` → `workswarm-tui` | that surface is used |

The mechanism is already the one the rewrite generalizes: the capability is declared as an extra, its SDK is imported **lazily** (e.g. `harness_providers` invariant: "Vendor SDKs stay optional … `_open_session` loads it lazily and a missing SDK surfaces as `HarnessError`"), and selecting the capability without the extra installed fails loud with an actionable message. `agent-tools` is the extreme case: the entire distribution is non-mandatory, and each plugin inside it is selected by a composition row.

So: **mandatory = needed for the default composition to boot; non-mandatory = needed only when a capability is selected.** `read_file`'s local provider is mandatory (in-box); `claude-agent-sdk`, `redis`, `chromadb`, and everything in `agent-tools` are non-mandatory.

---

## 6. Startup sequence (concrete, end to end)

`jiuwenswarm-agentserver` / `jiuwenswarm-gateway` today start ~15 hardcoded subsystems. Target:

```
1. Parse CLI/--dotenv; resolve home & profile.            (as today)
2. Build the kernel Context and mount the loader plugin.
3. Discover plugins:
     - built-in bundles: jiuwenswarm.bundles.base (YAML patch)
     - installed distributions: entry_points("openjiuwen.plugins")
     - local dirs: $HOME/plugins/*, <workspace>/plugins/*   (extension.yaml)
4. Compose host plane: base bundles → user harness.yaml → --patch overlays.
5. Validate + mount every selected row; activation is service-gated.
6. assert_all_active(): fail loud listing unmet deps / failed fibers.
7. Serve: mount gateway + channels plugins; each session resolves its
   agent preset (agent.yaml) under an isolated scope and mounts it.
8. On config change: recompose, diff, reload changed fibers only.
9. On shutdown: dispose the root fiber; effects unwind in reverse.
```

Every step above already has a partial analogue in the repo (`extensions/loader.py`, `agents/swarm/registry.py`, `extension_package_manager.py`, `config.py` hot reload). The rewrite unifies them behind one loader and one kernel; it does not invent new I/O.

---

## 7. Worked example: converting one hardcoded rail

Today (`interface_deep.py:9037`):
```python
_RailBuildInfo("_budget_notice_rail", self._build_budget_notice_rail, {"config": config}),
```

Target:
1. `agent-tools/rails/budget_notice.py` declares the plugin:
   ```python
   @harness_element(kind=ElementKind.RAIL, name="core.budget_notice",
                    description="Edge-triggered task-loop budget warnings",
                    input_model=BudgetNoticeInput, builder=build_budget_notice)
   class BudgetNoticeRail(AgentRail): ...
   ```
   plus `plugin.toml` contribution `{kind="rail", name="core.budget_notice"}`.
2. The agent composition lists it:
   ```yaml
   - id: budget-notice
     type: core.budget_notice
     config: { round_ratio: 0.20, token_ratio: 0.15, time_ratio: 0.15 }
   ```
3. Delete the `_RailBuildInfo` entry and `_build_budget_notice_rail` from the adapter; the loader builds it from the spec.
4. Config hot reload is now a composition diff, not a `_hot_reload_rails` method.

Repeat for all ~26 rails and the tool build map. The adapter shrinks to the parts that are genuinely product-runtime (session leases, interrupt recovery) — which themselves become `session`/`interrupt` plugins.

### 7.1 Simulation: adding `feat/step-back-rail` **after** the rewrite

The existing feature is instructive because it is entirely a behavior rail using only existing seams. Today it is wired in four places inside `jiuwenswarm`, all of which disappear:

- `jiuwenswarm/agents/harness/common/rails/step_back_rail.py` — the rail itself (subclass of `openjiuwen.harness.rails.base.DeepAgentRail`; uses `AgentCallbackContext`, `ctx.session.get_state/update_state`, and the agent's `system_prompt_builder`; no private APIs).
- `interface_deep.py:8622` **and** `:8769` — two copies of `_build_step_back_rail`.
- `interface_deep.py:9114` **and** `:9181` — two copies of the `if _sb_cfg.get("enabled")` insert block in `_build_agent_rails`.
- `interface_deep.py:10038-10054` — a bespoke hot-reload block for `step_back`.
- `resources/config.yaml::step_back` — the top-level config section.

Assume the product is now pluggable. To add the feature as an external plugin:

**What you author (all in `agent-tools`, or a standalone `agent-tools-stepback` wheel):**

1. `src/agent_tools/rails/step_back.py` — the rail class, moved verbatim (it needs no core change: `DeepAgentRail`, `AgentCallbackContext`, session state, and `PromptSection` are all public seams).
2. Its config model:
   ```python
   class StepBackConfig(BaseModel):
       step_back_after: int = Field(3, ge=1)
   ```
3. The declaration (element entry point and/or kernel plugin contribution):
   ```python
   @harness_element(
       kind=ElementKind.RAIL,
       name="agent-tools.rails.step-back",
       description="Inject a rethink directive after consecutive shell failures",
       input_model=StepBackConfig,
       builder=lambda params, ctx: StepBackRail(**params.model_dump()),
   )
   class StepBackRail(DeepAgentRail): ...
   ```
4. `plugin.toml`:
   ```toml
   [plugin]
   id = "agent-tools.rails.step-back"
   version = "1.0.0"
   api = "1"
   provides = ["rail.step_back"]
   ```
5. `pyproject.toml` entry point:
   ```toml
   [project.entry-points."openjiuwen.rail"]
   step_back = "agent_tools.rails.step_back:StepBackRail"
   ```

**What you change in configuration (not code):** one row in the agent preset, plus (if the feature should be on by default for the shipped product) one row in the shipped default preset:

```yaml
rails:
  - type: agent-tools.rails.step-back
    config: { step_back_after: 3 }
    # enabled: "{{ env.JIUWENSWARM_STEP_BACK == '1' }}"   # if opt-in
```

**What you do NOT touch:**
- `interface_deep.py` (no `_build_*`, no `_build_agent_rails` block, no hot-reload block).
- `_build_step_back_rail` (deleted with the adapter lists).
- `resources/config.yaml::step_back` and `common/config.py` (the section is replaced by the row's `config`).
- Hot reload: it is now generic (recompose → diff → restart the changed fiber), so the bespoke `step_back` reload block is unnecessary.

**When a non-`agent-tools` change *would* be required:**
- **New seam:** only if the rail needed an event or service the kernel does not already expose. `StepBackRail` needs none. Adding a seam is an `agent-core` change (Definition + event vocabulary), not a `jiuwenswarm` one.
- **Product-policy rail:** if the behavior depended on jiuwenswarm internals (session leases, a product registry), it would belong in the `jiuwenswarm` first-party bundle rather than `agent-tools` — but it would still be a plugin/row, not an adapter branch.
- **Default-on in the shipped product:** making it on for everyone is a change to the shipped *preset file* (`resources/agents/.../agent.yaml` or the bundle), i.e. configuration/dependency, never adapter logic. Shipping it as a separate wheel also means the preset's package manifest lists it as a dependency.

So the answer for this feature: **three or four files in `agent-tools` + one composition row; zero lines of `jiuwenswarm` code.** The only possible `jiuwenswarm` touches are data: a dependency entry and a row in the shipped default preset.

### 7.2 Simulation: a cross-repo feature — `budget-notice-rail` (agent-core) + iteration-budget awareness (jiuwenswarm)

This one is deliberately harder than §7.1 because it **crosses the seam boundary**. It is the case where an `agent-core` change is genuinely required — and the rewrite does not remove that change, it localizes and versions it.

**Why it is complex.** `BudgetNoticeRail` (`openjiuwen/harness/rails/budget_notice_rail.py`) is *passive*: it never stops the loop. It reads the loop's real budgets and consumption and injects a "wind down" prompt section:

```python
coordinator = ctx.agent.loop_coordinator
used_by_kind = {
    "rounds":  coordinator.current_iteration,
    "tokens":  coordinator.token_usage,
    "seconds": coordinator.elapsed_seconds,
}
for budget in coordinator.budget_limits():   # derived from the evaluator chain
    ...
```

The **enforcement** is elsewhere: `LoopCoordinator.budget_limits()` derives `BudgetLimit`s from the stop-condition evaluator chain, and `TaskCompletionRail` builds those evaluators from `max_rounds` / `timeout_seconds` / `max_tokens`. So the feature has three parts with different lifetimes, and the rewrite makes the split explicit:

| Layer | What | Repo / artifact | Change type |
|---|---|---|---|
| **Contract (seam)** | Loop exposes its budget surface: `limits()` + used counters, derived from the evaluator chain | `agent-core` — a `loop.budget` service + `BudgetLimit` schema + evaluator `budget()` | code (one-time, versioned) |
| **Enforcement** | `TaskCompletionRail` params `max_rounds`/`timeout_seconds`/`max_tokens` build the evaluators | `agent-core` loop plugin | code (loop parameters) |
| **Behavior** | `BudgetNoticeRail` consumes the budget surface, contributes a prompt section | `agent-tools/rails/budget_notice.py` | code (plugin) |
| **Composition / coverage** | Which agents/subagents/members get the rail, with which thresholds; opt-in token/time budgets | `jiuwenswarm` presets + bundles (and the deployment's `harness.yaml`) | data only |

**The contract change (agent-core).** Promote the ad-hoc `ctx.agent.loop_coordinator` reach-through to a named seam so the rail depends on a contract, not an internal attribute:

```python
# openjiuwen/core/loop/budget.py (definition)
class BudgetLimit(BaseModel):
    kind: Literal["rounds", "tokens", "seconds"]
    limit: float

class LoopBudget(Service):            # provided by the loop plugin as `ctx.loop.budget`
    def limits(self) -> tuple[BudgetLimit, ...]: ...
    def used(self, kind: str) -> float: ...
```

The loop plugin provides `loop.budget` **derived from its evaluator chain** — it must not carry a second copy of the limits, or warnings drift from what actually stops the loop (the existing invariant). `TaskCompletionRail`'s `max_rounds`/`timeout_seconds`/`max_tokens` are loop parameters, read from the spec, not a separate config section.

**The behavior (agent-tools).**

```python
class BudgetNoticeConfig(BaseModel):
    enabled: bool = True
    round_remaining: int | None = None
    round_ratio: float = 0.20
    token_ratio: float = 0.15
    time_ratio: float = 0.15

class BudgetNoticeRail(DeepAgentRail):
    inject = ("loop.budget", "system_prompt")     # declares the seam dependency
    ...
    limits = ctx.require("loop.budget").limits()
```

```toml
# plugin.toml
[plugin]
id = "agent-tools.rails.budget-notice"
api = "1"
requires = ["loop.budget>=1", "system_prompt>=1"]
provides = ["rail.budget_notice"]
```

**The composition (jiuwenswarm — data, not code).**

```yaml
# resources/agents/standard/agent.yaml
loop:
  max_iterations: 100
  max_tokens: null            # opt-in: unset => no token evaluator, no token notice
  completion_timeout: null
rails:
  - type: agent-tools.rails.budget-notice
    config: { round_ratio: 0.20, token_ratio: 0.15, time_ratio: 0.15 }

subagents:
  - type: agent-tools.subagents.code
    loop: { max_iterations: 15 }
    # the sub-agent preset inherits the budget rows
```

**Team coverage becomes preset inheritance.** Today `agent_teams.AgentConfigurator._task_loop_budget_rail_specs` hard-codes the rails + `max_rounds` for every member. In the new world the member preset simply `extends:` the preset that already carries the budget rows, so **every member is covered with no code**; a member wanting different thresholds overrides the row in its preset.

**Versioning / compatibility.** `loop.budget` is public API. If the loop changes the budget surface, it bumps the seam version; a plugin declaring `requires = ["loop.budget>=1"]` is refused by the kernel at discovery if the installed loop is incompatible — before import.

**What the rewrite deletes (jiuwenswarm and agent-core):**
- `interface_deep.py::_build_budget_notice_rail`, `_build_task_completion_rail`, the `_RailBuildInfo` entries, `_ensure_subagent_budget_rails`, and the budget hot-reload block.
- `resources/config.yaml::react.budget_warning_*`, `react.max_tokens`, `react.timeout_seconds` → preset rows / loop params.
- `agent_teams.AgentConfigurator._task_loop_budget_rail_specs` → preset inheritance.

**Net, and the rule it demonstrates:** a feature that needs **no new seam** (StepBack, §7.1) stays `agent-tools`-only. A feature that **extends the contract** (loop budget surface) is a deliberate three-layer change — `agent-core` (one reviewed, versioned seam), `agent-tools` (the plugin), `jiuwenswarm` (data/coverage). The rewrite cannot make the core change disappear; it makes it *small, explicit, and versioned*, and makes everything product-specific data.

---

## 8. Migration plan: relocating existing code (strangler, product-identical)

The plan is a **relocation**, not a greenfield build. Every row below already exists and already does the work; the job is to move it behind the kernel one subsystem at a time, keeping the old call path alive until parity is proven by the existing test/snapshot suites.

### 8.1 Relocation inventory (existing code → target plugin)

jiuwenswarm:

| Existing code (file / symbol) | Target plugin package | Moves | Becomes a seam |
|---|---|---|---|
| `agent_adapter/interface_deep.py::_build_agent_rails` (L8964, ~18 fixed + 8 optional blocks) | `agent-tools/rails/*` + `agent.yaml` rows | each `_build_*_rail` method (L8694-9332) | rail registry |
| `agent_adapter/interface_deep.py::_get_tool_cards` (L10216) + `_build_*_tool` | `agent-tools/tools/*` | web_free_search/web_fetch/web_paid, vision, audio, video, image_gen, read_pdf, cron tools | tool registry |
| `agent_adapter/interface_code.py::_build_agent_rails` (L1429), `_TOOL_BUILD_NAMES` (L402), `_build_*_tool` (L2326-2452) | `agent-tools/rails/code/*`, `agent-tools/tools/*` | code-specific rails/tools | same |
| `agents/harness/code/rails/*` (code_agent_mode, code_confirm_interrupt, code_plan_approval, code_task_planning, `heartbeat/*`, `sdd/*`) | `agent-tools/rails/code/*` | files move wholesale | rail registry |
| `agents/harness/code/tools/*`, `agents/harness/common/tools/*` | `agent-tools/tools/*` | files move | tool registry |
| `agents/swarm/providers/*` (builtin_rails, code_rails, code_subagents, evolution_rails, member_rails, runtime_tools, skills, tools) | `agent-tools/*` | already `@harness_element`-declared — move + entry-point register | `agents/swarm/registry.py` shrinks to discovery |
| `server/runtime/skill/` (`skill_manager.py`, 362 KB) | `agent-tools/skill/*` | skill registry + manager | `skill` Definition |
| `server/runtime/mcp/` + `common/mcp_config.py` | `agent-tools/mcp/*` | MCP client + config | `mcp` Definition |
| `server/runtime/session/` | `agent-tools/session/*` | session store/controller | `session_store` Definition |
| `server/runtime/marketplace/*` (hub_client, hub_asset_installer, hub_package_downloader, hub_install_state, …) + `extension_package_manager.py` (123 KB) | `agent-tools/marketplace/*` | Hub + equipment manager | `marketplace` Definition |
| `gateway/channel_manager/{web,tui,ide,desktop,acp,im_platforms}/*` | `agent-tools/channels/*` | one plugin per channel | `channel` Definition |
| `gateway/{message_handler,im_pipeline,routing,cron,heartbeat,health_check,hooks}` | `agent-tools/gateway/*` | handlers/cron/heartbeat/health as plugins | `gateway` service |
| `server/agent_ws_server.py` (592 KB) | split into `agent-tools/server/*` handler plugins | WS surface rows | transport seam |
| `common/config.py` (130 KB, ~80 `update_*`) | composition + per-plugin `Config` models | getters → `Config` fields; writers → composition writes | compat reader mapping old keys → rows |
| `common/{utils,model_vendor_registry,mcp_config,playwright_mcp_runtime,kv_cache_affinity_config,reasoning_injector,tool_display}.py` | `agent-tools/*` or stay as util | model vendors → `llm` providers; browser runtime → browser plugin | util stays |
| `symphony/*` (`service.py` 50 KB, `build.py`, `llm.py`, `config.py`) | `agent-tools/symphony` | whole subsystem | `symphony` Definition |
| `observability/*` (`store.py` 116 KB, `sink.py`, `models.py`) | `agent-tools/observability/*` | tracer/sink providers | `observability` Definition |
| `extensions/*` (`ExtensionLoader`, `ExtensionRegistry`, `extension.yaml`) | folded into `openjiuwen/kernel/loader` | one discovery mechanism replaces two | delete the duplicate |
| `agents/harness/*/spec.py` (`CODE_RAIL_BUNDLE` / `CODE_TOOL_BUNDLE` / `CODE_SUBAGENT_BUNDLE`) | deleted | temporary shims that call the adapter | replaced by the loader |
| `interface_deep.py` session-lease / interrupt-recovery / model-router / permission regions | `agent-tools/session\|interrupt\|model\|permissions` | cohesive method groups | adapter becomes thin |

agent-core:

| Existing code | Target | Note |
|---|---|---|
| `harness/rails/*` (agent_mode, budget_notice, heartbeat, lsp, mcp, model_anomaly_detection, personal_context, progressive_tool, sys_operation, task_completion, task_planning, tool_call_resilience, context_engineer/*, evolution/*, interrupt/*, memory/*, security/*, skills/*, subagent/*) | provider plugins (e.g. `openjiuwen-harness-plugins`) | already declared in `harness/manifest/harness_elements.py`; keep ABCs in core, move implementations |
| `harness/tools/*`, `harness/subagents/*` | tool / subagent provider plugins | already declared as `@harness_element` |
| `harness_providers/{native,claudecode,codex,dsh}` | harness-provider plugins registered by entry point | replaces `factory.resolve_provider`'s `if/elif` |
| `harness/manifest/{harness_elements,builtin_elements}.py` | declarations move beside the plugins | `ensure_builtin_elements_registered` becomes entry-point discovery |

### 8.2 Phases (each names the code it relocates)

**Phase 0 — Kernel + loader skeleton (no behavior change).**
Build `openjiuwen/kernel` (context/services/plugin/fiber/effects/isolate) and `openjiuwen/kernel/loader` (composition YAML + patch layers + validation + fail-loud). Absorb `jiuwenswarm/extensions/{loader,registry}.py` into it as the single discovery mechanism. Ship one trivial plugin.
Acceptance: kernel loads a 2-row host composition and disposes cleanly; zero jiuwenswarm behavior change.

**Phase 1 — Config→spec loader + element providers (agent-core).**
Implement `load_deep_agent_spec(config)` (the documented TODO). Register every existing `@harness_element` as a kernel provider; make `RailSpec.build()` resolve through the kernel. Move `harness_providers` onto entry-point discovery.
Acceptance: a `DeepAgentSpec` produced purely from YAML equals the one `convert_code_config_to_deep_agent_spec` produces for the same inputs (golden test); adding a provider is a new row, not a `resolve_provider` edit.

**Phase 2 — Relocate jiuwenswarm's rail/tool composition.**
Move `_build_agent_rails` (both `interface_deep.py:8964` and `interface_code.py:1429`), `_get_tool_cards` (`interface_deep.py:10216`), and `_TOOL_BUILD_NAMES` (`interface_code.py:402`) into `agent.yaml` rows resolved by providers. During the transition the builders still live in the adapter and are called by thin provider shims (the `CODE_RAIL_BUNDLE` pattern in `agents/harness/code/spec.py`); then the lists and the shims are deleted.
Acceptance: code/agent/team modes mount identical rail/tool sets (compare live sets); existing unit + snapshot suites pass.

**Phase 3 — Break up `interface_deep.py`.**
Extract cohesive plugins from the adapter: `session` (leases), `model-router`, `permissions`, `interrupt`, `prompts`, `skills`, `budget`, `context`, `observability`. The adapter keeps only the `AgentAdapter` protocol implementation and delegates.
Acceptance: each extracted plugin has focused tests; the adapter shrinks by >50%; no behavior diff.

**Phase 4 — Relocate process subsystems.**
Move `common/config.py` to composition + `Config` models (with a compat reader), and externalize `gateway/*`, `server/runtime/{skill,mcp,session,marketplace}`, `common/*` vendors, `symphony/*`, `observability/*` behind Definition ABCs.
Acceptance: a composition with a subsystem removed boots (feature absent) rather than crashing; a replacement provider swaps with no consumer change.

**Phase 5 — `agent-tools` + discovery + marketplace.**
Publish `agent-tools` with entry points; extend the Hub (`server/runtime/marketplace/*`) to distribute it; add manifest/version gating and install/uninstall/hot-reload.
Acceptance: install a third-party `agent-tools-*` wheel, add one YAML row, restart → capability present; remove row/wheel → capability gone; no core edit.

**Phase 6 — Self-modification (optional, sandboxed).**
Model-authored plugins via a subprocess/sandboxed runtime, approval-gated. Do not do this in-process.

---

## 9. Risks and trade-offs (be honest)

1. **Plugin indirection costs performance and debuggability.** Deepseek measured ~3 ms / ~600 KB per session mount. Budget for it; keep hot paths (token streaming, tool dispatch) in-process with typed boundaries, not message-passing.
2. **A Python `node:vm` equivalent is not containment.** Any "dynamic plugin" story must use subprocess/landlock, not `exec` in the host.
3. **The seam triad adds packages/boilerplate.** Don't split preemptively: fold Definition+Consumer when there is one conceivable provider and one consumer (deepseek folds the LLM seam for exactly this reason). Split only when roles evolve independently.
4. **Over-configuration.** Not everything should be a row: security invariants and protocol constants stay fixed; deployment-varying choices are validated `Config` fields. Do not reproduce deepseek's own failure mode of duplicating composition across planes.
5. **Existing coupling is not purely technical.** `interface_deep.py` also encodes product policy (lease semantics, interrupt recovery). Extraction must preserve those contracts with tests, not just move code.
6. **Versioning.** A plugin API version and a session-format version are both needed; released session formats must have version-named successors, never in-place mutation (agent-core already follows this).
7. **Two planes must not collide.** A per-session plugin may not publish process-global services; the mount must audit and reject leaks (deepseek's `leakedServices`), and consumers outside a provider's realm must be resolved against the host plane deliberately.

---

## 10. deepseek concept → Python mapping (implementation cheat-sheet)

| deepseek-harness | Python (proposed) |
|---|---|
| `Context` proxy + `Service` | `kernel.Context` with `provide/get/require` |
| `ctx.plugin(plugin, cfg)` → `Fiber` | `ctx.mount(plugin, cfg) -> Fiber` |
| `inject` gating/reload | `Plugin.inject` + readiness check + reload on change |
| `ctx.effect()` / disposer list | `ctx.effect(...)` + `Disposer` stack per fiber |
| `isolate` / `intercept` | context managers creating scoped child contexts |
| `Events` emit/waterfall/serial/parallel | `ctx.emit/waterfall/serial/parallel` with `next()` |
| loader entry `{id,name,config,disabled,group,isolate}` | row `{id,type,config,enabled,when,group,isolate}` |
| bundle `cordis.patch.yml` + patch layers | `harness.default.yaml` + patch/overlay layers |
| profile `cordis.yml` | `harness.yaml` (host) + `agent.yaml` (session) |
| npm entry points / `dsh.bundle` | `pyproject` entry points + `plugin.toml` |
| typert host↔client RPC | Pydantic-typed RPC over the existing gateway |
| agent presets (`agent.cordis.yml`) | agent presets (`agent.yaml`) under `isolate` |
| `cordis-host-runner` dynamic packages | sandboxed subprocess plugin runtime (not v1) |

---

## 11. Development plan (bullets)

### End state
- `agent-core` = framework: **kernel + definitions/seams + loader + in-box default plugins**. Runs standalone; no jiuwenswarm, no agent-tools.
- `agent-tools` = **optional, integrator-agnostic** plugins (implementations migrated from both repos).
- `jiuwenswarm` = **one product**: composition (data) + product-specific first-party plugins.
- Dependency direction: `agent-core` ← `agent-tools` ← `jiuwenswarm` (and ← any integrator). `agent-core` imports neither; it only discovers plugins by entry point.

### Principles (apply to every step)
- **Plugin ≠ separate distribution.** Composition (rows) is orthogonal to where code lives.
- **Required defaults ship in-box** (mandatory deps); **optional capabilities** are extras/`agent-tools` (non-mandatory).
- **Generic contract → `agent-core`; generic optional implementation → `agent-tools`; product-specific → the product repo.**
- **Seams never move** (definitions, events, specs, protocols); providers may.
- **Loop essentials are mandatory seams** (stop condition; permission enforcement) — enforced by the consumer, fail loud if absent.
- **No hidden defaults:** `DeepAgent`/the factory create no behavior rails; defaults are rows in the shipped composition.
- **Discovery** uses framework groups `openjiuwen.*`; a product may add a product group (`jiuwenswarm.plugins`).
- **Fail loud** on unknown `type`, unmet dependency, or duplicate rail type — never silently degrade.

### Phase 0 — kernel + loader (agent-core, no behavior change)
- Build `openjiuwen/kernel`: `Context`/services, `Plugin`, `mount`, `inject`, `effect`/dispose, `isolate`/`intercept`, event bus (emit/waterfall/serial/parallel), fiber states.
- Build the loader: composition rows + patch layers + validation + fail-loud sweep + required-capability check.
- Fold `jiuwenswarm/extensions/{loader,registry}.py` into it (one discovery mechanism).
- **Gate:** a 2-row composition boots and disposes cleanly; standalone with no jiuwenswarm.

### Phase 1 — config→spec + catalog (agent-core)
- Implement `load_deep_agent_spec(config)` — the documented `FUTURE`.
- Register every existing `@harness_element` as a kernel provider; make `RailSpec`/`BuiltinToolSpec`/`SubAgentSpec` resolve through the kernel.
- **Gate:** a spec built purely from YAML equals the code-built spec (golden test); adding a provider is a row, not a `resolve_provider` edit.

### Phase 2 — in-box defaults (agent-core)
- Express the minimum functional set as in-box plugins: loop, stop condition, permission/security, local `fs`/`shell`, basic tools, default task planning + compaction, subagent runtime, one LLM adapter.
- Remove the factory's auto-default rails and `DeepAgent`'s auto `TaskCompletionRail`; defaults come from the shipped composition.
- **Gate:** `pip install openjiuwen` + default composition = a working agent; `read_file` works with no `agent-tools` installed.

### Phase 3 — `agent-tools` repo + migrate optional capabilities (from both repos)
- Create the distribution with framework entry-point groups (`openjiuwen.plugins`, `.rail`, `.tool`, `.subagent`).
- From `agent-core` (optional/extra): extra rails, extra tools, extra subagents, extra LLM vendors, memory/retrieval backends, fs/shell/sandbox variants, observability exporters, workflow, team runtime, harness providers (claudecode/codex/dsh).
- From `jiuwenswarm` (optional/extra): web/vision/audio/video/image/cron tools, code rails, memory, mcp, skill, channels, session store, marketplace client, observability, browser.
- **Gate:** install plugin + add row → capability present; remove → absent; zero core/jiuwenswarm code edits.

### Phase 4 — jiuwenswarm composition + strangling
- Author host `harness.yaml` + per-mode `resources/agents/<mode>/agent.yaml`, derived 1:1 from today's `config.yaml` + `_build_agent_rails` + `_get_tool_cards` + `_TOOL_BUILD_NAMES`.
- Delete the adapter rail/tool lists, bespoke hot-reload blocks, and the replaced `config.yaml` sections.
- Team/subagent coverage via **preset inheritance** (delete `AgentConfigurator._task_loop_budget_rail_specs` and friends).
- Keep first-party product plugins: adapters/modes, session leases, interrupt recovery, permission policy, prompt/persona composition, product shell, team/swarm orchestration, equipment manager, `auto_harness`/`rsi`/`recommendation`/`symphony`.
- **Gate:** live rail/tool/service sets identical to today; existing unit/snapshot suites pass; monoliths shrink ≥50%.

### Phase 5 — lifecycle, reload, versioning, distribution
- Effects/disposal everywhere; generic hot reload = recompose → diff → restart changed fibers.
- Plugin `api` version + `requires` gating; kernel refuses incompatible majors at discovery.
- Marketplace/Hub installs plugin wheels; uninstall removes entry points; a leftover row fails loud.
- **Gate:** no leaked agents/sessions; reload/rollback verified; install/uninstall round-trips.

### Phase 6 (optional) — self-modification
- Sandboxed **subprocess** plugin runtime, approval-gated; never in-process.

### Per-feature pattern (how future work is done)
- **No new seam → `agent-tools` only** (e.g. `step_back`): rail file + config model + entry point + one composition row.
- **New seam (contract) → three layers** (e.g. budget): `agent-core` adds the reviewed, versioned seam; `agent-tools` ships the plugin; `jiuwenswarm` supplies rows/coverage.
- **Product policy → `jiuwenswarm` bundle** (still a plugin/row, never an adapter branch).

### Risks to hold the line on
- Indirection cost; a Python in-process sandbox is **not** containment; over-configuration; keep security invariants fixed; version the seam and the session format; never move **required** providers out of `agent-core`.

### Order
`agent-core` kernel/definitions/loader → in-box defaults → `agent-tools` → `jiuwenswarm` composition + first-party plugins → discovery/versioning/marketplace → (optional) self-mod.

The end state: `jiuwenswarm` boots by mounting a composition, every capability is a row or an effect, and a new `agent-tools` plugin becomes available by `pip install` + one YAML line — no edit to the core.
