# Slide 1 — The 4 pillars of people around jiuwenswarm

> **Spec for the slide builder.** This file tells you exactly what to put on the slide: four pillars, each with a precise, complete list of personas. Use only what is listed. There is no "base"/"basic" user on the slide — only the actual (leaf) personas that people can be.

---

## The one idea

jiuwenswarm is open source. Four kinds of people surround it. The slide shows four **pillars**, and under each pillar the **exact personas** that belong to it.

Pillars, in order: **Makers → Runners → Consumers → Builders.**

---

## The 4 pillars with their exact personas (this is the slide content)

**Pillar 1 · Makers** — the people who build jiuwenswarm itself (open source).
- Engine Contributor

**Pillar 2 · Runners** — the people who run and keep instances working.
- Self-hoster
- Bot-hoster

**Pillar 3 · Consumers** *(B2C — jiuwenswarm → end user)* — the people who actually use the agent directly. They are listed by which surface they use:
- Web chatter
- Web coder
- Text CLI
- Text TUI
- Text IM
- Channel Browser
- Channel IDE

**Pillar 4 · Builders** *(Ecosystem / M2M / B2B2C)* — the people who build on top of jiuwenswarm for others. Each has a different market relationship.
- Skill Author — *Ecosystem* (contributes capability to the platform)
- Agent Integrator — *M2M* (machine-to-machine, connects an agent system to jiuwenswarm)
- Product Builder — *B2B2C* (builds a consumer product with jiuwenswarm as backend)

Do not show "Consumer", "Web User", "Text User", or "Channel User" as pillars — those are internal base personas and must not appear on the slide.

---

## How to render

One slide, four columns left → right. On top of each column put the pillar name (bold), with a small italic market-model label directly beneath it for Consumers and Builders. Then list the personas.

| Column | Sub-label (italic, below pillar name) | Personas (exact labels) |
|---|---|---|
| **Makers** | — | Engine Contributor |
| **Runners** | — | Self-hoster · Bot-hoster |
| **Consumers** | *B2C* | Web chatter · Web coder · Text CLI · Text TUI · Text IM · Channel Browser · Channel IDE |
| **Builders** | *Ecosystem / M2M / B2B2C* | Skill Author · Agent Integrator · Product Builder |

Use persona labels verbatim. The B2C / B2B2C sub-labels are part of the slide content.

---

## Speaker notes

"Four kinds of people: the Makers who build jiuwenswarm, the Runners who keep instances working, the Consumers who use it directly — B2C — and the Builders who build on top of it. Builders have three distinct market relationships: Skill Author is Ecosystem — like a plugin developer, they contribute capability to the platform and value flows through the marketplace. Agent Integrator is M2M — machine to machine, they wire jiuwenswarm into a multi-agent pipeline via the A2A protocol with no human in the loop. Product Builder is B2B2C — they ship their own consumer product using jiuwenswarm as an invisible backend."

---

## Consistency reminders

- Order columns Makers → Runners → Consumers → Builders.
- Consumers are broken into surfaces only so the list is precise: Web (chatter, coder), Text (CLI, TUI, IM), Channel (browser, IDE).
- Show only leaf personas — never the base ones.
