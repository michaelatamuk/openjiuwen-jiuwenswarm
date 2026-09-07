[← Index](../../README.md) · jiuwenswarm Usability Review

---

# Permissions

*Knowing and controlling what the agent may do.*

---

## 1 Users aren't told what the agent is allowed to do before it acts

**Current state.**
The agent can run bash commands, read and write files, send messages to Feishu,
call web APIs, and spawn subagents. Before a session starts the user sees no
summary of what the agent's current permissions are. The `PermissionWarningDialog`
only appears as a generic "full access warning" — it does not list what is
specifically permitted.

**What good looks like.**
A "Session capabilities" summary shown as a collapsible banner at the top of a new
conversation:
```
This agent can: read/write files in /home/mishka/invoices/ · send Feishu messages
                · run bash commands · call the parse-invoice skill
This agent cannot: access the internet · modify files outside the project directory
```
Users should be able to click any item to see the specific permission rule behind
it, and toggle tool access for this session without editing config.

---

