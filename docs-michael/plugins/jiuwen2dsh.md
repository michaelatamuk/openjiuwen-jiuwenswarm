# Jiuwen2DSH — Plugin-Kernel Design & Implementation Plan

Making JiuwenSwarm "like DeepSeek Harness": a Cordis-style plugin kernel that turns
models, rails, skills, and extension packages into first-class, hot-swappable
plugins behind one kernel, composed via config presets.

---

## Background

### What DeepSeek Harness (dsh) is

`dsh` (`github.com/deepseek-ai/deepseek-harness`) is a TypeScript agent **harness**
(not a model, not a self-optimizer) built on the **Cordis** meta-framework. Three
pillars:

1. **Everything is a plugin** — a Cordis kernel mounts/unmounts plugins and resolves
   deps; models, tools, skills, sessions, sandboxes, storage, loops, scheduling, and
   the UI are all swappable plugins composed via config (no source edits).
2. **Every run is traceable** — an append-only session log records everything the
   model sees (prompts, reasoning, tool calls/results, subagent scheduling, context
   injections). Trajectory view + resume/fork/search/replay read the same stream.
3. **Runtime modes** — Standard / Code / Minimal / Creator are just plugin presets.

### What this repo already has

JiuwenSwarm is a **Python** platform on the external `openjiuwen` agent core. The
"harness" runtime lives in `openjiuwen`; this repo wraps it. The same *shape* as DSH
already exists, but in **separate silos**:

- Swappable **models** → `jiuwenswarm/common/model_vendor_registry.py` (`VendorPreset`, OpenAI-compatible vendors, endpoint profiles)
- **Rails** → `jiuwenswarm/agents/harness/common/plugins/rail_manager.py` (`RailManager` singleton: `import_extension`, `hot_reload_rail`, `register_rail`/`unregister_rail`)
- **Skills** → `SkillManager` / `openjiuwen.harness.rails.skills.skill_use_rail.SkillUseRail`
- **Extension packages** → `AutoHarnessService.activate_package` → `agent.load_harness_config`; RSI installer via `rsi/harness_activation.py` + `rsi/plugin_catalog.py`
- **Plugin catalog** → `jiuwenswarm/server/runtime/extension_package_manager.py` (`manifest.json`, marketplace registry, `import/install/uninstall_plugin_package`, `upsert_plugin_marketplace_entry`)
- **Traceability** → `observability/TrajectoryStore` + vendored DSH Trajectory UI (`features/trajectory/`)
- **Self-optimization** → Auto-Harness / RSI (`agents/harness/common/rsi/`)

**The gap is architectural, not missing features:** no single kernel with one
lifecycle, one dependency graph, one service registry, and config-driven
composition. Existing manifests declare no dependencies (verified: no
`depends`/`requires` in the plugin-creator schema).

---

## Decisions

1. **Kernel location:** in this repo, wrapping `openjiuwen` (which stays a dependency).
2. **Kernel depth (v1):** uniform plugin interface + config composition + dependency
   graph + service registry. No event bus (v2+).
3. **Preset format:** a new minimal kernel-level `preset.yaml` that *selects*
   existing artifacts by id. Harness-package configs remain the payload format for
   extension content — the preset is a selector, not a competing package format.
   (Mirrors DSH: a mode is a selection of plugins.)
4. **Authority migration:** incremental. Kernel runs in *shadow mode* per provider
   first; each provider flips to kernel-authoritative only when its gate passes
   (tests green + no state drift). Existing flows (`RailManager.toggle_extension`,
   `AutoHarnessService.activate_package`, RSI install) keep working throughout.
5. **UI:** deferred to v2. v1 ships kernel + providers + presets; visibility via
   logs/status API only.

---

## Goal & scope

**Goal:** a Cordis-style plugin kernel that makes models, rails, skills, and
extension packages first-class plugins — one lifecycle (mount/unmount/enable/disable),
one dependency graph, one service registry — composed via config presets.

**In scope (v1):** the five existing domains — catalog plugin packages, rails,
skills, harness extension packages, model configs.

**Out of scope (v2+):** sessions, sandboxes, storage, loops, scheduling, UI as
plugins; event bus; multi-process kernel.

---

## Architecture

```
jiuwenswarm/agents/harness/common/plugin_kernel/
├── __init__.py
├── manifest.py      # parse/validate manifest.json + preset.yaml; backward-compatible
├── graph.py         # dependency graph: topo-sort, cycle detection, provides/depends matching
├── services.py      # ServiceRegistry: named services registered/consumed by plugins
├── state.py         # authoritative kernel state (mounted, enabled, versions); persistence
├── kernel.py        # PluginKernel: load_preset, mount, unmount, enable, disable, status
├── preset.py        # preset.yaml loader + validation
└── providers/
    ├── __init__.py          # ProviderRegistry, provider base class
    ├── catalog_provider.py  # plugin packages via extension_package_manager catalog
    ├── rail_provider.py     # wraps RailManager (get_rail_manager)
    ├── skill_provider.py    # wraps SkillManager / SkillUseRail
    ├── harness_pkg_provider.py  # wraps AutoHarnessService.activate_package + agent.load_harness_config
    └── model_provider.py    # composes per-session model_client_config from vendor registry
```

**Data flow (session build):** `JiuWenSwarmDeepAdapter` resolves active preset →
`PluginKernel.load_preset(preset)` → resolve plugin ids across providers →
topo-sort by `depends`/`provides` → mount in order (provider-specific calls) →
inject services → session runs with the composed harness. Hot-swap path:
`kernel.disable/enable` → provider delegates to existing hot-swap primitives
(rails: `register_rail`/`unregister_rail`).

**Key constraint:** the kernel is pure Python with **no openjiuwen imports** in
`kernel.py`/`graph.py`/`manifest.py`/`services.py`. All openjiuwen contact lives
inside providers, keeping the core unit-testable standalone.

---

## Detailed design

### Manifest extension (backward-compatible)

Existing `manifest.json` (kebab-case id, `package_type: "plugin"`) gains optional
fields:

```json
{
  "id": "my-rail-pack",
  "package_type": "plugin",
  "provides": ["rail:my-rail"],
  "depends": ["skill:pdf-tools"],
  "services": [{ "name": "my.fetcher", "optional": false }]
}
```

- `provides`/`depends` entries are `kind:name` strings; kinds: `package`, `rail`,
  `skill`, `model`, `service`.
- Old manifests without these fields parse fine and behave as dep-free plugins.
- Kernel rejects unknown kinds and duplicate `provides` across installed plugins.

### Kernel API

```python
class PluginKernel:
    def load_preset(self, preset_path: Path) -> MountPlan      # resolve+validate+topo-sort, no side effects
    def apply(self, plan: MountPlan) -> MountResult            # mount/unmount diff vs current state
    def mount(self, plugin_id: str) -> MountedPlugin
    def unmount(self, plugin_id: str, *, force_dependents: bool = False) -> None
    def enable(self, plugin_id: str) / disable(self, plugin_id: str)
    def status(self) -> KernelStatus                            # mounted/enabled/versions/errors per provider
```

- `load_preset` is pure: produces a `MountPlan` (ordered mounts, ordered unmounts for
  removed plugins, conflicts). `apply` executes via providers.
- **Unmount with dependents** fails with an explicit error listing dependents unless
  forced (then reverse-topo-order unmount).
- Cycle detection reports the cycle path, e.g. `a -> b -> c -> a`.
- Mount/unmount are transactional per plugin: provider returns an `undo` callable
  (pattern proven by `register_harness_plugin` in `rsi/plugin_catalog.py:90`); a
  failure mid-plan rolls back in reverse order.

### Service registry

- Plugins register named services (any Python object) at mount; dependents receive
  them via provider context.
- Lookup by `name`; `optional: true|false` — a required consumer fails mount if the
  service is absent; an optional consumer gets `None`.
- Registry is per-kernel-instance (process-scoped), not persisted.

### Providers

| Provider | Wraps | Mount = | Unmount = | Authority gate |
|---|---|---|---|---|
| `catalog_provider` | `extension_package_manager` catalog (`show/import/install/uninstall_plugin_package`) | catalog install + allowed | uninstall | shadow → flip when marketplace state matches kernel state across 2 consecutive sessions |
| `rail_provider` | `RailManager` singleton | `import_extension` + `hot_reload_rail(name, True)` | `hot_reload_rail(name, False)` | shadow → flip in Phase 3 |
| `skill_provider` | `SkillManager` | ensure installed + enabled in skill config | disable | stays shadow in v1 (skills compose at session build) |
| `harness_pkg_provider` | `AutoHarnessService.activate_package` → `agent.load_harness_config` | `activate_package` (stacking preserved) | deactivate/remove from `active_package_ids` | stays shadow in v1 |
| `model_provider` | `model_vendor_registry.VendorPreset` + session `model_client_config` | resolve vendor preset → emit model config into session build inputs | n/a (config-composed, not hot) | n/a |

Provider contract:

```python
class PluginProvider(Protocol):
    kind: str
    def discover(self) -> list[PluginDescriptor]          # what exists in this domain
    def mount(self, desc: PluginDescriptor, ctx: MountContext) -> Callable[[], None]  # returns undo
    def unmount(self, desc: PluginDescriptor) -> None
    def enable(self, desc) / disable(self, desc) -> None  # optional (hot domains only)
```

### Preset format

```yaml
# presets/standard.yaml
id: standard
model: { vendor: deepseek, model: deepseek-v4-pro }
plugins:
  - package:pdf-tools          # kind:id — resolved via providers
  - rail:swarm.multimodal_image
  - skill:ppt-creation
  - harness:my-team-extension
overrides:
  rail:my-rail: { priority: 10 }
```

- Unknown ids → hard error at `load_preset` listing all unresolved ids (fail-closed,
  no silent skips).
- Presets live under a `presets/` root next to the agent workspace; the adapter's
  session-build path reads the *active* preset pointer from kernel state.
- **Backward compatibility:** default preset = current behavior (empty plugin list,
  model from existing config). No preset configured → behavior identical to today.

---

## Implementation phases

### Phase 0 — Seam verification (read-only spike, ~0.5 day)
Pin exact behaviors against live code:
- `load_harness_config` stacking semantics
- catalog `install`/`uninstall` idempotency
- `hot_reload_rail` on a live agent instance
- where session-build reads model config in `JiuWenSwarmDeepAdapter`
  (`_resolve_model_for_request` / `_apply_model_to_react_agent`)

Deliverable: seam notes appended to this doc; any design adjustment surfaced *before*
Phase 1 code.

### Phase 1 — Kernel core (~2-3 days)
`manifest.py`, `graph.py`, `services.py`, `state.py`, `kernel.py`, `preset.py` — no
providers yet; a `FakeProvider` drives tests.

Tests:
- topo-sort ordering
- cycle detection message
- provides/depends matching incl. unknown-kind rejection
- transactional rollback (provider mount fails mid-plan → reverse undo called)
- enable/disable
- preset validation (unknown id, missing model, empty preset)
- old-manifest compatibility

### Phase 2 — Catalog + rail providers (~2-3 days, shadow mode)
Wire `catalog_provider` and `rail_provider`; kernel `status()` shows kernel view and
provider-native view side-by-side (shadow comparison helper).

Integration test: install a fixture plugin package through kernel; mount/unmount a
fixture rail through kernel against a fake agent object exposing
`register_rail`/`unregister_rail`.

Gate: marketplace JSON and RailManager JSON show no drift vs kernel state across the
test suite.

### Phase 3 — Skill + harness-package + model providers; presets go live (~3-4 days)
Remaining providers; `load_preset` consumed at session build in
`JiuWenSwarmDeepAdapter` (single integration point, mirroring where
`_resolve_model_for_request` runs today).

- Flip rail + catalog authority per gates; existing UI flows (`toggle_extension`,
  `activate_package`) re-routed through kernel internally — external behavior unchanged.
- Integration test: a preset mounting model + rail + skill + package end-to-end on a
  fake adapter; default no-preset path byte-identical to pre-kernel behavior
  (regression test).

### Phase 4 — v2 (deferred)
Settings/TUI panel listing mounted plugins; sessions/sandboxes/storage/loops as
plugins; event bus if a real cross-plugin need emerges.

---

## Testing & verification

- **Unit** (kernel core, no I/O): pytest under `tests/unit_tests/`, following existing
  conventions (e.g. `test_model_vendor_registry.py`). Target: graph/manifest/kernel
  ≥ 95% line coverage.
- **Provider tests:** fakes for agent instance / catalog; no network, no real
  openjiuwen import in the unit tier.
- **Integration:** one test per provider against the real wrapped manager; one
  end-to-end preset test in the `tests/unit_tests/agentserver/` style.
- **Regression:** no-preset default path unchanged; existing suites (e.g.
  `tests/unit_tests/rsi/`, team-helper-style tests) pass untouched.
- **Lint gate:** `ruff check` + `ruff format --check` on changed files only (repo PR convention).

---

## Risks

| Risk | Mitigation |
|---|---|
| Dual state (RailManager JSON / marketplace JSON / `active_package_ids`) | Shadow mode + per-provider authority gates + drift-detection test helper |
| openjiuwen unmount incompleteness (rails proven; packages unknown) | Phase 0 spike verifies; v1 hot-swap limited to rails, packages re-compose at session build |
| `interface_deep.py` is a 15k-line hotspot — integration risk | Single narrow integration point at session build; no other edits to that file |
| Preset references stale ids after uninstall | Fail-closed at `load_preset` with full unresolved-id list; status API exposes dangling refs |

---

## Acceptance criteria

1. A preset YAML composes model + rail + skill + package in dependency order;
   unmounting a dependency fails with its dependents listed.
2. Cycle in manifests → clear cycle-path error at load, no partial mounts.
3. Default (no-preset) behavior identical to today — all existing tests pass.
4. Kernel state is the single queryable source (`status()`) for all five domains once
   authority flips (rails + catalog in v1).

---

## Key source references

- `jiuwenswarm/common/model_vendor_registry.py` — `VendorPreset`, vendor `deepseek` (L320-335)
- `jiuwenswarm/agents/harness/common/plugins/rail_manager.py` — `RailManager` (`hot_reload_rail` L362-405)
- `jiuwenswarm/agents/harness/common/auto_harness/service.py` — `activate_package` (L2466-2568)
- `jiuwenswarm/agents/harness/common/rsi/harness_activation.py` — `_install_unlocked` (L708-883)
- `jiuwenswarm/agents/harness/common/rsi/plugin_catalog.py` — `register_harness_plugin` (L90-131)
- `jiuwenswarm/server/runtime/extension_package_manager.py` — catalog + `upsert_plugin_marketplace_entry` (L871-882)
- `jiuwenswarm/server/runtime/agent_adapter/agent_adapters.py` — `create_adapter` (L128-159)
- `jiuwenswarm/server/runtime/agent_adapter/interface_deep.py` — `JiuWenSwarmDeepAdapter` session-build path
