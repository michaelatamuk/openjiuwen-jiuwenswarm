[← Index](../../README.md) · jiuwenswarm Usability Review

---

# Messages, History & Notifications

*Managing past conversations and learning about finished work.*

---

## 1 Past conversations can't be searched

**Current state.**
`ConversationSidebar.tsx` shows sessions grouped by project with rename, delete,
and pin — but no search. Finding a specific past conversation requires scrolling
through all sessions.

**What good looks like.**
A search box at the top of the conversation sidebar that searches across session
titles and message content. Results should highlight the matching message and jump
to it. This is table-stakes for any chat product.

---

## 2 No notification when a long task finishes

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

## 3 Background tasks look identical to idle sessions

**Current state.**
When the user navigates to a different session while the agent is running, there is
no indication in the sidebar that a session has an active task. The session list
shows a processing state for the active session, but background sessions are silent.

**What good looks like.**
- A pulsing dot on sessions running in background in the `ConversationSidebar`.
- A global "Running tasks" indicator in the `SessionSidebar` nav.
- When a background task completes, show a badge on the session and a non-blocking
  toast: "Session 'Invoice task' completed."

---

## 4 Conversations can only be shared as a flat image

**Current state.**
`shareImageExport.tsx` converts the chat to a PNG image. This is the only sharing
mechanism. There is no way to share a conversation as a link, as Markdown, or as
a JSON export that another person could import.

**What good looks like.**
- Export as Markdown (conversation turns formatted as `**User:** / **Agent:**`).
- Export as JSON (full structured conversation for import elsewhere).
- Share link (if the instance has a publicly accessible URL).

---

