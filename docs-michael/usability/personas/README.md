[← Index](../README.md) · jiuwenswarm Usability Review

---

# Personas

Each persona file is a short **profile**: who this person is, and which findings matter to them (linking into the [findings](../findings/)).

**Every finding belongs to exactly one profile.** A finding appears once and is owned by a single persona; "shared" concerns live in the lowest common base and are inherited by the more specific profiles below it (without being repeated).

The personas are laid out as a pipeline, **0 → 3**, ordered by who depends on whom: *make the software → run it → build with it → use it*.

## 0 · Contribute — people who make jiuwenswarm

- [Engine Contributor](0-contribute/engine-contributor/engine-contributor.md) — contributes code to the openjiuwen / jiuwenswarm codebase; extends the engine from the inside (rails, tools, the agent factory).

## 1 · Run — operators who stand it up and keep it working

- [Self-hoster](1-run/self-hoster/self-hoster.md) — installs, configures, runs, and keeps one JiuwenSwarm healthy (config, health, cost, upgrade, retention).
- [Bot-hoster](1-run/bot-hoster/bot-hoster.md) — turns one running instance into a group chat bot for a team, adding per-user isolation and limits.

## 2 · Consume — people who actually use the agent

Genuine users. The consume tier is split into a shared base and its surfaces.

**Shared base** (concerns every consumer feels on any surface):

- [Consumer](2-consume/consumer/consumer.md) — stop/crash, errors, notifications, context, memory/privacy, and so on. Everything below inherits this.

Consumers reach the agent through one of three surface groups (each a folder with its own base + personas):

**Web UI** (`2-consume/web/`) — the rich GUI (the desktop app is a wrapper of it):

- [Web User](2-consume/web/web-user/web-user.md) — the Web-UI base shared across chat and code.
- [Web Chat](2-consume/web/web-user-chat/web-user-chat.md) — mostly questions and answers.
- [Web Code](2-consume/web/web-user-code/web-user-code.md) — mostly code work.

**Text surfaces** (`2-consume/text/`) — terminal and messaging (surface-specific findings pending):

- [Text User](2-consume/text/text-user/text-user.md) — base for text surfaces.
- [Text CLI](2-consume/text/text-user-cli/text-user-cli.md) · [Text TUI](2-consume/text/text-user-tui/text-user-tui.md) · [Text IM](2-consume/text/text-user-im/text-user-im.md).

**Channel surfaces** (`2-consume/channel/`) — developer/code channels (surface-specific findings pending):

- [Channel User](2-consume/channel/channel-user/channel-user.md) — base for channel surfaces.
- [Channel IDE](2-consume/channel/channel-user-ide/channel-user-ide.md) · [Channel Browser](2-consume/channel/channel-user-browser/channel-user-browser.md).

## 3 · Build — people who build on/around jiuwenswarm for others

Builders are also users of jiuwenswarm, but they use it to build something *for other people* — that thing sits between other end-users and jiuwenswarm.

- [Skill Author](3-build/skill-author/skill-author.md) *(Ecosystem)* — writes, packages, and distributes skills (capability content) a user enables on an instance; value flows through the marketplace.
- [Agent Integrator](3-build/agent-integrator/agent-integrator.md) *(M2M)* — connects an external agent framework (Google ADK, LangGraph, etc.) to jiuwenswarm via the A2A protocol, making jiuwenswarm one node in a multi-agent system.
- [Product Builder](3-build/product-builder/product-builder.md) *(B2B2C)* — installs a ready jiuwenswarm and builds their own consumer product using it as an invisible backend over the E2A/WebSocket (or ACP) API.

---

**Why each finding is owned once.** If several personas need the same concern, it is not "shared" — it belongs to their common **base** and is inherited. A generic concern lives in `consumer.md`, a Web-UI concern in `web/web-user.md`, and a code-only concern in `web/web-user-code.md`. That is why no finding appears in two profiles.

**The tiers.** `0-contribute` makes jiuwenswarm and `1-run` stands up instances of it. The people who then use it come in two sibling kinds: **2-consume** (uses it as-is, for themselves) and **3-build** (uses it to build for others).
