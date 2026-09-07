[← Index](README.md) · jiuwenswarm Usability Review

---

# P2 — Operator

*The person installing, configuring, deploying, and maintaining the system.*

---

## §2 · Operator Configuration & Setup

*Installation, configuration, and day-to-day system management.*

### 2.1 No Startup Validation — Failures Surface on First Use

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

### 2.2 Config File Is 1709 Lines With No Validation Tool

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

### 2.3 Powerful Features Are Invisible by Default

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

### 2.4 Onboarding Ends Before the Hard Part

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

### 2.5 Instance and Port Management Is Confusing

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

### 2.6 Permission System Has No GUI and No Testing Tool

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

### 2.7 Optional Dependencies Fail at Runtime, Not Install Time

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

### 2.8 Documentation Is Scattered and Hard to Navigate

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

### 2.9 Upgrade Experience Is Undefined

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

### 2.10 Internationalization Is Inconsistent

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

## §4 · Reliability & Resilience

*What operators experience when something goes wrong in the deployment.*

### 4.1 Graceful Degradation Is Silent

**Current state.**
When a non-critical subsystem fails — memory provider down, OTel exporter
unreachable, a channel fails to initialize — the system continues running but the
user receives no notice. They may be operating under the assumption that memory is
being saved when it is silently failing. `config.py:84` logs this at DEBUG level.

**What good looks like.**
A persistent health indicator in the Web UI — a small dot in the sidebar or bottom
bar:
- Green: all subsystems nominal.
- Yellow: one or more non-critical subsystems degraded (click for details).
- Red: agent is not reachable.

On hover or click, a panel shows: "Memory: degraded (disk full). OTel: offline
(exporter unreachable). All other services nominal." This is a 2-hour implementation
that eliminates an entire class of silent failures.

Additionally, the startup log should print subsystem health before serving the first request (see 2.1). Operators monitoring without the Web UI — via logs or alerting — need this information in the log stream, not only in the UI.

### 4.2 Session Recovery After Disconnect Is Undefined

**Current state.**
If the browser tab closes or the WebSocket drops mid-task, it is not documented or
visible whether the agent continues, stops, or is in an undefined state. There is
no reconnect flow that shows what happened during the disconnect.

**What good looks like.**
On reconnect, the Web UI should immediately show what the agent did during the
disconnect: "While you were away, the agent completed 4 steps and wrote 2 files.
Here is what happened: [summary]." If the task is still running, show its current
step. If it completed with an error, show the error prominently. The `useWebSocket`
hook in `hooks/useWebSocket.ts` is the right place to implement reconnect + replay.

From an operator's perspective: the server-side behavior during a disconnect (does the agent process continue? is state preserved?) should be documented. Currently it is not.

### 4.3 Rate Limiting and API Failures Are Opaque

**Current state.**
When an API rate limit is hit or the model returns a 429 / 503, the user sees either
a generic error message or the agent silently hangs. There is no exponential backoff
indicator, no "retrying in 15s" message, no suggestion to switch to a different model.

**What good looks like.**
- A visible "Rate limited — retrying in 15s" countdown in the chat panel.
- After 3 consecutive model errors, surface a prompt: "The model is repeatedly
  failing. Try switching to deepseek-v3?" with a one-click model switch.
- API errors should include the HTTP status code and the model's error message
  verbatim, not a paraphrase.

Operators need this surfaced in logs at WARNING level, not just in the Web UI, so that monitoring systems can detect model provider failures.

### 4.4 No Persistent State for In-Progress Tasks

**Current state.**
If the `jiuwenswarm` process crashes mid-task, the task is lost. There is no
checkpoint system — the agent cannot resume from step 3 of 5 after a restart.

**What good looks like.**
The todo system (`TaskPlanningRail`) already tracks task state. Persisting this to
disk (a simple JSON file per session) would allow the agent to display "last session
was interrupted at step 3: parse invoices. Resume?" on reconnect. This turns a
frustrating failure mode into a recoverable one.

For operators managing multi-user deployments, the checkpoint store should be configurable (local disk or external durable store) so that it survives process restarts in containerized environments.

---

## §5 · First-Run & Setup Experience

*The operator's experience from install to a working, validated deployment.*

### 5.1 The Setup Wizard Ends Before Validation

**Current state.**
`ModelSetupGuide.tsx` has 3 steps: welcome → settings spotlight → models module
spotlight. The wizard ends at the models panel. The operator must then figure out how
to fill in provider credentials and validate them. If the model is misconfigured,
the error only appears on the first chat.

**What good looks like.**
The wizard should not complete until the model is working. Suggested flow:
1. Welcome — what jiuwenswarm does in 3 bullet points.
2. Choose model provider — dropdown with logos (DeepSeek, OpenAI, Anthropic,
   Huawei MaaS, Azure, Custom). Each option shows which fields are required.
3. Enter credentials — with a "Test connection" button that makes a live API call.
   Show: ✓ Connected (320ms) or ✗ Invalid API key — check your provider dashboard.
4. (Optional) Enable a channel — Feishu, Telegram, etc., same test pattern.
5. Send your first message — prefilled with a suggested starter task.

The guide should be re-enterable at any time from the `?` icon, not just on first run.

### 5.4 CLI First-Run Has No Guidance

**Current state.**
Running `jiuwenswarm` from the terminal with no config gives an unclear error. There
is no `jiuwenswarm --help` output that walks through what to do first.

**What good looks like.**
```
$ jiuwenswarm
No config found at ~/.jiuwenswarm/config/config.yaml.
Run 'jiuwenswarm-init' to set up your workspace, then 'jiuwenswarm-start'.
```
And `jiuwenswarm-init` should interactively prompt for the minimum required
configuration (model provider, API key) before exiting.

---

## §9 · Economic UX

*Token consumption, API costs, and resource awareness.*

### 9.1 No Token or Cost Visibility

**Current state.**
Users have no visibility into how many tokens each conversation is consuming.
For sessions with large memory snapshots, many installed skills, long conversation
history, and multiple subagents, the context can exceed 30K tokens per call. No
per-session counter, no cost estimate, no warning before hitting the model's limit.

**What good looks like.**
- A token counter in the chat panel showing total tokens used in the current
  session (both input and output).
- A per-message token annotation (collapsed by default, expandable on the message).
- A cost estimate based on the configured model's pricing (configurable per model
  in settings: `price_per_1k_input_tokens`, `price_per_1k_output_tokens`).
- A session summary card at conversation end: "This session used 48,320 tokens
  (~$0.14 at current rates)."

### 9.2 No Optimization Hints

**Current state.**
If a session's context is growing large, there is no guidance on how to reduce it.
Users who hit context limits do not know whether the cause is a large memory
snapshot, many installed skills, or a long conversation.

**What good looks like.**
When the token count crosses 70%, show a breakdown: "Your context: conversation
history 40%, memory snapshot 35%, skills 15%, system 10%." Each item has a link
to the relevant setting: "Reduce memory snapshot size →", "Use auto_list mode for
skills →".

---

## §10 · Skill Ecosystem (Operator Perspective)

*Discovering, installing, and managing skills across the instance.*

### 10.1 Skill Marketplace Has No Quality Signals

**Current state.**
`MarketplacePage.tsx` shows skill cards with logo, name, status, and install button.
There are no ratings, no usage counts, no author reputation, no reviews, no "last
updated" date. Users cannot assess quality before installing.

**What good looks like.**
Each skill card should show:
- Star rating (1–5) from community or internal team.
- Number of installs.
- Last updated date.
- Author verified badge (if published by the jiuwenswarm team).
- A one-paragraph description and a "Preview" that shows the SKILL.md content.

### 10.2 No Skill Dependency Management

**Current state.**
Skills can have Python `requirements.txt`. These are presumably installed at skill
load time, but there is no UI showing which skills have dependencies, whether they
are installed, or whether two skills conflict.

**What good looks like.**
A dependency panel per skill showing: required packages, installed status, version
conflicts with other installed skills. A "Install dependencies" button that runs in
the background with a progress indicator.

### 10.3 No Skill Version Management or Rollback

**Current state.**
When a skill is updated — manually or via the evolution system — the previous
version is not retained. If an updated skill breaks, the user must manually
reconstruct the old `SKILL.md`.

**What good looks like.**
Git-style version history per skill: each save creates a version record. The skill
panel shows: "Current: v1.3 (saved 2h ago). Previous: v1.2, v1.1." One-click
rollback to any previous version. If the evolution system modifies a skill, the
change is shown as a diff for user approval before being committed.

### 10.4 Skill Testing Has No Infrastructure

**Current state.**
There is no way to test a skill with sample input from the UI before deploying it
to live use. The user must trigger the skill through a real chat session.

**What good looks like.**
A "Test run" panel in the skill detail view: paste a sample input, click Run, see
the output. This is the skill equivalent of a unit test. The trajectory panel already
captures this data — wiring it to a skill test UI is achievable.

---

## §12 · Data & Privacy

*What data the instance stores and how long it is kept.*

### 12.3 No Data Retention Policy

**Current state.**
Memory and conversation history are stored indefinitely. There is a
`trajectory_ui.retention_days` config option, but no equivalent for conversations
or memory.

**What good looks like.**
A data retention settings panel with separate controls for the operator (instance-wide
defaults) and the user (personal preferences, where applicable):
- "Keep conversation history for: 30 / 90 / 365 / forever"
- "Keep daily memory for: 7 / 30 / 90 / forever"
- "Delete all data older than X"
Automated expiration should run on startup. Operators should be able to set a maximum
retention period that users cannot exceed.

---

## §13 · Diagnostics & Support Tools

*What operators have to diagnose failures and support users.*

### 13.2 No Diagnostic Collection Command

**Current state.**
When something goes wrong, the operator has no tool to collect diagnostic information
in a single step. They would need to know to look in `~/.jiuwenswarm/agent/.logs/`,
identify the relevant log directory, and know which log level to set.

**What good looks like.**
A `jiuwenswarm diagnostics` CLI command that:
- Collects the last 100 lines of each log file.
- Captures the config (with API keys redacted).
- Captures system info (OS, Python version, package versions).
- Writes a `jiuwenswarm-diagnostics-YYYY-MM-DD.txt` file.
- Prints: "Diagnostics saved. Share this file when reporting an issue."

### 13.3 Error Messages Do Not Reference Log Files

**Current state.**
When an error occurs, neither the user nor the operator is told where to look for
more detail. The operator must know that logs exist, where they are, and how to read
them — none of this is documented at the point of error.

**What good looks like.**
Every error message that has more detail in the log should end with:
> "Full details in ~/.jiuwenswarm/agent/.logs/agent_server.log"

In the Web UI, a "Show log" button that opens a scrollable log panel filtered
to the current session and the last 60 seconds. For operators monitoring via CLI,
errors written to stderr should include the log file path automatically.

---

## §16 · Settings Information Architecture

*How the Web UI settings panels are organized.*

### 16.2 Settings Are Organized by Implementation, Not by Operator Task

**Current state.**
Settings modules: General, Models, Channels, Agent, Browser, Experimental. This is
organized by implementation component, not by what the operator is trying to do.
An operator who wants to "change the agent's response language" must guess whether
that is in General, Models, or Agent.

**What good looks like.**
Organize by operator goal:
- **Getting started** — model setup, language, first skill.
- **Communication channels** — Feishu, Telegram, Discord, etc.
- **Memory & context** — memory settings, coding memory, context length.
- **Agent behavior** — permissions, tools, mode defaults, response style.
- **Advanced** — observability, debug traces, experimental features.

---
