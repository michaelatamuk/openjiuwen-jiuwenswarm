# jiuwenswarm — Usability Review

Content is split across two subfolders plus two files at the root. Start here to
orient yourself, then go directly to wherever you need. Each finding is identified by its
concern file and a short, self-explanatory title.

---

## Navigation

Quick reads: [00-overview — root cause & concern map](findings/00-overview.md)

### `personas/` — Start here if you are a specific role

One file per persona. Each file is a short profile: who this person is and which concern
folders matter to them (linking into the findings). Read the file for your role.

| File | Persona | Tier | Status |
|---|---|---|---|
| [engine-contributor.md](personas/0-contribute/engine-contributor.md) | **Engine Contributor** | 0 · Contribute | Covered |
| [self-hoster.md](personas/1-run/self-hoster.md) | **Self-hoster** | 1 · Run | Covered |
| [service-operator.md](personas/1-run/service-operator.md) | **Service Operator** | 1 · Run | Partial |
| [product-builder.md](personas/2-build/product-builder.md) | **Product Builder** | 2 · Build | Covered |
| [skill-author.md](personas/2-build/skill-author.md) | **Skill Author** | 2 · Build | Covered |
| [consumer.md](personas/3-consume/consumer.md) | **Consumer** (base) | 3 · Consume | Covered |
| [web/web-user.md](personas/3-consume/web/web-user.md) · [chatter.md](personas/3-consume/web/chatter.md) · [coder.md](personas/3-consume/web/coder.md) | Web User (+ Chat / Coder) | 3 · Consume | Covered |
| [im-user.md](personas/3-consume/im-user.md) | **IM User** | 3 · Consume | Covered |

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

## Personas

Personas are laid out as a pipeline, **0 → 3**, ordered by **who depends on whom**: *make the software → run it → build with it → use it*. **Every finding belongs to exactly one persona**, so no finding is shared across profiles.

### 0 · Contribute — people who make jiuwenswarm

| Persona | Who they are |
|---|---|
| [Engine Contributor](personas/0-contribute/engine-contributor.md) · **Covered** | Contributes code to the openjiuwen / jiuwenswarm codebase; extends the engine from the inside (rails, tools, the agent factory). |

### 1 · Run — operators who stand it up and keep it working

| Persona | Who they are |
|---|---|
| [Self-hoster](personas/1-run/self-hoster.md) · **Covered** | Installs, runs, and keeps one jiuwenswarm instance healthy (config, health, diagnostics, cost); no admin role — it is just their instance. |
| [Service Operator](personas/1-run/service-operator.md) · **Partial** | Turns one running instance into a group chat bot for a team; adds per-user isolation and limits. |

### 2 · Build — people who build on/around a running instance

| Persona | Who they are |
|---|---|
| [Product Builder](personas/2-build/product-builder.md) · **Covered** | Installs a ready jiuwenswarm and builds their own product using it as a backend (E2A/WebSocket or ACP API). |
| [Skill Author](personas/2-build/skill-author.md) · **Covered** | Writes, packages, and distributes skills (capability content) a user enables on an instance. |

### 3 · Consume — people who actually use the agent

**Shared base** — concerns every consumer feels on any surface:

| Persona | Who they are |
|---|---|
| [Consumer](personas/3-consume/consumer.md) · **Covered** | The base consumer: stop/crash, errors, notifications, context, memory/privacy. Everything below inherits this. |

**In the Web UI** (`3-consume/web/`):

| Persona | Who they are |
|---|---|
| [Web User](personas/3-consume/web/web-user.md) · **Covered** | The Web-UI base shared across chat and code mode. |
| [Chatter](personas/3-consume/web/chatter.md) · **Covered** | Mostly questions and answers (`agent.work`). |
| [Coder](personas/3-consume/web/coder.md) · **Covered** | Mostly code work (`agent.code`); edits files, reviews diffs. |

**Not on the Web UI:**

| Persona | Who they are |
|---|---|
| [IM User](personas/3-consume/im-user.md) · **Covered** | Talks to a running instance only through an IM bot. |

These are the roles JiuwenSwarm actually ships surfaces for (desktop/CLI, Web UI, TUI, IM
channels, skill hubs, rails/harness, E2A/ACP). Roles with no shipped surface (audit, security,
QA, analytics, support) are not included. The tiers are a pipeline 0 → 3: Contribute makes
jiuwenswarm, Run stands it up, Build produces things on/around it, and only the Consume tier
(3) actually uses the agent. Consume is itself a hierarchy: a concern every user feels lives in
the Consumer base, a Web-UI concern in the Web User base, and chat and coder add only what
is unique to them. This keeps each finding owned exactly once.
