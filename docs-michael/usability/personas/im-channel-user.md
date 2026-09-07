[← Index](../README.md) · jiuwenswarm Usability Review

---

# IM Channel User

*Encounters jiuwenswarm through a Feishu group, Telegram channel, WeChat bot, DingTalk workspace, or similar — uses the IM app as the only interface and has no access to the Web UI.*

This persona is distinct from the Web UI end-user ([end-user.md](end-user.md)) in several important ways:
- They did not install jiuwenswarm and may not know they are talking to it
- Their entire interface is the IM application — no settings, no mode selector, no trajectory panel, no stop button
- They share the bot with other group members; their messages may be interleaved
- The IM platform imposes its own constraints: message length limits, threading model, @mention requirements, reaction-based interaction
- They cannot interrupt a running task, view memory, change response style, or access any configuration

This is likely one of the most common end-user archetypes in Chinese enterprise deployments (Feishu, DingTalk, WeCom), yet it is the least represented in the current usability coverage.

**Key questions this persona needs answered:**
- When I send a message, how do I know the bot received it?
- How do I stop the bot if it's doing something wrong?
- The bot responded in the group — was that meant for me or for someone else?
- Can the bot remember things between our conversations?
- Why did the bot stop responding / time out?

---

## Findings

*Not yet investigated. The findings below are expected based on the current codebase state — they will be confirmed and detailed when this persona is formally covered.*

### Expected finding areas

**No task interruption from chat** — There is no command (e.g. `/stop`, `/cancel`) that lets an IM user interrupt a running agent task. On the Web UI there is a Stop button; in an IM channel there is nothing.

**Response format not IM-optimized** — The agent generates Markdown with headers, code blocks, and bullet lists. Most IM platforms render this partially or not at all. Long responses arrive as a single wall of text. There is no IM-aware response formatter.

**Message length limits** — Feishu, Telegram, and WeChat all impose message length limits (typically 4096–8192 characters). Long agent responses that exceed the limit are silently truncated or split unpredictably.

**No onboarding for group bot** — When the bot is added to a Feishu group, there is no greeting, no capability overview, no "here's how to use me." Group members have no way to discover what the bot can do without trial and error.

**Group context confusion** — In a group chat, the bot receives all messages from all members. It may respond to the wrong person or mix context from multiple conversations. There is no enforced per-user context isolation within a group thread.

**No session visibility** — IM users cannot see their session list, cannot rename sessions, cannot search past conversations. Everything is buried in the IM thread history.

**Error messages are raw** — When something fails, the user receives the raw error text (or nothing). There is no IM-appropriate error format: short, actionable, without code snippets or log references that are meaningless in a chat context. (Related: finding 1.1 in [end-user.md](end-user.md).)

**Memory is invisible** — IM users cannot see what the agent has remembered about them, cannot delete facts, and cannot tell the agent to forget something — because all of these actions require the Web UI memory panel.

**Mode selection is inaccessible** — The agent mode (Standard, Fast, Plan-first, Code, Multi-agent) cannot be changed from an IM channel. The user is locked into whatever mode the operator configured.
