# Self-hoster

*The person who installs, runs, and keeps one jiuwenswarm instance — usually their own, so they are also a user of it.*

They own their instance, so in addition to the run concerns below they are a [Consumer](../../2-consume/consumer/consumer.md) of it (same person running *and* using it).

This persona is **built on top of**: [Consumer](../../2-consume/consumer/consumer.md). It inherits that base's findings; this file lists only its own.

## Findings that matter to them

*24 findings.*

### Data Retention

- **[Data is kept indefinitely with no expiry controls](findings/data-retention/1-data-is-kept-indefinitely-with-no-expiry-controls.md)**
### Cost & Token Economics

- **[No hints about what is consuming the context](findings/setup-and-operation/economics/2-no-hints-about-what-is-consuming-the-context.md)**
- **[No visibility into token usage or session cost](findings/setup-and-operation/economics/1-no-visibility-into-token-usage-or-session-cost.md)**
- **[Trivial prompts still build the full context](findings/setup-and-operation/economics/3-trivial-prompts-still-build-the-full-context.md)**
### Running & Managing the Instance

- **[Documentation is scattered with no guide for common tasks](findings/setup-and-operation/run-and-manage/5-documentation-is-scattered-with-no-guide-for-common-tasks.md)**
- **[Logs and config mix languages unpredictably](findings/setup-and-operation/run-and-manage/3-logs-and-config-mix-languages-unpredictably.md)**
- **[No visibility into which ports and URLs are in use](findings/setup-and-operation/run-and-manage/1-no-visibility-into-which-ports-and-urls-are-in-use.md)**
- **[Permission rules can only be edited in raw YAML](findings/setup-and-operation/run-and-manage/6-permission-rules-can-only-be-edited-in-raw-yaml.md)**
- **[Upgrading can silently break an existing config](findings/setup-and-operation/run-and-manage/4-upgrading-can-silently-break-an-existing-config.md)**
- **[Default permissions are off, contradicting the README](findings/setup-and-operation/run-and-manage/default-permissions-disabled.md)**
- **[Granted permissions are invisible once granted](findings/setup-and-operation/run-and-manage/granted-permissions-invisible.md)**
### Startup & Configuration

- **[Missing optional extras fail when used, not at startup](findings/setup-and-operation/startup-and-config/3-missing-optional-extras-fail-when-used-not-at-startup.md)**
- **[Setup ends before credentials are tested](findings/setup-and-operation/startup-and-config/4-setup-ends-before-credentials-are-tested.md)**
- **[The config file has no validation or check tool](findings/setup-and-operation/startup-and-config/2-the-config-file-has-no-validation-or-check-tool.md)**
- **[Wrong credentials surface only on the first chat, never at startup](findings/setup-and-operation/startup-and-config/1-wrong-credentials-surface-only-on-the-first-chat-never-at-startup.md)**
- **[Headless installs silently become Chinese installs](findings/setup-and-operation/startup-and-config/headless-install-language-defaults-zh.md)**
- **[Nothing verifies the model before the first conversation](findings/setup-and-operation/startup-and-config/model-not-verified-before-first-chat.md)**
- **[No minimal starting point for config (818 keys)](findings/setup-and-operation/startup-and-config/no-minimal-config-starting-point.md)**
### First Run

- **[Running the CLI without config gives no next step](findings/first-run/2-running-the-cli-without-config-gives-no-next-step.md)**
- **[Setup wizard ends before the model is confirmed working](findings/first-run/1-setup-wizard-ends-before-the-model-is-confirmed-working.md)**
### Health & Degradation

- **[You aren't told when a subsystem fails](findings/setup-and-operation/health-and-degradation/1-you-arent-told-when-a-subsystem-fails.md)**

### Backup & Recovery

*No findings yet.*


### Cost & Tokens

- **[No per-model budget dashboard](findings/setup-and-operation/economics/token-and-cost-dashboard.md)**


### Diagnostics

- **[No diagnostic ('doctor') command](findings/diagnostics/no-doctor-diagnostic-command.md)**


### Documentation

- **[English docs show the Chinese UI](findings/documentation/english-docs-show-chinese-ui.md)**