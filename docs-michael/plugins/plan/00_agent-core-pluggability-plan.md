# agent-core pluggability — development plan

First in the sequence: **this** → `01_agent-tools-pluggability-plan.md` → `02_jiuwenswarm-pluggability-plan.md`.

agent-tools and jiuwenswarm appear in this document only as interfaces (what agent-core must expose or consume). They are not work items here.

---

## 1. Scope and non-goals

**Scope**
- Turn `openjiuwen` into a framework: a kernel with lifecycle, named seams (definitions), a composition loader, and a default composition.
- **Convert every capability agent-core ships today into an in-box plugin** (row-mounted, discoverable, with effects). Nothing is removed from the distribution; optional heavy/vendor dependencies stay declared as extras.
- Keep agent-core usable standalone by integrators with **no jiuwenswarm and no agent-tools**; a bare `pip install openjiuwen` is a working agent.
- Own the contract (seams, spec format, plugin API, composition format) that plugins and products build on.

**Non-goals**
- **No code moves out of agent-core.** Integrators do not install agent-tools, so nothing may depend on it. agent-tools receives only non-core implementations.
- Not product composition or product policy (jiuwenswarm).
- Not the optional/external plugin ecosystem (agent-tools).
- Not model-authored/dynamic plugins (deferred; sandboxed subprocess only).
- Not making security invariants or protocol constants configurable.

**Non-negotiable invariants**
- agent-core never imports agent-tools or any product; it only discovers plugins by entry-point group.
- Security enforcement and the stop condition are mandatory seams enforced by the consumer, not optional rows.
- No hidden defaults: the agent/factory creates no behavior rails; behavior comes from the composition.

---

## 2. Baseline assets to build on

- **Manifest catalog** — `harness/manifest/catalog.py` (`@harness_element`), `models.py` (`ElementKind`, descriptor), `list_elements()`.
- **Provider registries** — `harness/schema/deep_agent_spec.py`: `register_rail_provider` / `register_tool_provider` / `register_subagent_provider`; `RailSpec` / `BuiltinToolSpec` / `SubAgentSpec`.
- **Serializable spec** — `DeepAgentSpec` (`build()` / `resolve_parts()`).
- **Extension package format** — `harness/resources/extension_loader.py` + `schema/extension_spec.py` (`PluginSpec`, `AgentTemplateSpec`).
- **Meta-providers** — `harness/manifest/meta_elements.py`: load rail/tool from file / dotted import / entry point (`openjiuwen.rail`, `openjiuwen.tool`).
- **Harness provider SPI** — `harness_protocol/` + `harness_providers/` (`native`, `native_v2`, `claudecode`, `codex`, `dsh`).
- **Existing entry-point seams** — `core/foundation/store` (`openjiuwen.vector_stores`), `core/runner/drunner/{server_adapter,remote_client}`.
- **Documented gap** — `harness/manifest/__init__.py` states the config→spec loader is a deliberate `FUTURE`.

The plan **promotes** these into one kernel-driven system; it does not greenfield.

---

## 3. Target architecture

- **Kernel** (`openjiuwen/kernel`) — context/services, plugins, DI by name (`inject`), effects/disposal, `isolate`/`intercept`, event bus (emit/waterfall/serial/parallel), fiber lifecycle.
- **Loader** (`openjiuwen/kernel/loader`) — composition rows, patch layers, validation, fail-loud sweep, required-capability check, entry-point discovery.
- **Seams** — definition packages (service/ABC + vocabulary + events + version). A definition imports no provider.
- **In-box plugins** — every current implementation, mounted by rows, still shipped in `openjiuwen`.
- **Default composition** — the minimum functional set that makes a bare install a working agent.

---

## 4. Workstreams

### W1 — Kernel
- Tasks: `Context` (`get`/`require`/`provide`), `Plugin` (function/class/object), `mount`, `inject` gating + reload, `effect`/`Disposer`, `isolate`/`intercept`, event bus with four modes, `Fiber` states (`PENDING/LOADING/ACTIVE/FAILED/DISPOSED`).
- Deliverable: `openjiuwen/kernel/*` + unit tests.
- Gate: activation gating, effect unwinding, isolation, and waterfall delegation covered; no dependency on `harness`.

### W2 — Loader and composition format
- Tasks: row model `{id, type, config, enabled, disabled, when, inject, group, isolate, intercept, insert}`; patch layers (bundle → distribution → user → overlays); `type` validation via the plugin index; duplicate detection; `assert_all_active`; required-capability check; expression evaluation (`{{ env|home|cwd|platform|config }}`) restricted to `config/enabled/disabled/when`.
- Deliverable: `openjiuwen/kernel/loader/*` + composition schema.
- Gate: unknown `type`, unmet dependency, duplicate rail type, and missing required capability each fail loud; patch precedence tested.

### W3 — Seams (definitions)
- Tasks: define/keep the seam set — `llm`, `tools`, `rails`, `subagents`, `session_store`, `memory`, `retrieval`, `fs`, `shell`, `sys_operation`, `sandbox`, `permissions`, `prompt`, `mcp`, `skill`, `observability`, `workflow`, `storage`, `harness_provider`, `adapter`, `loop.budget`. Each = service/ABC + vocabulary + events + version.
- Deliverable: definition packages.
- Gate: a definition imports no provider; a conformance test defines each seam's provider contract.

### W4 — Config→spec and catalog
- Tasks: implement `load_deep_agent_spec(config)` (the documented `FUTURE`); assemble the element catalog from built-in `@harness_element` + entry points (`openjiuwen.rail`/`.tool`/`.subagent`); register catalog → kernel providers.
- Deliverable: one loader path from YAML to live agent.
- Gate: YAML-built `DeepAgentSpec` equals the code-built spec for identical inputs (golden); adding an element is a declaration + entry point.

### W5 — Convert existing implementations to in-box plugins
- Tasks: re-express **every capability agent-core ships today** as an in-box plugin: all rails, tools, subagents, harness providers, memory/retrieval backends, fs/shell/sandbox, observability, team, workflow, extensions. Heavy/vendor dependencies stay declared as extras. Ship the default composition built from the minimum functional set (loop, stop condition, permission/security, local `fs`/`shell`, basic coding tools, default task-planning/compaction, subagent runtime + delegation tool, one OpenAI-compatible LLM adapter).
- Deliverable: the in-box plugin set + default composition.
- Gate: every current capability is a plugin; a bare install works; nothing was removed from the distribution.

### W6 — Loop and rail ownership
- Tasks: remove factory auto-default rails and the agent's auto `TaskCompletionRail`; move all behavior rails to composition rows; keep only loop-contract machinery in the `agent-loop` plugin (controller/coordinator, stop-condition evaluators); enforce a required stop condition.
- Deliverable: `agent-loop` plugin + the default rails rows.
- Gate: rails come exclusively from the spec; no hidden defaults; a missing stop condition fails loud.

### W7 — Lifecycle, hot reload, disposal
- Tasks: every contribution is an effect; generic reload = recompose → diff → restart changed fibers; rollback on failure; agent/session disposal reclaims resources.
- Deliverable: reload/dispose primitives.
- Gate: no leaked fibers/agents; reload + rollback tests; teardown returns resources.

### W8 — Session format and versioning
- Tasks: versioned session formats with named successors; cross-version readers; migration of existing generations; document authority.
- Deliverable: format catalog + migration packages.
- Gate: released generations readable; no in-place mutation; migration tests.

### W9 — Config system and secrets
- Tasks: replace ad-hoc getters/env resolution with typed per-plugin `Config` models; env/secret resolution; settings persistence; a compatibility reader mapping legacy config keys onto rows during transition.
- Deliverable: config schema + migration reader.
- Gate: a legacy config boots via the reader; a new config validates against per-plugin models.

### W10 — Packaging, release, compatibility
- Tasks: extras for optional/heavy dependencies; distribution + version pinning; plugin API version; deprecation policy; release process.
- Deliverable: packaging + policy docs.
- Gate: `openjiuwen` installs clean with no optional deps; extras resolve; incompatible plugin API rejected at discovery.

### W11 — Tooling/CLI
- Tasks: `--dump-config` (using the loader's own patch algorithm), `config validate`, plugin/element inventory, scaffolding template for a new element.
- Deliverable: CLI commands.
- Gate: a dump matches boot; validate rejects invalid config with position info.

### W12 — Testing strategy
- Tasks: unit + lifecycle tests; **seam conformance kit** (every provider must pass); real-composition tests (boot a composition, assert model-visible output); golden spec tests; migration tests (config + session); plugin version-matrix tests; invariant companions where observations diverge.
- Deliverable: test tiers + conformance kit.
- Gate: coverage on kernel/loader; every seam has a conformance test; composition tests for the default composition.

### W13 — Documentation
- Tasks: integrator standalone guide (mount your own plugins, no agent-tools); plugin authoring guide; seam references; generated catalogs (elements, config, events); migration guide.
- Deliverable: docs + generators.
- Gate: generated docs freshness-gated; the standalone guide is exercised by a runnable example.

### W14 — Security and invariants
- Tasks: keep security invariants fixed and mandatory (permission enforcement in the dispatch operation; sandbox boundaries); never express them as rows; audit new seams for trust boundaries.
- Deliverable: security review + enforced invariants.
- Gate: a dispatch without the permission seam is rejected; invariants cannot be disabled by composition.

### W15 — Performance
- Tasks: per-session mount-cost budget; hot-path benchmarks (streaming, tool dispatch); no message-passing on hot paths; regression gates.
- Deliverable: benchmarks + gates.
- Gate: mount cost within budget; no regression on key benchmarks.

### W16 — Framework observability/diagnostics
- Tasks: effect/fiber introspection, plugin inventory, dependency diagnostics, startup failure taxonomy.
- Deliverable: introspection APIs + diagnostics.
- Gate: a failed composition names the culprit and the missing package.

### W17 — Governance and API stability
- Tasks: seam review ownership; stability tiers (public seam vs internal); plugin API version policy; deprecation windows; requirements for adding a provider.
- Deliverable: governance doc.
- Gate: every public seam has an owner and a stability tier; compatibility promises documented.

---

## 5. Subsystem disposition (agent-core)

All of these **stay in agent-core**. Two kinds of items appear here: **plugins** (mountable capability providers, mounted by rows) and **subsystems** (applications that run on the framework and are not mounted by rows). Nothing is a move; the table is an inventory.

| Subsystem | Becomes |
|---|---|
| `core/foundation/{llm,tool,store}` | definitions stay; implementations become in-box plugins; optional deps as extras |
| `core/single_agent`, `core/runner`, `core/session` | interfaces stay; loop/runner wiring via kernel; session provider is an in-box plugin (swappable) |
| `harness/rails/*` | in-box rail plugins (all) |
| `harness/tools/*` | in-box tool plugins (all) |
| `harness/subagents/*`, `subagent_runtime/*` | in-box subagent plugins + runtime |
| `harness/manifest/*` | the catalog feeding the kernel |
| `harness/schema/*` | public spec format (stays) |
| `harness_protocol/*` | public SPI contract (stays) |
| `harness_providers/*` | in-box plugins; vendor SDKs as optional extras |
| `core/memory/*`, `core/retrieval/*` | in-box plugins; heavy deps as extras |
| `core/sys_operation/*` | in-box plugins |
| `extensions/{checkpointer,store,observability,...}` | in-box plugins; deps as extras |
| `agent_teams/*` | in-box subsystem: the team/member runtime plugins plus orchestration; non-mandatory |
| `agent_evolving/*`, `rsi/*`, `auto_harness/*`, `symphony/*`, `dev_tools/*` | **in-box subsystems (not seam plugins)**: shipped as extras/entry points, run on the framework, never in the default composition's required set |

---

## 6. Phases and grid

- **P0** Kernel + loader skeleton (W1, W2). No behavior change.
- **P1** Config→spec + catalog (W4).
- **P2** In-box plugins + loop ownership (W5, W6). Bare install works; no hidden rails.
- **P3** Seams finalized + conformance kit (W3, W12 partial).
- **P4** Lifecycle/reload + config system (W7, W9).
- **P5** Session versioning + packaging/tooling (W8, W10, W11).
- **P6** Hardening (W13, W14, W15, W16, W17).

| Workstream | P0 | P1 | P2 | P3 | P4 | P5 | P6 |
|---|---|---|---|---|---|---|---|
| W1 Kernel | ● | | | | | | |
| W2 Loader | ● | | | | | | |
| W4 Config→spec/catalog | | ● | | | | | |
| W5 In-box plugins | | | ● | | | | |
| W6 Loop/rail ownership | | | ● | | | | |
| W3 Seams | | | | ● | | | |
| W12 Testing | ○ | ○ | ○ | ● | ● | ● | ● |
| W7 Lifecycle/reload | | | | | ● | | |
| W9 Config system | | | | | ● | | |
| W8 Session versioning | | | | | | ● | |
| W10 Packaging | | | | | | ● | |
| W11 Tooling/CLI | | | | | | ● | |
| W13 Docs | | | | | | | ● |
| W14 Security | ○ | ○ | ○ | ○ | ○ | ○ | ● |
| W15 Performance | | | ○ | | | ○ | ● |
| W16 Diagnostics | | | | | ○ | ○ | ● |
| W17 Governance | | | | ○ | | | ● |

● = primary, ○ = ongoing.

---

## 7. Prerequisites

- Dedup copied code inside agent-core providers before wrapping them as plugins.
- Enumerate and freeze the current public API (`__init__.py` exports) to classify stability tiers.
- Stand up the seam conformance test-kit skeleton (it gates every later step).
- Baseline benchmarks for mount cost and hot paths.

---

## 8. Compatibility and deprecation

- Public seam names/signatures are stable; a change bumps the seam version and opens a deprecation window.
- The plugin API has a major version; the kernel refuses incompatible majors at discovery, before import.
- Session format generations are version-named successors; never overwrite or delete a committed generation.
- Legacy public API (cards, `create_deep_agent`, `DeepAgentSpec`, `Runner`) stays until a documented deprecation; a compatibility reader bridges legacy config.
- `openjiuwen[claude]`-style extras keep working; the in-box implementation always remains.

---

## 9. Risks

- Indirection cost — budget it; keep hot paths in-process.
- A Python in-process sandbox is **not** containment — dynamic plugins use subprocess/landlock only.
- Over-configuration — only deployment-varying values are config; invariants stay fixed.
- Accidental integrator breakage — avoid it by keeping everything in-box (no moves).
- Rollback: each phase is additive behind the new loader; the old construction path stays until the replacement passes the golden + composition + snapshot gates.

---

## 10. Effort and ownership (to fill)

- Kernel + loader: 1 engineer, P0.
- Catalog/config→spec + in-box plugin conversion: 1–2 engineers, P1–P2.
- Seams + conformance kit: 2 engineers, P3.
- Lifecycle/config/session/packaging/tooling: 2–3 engineers, P4–P5.
- Hardening (docs/security/perf/diagnostics/governance): cross-team, P6.

---

## 11. Interface contract agent-core exposes

- **Entry-point groups** (framework): `openjiuwen.plugins`, `openjiuwen.rail`, `openjiuwen.tool`, `openjiuwen.subagent`. A product may add a product-scoped group.
- **Plugin manifest**: `plugin.toml` with `id`, `version`, `api`, `provides`, `requires`.
- **Composition format**: the row model + patch layers + expression grammar.
- **Spec format**: `DeepAgentSpec` / `RailSpec` / `BuiltinToolSpec` / `SubAgentSpec` (public).
- **Seam versions**: each definition declares a version; consumers/providers declare `requires`.
- **Discovery**: agent-core imports neither agent-tools nor any product; it enumerates entry points and resolves `type`s.

---

## 12. After this plan

agent-core stays a **maintained library**. It receives **contract changes only** — a new seam, a widened seam, a spec-field addition, an in-box plugin adjustment, a plugin API bump, kernel/loader fixes, and deprecation removals. It never receives:

- an optional capability (that is agent-tools),
- product composition/configuration (that is jiuwenswarm),
- a provider swap (that is a plugin),
- a configurable security invariant.

Every such change follows W17: an owner and stability tier, a version bump, a conformance-kit update in the same change, and a deprecation window. Later plans surface these gaps; each is a small reviewed contract change, not a re-plan.
