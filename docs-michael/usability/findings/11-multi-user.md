[← Index](../README.md) · jiuwenswarm Usability Review

---

# §11 · Multi-User & Collaboration

*More than one person using the same instance.*

---

## 11.1 No User Identity or Access Control

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

---

## 11.2 Conversation Sharing Is Image-Only

**Current state.**
`shareImageExport.tsx` converts the chat to a PNG image. This is the only sharing
mechanism. There is no way to share a conversation as a link, as Markdown, or as
a JSON export that another person could import.

**What good looks like.**
- Export as Markdown (conversation turns formatted as `**User:** / **Agent:**`).
- Export as JSON (full structured conversation for import elsewhere).
- Share link (if the instance has a publicly accessible URL).

---

## 11.3 No Shared Skill Library for Teams

**Current state.**
Skills are per-agent-workspace. If two operators run separate instances, they cannot
share skills without manually copying files.

**What good looks like.**
A skill export/import format (`.skill.zip`) and a shared skill registry that team
members can publish to and pull from. The `SkillNetSearchModal` and `ClawHubSearchModal`
components suggest this direction exists — it should be surfaced more prominently
as the primary skill distribution mechanism.
