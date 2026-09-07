[← Index](../../README.md) · jiuwenswarm Usability Review

---

# Empty States & Choosing a Mode

*Starting out and deciding how the agent should behave.*

---

## 1 Empty screen offers no example or next step

**Current state.**
An empty conversation shows a blank input area. There is a `WelcomeBubble` component
with adaptive positioning, but its content is not known without reading the code.

**What good looks like.**
The empty state should show:
- 3–5 example tasks tailored to the active mode ("Parse my invoices", "Refactor
  this Python file", "Search the web for…").
- A prompt suggestion chip that inserts the text into the input on click.
- A "What can I do?" link that opens a short capability overview.

---

## 2 Agent modes have no user-facing names or descriptions

**Current state.**
Modes — `agent`, `code`, `cluster`, `team`, `agent.plan`, `agent.fast` — are named
from the implementation's perspective. The mode selector in the Web UI has no
tooltip, no one-liner description, and no example of when to use each. A new user
cannot make an informed choice.

**What good looks like.**
Name modes from the user's goal, not the system's architecture:

| Internal name | User-facing name | One-liner |
|---|---|---|
| `agent` | Standard | For everyday tasks and questions |
| `agent.fast` | Fast | Quick answers, less thorough |
| `agent.plan` | Plan first | Agent writes a plan for your approval before doing anything |
| `code` | Code | Software development, debugging, refactoring |
| `cluster` | Multi-agent | Complex tasks where several agents work in parallel |
| `team` | Team | Persistent team of agents with shared workspace and memory |

The mode selector should show this table on hover or as an expandable hint.
First-time users should see a recommendation ("For your first task, try Standard").

---

