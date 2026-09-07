[← Index](../../README.md) · jiuwenswarm Usability Review

---

# Instance Admin

*The administrator (运维) who installs, configures, runs, and keeps one JiuwenSwarm working.*

## Findings that matter to them

*17 findings.*

### Data Retention

- **[Data is kept indefinitely with no expiry controls](../../findings/memory-and-privacy/retention.md#1-data-is-kept-indefinitely-with-no-expiry-controls)**

### Cost & Token Economics

- **[No visibility into token usage or session cost](../../findings/setup-and-operation/economics.md#1-no-visibility-into-token-usage-or-session-cost)**
- **[No hints about what is consuming the context](../../findings/setup-and-operation/economics.md#2-no-hints-about-what-is-consuming-the-context)**

### Running & Managing the Instance

- **[No visibility into which ports and URLs are in use](../../findings/setup-and-operation/run-and-manage.md#1-no-visibility-into-which-ports-and-urls-are-in-use)**
- **[Powerful features exist but are never surfaced](../../findings/setup-and-operation/run-and-manage.md#2-powerful-features-exist-but-are-never-surfaced)**
- **[Logs and config mix languages unpredictably](../../findings/setup-and-operation/run-and-manage.md#3-logs-and-config-mix-languages-unpredictably)**
- **[Upgrading can silently break an existing config](../../findings/setup-and-operation/run-and-manage.md#4-upgrading-can-silently-break-an-existing-config)**
- **[Documentation is scattered with no guide for common tasks](../../findings/setup-and-operation/run-and-manage.md#5-documentation-is-scattered-with-no-guide-for-common-tasks)**
- **[Permission rules can only be edited in raw YAML](../../findings/setup-and-operation/run-and-manage.md#6-permission-rules-can-only-be-edited-in-raw-yaml)**

### Startup & Configuration

- **[Wrong credentials surface only on the first chat, never at startup](../../findings/setup-and-operation/startup-and-config.md#1-wrong-credentials-surface-only-on-the-first-chat-never-at-startup)**
- **[The config file has no validation or check tool](../../findings/setup-and-operation/startup-and-config.md#2-the-config-file-has-no-validation-or-check-tool)**
- **[Missing optional extras fail when used, not at startup](../../findings/setup-and-operation/startup-and-config.md#3-missing-optional-extras-fail-when-used-not-at-startup)**
- **[Setup ends before credentials are tested](../../findings/setup-and-operation/startup-and-config.md#4-setup-ends-before-credentials-are-tested)**

### Navigation & Settings

- **[Settings are organized by code module, not by user task](../../findings/onboarding/navigation-and-settings.md#2-settings-are-organized-by-code-module-not-by-user-task)**

### Skill Authoring & Dependencies

- **[Skill Python dependencies and conflicts are invisible](../../findings/skills/authoring-and-testing.md#2-skill-python-dependencies-and-conflicts-are-invisible)**

### Skill Marketplace

- **[Marketplace shows no ratings, usage or freshness](../../findings/skills/marketplace.md#1-marketplace-shows-no-ratings-usage-or-freshness)**

### Skill Versioning

- **[Skill updates can't be reviewed or rolled back](../../findings/skills/versioning.md#1-skill-updates-cant-be-reviewed-or-rolled-back)**
