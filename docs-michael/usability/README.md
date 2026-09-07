# jiuwenswarm — Usability Review

Content is split across two subfolders plus two files at the root. Start here to
orient yourself, then go directly to wherever you need.

Finding IDs (e.g. **3.1**, **17.4**) are stable across document versions.

---

## Navigation

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

One file per concern area (§1–§18). Full finding text lives here — exactly once.
When a finding is updated or resolved, only this file changes.

| File | Section | Findings |
|---|---|---|
| [00-overview.md](findings/00-overview.md) | **Root cause** | Why all these findings exist |
| [01-core-usability.md](findings/01-core-usability.md) | §1 · Core Usability | 1.1–1.9 |
| [02-operator-config.md](findings/02-operator-config.md) | §2 · Operator Config & Setup | 2.1–2.10 |
| [03-trust-safety.md](findings/03-trust-safety.md) | §3 · Trust & Safety | 3.1–3.4 |
| [04-reliability.md](findings/04-reliability.md) | §4 · Reliability & Resilience | 4.1–4.4 |
| [05-first-run.md](findings/05-first-run.md) | §5 · First-Run Experience | 5.1–5.4 |
| [06-transparency.md](findings/06-transparency.md) | §6 · Agent Transparency | 6.1–6.4 |
| [07-performance.md](findings/07-performance.md) | §7 · Performance & Perceived Speed | 7.1–7.3 |
| [08-async-notifications.md](findings/08-async-notifications.md) | §8 · Async Notifications | 8.1–8.2 |
| [09-economic-ux.md](findings/09-economic-ux.md) | §9 · Economic UX | 9.1–9.2 |
| [10-skill-ecosystem.md](findings/10-skill-ecosystem.md) | §10 · Skill Ecosystem | 10.1–10.4 |
| [11-multi-user.md](findings/11-multi-user.md) | §11 · Multi-User & Collaboration | 11.1–11.3 |
| [12-data-privacy.md](findings/12-data-privacy.md) | §12 · Data & Privacy | 12.1–12.3 |
| [13-help-support.md](findings/13-help-support.md) | §13 · Help & Support | 13.1–13.3 |
| [14-accessibility.md](findings/14-accessibility.md) | §14 · Accessibility | 14.1–14.3 |
| [15-mobile.md](findings/15-mobile.md) | §15 · Mobile & Cross-Platform | 15.1–15.2 |
| [16-info-architecture.md](findings/16-info-architecture.md) | §16 · Information Architecture | 16.1–16.3 |
| [17-developer-usability.md](findings/17-developer-usability.md) | §17 · Developer Usability | 17.1–17.12 |
| [18-app-developer.md](findings/18-app-developer.md) | §18 · Application Developer Usability | 18.1–18.10 |

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
