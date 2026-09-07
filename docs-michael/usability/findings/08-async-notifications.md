[← Index](../README.md) · jiuwenswarm Usability Review

---

# §8 · Notification & Async

*How does the system communicate with users who are not watching?*

---

## 8.1 No Notification When Long-Running Tasks Complete

**Current state.**
For tasks that take minutes, the user must keep the Web UI open and watch. There
is no desktop notification, no sound, no badge, no message-to-self when the task
completes. The only notifications found are in-app toasts.

**What good looks like.**
- **Browser notification:** On task complete, fire a Web Notifications API
  notification (with permission): "Invoice parsing complete — 3 files processed."
- **Sound:** An optional subtle completion sound (user-configurable).
- **Tab badge:** Update the page title to show unread results: "(✓) jiuwenswarm".
- **Channel self-notification:** Option to send the result summary to the user's own
  Feishu/Telegram account on completion. Given that channels are already integrated,
  this is a small addition.

---

## 8.2 No Background Task Management

**Current state.**
When the user navigates to a different session while the agent is running, there is
no indication in the sidebar that a session has an active task. The session list
shows a processing state for the active session, but background sessions are silent.

**What good looks like.**
- A pulsing dot on sessions running in background in the `ConversationSidebar`.
- A global "Running tasks" indicator in the `SessionSidebar` nav.
- When a background task completes, show a badge on the session and a non-blocking
  toast: "Session 'Invoice task' completed."
