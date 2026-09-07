[← Index](../../README.md) · jiuwenswarm Usability Review

---

# Web User

*The person who runs JiuwenSwarm and uses the full Web UI / desktop app — including the coding and automation use that is JiuwenSwarm's core audience.*

## Findings that matter to them

*44 findings.*

### Errors & Feedback

- **[Error messages give no explanation or next step](../../findings/conversation/errors-and-feedback/1-error-messages-give-no-explanation-or-next-step.md)**
- **[No way to rate, retry or correct an agent answer](../../findings/conversation/errors-and-feedback/2-no-way-to-rate-retry-or-correct-an-agent-answer.md)**

### Agent Explanation

- **[Agent reasoning is hidden in a separate panel](../../findings/conversation/explanation.md#1-agent-reasoning-is-hidden-in-a-separate-panel)**
- **[Tool calls show what ran but not why](../../findings/conversation/explanation.md#2-tool-calls-show-what-ran-but-not-why)**
- **[Subagents work invisibly with no progress view](../../findings/conversation/explanation.md#3-subagents-work-invisibly-with-no-progress-view)**
- **[Clarification questions appear with no context](../../findings/conversation/explanation.md#4-clarification-questions-appear-with-no-context)**

### Messages, History & Notifications

- **[Past conversations can't be searched](../../findings/conversation/messages-and-history.md#1-past-conversations-cant-be-searched)**
- **[No notification when a long task finishes](../../findings/conversation/messages-and-history.md#2-no-notification-when-a-long-task-finishes)**
- **[Background tasks look identical to idle sessions](../../findings/conversation/messages-and-history.md#3-background-tasks-look-identical-to-idle-sessions)**
- **[Conversations can only be shared as a flat image](../../findings/conversation/messages-and-history.md#4-conversations-can-only-be-shared-as-a-flat-image)**

### Output & Perceived Speed

- **[No control over reply length or writing style](../../findings/conversation/output-and-speed.md#1-no-control-over-reply-length-or-writing-style)**
- **[Long agent replies have no structure aids](../../findings/conversation/output-and-speed.md#2-long-agent-replies-have-no-structure-aids)**
- **[Nothing is shown while waiting for the first token](../../findings/conversation/output-and-speed.md#3-nothing-is-shown-while-waiting-for-the-first-token)**
- **[No warning before the context limit drops early memory](../../findings/conversation/output-and-speed.md#4-no-warning-before-the-context-limit-drops-early-memory)**
- **[Long-running skills show no progress](../../findings/conversation/output-and-speed.md#5-long-running-skills-show-no-progress)**

### Approval & Preview

- **[File changes are applied with no preview or approval](../../findings/control/approve-and-preview.md#1-file-changes-are-applied-with-no-preview-or-approval)**
- **[Destructive external actions fire without confirmation](../../findings/control/approve-and-preview.md#2-destructive-external-actions-fire-without-confirmation)**

### Permissions

- **[Users aren't told what the agent is allowed to do before it acts](../../findings/control/permissions.md#1-users-arent-told-what-the-agent-is-allowed-to-do-before-it-acts)**

### Stop, Resume & Undo

- **[No stop button that safely interrupts the agent](../../findings/control/stop-resume-undo.md#1-no-stop-button-that-safely-interrupts-the-agent)**
- **[Agent file writes and sends can't be undone](../../findings/control/stop-resume-undo.md#2-agent-file-writes-and-sends-cant-be-undone)**
- **[Unclear what the agent does when a session disconnects](../../findings/control/stop-resume-undo.md#3-unclear-what-the-agent-does-when-a-session-disconnects)**
- **[A crash loses in-progress tasks with no way to resume](../../findings/control/stop-resume-undo.md#4-a-crash-loses-in-progress-tasks-with-no-way-to-resume)**

### Memory Visibility

- **[Users can't see what the agent has remembered](../../findings/memory-and-privacy/memory-visibility.md#1-users-cant-see-what-the-agent-has-remembered)**
- **[No way to see what personal data is sent to the model](../../findings/memory-and-privacy/memory-visibility.md#2-no-way-to-see-what-personal-data-is-sent-to-the-model)**

### Diagnostics & Support

- **[No single command to gather diagnostics for a bug report](../../findings/setup-and-operation/diagnostics-and-help.md#1-no-single-command-to-gather-diagnostics-for-a-bug-report)**
- **[Errors don't point to the log entry with more detail](../../findings/setup-and-operation/diagnostics-and-help.md#2-errors-dont-point-to-the-log-entry-with-more-detail)**
- **[No help or tooltips at the point of confusion](../../findings/setup-and-operation/diagnostics-and-help.md#3-no-help-or-tooltips-at-the-point-of-confusion)**

### Health & Degradation

- **[Degraded subsystems fail silently and users assume all is fine](../../findings/setup-and-operation/health-and-degradation.md#1-degraded-subsystems-fail-silently-and-users-assume-all-is-fine)**
- **[Rate limits and API failures hang or show nothing useful](../../findings/setup-and-operation/health-and-degradation.md#2-rate-limits-and-api-failures-hang-or-show-nothing-useful)**

### Empty States & Choosing a Mode

- **[Empty screen offers no example or next step](../../findings/onboarding/empty-state-and-choosing.md#1-empty-screen-offers-no-example-or-next-step)**
- **[Agent modes have no user-facing names or descriptions](../../findings/onboarding/empty-state-and-choosing.md#2-agent-modes-have-no-user-facing-names-or-descriptions)**

### First Run

- **[Setup wizard ends before the model is confirmed working](../../findings/onboarding/first-run.md#1-setup-wizard-ends-before-the-model-is-confirmed-working)**
- **[Running the CLI without config gives no next step](../../findings/onboarding/first-run.md#2-running-the-cli-without-config-gives-no-next-step)**

### Navigation & Settings

- **[Skills and connectors are split apart though they're the same kind of thing](../../findings/onboarding/navigation-and-settings.md#1-skills-and-connectors-are-split-apart-though-theyre-the-same-kind-of-thing)**
- **[Settings are organized by code module, not by user task](../../findings/onboarding/navigation-and-settings.md#2-settings-are-organized-by-code-module-not-by-user-task)**
- **[The activity view is hidden behind an unclear name](../../findings/onboarding/navigation-and-settings.md#3-the-activity-view-is-hidden-behind-an-unclear-name)**

### Progressive Discovery

- **[No guidance introduces features after first run](../../findings/onboarding/progressive.md#1-no-guidance-introduces-features-after-first-run)**

### Accessibility & Keyboard

- **[The UI can't be driven fully by keyboard](../../findings/platform/accessibility.md#1-the-ui-cant-be-driven-fully-by-keyboard)**
- **[No screen-reader support; streaming output isn't announced](../../findings/platform/accessibility.md#2-no-screen-reader-support-streaming-output-isnt-announced)**
- **[No high-contrast or large-text option](../../findings/platform/accessibility.md#3-no-high-contrast-or-large-text-option)**
- **[Core actions have no keyboard shortcuts](../../findings/platform/accessibility.md#4-core-actions-have-no-keyboard-shortcuts)**

### Mobile & Cross-Device

- **[The web UI isn't usable as a proper mobile experience](../../findings/platform/mobile.md#1-the-web-ui-isnt-usable-as-a-proper-mobile-experience)**
- **[No installable or offline (PWA) version](../../findings/platform/mobile.md#2-no-installable-or-offline-pwa-version)**

### Skill Authoring & Dependencies

- **[Creating a skill has no clear entry point](../../findings/skills/authoring-and-testing.md#1-creating-a-skill-has-no-clear-entry-point)**
