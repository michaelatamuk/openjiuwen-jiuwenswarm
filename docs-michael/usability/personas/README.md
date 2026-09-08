[← Index](../README.md) · jiuwenswarm Usability Review

---

# Personas

Each persona file is a short **profile**: who this person is, and which findings matter to them (linking into the [findings](../findings/)). The exhaustive finding-by-finding map is in [matrix.md](../matrix.md).

**Every finding belongs to exactly one profile.** A finding appears once and is owned by a single persona; "shared" concerns live in the lowest common base and are inherited by the more specific profiles below it (without being repeated).

The personas are ordered by **who depends on whom**. Everyone downstream only works because someone above produced a healthy, running instance.

## 1 · Keystone — the running instance everyone depends on

- [Instance Admin](1-keystone/instance-admin.md) — installs, configures, runs, and keeps one JiuwenSwarm healthy (config, health, cost, upgrade, retention). Does **not** use it for tasks.

## 2 · Supply — authors who put things INTO the instance

- [Extension Developer](2-supply/extension-developer.md) — extends the runtime from inside: rails, tools, and the Python SDK.
- [Skill Author](2-supply/skill-author.md) — writes, packages, and distributes skills.

## 3 · Consume — people who use the running instance

Consumers split into a **basic consume user** (shared concerns) and two sub-groups. Files live under `3-consume/` (`consume-user.md`, `web/`, `not-web/`).

**Basic consume user** (shared by every consumer, whatever surface):
- [Consume User](3-consume/consume-user.md) — concerns every consumer feels (e.g. stop/crash, errors, notifications, context, memory/privacy). This is the base; the profiles below inherit it.

**Web sub-group** (`3-consume/web/`) — consumers in the Web UI:
- [Web User](3-consume/web/web-user.md) — the Web-UI base shared across chat and code mode.
- [Chat User](3-consume/web/web-user-chatter.md) — mostly questions and answers (`agent.work`).
- [Coder](3-consume/web/web-user-coder.md) — mostly code work (`agent.code`); edits files, reviews diffs.

**Non-Web sub-group** (`3-consume/not-web/`) — consumers not on the Web UI:
- [IM User](3-consume/not-web/im-user.md) — talks to a running instance only through an IM bot (inherits the Consume User base).
- [Application Developer](3-consume/not-web/application-developer.md) — builds their own product on the instance over the E2A/WebSocket (or ACP) API.
- [Shared Bot Admin](3-consume/not-web/shared-bot-admin.md) — turns one running instance into a group chat bot for a team.

---

**Why a base + sub-groups.** If several personas genuinely need the same concern, that concern is not "shared" across them — it belongs to their common **base** and is inherited. That is what keeps each finding owned once: a generic concern lives in `consume-user.md`, a Web-UI concern in `web/web-user.md`, and a code-only concern in `web/web-user-coder.md`.

**Accountability loops.** Instance Admin observes the health of the running instance; Extension Developer and Skill Author are accountable for not breaking it and for fixing what they shipped. These are single-owner concerns, not duplicates.
