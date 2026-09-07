[← Index](../../README.md) · jiuwenswarm Usability Review

---

# Data Retention

*How long data is kept and how it is expired.*

---

## 1 Data is kept indefinitely with no expiry controls

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

---
