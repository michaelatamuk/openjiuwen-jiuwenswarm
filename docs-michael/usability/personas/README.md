[← Index](../README.md) · jiuwenswarm Usability Review

---

# Personas

Each persona file is a short **profile**: who this person is, and which findings matter to them (linking into the [findings](../findings/)).

**Every finding belongs to exactly one profile.** A finding appears once and is owned by a single persona; "shared" concerns live in the lowest common base and are inherited by the more specific profiles below it (without being repeated).

The personas are laid out as a pipeline, **0 → 3**, ordered by who depends on whom: *make the software → run it → build with it → use it*.

## 0 · Contribute — people who make jiuwenswarm

- [Openjiuwen Contributor](0-contribute/openjiuwen-contributor.md) — contributes code to the openjiuwen / jiuwenswarm codebase; extends the engine from the inside (rails, tools, the agent factory).

## 1 · Run — operators who stand it up and keep it working

- [Instance Runner](1-run/instance-runner.md) — installs, configures, runs, and keeps one JiuwenSwarm healthy (config, health, cost, upgrade, retention).
- [Shared Bot Admin](1-run/shared-bot-admin.md) — turns one running instance into a group chat bot for a team, adding per-user isolation and limits.

## 2 · Build — people who build on/around a running instance

- [Product Developer](2-build/product-developer.md) — installs a ready jiuwenswarm and builds their own product using it as a backend over the E2A/WebSocket (or ACP) API.
- [Skill Author](2-build/skill-author.md) — writes, packages, and distributes skills (capability content) a user enables on an instance.

## 3 · Consume — people who actually use the agent

Genuine users. The consume tier is split into a shared base and its surfaces.

**Shared base** (concerns every consumer feels on any surface):

- [Consume User](3-consume/consume-user.md) — stop/crash, errors, notifications, context, memory/privacy, and so on. Everything below inherits this.

**In the Web UI** (`3-consume/web/`):

- [Web User](3-consume/web/web-user.md) — the Web-UI base shared across chat and code mode.
- [Chat User](3-consume/web/web-user-chatter.md) — mostly questions and answers (`agent.work`).
- [Coder](3-consume/web/web-user-coder.md) — mostly code work (`agent.code`).

**Not on the Web UI:**

- [IM User](3-consume/im-user.md) — talks to a running instance only through an IM bot; inherits the Consume User base.

---

**Why each finding is owned once.** If several personas need the same concern, it is not "shared" — it belongs to their common **base** and is inherited. A generic concern lives in `consume-user.md`, a Web-UI concern in `web/web-user.md`, and a code-only concern in `web/web-user-coder.md`. That is why no finding appears in two profiles.

**The four tiers.** `0-contribute` makes jiuwenswarm; `1-run` stands up instances of it; `2-build` produces things on/around those instances; `3-consume` are the people who actually use the agent. (The tiers encode dependency — 0 is the foundation, 3 the most downstream.)
