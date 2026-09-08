# jiuwenswarm — Usability Review

Content is split across two subfolders plus two files at the root. Start here to
orient yourself, then go directly to wherever you need. Each finding is identified by its
concern file and a short, self-explanatory title.

---

## Navigation

Quick reads: [engineering-leads summary](engineering-summary.md) · [00-overview — root cause & concern map](findings/00-overview.md) · [matrix — findings × personas](matrix.md)

### `personas/` — Start here if you are a specific role

One file per persona. Each file is a short profile: who this person is and which concern
folders matter to them (linking into the findings). Read the file for your role.

| File | Persona | Tier | Status |
|---|---|---|---|
| [instance-admin.md](personas/1-keystone/instance-admin.md) | **Instance Admin** | Keystone | Covered |
| [extension-developer.md](personas/2-supply/extension-developer.md) | **Extension Developer** | Supply | Covered |
| [skill-author.md](personas/2-supply/skill-author.md) | **Skill Author** | Supply | Covered |
| [consume-user.md](personas/3-consume/consume-user.md) | **Consume User** (basic) | Consume | Covered |
| [web/web-user.md](personas/3-consume/web/web-user.md) · [web-user-chatter.md](personas/3-consume/web/web-user-chatter.md) · [web-user-coder.md](personas/3-consume/web/web-user-coder.md) | Web-UI consumers (Web / Chat / Coder) | Consume | Covered |
| [not-web/im-user.md](personas/3-consume/not-web/im-user.md) | **IM User** | Consume | Covered |
| [application-developer.md](personas/3-consume/not-web/application-developer.md) | **Application Developer** | Consume | Covered |
| [shared-bot-admin.md](personas/3-consume/not-web/shared-bot-admin.md) | **Shared Bot Admin** | Consume | Partial |

---

### `findings/` — Single source of truth for each finding

Findings are grouped into **theme folders**, each containing single-source concern files.
Each finding lives exactly once, in exactly one file, numbered within that file and given a
short, self-explanatory title. When a finding is updated or resolved, only that file changes.

Start with [00-overview.md](findings/00-overview.md) for the root cause and a theme → folder map.

**`conversation/`** — the day-to-day chat experience
- [errors-and-feedback](findings/conversation/errors-and-feedback/) — Errors & Feedback · 2 findings
- [output-and-speed](findings/conversation/output-and-speed/) — Output & Perceived Speed · 5 findings
- [explanation](findings/conversation/explanation/) — Agent Explanation · 3 findings
- [messages-and-history](findings/conversation/messages-and-history/) — Messages, History & Notifications · 4 findings

**`control/`** — capability boundaries, approval, stopping & undoing
- [permissions](findings/control/permissions/) — Permissions · 1 findings
- [approve-and-preview](findings/control/approve-and-preview/) — Approval & Preview · 2 findings
- [stop-resume-undo](findings/control/stop-resume-undo/) — Stop, Resume & Undo · 4 findings

**`memory-and-privacy/`** — what is remembered, sent out and kept
- [memory-visibility](findings/memory-and-privacy/memory-visibility/) — Memory Visibility · 2 findings
- [retention](findings/memory-and-privacy/retention/) — Data Retention · 1 findings

**`setup-and-operation/`** — run & administer the instance
- [startup-and-config](findings/setup-and-operation/startup-and-config/) — Startup & Configuration · 4 findings
- [run-and-manage](findings/setup-and-operation/run-and-manage/) — Running & Managing the Instance · 7 findings
- [health-and-degradation](findings/setup-and-operation/health-and-degradation/) — Health & Degradation · 2 findings
- [diagnostics-and-help](findings/setup-and-operation/diagnostics-and-help/) — Diagnostics & Support · 3 findings
- [economics](findings/setup-and-operation/economics/) — Cost & Token Economics · 3 findings

**`onboarding/`** — first run, empty states & gradual discovery
- [first-run](findings/onboarding/first-run/) — First Run · 2 findings
- [empty-state-and-choosing](findings/onboarding/empty-state-and-choosing/) — Empty States & Choosing a Mode · 2 findings
- [progressive](findings/onboarding/progressive/) — Progressive Discovery · 1 findings
- [navigation-and-settings](findings/onboarding/navigation-and-settings/) — Navigation & Settings · 3 findings

**`platform/`** — accessibility & cross-device
- [accessibility](findings/platform/accessibility/) — Accessibility & Keyboard · 4 findings
- [mobile](findings/platform/mobile/) — Mobile & Cross-Device · 2 findings

**`skills/`** — marketplace, authoring, versioning
- [marketplace](findings/skills/marketplace/) — Skill Marketplace · 1 findings
- [authoring-and-testing](findings/skills/authoring-and-testing/) — Skill Authoring & Dependencies · 3 findings
- [versioning](findings/skills/versioning/) — Skill Versioning · 1 findings

**`collaboration/`** — multi-user & sharing
- [identity-and-isolation](findings/collaboration/identity-and-isolation/) — Identity & Isolation · 2 findings
- [shared-library](findings/collaboration/shared-library/) — Shared Skill Library · 1 findings

**`extension-surface/`** — building behaviour into jiuwenswarm (rails, tools, SDK)
- [rails-and-context-api](findings/extension-surface/rails-and-context-api/) — Rails & Context API · 5 findings
- [tools-and-agent-factory](findings/extension-surface/tools-and-agent-factory/) — Tools & Agent Factory · 2 findings
- [testing-and-tooling](findings/extension-surface/testing-and-tooling/) — Extension Testing & Tooling · 3 findings
- [documentation-and-stability](findings/extension-surface/documentation-and-stability/) — Extension Documentation & Stability · 2 findings

**`application-api/`** — building a product on top of jiuwenswarm as a backend
- [transport-and-protocol](findings/application-api/transport-and-protocol/) — Transport & Protocol · 4 findings
- [security-and-isolation](findings/application-api/security-and-isolation/) — Connection Security · 2 findings
- [integration-and-local-development](findings/application-api/integration-and-local-development/) — Integration & Local Development · 3 findings

---

### `matrix.md` — Cross-reference

[matrix.md](matrix.md) answers "which finding matters to which persona" — a table
of all findings × personas. Lives at the root alongside this file.

---

## Personas

Personas are ordered by **who depends on whom** — not by which screen they use. Everyone downstream is only able to work because someone above produced a healthy, running instance. **Every finding belongs to exactly one persona**, so no finding is shared across profiles. The exhaustive finding-by-finding map is in [matrix.md](matrix.md).

### 1 · Keystone — the running instance everyone depends on

| Persona | Who they are |
|---|---|
| [Instance Admin](personas/1-keystone/instance-admin.md) · **Covered** | The administrator (运维) who installs, configures, runs, and keeps one JiuwenSwarm healthy (config, health, diagnostics, cost). Does **not** use it for tasks. |

### 2 · Supply — authors who put things INTO the instance

| Persona | Who they are |
|---|---|
| [Extension Developer](personas/2-supply/extension-developer.md) · **Covered** | Extends the runtime from inside: rails, tools, and the Python SDK. |
| [Skill Author](personas/2-supply/skill-author.md) · **Covered** | Writes, packages, and distributes skills. |

### 3 · Consume — people who use the running instance

**Basic consume user** — the base every consumer inherits:

| Persona | Who they are |
|---|---|
| [Consume User](personas/3-consume/consume-user.md) · **Covered** | The basic consume user. Concerns every consumer feels on any surface (stop/crash, errors, notifications, context, memory/privacy). |

**Web sub-group** (`3-consume/web/`) — consumers in the Web UI:

| Persona | Who they are |
|---|---|
| [Web User](personas/3-consume/web/web-user.md) · **Covered** | The Web-UI base shared across chat and code mode. |
| [Chat User](personas/3-consume/web/web-user-chatter.md) · **Covered** | Mostly questions and answers (`agent.work`). |
| [Coder](personas/3-consume/web/web-user-coder.md) · **Covered** | Mostly code work (`agent.code`); edits files, reviews diffs. |

**Non-Web sub-group** (`3-consume/not-web/`) — consumers not on the Web UI:

| Persona | Who they are |
|---|---|
| [IM User](personas/3-consume/not-web/im-user.md) · **Covered** | Talks to a running instance only through an IM bot. |
| [Application Developer](personas/3-consume/not-web/application-developer.md) · **Covered** | A product on top of the running instance over the E2A/WebSocket (or ACP) API. |
| [Shared Bot Admin](personas/3-consume/not-web/shared-bot-admin.md) · **Partial** | Turns one running instance into a group chat bot for a team. |

These are the roles JiuwenSwarm actually ships surfaces for (desktop/CLI, Web UI, TUI, IM
channels, skill hubs, rails/harness, E2A/ACP). Roles with no shipped surface (audit, security,
QA, analytics, support) are not included. Consume is a hierarchy: a concern every consumer
feels lives in the Consume User base; a Web-UI concern lives in the Web User base; and chat/
coder/IM/app/bot add only what is unique to them. This keeps each finding owned exactly once.
Instance Admin observes the running instance, while Extension Developer and Skill Author are
accountable for not breaking it and for fixing what they shipped.
