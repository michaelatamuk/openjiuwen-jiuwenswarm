# Development plan

## End state
- `agent-core` = framework: kernel + definitions/seams + loader + in-box default plugins. Runs standalone, no jiuwenswarm and no agent-tools.
- `agent-tools` = optional, integrator-agnostic plugins (implementations migrated from both repos).
- `jiuwenswarm` = one product: composition (data) + product-specific first-party plugins.
- Dependency direction: `agent-core` ← `agent-tools` ← `jiuwenswarm` (and ← any integrator). `agent-core` imports neither; it only discovers plugins by entry point.

## Principles
- Plugin ≠ separate distribution: composition (rows) is orthogonal to where code lives.
- Required defaults ship in-box (mandatory deps); optional capabilities are extras / `agent-tools` (non-mandatory).
- Generic contract → `agent-core`; generic optional implementation → `agent-tools`; product-specific → the product repo.
- Seams never move (definitions, events, specs, protocols); providers may.
- Loop essentials (stop condition; permission enforcement) are mandatory seams, enforced by the consumer, fail loud if absent.
- No hidden defaults: `DeepAgent`/the factory create no behavior rails; defaults are rows in the shipped composition.
- Discovery uses framework groups `openjiuwen.*`; a product may add a product group (`jiuwenswarm.plugins`).
- Fail loud on unknown `type`, unmet dependency, or duplicate rail type — never silently degrade.

## Phase 0 — kernel + loader (agent-core, no behavior change)
- Build `openjiuwen/kernel`: Context/services, Plugin, mount, inject, effect/dispose, isolate/intercept, event bus (emit/waterfall/serial/parallel), fiber states.
- Build the loader: composition rows + patch layers + validation + fail-loud sweep + required-capability check.
- Fold `jiuwenswarm/extensions/{loader,registry}.py` into it (one discovery mechanism).
- Gate: a 2-row composition boots and disposes cleanly; standalone with no jiuwenswarm.

## Phase 1 — config→spec + catalog (agent-core)
- Implement `load_deep_agent_spec(config)` (the documented `FUTURE`).
- Register every existing `@harness_element` as a kernel provider; make `RailSpec`/`BuiltinToolSpec`/`SubAgentSpec` resolve through the kernel.
- Gate: a spec built purely from YAML equals the code-built spec (golden test); adding a provider is a row, not a `resolve_provider` edit.

## Phase 2 — in-box defaults (agent-core)
- Express the minimum functional set as in-box plugins: loop, stop condition, permission/security, local `fs`/`shell`, basic tools, default task planning + compaction, subagent runtime, one LLM adapter.
- Remove the factory's auto-default rails and `DeepAgent`'s auto `TaskCompletionRail`; defaults come from the shipped composition.
- Gate: `pip install openjiuwen` + default composition = a working agent; `read_file` works with no `agent-tools` installed.

## Phase 3 — `agent-tools` repo + migrate optional capabilities (from both repos)
- Create the distribution with framework entry-point groups (`openjiuwen.plugins`, `.rail`, `.tool`, `.subagent`).
- From `agent-core` (optional/extra): extra rails, extra tools, extra subagents, extra LLM vendors, memory/retrieval backends, fs/shell/sandbox variants, observability exporters, workflow, team runtime, harness providers (claudecode/codex/dsh).
- From `jiuwenswarm` (optional/extra): web/vision/audio/video/image/cron tools, code rails, memory, mcp, skill, channels, session store, marketplace client, observability, browser.
- Gate: install plugin + add row → capability present; remove → absent; zero core/jiuwenswarm code edits.

## Phase 4 — jiuwenswarm composition + strangling
- Author host `harness.yaml` + per-mode `resources/agents/<mode>/agent.yaml`, derived 1:1 from today's `config.yaml` + `_build_agent_rails` + `_get_tool_cards` + `_TOOL_BUILD_NAMES`.
- Delete the adapter rail/tool lists, bespoke hot-reload blocks, and the replaced `config.yaml` sections.
- Team/subagent coverage via preset inheritance (delete `AgentConfigurator._task_loop_budget_rail_specs` and friends).
- Keep first-party: adapters/modes, session leases, interrupt recovery, permission policy, prompt/persona composition, product shell, team/swarm orchestration, equipment manager, `auto_harness`/`rsi`/`recommendation`/`symphony`.
- Gate: live rail/tool/service sets identical to today; existing unit/snapshot suites pass; monoliths shrink ≥50%.

## Phase 5 — lifecycle, reload, versioning, distribution
- Effects/disposal everywhere; generic hot reload = recompose → diff → restart changed fibers.
- Plugin `api` version + `requires` gating; kernel refuses incompatible majors at discovery.
- Marketplace/Hub installs plugin wheels; uninstall removes entry points; a leftover row fails loud.
- Gate: no leaked agents/sessions; reload/rollback verified; install/uninstall round-trips.

## Phase 6 (optional) — self-modification
- Sandboxed subprocess plugin runtime, approval-gated; never in-process.

## Per-feature pattern
- No new seam → `agent-tools` only (e.g. `step_back`): rail file + config model + entry point + one composition row.
- New seam (contract) → three layers (e.g. `budget`): `agent-core` adds the reviewed, versioned seam; `agent-tools` ships the plugin; `jiuwenswarm` supplies rows/coverage.
- Product policy → `jiuwenswarm` bundle (still a plugin/row, never an adapter branch).

## Risks to hold the line on
- Indirection cost.
- A Python in-process sandbox is not containment.
- Over-configuration.
- Keep security invariants fixed.
- Version the seam and the session format.
- Never move required providers out of `agent-core`.

## Order
- `agent-core` kernel/definitions/loader → in-box defaults → `agent-tools` → `jiuwenswarm` composition + first-party plugins → discovery/versioning/marketplace → (optional) self-modification.
