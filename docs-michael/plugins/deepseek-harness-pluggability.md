# DeepSeek Harness — "Everything is pluggable": a code study

Source studied: `C:\Workspace\openjiuwenothers\deepseek-harness` (TypeScript monorepo, pnpm workspaces).
This document is grounded in the **code**, not the docs. Every claim cites the file it came from.

The repo's own AGENTS.md states the thesis verbatim: *"DeepSeek Harness is an all-plugin Cordis agent harness."* (`AGENTS.md`).

---

## 0. The kernel: Cordis (vendored)

`vendor/cordis/` is a vendored copy of the Cordis framework (upstream author Shigma; package `@deepseek-ai/cordis` v4.0.2). Everything in the harness plugs into this.

### 0.1 What a "plugin" is

`vendor/cordis/src/registry.ts` defines three accepted shapes:

- function: `(ctx, config) => any`
- class: `new (ctx, config)`
- object with `apply(ctx, config)`

`ctx.plugin(plugin, config)` starts a **fiber** and returns it (the return value is a thenable `Object.create(fiber)` wrapper; `await` settles once loading finished). The registry keys runtimes by the plugin's executable callback, so the same plugin mounted twice shares one runtime record with multiple fibers.

### 0.2 Services

`vendor/cordis/src/service.ts` — a service is just a plugin subclass that calls `super(ctx, name)`:

```ts
export abstract class FileSystem extends Service {
  constructor(ctx: Context) { super(ctx, 'fs') }
  ...
}
```

`super(ctx, name)` calls `ctx.reflect.provide(name, this, check)`. The service is registered **immediately** and removed automatically when the owning fiber unloads. This is why nothing has to be "wired": a provider plugin simply exists, and consumers read the name off the context.

Type-side registration is a declaration merge:

```ts
declare module '@deepseek-ai/cordis' {
  interface Context { fs: FileSystem }
  interface Events { 'fs/write-intent'(...): ...; 'fs/observed'(...): void }
}
```

(`packages/fs/fs/src/index.ts`)

### 0.3 Dependency-driven lifecycle (`inject`)

`vendor/cordis/src/fiber.ts` + `registry.ts`:

- A plugin declares `inject` (array or name→config map). The fiber starts in `PENDING`.
- It becomes `ACTIVE` only when **all** injected services are available.
- If a service disappears or is replaced, the fiber automatically `_unload`s; if it returns, the fiber `_reload`s. The "epoch" string is rebuilt from the injected implementations' fiber uids.
- **Consequence:** composition order is irrelevant. Activation is service-availability driven. This is stated in `packages/bundle/base/cordis.patch.yml`: *"Row order carries no load semantics (activation is service-availability driven)."*

`FiberState`: `PENDING, LOADING, ACTIVE, FAILED, DISPOSED, UNLOADING`.

### 0.4 Effects and disposal

`fiber.effect(execute, label)` runs `execute` immediately and collects every disposer it returns (single function / iterable / async iterable / promise). Disposers run in **reverse order** on unload or when the returned disposer is called. `ctx.on(...)` registers events as effects.

Repo rule (`AGENTS.md`): *"**Registrations are effects**: every contribution goes through `ctx.effect()` / `ctx.on()`; a registry's `register()` returns the disposer."* This is what makes runtime add/remove/hot-reload safe.

`getEffects()` exposes an `EffectMeta` tree for diagnostics.

### 0.5 Scoping and interception

`vendor/cordis/src/context.ts`:

- `ctx.isolate(name, label?)` — returns a child context whose `name` service resolves in a **separate realm** (a label symbol). Two `isolate()` calls with the same label join scopes. A different provider can publish under that realm without affecting the parent.
- `ctx.intercept(name, config)` — returns a child context that merges extra config into `name`'s resolved config for plugins below it. `Service[symbols.resolveConfig]` merges ancestor intercepts.
- `ctx.extend(meta)` — prototypal child context; parent never mutated.

### 0.6 Events

`vendor/cordis/src/events.ts` + repo conventions define dispatch modes carried in JSDoc (`@mode emit | waterfall | serial`):

- **emit** — fire-and-forget observers.
- **waterfall** — each listener receives a `next()` it MUST call to delegate; returning without calling short-circuits. Used for interception decisions.
- **serial** — awaited in order.

Scoped dispatch: `@deepseek-ai/dsh-scope` adds a scope key to a context and a routing-only `Scoped<T>` carrier, so a listener registered for agent A only sees agent A's events. See §5.

---

## 1. Composition is data: the Loader and patch layers

### 1.1 The loader entry tree

`vendor/loader/` (`@deepseek-ai/cordis-plugin-loader`) owns a tree of entries parsed from YAML.

Entry shape (`vendor/loader/src/config/entry.ts`):

```ts
interface EntryOptions {
  id: string          // stable id inside the tree
  name: string        // module specifier to import
  config?: any        // validated against the plugin's Config schema
  group?: boolean     // nested entry group
  disabled?: boolean  // or a !!js expression
  inject?: Inject     // required services / intercept config
}
```

Plus, added by `isolate.ts`:

```ts
interface EntryOptions {
  intercept?: Dict          // service name -> config merged for this subtree
  isolate?: Dict<true|str>  // service name -> local realm (true) or shared label (string)
}
```

The loader `import()`s the module named by `name`, applies config validation, and starts the plugin as a fiber. It can **self-dispose**: if a plugin under an entry disposes its own fiber, the loader marks the row `disabled` and writes the tree back (`vendor/loader/src/index.ts`, the `internal/plugin` handler).

### 1.2 Groups

`vendor/loader/src/config/group.ts` — `Group` is itself a plugin (`cordis:group`) whose config is a list of child entries. `EntryGroup` creates/updates/removes child entries and rolls back on partial failure. This is how a subtree gets `isolate`/`intercept` applied (`isolate.ts` `loader/patch-context` handler).

### 1.3 Patch layers (the app is a stack of patches)

`apps/cli/src/profile-boot.ts`:

```
bundles (in dsh.profile.bundles order)
  -> profile's own cordis.patch.yml
  -> $DSH_HOME/cordis.patch.yml        (machine-local, outranks profile)
  -> --patch overlays
  -> telemetry switch (DSH_TELEMETRY_DISABLED)
```

Composition = `applyEntryPatches([], layers.flat())` over an **empty root entry list** (`packages/boot/app-boot/src/profile.ts`, `composeEntries`). Patch semantics: insert rows, or target a row by `id` and replace its whole config / set `disabled`. **Last write wins per id.** `packages/bundle/base/cordis.patch.yml` even documents that a per-mode value must NOT live in base, because "a patch replaces the targeted row's whole `config` rather than merging into it."

### 1.4 Profiles and bundles

`packages/boot/app-boot/src/profile.ts`:

- A **profile** is `$DSH_HOME/profiles/<name>/` with a `package.json` (`dsh.profile.bundles` ordered list, `dsh.profile.patchReload`) and `cordis.patch.yml`.
- A **bundle** is an npm package declaring `"dsh": { "bundle": { "patch": "./cordis.patch.yml" } }`.
- Shipped templates: `acp`, `web`, `headless`, `sdk`, `sdk-minimal` (each `base` + a mode bundle).

### 1.5 Conditional composition and hot reload

- `!!js` expressions are allowed under a row's `config` and under `disabled` (`vendor/loader/src/config/utils.ts`, `interpolate`). Example from base: `disabled: !!js process.platform === 'win32'`.
- `patchReload: live` (web profile, custom profiles) makes the launcher watch the user patch files and recompose live. `scripts/verify-cordis-config.ts` enforces that `!!js` only appears where the loader actually interpolates it.

### 1.6 Boot code anchors

- `apps/cli/src/profile-boot.ts` — `runProfile()`, `composeProfile()`, telemetry patch, live watchers.
- `packages/boot/app-boot/src/index.ts` — `boot()`, `loadProfile()`, `installFailLoud()`, `loadOverlayPatches()`.
- `packages/boot/cmdline/` — `ctx.cmdlineArgs` + `AppReady` given to app plugins.

---

## 2. The capability-seam pattern (definition / provider / consumer)

Repo rule (`AGENTS.md`): *"**A capability seam comprises Service Definition / Service Provider / Consumer roles.** It is complete, never one role; split only when roles evolve independently."*

- **Definition** package = abstract `Service` + `declare module` Context/Events + vocabulary types. Exported as default (`FileSystem` in `packages/fs/fs/src/index.ts`).
- **Provider** package = concrete subclass registered under the same service name (e.g. `packages/fs/fs-local/src/index.ts`), installed as a bundle row.
- **Consumer** package = uses `ctx.fs` / `ctx.get('fs')`.

There are ~60 named services (harvested from `super(ctx, '<name>')` across `packages/*/*/src`):

```
agentDefaultModel agentLoop agentPresets agents agentTeams approval attachments authorization
clientModules codeRuntime commands compaction connection cordisInspect credentials
credentialsController deepseekLlmApiExtensions directoryPicker directoryPickerController
dynamicCordisRunner e2b fileReferences fileUploads fs goals invariants jobs llm lsp
messageFeedback permissionPresets planMode pluginInventory sandbox sandboxPolicy
sessionController sessionFeedback sessionFileReferences sessionPersistence
sessionProjectionCache sessionProjections sessionQuery sessionReferenceResolver sessions
sessionSkillCatalog sessionTelemetry sessionTitle settings settingsController shell shellEnv
skills spillStore storage subagentModelSelection subagents subprocess systemPrompt terminals
tokenMeter toolResultPruner tools typert typertGateway userQuestions web webhookRuntime
webServer workflowEngine workspaceController workspaceFiles workspaceRegistry
```

(plus kernel built-ins `events`, `logger`, `reflect`, `registry`, `loader`, `fiber`.)

### 2.1 Interchangeable providers actually present

| Seam | Providers in repo |
|---|---|
| `fs` | `fs-local`, `fs-sandbox`, `fs-e2b` |
| `shell` | `bash-local`, `bash-sandbox`, `pwsh-local`, `pwsh-sandbox`, persistent variants |
| `sandbox` | `sandbox-local`, `sandbox-windows-acl` (+ `sandbox-policy`) |
| `subprocess` | `subprocess-local`, `subprocess-e2b`, `win32-process` |
| `llm` | `llm-deepseek`, `llm-pi-ai` (+ `llm-retry` wrapper) |
| `subagents` | `subagent-spawn-in-process`, `subagent-fork-in-process`, `subagent-codex`, `subagent-claude-code`, `subagent-acp`, `subagent-dsh-sdk` |
| persistence / storage | `session-persistence-jsonl`, `storage-json`, `storage-sqlite`, `session-query-sqlite` |
| `compaction` | `compaction-basic`, `compaction-tool-result-pruner` |
| `web` | search: `web-search-deepseek`, `web-search-exa`, `web-search-perplexity`; fetch: `web-fetch-http` |
| others | `credentials-local`, `settings-file`, `jobs-local`, `spill-local`, `terminal-bash`, `skill-filesystem`, `lsp-stdio`, `workflow-worker-thread`, `code-runtime-worker-thread`, `attachment-local`, `e2b` (+`fs-e2b`,`subprocess-e2b`) |

### 2.2 Optional services

Repo rule (`packages/AGENTS.md`): optional services are read with `ctx.get(name)` (strict read of the global store), while `ctx.<name>` is reserved for declared injections, because the property proxy is topology-sensitive.

### 2.3 Example seam: filesystem

`packages/fs/fs/src/index.ts` declares `ctx.fs` with `resolve/processPath/fileUrl/contains/stat/lstat/readText/streamText/readBytes/readByteRange/listDir/writeText/editText`, plus events `fs/write-intent`, `fs/edit-intent` (waterfalls for guards) and `fs/observed` (emit). Policy (`fs-observation-policy`), the tool (`tool-fs`, `tool-fs-search`, `tool-str-replace-editor`, `tool-present`), and the providers are all separate packages.

---

## 3. Agent behavior is plugin contributions

### 3.1 Tools

`packages/core/tools/src/index.ts` — the `ToolRuntime` service (`ctx.tools`). Each `tool-*` package registers a `ToolDefinition` (schema + `output` schema/render + `execute`). Enforcement is pluggable through waterfalls on the registry:

- `tools/pre-execute` — allow / deny / ask
- `tools/execute` — around-dispatch (timeout, retry, metrics)
- `tools/post-execute` — accept/replace/block result
- `tools/ptc-dispatch-log` — rewrite the durable logged copy of a `run_code` sub-dispatch
- `tools/result` — observe frozen final outcome (emit)
- `tools/change` — registry mutation notification (emit)

So approval, per-tool timeout (`guard/timeout-policy`), spill-to-disk (`spill-*`), and truncation (`compaction-tool-result-pruner`) are plugins wrapping the pipeline, not special cases in a runner.

### 3.2 System prompt

`packages/core/system-prompt/src/index.ts` — `ctx.systemPrompt`. Plugins contribute via `section()`, `context()`, `tools(provider)`, `variable(name, provider)`, and the `assemble()` waterfall. Persona, plan-mode section, runtime context, skill catalog, etc. are all contributors.

### 3.3 The loop's extension points

`packages/core/agent/src/runtime-types.ts` — the loop exposes events, deliberately not forking:

- `agent/pre-step` (waterfall) — reject/replace messages entering a step
- `agent/request` (waterfall) — replace the frozen `LlmCallConfig`
- `agent/request-error` (waterfall) — own retry/recovery
- turn-close (serial) — object by steering
- `agent/session-start` (emit)
- `agent/assistant-stream`, `agent/inbox/...` (emit)

Repo rule: *"**Plugins, not loop changes**: new behavior goes on documented extension points; changing `agent-loop` requires updating docs/architecture.md."*

### 3.4 Behavior plugins (examples)

`guard/repeat-tool-reminder`, `guard/timeout-policy`, `compaction/*`, `spill/*`, `plan/plan-mode`, `goal/*`, `todo/tool-todo`, `workflow/*`, `workflow/tool-ralph`, `skill/*`, `subagent/*`.

---

## 4. Per-session pluggability: agent presets

`packages/preset/agent-presets/` mounts **a whole `agent.cordis.yml` composition per agent** under an isolated scope.

- Presets live at `packages/preset/agent-presets/presets/<name>/agent.cordis.yml` (`cordis`, `minimal`, `ptc`, `standard`).
- `mount.ts`:
  - `mountPreset(agentCtx, preset)` refuses an unscoped context.
  - After mount it audits: **no row may stay inactive** (`inactiveRows`) and **no row may publish a service into the root realm** (`leakedServices`) — a preset service must sit behind an `isolate` realm, or it would be process-global and collide across sessions.
  - Bare specifiers resolve from the harness base, relative ones from the preset directory (`PresetTree.import`).
  - Preset trees never write back (`PresetTree.write` is a no-op).
- `livePresetMounts()` / `standingMountFor()` / `serviceForAgent()` provide read addressing for cross-session RPC.

`presets/standard/agent.cordis.yml` shows the two planes explicitly: host owns registries, sandbox/approval, persistence, model route; the preset owns the per-agent tools and prompt sections, grouping service rows under `cordis:group` + `isolate` (e.g. `planMode: true`, `compaction: true`, `workflowEngine: true`).

**Net:** two agents in one process can have different tool catalogs, plan-mode state, compaction, and workflow engines, composed live.

---

## 5. Scoping primitive

`packages/core/scope/src/index.ts` — mints an opaque `ScopeKey`, tags a context via `createScope(ctx, key)`, and routes events with the `Scoped<T>` carrier. One relation (`scopeParents`) powers both directions:

- registration views inherit **down** (a child scope sees ancestor layers — `ScopedLayers`)
- event admission extends **up** (a listener on an ancestor key sees descendant events)

This is what makes per-agent registry layers and per-agent event routing correct.

---

## 6. The system plugs into itself (self-modification)

`packages/extensions/`:

- **`tool-cordis`** — the model-facing tools (`cordis_define`, `cordis_run`, inspect, etc.) plus a generated `api-catalog.ts` that describes the live service API to the model.
- **`cordis-host-runner`** — `DynamicCordisRunnerService` (`ctx.dynamicCordisRunner`): the agent can **define, run, update, stop, and remove Cordis plugins at runtime**, with:
  - immutable package versions per plugin, session-owned,
  - a **sandboxed VM** for the host half (`sandbox.ts`, `vmTimeoutMs` config, `precheckCode`),
  - a client half gated by **human approval** (`cordis/request-run` event),
  - failures steered back into the model's next step (`agent.steer(...)`),
  - a `cordis:` host/client source split with a `handle(method, fn)` bridge.
- **`cordis-client-runner`** — the browser half that evaluates and renders dynamic client plugins.
- **`ui-cordis`** — client UI for the plugin inventory/panel.

There is no separate "self-modification" package directory; this is where the AGENTS.md mention resolves.

---

## 7. Client / UI pluggability

- `packages/client/ui-*` — each UI package is a plugin contributing React panels into named **slots**; `packages/client/ui-renderer/src/client/registry.ts` defines `SlotRegistry` (`ctx.slots`).
- A browser plugin declares its browser half in its manifest: `"dsh": { "client": ... }`, discovered by scanning composed packages.
- `scripts/verify-cordis-config.ts` (`validateClientHalvesDeclared`) rejects a package that exports `./client` without `dsh.client` (silently unserved) or vice-versa.

---

## 8. External extension bridges

`packages/hooks/`:

- `hook-protocol` — shared Claude Code / Codex hook wire protocol (matcher engine, stdin/exit-code/stdout codec, multi-hook merge, `hook/*` session events).
- `hooks-claude-code`, `hooks-codex` — bridge plugins that run an external `hooks.json` on the harness's interception seams.

---

## 9. Manifest fields that make packages loadable/composable

Observed in `package.json` files and enforced by scripts:

| Field | Meaning |
|---|---|
| `dsh.bundle.patch` | this package is a bundle; path to its `cordis.patch.yml` |
| `dsh.profile.bundles` / `dsh.profile.patchReload` | profile layer list + reload policy |
| `dsh.client` | this package ships a browser half |
| `exports["./invariant"]` | optional runtime-invariant companion |

Static gates: `scripts/verify-cordis-config.ts` (Loader metadata + plugin resolution + source-plane paths + client halves + preset/host plane separation), `verify-package-invariants`, `verify-export-jsdoc`, etc.

---

## 10. What is *not* pluggable (honest boundary)

1. **The kernel** (Cordis, the loader) is pinned vendored source; not a plugin.
2. **The capability *set* is compile-time.** You swap providers and compose rows freely, but a genuinely new kind of pluggability needs a new Service Definition + consumers. The "complete triad" rule enforces this.
3. **Security invariants and protocol constants are deliberately fixed.** Repo rule: *"Protocol constants, external specs, and security invariants stay fixed."*
4. **No hardcoded tunables**; deployment variation must be a validated `Config` field, not a `DEFAULT_*` constant.
5. **Composition constraints are real:** last-write-wins per row id; a row belongs to exactly one plane (host vs preset), enforced statically.
6. **Dynamic self-modification is bounded:** session-owned, VM-sandboxed, approval-gated; not an unrestricted marketplace.

---

## 11. One-line summary

The claim is literal: a tiny DI/lifecycle kernel; **everything else — capabilities, providers, tools, prompt content, loop behavior, UI panels, and even plugins authored at runtime — is a row or a plugin contributing to a registry**, composable per process and per session, swappable by editing config/patch YAML rather than code.

---

## 12. Key file map

| Concern | File |
|---|---|
| Plugin shapes / inject | `vendor/cordis/src/registry.ts` |
| Service registration | `vendor/cordis/src/service.ts` |
| Fiber lifecycle / effects | `vendor/cordis/src/fiber.ts` |
| Context / isolate / intercept | `vendor/cordis/src/context.ts` |
| Loader entry + groups | `vendor/loader/src/index.ts`, `config/{entry,group,isolate}.ts` |
| Patch/boot model | `apps/cli/src/profile-boot.ts`, `packages/boot/app-boot/src/{index,profile}.ts` |
| Host composition example | `packages/bundle/base/cordis.patch.yml` |
| Seam example (fs) | `packages/fs/fs/src/index.ts`, `packages/fs/fs-local/src/index.ts` |
| Tools pipeline | `packages/core/tools/src/index.ts` |
| Loop extension points | `packages/core/agent/src/runtime-types.ts` |
| Preset mount + audit | `packages/preset/agent-presets/src/mount.ts`, `presets/standard/agent.cordis.yml` |
| Scoping | `packages/core/scope/src/index.ts` |
| Self-modification | `packages/extensions/cordis-host-runner/src/index.ts`, `packages/extensions/tool-cordis/src/` |
| Composition gate | `scripts/verify-cordis-config.ts` |

---
---

# Addendum (second pass): mechanisms and the design record

The sections above are the architecture-level account. This addendum records the deeper mechanisms I studied afterward — the patch algorithm, hot reload, the supported third-party install path, boot enforcement, the typed host↔client wire, the client plane, the self-modification sandbox, and the project's own decision records (Agent Notes / postmortems) that explain and bound the "everything is pluggable" claim.

## 13. The patch algorithm, exactly

`vendor/include/src/index.ts` — `applyEntryPatches(data, patches, warn)` is `THE` patch semantics, shared by mounting (`applyPatches`) and offline tooling (`--dump-config`) so a dump can never drift from what boots.

Step by step:

1. `data = structuredClone(data)` — the input is **never mutated** and the result is always detached (even with zero patches). Rationale in the code: patching shared entry objects would bake earlier values into the cached parse, so repeated application (config hot-reload) could never revert a removed or changed patch.
2. Build an `id → entry` map, recursing into `group` rows (`entry.group && Array.isArray(entry.config)`).
3. For each patch in order:
   - **`insert` with `id`** — the target must exist and must be a `group`, or the patch warns and is skipped; `insert` rows are pushed into `target.config`.
   - **`insert` without `id`** — appended to the top-level list.
   - After either, `buildMap(insert)` indexes the inserted rows, so a **later patch in the same flat list can target a row an earlier layer inserted**.
   - **Non-insert patch** — `id` is required; the target must exist; an optional `name` must match the row's name (else warn+skip); then every key in the patch except `id` is assigned onto the target. **Each provided key replaces the target's value wholesale** — `config` is replaced, not deep-merged. Unmentioned keys are preserved.
   - A patch matching nothing **warns and is skipped, never throws** (so one overlay can be shared across surfaces that don't all have the row).

`PatchOptions` = `{ id?, insert?, name?, config?, group?, disabled?, inject?, intercept?, isolate?, ... }`.

Related:
- `entryListSchema` is the exported YAML dialect (`!!js` scalars ↔ `{ __jsExpr }` nodes) so config tooling parses/prints exactly the dialect the include mounts.
- `Include` (the file-backed `EntryTree`) resolves its `path` against `ctx.baseUrl`, sets its own baseUrl to the file's directory, serializes applies through an `enqueue` queue (the group's transactional `update` is not reentrant), and writes back atomically (`tmp` + `rename`, retrying `EACCES/EBUSY/EPERM`) debounced on a `setTimeout(0)`.
- `EntryTree` (`vendor/loader/src/config/tree.ts`) additionally: `ensureId` (random 8-hex when missing), `resolve(id)` with `:`-separated nested ids, `create/remove/update` with rollback on failure, and `import(name)` where `cordis:` names resolve to loader `builtins` (`cordis:include`, `cordis:group`) rather than modules.

## 14. Hot reload (HMR), exactly

`vendor/hmr/src/index.ts` — service `ctx.hmr`, `inject = ['loader','timer']`, requires Node `--expose-internals` (it uses the internal `ModuleLoader`).

Two independent reload paths:

- **Config reload** — `registerConfig(filename, refresh)` watches one exact path (for example a profile's `cordis.patch.yml`). On add/change/unlink it runs `refresh` serially; a change is coalesced while a refresh is in flight (`ConfigRefresh.dirty`). A refresh failure is logged and emitted as `hmr/config-update-failed` (parallel mode) — it never crashes the app. `watchUserPatches` (app-boot) uses this to reapply the user patch layer transactionally.
- **Module reload** — watches the configured `root` directories. Changed files are classified: `accepted` (directly stashed, or a dependent of an accepted file) vs `declined` (the CLI entrypoint's whole dependency closure = "externals", or files whose dependents are all declined). It then:
  1. Maps each loader entry name → resolved file URL; a plugin whose dependency tree contains an accepted file is a reload candidate.
  2. Backs up and clears the changed files from Node's ESM `loadCache` **and** `require.cache` (handling Node 22/23 vs 24 `LoadCache` differences via `Map.prototype.delete`).
  3. Re-imports the plugin entry modules; for each old fiber, re-registers the new plugin under the same parent context with the same config (`registry.plugin(newPlugin, oldFiber._config)`), keeping the entry link.
  4. On any failure, rolls the caches back and re-registers the old plugins, then emits `hmr/reload`.
  - A change inside the framework's own dependency closure triggers a **full reload** via `loader.exit()` (process restart).

Config-only live reload is what `profile-boot.ts` installs for the user patch layer when no HMR module root is configured: it mounts `cordis-plugin-timer` + a watch-only `cordis-plugin-hmr` with `root: []`. The base bundle ships `hmr` **disabled by default**; the web profile enables it.

## 15. The supported third-party plugin path: `dsh plugin`

`apps/cli/src/plugin.ts` — `dsh plugin --profile <name> <pnpm args...>` is a **thin pnpm forwarder**, not a marketplace:

1. Initialize the profile on first use (template bundles + patch layer + a hoisted pnpm workspace file).
2. Run `pnpm <args...>` with `cwd` = the profile directory. Relative path specs (`.`, `../x`, `file:`/`link:`) are re-anchored to the invoking directory so `add .` from a plugin checkout doesn't self-link the profile.
3. **Reconcile** `dsh.profile.bundles` against the installed state: any dependency that resolves to a package declaring `dsh.bundle` joins the layer stack (appended in dependency order); a dependency that stops declaring one leaves it. Template bundles (in-box) are never touched. A newly added bundle-less dependency gets one orientation warning.

So installing a plugin = `npm/pnpm install` of a package that declares `dsh.bundle.patch`, then the profile's bundle list is updated; the patch file itself is data, not an API. Reconciliation is by installed state, not dependency diff, so a later version that *gains* `dsh.bundle` activates automatically.

## 16. Boot enforcement and the environment boundary

`packages/boot/app-boot/src/index.ts` — `boot()`:

- Creates a `Context`, sets `baseUrl`, `provide('dshHomePath', dshHomePath)` (so `!!js` config expressions can call `dshHomePath(...)`), mounts the `Loader`, runs the host `prepare`, mounts the root `cordis:include` (pinned id `include`; also registers `cordis:group` as a builtin so out-of-tree presets can use groups), awaits the loader, then audits.
- **Enforcement** — `assertEntriesLoaded` / `assertEntriesActivated`: after settling, any enabled entry with no fiber, in `FAILED`, or still `PENDING` (naming the unresolved services) fails the whole boot with a labelled error. A misconfigured composition fails loud, never silently. `installFailLoud` additionally turns a late unhandled plugin-init rejection into one stderr diagnostic + `exit(1)`, with an awaitable terminal-release hook (2 s cap).
- **Environment boundary** — `.env` loading is layered (inherited env > project dir > Harness home) and refuses bootstrap-only names from files: `PATH`, `HOME`, `NODE_OPTIONS`, `LD_PRELOAD`, `BASH_ENV`, `PYTHONPATH`, `GIT_*`, `EDITOR`, `SSL_CERT_*`, TLS/proxy vars, and any `DSH_`/`XDG_`/`DYLD_`/`BASH_FUNC_` prefix. The home `.env` may set proxy names (the user's own file, doesn't travel with a clone). Rationale: a `.env` arriving with a cloned repository must not choose how the process starts, where its code loads from, or how it reaches the network.
- `--dump-config` uses `renderConfigDump`, which applies the **same** `applyEntryPatches` per cumulative layer and annotates each output row with its origin and which layers patched it; patch-parse errors throw, a patch targeting a missing row only warns. `anchorInsertedPluginNames` rewrites relative row names to file URLs anchored beside the patch file.

## 17. Typert: a plugin's typed wire face is a build artifact

`packages/typert/*` — the host↔client RPC/type system.

- **Protocol** (`typert/protocol`): `@Remote` / `@Remote({mode:'stream'})` / `@RemoteScope` decorators store a versioned descriptor on the class prototype; `TypertRemoteService` binds a Cordis service key to a Gateway wire namespace; `remoteMethods(service)` reads the markers; the Gateway validates each invocation's parameters/result codecs.
- **Loader** (`typert/loader`): when a loader entry mounts, it resolves that package's `./typert` export and registers its generated `TYPERT` manifest into `ctx.typert`; the registration is withdrawn on unmount. A malformed contributor among already-loaded entries aggregates into one loud throw; in steady state a broken package is contained to a logged error. Manual `ctx.typert.register()` covers hand-written contributions.
- **Generator** (`typert/generator`): analyzes the TS project and emits the model/reflection artifacts and call bindings.

**Consequence for pluggability:** a plugin that exposes a service or events over the client wire does so by *mounting*; the typed face registers and unregisters with the plugin's fiber. Nothing hand-wires the wire.

## 18. The client plane (browser) is a plugin plane too

`packages/client/*` + `apps/web` + `packages/client/web`. Agent Note `2026-08-15-client-shells-and-dynamic-packages.md` defines the layers:

| Layer | Members | Form |
|---|---|---|
| Web compilation shell | `apps/web` | owns `index.html`, Vite config, dist, assets |
| Startup kernel | `packages/client/web` | plain-DOM boot page, module wiring, Cordis settlement, renderer handoff; no `dsh.client` row |
| Static assembly libraries | Cordis, `ui-primitives`, `ui-slots` | ESM `lib/index.js`, merged/chunked by Vite; not Loader entries |
| Module bootstrap | `packages/client/modules` | dynamic package with one `lib/client.js`; factory delivered early |
| Dynamic client packages | connection, `ui-renderer`, theme, feature UIs | declare `dsh.client`, emit self-registering `lib/client.js`, remain host-graph entries |

- A package's browser half is declared by `dsh.client` in its manifest; `verify-cordis-config` rejects a package that exports `./client` without `dsh.client` (or vice-versa) because it would compose, activate, and contribute nothing.
- Shared module requests have exactly two suppliers: the named dynamic package row (or its `/client`), or an exact key in the shell's static module table. No general provide/alias mechanism. Graph composition rejects malformed/missing/self/cyclic requests and orders suppliers before consumers.
- The serving order is fixed: install `window.__ModuleLoader__` in queue mode → preload content-addressed combos → execute blocking bootstrap combos → assign `window.__DSH_BOOT__` → execute Vite main. The kernel then creates all Loader entries, awaits Cordis quiescence, requires every fiber ACTIVE, and calls `ctx.uiRenderer.mount(container)`.
- UI plugins contribute React panels into **slots** via `SlotRegistry` (`packages/client/ui-renderer/src/client/registry.ts`).

## 19. The self-modification sandbox: what it is and is NOT

`packages/extensions/cordis-host-runner/src/sandbox.ts`. The dynamic package's **host half** is evaluated in a fresh `node:vm` context whose globals are:

- a package-tagged write-through `console`,
- `harness` helpers (`handle` for Client RPC, `defineTool`, `registerTool`),
- `btoa`/`atob`/`TextEncoder`/`TextDecoder` (a bare vm lacks them),
- a restricted `ctx` (`get/on/provide/effect`),
- **callable traps** for the Node APIs the sandbox withholds: `require`, `setTimeout`/`setInterval`/`setImmediate`/`clearTimeout`/`clearInterval`, `fetch`. Calling one throws a message naming the cordis alternative (`ctx.fs`, `ctx.web`, `ctx.bash`, the timer service).

Crucially, the module's own header says this *"keeps cooperative packages inspectable and disposable but is not containment: host-realm helper functions remain an escape route."* Additional honest limits:

- Code runs as the body of an async function in **plain JavaScript, not TypeScript** (`new Function` gate + `vm.Script` prettifier for error context).
- `vmTimeoutMs` bounds only the **synchronous** portion; an async body escapes it (stated as acceptable under the module's trust stance).
- The **client half** is evaluated by a separate browser-side runner in a closure; it is where human approval gates activation (`cordis/request-run`); failures are steered back to the model (`agent.steer(...)`).

So the real containment posture for model-authored code is: cooperative sandbox + lifecycle/disposal discipline + client-activation approval; not a security boundary. Actual strong confinement lives elsewhere (workspace sandbox / landlock, approval, permission presets).

## 20. The project's own rationale (Agent Notes / postmortems)

The repo carries ~618 implemented Agent Notes and 1,257 archived ones (`.agents/notes/**`), plus `docs/postmortem/*`. The ones that bear directly on the pluggability thesis:

- **`2026-06-11-microkernel-event-taxonomy.md`** — states the product principle *"everything is a plugin"* and its realization: pure Cordis event taxonomy with deliberate dispatch modes. **waterfall** for interception/transform/recovery (`agent/pre-step`, `agent/request`, `agent/request-error`, `tools/pre-execute|execute|post-execute`, `llm/stream`, `system-prompt/assemble`); **serial** for ordered checkpoints (`agent/turn-stopping`); **parallel** for mandatory fan-out (`session/flush`); **emit** for notifications (`tools/result`, lifecycle, inbox). The event vocabulary lives in contract packages; **`agent-loop` is the only concrete loop plugin and is itself swappable — nothing outside it may depend on it.**
- **`2026-06-13-capability-seams.md`** — the canonical rationale for the Definition/Provider/Consumer triad: the three concerns change at different rates; separating them means swapping a local executor for a sandboxed one never churns the model-facing tool schema. Roles split into separate packages when they evolve independently, but **not preemptively** (an LLM seam folds Definition+Consumer because the consumer is the loop itself, not a swappable schema surface). Rejects a coincidence with `@cordisjs/plugin-capability` (a permission/capability-*security* service, a different axis).
- **`2026-08-03-per-session-agent-presets.md`** — the two-plane split (Host vs Agent). Rationale: "the composition that decides what an agent *is*" was process-fixed; the fix reuses the existing agent scope rather than adding a loader tier. Hard-won constraints recorded there:
  - a preset may not publish into the root service realm (process-global; the second session collides);
  - an entry-local `isolate` realm is invisible to the agent's own scope, so a consumer left outside its provider's group silently resolves the host registry;
  - a preset file is an input, never a persistence target (`EntryTree.write` would truncate it to `[]` on teardown);
  - a plugin that looks itself up in a global registry breaks inside a preset (`ctx.tools.register()` files into the *calling* scope) — it must hold its own registration;
  - a service with a consumer outside the agent plane cannot move into a preset (the `subagents` registry is host-plane; the preset contributes only delegation tools);
  - a preset's bare package names must resolve from the harness, not the preset dir;
  - switching is allowed only while a session is blank (`agent-preset-locked` after a turn);
  - preset authoring is a privileged RPC (reading = reconnaissance, writing = arbitrary capability);
  - measured cost: ~3 ms / ~600 KB per session mount; a live agent holds ~1.31 MB on `standard`; growth is linear and disposal reclaims it — but **nothing currently disposes an agent** (host retains every session; idle eviction is a TODO).
- **`2026-08-30-jsonl-only-session-persistence.md`** — the opposite direction: a **deliberate reduction** of pluggability. The abstract `ctx.sessionPersistence` definition stays backend-neutral so an out-of-tree provider can still implement it, but the repo ships/tests exactly one first-party provider (JSONL) and removed the SQLite one to collapse the durable-format/CI/platform/migration surface. **"Pluggable" is an architectural property, not a mandate to ship many providers.**
- **`docs/postmortem/0002-js-expression-disabled-filesystem-tools.md`** — the `!!js` footgun. Symptoms: `disabled: !!js ...` on a filesystem row left the expression object truthy forever, so filesystem tools were permanently disabled, and snapshot refresh accepted `UNKNOWN_TOOL` as expected output. Root cause: at the time, `!!js` was interpolated only under `config`, not metadata. Current Cordis interpolates both `config` and `disabled` (see `Entry._resolveConfig` / `disabledOf`), and `verify-cordis-config` now **permits `!!js` exactly under `config` and `disabled` and rejects it anywhere else in entry metadata** — the static gate is the postmortem's guardrail.

## 21. Corrections / refinements to the first-pass account

- **Current `!!js` rule (refines §1.5):** `!!js` is evaluated only under a row's `config` and under `disabled`; all other entry metadata stays literal. Earlier versions evaluated only `config` (postmortem 0002). `interpolate` evaluates via `new Function('ctx','expr','with (ctx) { return eval(expr) }')` — config expressions are **trusted code in the loader's context scope, not sandboxed**.
- **"Everything is pluggable" is a stated product principle (refines §0/§11):** the Agent Note names it literally, realized as the Cordis event taxonomy; the single concretely-fixed exception it calls out is that `agent-loop` is the only loop *plugin* yet nothing outside it may depend on it.
- **The dynamic-plugin sandbox is not a security boundary (refines §6):** it is a cooperative redirect + lifecycle/disposal container; the code says so explicitly. Approval gates the client half; strong confinement is elsewhere.
- **Pluggability is sometimes deliberately reduced (new, §20):** abstract definitions stay backend-neutral while first-party providers can be removed to cut the test/format surface.
- **The patch algorithm is single-pass over one flat list (refines §1.3):** inserted rows are indexed immediately, so a later patch in the same flat list can target an earlier layer's insert; `config` is replaced, not merged; unmatched patches warn rather than throw at apply time (but malformed patch *files* throw at parse time).

## 22. Addendum file map

| Concern | File |
|---|---|
| Patch algorithm | `vendor/include/src/index.ts` (`applyEntryPatches`) |
| Entry tree ops | `vendor/loader/src/config/tree.ts` |
| `!!js` evaluation | `vendor/loader/src/config/utils.ts` |
| HMR | `vendor/hmr/src/index.ts` |
| Plugin install CLI | `apps/cli/src/plugin.ts` |
| Boot + audits + env boundary | `packages/boot/app-boot/src/index.ts` |
| Typert protocol / loader / generator | `packages/typert/{protocol,loader,generator}/src/` |
| Client planes / build faces | `.agents/notes/implemented/architecture/2026-08-15-client-shells-and-dynamic-packages.md`, `packages/client/**` |
| Self-mod sandbox | `packages/extensions/cordis-host-runner/src/sandbox.ts` |
| Event taxonomy rationale | `.agents/notes/implemented/architecture/2026-06-11-microkernel-event-taxonomy.md` |
| Seam rationale | `.agents/notes/implemented/architecture/2026-06-13-capability-seams.md` |
| Two-plane rationale + constraints | `.agents/notes/implemented/architecture/2026-08-03-per-session-agent-presets.md` |
| Deliberate de-plugging | `.agents/notes/implemented/simplification/2026-08-30-jsonl-only-session-persistence.md` |
| `!!js` incident | `docs/postmortem/0002-js-expression-disabled-filesystem-tools.md` |
