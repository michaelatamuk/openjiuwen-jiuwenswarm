[← Index](../README.md) · jiuwenswarm Usability Review

---

# §6 · Agent Transparency & Explainability

*Can the user understand what the agent is doing and why?*

*Primary persona: P1. Also relevant to: P13.*

---

## 6.1 Thinking Display Is Hidden Behind the Trajectory Panel

**Current state.**
`TrajectoryTable.tsx` displays `thinkingDetail` for each trajectory cell with
expandable thinking blocks. However, this is inside the Trajectory panel — a
separate panel that must be explicitly opened. During a conversation, the user
sees only the streaming text output and tool call cards.

**What good looks like.**
Two levels of transparency:
- **Inline (default):** A collapsed "Reasoning" chip on each assistant message.
  Clicking it expands the thinking inline in the chat, without switching panels.
- **Full (Trajectory panel):** The full structured trace with timing, token counts,
  and tool argument/result details.

The inline chip should show the first 1–2 sentences of reasoning as a preview before
expanding.

---

## 6.2 Tool Calls Are Shown But Not Explained

**Current state.**
`ToolCallDisplay.tsx` shows tool name, formatted arguments (expandable), and
success/failure status. The description field exists in the tool schema but is
not displayed. The user sees `read_file("/data/invoices/inv_001.pdf")` but not why
the agent chose to read that file.

**What good looks like.**
Show a one-sentence rationale before each tool call — either from the agent's
reasoning or synthesized from the thinking trace:
```
Reading the invoice file to extract the vendor and amount fields.
> read_file("/data/invoices/inv_001.pdf")   ✓  (140ms)
```
For tool errors, show what the agent will try next:
```
> glob("/data/invoices/*.pdf")   ✗  Directory not found
  Agent will check if /data/invoices exists before retrying.
```

---

## 6.3 Subagent Activity Is Not Visible to the User

**Current state.**
When `subagent_spawn` is called, the parent agent's panel shows no indication that
subagents are running. The user has no view into what the subagents are doing, how
many are running, or whether any have failed.

**What good looks like.**
A live subagent activity panel (the `TeamArea` component exists for team mode —
the same concept should apply to on-demand subagents):
- A list of active subagents with: type, current step, elapsed time.
- Clicking a subagent opens its own trajectory or streaming output.
- When all subagents complete, a summary: "3 subagents finished in 28s."

---

## 6.4 No Explanation of Why the Agent Asked a Question

**Current state.**
When the agent asks the user for clarification ("Which directory should I write the
output to?"), there is no indication of what it was trying to do when it got stuck.
Users must infer from context.

**What good looks like.**
Attach a brief context line to every clarification request:
> "I'm about to write the output CSV and wasn't sure of the destination."
> **Which directory should I write the output file to?**
