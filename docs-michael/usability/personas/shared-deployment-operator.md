[← Index](../README.md) · jiuwenswarm Usability Review

---

# P6 — Shared Deployment Operator

*Deploys jiuwenswarm as a shared IM bot for a group or team.*

**What this persona actually is.** jiuwenswarm has no human team management system —
no user accounts, no admin dashboard, no per-user permissions UI. The word "team" in
the product refers to multi-agent configurations (a Leader Agent coordinating Teammate
Agents in `config.yaml`), not to human teams.

P6 is the person who deploys jiuwenswarm as a shared IM bot — e.g. connecting it to
a Feishu group, a Telegram channel, or a WeCom workspace so that multiple people in
the group can chat with it. This person is an operator (§P2) by background, but has
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

Coverage for P6 is partial. The §11 findings below are the closest coverage that
exists; a dedicated investigation of the shared-deployment workflow is needed.

---

## Findings

> *The findings in this file are symptoms of a single systemic issue. [Read the root cause →](../findings/00-overview.md)*

*5 findings across 2 concern areas.*

### §3 · Trust & Safety

- **[3.1 No Visibility Into Agent Permissions Before the First Action](../findings/03-trust-safety.md#31-no-visibility-into-agent-permissions-before-the-first-action)** — Group members using the IM bot have no Web UI access and cannot see any permission banner; they have no way to know what the bot can do.
- **[3.4 Destructive External Actions Have No Confirmation Layer](../findings/03-trust-safety.md#34-destructive-external-actions-have-no-confirmation-layer)** — In a group chat, a mistaken `send_feishu_message` triggered by an ambiguous message could broadcast incorrect information to an entire team.

### §11 · Multi-User & Collaboration

- **[11.1 No User Identity or Access Control](../findings/11-multi-user.md#111-no-user-identity-or-access-control)** — All users sharing an instance share the same memory and session space; per-user isolation is not available out of the box.
- **[11.2 Conversation Sharing Is Image-Only](../findings/11-multi-user.md#112-conversation-sharing-is-image-only)** — There is no way to share a conversation as a link, Markdown, or JSON export — only a PNG screenshot.
- **[11.3 No Shared Skill Library for Teams](../findings/11-multi-user.md#113-no-shared-skill-library-for-teams)** — Skills are per-workspace; separate instances cannot share skills without manually copying files.
