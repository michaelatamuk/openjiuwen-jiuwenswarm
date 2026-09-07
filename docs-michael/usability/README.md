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
| [end-user.md](personas/end-user.md) | **P1 — End-User** | Covered · 36 findings |
| [operator.md](personas/operator.md) | **P2 — Operator** | Covered · 22 findings |
| [extension-developer.md](personas/extension-developer.md) | **P3 — Extension Developer** | Covered · 12 findings |
| [application-developer.md](personas/application-developer.md) | **P4 — Application Developer** | Covered · 11 findings |
| [skill-author.md](personas/skill-author.md) | **P5 — Skill Author** | Partial |
| [shared-deployment-operator.md](personas/shared-deployment-operator.md) | **P6 — Shared Deployment Operator** | Partial |
| [auditor.md](personas/auditor.md) | **P7 — Auditor / Compliance Officer** | Not yet covered |
| [agent-evaluator.md](personas/agent-evaluator.md) | **P8 — Agent QA / Evaluator** | Not yet covered |
| [support-help-desk.md](personas/support-help-desk.md) | **P9 — Support / Help Desk** | Not yet covered |
| [prompt-engineer.md](personas/prompt-engineer.md) | **P10 — AI / Prompt Engineer** | Not yet covered |
| [security-researcher.md](personas/security-researcher.md) | **P11 — Security Researcher** | Not yet covered |
| [data-analyst.md](personas/data-analyst.md) | **P12 — Data Analyst** | Not yet covered |
| [im-channel-user.md](personas/im-channel-user.md) | **P13 — IM Channel User** | Not yet covered |

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

[matrix.md](matrix.md) answers "which personas are affected by finding X.Y?" — a table
of all findings × all personas. Lives at the root alongside this file.

---

## Personas

### Fully covered

| ID | Persona | Who they are |
|---|---|---|
| **P1** | **End-User** | The person chatting with the agent day to day. **Two variants:** Web UI user (full access) and IM channel user (Feishu/Telegram/WeChat, no Web UI — see P13). In self-hosted individual deployments, P1 and P2 are the same person. |
| **P2** | **Operator** | The person who installs, configures, and maintains the instance. |
| **P3** | **Extension Developer** | The engineer who extends jiuwenswarm from inside: writes custom rails, registers tools, works within the Python SDK. |
| **P4** | **Application Developer** | The engineer who builds their own product on top of jiuwenswarm as a backend: connects via E2A/WebSocket, builds a custom frontend or automation. |

### Partially covered

| ID | Persona | Who they are |
|---|---|---|
| **P5** | **Skill Author** | Creates skills for the marketplace — writes `SKILL.md`, packages Python tools, tests and submits skills. |
| **P6** | **Shared Deployment Operator** | Deploys jiuwenswarm as a shared IM bot for a group. **Note:** jiuwenswarm has no human team management system. "Team" in the product = multi-agent configs (Leader Agent + Teammate Agents). P6's concerns are session isolation between users, per-user visibility, and rate limiting. |

### Not yet covered

| ID | Persona | Short description |
|---|---|---|
| **P7** | [Auditor / Compliance Officer](personas/auditor.md) | Reviews agent activity for legal/regulatory purposes |
| **P8** | [Agent QA / Evaluator](personas/agent-evaluator.md) | Tests agent quality, runs benchmarks, catches regressions |
| **P9** | [Support / Help Desk](personas/support-help-desk.md) | Diagnoses failures, resets user state, replays sessions |
| **P10** | [AI / Prompt Engineer](personas/prompt-engineer.md) | Crafts and optimizes prompts and skill descriptions |
| **P11** | [Security Researcher](personas/security-researcher.md) | Tests deployment security posture |
| **P12** | [Data Analyst](personas/data-analyst.md) | Analyzes aggregate agent behavior and usage patterns |
| **P13** | [IM Channel User](personas/im-channel-user.md) | Talks to jiuwenswarm through Feishu/Telegram/WeChat with no Web UI access |
