[← Index](../README.md) · jiuwenswarm Usability Review

---

# The Root Cause

jiuwenswarm is engineered from the inside out. Each feature was built correctly
within its own scope, but usability was not designed as a cross-cutting concern.
The result: a system that works well for users who already understand it and is
hostile to users who do not.

The pattern that recurs across the findings is the same:
**the system does not tell users what is happening.** The data exists — the
trajectory system, the health status, the task plan, the config validation result —
but it is not surfaced. What follows is where that pattern appears most clearly.

---

## The system does not tell you when setup failed

- **[2.1](02-operator-config.md#21-no-startup-validation--failures-surface-on-first-use)** — Model credentials and channel tokens are never validated at startup. The first failure appears on the first chat message.
- **[5.1](05-first-run.md#51-the-setup-wizard-ends-too-early)** — The setup wizard ends at the models panel. If credentials are wrong, the user discovers this later.
- **[5.4](05-first-run.md#54-cli-first-run-has-no-guidance)** — Running `jiuwenswarm` with no config produces an unclear error with no path forward.
- **[2.7](02-operator-config.md#27-optional-dependencies-fail-at-runtime-not-install-time)** — Optional dependencies (SSH, TUI) fail when used, not at startup when they could be caught.

## The system does not tell you when something degraded

- **[4.1](04-reliability.md#41-graceful-degradation-is-silent)** — When memory, OTel, or a channel fails silently, the system continues as if everything is fine.
- **[4.2](04-reliability.md#42-session-recovery-after-disconnect-is-undefined)** — After a disconnect, the user has no way to know whether the agent continued, stopped, or is in an undefined state.
- **[4.3](04-reliability.md#43-rate-limiting-and-api-failures-are-opaque)** — Rate limit hits and model 429/503 errors produce generic messages or silent hangs.
- **[4.4](04-reliability.md#44-no-persistent-state-for-in-progress-tasks)** — A process crash loses all task state. There is no checkpoint, no "resume from step 3".

## The system does not tell you what the agent is about to do

- **[3.1](03-trust-safety.md#31-no-visibility-into-agent-permissions-before-the-first-action)** — No summary of what the agent can do before it starts acting: which tools, which files, which external services.
- **[3.2](03-trust-safety.md#32-no-diffpreview-before-the-agent-modifies-files)** — Files can be created, edited, or deleted without any preview or approval step.
- **[3.3](03-trust-safety.md#33-no-task-cancellation-with-defined-semantics)** — No stop button with defined behavior. The user cannot safely interrupt the agent.
- **[3.4](03-trust-safety.md#34-destructive-external-actions-have-no-confirmation-layer)** — Feishu messages and external API calls fire without the user being able to review or cancel them.

## The system does not tell you what it is doing right now

- **[7.1](07-performance.md#71-no-first-token-latency-indicator)** — Between submitting a message and the first token, the user sees nothing. No spinner, no indicator.
- **[6.1](06-transparency.md#61-thinking-display-is-hidden-behind-the-trajectory-panel)** — The agent's reasoning is accessible only in a separate panel that must be explicitly opened.
- **[7.3](07-performance.md#73-skill-execution-has-no-progress-feedback)** — A skill running for minutes shows only a generic tool call card. No step count, no progress.
- **[6.3](06-transparency.md#63-subagent-activity-is-not-visible-to-the-user)** — When subagents are spawned, the parent panel shows no indication they are running.
- **[8.2](08-async-notifications.md#82-no-background-task-management)** — Sessions running tasks in the background show no indication in the sidebar.

## The system does not tell you what went wrong

- **[1.1](01-core-usability.md#11-error-messages-give-users-nothing-to-act-on)** — Errors surface as "unknown error" with no tool name, no session ID, no next step.
- **[13.3](13-help-support.md#133-error-messages-do-not-reference-log-files)** — Error messages do not tell the user where to find more detail.
- **[13.1](13-help-support.md#131-no-in-context-help)** — No contextual help at the point of failure: no tooltips, no "?" icons, no popovers.
- **[13.2](13-help-support.md#132-no-diagnostic-mode-for-users)** — No `jiuwenswarm diagnostics` command. Users must know where logs are and what log level to set.

## The system does not tell you what it stored or what it costs

- **[12.1](12-data-privacy.md#121-no-visibility-into-what-is-stored-in-memory)** — Users have no UI to see what the agent has remembered about them.
- **[12.2](12-data-privacy.md#122-no-indication-of-what-the-agent-sends-to-the-llm)** — The full prompt sent to the model — including memory, skills, conversation history — is invisible.
- **[9.1](09-economic-ux.md#91-no-token-or-cost-visibility)** — No per-session token counter, no cost estimate, no warning before hitting the context limit.

---

## Other findings

The pattern above accounts for roughly half the findings. The remaining findings
address a different kind of gap: features that were never built, not features that
exist but are silent. These include accessibility (§14), mobile layout (§15),
conversation search (1.5), keyboard shortcuts (1.6), skill version management (10.3),
multi-tenancy (18.6), developer documentation (§17), and the full application
developer API surface (§18). They are usability failures, but of a different kind —
the question there is not "why doesn't the system communicate this?" but "why
doesn't this exist at all?"

---

## Five implementation-ready changes

These five changes require no architectural redesign. Each is a surface-level
addition on top of what already exists. They are listed here not because other
findings are less important, but because each has a specific, bounded scope that
makes it immediately actionable. The full finding behind each is linked.

**1. Startup health check with a printed report** · [2.1](02-operator-config.md#21-no-startup-validation--failures-surface-on-first-use), [2.7](02-operator-config.md#27-optional-dependencies-fail-at-runtime-not-install-time)

Validate model credentials, channel credentials, and optional dependencies before
serving the first request. Print a green/yellow/red summary to stdout on startup.
The check logic is already implicit in the startup sequence — making it explicit
and visible eliminates the most common onboarding failure mode.

**2. Setup wizard that does not exit until a message succeeds** · [5.1](05-first-run.md#51-the-setup-wizard-ends-too-early)

Extend `ModelSetupGuide.tsx` to include inline credential testing (a "Test
connection" button that makes a real API call) and a "send first message" step
as the final wizard screen. The wizard currently ends before validation. Ending
it after a confirmed successful message turns a high first-run failure rate into
near zero at the cost of one extra wizard step.

**3. Actionable error messages with a machine-readable code** · [1.1](01-core-usability.md#11-error-messages-give-users-nothing-to-act-on), [13.3](13-help-support.md#133-error-messages-do-not-reference-log-files)

Every error surfaced to the user must answer three questions: what happened, why,
and what to do next. Add `ERR_*` codes (e.g. `ERR_GATEWAY_DISCONNECT`) for
searchability and support correlation. The error handling paths already exist —
this is a content and formatting change to what they produce.

**4. Stop button with defined semantics and a completion card** · [3.3](03-trust-safety.md#33-no-task-cancellation-with-defined-semantics)

A Stop button that sends an interrupt signal, waits for the current tool call to
finish, then displays a card listing what completed and what did not. The trajectory
system already captures this data per step. Wiring it to an interrupt signal and a
summary card requires no new data collection — only a UI that surfaces what is
already tracked.

**5. Health indicator in the Web UI sidebar** · [4.1](04-reliability.md#41-graceful-degradation-is-silent)

A green/yellow/red dot in the sidebar reflecting the live status of memory,
channels, and OTel. On click, a panel shows which subsystems are degraded and why.
The subsystem health state already exists at runtime — it is logged at DEBUG level
but never surfaced to the user. This is a display change, not a new data source.
