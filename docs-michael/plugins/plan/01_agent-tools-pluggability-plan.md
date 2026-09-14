# agent-tools pluggability — development plan

Second in the sequence: `00_agent-core-pluggability-plan.md` → **this** → `02_jiuwenswarm-pluggability-plan.md`.

---

## 1. Scope and non-goals

**Scope**
- Create the `agent-tools` distribution family: **optional/external plugin packages** that implement agent-core seams.
- Hold **only non-core implementations**:
  1. capabilities migrated out of **jiuwenswarm** (the bulk of it),
  2. new and third-party plugins,
  3. opt-in implementations of capabilities `agent-core` does not ship.
- Make each capability available by `pip install` + one composition row, with no edit to `agent-core` or `jiuwenswarm`.

**Non-goals**
- Not the framework: no kernel, seams, loader, or spec format (those are `agent-core`).
- Not the product: no product policy, composition files, or product shell (those are `jiuwenswarm`).
- **No code moves out of `agent-core`.** agent-core already ships every capability it has (in-box); this distribution does not duplicate it.
- Not a dependency of `agent-core`; not required by a bare integrator.

**Who installs it:** `jiuwenswarm` (the primary consumer, as the product's plugin source) and opt-in users. Never a bare `openjiuwen` install.

---

## 2. Position in the system

**Depends on (from agent-core)**
- kernel (`Context`, `Service`, `mount`, `inject`, `effect`, `isolate`);
- seam definitions (service/ABC + vocabulary + events) and their versions;
- element catalog + spec format (`RailSpec`, `BuiltinToolSpec`, `SubAgentSpec`, `DeepAgentSpec`);
- entry-point groups `openjiuwen.plugins` / `.rail` / `.tool` / `.subagent`;
- the plugin manifest + `api`/`requires` gating contract.

**Consumed by**
- `jiuwenswarm` (composes selected plugins into its presets);
- opt-in users who deliberately install it.

**Hard rules**
- Imports `openjiuwen` only; never imports `jiuwenswarm`.
- Publishes into framework entry-point groups only; no product-named groups.
- Every plugin declares `api` and `requires` and is gated by the kernel.
- If `agent-core` already ships a capability, this distribution does not duplicate it.

---

## 3. What lives here

### 3.1 Migrated out of `jiuwenswarm`

These are jiuwenswarm's **generic** capabilities — reusable, not product identity. They move here; jiuwenswarm then composes them as rows.

| Group | Items | Package |
|---|---|---|
| Tools | web free/fetch/paid, vision, audio, video, image, user_todos, skill toolkits/retrieval, acp_chat, cron, wiki, send_file | `agent_tools/tools/*` |
| Rails | code rails (agent-mode, lsp, worktree, project/coding memory, plan approval, confirm-interrupt, task-planning), work rails, member/evolution rails | `agent_tools/rails/*` |
| Subagents | code subagent, statusline-setup, swarm browser | `agent_tools/subagents/*` |
| Memory | auto_memory, memory_rpc | `agent_tools/memory/*` |
| Context / recommendation | context_optimizer, recommendation_matrix | `agent_tools/{context,recommendation}/*` |
| MCP | client + config | `agent_tools/mcp/*` |
| Skills | skill manager | `agent_tools/skill/*` |
| Channels | web, tui, desktop, ide, acp, process_cli, browser; IM platforms (feishu, slack, dingtalk, wechat, wecom, telegram, whatsapp, discord, xiaoyi); protocols (a2a, acp, ssh) | `agent_tools/channels/*` |
| Session store | jsonl, sqlite providers | `agent_tools/session/*` |
| Observability | store, sink, trajectory_insight | `agent_tools/observability/*` |
| Marketplace | Hub client | `agent_tools/marketplace/*` |
| Browser runtime | playwright runtime | `agent_tools/browser/*` |

Does **not** move here: product adapters/modes, product policy, product shell, team/swarm *orchestration policy*, equipment manager, composition files (all stay first-party in `jiuwenswarm`).

### 3.2 New / third-party implementations not already in `agent-core`

| Group | What belongs here | Package |
|---|---|---|
| LLM providers | a vendor `agent-core` does not ship | `agent_tools/llm/*` |
| Memory / retrieval | a backend the in-box set does not ship | `agent_tools/{memory,retrieval}/*` |
| FS / shell / sandbox | a runtime the in-box set does not ship | `agent_tools/{fs,shell,sandbox}/*` |
| Observability | an exporter `agent-core` does not ship | `agent_tools/observability/*` |
| Third-party | plugins from outside this project | `agent_tools/*` |

Rule: **if `agent-core` already ships it, it is not duplicated here.** A deliberately different implementation of a core capability is allowed only when someone writes one to replace the in-box row — and the in-box version remains selectable.

---

## 4. Repository / package layout

```
agent-tools/
  pyproject.toml                 # depends on openjiuwen only; extras per capability family
  src/agent_tools/
    __init__.py
    _manifest.py                 # shared plugin.toml helpers
    # migrated out of jiuwenswarm
    rails/{code,work,member,evolution,...}/
    tools/{web,vision,audio,video,image,cron,skill_toolkit,acp_chat,...}/
    subagents/{code,statusline_setup,browser}/
    memory/{auto_memory,...}/  context/{context_optimizer,recommendation_matrix}/
    mcp/  skill/  channels/{web,tui,im/*}/  session/  browser/  marketplace/  observability/
    # new / third-party, not in agent-core
    llm/<new-vendor>/  memory/<new-backend>/  sandbox/<new-runtime>/
  tests/
```

- One **plugin package** per subpackage; each ships `plugin.toml`.
- `pyproject.toml` extras mirror families: `agent-tools[web]`, `[feishu]`, `[otel]`, `[vector]`, `[redis]`.
- Multiple distributions are allowed later, sharing the framework entry-point groups.

---

## 5. Plugin protocol

- `plugin.toml`: `id`, `version`, `api`, `provides`, `requires`, optional config schema.
- Entry point(s): `openjiuwen.plugins` → the plugin object; and/or an element group (`openjiuwen.rail` / `.tool` / `.subagent`) for a single contribution.
- A `Config` model (Pydantic) per plugin, enforced by the kernel before `apply`.
- `requires` names seam versions (e.g. `loop.budget>=1`, `llm>=1`); the kernel refuses incompatible majors at discovery.
- Optional-dependency declaration (the SDK/extra a plugin needs) so selecting it without the dependency fails loud.

---

## 6. Workstreams

### AT1 — Repository, build, CI
- Tasks: create the distribution; subpackage layout; extras; pin `openjiuwen`; CI (lint/type/test/build); release pipeline.
- Deliverable: installable `agent-tools`.
- Gate: `pip install agent-tools[one-family]` works; importing the package imports no plugin.

### AT2 — Plugin protocol implementation
- Tasks: `plugin.toml` reader; entry-point registration; `Config` enforcement; `api`/`requires` gating; optional-dependency detection with actionable errors.
- Deliverable: the shared protocol helpers used by every plugin.
- Gate: a malformed or incompatible plugin is rejected at discovery with a precise message.

### AT3 — Seam conformance
- Tasks: run each plugin against the agent-core seam conformance kit; implement each seam's provider contract.
- Deliverable: conformance-passing plugins.
- Gate: every plugin passes its seam's conformance suite; no plugin reaches into a non-seam core API.

### AT4 — Migrate `jiuwenswarm` capabilities
- Tasks: move the §3.1 items into plugin packages; change jiuwenswarm to compose them as rows (coordinated with `02_`); delete the moved code from jiuwenswarm.
- Deliverable: the capabilities live here; jiuwenswarm references them by `type`.
- Gate: jiuwenswarm runs with the same capabilities via rows; no plugin imports jiuwenswarm.

### AT5 — New / third-party implementations
- Tasks: implement providers for vendors/backends/runtimes/exporters that `agent-core` does not ship, supplying the existing seam; do not duplicate an in-box implementation.
- Deliverable: coexisting new implementations.
- Gate: selecting one by a row works; the in-box implementation is untouched and still selectable; no agent-core code deletion.

### AT6 — Config models and defaults
- Tasks: a `Config` model per plugin; sensible defaults in code; only deployment-varying values are fields.
- Deliverable: validated config for every plugin.
- Gate: an invalid config fails at boot with the offending field; defaults work with an empty `config:`.

### AT7 — Testing
- Tasks: per-plugin unit tests; conformance tests; integration composition tests (mount + assert model-visible output); version-matrix tests against `openjiuwen` `api` versions.
- Deliverable: test tiers + fixtures.
- Gate: coverage per plugin; a composition test proves each capability mounts and works end to end.

### AT8 — Documentation
- Tasks: per-plugin README (contract, config, model/token effects, limitations); a plugin authoring guide; a generated catalog of available plugins.
- Deliverable: docs + catalog generator.
- Gate: catalog freshness-gated; the authoring guide produces a working plugin from the template.

### AT9 — Packaging, release, versioning
- Tasks: per-plugin versioning; a compatibility matrix against `openjiuwen` `api` versions; release process.
- Deliverable: release pipeline + matrix.
- Gate: a released plugin installs alongside a supported agent-core and is refused on an unsupported one.

### AT10 — Marketplace integration
- Tasks: make plugins publishable/installable as Hub assets; install/uninstall round-trips; entry points appear/disappear on install/uninstall.
- Deliverable: marketplace-ready packages.
- Gate: install from Hub → the row resolves; uninstall → a leftover row fails loud.

### AT11 — Security and trust
- Tasks: optional-dependency hygiene; no secrets in code; provenance/signing plan; document that channels/tools execute in-process.
- Deliverable: trust policy.
- Gate: review passes; secrets never logged or committed.

---

## 7. Migration order (low risk → high)

1. **Leaf jiuwenswarm capabilities** — one rail (`step_back`), one tool (`web`).
2. **jiuwenswarm tool/rail families** — all migrated tools/rails.
3. **New implementations not in agent-core** — a new vendor/backend/runtime.
4. **Stateful subsystems** — memory, retrieval, session store, mcp, skill.
5. **Channels** — one IM platform first, then the rest + protocols.
6. **Orchestrators last** — marketplace, browser, context/recommendation.

---

## 8. Exit criteria

- Every capability migrated out of `jiuwenswarm`, plus new/third-party implementations, lives here; **nothing was removed from `agent-core`**.
- Each plugin: installable, discoverable, config-validated, conformance-passing, documented, versioned.
- `jiuwenswarm` composes plugins without code edits; a bare `agent-core` integrator never needs this distribution.
- Adding/removing a capability is `pip install/uninstall` + one composition row; no core or product code edit.
- `agent-tools` imports `openjiuwen` only and publishes into framework entry-point groups only.

---

## 9. Interface rules with agent-core

- Must not define seams, events, or the spec format (agent-core owns them).
- Must not depend on a kernel API that is not a published seam.
- Must not bundle a capability agent-core already ships (in-box).
- Must declare `requires` against seam versions and rely on the kernel's gating rather than its own version checks.
