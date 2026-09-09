# Web User

*A Consumer who works in the Web UI, shared across chat and code mode. Inherits the [Consumer](../../consumer/consumer.md) base.*

Sub-profiles: [Web Chat](../web-user-chat/web-user-chat.md) and [Web Code](../web-user-code/web-user-code.md).

This persona is **built on top of**: [Consumer](../../consumer/consumer.md). It inherits that base's findings; this file lists only its own.

## Findings that matter to them

*20 findings.*

### Language

- **[GUI text is not fully translated](findings/language/7-gui-text-is-not-fully-translated.md)**

- **[The newest features are the least translated](findings/language/newest-features-least-translated.md)**
### Navigation & Settings

- **[Settings are organized by code module, not by user task](findings/navigation-and-settings/2-settings-are-organized-by-code-module-not-by-user-task.md)**
- **[Skills and connectors are split apart though they're the same kind of thing](findings/navigation-and-settings/1-skills-and-connectors-are-split-apart-though-theyre-the-same-kind-of-thing.md)**
- **[The activity view is hidden behind an unclear name](findings/navigation-and-settings/3-the-activity-view-is-hidden-behind-an-unclear-name.md)**

### Discovery & Onboarding

- **[Empty screen offers no example or next step](findings/discovery-and-onboarding/1-empty-screen-offers-no-example-or-next-step.md)**
- **[No guidance introduces features after first run](findings/discovery-and-onboarding/1-no-guidance-introduces-features-after-first-run.md)**
- **[Powerful features exist but are never surfaced](findings/discovery-and-onboarding/2-powerful-features-exist-but-are-never-surfaced.md)**
- **[Agent modes have no user-facing names or descriptions](findings/discovery-and-onboarding/2-agent-modes-have-no-user-facing-names-or-descriptions.md)**

### Accessibility

- **[No high-contrast or large-text option](findings/accessibility/3-no-high-contrast-or-large-text-option.md)**
- **[No screen-reader support; streaming output isn't announced](findings/accessibility/2-no-screen-reader-support-streaming-output-isnt-announced.md)**

### Mobile

- **[The web UI isn't usable as a proper mobile experience](findings/mobile/1-the-web-ui-isnt-usable-as-a-proper-mobile-experience.md)**
- **[No installable or offline (PWA) version](findings/mobile/2-no-installable-or-offline-pwa-version.md)**

### Skill Marketplace

*No findings yet.*


### Browser Research



### Explanation & Visibility

- **[No way to see every LLM/tool call and token behind a run](findings/explanation-and-visibility/swarm-trace-viewer.md)**
- **[No live picture of how the swarm is coordinating](findings/explanation-and-visibility/swarm-topology-graph.md)**
- **[Can't scrub back through what the agent did, turn by turn](findings/explanation-and-visibility/session-replay.md)**


### Safety & Undo

- **[Can't compare versions of a generated artifact](findings/safety-and-undo/artifact-gallery-and-version-diff.md)**


### Control & Continuity

- **[The task list doesn't show progress moving](findings/control-and-continuity/goal-task-kanban.md)**


### Conversation

- **[The agent's output only lands as one final message](findings/conversation/live-canvas.md)**


### History & Notifications

- **[No way to know the agent's state without opening the window](findings/history-and-notifications/desktop-tray-status.md)**