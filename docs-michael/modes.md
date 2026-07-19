The mode structure has changed significantly. Here's what's currently in the code:

---

## Current modes

| Mode string | Status | Notes |
|-------------|--------|-------|
| `agent` | **Active** — canonical | Replaced both `agent.plan` and `agent.fast` |
| `code.normal` | **Active** — canonical | Standard coding agent |
| `code.plan` | **Active** | Coding agent with planning |
| `code.team` | **Active** | Code adapter in team configuration |
| `team` | **Active** | Multi-agent team mode |
| `team.plan` | **Active** | Routes through the code adapter, not team manager |

## What happened to the old 6 modes

| Old mode | Fate |
|----------|------|
| `agent.plan` | **Merged into `agent`** — accepted but normalized to `agent` at runtime |
| `agent.fast` | **Merged into `agent`** — same, legacy alias |
| `agent.normal` / `agent` | **Survived** — is now just called `agent` |
| `code.normal` | **Survived** unchanged |
| `code.fast` | Not found — may never have existed under that name |
| `code.team` | **Survived** unchanged |

The key architectural change: `agent.plan` and `agent.fast` were **merged into a single `agent` mode**. The comment in the enum says `# 历史值：plan / fast 已合并为 agent`. The config's `modes.agent.fast` / `modes.agent.plan` sub-keys are now obsolete — which is exactly why the "all new features" config replaced them with a single `modes.agent` block (which I applied to the skillsbench config).

There is also a `proactive.tick` mode for cron jobs only (not a user-facing mode).

Defined in: `jiuwenswarm/jiuwenswarm/common/schema/message.py`