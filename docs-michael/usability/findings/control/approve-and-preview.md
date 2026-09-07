[← Index](../../README.md) · jiuwenswarm Usability Review

---

# Approval & Preview

*Reviewing changes and external actions before they happen.*

---

## 1 File changes are applied with no preview or approval

**Current state.**
The agent can create, edit, and delete files in the project directory. The Web UI
has a `CodeChangesCard` component in `ChatPanel/index.tsx` — but it is not clear
whether it shows a preview before changes are made or a summary after.

**What good looks like.**
Before committing any file write, the agent should show a diff in the chat panel:
```
Proposed change to src/parser.py:
- def parse(file):
+ def parse(file, encoding="utf-8"):
[Apply] [Edit] [Skip]
```
This requires the harness to separate the "compute change" step from the "commit
change" step — architecturally non-trivial but the highest-leverage trust feature
in a coding assistant.

---

## 2 Destructive external actions fire without confirmation

**Current state.**
The agent can send messages to Feishu groups, publish to external APIs, and call
webhooks — all without a user confirmation step. The permission system can block
tools entirely but cannot require per-call confirmation for sensitive actions.

**What good looks like.**
A "confirm before send" mode for external-impact tools. Before calling
`send_feishu_message` or any external webhook, the agent shows the message content
in the chat panel with Confirm / Edit / Cancel buttons. This is especially important
for group messages where mistakes are visible to many people.

---
