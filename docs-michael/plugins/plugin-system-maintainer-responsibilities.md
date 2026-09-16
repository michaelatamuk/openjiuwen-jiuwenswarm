# Plugin system — maintainer responsibilities

Whoever owns the plugin system (kernel + loader + contracts) owns everything that happens **because** it exists. Plugin authors own their plugin; the maintainer owns the **platform that lets their plugin run inside everyone else's process**.

Companion to `plugin-system-placement.md` (where it lives) and `plugin-types.md` (which contracts it defines).

---

## The core asymmetry

| Party | Breaks | Report lands on |
|---|---|---|
| Plugin author | their own feature | nobody — their own users |
| Platform maintainer | every consumer that installed that plugin | the maintainer |

The consumer did not choose the plugin author; they chose this plugin system, its marketplace, and its loader. The maintainer is the trusted party; the plugin is untrusted input. Every responsibility below follows from that asymmetry.

---

## 1. Security

The maintainer owns the trust model, not the plugin.

| Responsibility | What it means |
|---|---|
| Threat model | write down what a malicious/buggy plugin can reach: filesystem, network, env vars, secrets, other plugins, the model, the user |
| Isolation | decide the process/thread/sandbox boundary; in-process loading means the plugin shares the host's address space, credentials, and memory |
| Capability grants | plugins must declare what they need, and the grant must be enforced, not merely documented |
| Permission enforcement | the permission engine is a **fixed invariant** (per `plugin-types.md`); a plugin may add policy, never disable the seam |
| Sandbox boundaries | if sandbox/fs/shell are pluggable, a plugin implementation must not silently escape the boundary it was loaded into |
| Supply chain | pinned versions, signatures/provenance, reproducible resolution, no silent upgrade to a new maintainer's code |
| Secrets | plugins that get model keys, tokens, or user data must be scoped; the maintainer owns the blast radius when they leak |
| Fail-closed defaults | an unvetted plugin gets least privilege by default; "allow" must be explicit |
| Auditability | who loaded what, when, from where, and what it touched — attributable after the fact |

Blame cannot be delegated to the plugin author. If the loader installed it and the kernel ran it, the platform shipped the vulnerability.

---

## 2. Contracts and their evolution

| Responsibility | What it means |
|---|---|
| Protocol definition | define each plugin type (`plugin-types.md`) precisely enough that independent providers are interchangeable |
| Versioning | version every contract; state what is additive and what is breaking |
| Deprecation | deprecation windows and migration guides — no silent breakage of published plugins |
| Compatibility | semver across host ↔ plugin, plus a support matrix (plugin v2 on host v1?) |
| Conformance | a plugin is valid only if it passes the kit; the maintainer maintains the kit |
| Arbitration | "does this need a new contract?" — every request to become a plugin type is a maintainer decision |

## 3. Lifecycle correctness

| Responsibility | What it means |
|---|---|
| Ordering | deterministic init/start/stop/teardown; explicit dependency resolution |
| Hot-reload | reload must not leak, double-run, or race with in-flight work; reentrancy handled |
| Failure semantics | plugin throws on start — fail host, disable plugin, or retry? Decided once, applied always |
| Recovery | idempotency and partial-failure recovery (half-installed, half-torn-down) |
| Baseline | zero-plugin behavior is identical to the old direct-call path |

## 4. Fault containment and isolation

| Responsibility | What it means |
|---|---|
| Error boundaries | wrap every plugin invocation; contain and attribute thrown exceptions |
| Timeouts | time out and cancel plugin calls so a hung plugin doesn't hang the agent loop |
| Resource governance | memory, CPU, disk, connection, token/tool budgets per plugin |
| State isolation | one plugin's crash or mutable global must not corrupt another's |
| Degradation | plugin offline → declared fallback, not undefined behavior |

## 5. Discovery, loading, and composition

| Responsibility | What it means |
|---|---|
| Single mechanism | one discovery path, not a fifth partial system (see the four ad-hoc systems in `plugin-system-placement.md`) |
| Resolution | deterministic handling of conflicting providers, duplicates, ordering, version pins |
| Bare install | in-box plugins work after `pip install` with zero config |
| Configuration | define what a user/operator can override, and what they cannot |
| Rollback | cleanly uninstall a plugin and everything it installed |

## 6. Performance

| Responsibility | What it means |
|---|---|
| Baseline overhead | own the cost with **zero plugins**; prove no hot-path regression |
| Load cost | account for per-plugin load time and lazy vs eager initialization |
| Budgets | publish perf budgets and watch them in CI, or every future plugin becomes a suspected cause |

## 7. Observability and diagnosability

| Responsibility | What it means |
|---|---|
| Attribution | every log, trace, metric, and error names the originating plugin |
| Introspection | list loaded plugins, contracts, grants, versions, and health |
| Debug story | a way for both plugin author and consumer to diagnose a failure across the boundary |
| Instrumentation | provide the hooks the plugin author is expected to use |

## 8. Developer experience and documentation

| Responsibility | What it means |
|---|---|
| SDK | stable, documented SDK with templates and examples per plugin type |
| Local testing | a local test/validation path and the conformance kit |
| Guidance | clear "your plugin crashed vs. the host crashed" troubleshooting |
| Communication | changelog and breaking-change notices to plugin authors |

## 9. Governance

| Responsibility | What it means |
|---|---|
| API review | once public, every contract needs versions, deprecation windows, and conformance tests **forever** |
| Trust tiers | in-box vs third-party get different review bars, clearly labeled |
| Licensing | provenance/licensing policy for what may be published or bundled |
| Marketplace | what is allowed, how it is curated, how abuse is handled |
| Decisions | placement (agent-core vs product), promotion of a type from "maybe" to "yes", and removal |

## 10. Support burden

| Responsibility | What it means |
|---|---|
| Bug inheritance | product bugs become platform bugs; users do not distinguish the kernel from a plugin |
| Incidents | the maintainer is the escalation path and postmortem owner for plugin-caused failures |
| Shared stability | if `agent-tools` or a product builds on the kernel, their uptime is the platform's problem |
| Migration | migrate the four existing extension systems and every integrator on the old factory path |

---

## Summary

| Owner | Owns |
|---|---|
| Plugin author | the plugin |
| Platform maintainer | the trust, the contract, the lifecycle, the containment, the performance, the diagnostics, the governance, and every incident that flows through the boundary the platform created |

## Code anchors

| Anchor | Why it matters here |
|---|---|
| `jiuwenswarm/jiuwenswarm/extensions/loader.py` (`ExtensionLoader`) | existing loader that auto-installs deps — a concrete trust/exec surface today |
| `jiuwenswarm/jiuwenswarm/server/runtime/extension_package_manager.py` + `server/runtime/marketplace/*` | install/manage path where supply-chain and provenance responsibilities land |
| `agent-core/openjiuwen/harness/schema/deep_agent_spec.py` | `register_rail_provider` / `register_tool_provider` / `register_subagent_provider` — the registries whose contracts are versioned |
| `agent-core/openjiuwen/harness/manifest/meta_elements.py` | `harness.*.entry_point` — the discovery mechanism governed here |
| `agent-core/openjiuwen/harness/manifest/models.py` | `ElementKind` — the type set arbitrated here |
