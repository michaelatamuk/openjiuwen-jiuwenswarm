[← Index](../../README.md) · jiuwenswarm Usability Review

---

# Web User

*The person who runs JiuwenSwarm and uses the full Web UI / desktop app — including the coding and automation use that is JiuwenSwarm's core audience.*

## One person, two ways of using it

This is **one person, not two**. Q&A and coding are **modes of the same session**, not different roles. The product's mode model is `scope.domain.mode`, so `agent.work.*` (conversation / Q&A) and `agent.code.*` (code mode) are toggled by the same user in the same Web UI, and `code` also exists under `team`.

The findings below are sorted into three buckets so you can see what overlaps and what doesn't:

1. **Shared by both** — the Q&A user and the code-mode user feel these. This is the majority: most of the experience is common.
2. **Mostly the chat / Q&A user** — these matter mainly for plain conversation, and barely for code work.
3. **Mostly the code-mode user** — these matter mainly when editing real files / code, and barely for casual Q&A.

A handful are felt by both but are listed on the side where they bite hardest. This is still **one persona** — the buckets just tell you which concerns each mode leans on.

## Findings that matter to them

*40 findings.*

---

## 1 · Shared by both (29 findings)

### Errors & Feedback

- **[Error messages give no explanation or next step](../../findings/conversation/errors-and-feedback/1-error-messages-give-no-explanation-or-next-step.md)**
- **[No way to rate, retry or correct an agent answer](../../findings/conversation/errors-and-feedback/2-no-way-to-rate-retry-or-correct-an-agent-answer.md)**

### Agent Explanation

- **[Clarification questions appear with no context](../../findings/conversation/explanation/3-clarification-questions-appear-with-no-context.md)**

### Messages, History & Notifications

- **[Past conversations can't be searched](../../findings/conversation/messages-and-history/1-past-conversations-cant-be-searched.md)**
- **[No notification when a long task finishes](../../findings/conversation/messages-and-history/2-no-notification-when-a-long-task-finishes.md)**
- **[Background tasks look identical to idle sessions](../../findings/conversation/messages-and-history/3-background-tasks-look-identical-to-idle-sessions.md)**

### Output & Perceived Speed

- **[Long agent replies have no structure aids](../../findings/conversation/output-and-speed/2-long-agent-replies-have-no-structure-aids.md)**
- **[No immediate feedback between submit and the first chat event](../../findings/conversation/output-and-speed/3-no-immediate-feedback-between-submit-and-the-first-chat-event.md)**
- **[No advance warning before context compression](../../findings/conversation/output-and-speed/4-no-advance-warning-before-context-compression.md)**

### Permissions

- **[Users aren't told what the agent is allowed to do before it acts](../../findings/control/permissions/1-users-arent-told-what-the-agent-is-allowed-to-do-before-it-acts.md)**

### Stop, Resume & Undo

- **[No stop button that safely interrupts the agent](../../findings/control/stop-resume-undo/1-no-stop-button-that-safely-interrupts-the-agent.md)**
- **[Unclear what the agent does when a session disconnects](../../findings/control/stop-resume-undo/3-unclear-what-the-agent-does-when-a-session-disconnects.md)**
- **[A crash loses in-progress tasks with no way to resume](../../findings/control/stop-resume-undo/4-a-crash-loses-in-progress-tasks-with-no-way-to-resume.md)**

### Memory Visibility

- **[Users can't see what the agent has remembered](../../findings/memory-and-privacy/memory-visibility/1-users-cant-see-what-the-agent-has-remembered.md)**
- **[No way to see what personal data is sent to the model](../../findings/memory-and-privacy/memory-visibility/2-no-way-to-see-what-personal-data-is-sent-to-the-model.md)**

### Diagnostics & Support

- **[No single command to gather diagnostics for a bug report](../../findings/setup-and-operation/diagnostics-and-help/1-no-single-command-to-gather-diagnostics-for-a-bug-report.md)**
- **[Errors don't point to the log entry with more detail](../../findings/setup-and-operation/diagnostics-and-help/2-errors-dont-point-to-the-log-entry-with-more-detail.md)**
- **[No help or tooltips at the point of confusion](../../findings/setup-and-operation/diagnostics-and-help/3-no-help-or-tooltips-at-the-point-of-confusion.md)**

### Health & Degradation

- **[You aren't told when a subsystem fails](../../findings/setup-and-operation/health-and-degradation/1-you-arent-told-when-a-subsystem-fails.md)**
- **[Rate limits and API failures hang or show nothing useful](../../findings/setup-and-operation/health-and-degradation/2-rate-limits-and-api-failures-hang-or-show-nothing-useful.md)**

### Empty States & Choosing a Mode

- **[Empty screen offers no example or next step](../../findings/onboarding/empty-state-and-choosing/1-empty-screen-offers-no-example-or-next-step.md)**

### Navigation & Settings

- **[Skills and connectors are split apart though they're the same kind of thing](../../findings/onboarding/navigation-and-settings/1-skills-and-connectors-are-split-apart-though-theyre-the-same-kind-of-thing.md)**
- **[Settings are organized by code module, not by user task](../../findings/onboarding/navigation-and-settings/2-settings-are-organized-by-code-module-not-by-user-task.md)**
- **[The activity view is hidden behind an unclear name](../../findings/onboarding/navigation-and-settings/3-the-activity-view-is-hidden-behind-an-unclear-name.md)**

### Progressive Discovery

- **[No guidance introduces features after first run](../../findings/onboarding/progressive/1-no-guidance-introduces-features-after-first-run.md)**

### Accessibility & Keyboard

- **[No screen-reader support; streaming output isn't announced](../../findings/platform/accessibility/2-no-screen-reader-support-streaming-output-isnt-announced.md)**
- **[No high-contrast or large-text option](../../findings/platform/accessibility/3-no-high-contrast-or-large-text-option.md)**

### Mobile & Cross-Device

- **[The web UI isn't usable as a proper mobile experience](../../findings/platform/mobile/1-the-web-ui-isnt-usable-as-a-proper-mobile-experience.md)**
- **[No installable or offline (PWA) version](../../findings/platform/mobile/2-no-installable-or-offline-pwa-version.md)**

---

## 2 · Mostly the chat / Q&A user (2 findings)

### Output & Perceived Speed

- **[No control over reply length or writing style](../../findings/conversation/output-and-speed/1-no-control-over-reply-length-or-writing-style.md)**

### Messages, History & Notifications

- **[Conversations can only be shared as a flat image](../../findings/conversation/messages-and-history/4-conversations-can-only-be-shared-as-a-flat-image.md)**

---

## 3 · Mostly the code-mode user (9 findings)

### Agent Explanation

- **[Agent reasoning is hidden in a separate panel](../../findings/conversation/explanation/1-agent-reasoning-is-hidden-in-a-separate-panel.md)** — a coder wants to inspect the steps behind a file edit
- **[Tool calls show what ran but not why](../../findings/conversation/explanation/2-tool-calls-show-what-ran-but-not-why.md)**

### Output & Perceived Speed

- **[No step-wise progress or ETA while a skill runs](../../findings/conversation/output-and-speed/5-no-stepwise-progress-or-eta-while-a-skill-runs.md)** — long builds / skills

### Approval & Preview

- **[File changes are applied with no preview or approval](../../findings/control/approve-and-preview/1-file-changes-are-applied-with-no-preview-or-approval.md)**
- **[Destructive external actions fire without confirmation](../../findings/control/approve-and-preview/2-destructive-external-actions-fire-without-confirmation.md)**

### Stop, Resume & Undo

- **[Sent messages and API calls can't be undone](../../findings/control/stop-resume-undo/2-sent-messages-and-api-calls-cant-be-undone.md)** — reverting a change

### Empty States & Choosing a Mode

- **[Agent modes have no user-facing names or descriptions](../../findings/onboarding/empty-state-and-choosing/2-agent-modes-have-no-user-facing-names-or-descriptions.md)** — picking code mode vs work mode

### Accessibility & Keyboard

- **[The UI can't be driven fully by keyboard](../../findings/platform/accessibility/1-the-ui-cant-be-driven-fully-by-keyboard.md)** — a developer often works keyboard-first
- **[Core actions have no keyboard shortcuts](../../findings/platform/accessibility/4-core-actions-have-no-keyboard-shortcuts.md)**
