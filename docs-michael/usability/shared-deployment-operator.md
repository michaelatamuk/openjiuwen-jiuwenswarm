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

## §3 · Trust & Safety

*What group members can see about what the bot can do, and whether dangerous actions are confirmed.*

### 3.1 No Visibility Into Agent Permissions

**Current state.**
The agent can run bash commands, read and write files, send messages to Feishu,
call web APIs, and spawn subagents. Before a session starts the user sees no
summary of what the agent's current permissions are. The `PermissionWarningDialog`
only appears as a generic "full access warning" — it does not list what is
specifically permitted.

In a shared IM deployment, this problem is compounded: group members have no Web UI
access at all. They cannot see a permission banner even if one existed. They have
no way to know that the bot they are chatting with in a Feishu group can send
messages on their behalf to other channels, or read files on the server.

**What good looks like.**
A bot introduction message when first added to a group or when a user first interacts
with the bot, listing what it can and cannot do in plain language:
```
Hi! I'm the team assistant. I can:
· Read and summarize documents you share with me
· Search the web and report back
· Send Feishu messages (only in this group, and only when asked)

I cannot access your personal files or send messages outside this group.
```
This is the IM-appropriate equivalent of the Web UI session capabilities banner.

### 3.4 Destructive External Actions Have No Confirmation Layer

**Current state.**
The agent can send messages to Feishu groups, publish to external APIs, and call
webhooks — all without a user confirmation step. The permission system can block
tools entirely but cannot require per-call confirmation for sensitive actions.

In a group chat context, this is especially risky: a mistaken `send_feishu_message`
call triggered by an ambiguous user message could broadcast incorrect information
to an entire team or organization.

**What good looks like.**
A "confirm before send" mode for external-impact tools. Before calling
`send_feishu_message` or any external webhook, the agent shows the message content
in the chat with Confirm / Edit / Cancel options. In an IM channel, this would be
a follow-up message:
```
I'm about to send this to the #announcements group:
"Q3 report is ready for review."
Reply 'yes' to send, 'no' to cancel, or 'edit [your text]' to change it.
```
This is especially important for group messages where mistakes are visible to many people.

---
