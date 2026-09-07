[← Index](../README.md) · jiuwenswarm Usability Review

---

# P2 — Operator

*The person installing, configuring, deploying, and maintaining the system.*

---

## Findings

> *The findings in this file are symptoms of a single systemic issue. [Read the root cause →](../findings/00-overview.md)*

*22 findings across 8 concern areas.*

### §2 · Operator Configuration & Setup

- **[2.1 No Startup Validation — Failures Surface on First Use](../findings/02-operator-config.md#21-no-startup-validation--failures-surface-on-first-use)** — Model credentials and channel tokens are never checked at startup; failures only appear when a user tries to chat.
- **[2.2 Config File Is 1709 Lines With No Validation Tool](../findings/02-operator-config.md#22-config-file-is-1709-lines-with-no-validation-tool)** — There is no way to check whether an edited config is correct before running.
- **[2.3 Powerful Features Are Invisible by Default](../findings/02-operator-config.md#23-powerful-features-are-invisible-by-default)** — Trajectory UI, OTel tracing, debug trace, coding memory, and SSH channel exist but are undiscoverable.
- **[2.4 Onboarding Ends Before the Hard Part](../findings/02-operator-config.md#24-onboarding-ends-before-the-hard-part)** — The setup wizard stops at the model panel; the operator must fill in credentials and validate them without guidance.
- **[2.5 Instance and Port Management Is Confusing](../findings/02-operator-config.md#25-instance-and-port-management-is-confusing)** — After start, there is no output listing what ports were assigned or what URL to open; port conflicts are silent.
- **[2.6 Permission System Has No GUI and No Testing Tool](../findings/02-operator-config.md#26-permission-system-has-no-gui-and-no-testing-tool)** — The regex-based permission rules can only be edited in YAML; there is no way to test what a rule matches.
- **[2.7 Optional Dependencies Fail at Runtime, Not Install Time](../findings/02-operator-config.md#27-optional-dependencies-fail-at-runtime-not-install-time)** — SSH and TUI extras are not checked at startup; errors appear only when the feature is first used.
- **[2.8 Documentation Is Scattered and Hard to Navigate](../findings/02-operator-config.md#28-documentation-is-scattered-and-hard-to-navigate)** — No centralized guide for the three most common operator tasks: add a channel, debug a failing task, create a skill.
- **[2.9 Upgrade Experience Is Undefined](../findings/02-operator-config.md#29-upgrade-experience-is-undefined)** — pip upgrade may silently break an existing config; there is no migration system or breaking-change changelog.
- **[2.10 Internationalization Is Inconsistent](../findings/02-operator-config.md#210-internationalization-is-inconsistent)** — Log messages and config comments mix Chinese and English unpredictably, making logs unreadable for non-Chinese operators.

### §4 · Reliability & Resilience

- **[4.1 Graceful Degradation Is Silent](../findings/04-reliability.md#41-graceful-degradation-is-silent)** — Subsystem failures are not logged at WARNING level, so monitoring systems cannot detect them.
- **[4.2 Session Recovery After Disconnect Is Undefined](../findings/04-reliability.md#42-session-recovery-after-disconnect-is-undefined)** — Server-side behavior during a disconnect (does the agent process continue?) is not documented.
- **[4.3 Rate Limiting and API Failures Are Opaque](../findings/04-reliability.md#43-rate-limiting-and-api-failures-are-opaque)** — Model provider failures are not surfaced in logs at WARNING level for monitoring systems.
- **[4.4 No Persistent State for In-Progress Tasks](../findings/04-reliability.md#44-no-persistent-state-for-in-progress-tasks)** — In containerized deployments, the checkpoint store should survive process restarts, but is not configurable.

### §5 · Onboarding & First-Run Experience

- **[5.1 The Setup Wizard Ends Too Early](../findings/05-first-run.md#51-the-setup-wizard-ends-too-early)** — The wizard should not complete until the model is working; operators need an inline credential test and a re-enterable guide.
- **[5.4 CLI First-Run Has No Guidance](../findings/05-first-run.md#54-cli-first-run-has-no-guidance)** — Running jiuwenswarm with no config produces an unclear error and no actionable next step.

### §9 · Economic UX

- **[9.1 No Token or Cost Visibility](../findings/09-economic-ux.md#91-no-token-or-cost-visibility)** — No per-session token counter, no cost estimate; operators cannot track API spend.
- **[9.2 No Optimization Hints](../findings/09-economic-ux.md#92-no-optimization-hints)** — When context grows large, there is no breakdown showing which component is consuming the most tokens.

### §10 · Skill Ecosystem

- **[10.1 Skill Marketplace Has No Quality Signals](../findings/10-skill-ecosystem.md#101-skill-marketplace-has-no-quality-signals)** — No ratings, usage counts, or last-updated dates; operators cannot assess skill quality before installing.
- **[10.2 No Skill Dependency Management](../findings/10-skill-ecosystem.md#102-no-skill-dependency-management)** — No UI shows which skills have Python dependencies, whether they are installed, or whether two skills conflict.
- **[10.3 No Skill Version Management or Rollback](../findings/10-skill-ecosystem.md#103-no-skill-version-management-or-rollback)** — A skill update cannot be undone; there is no version history or rollback mechanism.
- **[10.4 Skill Testing Has No Infrastructure](../findings/10-skill-ecosystem.md#104-skill-testing-has-no-infrastructure)** — Skills can only be tested through a live chat session; there is no sandbox or test panel.

### §12 · Data & Privacy

- **[12.3 No Data Retention Policy UI](../findings/12-data-privacy.md#123-no-data-retention-policy-ui)** — Operators cannot set instance-wide retention limits that users cannot override; data is kept indefinitely.

### §13 · Help & Support

- **[13.2 No Diagnostic Mode for Users](../findings/13-help-support.md#132-no-diagnostic-mode-for-users)** — When something goes wrong, there is no single command to collect and package diagnostic information for a report.
- **[13.3 Error Messages Do Not Reference Log Files](../findings/13-help-support.md#133-error-messages-do-not-reference-log-files)** — Errors written to stderr do not include the log file path, making it hard to find the relevant log entry.

### §16 · Information Architecture

- **[16.2 Settings Are Organized by Implementation, Not by User Task](../findings/16-info-architecture.md#162-settings-are-organized-by-implementation-not-by-user-task)** — An operator trying to change the agent's response language must guess whether to look in General, Models, or Agent.
