[← Index](../../README.md) · jiuwenswarm Usability Review

---

# Memory Visibility

*Seeing what is remembered and what is sent out.*

---

## 1 Users can't see what the agent has remembered

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

## 2 No way to see what personal data is sent to the model

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

