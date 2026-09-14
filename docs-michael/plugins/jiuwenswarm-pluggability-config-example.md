# JiuwenSwarm end-state config examples (after the plugin rewrite)

Companion to `jiuwenswarm-pluggability-rewrite.md`. This file is what the configuration looks like **after** the migration: no `_build_agent_rails` list, no `_TOOL_BUILD_NAMES`, no `config.yaml` blob with ~80 `update_*` writers. The product is composed from rows; every capability is resolved by `type`.

Legend for a row (the loader entry model):

```yaml
- id: <stable id, the patch target>       # later layers address this
  type: <plugin type = entry-point name / built-in id>
  config: { ... }                          # validated by the plugin's Config model
  enabled: "<expr>"                        # optional; default true
  disabled: "<expr>"                       # alias of enabled: false
  when: "<expr>"                           # optional precondition
  inject: [<service>, ...]                 # optional explicit dependency (usually declared in the plugin)
  group: true                              # this row's config is a nested entry list
  isolate: { <service>: true | "<label>" } # subtree service realm
  intercept: { <service>: <config> }       # subtree service config
  insert: [ <row>, ... ]                   # patch: add rows (top-level or into a group)
```

Expression syntax: `{{ ... }}` is evaluated in a restricted namespace (`env`, `home`, `cwd`, `platform`, `config`) at row activation — the safe replacement for the old `resolve_env_vars` + ad-hoc getters. It is only honored under `config`, `enabled`, `disabled`, `when`; all other metadata is literal.

Precedence: `in-box bundle → distribution bundle → user harness.yaml → --patch overlays`; per `id`, last layer wins; a patch replaces the row's whole `config` unless it uses `insert`.

---

## 1. Distribution and discovery files

### 1.1 `agent-tools/pyproject.toml` — how the loader finds plugins

```toml
[project]
name = "agent-tools"
version = "1.0.0"
requires-python = ">=3.11"
dependencies = ["openjiuwen>=2"]          # kernel + definitions only

[project.optional-dependencies]
web      = ["httpx", "trafilatura"]
feishu   = ["lark-oapi"]
otel     = ["opentelemetry-sdk", "opentelemetry-exporter-otlp"]
redis    = ["redis"]
vector   = ["numpy"]

# Plugin packages: one entry point per plugin. `name` == the composition `type`.
[project.entry-points."openjiuwen.plugins"]
llm              = "agent_tools.llm:plugin"
llm_deepseek     = "agent_tools.llm.deepseek:plugin"
llm_retry        = "agent_tools.llm.retry:plugin"
memory           = "agent_tools.memory:plugin"
retrieval        = "agent_tools.retrieval:plugin"
mcp              = "agent_tools.mcp:plugin"
skill            = "agent_tools.skill:plugin"
marketplace      = "agent_tools.marketplace:plugin"
channel_web      = "agent_tools.channels.web:plugin"
channel_feishu   = "agent_tools.channels.feishu:plugin"
observability_otel = "agent_tools.observability.otel:plugin"

# Element-level contributions: extend the groups agent-core already reads.
[project.entry-points."openjiuwen.rail"]
budget_notice   = "agent_tools.rails.budget_notice:BudgetNoticeRail"
task_planning   = "agent_tools.rails.task_planning:TaskPlanningRail"
lsp             = "agent_tools.rails.lsp:LspRail"
[project.entry-points."openjiuwen.tool"]
bash        = "agent_tools.tools.shell:BashTool"
web         = "agent_tools.tools.web:WebTool"
skill       = "agent_tools.tools.skill:SkillTool"
[project.entry-points."openjiuwen.subagent"]
explore     = "agent_tools.subagents.explore:build_explore"
code        = "agent_tools.subagents.code:build_code"
```

### 1.2 `agent_tools/llm/deepseek/plugin.toml` — plugin metadata

```toml
[plugin]
id = "agent-tools.llm.deepseek"
version = "1.0.0"
api = "1"                                  # kernel plugin API major
description = "DeepSeek chat-completions provider for ctx.llm"
provides = ["llm.deepseek"]
requires = ["llm>=1", "credentials>=1", "settings>=1"]

[[config]]
# The Config model is enforced by the kernel before apply(). Placeholders are literal here.
apiKeyEnv = { type = "string", default = "DEEPSEEK_API_KEY" }
baseUrl   = { type = "string", default = "https://api.deepseek.com" }
model     = { type = "string", default = "deepseek-chat" }
```

### 1.3 `agent_tools/channels/feishu/plugin.toml` — a channel plugin

```toml
[plugin]
id = "agent-tools.channels.feishu"
version = "1.0.0"
api = "1"
description = "Feishu/Lark channel"
provides = ["channel.feishu"]
requires = ["gateway>=1", "session>=1"]

[[config]]
appId     = { type = "string" }
appSecret = { type = "string", secret = true }
```

---

## 2. Host plane — the process composition

### 2.1 In-box bundle: `jiuwenswarm/resources/harness.default.yaml`

```yaml
# Applied as ONE layer over the empty root. Every row is a plugin resolved by `type`.
# Order carries no load semantics: activation is service-availability driven.

- id: kernel
  type: openjiuwen.kernel

# ── model ───────────────────────────────────────────────────────────────────
- id: llm
  type: openjiuwen.llm                 # definition/registry service
- id: llm-deepseek
  type: agent-tools.llm.deepseek
  config:
    apiKeyEnv: DEEPSEEK_API_KEY
    baseUrl: "{{env.DEEPSEEK_BASE_URL}}"
    model: "{{env.JIUWENSWARM_MODEL || deepseek-chat}}"
- id: llm-retry
  type: agent-tools.llm.retry
  config: { maxAttempts: 5, baseDelayMs: 500 }

# ── config surface ──────────────────────────────────────────────────────────
- id: settings
  type: agent-tools.settings.file
  config: { path: "{{home}}/settings.yaml" }
- id: credentials
  type: agent-tools.credentials.local

# ── durable state ───────────────────────────────────────────────────────────
- id: storage
  type: agent-tools.storage.json
  config: { root: "{{home}}/storages" }
- id: session-store
  type: agent-tools.session.jsonl
  config: { root: "{{home}}/sessions" }
- id: session-query
  type: agent-tools.session.query-sqlite
  config: { path: ":memory:", openAt: never }

# ── observability ───────────────────────────────────────────────────────────
- id: observability-otel
  type: agent-tools.observability.otel
  enabled: "{{env.JIUWENSWARM_TELEMETRY_DISABLED == ''}}"
  config:
    mode: "{{env.JIUWENSWARM_TELEMETRY_MODE || FEEDBACK_ONLY}}"
    exporter: { url: "{{env.JIUWENSWARM_OTLP_URL}}" }
    shutdownTimeoutMillis: 3000

# ── execution world ─────────────────────────────────────────────────────────
- id: sandbox
  type: agent-tools.sandbox.local
- id: sandbox-policy
  type: agent-tools.sandbox.policy
  config:
    mode: "{{env.JIUWENSWARM_PERMISSION_MODE || workspace-write}}"
    workspaceRoot: "{{cwd}}"
- id: fs
  type: agent-tools.fs.sandbox
- id: shell-bash
  type: agent-tools.shell.bash
  disabled: "{{platform == 'win32'}}"
  config: { timeoutMs: 60000 }
- id: shell-pwsh
  type: agent-tools.shell.pwsh
  disabled: "{{platform != 'win32'}}"

# ── capabilities ────────────────────────────────────────────────────────────
- id: mcp
  type: agent-tools.mcp
- id: skill
  type: agent-tools.skill
- id: skill-filesystem
  type: agent-tools.skill.filesystem
- id: memory
  type: agent-tools.memory
  config: { backend: lite }
- id: retrieval
  type: agent-tools.retrieval
- id: compaction
  type: agent-tools.compaction.basic
- id: permissions
  type: agent-tools.permissions.presets
  config:
    mode: "{{env.JIUWENSWARM_PERMISSION_MODE || workspace-write}}"
    presets:
      read-only:          { sandbox: read-only,          approval: ask }
      workspace-write:    { sandbox: workspace-write,    approval: ask }
      danger-full-access: { sandbox: danger-full-access, approval: never }

# ── the registries the presets contribute into ──────────────────────────────
- id: tools
  type: openjiuwen.tools
- id: system-prompt
  type: openjiuwen.system-prompt
- id: agents
  type: openjiuwen.agents
- id: agent-loop
  type: openjiuwen.agent-loop

# ── product / first-party plugins ───────────────────────────────────────────
- id: gateway
  type: jiuwenswarm.gateway
- id: channels-core
  type: jiuwenswarm.channels.core          # web/tui/acp transports shipped in-box
- id: marketplace
  type: agent-tools.marketplace
- id: equipment
  type: jiuwenswarm.equipment              # the product equipment manager over the hub
- id: agent-presets
  type: jiuwenswarm.agent-presets
  config: { default: standard, modeSelectionEnabled: true }
- id: team
  type: agent-tools.team
- id: adapter
  type: jiuwenswarm.adapter.harness
```

### 2.2 User layer: `$JIUWENSWARM_HOME/harness.yaml`

```yaml
# Applied after the bundle, before --patch overlays. Overrides by id and adds rows.

- id: llm-deepseek
  config:
    model: deepseek-flash

# Turn a capability off without touching code or the bundle.
- id: memory
  enabled: false

# Bind a personal IM channel.
- insert:
    - id: channel-feishu
      type: agent-tools.channels.feishu
      config:
        appId: "{{env.FEISHU_APP_ID}}"
        appSecret: "{{env.FEISHU_APP_SECRET}}"

# Give one subtree its own memory backend without touching the root.
- id: retrieval
  intercept:
    memory: { backend: graph }
```

### 2.3 Overlay: `--patch ./local.overlay.yaml`

```yaml
# Highest precedence among the user layers.
- id: sandbox-policy
  config: { mode: danger-full-access }     # whole config replaced, per patch semantics

- id: channel-feishu
  disabled: true                           # mute the channel for this run
```

### 2.4 Per-mode host delta (optional): `resources/harness.team-leader.yaml`

```yaml
- id: channel-remote
  type: agent-tools.channels.remote
  config: { listen: "tcp://0.0.0.0:9100" }
- id: team
  config:
    lifecycle: persistent
    spawn_mode: inprocess                  # leader owns in-process members
- id: observability-otel
  config: { mode: ALWAYS }
```

---

## 3. Agent plane — per-session presets

### 3.1 `resources/agents/standard/agent.yaml`

```yaml
# Mounted per session under an isolated scope. A row here may only register into the
# session's layer; publishing a process-global service is rejected at mount.

model:
  provider: deepseek
  name: deepseek-chat
  reasoningEffort: medium

persona:
  - { name: identity, file: persona/IDENTITY.md, priority: 10 }
  - { name: soul,     file: persona/SOUL.md,     priority: 20 }
  - { name: user,     file: persona/USER.md,     priority: 30 }

tools:
  - type: agent-tools.tools.bash
  - type: agent-tools.tools.fs
  - type: agent-tools.tools.fs-search
  - type: agent-tools.tools.str-replace-editor
  - type: agent-tools.tools.web
    config: { fetch: true, searchTimeoutMs: 60000 }
  - type: agent-tools.tools.skill
  - type: agent-tools.tools.todo
    config: { allowParallelInProgress: true }
  - type: agent-tools.tools.ask-user

rails:
  - type: agent-tools.rails.task-planning
  - type: agent-tools.rails.budget-notice
    config: { round_ratio: 0.20, token_ratio: 0.15, time_ratio: 0.15 }
  - type: agent-tools.rails.context-headroom
    config: { warnRatio: 0.90 }
  - type: agent-tools.rails.security
  - type: agent-tools.rails.summarize-memory
    enabled: "{{config.memory.enabled}}"   # was modes.*.memory.enabled

subagents:
  - type: agent-tools.subagents.explore
  - type: agent-tools.subagents.plan
  - type: agent-tools.subagents.code
    config: { model: inherit, backgroundMode: continuable }

# A group with an isolate realm: these services are per-agent, not per-process.
- id: compaction
  group: true
  isolate: { compaction: true, toolResultPruner: true }
  config:
    - type: agent-tools.compaction.basic
    - type: agent-tools.compaction.tool-result-pruner
      config: { thresholdChars: 8192, headChars: 4096, tailChars: 1024 }

settings:
  preset:
    default: standard
    modeSelectionEnabled: true
```

### 3.2 `resources/agents/code/agent.yaml` — code profile

```yaml
extends: standard                          # inherit the standard preset, then patch rows

rails:
  - type: agent-tools.rails.code.agent-mode
  - type: agent-tools.rails.lsp
    config: { servers: [python, typescript] }
  - type: agent-tools.rails.code.worktree
  - type: agent-tools.rails.code.project-memory
    enabled: "{{config.memory.enabled}}"
  - type: agent-tools.rails.code.coding-memory
    enabled: "{{config.memory.enabled}}"
  - type: agent-tools.rails.task-planning
  - type: agent-tools.rails.confirm-interrupt
  - type: agent-tools.rails.plan-approval

tools:
  # `extends: standard` tools are kept; these are added.
  - type: agent-tools.tools.web
    config: { fetch: true, free: true, paid: true }
  - type: agent-tools.tools.user-todos
  - type: agent-tools.tools.skill-toolkit
  - type: agent-tools.tools.skill-retrieval
  - type: agent-tools.tools.acp-chat
    disabled: "{{env.ACP_CHAT_ENABLED == ''}}"

subagents:
  - type: agent-tools.subagents.code
  - type: agent-tools.subagents.explore
  - type: agent-tools.subagents.plan
  - type: agent-tools.subagents.statusline-setup
    config: { maxIterations: 8 }

# SDD is an optional rail subtree (was modes.code.sdd.enabled).
- id: sdd
  group: true
  enabled: "{{config.modes.code.sdd.enabled}}"
  config:
    - type: agent-tools.rails.code.design
      config: { stages: [RAS, RDS] }
```

### 3.3 `resources/agents/team/agent.yaml` — team profile

```yaml
extends: standard

rails:
  - type: agent-tools.rails.team.permission
    config: { policy: "{{env.JIUWENSWARM_TEAM_PERMISSION || ask}}" }
  - type: agent-tools.rails.team.blocker-report
  - type: agent-tools.rails.team.skill-evolution
    enabled: "{{config.team.jiuwen_team.enable_skill_evolution}}"
  - type: jiuwenswarm.rails.symphony-orchestration
    enabled: "{{config.symphony.enabled}}"

team:
  lifecycle: persistent
  teammate_mode: build_mode
  spawn_mode: inprocess
  enable_swarmflow: false
  external_cli_agents: []
  external_transport: null
  swarmflow_budget: null                   # null = unbounded
  reliability:
    enabled: true
    monitor_roles: [leader, teammate]
    detectors:
      tool_error:
        enabled: true
        window_seconds: 60.0
        rate_threshold: 5
        consecutive_threshold: 3
      repeat_tool:
        enabled: true
        history_size: 30
        repeat_warn: 10
        pingpong_warn: 10
        loop_block: 20
        global_stop: 30
      model_error:
        enabled: true
        window_seconds: 120.0
        rate_threshold: 3
        consecutive_threshold: 2
      output_length:
        enabled: true
        text_threshold: 32000
        thinking_threshold: 16000
      compaction:
        enabled: true
        window_seconds: 300.0
        frequency_threshold: 3
        drop_ratio: 0.3

subagents:
  - type: agent-tools.subagents.explore
  - type: agent-tools.subagents.plan
  - type: agent-tools.subagents.code
    config: { backgroundMode: continuable }
```

### 3.4 Distributed team host (`config.team.distributed.leader.yaml`)

```yaml
# The leader host: same host bundle plus a remote channel and a transport-backed team.
- id: channel-remote
  type: agent-tools.channels.remote
  config: { listen: "tcp://0.0.0.0:9100", token: "{{env.TEAM_TOKEN}}" }
- id: team
  config:
    lifecycle: persistent
    spawn_mode: remote
    external_transport: agent-tools.team.transport.remote
    external_cli_agents: [codex, claudecode]
```

```yaml
# A teammate host: the same rows minus the leader-only ones, pointed at the leader.
- id: team
  config:
    lifecycle: persistent
    spawn_mode: remote
    external_transport:
      type: agent-tools.team.transport.remote
      config: { connect: "tcp://leader:9100", token: "{{env.TEAM_TOKEN}}" }
```

---

## 4. What the old hardcoded composition becomes

| Old (code / config) | New (data) |
|---|---|
| `interface_deep.py::_build_agent_rails` + `_build_*_rail` | `agent.yaml` `rails:` rows resolved by `agent-tools.rails.*` |
| `interface_deep.py::_get_tool_cards` | `agent.yaml` `tools:` rows resolved by `agent-tools.tools.*` |
| `interface_code.py::_TOOL_BUILD_NAMES` (L402) | `agent-tools/tools/*` entry points + `tools:` rows |
| `agents/swarm/providers/*` (`@harness_element`) | `agent-tools/*` plugins; `registry.py` becomes discovery |
| `config.yaml::modes.<mode>.rails/tools` name lists | `resources/agents/<mode>/agent.yaml` |
| `config.yaml` top-level feature sections | host `harness.yaml` rows (or plugin `Config`) |
| `common/config.py` `update_*_in_config` writers | patch layers / row edits (validated `Config`) |
| `create_adapter(sdk, mode)` if/elif | `adapter` row + entry-point provider |
| `harness_providers::resolve_provider` if/elif | `agent-tools.harness.*` entry points |
| `extensions/{loader,registry}.py` + `extension.yaml` | the kernel loader + `openjiuwen.plugins` entry points |

---

## 5. Boot, in one line

`jiuwenswarm-agentserver` reads the in-box bundle, the user `harness.yaml`, and any `--patch` files; builds a flat row list; discovers plugin `type`s via entry points; validates each row's `config`; mounts the selected rows (activation service-gated); fails loud on an unknown `type` or an unmet dependency; then each session resolves its `agent.yaml` preset under an isolated scope and mounts it. Nothing in that path names a module — only a `type`.

---

## 6. Accounting: where the current `config.yaml` goes

The example above is an **illustrative subset**, not the complete migrated file. The current `config.yaml` is also much smaller than it looks once comments are counted.

`jiuwenswarm/resources/config.yaml`: **1,823 lines = 666 comment-only + 131 blank + 1,026 data lines**, across 55 top-level sections, ~894 nested keys.

Nothing is silently dropped. Roughly **all 1,026 data lines relocate** (to plugin `Config`, to per-agent presets, or to plugin defaults in code); the ~797 comment/blank lines are the part that genuinely disappears (replaced by plugin README/JSDoc), plus `common/config.py`'s ~80 `update_*` writers become generic patch editing. The example looks smaller because it (a) shows a representative subset and (b) splits the composition across files: host `harness.yaml`, per-mode `agent.yaml`, `settings.yaml`, and each plugin's `Config` defaults in code.

Destination of every current top-level section (span = section line span, comments included):

| Current section (lines) | Destination |
|---|---|
| `permissions` (260) | `agent-tools.permissions.presets` `Config` (+ per-session preset override) |
| `modes` (236) | per-mode `agent.yaml` presets (`resources/agents/<mode>/agent.yaml`) |
| `channels` (177) | one channel plugin per entry (`agent-tools.channels.*`) `Config` |
| `react` (151) | agent preset model/loop fields + `openjiuwen.agent-loop` `Config` + rail params |
| `memory` (141) | `agent-tools.memory` `Config` |
| `models` (120) | `agent-tools.llm.*` provider `Config` (+ `settings.file`) |
| `symphony` (65) | `agent-tools.symphony` `Config` |
| `gateway` (53) | `jiuwenswarm.gateway` `Config` |
| `acp_agents` (45) | `agent-tools.channels.acp` `Config` |
| `execution_guard` (38) | guard rail plugin `Config` |
| `hooks` (36) | `agent-tools.hooks` `Config` |
| `team` (35) | `agent-tools.team` `Config` (+ team preset `team:`) |
| `telemetry` (32) | `agent-tools.observability.otel` `Config` |
| `team_observability` (30) | observability plugin `Config` |
| `debug_trace` (29) | observability/debug plugin `Config` |
| `tools` (24) | tool plugins' `Config` + preset `tools:` rows |
| `extensions` (23) | kernel-loader discovery paths + installed plugin list |
| `mcp` (21) | `agent-tools.mcp` `Config` |
| `skills` (19) | `agent-tools.skill` `Config` |
| `auto_harness` (19) | `jiuwenswarm.auto-harness` `Config` |
| `agent_observability` (14) | observability plugin `Config` |
| `experimental` (14) | per-experiment plugin rows |
| `verification` (14) | verification rail/subagent `Config` |
| `agents` (13) | `jiuwenswarm.agent-presets` roster |
| `proactive_recommendation` (13) | recommendation plugin `Config` |
| `heartbeat` (13) | `agent-tools.rails.heartbeat` `Config` |
| `task_memory` (13) | memory plugin `Config` |
| `tracehound` (13) | observability plugin `Config` |
| `updater` (12) | `jiuwenswarm.updater` `Config` |
| `browser` (11) | `agent-tools.browser` `Config` |
| `health_check` (11) | health plugin `Config` |
| `autonomy` (9) | autonomous-mode rail `Config` |
| `trajectory_ui` (9) | observability/UI plugin `Config` |
| `logging` (8) | observability plugin `Config` |
| `a2ui` (8) | a2ui plugin `Config` |
| `usage_cost` (8) | usage/cost plugin `Config` |
| `shell_output` (6) | shell tool plugin `Config` |
| `context_headroom` (6) | `agent-tools.rails.context-headroom` `Config` |
| `verifier_circuit_breaker` (6) | verifier rail `Config` |
| `email_settings` (6) | notification plugin `Config` |
| `preferred_language` (6) | kernel/settings `Config` |
| `setup_guide` (5) | product plugin `Config` |
| `output_format` (5) | `agent-tools.rails.output-format` `Config` |
| `embed` (5) | memory/retrieval `Config` |
| `failure_memory` (4) | `agent-tools.rails.failure-memory` `Config` |
| `step_back` (4) | `agent-tools.rails.step-back` `Config` |
| `task_description` (4) | `agent-tools.rails.task-description` `Config` |
| `tool_dedup` (4) | `agent-tools.rails.tool-call-dedup` `Config` |
| `auto_recap` (3) | recap plugin `Config` |
| `rsi` (3) | `agent-tools.rsi` `Config` |
| `kv_cache_affinity_config` (3) | core KV-cache seam `Config` |
| `progressive_tool_enabled` (3) | progressive-tool rail `Config` |
| `config_version` (3) | profile/loader metadata |
| `endpoint_profile_overrides` (2) | merged into llm provider `Config` |

**What actually shrinks / disappears:**
- 666 comment lines + 131 blank lines → plugin README/JSDoc.
- `common/config.py`'s ~80 `update_*_in_config` writers → generic patch/row editing.
- Feature `X: { enabled: true/false }` blocks → **row presence** (a stale `enabled: false` cannot contradict a missing row).
- Hand-duplicated blocks (e.g. the repeated `task_description`/`tool_dedup` inserts in `_build_agent_rails`).

**What grows (and is new, not in the current `config.yaml`):**
- The agent composition — `rails:`, `tools:`, `subagents:` rows — was **code** (`_build_agent_rails`, `_get_tool_cards`, `_TOOL_BUILD_NAMES`). It becomes explicit config: ~40–60 rows per preset, more total config lines than today, but typed, validated, and swappable.

**Net:** total *stated* configuration stays roughly flat or rises (composition becomes explicit); each *file* gets smaller; and the information that was code or comments becomes either a validated `Config` default or a named row. The example is small because it is a sample of a distributed whole, not because the other 2,000 lines vanished.
