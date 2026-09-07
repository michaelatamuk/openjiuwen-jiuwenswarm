[← Index](../../README.md) · jiuwenswarm Usability Review

---

# Instance Admin

*The person who installs, configures, runs, and keeps a JiuwenSwarm instance working —
models, channels, tool-permission whitelists, memory, upgrades. The "administrator / 运维"
the product's docs hand infra-level settings to.*

---

## Findings

*26 findings.*

### Stop, Resume & Undo

- **[Unclear what the agent does when a session disconnects](../../findings/control/stop-resume-undo.md#3-unclear-what-the-agent-does-when-a-session-disconnects)** — Server-side behavior during a disconnect (does the agent process continue?) is not documented.
- **[A crash loses in-progress tasks with no way to resume](../../findings/control/stop-resume-undo.md#4-a-crash-loses-in-progress-tasks-with-no-way-to-resume)** — In containerized deployments, the checkpoint store should survive process restarts, but is not configurable.

### Data Retention

- **[Data is kept indefinitely with no expiry controls](../../findings/memory-and-privacy/retention.md#1-data-is-kept-indefinitely-with-no-expiry-controls)** — Operators cannot set instance-wide retention limits that users cannot override; data is kept indefinitely.

### Diagnostics & Support

- **[No single command to gather diagnostics for a bug report](../../findings/setup-and-operation/diagnostics-and-help.md#1-no-single-command-to-gather-diagnostics-for-a-bug-report)** — When something goes wrong, there is no single command to collect and package diagnostic information for a report.
- **[Errors don't point to the log entry with more detail](../../findings/setup-and-operation/diagnostics-and-help.md#2-errors-dont-point-to-the-log-entry-with-more-detail)** — Errors written to stderr do not include the log file path, making it hard to find the relevant log entry.

### Cost & Token Economics

- **[No visibility into token usage or session cost](../../findings/setup-and-operation/economics.md#1-no-visibility-into-token-usage-or-session-cost)** — No per-session token counter, no cost estimate; operators cannot track API spend.
- **[No hints about what is consuming the context](../../findings/setup-and-operation/economics.md#2-no-hints-about-what-is-consuming-the-context)** — When context grows large, there is no breakdown showing which component is consuming the most tokens.

### Health & Degradation

- **[Degraded subsystems fail silently and users assume all is fine](../../findings/setup-and-operation/health-and-degradation.md#1-degraded-subsystems-fail-silently-and-users-assume-all-is-fine)** — Subsystem failures are not logged at WARNING level, so monitoring systems cannot detect them.
- **[Rate limits and API failures hang or show nothing useful](../../findings/setup-and-operation/health-and-degradation.md#2-rate-limits-and-api-failures-hang-or-show-nothing-useful)** — Model provider failures are not surfaced in logs at WARNING level for monitoring systems.

### Running & Managing the Instance

- **[Powerful features exist but are never surfaced](../../findings/setup-and-operation/run-and-manage.md#2-powerful-features-exist-but-are-never-surfaced)** — Trajectory UI, OTel tracing, debug trace, coding memory, and SSH channel exist but are undiscoverable.
- **[No visibility into which ports and URLs are in use](../../findings/setup-and-operation/run-and-manage.md#1-no-visibility-into-which-ports-and-urls-are-in-use)** — After start, there is no output listing what ports were assigned or what URL to open; port conflicts are silent.
- **[Permission rules can only be edited in raw YAML](../../findings/setup-and-operation/run-and-manage.md#6-permission-rules-can-only-be-edited-in-raw-yaml)** — The regex-based permission rules can only be edited in YAML; there is no way to test what a rule matches.
- **[Documentation is scattered with no guide for common tasks](../../findings/setup-and-operation/run-and-manage.md#5-documentation-is-scattered-with-no-guide-for-common-tasks)** — No centralized guide for the three most common operator tasks: add a channel, debug a failing task, create a skill.
- **[Upgrading can silently break an existing config](../../findings/setup-and-operation/run-and-manage.md#4-upgrading-can-silently-break-an-existing-config)** — pip upgrade may silently break an existing config; there is no migration system or breaking-change changelog.
- **[Logs and config mix languages unpredictably](../../findings/setup-and-operation/run-and-manage.md#3-logs-and-config-mix-languages-unpredictably)** — Log messages and config comments mix Chinese and English unpredictably, making logs unreadable for non-Chinese operators.

### Startup & Configuration

- **[Wrong credentials surface only on the first chat, never at startup](../../findings/setup-and-operation/startup-and-config.md#1-wrong-credentials-surface-only-on-the-first-chat-never-at-startup)** — Model credentials and channel tokens are never checked at startup; failures only appear when a user tries to chat.
- **[The config file has no validation or check tool](../../findings/setup-and-operation/startup-and-config.md#2-the-config-file-has-no-validation-or-check-tool)** — There is no way to check whether an edited config is correct before running.
- **[Setup ends before credentials are tested](../../findings/setup-and-operation/startup-and-config.md#4-setup-ends-before-credentials-are-tested)** — The setup wizard stops at the model panel; the operator must fill in credentials and validate them without guidance.
- **[Missing optional extras fail when used, not at startup](../../findings/setup-and-operation/startup-and-config.md#3-missing-optional-extras-fail-when-used-not-at-startup)** — SSH and TUI extras are not checked at startup; errors appear only when the feature is first used.

### First Run

- **[Setup wizard ends before the model is confirmed working](../../findings/onboarding/first-run.md#1-setup-wizard-ends-before-the-model-is-confirmed-working)** — The wizard should not complete until the model is working; operators need an inline credential test and a re-enterable guide.
- **[Running the CLI without config gives no next step](../../findings/onboarding/first-run.md#2-running-the-cli-without-config-gives-no-next-step)** — Running jiuwenswarm with no config produces an unclear error and no actionable next step.

### Navigation & Settings

- **[Settings are organized by code module, not by user task](../../findings/onboarding/navigation-and-settings.md#2-settings-are-organized-by-code-module-not-by-user-task)** — An operator trying to change the agent's response language must guess whether to look in General, Models, or Agent.

### Skill Authoring & Dependencies

- **[Skill Python dependencies and conflicts are invisible](../../findings/skills/authoring-and-testing.md#2-skill-python-dependencies-and-conflicts-are-invisible)** — No UI shows which skills have Python dependencies, whether they are installed, or whether two skills conflict.
- **[Skills can only be tested through a live chat](../../findings/skills/authoring-and-testing.md#3-skills-can-only-be-tested-through-a-live-chat)** — Skills can only be tested through a live chat session; there is no sandbox or test panel.

### Skill Marketplace

- **[Marketplace shows no ratings, usage or freshness](../../findings/skills/marketplace.md#1-marketplace-shows-no-ratings-usage-or-freshness)** — No ratings, usage counts, or last-updated dates; operators cannot assess skill quality before installing.

### Skill Versioning

- **[Skill updates can't be reviewed or rolled back](../../findings/skills/versioning.md#1-skill-updates-cant-be-reviewed-or-rolled-back)** — A skill update cannot be undone; there is no version history or rollback mechanism.
