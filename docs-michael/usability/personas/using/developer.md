[← Index](../../README.md) · jiuwenswarm Usability Review

---

# Developer

*A technical user who drives JiuwenSwarm as a coding and automation assistant — from the Code workspace, IDE plugins, terminal/TUI, and CLI.*

A Developer is also an End-User (and, when self-hosting, often the Instance Admin). This persona highlights the findings that bite hardest when the work is code: reviewing and undoing file changes, seeing and stopping what the agent did, and getting actionable errors.

---

## Findings

> *The findings in this file are symptoms of a single systemic issue. [Read the root cause →](../../findings/00-overview.md)*

*9 findings across the control, conversation, and memory concerns.*

### Approve And Preview

- **[File changes are applied with no preview or approval](../../findings/control/approve-and-preview.md#1-file-changes-are-applied-with-no-preview-or-approval)** — File edits apply with no diff to review first, so a mistaken code change can't be caught before it lands.

### Stop Resume Undo

- **[No stop button that safely interrupts the agent](../../findings/control/stop-resume-undo.md#1-no-stop-button-that-safely-interrupts-the-agent)** — No safe way to interrupt the agent mid-run from the terminal/editor workflow.
- **[Agent file writes and sends can't be undone](../../findings/control/stop-resume-undo.md#2-agent-file-writes-and-sends-cant-be-undone)** — Agent file writes aren't undoable, so a bad automated change can't be rolled back.

### Permissions

- **[Users aren't told what the agent is allowed to do before it acts](../../findings/control/permissions.md#1-users-arent-told-what-the-agent-is-allowed-to-do-before-it-acts)** — No pre-session summary of what the agent can do (files, bash, tools) before it starts acting.

### Explanation

- **[Tool calls show what ran but not why](../../findings/conversation/explanation.md#2-tool-calls-show-what-ran-but-not-why)** — Tool calls show what ran but not why, which makes debugging what the agent did hard.

### Errors And Feedback

- **[Error messages give no explanation or next step](../../findings/conversation/errors-and-feedback.md#1-error-messages-give-no-explanation-or-next-step)** — When a run fails, the error gives nothing actionable to fix or report.

### Output And Speed

- **[No warning before the context limit drops early memory](../../findings/conversation/output-and-speed.md#4-no-warning-before-the-context-limit-drops-early-memory)** — No warning before the context window is about to drop early context mid-task.

### Memory Visibility

- **[Users can't see what the agent has remembered](../../findings/memory-and-privacy/memory-visibility.md#1-users-cant-see-what-the-agent-has-remembered)** — No way to see what the agent has remembered about the project before working on it.

### Messages And History

- **[Conversations can only be shared as a flat image](../../findings/conversation/messages-and-history.md#4-conversations-can-only-be-shared-as-a-flat-image)** — A session can only be shared as an image, not as runnable context for a teammate.

---