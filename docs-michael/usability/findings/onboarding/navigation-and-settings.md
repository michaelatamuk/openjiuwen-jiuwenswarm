[← Index](../../README.md) · jiuwenswarm Usability Review

---

# Navigation & Settings

*Finding and organizing the UI.*

---

## 1 Skills and connectors are split apart though they're the same kind of thing

**Current state.**
`SessionSidebar` has separate nav items for "Skills" and "Connector Market" (plugins,
MCP). These are conceptually similar — both extend agent capabilities — but are
presented as separate top-level sections.

**What good looks like.**
A unified "Capabilities" section: Skills, MCP servers, plugins, and browser tools
all in one place, filterable by type. A user adding a new capability should not need
to know which category it falls into first.

---

## 2 Settings are organized by code module, not by user task

**Current state.**
Settings modules: General, Models, Channels, Agent, Browser, Experimental. This is
organized by implementation component, not by what the user is trying to do.

**What good looks like.**
Organize by user goal:
- **Getting started** — model setup, language, first skill.
- **Communication channels** — Feishu, Telegram, Discord, etc.
- **Memory & context** — memory settings, coding memory, context length.
- **Agent behavior** — permissions, tools, mode defaults, response style.
- **Advanced** — observability, debug traces, experimental features.

The goal-based structure serves everyone configuring a deployment, not only browsing
end-users — e.g. changing the agent's response language should not require guessing
between "General", "Models", and "Agent".

---

## 3 The activity view is hidden behind an unclear name

**Current state.**
The trajectory system (full LLM input/output/thinking trace per call) is inside the
right panel but requires knowing to look for it. The navigation item is labeled
"TraceHound" — a name that means nothing to a new user.

**What good looks like.**
Rename to "Agent activity" or "What happened". Surface it as a default sub-tab
in the right panel alongside artifacts, rather than a separate nav item.

See also [Agent reasoning is hidden in a separate panel](../conversation/explanation.md#1-agent-reasoning-is-hidden-in-a-separate-panel) for the related live-why view.

---
