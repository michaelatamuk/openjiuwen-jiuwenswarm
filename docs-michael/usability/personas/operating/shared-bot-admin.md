[← Index](../../README.md) · jiuwenswarm Usability Review

---

# Shared Bot Admin

*The administrator who runs one JiuwenSwarm shared as a bot that a group talks to — e.g. a
Feishu or Telegram group — so the other people use it without any config.*

**What this actually means.** jiuwenswarm has no human team-management system — no user
accounts, no admin dashboard, no per-user permissions UI. The word "team" in
the product refers to multi-agent configurations (a Leader Agent coordinating Teammate
Agents in `config.yaml`), not to human teams.

This persona is the person who deploys jiuwenswarm as a shared IM bot — e.g. connecting it to
a Feishu group, a Telegram channel, or a WeCom workspace so that multiple people in
the group can chat with it. This person is an administrator by background, but has
a different primary concern: making the shared deployment work correctly for multiple
simultaneous users, none of whom have access to the config.

Their practical problems are:
- Sessions bleeding between users (mitigated by `gateway.session_map_scope:
  per_chat_bot_user`, but this config field is undocumented in any guide)
- No visibility into which users are active or what tasks they have running
- No way to reset a specific user's session without restarting the whole instance
- No rate limiting per user — one heavy user can consume all model capacity
- No way to selectively disable tools for specific users or user groups
- The IM bot appears to all group members at once; there is no way to make it
  visible only to specific members

Coverage is partial. The findings below are the closest coverage that
exists; a dedicated investigation of the shared-deployment workflow is needed.

---

## Findings

> *The findings in this file are symptoms of a single systemic issue. [Read the root cause →](../../findings/00-overview.md)*

*5 findings.*

### Control

- **[Users aren't told what the agent is allowed to do before it acts](../../findings/control/permissions.md#1-users-arent-told-what-the-agent-is-allowed-to-do-before-it-acts)** — Group members using the IM bot have no Web UI access and cannot see any permission banner; they have no way to know what the bot can do.
- **[Destructive external actions fire without confirmation](../../findings/control/approve-and-preview.md#2-destructive-external-actions-fire-without-confirmation)** — In a group chat, a mistaken `send_feishu_message` triggered by an ambiguous message could broadcast incorrect information to an entire team.

### Collaboration & sharing

- **[All users share one identity, memory and permissions](../../findings/collaboration/identity-and-isolation.md#1-all-users-share-one-identity-memory-and-permissions)** — All users sharing an instance share the same memory and session space; per-user isolation is not available out of the box.
- **[Conversations can only be shared as a flat image](../../findings/conversation/messages-and-history.md#4-conversations-can-only-be-shared-as-a-flat-image)** — There is no way to share a conversation as a link, Markdown, or JSON export — only a PNG screenshot.
- **[No shared skill library across instances](../../findings/collaboration/shared-library.md#1-no-shared-skill-library-across-instances)** — Skills are per-workspace; separate instances cannot share skills without manually copying files.
