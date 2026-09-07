[← Index](../../README.md) · jiuwenswarm Usability Review

---

# Running & Managing the Instance

*Instances, feature discovery, upgrades, i18n and permission tooling.*

---

## 1 No visibility into which ports and URLs are in use

**Current state.**
- Default instance lives in `~/.jiuwenswarm/`; named instances in
  `~/.jiuwenswarm/instances/{name}/` — different directory layouts, different PID
  file paths, inconsistent env var behavior.
- Port scan range is hardcoded to 20 candidates; if all are busy the system falls
  back to a conflicting port silently.
- After `jiuwenswarm-start --name alice`, there is no output listing what ports
  were assigned, what URL to open, what is running.

**What good looks like.**
```
$ jiuwenswarm-start
Starting jiuwenswarm (default)...
  Agent server:  http://localhost:8942
  Gateway:       http://localhost:8943
  Web UI:        http://localhost:5173

All services ready in 3.2s. Opening browser...
```
Port conflicts should be detected proactively with an actionable message:
```
Port 8942 is already in use by another process (PID 14821).
Run: jiuwenswarm-stop   to stop the existing instance, or
     jiuwenswarm-start --port 9000   to use a different base port.
```

---

## 2 Powerful features exist but are never surfaced

**Current state.**
The following features exist and are useful but are disabled by default with no
hint they exist anywhere in the UI or startup output:

| Feature | Config key | What it does |
|---|---|---|
| Trajectory UI | `trajectory_ui.enabled` | Web dashboard for multi-agent traces |
| OTel tracing | `team_observability.enabled` | Distributed tracing for agent/tool spans |
| Agent debug trace | `debug_trace.agent.enabled` | Full per-request context + tool result dump |
| Coding memory | `memory.coding_memory` | Persistent code-specific memory |
| SSH channel | `channels.ssh` | Terminal tunneling into the agent |

`config.yaml:442–574`

**What good looks like.**
A "Feature Discovery" section in the Web UI settings — a curated list of opt-in
features with a one-paragraph description and a toggle. The first time `jiuwenswarm-start`
runs, the startup output should mention: "Tip: trajectory UI is available. Enable it
with `trajectory_ui.enabled: true` in config."

---

## 3 Logs and config mix languages unpredictably

**Current state.**
Some error messages, log strings, and config comments are in Chinese; others are in
English. An operator reading logs cannot predict which language the system will use.
Runtime log lines mix both languages. Config.yaml section comments are mixed:
Chinese narrative comments beside English error messages.

**What good looks like.**
All operator-facing log messages (WARNING and above), CLI output, and error messages
should be in English unconditionally. User-facing chat responses should respect the
`preferred_response_language` setting. Config comments should be available in both
languages, ideally as separate config templates: `config.zh.yaml`, `config.en.yaml`.

---

## 4 Upgrading can silently break an existing config

**Current state.**
`pip install --upgrade jiuwenswarm` — what happens to `~/.jiuwenswarm/config/
config.yaml`? There is no config version field, no migration system, no changelog
that flags breaking config changes, and no validation of whether an existing config
is compatible with the new version.

**What good looks like.**
- A `jiuwenswarm_config_version: 4` field in config.yaml.
- On startup, if the config version is older than the binary expects, print a
  migration guide or run automatic migration with a backup:
  ```
  Config migration: v3 → v4
  Backed up config to ~/.jiuwenswarm/config/config.yaml.bak
  Added new required field: memory.coding_memory.enabled = false
  ```
- A `CHANGELOG.md` section specifically for config-breaking changes.

---

## 5 Documentation is scattered with no guide for common tasks

**Current state.**
Documentation lives in three places: inline YAML comments (must open 1709-line
config to read), Markdown docs in `/docs/` (must know they exist), and skill
`SKILL.md` files (designed as agent prompts, not operator reference). There is no
centralized guide for the three most common operator tasks: add a channel, debug a
failing task, create a skill.

**What good looks like.**
- An integrated help panel in the Web UI settings — each settings module has a
  collapsible "Help" section with the documentation for that module.
- The `/docs/` directory should have a `quickstart.md` that covers: install →
  configure model → start → first task → add a channel → create a skill. All in
  one file.
- `config.yaml` should reference doc links for complex sections:
  ```yaml
  # See: https://docs.jiuwenswarm.io/channels/feishu for setup guide
  channels:
    feishu: ...
  ```

---

## 6 Permission rules can only be edited in raw YAML

**Current state.**
The tiered permission policy (`config.yaml:1129–1286`) uses a complex rule syntax
with regex support. There is no Web UI to create, edit, or test rules. The
`PermissionWarningDialog.tsx` only shows a generic "full access warning" — it does
not explain which specific rules are active or what they permit.

**What good looks like.**
A permissions panel in Web UI settings that shows:
- A list of active rules, each with: tool pattern, allowed/denied, who it applies to.
- An inline rule editor with pattern validation (highlight invalid regex).
- A "Test" field: enter a tool name and see which rule it matches and what the
  outcome is.
- A "What can the agent do?" summary in plain language: "Agent can read and write
  files in /home/mishka/invoices/. Agent cannot run bash. Agent can send Feishu
  messages."

---

