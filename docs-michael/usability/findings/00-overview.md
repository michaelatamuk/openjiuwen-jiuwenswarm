[← Index](../README.md) · jiuwenswarm Usability Review

---

# Overview & Root Cause

How to read this section: each finding lives in exactly one file under `findings/`,
grouped by concern area (§1–§23). This page does not repeat them — it explains why they
exist, groups them by theme so you know which section to open, and lists the quickest
wins. Finding IDs (e.g. **2.1**, **17.4**) are stable across document versions.

---

## The root cause

jiuwenswarm is engineered from the inside out. Each feature was built correctly within
its own scope, but usability was not designed as a cross-cutting concern. The result is
a system that works well for users who already understand it and is hostile to those who
do not.

The pattern that recurs across most findings is the same: **the system does not tell
users what is happening.** The data exists — the trajectory system, the health status,
the task plan, the config validation result — but it is not surfaced. The sections below
are grouped around that recurring failure.

---

## Two kinds of gaps

The findings are not all the same kind of problem, and it is worth separating them:

- **Silent features** — the capability or data exists, but the system does not surface
  it. These are grouped by theme in the table below. The fix is usually a display or
  communication change over infrastructure that already exists.
- **Missing features** — never built at all. Accessibility (§14), mobile layout (§15),
  conversation search (1.5), keyboard shortcuts (1.6), skill version management (10.3),
  multi-tenancy (22.3), and much of the extension, tooling, and integration surface
  (§17–§23). These are usability failures of a different kind: the question is not "why
  doesn't the system communicate this?" but "why doesn't this exist?"

---

## Themes → where to read

For the silent-features findings, "the system does not tell you X" maps to these
sections:

| When the system fails to tell you… | Open |
|---|---|
| **…that setup failed** | §2 · Operator Config & Setup · §5 · First-Run Experience |
| **…that something degraded** | §4 · Reliability & Resilience |
| **…what the agent is about to do** | §3 · Trust & Safety |
| **…what it is doing right now** | §6 · Agent Transparency · §7 · Performance · §8 · Async Notifications |
| **…what went wrong** | §1 · Core Usability · §13 · Help & Support |
| **…what it stored or what it cost** | §12 · Data & Privacy · §9 · Economic UX |

The complete index of sections and their finding ranges is in the [findings index](../README.md#findings--single-source-of-truth-for-each-finding).

---

## Five implementation-ready changes

These five changes require no architectural redesign. Each is a surface-level addition on
top of what already exists. They are listed here not because the other findings are less
important, but because each has a specific, bounded scope that makes it immediately
actionable. The full finding behind each is linked.

**1. Startup health check with a printed report** · [2.1](02-operator-config.md#21-no-startup-validation--failures-surface-on-first-use), [2.7](02-operator-config.md#27-optional-dependencies-fail-at-runtime-not-install-time)

Validate model credentials, channel credentials, and optional dependencies before
serving the first request, and print a green/yellow/red summary to stdout on startup.
The check logic is already implicit in the startup sequence — making it explicit and
visible eliminates the most common onboarding failure mode.

**2. Setup wizard that does not exit until a message succeeds** · [5.1](05-first-run.md#51-the-setup-wizard-ends-too-early)

Extend `ModelSetupGuide.tsx` to include inline credential testing (a "Test connection"
button that makes a real API call) and a "send first message" step as the final wizard
screen. The wizard currently ends before validation. Ending it after a confirmed
successful message turns a high first-run failure rate into near zero at the cost of one
extra step.

**3. Actionable error messages with a machine-readable code** · [1.1](01-core-usability.md#11-error-messages-give-users-nothing-to-act-on), [13.3](13-help-support.md#133-error-messages-do-not-reference-log-files)

Every error surfaced to the user must answer three questions: what happened, why, and
what to do next. Add `ERR_*` codes (e.g. `ERR_GATEWAY_DISCONNECT`) for searchability and
support correlation. The error handling paths already exist — this is a content and
formatting change to what they produce.

**4. Stop button with defined semantics and a completion card** · [3.3](03-trust-safety.md#33-no-task-cancellation-with-defined-semantics)

A Stop button that sends an interrupt signal, waits for the current tool call to finish,
then displays a card listing what completed and what did not. The trajectory system
already captures this data per step. Wiring it to an interrupt signal and a summary card
requires no new data collection — only a UI that surfaces what is already tracked.

**5. Health indicator in the Web UI sidebar** · [4.1](04-reliability.md#41-graceful-degradation-is-silent)

A green/yellow/red dot in the sidebar reflecting the live status of memory, channels,
and OTel. On click, a panel shows which subsystems are degraded and why. The subsystem
health state already exists at runtime — it is logged at DEBUG level but never surfaced
to the user. This is a display change, not a new data source.

---
