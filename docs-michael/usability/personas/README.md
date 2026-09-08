[← Index](../README.md) · jiuwenswarm Usability Review

---

# Personas

Each persona file is a short **profile**: who this person is, and which findings matter to them (linking into the [findings](../findings/)). The exhaustive finding-by-finding map is in [matrix.md](../matrix.md).

**Every finding belongs to exactly one profile.** A finding appears once and is owned by a single persona; "shared" concerns live in the lowest common base and are inherited by the more specific profiles below it (without being repeated).

The personas are grouped by what each person does with the system, and the groups are ordered by **who depends on whom**.

## 1 · Run — operators who stand it up and keep it working

These people run instances and deployments; they do not use the agent for their own work.

- [Instance Admin](1-keystone/instance-admin.md) — installs, configures, runs, and keeps one JiuwenSwarm healthy (config, health, cost, upgrade, retention).
- [Shared Bot Admin](1-keystone/shared-bot-admin.md) — turns one running instance into a group chat bot for a team, adding per-user isolation and limits.

## 2 · Build — people who produce something others use

Builders depend on jiuwenswarm, but they are not its consumers: they make a thing that *other* people consume. They differ by whether they change jiuwenswarm itself or build separately on top of it (`2-build/on-top/`, `2-build/under-the-hood/`, `2-build/skills/`):

**Under the hood of jiuwenswarm** — extend jiuwenswarm itself so it behaves differently; the code they write runs inside it:

- [Openjiuwen Contributor](2-build/under-the-hood/openjiuwen-contributor.md) — extends the runtime from inside: rails, tool registration, and the rails-context / agent-factory surface.

**On top of jiuwenswarm** — `pip install` a ready jiuwenswarm as a black box and build a separate product that calls it (directly, over WebSocket, or with a client SDK); none of their code changes jiuwenswarm:

- [Product Developer](2-build/on-top/product-developer.md) — builds their own product on the running instance over the E2A/WebSocket (or ACP) API.

**Instance capabilities** (`2-build/skills/`) — not engine code and not a separate on-top product, but capability *content* installed per instance:

- [Skill Author](2-build/skills/skill-author.md) — writes, packages, and distributes skills a user enables on an instance.

## 3 · Use — people who actually consume the agent

Genuine users: they talk to the agent and use its output. This is the consume tier, split into a shared base and its surfaces.

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

**Run vs Build vs Use.** Instance Admin and Shared Bot Admin *run* it; Extension/Skill/Application developers *build* on it; only the Consume User (Web, chat, coder, IM) actually *uses* the agent.
