# jiuwenswarm pluggability — development plan

Third in the sequence: `00_agent-core-pluggability-plan.md` → `01_agent-tools-pluggability-plan.md` → **this**.

---

## 1. Scope and non-goals

**Scope**
- Make `jiuwenswarm` a **thin product on top of the kernel**: it boots by mounting a composition, and its behavior is plugins/rows.
- Author the composition: host `harness.yaml` + per-mode `resources/agents/<mode>/agent.yaml`.
- Strangle the monoliths into **first-party plugins**; migrate jiuwenswarm's **generic** capabilities to `agent-tools`.
- Keep product identity and policy as first-party plugins; provide a config compatibility path.

**Non-goals**
- Not the framework: kernel, seams, spec format, loader are `agent-core`.
- Not `agent-core`'s code: this plan never deletes or edits agent-core implementations; seam gaps are coordinated as small agent-core contract changes.
- Not changing product behavior: the migration is behavior-preserving, verified by the existing suites.

---

## 2. Position in the system

**Depends on**
- `agent-core`: kernel, loader, seams, spec format, **in-box plugins** (its implementations), entry-point groups.
- `agent-tools`: the capabilities migrated out of jiuwenswarm (+ new plugins), composed as rows. Listed as a product dependency.

**Owns (first-party, still plugins)**
- Composition files: host `harness.yaml`, per-mode `agent.yaml`, the shipped default bundle, `--patch` overlays.
- Agent adapters and modes; session leases; interrupt recovery; permission presets/policy; prompt/persona composition.
- Product shell: AgentServer, Gateway, message handler, routing, cron, heartbeat, health check, hooks.
- Team/swarm orchestration policy; equipment manager; `auto_harness`/`rsi`/`recommendation`; `symphony` (product layer).
- Config compatibility reader (legacy `config.yaml` → rows).

---

## 3. Current state to remove or replace

| Artifact | Location | Fate |
|---|---|---|
| `interface_deep.py` | ~897 KB, ~17,948 lines, ~500 methods | decompose into first-party plugins |
| `_build_agent_rails` | `interface_deep.py:8964` (~18 fixed + 8 optional blocks) | → `agent.yaml` rows |
| `_get_tool_cards` | `interface_deep.py:10216` | → `agent.yaml` tool rows + providers |
| `_TOOL_BUILD_NAMES` + `_build_*_tool` | `interface_code.py:402`, `:2326-2452` | → `agent-tools` tool plugins |
| bespoke hot-reload blocks | e.g. `interface_deep.py:10038-10054` | → generic recompose → diff → reload |
| `common/config.py` | ~130 KB, ~80 `update_*` | → composition + `Config` models + compat reader |
| `resources/config.yaml` | 1,823 lines (1,026 data) | → host rows + presets (see `04_config-example`) |
| `server/agent_ws_server.py`, `gateway/app_gateway.py` | 592 KB / 160 KB | keep; mounted as plugins |
| `AgentConfigurator._task_loop_budget_rail_specs` | agent-core `agent_teams` (in-box) | coordinate: member/subagent coverage via preset inheritance |
| `extensions/{loader,registry}.py` | dir-based extensions | → the kernel loader |

---

## 4. Workstreams

### JW1 — Adopt the kernel and loader at boot
- Tasks: replace imperative startup with `kernel.boot(composition)`; resolve profile/home/overlays; mount the host composition; `assert_all_active`; wire fail-loud and shutdown to root-fiber disposal.
- Deliverable: a boot path that mounts rows.
- Gate: the server starts from a composition; unknown `type`/unmet dependency fails loud; clean shutdown unwinds effects.

### JW2 — Host-plane composition
- Tasks: author `resources/harness.default.yaml` + user layer + `--patch`; express LLM, session, storage, observability, sandbox, fs, shell, mcp, skill, memory, retrieval, permissions, gateway, channels, team, adapter as rows.
- Deliverable: host composition files.
- Gate: the composed row set resolves every `type`; a dump matches boot.

### JW3 — Agent-plane presets per mode
- Tasks: create `resources/agents/{standard,code,team,...}/agent.yaml` from today's `config.yaml::modes.*` + `_build_agent_rails`; support `extends:` and `isolate` groups.
- Deliverable: presets covering every shipped mode.
- Gate: live rail/tool/subagent sets per mode identical to today.

### JW4 — Strangle `interface_deep` / `interface_code`
- Tasks: extract cohesive first-party plugins — session lease, model router, permissions, interrupt/continuation, prompts, skills, budget, context/compaction, observability; delete the rail/tool lists and bespoke reload blocks; the adapter keeps only the `AgentAdapter` protocol.
- Deliverable: a small adapter + plugins.
- Gate: each plugin has focused tests; the adapter shrinks ≥50%; no behavior diff.

### JW5 — Team/subagent coverage via preset inheritance
- Tasks: give subagents/members their presets (budget, rails, tools) via `extends:`; coordinate with agent-core so member composition comes from presets/in-box plugins rather than a hardcoded rail-spec list; keep delegation tools resolving the host registry.
- Deliverable: member/subagent presets.
- Gate: every member gets the same rails/tools as today without per-member code.

### JW6 — Product shell as plugins
- Tasks: mount AgentServer/Gateway/message handler/routing/cron/heartbeat/health/hooks and channels as rows; keep them first-party.
- Deliverable: the shell as plugins.
- Gate: all surfaces boot and behave identically; a removed surface is absent, not broken.

### JW7 — Config migration
- Tasks: replace `config.yaml` top-level sections with rows/`Config`; write the legacy→rows compat reader; delete `update_*` writers; keep `config validate` / `--dump-config`.
- Deliverable: typed config + compat reader.
- Gate: an existing `config.yaml` boots unchanged via the reader; a new config validates.

### JW8 — Subsystem extraction (first-party)
- Tasks: extract `agent_manager`, warm pool, market/equipment (`extension_package_manager`), `auto_harness`, `rsi`, `recommendation`, `symphony` product layer, and observability wiring out of the monolith. Units that provide a seam or must be mountable become **plugins** (rows); the rest become **subsystems** invoked by the product (entry points/extras), not mounted by rows.
- Deliverable: first-party plugins + subsystems.
- Gate: every unit is decoupled from adapter internals; mountable units are removable by a row; subsystems do not appear in the composition.

### JW9 — Surfaces and multi-process
- Tasks: keep the AgentServer/Gateway split; distributed team transport; ensure the kernel works in each process; agent/session disposal.
- Deliverable: multi-process composition.
- Gate: the split layout boots; no leaked agents/sessions after teardown.

### JW10 — Testing parity
- Tasks: run the existing unit + snapshot/session-replay suites against the composed product; add real-composition tests per mode; migration tests (old config → boot).
- Deliverable: a green parity suite.
- Gate: snapshot/session outputs unchanged; every mode boots with identical live sets.

### JW11 — Documentation
- Tasks: product config reference (host + presets); migration guide (old `config.yaml` → rows); per-plugin READMEs for first-party plugins.
- Deliverable: docs + migration guide.
- Gate: the guide reproduces a working config for each mode.

### JW12 — Compatibility and deprecation
- Tasks: keep public entry points stable; deprecate replaced config keys and import paths with a window; document removals.
- Deliverable: deprecation policy.
- Gate: old config/imports keep working through the window; removals announced.

---

## 5. Migration order (behavior-preserving)

1. **JW1–JW2** — boot on the kernel; host composition only (the adapter still builds the agent).
2. **JW3–JW4** — move rail/tool selection into presets; delete the lists; extract adapter plugins.
3. **JW5–JW6** — team/subagent coverage and the product shell as plugins.
4. **JW7** — config migration + compat reader.
5. **JW8–JW9** — subsystem extraction and multi-process.
6. **JW10–JW12** — parity, docs, deprecation.

Every step keeps the old path alive until the composed path passes the parity gates.

---

## 6. Exit criteria

- `jiuwenswarm` boots by mounting a composition; no hardcoded rail/tool lists remain.
- Every behavior is a row or a first-party plugin; jiuwenswarm's generic capabilities come from `agent-tools`; agent-core's capabilities come from its in-box plugins.
- Existing `config.yaml` still boots via the compat reader; new config is typed and validated.
- Existing unit + snapshot/session suites pass with no output change.
- Adding a capability = install a plugin + add one row; removing one = delete the row.
- No leaked agents/sessions; clean shutdown; the multi-process layout works.

---

## 7. Risks and compatibility

- Behavior drift during decomposition — gated by parity tests per step.
- Config migration regressions — the compat reader keeps legacy `config.yaml` working through the deprecation window.
- Cross-repo coordination — `agent-tools` migrations and any agent-core seam gaps are planned as separate small changes, not blocks.
- Interface stability — public entry points and old config keys are deprecated with a window before removal.
