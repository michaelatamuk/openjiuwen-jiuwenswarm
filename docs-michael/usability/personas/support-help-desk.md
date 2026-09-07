[← Index](../README.md) · jiuwenswarm Usability Review

---

# Support / Help Desk

*Helps end-users when something goes wrong: looks up a session, replays what the agent did, diagnoses the failure, and resets user state.*

This persona is reactive — they arrive when a user reports a problem. They need tools to reconstruct what happened without having been present during the session. In a shared deployment (e.g. a Feishu bot shared across a team), the support person may have no direct access to the user's screen or context.

**Key questions this persona needs answered:**
- What did the agent do in user X's last session?
- At what step did it fail, and what was the error?
- Can I reproduce the issue without asking the user to repeat it?
- Can I reset the user's session or memory state without restarting the whole instance?
- Where do I look to find the relevant log entries for a specific user and time window?

---

## Findings

*Not yet investigated. The findings below are expected based on the current codebase state — they will be confirmed and detailed when this persona is formally covered.*

### Expected finding areas

**No session lookup by user** — There is no CLI command or Web UI panel to find all sessions belonging to a specific `user_id` (channel user). Support staff must browse the full session list.

**No diagnostic replay** — Sessions cannot be replayed in a controlled way to reproduce a failure. The trajectory data exists but has no playback UI.

**No state reset command** — There is no `jiuwenswarm reset-user <user_id>` command that clears a specific user's session state and memory without affecting other users.

**Log correlation is manual** — Matching a user report ("it failed around 3pm") to the right log file and line requires knowing the log file structure, which is undocumented.

**Error messages don't carry session context** — When a user pastes an error message to support, the message contains no session ID, no timestamp, no correlation ID that would let support staff find the relevant log entry quickly. (Related: finding 1.1 in [end-user.md](end-user.md).)
