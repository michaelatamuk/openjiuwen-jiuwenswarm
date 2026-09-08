# jiuwenswarm — Usability Review

Content is split across two subfolders plus two files at the root. Start here to
orient yourself, then go directly to wherever you need. Each finding is identified by its
concern file and a short, self-explanatory title.

---

## Navigation

Quick reads: [00-overview — root cause & concern map]()

### `personas/` — Start here if you are a specific role

One file per persona. Each file is a short profile: who this person is and which concern
folders matter to them (linking into the findings). Read the file for your role.

| File | Persona | Tier | Status |
|---|---|---|---|
| [engine-contributor.md](personas/0-contribute/engine-contributor/engine-contributor.md) | **Engine Contributor** | 0 · Contribute | Covered |
| [self-hoster.md](personas/1-run/self-hoster/self-hoster.md) | **Self-hoster** | 1 · Run | Covered |
| [bot-hoster.md](personas/1-run/bot-hoster/bot-hoster.md) | **Bot-hoster** | 1 · Run | Partial |
| [consumer.md](personas/2-consume/consumer/consumer.md) | **Consumer** (base) | 2 · Consume | Covered |
| [web/web-user.md](personas/2-consume/web/web-user/web-user.md) · [web-user-chat.md](personas/2-consume/web/web-user-chat/web-user-chat.md) · [web-user-code.md](personas/2-consume/web/web-user-code/web-user-code.md) | Web User (+ Chat / Web Code) | 2 · Consume | Covered |
| [text/text-user.md](personas/2-consume/text/text-user/text-user.md) (+ cli/tui/im) | Text surfaces (CLI/TUI/IM) | 2 · Consume | Pending |
| [channel/channel-user.md](personas/2-consume/channel/channel-user/channel-user.md) (+ ide/browser) | Channel surfaces (IDE/Browser) | 2 · Consume | Pending |
| [product-builder.md](personas/3-build/product-builder/product-builder.md) | **Product Builder** | 3 · Build | Covered |
| [skill-author.md](personas/3-build/skill-author/skill-author.md) | **Skill Author** | 3 · Build | Covered |

---

Findings live under each persona folder (`personas/<tier>/<persona>/findings/…`), so each persona is self-contained.

## Personas

Personas run **0 → 3**: `0-contribute` makes jiuwenswarm, `1-run` stands it up, and then the people who use it are two **sibling** kinds — `2-consume` (use it as-is, for themselves) and `3-build` (use it to build for others). **Every finding belongs to exactly one persona**, so no finding is shared across profiles.

### 0 · Contribute — people who make jiuwenswarm

| Persona | Who they are |
|---|---|
| [Engine Contributor](personas/0-contribute/engine-contributor/engine-contributor.md) · **Covered** | Contributes code to the openjiuwen / jiuwenswarm codebase; extends the engine from the inside (rails, tools, the agent factory). |

### 1 · Run — operators who stand it up and keep it working

| Persona | Who they are |
|---|---|
| [Self-hoster](personas/1-run/self-hoster/self-hoster.md) · **Covered** | Installs, runs, and keeps one jiuwenswarm instance healthy (config, health, diagnostics, cost); no admin role — it is just their instance. |
| [Bot-hoster](personas/1-run/bot-hoster/bot-hoster.md) · **Partial** | Turns one running instance into a group chat bot for a team; adds per-user isolation and limits. |

### 2 · Consume — people who actually use the agent

**Shared base** — concerns every consumer feels on any surface:

| Persona | Who they are |
|---|---|
| [Consumer](personas/2-consume/consumer/consumer.md) · **Covered** | The base consumer: stop/crash, errors, notifications, context, memory/privacy. Everything below inherits this. |

**In the Web UI** (`2-consume/web/`):

| Persona | Who they are |
|---|---|
| [Web User](personas/2-consume/web/web-user/web-user.md) · **Covered** | The Web-UI base shared across chat and code mode. |
| [Web Chat](personas/2-consume/web/web-user-chat/web-user-chat.md) · **Covered** | Mostly questions and answers (`agent.work`). |
| [Web Code](personas/2-consume/web/web-user-code/web-user-code.md) · **Covered** | Mostly code work (`agent.code`); edits files, reviews diffs. |

**Text surfaces** (`2-consume/text/`) — terminal & messaging (surface findings pending):

| Persona | Who they are |
|---|---|
| [Text User](personas/2-consume/text/text-user/text-user.md) | Base for CLI/TUI/IM consumers. |
| [Text CLI](personas/2-consume/text/text-user-cli/text-user-cli.md) · [Text TUI](personas/2-consume/text/text-user-tui/text-user-tui.md) · [Text IM](personas/2-consume/text/text-user-im/text-user-im.md) | Terminal / messaging consumers (placeholder). |

**Channel surfaces** (`2-consume/channel/`) — developer/code channels (surface findings pending):

| Persona | Who they are |
|---|---|
| [Channel User](personas/2-consume/channel/channel-user/channel-user.md) | Base for IDE/Browser consumers. |
| [Channel IDE](personas/2-consume/channel/channel-user-ide/channel-user-ide.md) · [Channel Browser](personas/2-consume/channel/channel-user-browser/channel-user-browser.md) | Code-channel consumers (placeholder). |

### 3 · Build — people who build on/around jiuwenswarm for others

| Persona | Who they are |
|---|---|
| [Product Builder](personas/3-build/product-builder/product-builder.md) · **Covered** | Installs a ready jiuwenswarm and builds their own product using it as a backend (E2A/WebSocket or ACP API). |
| [Skill Author](personas/3-build/skill-author/skill-author.md) · **Covered** | Writes, packages, and distributes skills (capability content) a user enables on an instance. |

These are the roles JiuwenSwarm actually ships surfaces for (Web UI/desktop, CLI, TUI, IM
channels, IDE, browser, rails/harness, E2A/ACP). Roles with no shipped surface (audit, security,
QA, analytics, support) are not included. `0-contribute` makes jiuwenswarm and `1-run` stands it
up; then `2-consume` (people who use the agent for themselves) and `3-build` (people who use it
to build for others) are sibling users. Consume is a hierarchy: a concern every user feels lives
in the Consumer base, and each surface group (`web/`, `text/`, `channel/`) adds only its
surface's own concerns on top. This keeps each finding owned exactly once.
