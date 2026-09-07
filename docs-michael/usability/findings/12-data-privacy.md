[← Index](../README.md) · jiuwenswarm Usability Review

---

# §12 · Data & Privacy

*What data is stored, where, and who can see it.*

---

## 12.1 No Visibility Into What Is Stored in Memory

**Current state.**
The memory system stores facts, daily logs, and user profile data in
`~/.jiuwenswarm/workspace/`. Users have no UI to browse, search, edit, or delete
what the agent has remembered about them.

**What good looks like.**
A "My memory" panel (accessible from the sidebar) that shows:
- `USER.md` content formatted as a profile card.
- `MEMORY.md` content as a searchable list of facts.
- Recent daily memory entries (last 7 days).
- A "Delete fact" button on each item.
- A "Clear all memory" action with a confirmation.

---

## 12.2 No Indication of What the Agent Sends to the LLM

**Current state.**
The full prompt sent to the model — including memory snapshot, installed skills,
conversation history, and system sections — is invisible to the user. There is no
way to audit what personal information is being sent to an external API.

**What good looks like.**
A "What's in the prompt?" inspector (accessible from a ⓘ icon on the model name
indicator) that shows a summary of the current prompt: how many tokens, which
sections are included, and whether memory or skills are attached. Users should be
able to see that their `USER.md` content is part of the prompt before they consent
to using an external model.

---

## 12.3 No Data Retention Policy UI

**Current state.**
Memory and conversation history are stored indefinitely. There is a
`trajectory_ui.retention_days` config option, but no equivalent for conversations
or memory.

**What good looks like.**
A data retention settings panel with separate controls for instance-wide defaults
and per-user preferences (where applicable):
- "Keep conversation history for: 30 / 90 / 365 / forever"
- "Keep daily memory for: 7 / 30 / 90 / forever"
- "Delete all data older than X"

Automated expiration should run on startup. In shared deployments, instance
administrators should be able to set a maximum retention period that individual
users cannot exceed.
