# Consumer

*The base consumer: concerns every consumer feels no matter which surface they use to reach the agent.*

A consumer can reach the agent through several surface groups, each a folder that builds on this base:

- [Web UI](../web/web-user/web-user.md) — rich GUI (Web; the desktop app is a wrapper of it). Has [Web Chat](../web/web-user-chat/web-user-chat.md) and [Web Code](../web/web-user-code/web-user-code.md) sub-profiles.
- [Text surfaces](../text/text-user/text-user.md) — [CLI](../text/text-user-cli/text-user-cli.md), [TUI](../text/text-user-tui/text-user-tui.md), [IM](../text/text-user-im/text-user-im.md).
- [Channel surfaces](../channel/channel-user/channel-user.md) — [IDE](../channel/channel-user-ide/channel-user-ide.md), [Browser](../channel/channel-user-browser/channel-user-browser.md).

Surface-specific concerns live in each surface's own file; everything in common is here.

## Findings that matter to them

*19 findings.*

### Errors & Feedback

- **[Error messages give no explanation or next step](findings/conversation/errors-and-feedback/1-error-messages-give-no-explanation-or-next-step.md)**
- **[No way to rate, retry or correct an agent answer](findings/conversation/errors-and-feedback/2-no-way-to-rate-retry-or-correct-an-agent-answer.md)**
### Agent Explanation

- **[Clarification questions appear with no context](findings/conversation/explanation/3-clarification-questions-appear-with-no-context.md)**
### Messages, History & Notifications

- **[Background tasks look identical to idle sessions](findings/conversation/messages-and-history/3-background-tasks-look-identical-to-idle-sessions.md)**
- **[No notification when a long task finishes](findings/conversation/messages-and-history/2-no-notification-when-a-long-task-finishes.md)**
- **[Past conversations can't be searched](findings/conversation/messages-and-history/1-past-conversations-cant-be-searched.md)**
### Output & Perceived Speed

- **[Long agent replies have no structure aids](findings/conversation/output-and-speed/2-long-agent-replies-have-no-structure-aids.md)**
- **[No advance warning before context compression](findings/conversation/output-and-speed/4-no-advance-warning-before-context-compression.md)**
- **[No immediate feedback between submit and the first chat event](findings/conversation/output-and-speed/3-no-immediate-feedback-between-submit-and-the-first-chat-event.md)**
### Permissions

- **[Users aren't told what the agent is allowed to do before it acts](findings/control/permissions/1-users-arent-told-what-the-agent-is-allowed-to-do-before-it-acts.md)**
### Stop, Resume & Undo

- **[A crash loses in-progress tasks with no way to resume](findings/control/stop-resume-undo/4-a-crash-loses-in-progress-tasks-with-no-way-to-resume.md)**
- **[No stop button that safely interrupts the agent](findings/control/stop-resume-undo/1-no-stop-button-that-safely-interrupts-the-agent.md)**
- **[Unclear what the agent does when a session disconnects](findings/control/stop-resume-undo/3-unclear-what-the-agent-does-when-a-session-disconnects.md)**
### Memory Visibility

- **[No way to see what personal data is sent to the model](findings/memory-and-privacy/memory-visibility/2-no-way-to-see-what-personal-data-is-sent-to-the-model.md)**
- **[Users can't see what the agent has remembered](findings/memory-and-privacy/memory-visibility/1-users-cant-see-what-the-agent-has-remembered.md)**
### Diagnostics & Support

- **[Errors don't point to the log entry with more detail](findings/setup-and-operation/diagnostics-and-help/2-errors-dont-point-to-the-log-entry-with-more-detail.md)**
- **[No help or tooltips at the point of confusion](findings/setup-and-operation/diagnostics-and-help/3-no-help-or-tooltips-at-the-point-of-confusion.md)**
- **[No single command to gather diagnostics for a bug report](findings/setup-and-operation/diagnostics-and-help/1-no-single-command-to-gather-diagnostics-for-a-bug-report.md)**
### Health & Degradation

- **[Rate limits and API failures hang or show nothing useful](findings/setup-and-operation/health-and-degradation/2-rate-limits-and-api-failures-hang-or-show-nothing-useful.md)**
