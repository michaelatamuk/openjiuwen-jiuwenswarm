[← Index](README.md) · jiuwenswarm Usability Review

---

# Presentation Outline (Engineering Leads)

A 5-slide run you can present live (~10 min). Say the lines in your own words.

---

## Slide 1 — The one systemic issue

> "We have ~100 findings, but they mostly say one thing: jiuwenswarm already *knows* — the health, the config errors, the token counts — it just never tells the user. So users assume things work while they quietly break, and they can't control what the agent does."

**Proof point to hold in mind:** a wrong API key only fails on the *first chat*, not at startup.

---

## Slide 2 — Bucket 1 · Trust & Control

> "The agent acts and the user can't see it, approve it, or reverse it. No preview before it edits files, no confirmation before it sends externally, no safe stop, and only partial undo in code mode."

**Why it matters:** without control/undo, users won't trust it with real work.

---

## Slide 3 — Bucket 2 · Cost & Invisibility

> "We pay for context we can't see — even '2+2' builds the full context every call — and when something breaks, nothing tells you."

**Proof point:** silent failures + no token/cost visibility = spend and downtime the user never sees.

---

## Slide 4 — Bucket 3 · Adoption & Experience

> "Setup and onboarding are friction, the GUI isn't fully translated, and extending or integrating is high-friction — undocumented, no scaffold, no SDK. Skills are hard to version and test."

**Why it matters:** it slows first-run, international, developer, and skill adopters.

---

## Slide 5 — What we'd do first + the ask

> "Three small, visible fixes de-risk the rest: (1) errors that say what happened and where the log is, (2) validate credentials at startup / test them in the wizard, (3) show token/cost and don't build the full context for trivial prompts."

**Ask:** "Give me a call on severity/effort so we can rank these, and a slot to start with items 1–2."

---

*Full detail: [finding-priorities.md](finding-priorities.md) · [engineering-summary.md](engineering-summary.md) · [matrix.md](matrix.md).*
