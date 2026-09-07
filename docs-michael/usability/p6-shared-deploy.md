[← Index](README.md) · jiuwenswarm Usability Review

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

## §11 · Multi-User & Collaboration

*More than one person using the same instance.*

> Also affects: **P1** (end-users in a shared instance), **P2** (operators deploy
> and configure the shared instance), **P4** (application developers building
> multi-user products on top of jiuwenswarm). See finding 18.6 for the application
> developer perspective on multi-tenancy.

### 11.1 No User Identity or Access Control

**Current state.**
The Web UI has no login. All users who can reach `localhost:5173` share the same
agent identity, memory, and skills. There is no concept of "this conversation
belongs to user A, not user B."

**What good looks like.**
For single-operator deployments this is acceptable. But for team deployments where
the agent is shared via a channel (Feishu group, Telegram channel), there should
be per-user memory isolation and the ability to set per-user permission levels.
The channel integration already passes `user_id` — this should be plumbed through
to memory and permission scoping.

### 11.2 Conversation Sharing Is Image-Only

**Current state.**
`shareImageExport.tsx` converts the chat to a PNG image. This is the only sharing
mechanism. There is no way to share a conversation as a link, as Markdown, or as
a JSON export that another person could import.

**What good looks like.**
- Export as Markdown (conversation turns formatted as `**User:** / **Agent:**`).
- Export as JSON (full structured conversation for import elsewhere).
- Share link (if the instance has a publicly accessible URL).

### 11.3 No Shared Skill Library for Teams

**Current state.**
Skills are per-agent-workspace. If two operators run separate instances, they cannot
share skills without manually copying files.

**What good looks like.**
A skill export/import format (`.skill.zip`) and a shared skill registry that team
members can publish to and pull from. The `SkillNetSearchModal` and `ClawHubSearchModal`
components suggest this direction exists — it should be surfaced more prominently
as the primary skill distribution mechanism.

---

## §3 · Trust & Safety (Shared Deployment Perspective)

*(Full findings → P1 chapter, §3)*

- **3.1** No Visibility Into Agent Permissions — in a shared IM deployment, group
  members have no way to know what the bot can do (read their files? send external
  messages on their behalf?). The session capabilities banner (3.1) is a Web UI
  feature; IM users get no equivalent.
- **3.4** Destructive External Actions Have No Confirmation Layer — in a group
  chat, a mistaken Feishu message sent by the bot is visible to everyone. The
  confirm-before-send mode (3.4) matters more in a shared deployment than in a
  private one.

---
