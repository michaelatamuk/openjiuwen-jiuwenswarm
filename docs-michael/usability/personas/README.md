[← Index](../README.md) · jiuwenswarm Usability Review

---

# Personas

Personas are grouped by how each person relates to the system — that relationship is what
decides which findings matter to them. Each persona file lists the findings relevant to it
as one-liners with links to the full finding text (see the [findings](../findings/) folders).

## Using — people who talk to the agent

- [End-User](using/end-user.md) · **Covered** — converses with the agent day to day over the
  Web UI or an IM channel; not someone who configures or builds.
- [Developer](using/developer.md) · **Covered** — a technical user who drives the agent as a
  coding and automation assistant (Code workspace, IDE, terminal/TUI, CLI); when self-hosting,
  also the Instance Admin.

## Administering — people who run it

- [Instance Admin](operating/instance-admin.md) · **Covered** — installs, configures, runs, and keeps
  one JiuwenSwarm working (models, channels, tool-permission whitelists, memory, upgrades).
- [Shared Bot Admin](operating/shared-bot-admin.md) · **Partial** — runs one instance that
  a whole group uses through a chat bot; on top of instance admin duties, must keep each user's
  session/memory separate and stop one user from taking the instance down.

## Extending — people who build into the product

- [Extension Developer](extending/extension-developer.md) · **Covered** — rails, tools, and
  the Python SDK.
- [Skill Author](extending/skill-author.md) · **Partial** — writes and packages skills
  (`SKILL.md`, Python tools, prompt/instruction content).

## Integrating — people who build on top as a backend

- [Application Developer](integrating/application-developer.md) · **Covered** — a custom
  product on top of jiuwenswarm over the E2A/WebSocket API.

---

These are the roles JiuwenSwarm actually ships surfaces for: the desktop/CLI install, Web UI,
TUI, IM channels, skill hubs, the rails/harness extension surface, and the E2A/ACP API.
Oversight roles (audit, security, QA, analytics, support) have no shipped product surface
yet, so they are not included as personas.
