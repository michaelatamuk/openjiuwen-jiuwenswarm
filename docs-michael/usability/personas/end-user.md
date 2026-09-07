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

*36 findings across 12 concern areas.*

### §1 · Core Usability

- **[1.1 Error Messages Give Users Nothing to Act On](../findings/01-core-usability.md#11-error-messages-give-users-nothing-to-act-on)** — When something fails, the user sees "unknown error" with no context, no next step, no log reference.
- **[1.2 Mode Naming Is System-Centric, Not User-Centric](../findings/01-core-usability.md#12-mode-naming-is-system-centric-not-user-centric)** — Mode selector has no descriptions; new users cannot make an informed choice.
- **[1.3 No Structured Feedback Mechanism for Agent Responses](../findings/01-core-usability.md#13-no-structured-feedback-mechanism-for-agent-responses)** — No thumbs down, no regenerate, no inline correction on any assistant message.
- **[1.4 Skill Creation Entry Point Is Not Obvious](../findings/01-core-usability.md#14-skill-creation-entry-point-is-not-obvious)** — No guided entry point; the routing logic is buried inside a skill's own prompt.
- **[1.5 Conversation History Is Not Searchable](../findings/01-core-usability.md#15-conversation-history-is-not-searchable)** — Finding a past conversation requires scrolling; there is no search box.
- **[1.6 No Keyboard Shortcuts for Core Actions](../findings/01-core-usability.md#16-no-keyboard-shortcuts-for-core-actions)** — New conversation, stop agent, open settings — none have keyboard access.
- **[1.7 Agent Output Has No Length or Style Controls](../findings/01-core-usability.md#17-agent-output-has-no-length-or-style-controls)** — No global preference for response verbosity; users must repeat "be brief" every time.
- **[1.8 No "Undo" for Agent Actions](../findings/01-core-usability.md#18-no-undo-for-agent-actions)** — File writes, sent messages, API calls — none can be reversed from the UI.
- **[1.9 Long Messages Lack Structure Aids](../findings/01-core-usability.md#19-long-messages-lack-structure-aids)** — Long agent responses have no table of contents, jump-to-section, or collapsible sections.

### §3 · Trust & Safety

- **[3.1 No Visibility Into Agent Permissions Before the First Action](../findings/03-trust-safety.md#31-no-visibility-into-agent-permissions-before-the-first-action)** — The user has no summary of what the agent can do before it starts acting.
- **[3.2 No Diff/Preview Before the Agent Modifies Files](../findings/03-trust-safety.md#32-no-diffpreview-before-the-agent-modifies-files)** — Files can be created, edited, or deleted without any preview or approval step.
- **[3.3 No Task Cancellation With Defined Semantics](../findings/03-trust-safety.md#33-no-task-cancellation-with-defined-semantics)** — Closing the tab may leave the agent running on the server in an unknown state.
- **[3.4 Destructive External Actions Have No Confirmation Layer](../findings/03-trust-safety.md#34-destructive-external-actions-have-no-confirmation-layer)** — Feishu messages and API calls fire without the user being able to review or cancel them.

### §4 · Reliability & Resilience

- **[4.1 Graceful Degradation Is Silent](../findings/04-reliability.md#41-graceful-degradation-is-silent)** — Memory or OTel failing silently means the user operates under false assumptions.
- **[4.2 Session Recovery After Disconnect Is Undefined](../findings/04-reliability.md#42-session-recovery-after-disconnect-is-undefined)** — After a tab close or WebSocket drop, there is no reconnect flow showing what the agent did.
- **[4.3 Rate Limiting and API Failures Are Opaque](../findings/04-reliability.md#43-rate-limiting-and-api-failures-are-opaque)** — Rate limit hits cause silent hangs or generic errors with no retry countdown.
- **[4.4 No Persistent State for In-Progress Tasks](../findings/04-reliability.md#44-no-persistent-state-for-in-progress-tasks)** — A process crash loses the task completely; there is no checkpoint to resume from.

### §5 · Onboarding & First-Run Experience

- **[5.1 The Setup Wizard Ends Too Early](../findings/05-first-run.md#51-the-setup-wizard-ends-too-early)** — The wizard stops at the model panel; the user must figure out credentials and validation alone.
- **[5.2 Empty State Has No Direction](../findings/05-first-run.md#52-empty-state-has-no-direction)** — An empty conversation shows a blank input with no example tasks or guidance.
- **[5.3 No Progressive Onboarding After First Use](../findings/05-first-run.md#53-no-progressive-onboarding-after-first-use)** — Trajectory, skills, team mode, and memory are never introduced after setup.
- **[5.4 CLI First-Run Has No Guidance](../findings/05-first-run.md#54-cli-first-run-has-no-guidance)** — Running jiuwenswarm with no config produces an unclear error and no next step.

### §6 · Agent Transparency & Explainability

- **[6.1 Thinking Display Is Hidden Behind the Trajectory Panel](../findings/06-transparency.md#61-thinking-display-is-hidden-behind-the-trajectory-panel)** — The agent's reasoning is only visible in a separate panel users must know to open.
- **[6.2 Tool Calls Are Shown But Not Explained](../findings/06-transparency.md#62-tool-calls-are-shown-but-not-explained)** — Users see what tool ran but not why the agent chose to call it.
- **[6.3 Subagent Activity Is Not Visible to the User](../findings/06-transparency.md#63-subagent-activity-is-not-visible-to-the-user)** — Spawned subagents run invisibly; the user has no view of their progress or failures.
- **[6.4 No Explanation of Why the Agent Asked a Question](../findings/06-transparency.md#64-no-explanation-of-why-the-agent-asked-a-question)** — Clarification requests appear without context about what the agent was trying to do.

### §7 · Performance & Perceived Speed

- **[7.1 No First-Token Latency Indicator](../findings/07-performance.md#71-no-first-token-latency-indicator)** — The gap between sending a message and receiving the first token shows nothing — no spinner, no progress.
- **[7.2 No Indication of Context Length Pressure](../findings/07-performance.md#72-no-indication-of-context-length-pressure)** — Users have no warning before the context limit is reached and the agent starts losing early context.
- **[7.3 Skill Execution Has No Progress Feedback](../findings/07-performance.md#73-skill-execution-has-no-progress-feedback)** — A skill running for minutes shows only a generic tool call card with no step count.

### §8 · Notification & Async

- **[8.1 No Notification When Long-Running Tasks Complete](../findings/08-async-notifications.md#81-no-notification-when-long-running-tasks-complete)** — Users must keep the Web UI open and watch; there is no browser notification or tab badge.
- **[8.2 No Background Task Management](../findings/08-async-notifications.md#82-no-background-task-management)** — Sessions running tasks in the background are indistinguishable from idle sessions in the sidebar.

### §12 · Data & Privacy

- **[12.1 No Visibility Into What Is Stored in Memory](../findings/12-data-privacy.md#121-no-visibility-into-what-is-stored-in-memory)** — Users cannot browse, search, edit, or delete what the agent has remembered about them.
- **[12.2 No Indication of What the Agent Sends to the LLM](../findings/12-data-privacy.md#122-no-indication-of-what-the-agent-sends-to-the-llm)** — The full prompt — including memory and personal data — is invisible before it is sent to an external API.
- **[12.3 No Data Retention Policy UI](../findings/12-data-privacy.md#123-no-data-retention-policy-ui)** — Memory and conversation history are stored indefinitely with no expiry controls.

### §13 · Help & Support

- **[13.1 No In-Context Help](../findings/13-help-support.md#131-no-in-context-help)** — Settings fields with non-obvious values have no tooltips or inline documentation.
- **[13.2 No Diagnostic Mode for Users](../findings/13-help-support.md#132-no-diagnostic-mode-for-users)** — When something goes wrong, there is no command to collect and package diagnostic information.
- **[13.3 Error Messages Do Not Reference Log Files](../findings/13-help-support.md#133-error-messages-do-not-reference-log-files)** — Errors never tell users where to find more detail in the logs.

### §14 · Accessibility

- **[14.1 No Keyboard Navigation Across the UI](../findings/14-accessibility.md#141-no-keyboard-navigation-across-the-ui)** — Tab traversal, arrow-key navigation, and keyboard activation of interactive elements have not been verified.
- **[14.2 No Screen Reader Support Audit](../findings/14-accessibility.md#142-no-screen-reader-support-audit)** — Streaming content has no aria-live region; screen readers do not announce new output.
- **[14.3 No High-Contrast or Large-Text Mode](../findings/14-accessibility.md#143-no-high-contrast-or-large-text-mode)** — No high-contrast theme; OS accessibility preferences are not respected.

### §15 · Mobile & Cross-Platform

- **[15.1 Mobile Layout Exists But Is Not a First-Class Experience](../findings/15-mobile.md#151-mobile-layout-exists-but-is-not-a-first-class-experience)** — The panel architecture collapses poorly to mobile; the layout was not designed for 375px viewports.
- **[15.2 No Native App (PWA) Support](../findings/15-mobile.md#152-no-native-app-pwa-support)** — No manifest, no service worker, no install-to-homescreen, no offline mode.

### §16 · Information Architecture

- **[16.1 Skills and Connectors Are Separate But Conceptually Similar](../findings/16-info-architecture.md#161-skills-and-connectors-are-separate-but-conceptually-similar)** — Skills and MCP/plugins are split into separate nav sections though users think of them the same way.
- **[16.2 Settings Are Organized by Implementation, Not by User Task](../findings/16-info-architecture.md#162-settings-are-organized-by-implementation-not-by-user-task)** — The settings structure mirrors the codebase, not the user's goals.
- **[16.3 Trajectory / Trace Panel Is Hidden and Unnamed](../findings/16-info-architecture.md#163-trajectory--trace-panel-is-hidden-and-unnamed)** — The panel is labeled "TraceHound" — a name that means nothing to a new user.
