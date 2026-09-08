# Slide 1 — Persona types: who builds, runs, and uses jiuwenswarm

> **Spec for the slide builder.** This one file contains *everything* needed to produce this slide. You should not have to read any other document. It gives the message, the layout, the exact text for every element, and speaker notes.

---

## Purpose of the slide

Introduce the four kinds of people around **jiuwenswarm** in one glance, using the same mental model the whole deck follows.

**Core message (one line to land):**
> "jiuwenswarm is open source — anyone can make it, run it, use it, or build on it. Four tiers of people: Makers, Runners, Users, Builders."

---

## The one idea that holds it together

Frame the four tiers as a funnel from **who makes the product** to **who it reaches**, and — importantly — read them through a *business lens* so the audience sees where "customers" actually are:

- **0 · Makers** = the people who *build jiuwenswarm* (open source + contributors). This is the **producer / the product itself**. Not a customer.
- **1 · Runners** = the people who *install and run* an instance (Self-hoster, Bot-hoster). This is the **deployment/hosting layer** — the place where the software actually runs. Not a customer.
- **2 · Users / Consumers** = people who *use it directly for themselves* → framed as **B2C** (provider → end user).
- **3 · Builders** = people who *use it to build something for others* → framed as **B2B** (an industrial/enterprise integration) or **B2B2C** (they build an app others use).

Only **2** and **3** are the two ways an end *customer* is reached. 0 and 1 are upstream: "who builds it" and "who runs it."

> Note: jiuwenswarm is open source and free, so these business labels describe the *shape* of the relationship, not actual revenue.

---

## Recommended slide layout

A horizontal funnel of four large cards/boxes, left → right, **0 → 3**. A thin connecting arrow runs from card 1 to card 4 (or between each card) to show it flows from Makers down to Users/Builders.

Layout sketch:

```
  0 · MAKERS  ──►  1 · RUNNERS  ──►  ┌──►  2 · USERS        (B2C)
                                     └──►  3 · BUILDERS      (B2B / B2B2C)
```

- One row of four boxes, numbered 0–3.
- After box 1, show a **fork** into two boxes (2 and 3) to signal that Users and Builders are *two sibling ways of using* jiuwenswarm — not a strict sequence (important, see "2 vs 3" below).

---

## Exact text for each box

Put this text verbatim (title in bold on top, one short line under it).

**Box 0 — MAKERS**
- Title: **0 · Makers**
- Short line: *Build jiuwenswarm (open source + contributors)*
- Business frame label: **the product / producer**

**Box 1 — RUNNERS**
- Title: **1 · Runners**
- Short line: *Install and run an instance (Self-hoster, Bot-hoster)*
- Business frame label: **the deployment / hosting layer**

**Box 2 — USERS**
- Title: **2 · Users (Consumers)**
- Short line: *Use it directly, for themselves*
- Business frame label: **B2C** (provider → end user)

**Box 3 — BUILDERS**
- Title: **3 · Builders**
- Short line: *Use it to build something for other people*
- Business frame label: **B2B / B2B2C**

---

## What each tier means (for speaker notes / any deep-dive)

**0 · Makers — "build it."**
A contributor works in the jiuwenswarm / openjiuwen code itself: extends the engine (rails, tools, the agent factory, channels). They are why the product exists. In a commercial chain they sit at the very top as the producer of the open-source software.

**1 · Runners — "run it."**
People who install and keep a jiuwenswarm instance working. Two personas live here:
- **Self-hoster** — runs one instance for themselves (the common case; a technical person who self-hosts to use it). Note: this same person is also a User (2) — "running" and "using" are two hats of the same person.
- **Bot-hoster** — runs one instance as a shared bot that a group talks to (e.g. Feishu/Telegram/WeChat) and maintains it for them.

The Runners are the layer where an instance actually exists; without them there is nothing to use.

**2 · Users / Consumers — "use it."**
The person who talks to the agent and uses its output for themselves, on whatever surface they like. There is a shared base (universal concerns) plus surface groups: the rich **Web** UI (chat and code), **text** surfaces (CLI, TUI, IM), and **channel** surfaces (IDE, browser). All of these are the *same* User — the surface is just where they reach the agent. This tier is the "C" side: provider → end user, i.e. **B2C**.

**3 · Builders — "build on it."**
People who are also *users of* jiuwenswarm, but they use it to build something for **others**; that built thing sits *between* other end users and jiuwenswarm. Two personas:
- **Product Builder** — installs a ready jiuwenswarm and builds their own product using it as the backend (over the E2A/WebSocket or ACP API).
- **Skill Author** — writes, packages, and distributes skills (capability content) that users enable on an instance.

Business frame: an enterprise/integration use → **B2B**; building an app that end users use → **B2B2C**.

---

## "2 vs 3" — the important nuance (must be visible)

Users (2) and Builders (3) are **siblings**, not a sequence. They both sit on top of the Runners (1) and both are users of jiuwenswarm; they differ only in *whom they serve*:

- User 2 = uses it **for themselves**.
- Builder 3 = uses it **for others** (their product is in the middle between those others and jiuwenswarm).

That is why the layout shows a **fork** after 1 into 2 and 3, rather than a straight chain. (It is also why 2 is shown before 3: first you meet the plain user, then the builder who builds for users.)

---

## Ordering rationale (only if asked)

The deck numbers them 0 → 3: **make it → run it → use it → build on it.** Builders come *after* Users so the audience first understands who the plain user is, then the builder as an extension of it.

---

## Speaker notes (short)

"jiuwenswarm is open source. So there are four kinds of people around it. First, the people who make it. Second, the people who run an instance — without them nothing is up. Then two ways of using it: people who use it directly for themselves — think B2C — and people who build on top of it for others — think B2B or B2B2C. Users and Builders are siblings; both use jiuwenswarm, one for themselves, one to build for others."

---

## Terminology to keep consistent

- Always write **0 · Makers, 1 · Runners, 2 · Users, 3 · Builders** (or Consumers in place of Users if preferred — pick one and keep it).
- Call the tiers by number first, then name: "2 · Users (Consumers)".
- Do **not** present Users and Builders as a strict dependency chain; say "siblings / two ways of using it."
- Keep the business labels as a *frame* (B2C / B2B / B2B2C), not as the tier name.
