# jiuwenswarm — Usability Review

This folder contains the usability findings for jiuwenswarm, organized by persona.
Go directly to the file for your persona — no need to read the whole thing.

Finding IDs (e.g. **3.1**, **17.4**) are stable across document versions and are
used in the prioritized backlog.

---

## Quick navigation

| File | Persona | Findings |
|---|---|---|
| [p1-end-user.md](p1-end-user.md) | **P1 — End-User** | §1, §3–8, §12–16 · 38 findings |
| [p2-operator.md](p2-operator.md) | **P2 — Operator** | §2, §9, §10 · 16 findings + cross-refs |
| [p3-extension-dev.md](p3-extension-dev.md) | **P3 — Extension Developer** | §17 · 12 findings |
| [p4-app-dev.md](p4-app-dev.md) | **P4 — Application Developer** | §18 · 10 findings |
| [p5-skill-author.md](p5-skill-author.md) | **P5 — Skill Author** | §10 partial · 2 findings + gap list |
| [p6-shared-deploy.md](p6-shared-deploy.md) | **P6 — Shared Deployment Operator** | §11 · 3 findings + gap list |
| [stubs.md](stubs.md) | **P7–P13** | Not yet covered — definitions + key needs |
| [matrix.md](matrix.md) | All personas | Cross-reference: which findings affect which personas |
| [core-problem.md](core-problem.md) | — | Top 5 highest-leverage fixes across all personas |

---

## Personas

### Fully covered

| ID | Persona | Who they are |
|---|---|---|
| **P1** | **End-User** | The person chatting with the agent day to day — gives tasks, reads responses, judges whether the agent is useful. **Two variants:** Web UI user (full access) and IM channel user (Feishu/Telegram/WeChat, no Web UI — see P13). |
| **P2** | **Operator** | The person who installs, configures, deploys, and maintains the jiuwenswarm instance. **Note:** in the most common deployment (self-hosted individual), P1 and P2 are the same person. The split matters when jiuwenswarm is deployed as a shared IM bot. |
| **P3** | **Extension Developer** | The engineer who extends jiuwenswarm from inside: writes custom rails, registers tools, works within the Python SDK. |
| **P4** | **Application Developer** | The engineer who builds their own product on top of jiuwenswarm as a backend: connects via E2A/WebSocket, builds a custom frontend or automation. |

### Partially covered

| ID | Persona | Who they are |
|---|---|---|
| **P5** | **Skill Author** | Creates skills to publish to the marketplace — writes `SKILL.md`, packages Python tools, tests and submits skills. |
| **P6** | **Shared Deployment Operator** | Deploys jiuwenswarm as a shared IM bot for a group or team. Configures channel access, manages session isolation between users. **Note:** jiuwenswarm has no human team management system — there is no "Team Admin" role. The "team" concept in the product refers to multi-agent configurations (Leader Agent + Teammate Agents), not human teams. |

### Not yet covered

See [stubs.md](stubs.md) for full definitions and key unmet needs.

| ID | Persona | Short description |
|---|---|---|
| **P7** | Auditor / Compliance Officer | Reviews agent activity for legal/regulatory purposes |
| **P8** | Agent QA / Evaluator | Tests agent quality, runs benchmarks, catches regressions |
| **P9** | Support / Help Desk | Diagnoses failures, resets user state, replays sessions |
| **P10** | AI / Prompt Engineer | Crafts and optimizes prompts and skill descriptions |
| **P11** | Security Researcher | Tests deployment security posture |
| **P12** | Data Analyst | Analyzes aggregate agent behavior and usage patterns |
| **P13** | IM Channel User | Talks to jiuwenswarm through Feishu/Telegram/WeChat with no Web UI access |

---

## How findings are organized

Each persona file is self-contained. Findings that affect multiple personas appear
**in full** under the primary persona and as **brief navigational entries** under
secondary ones — no content duplication, but each file has enough context to stand
alone.

Use [matrix.md](matrix.md) to answer "which personas are affected by finding X.Y?"
Use [core-problem.md](core-problem.md) for the executive summary and top 5 fixes.
