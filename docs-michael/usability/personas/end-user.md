[← Index](../README.md) · jiuwenswarm Usability Review

---

# P1 — End-User

*The person chatting with the agent day to day.*

This is the largest section because end-users are the primary audience for most
of jiuwenswarm's surface area.

**Two meaningfully different variants of P1 exist:**

- **Web UI user** — opens `localhost:5173` directly, has full access to the chat
  panel, settings, skill panel, and trajectory view. This is also the most common
  deployment: the person who installed jiuwenswarm and uses it for themselves
  (see note on P1/P2 overlap below).
- **IM channel user (P13)** — encounters jiuwenswarm through a Feishu group, Telegram
  channel, WeChat bot, or similar. They use their IM app as the interface; they have
  no access to the Web UI, cannot change settings, cannot stop a running task, and
  may not know they are talking to jiuwenswarm. This persona is defined separately as
  P13 and is not yet fully covered.

The findings in this section are written for the Web UI user. Several (keyboard
shortcuts, trajectory panel, settings) do not apply to IM channel users at all.

**Note on P1/P2 overlap:** In the dominant deployment pattern — a developer or
technical individual who self-hosts jiuwenswarm — the installer and the user are the
same person. P1 and P2 collapse into one. The P1/P2 split is meaningful only when
jiuwenswarm is deployed as a shared IM bot: one person configured it (P2), others
use it through a channel (P1) without touching the config.

---

## Findings

> *The findings in this file are symptoms of a single systemic issue. [Read the root cause →](../findings/00-overview.md)*

*36 findings across 12 concern areas.*

### §1 · Core Usability

- **[Error messages give no explanation or next step](../findings/conversation/errors-and-feedback.md#1-error-messages-give-no-explanation-or-next-step)** — When something fails, the user sees "unknown error" with no context, no next step, no log reference.
- **[Agent modes have no user-facing names or descriptions](../findings/onboarding/empty-state-and-choosing.md#2-agent-modes-have-no-user-facing-names-or-descriptions)** — Mode selector has no descriptions; new users cannot make an informed choice.
- **[No way to rate, retry or correct an agent answer](../findings/conversation/errors-and-feedback.md#2-no-way-to-rate-retry-or-correct-an-agent-answer)** — No thumbs down, no regenerate, no inline correction on any assistant message.
- **[Creating a skill has no clear entry point](../findings/skills/authoring-and-testing.md#1-creating-a-skill-has-no-clear-entry-point)** — No guided entry point; the routing logic is buried inside a skill's own prompt.
- **[Past conversations can't be searched](../findings/conversation/messages-and-history.md#1-past-conversations-cant-be-searched)** — Finding a past conversation requires scrolling; there is no search box.
- **[Core actions have no keyboard shortcuts](../findings/platform/accessibility.md#4-core-actions-have-no-keyboard-shortcuts)** — New conversation, stop agent, open settings — none have keyboard access.
- **[No control over reply length or writing style](../findings/conversation/output-and-speed.md#1-no-control-over-reply-length-or-writing-style)** — No global preference for response verbosity; users must repeat "be brief" every time.
- **[Agent file writes and sends can't be undone](../findings/control/stop-resume-undo.md#2-agent-file-writes-and-sends-cant-be-undone)** — File writes, sent messages, API calls — none can be reversed from the UI.
- **[Long agent replies have no structure aids](../findings/conversation/output-and-speed.md#2-long-agent-replies-have-no-structure-aids)** — Long agent responses have no table of contents, jump-to-section, or collapsible sections.

### §3 · Trust & Safety

- **[Users aren't told what the agent is allowed to do before it acts](../findings/control/permissions.md#1-users-arent-told-what-the-agent-is-allowed-to-do-before-it-acts)** — The user has no summary of what the agent can do before it starts acting.
- **[File changes are applied with no preview or approval](../findings/control/approve-and-preview.md#1-file-changes-are-applied-with-no-preview-or-approval)** — Files can be created, edited, or deleted without any preview or approval step.
- **[No stop button that safely interrupts the agent](../findings/control/stop-resume-undo.md#1-no-stop-button-that-safely-interrupts-the-agent)** — Closing the tab may leave the agent running on the server in an unknown state.
- **[Destructive external actions fire without confirmation](../findings/control/approve-and-preview.md#2-destructive-external-actions-fire-without-confirmation)** — Feishu messages and API calls fire without the user being able to review or cancel them.

### §4 · Reliability & Resilience

- **[Degraded subsystems fail silently and users assume all is fine](../findings/setup-and-operation/health-and-degradation.md#1-degraded-subsystems-fail-silently-and-users-assume-all-is-fine)** — Memory or OTel failing silently means the user operates under false assumptions.
- **[Unclear what the agent does when a session disconnects](../findings/control/stop-resume-undo.md#3-unclear-what-the-agent-does-when-a-session-disconnects)** — After a tab close or WebSocket drop, there is no reconnect flow showing what the agent did.
- **[Rate limits and API failures hang or show nothing useful](../findings/setup-and-operation/health-and-degradation.md#2-rate-limits-and-api-failures-hang-or-show-nothing-useful)** — Rate limit hits cause silent hangs or generic errors with no retry countdown.
- **[A crash loses in-progress tasks with no way to resume](../findings/control/stop-resume-undo.md#4-a-crash-loses-in-progress-tasks-with-no-way-to-resume)** — A process crash loses the task completely; there is no checkpoint to resume from.

### §5 · Onboarding & First-Run Experience

- **[Setup wizard ends before the model is confirmed working](../findings/onboarding/first-run.md#1-setup-wizard-ends-before-the-model-is-confirmed-working)** — The wizard stops at the model panel; the user must figure out credentials and validation alone.
- **[Empty screen offers no example or next step](../findings/onboarding/empty-state-and-choosing.md#1-empty-screen-offers-no-example-or-next-step)** — An empty conversation shows a blank input with no example tasks or guidance.
- **[No guidance introduces features after first run](../findings/onboarding/progressive.md#1-no-guidance-introduces-features-after-first-run)** — Trajectory, skills, team mode, and memory are never introduced after setup.
- **[Running the CLI without config gives no next step](../findings/onboarding/first-run.md#2-running-the-cli-without-config-gives-no-next-step)** — Running jiuwenswarm with no config produces an unclear error and no next step.

### §6 · Agent Transparency & Explainability

- **[Agent reasoning is hidden in a separate panel](../findings/conversation/explanation.md#1-agent-reasoning-is-hidden-in-a-separate-panel)** — The agent's reasoning is only visible in a separate panel users must know to open.
- **[Tool calls show what ran but not why](../findings/conversation/explanation.md#2-tool-calls-show-what-ran-but-not-why)** — Users see what tool ran but not why the agent chose to call it.
- **[Subagents work invisibly with no progress view](../findings/conversation/explanation.md#3-subagents-work-invisibly-with-no-progress-view)** — Spawned subagents run invisibly; the user has no view of their progress or failures.
- **[Clarification questions appear with no context](../findings/conversation/explanation.md#4-clarification-questions-appear-with-no-context)** — Clarification requests appear without context about what the agent was trying to do.

### §7 · Performance & Perceived Speed

- **[Nothing is shown while waiting for the first token](../findings/conversation/output-and-speed.md#3-nothing-is-shown-while-waiting-for-the-first-token)** — The gap between sending a message and receiving the first token shows nothing — no spinner, no progress.
- **[No warning before the context limit drops early memory](../findings/conversation/output-and-speed.md#4-no-warning-before-the-context-limit-drops-early-memory)** — Users have no warning before the context limit is reached and the agent starts losing early context.
- **[Long-running skills show no progress](../findings/conversation/output-and-speed.md#5-long-running-skills-show-no-progress)** — A skill running for minutes shows only a generic tool call card with no step count.

### §8 · Notification & Async

- **[No notification when a long task finishes](../findings/conversation/messages-and-history.md#2-no-notification-when-a-long-task-finishes)** — Users must keep the Web UI open and watch; there is no browser notification or tab badge.
- **[Background tasks look identical to idle sessions](../findings/conversation/messages-and-history.md#3-background-tasks-look-identical-to-idle-sessions)** — Sessions running tasks in the background are indistinguishable from idle sessions in the sidebar.

### §12 · Data & Privacy

- **[Users can't see what the agent has remembered](../findings/memory-and-privacy/memory-visibility.md#1-users-cant-see-what-the-agent-has-remembered)** — Users cannot browse, search, edit, or delete what the agent has remembered about them.
- **[No way to see what personal data is sent to the model](../findings/memory-and-privacy/memory-visibility.md#2-no-way-to-see-what-personal-data-is-sent-to-the-model)** — The full prompt — including memory and personal data — is invisible before it is sent to an external API.
- **[Data is kept indefinitely with no expiry controls](../findings/memory-and-privacy/retention.md#1-data-is-kept-indefinitely-with-no-expiry-controls)** — Memory and conversation history are stored indefinitely with no expiry controls.

### §13 · Help & Support

- **[No help or tooltips at the point of confusion](../findings/setup-and-operation/diagnostics-and-help.md#3-no-help-or-tooltips-at-the-point-of-confusion)** — Settings fields with non-obvious values have no tooltips or inline documentation.
- **[No single command to gather diagnostics for a bug report](../findings/setup-and-operation/diagnostics-and-help.md#1-no-single-command-to-gather-diagnostics-for-a-bug-report)** — When something goes wrong, there is no command to collect and package diagnostic information.
- **[Errors don't point to the log entry with more detail](../findings/setup-and-operation/diagnostics-and-help.md#2-errors-dont-point-to-the-log-entry-with-more-detail)** — Errors never tell users where to find more detail in the logs.

### §14 · Accessibility

- **[The UI can't be driven fully by keyboard](../findings/platform/accessibility.md#1-the-ui-cant-be-driven-fully-by-keyboard)** — Tab traversal, arrow-key navigation, and keyboard activation of interactive elements have not been verified.
- **[No screen-reader support; streaming output isn't announced](../findings/platform/accessibility.md#2-no-screen-reader-support-streaming-output-isnt-announced)** — Streaming content has no aria-live region; screen readers do not announce new output.
- **[No high-contrast or large-text option](../findings/platform/accessibility.md#3-no-high-contrast-or-large-text-option)** — No high-contrast theme; OS accessibility preferences are not respected.

### §15 · Mobile & Cross-Platform

- **[The web UI isn't usable as a proper mobile experience](../findings/platform/mobile.md#1-the-web-ui-isnt-usable-as-a-proper-mobile-experience)** — The panel architecture collapses poorly to mobile; the layout was not designed for 375px viewports.
- **[No installable or offline (PWA) version](../findings/platform/mobile.md#2-no-installable-or-offline-pwa-version)** — No manifest, no service worker, no install-to-homescreen, no offline mode.

### §16 · Information Architecture

- **[Skills and connectors are split apart though they're the same kind of thing](../findings/onboarding/navigation-and-settings.md#1-skills-and-connectors-are-split-apart-though-theyre-the-same-kind-of-thing)** — Skills and MCP/plugins are split into separate nav sections though users think of them the same way.
- **[Settings are organized by code module, not by user task](../findings/onboarding/navigation-and-settings.md#2-settings-are-organized-by-code-module-not-by-user-task)** — The settings structure mirrors the codebase, not the user's goals.
- **[The activity view is hidden behind an unclear name](../findings/onboarding/navigation-and-settings.md#3-the-activity-view-is-hidden-behind-an-unclear-name)** — The panel is labeled "TraceHound" — a name that means nothing to a new user.
