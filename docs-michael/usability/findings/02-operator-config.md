[← Index](../README.md) · jiuwenswarm Usability Review

---

# §2 · Operator Configuration & Setup

*Installation, configuration, and day-to-day system management.*

*Primary persona: P2.*

---

## 2.1 No Startup Validation — Failures Surface on First Use

**Current state.**
Model credentials are never checked at startup. `jiuwenswarm-init` completes, the
user runs `jiuwenswarm-start`, the web UI loads — and the first failure is on the
first chat message. Same for channels: a wrong `app_secret` or `bot_token` silently
fails to initialize. The operator discovers this when a user reports that Feishu/
Telegram is not responding.

`jiuwenswarm/common/config.py:257`, `channel_manager.py:52`

**What good looks like.**
A startup health check that runs before the first request is served:
1. Validate model config (send a minimal test request, check HTTP 200).
2. Validate each enabled channel (check token format, optionally make a test API
   call to the platform's auth endpoint).
3. Validate workspace directory permissions (write a temp file, delete it).
4. Check optional dependencies (SSH, TUI) and warn if referenced but not installed.

Print a health report to stdout on startup:

```
jiuwenswarm health check
  ✓ Model: deepseek-v4-flash (latency 320ms)
  ✓ Memory: enabled, workspace /home/mishka/.jiuwenswarm/
  ✗ Feishu: app_secret missing — channel disabled
  ✓ Telegram: connected (@my_bot)
  ⚠ OTel: endpoint unreachable — traces will be written to file
```

---

## 2.2 Config File Is 1709 Lines With No Validation Tool

**Current state.**
`jiuwenswarm/resources/config.yaml` contains models, memory, channels, permissions,
observability, browser runtime, SSH, team agents, and debug traces in a single file.
There is no tool to check whether an edited copy is correct before running. Env var
substitution uses `${VAR:-default}` syntax, which is undocumented at the point of
use. Crypto provider failures fall back silently:

```python
# common/config.py:84
logger.debug("Crypto provider unavailable while resolving env var %s; using raw value", ...)
```

**What good looks like.**
- A `jiuwenswarm config check` CLI command that validates the config file against a
  JSON Schema and prints every error with the line number and a fix suggestion.
- A config version field (`jiuwenswarm_config_version: 3`) so the validator can
  detect stale configs from older versions.
- Env var substitution failures logged at `WARNING` level minimum.
- The Web UI settings panels (`features/settings/modules/`) should be the primary
  config interface for operators who are not comfortable editing YAML — and every
  field in the YAML should have a corresponding Web UI field.

---

## 2.3 Powerful Features Are Invisible by Default

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

## 2.4 Onboarding Ends Before the Hard Part

**Current state.**
`ModelSetupGuide.tsx` implements a 3-step spotlight tour: welcome → settings icon
spotlight → models module spotlight. Step 3 ends at the models panel. The user must
then figure out how to fill in the API key, API base, and model name themselves —
and if they fill it in wrong, there is no inline validation until they send a chat.

`features/modelSetupGuide/ModelSetupGuide.tsx`

**What good looks like.**
The setup guide should not end until the model is working:
1. Welcome.
2. Choose your model provider from a dropdown (OpenAI, DeepSeek, Anthropic, Azure,
   Huawei MaaS, Custom…).
3. Enter API key. A "Test" button sends a real request and shows ✓ / ✗ inline.
4. On success: "Your agent is ready. Want to enable a communication channel?"
5. Optional: channel setup with the same test-and-confirm pattern.
6. Final screen: "Start your first conversation →"

The guide should be re-enterable at any time from the `?` icon, not just on first run.

---

## 2.5 Instance and Port Management Is Confusing

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

## 2.6 Permission System Has No GUI and No Testing Tool

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

## 2.7 Optional Dependencies Fail at Runtime, Not Install Time

**Current state.**
SSH channel requires `pip install "jiuwenswarm[ssh]"`. TUI requires
`pip install jiuwenswarm-tui`. Neither is checked at startup. The error appears
only when the operator enables the feature.

**What good looks like.**
`jiuwenswarm-start` should check all optional dependencies referenced in the config
and warn at startup:
```
⚠ SSH channel is enabled in config but 'jiuwenswarm[ssh]' is not installed.
  Install with: pip install "jiuwenswarm[ssh]"
  SSH channel will be disabled until installed.
```

---

## 2.8 Documentation Is Scattered and Hard to Navigate

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

## 2.9 Upgrade Experience Is Undefined

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

## 2.10 Internationalization Is Inconsistent

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
