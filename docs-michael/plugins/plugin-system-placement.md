# Plugin system — placement

Where the plugin system (kernel + loader + contracts) lives — `agent-core` vs `jiuwenswarm`.

Companion to `jiuwenswarm-pluggability-rewrite.md` (architecture) and `plugin-types.md` (which capability types are part of it). This is a reasoned argument; code evidence is in the final section.

---

## Placement: agent-core vs jiuwenswarm

| Factor | Verdict | Why |
|---|---|---|
| Who it serves | agent-core | agent-core is the shared base (SDK + harness framework); jiuwenswarm is one product |
| Contracts already here | agent-core | catalog, registries, `DeepAgentSpec`, entry points all live here already |
| Who depends on whom | agent-core | flows one way: `jiuwenswarm → agent-tools → agent-core`; agent-core depends on nothing |
| Bare install | agent-core | in-box plugins ship in `openjiuwen`, so `pip install` just works |
| Reuse | agent-core | any integrator and `agent-tools` build on it |
| Discovery | agent-core | one `openjiuwen.*` mechanism, not a 5th partial system |
| Speed to build | jiuwenswarm | faster — one consumer, no generic/standalone bar |
| Blast radius | jiuwenswarm | smaller — no other integrators to break |

**Why not agent-core:**

| Topic | Why not |
|---|---|
| Whose problem | the kernel fixes jiuwenswarm's monolith, not agent-core's — agent-core has no such mess to untangle |
| One consumer | premature to generalize for a single product; prove it first, promote it when a 2nd integrator needs it |
| API lock-in | once public it needs versions, deprecation windows, and conformance tests forever |
| Changes its nature | agent-core is an SDK with neutral contracts; a lifecycle kernel is an opinion that should stay opt-in |
| Security surface | loading third-party plugins in-process is an attack surface the SDK would have to own |
| Performance | the kernel replaces direct calls with service lookup + events — baseline overhead even with zero plugins; must prove no hot-path regression |
| Breaks current users | today's implicit defaults (factory auto-rails, auto stop-condition) become explicit rows — integrators on the old factory path must migrate |
| Framework tax | every user ships the kernel+loader+plugin protocol even if they only want `WorkflowAgent` |
| Hardest bugs become core's | lifecycle, effects, hot-reload, reentrancy are the riskiest code — then every product's crash is agent-core's bug |
| Governance forever | permanent "does this need a new contract?" arbitration + conformance kit + entry-point/version policy |

So the maintainer counter-position: keep the neutral contracts in agent-core; build the kernel/loader/composition in jiuwenswarm (or agent-tools) first, and migrate it into agent-core only when it's proven general and a second consumer exists.

**Why not jiuwenswarm:**

| Topic | Why not |
|---|---|
| Dependency direction | if `agent-tools` or third parties build on my kernel, I become their foundation and inherit their stability burden |
| Kernel ownership | throwaway work — if it later moves to agent-core I lose it, and it wouldn't even unify my 4 existing extension systems |
| Product focus | the kernel is generic infra with no product differentiation — time on it is time not shipping features |
| Not my competency | lifecycle/effects/concurrency is framework-grade work; a product team builds it worse and owns the bugs |
| Stability for a private surface | versioning/docs/conformance for a kernel no third party uses is pure overhead |
| Walled garden | a jiuwenswarm-only kernel makes `agent-tools` and third-party plugins jiuwenswarm-only — no external contributions |
| Divergence | a local kernel forks the architecture; every agent-core release risks it, and I pay a growing integration tax |

---

## Code anchors (verified)

- `jiuwenswarm/jiuwenswarm/server/runtime/agent_adapter/interface_deep.py` (`_build_agent_rails` L8993, `_get_tool_cards` L10249) and `interface_code.py` (`_TOOL_BUILD_NAMES` L402, `_build_agent_rails` L1495) — the hardcoded monolith the kernel would replace.

jiuwenswarm's 4 existing partial extension systems:

| System | What it does | Where it lives |
|---|---|---|
| Manifest re-export | declares ~44 rails/tools/subagents and pushes them into agent-core's registry | `agents/swarm/providers/*` + `registry.py::register_swarm_providers` |
| `extensions/` | scans folders for `extension.yaml`/`extension.py`, auto-installs deps, registers app extensions | `extensions/loader.py` (`ExtensionLoader`) + `extensions/registry.py` (`ExtensionRegistry`) |
| Equipment + marketplace | installs/manages packages (agent templates, agent groups, plugins) from the Hub | `server/runtime/extension_package_manager.py` + `server/runtime/marketplace/*` |
| Adapter factory | hardcoded map: sdk/mode → which adapter class to use | `server/runtime/agent_adapter/agent_adapters.py::create_adapter` |
