[← Index](../README.md) · jiuwenswarm Usability Review

---

# Personas

Each persona file is a short **profile**: who this person is, and which concern folders matter to them (linking into the [findings](../findings/)). For the exhaustive finding-by-finding map, see [matrix.md](../matrix.md).

## Using — people who talk to the agent

- [Web User](using/web-user.md) — runs JiuwenSwarm and uses the full Web UI / desktop app; includes the developers who use it to code and automate (folded into this persona).
- [IM User](using/im-user.md) — talks to a shared bot from a messaging app (Feishu/Telegram/WeChat group); no Web UI.

## Administering — people who run it

- [Instance Admin](operating/instance-admin.md) — the administrator (运维) of one instance: config, health, diagnostics, cost.
- [Shared Bot Admin](operating/shared-bot-admin.md) — runs one instance that a group uses through a chat bot; adds per-user isolation and limits.

## Extending — people who build into the product

- [Extension Developer](extending/extension-developer.md) — rails, tools, and the Python SDK.
- [Skill Author](extending/skill-author.md) — writes and packages skills.

## Integrating — people who build on top

- [Application Developer](integrating/application-developer.md) — a product on the E2A/WebSocket (or ACP) API.

---

These are the roles JiuwenSwarm actually ships surfaces for. Roles with no shipped surface (audit, security, QA, analytics, support) are not included.
