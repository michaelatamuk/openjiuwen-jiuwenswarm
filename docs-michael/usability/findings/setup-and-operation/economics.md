[← Index](../../README.md) · jiuwenswarm Usability Review

---

# Cost & Token Economics

*Visibility into usage and cost.*

---

## 1 No visibility into token usage or session cost

**Current state.**
Users have no visibility into how many tokens each conversation is consuming.
For sessions with large memory snapshots, many installed skills, long conversation
history, and multiple subagents, the context can exceed 30K tokens per call. No
per-session counter, no cost estimate, no warning before hitting the model's limit.

**What good looks like.**
- A token counter in the chat panel showing total tokens used in the current
  session (both input and output).
- A per-message token annotation (collapsed by default, expandable on the message).
- A cost estimate based on the configured model's pricing (configurable per model
  in settings: `price_per_1k_input_tokens`, `price_per_1k_output_tokens`).
- A session summary card at conversation end: "This session used 48,320 tokens
  (~$0.14 at current rates)."

---

## 2 No hints about what is consuming the context

**Current state.**
If a session's context is growing large, there is no guidance on how to reduce it.
Users who hit context limits do not know whether the cause is a large memory
snapshot, many installed skills, or a long conversation.

**What good looks like.**
When the token count crosses 70%, show a breakdown: "Your context: conversation
history 40%, memory snapshot 35%, skills 15%, system 10%." Each item has a link
to the relevant setting: "Reduce memory snapshot size →", "Use auto_list mode for
skills →".

---
