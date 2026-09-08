[← Index](README.md) · jiuwenswarm Usability Review

---

# Engineering-Leads Summary

*What the usability review found, where the real problems are, and what to fix first.*

The full corpus is ~100 findings, organized by theme under [`findings/`](findings/), mapped to personas in [`matrix.md`](matrix.md), and per-persona in [`personas/`](personas/). This page is the short version you can plan against.

---

## Bottom line

jiuwenswarm's features mostly work — but **usability wasn't engineered as a cross-cutting concern**, so users keep hitting silent failures, invisible costs, and undocumented surfaces. Most findings are not new features; they are **surfacing things the system already does**, which makes them cheap to fix and high-leverage.

---

## The one systemic issue

Across the corpus the pattern repeats: **the system has the data (health, trajectory, config errors, token counts, logs) but never shows it to the user.** Users assume things are fine when they're silently degrading, can't tell what the agent may do or undo it, and pay for context they can't see. Fixing *communication* (not architecture) resolves a large share of findings.

---

## Where findings concentrate (themes → owner leads)

| Theme | What's wrong (concrete) | Where | Owner |
|---|---|---|---|
| **First-run & setup** | Setup wizard ends before credentials are tested; wrong keys fail on the first chat; CLI gives no next step | `findings/onboarding`, `…/startup-and-config` | Product / onboarding |
| **Control & trust** | No permission summary before the agent acts; file changes apply with no preview; nothing is undoable | `findings/control` | Harness / tooling |
| **Cost & efficiency** | Trivial prompts still build the full context (memory + all skills + tool schemas); no token/cost visibility | `findings/setup-and-operation/economics` | Core / serving |
| **Reliability / observability** | Degraded subsystems fail silently; the Web log viewer is dead code; cron shows no run history/failures | `findings/setup-and-operation/health…`, `cron`, `logs` | Core / SRE |
| **Developer & API surface** | Rail/extension API undocumented; no scaffold; WebSocket-only with no auth; no published SDK | `findings/extension-surface`, `…/application-api` | Platform / DevRel |
| **Internationalization & platform** | GUI only partially translated; mobile/a11y gaps | `…/run-and-manage`, `findings/platform` | Frontend |

---

## Persona → who owns the impact

| Persona | Dominant concerns |
|---|---|
| Web / IM User | setup, control/trust, cost, mobile/a11y |
| Instance / Shared Bot Admin | config, health, cron, cost, permissions tooling |
| Extension / Product Developer | rail API docs, scaffolding, WebSocket-only API, no auth/SDK |

---

## Integrity note

Findings were verified against source where possible: cited files/components exist; one fabricated quote was removed and several claims corrected (see the audit trail). Absence-claims and illustrative snippets carry the most residual risk.

---

## Recommended first wave (impact × effort)

Quick wins (bounded, no architectural change), in suggested order:

1. **Actionable errors + log pointer** — every error answers what/why/next and cites the log (`ERR_*` code). *(errors & feedback)*
2. **Startup health check + test credentials in the wizard** — catch broken model/channel config before the first chat. *(setup)*
3. **Control: permissions summary, file preview/approve, stop + undo** — biggest trust lever. *(control)*
4. **Context/cost: show token count, load context selectively** — stop paying the full fixed context for trivial prompts; surface cost. *(economics)*
5. **Complete the i18n** — route every user-facing string through locale files. *(i18n)*
6. *(Dev track)* **RAILS.md + `new rail` scaffold + publish SDK & enable auth** — unblocks extension/API adopters.

Assign severity/effort per finding in the corpus before committing, but these six cover the highest-count, highest-visible-impact areas.

---

## Where to read more

- Themes & files: [`findings/`](findings/)
- Persona × finding map: [`matrix.md`](matrix.md)
- Persona profiles: [`personas/`](personas/)

---
