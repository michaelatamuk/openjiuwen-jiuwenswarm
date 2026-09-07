[← Index](../../README.md) · jiuwenswarm Usability Review

---

# Startup & Configuration

*Validation, config editing and dependency checks.*

---

## 1 Wrong credentials surface only on the first chat, never at startup

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

## 2 The config file has no validation or check tool

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

## 3 Missing optional extras fail when used, not at startup

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

## 4 Setup ends before credentials are tested

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

