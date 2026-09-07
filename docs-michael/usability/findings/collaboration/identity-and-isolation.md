[← Index](../../README.md) · jiuwenswarm Usability Review

---

# Identity & Isolation

*Separating users in a shared instance.*

---

## 1 All users share one identity, memory and permissions

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

## 2 No multi-tenancy: every user shares one workspace

**Current state.**
jiuwenswarm is a single-workspace system. All sessions, memory, and skills belong to one
agent identity in `~/.jiuwenswarm/`. While the E2A protocol carries a `user_id` field, this
is used for logging and channel routing, not for data isolation. Two users calling the
same jiuwenswarm instance with different `user_id` values share the same memory, the same
installed skills, and can see each other's session list.

For an application developer building a multi-user product (a SaaS tool, a team assistant,
a customer-facing agent), this is a hard blocker. The only workaround is running a separate
jiuwenswarm instance per user — multiplying infrastructure cost and operational complexity.

**What good looks like.**
A `user_id`-scoped isolation layer:
- Sessions are scoped to `user_id`: user A cannot list or access user B's sessions.
- Memory is scoped to `user_id`: each user has their own `USER.md` and `MEMORY.md`.
- Installed skills are shared (system-level) or per-user depending on config.
- The `session.list` method returns only the sessions belonging to the requesting `user_id`.

This does not require separate processes — it requires namespace prefixes in session IDs
and memory paths: `~/.jiuwenswarm/users/{user_id}/sessions/` instead of
`~/.jiuwenswarm/agent/sessions/`.

---

