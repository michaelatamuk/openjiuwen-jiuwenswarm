# jiuwenswarm — Usability Review

Content is split across two subfolders plus two files at the root. Start here to
orient yourself, then go directly to wherever you need. Each finding is identified by its
concern file and a short, self-explanatory title.

---

## Navigation

Quick reads: [00-overview — root cause & concern map](findings/00-overview.md) · [matrix — findings × personas](matrix.md)

### `personas/` — Start here if you are a specific role

One file per persona. Each file lists every finding relevant to that persona as a
one-liner with a link to the full finding text. Read only the file for your role.

| File | Persona | Status |
|---|---|---|
| [end-user.md](personas/using/end-user.md) | **End-User** | Covered · 44 findings |
| [developer.md](personas/using/developer.md) | **Developer** | Covered · 9 findings |
| [instance-admin.md](personas/operating/instance-admin.md) | **Instance Admin** | Covered · 26 findings |
| [extension-developer.md](personas/extending/extension-developer.md) | **Extension Developer** | Covered · 12 findings |
| [application-developer.md](personas/integrating/application-developer.md) | **Application Developer** | Covered · 11 findings |
| [skill-author.md](personas/extending/skill-author.md) | **Skill Author** | Partial · 2 findings |
| [shared-bot-admin.md](personas/operating/shared-bot-admin.md) | **Shared Bot Admin** | Partial · 5 findings |

---

### `findings/` — Single source of truth for each finding

Findings are grouped into **theme folders**, each containing single-source concern files.
Each finding lives exactly once, in exactly one file, numbered within that file and given a
short, self-explanatory title. When a finding is updated or resolved, only that file changes.

Start with [00-overview.md](findings/00-overview.md) for the root cause and a theme → folder map.

**`conversation/`** — the day-to-day chat experience
- [errors-and-feedback.md](findings/conversation/errors-and-feedback.md) — Errors & Feedback · 2 findings
- [output-and-speed.md](findings/conversation/output-and-speed.md) — Output & Perceived Speed · 5 findings
- [explanation.md](findings/conversation/explanation.md) — Agent Explanation · 4 findings
- [messages-and-history.md](findings/conversation/messages-and-history.md) — Messages, History & Notifications · 4 findings

**`control/`** — capability boundaries, approval, stopping & undoing
- [permissions.md](findings/control/permissions.md) — Permissions · 1 findings
- [approve-and-preview.md](findings/control/approve-and-preview.md) — Approval & Preview · 2 findings
- [stop-resume-undo.md](findings/control/stop-resume-undo.md) — Stop, Resume & Undo · 4 findings

**`memory-and-privacy/`** — what is remembered, sent out and kept
- [memory-visibility.md](findings/memory-and-privacy/memory-visibility.md) — Memory Visibility · 2 findings
- [retention.md](findings/memory-and-privacy/retention.md) — Data Retention · 1 findings

**`setup-and-operation/`** — run & administer the instance
- [startup-and-config.md](findings/setup-and-operation/startup-and-config.md) — Startup & Configuration · 4 findings
- [run-and-manage.md](findings/setup-and-operation/run-and-manage.md) — Running & Managing the Instance · 6 findings
- [health-and-degradation.md](findings/setup-and-operation/health-and-degradation.md) — Health & Degradation · 2 findings
- [diagnostics-and-help.md](findings/setup-and-operation/diagnostics-and-help.md) — Diagnostics & Support · 3 findings
- [economics.md](findings/setup-and-operation/economics.md) — Cost & Token Economics · 2 findings

**`onboarding/`** — first run, empty states & gradual discovery
- [first-run.md](findings/onboarding/first-run.md) — First Run · 2 findings
- [empty-state-and-choosing.md](findings/onboarding/empty-state-and-choosing.md) — Empty States & Choosing a Mode · 2 findings
- [progressive.md](findings/onboarding/progressive.md) — Progressive Discovery · 1 findings
- [navigation-and-settings.md](findings/onboarding/navigation-and-settings.md) — Navigation & Settings · 3 findings

**`platform/`** — accessibility & cross-device
- [accessibility.md](findings/platform/accessibility.md) — Accessibility & Keyboard · 4 findings
- [mobile.md](findings/platform/mobile.md) — Mobile & Cross-Device · 2 findings

**`skills/`** — marketplace, authoring, versioning
- [marketplace.md](findings/skills/marketplace.md) — Skill Marketplace · 1 findings
- [authoring-and-testing.md](findings/skills/authoring-and-testing.md) — Skill Authoring & Dependencies · 3 findings
- [versioning.md](findings/skills/versioning.md) — Skill Versioning · 1 findings

**`collaboration/`** — multi-user & sharing
- [identity-and-isolation.md](findings/collaboration/identity-and-isolation.md) — Identity & Isolation · 2 findings
- [shared-library.md](findings/collaboration/shared-library.md) — Shared Skill Library · 1 findings

**`extension-surface/`** — building behaviour into jiuwenswarm (rails, tools, SDK)
- [rails-and-context-api.md](findings/extension-surface/rails-and-context-api.md) — Rails & Context API · 5 findings
- [tools-and-agent-factory.md](findings/extension-surface/tools-and-agent-factory.md) — Tools & Agent Factory · 2 findings
- [testing-and-tooling.md](findings/extension-surface/testing-and-tooling.md) — Extension Testing & Tooling · 3 findings
- [documentation-and-stability.md](findings/extension-surface/documentation-and-stability.md) — Extension Documentation & Stability · 2 findings

**`application-api/`** — building a product on top of jiuwenswarm as a backend
- [transport-and-protocol.md](findings/application-api/transport-and-protocol.md) — Transport & Protocol · 4 findings
- [security-and-isolation.md](findings/application-api/security-and-isolation.md) — Connection Security · 2 findings
- [integration-and-local-development.md](findings/application-api/integration-and-local-development.md) — Integration & Local Development · 3 findings

---

### `matrix.md` — Cross-reference

[matrix.md](matrix.md) answers "which finding matters to which persona" — a table
of all findings × personas. Lives at the root alongside this file.

---

## Personas

Personas are grouped by how each person relates to the system — that relationship is what
decides which findings matter to them.

### Using — people who talk to the agent

| Persona | Who they are |
|---|---|
| [End-User](personas/using/end-user.md) · **Covered, 44 findings** | Converses with the agent day to day over the Web UI or an IM channel; not someone who configures or builds. |
| [Developer](personas/using/developer.md) · **Covered, 9 findings** | A technical user driving the agent as a coding and automation assistant (Code workspace, IDE, terminal/TUI, CLI); when self-hosting, also the Instance Admin. |

### Administering — people who run it

| Persona | Who they are |
|---|---|
| [Instance Admin](personas/operating/instance-admin.md) · **Covered, 26 findings** | The administrator (运维) who installs, configures, runs, and keeps one JiuwenSwarm working — models, channels, tool-permission whitelists, memory, upgrades. |
| [Shared Bot Admin](personas/operating/shared-bot-admin.md) · **Partial, 5 findings** | Runs one instance that a whole group uses through a chat bot; on top of instance-admin duties, keeps each user's session/memory separate and stops one user from taking the instance down. |

### Extending — people who build into the product

| Persona | Who they are |
|---|---|
| [Extension Developer](personas/extending/extension-developer.md) · **Covered, 12 findings** | The engineer extending jiuwenswarm from inside: rails, tools, and the Python SDK. |
| [Skill Author](personas/extending/skill-author.md) · **Partial, 2 findings** | The person who writes and packages skills for the marketplace — `SKILL.md`, Python tools, prompt/instruction content. |

### Integrating — people who build on top as a backend

| Persona | Who they are |
|---|---|
| [Application Developer](personas/integrating/application-developer.md) · **Covered, 11 findings** | The engineer building their own product on jiuwenswarm as a backend, over the E2A/WebSocket API. |

Personas here are the roles JiuwenSwarm actually ships surfaces for (desktop/CLI, Web UI, TUI, IM channels, skill hubs, rails/harness, E2A/ACP). Auditing/compliance/security/QA/analyst roles were considered but have no product surface yet, so they are not included.
