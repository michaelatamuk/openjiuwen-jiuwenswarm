[← Index](../README.md) · jiuwenswarm Usability Review

---

# §13 · Help & Support

*What happens when the user gets stuck?*

*Primary persona: P1. Also relevant to: P2, P9.*

---

## 13.1 No In-Context Help

**Current state.**
`HelpTips.tsx` exists as a generic help component. `channelGuideUrls.ts` has
external links for channel setup. Beyond these, there is no contextual help — no
tooltips on complex fields, no "?" icons that open relevant documentation.

**What good looks like.**
Every settings field with a non-obvious value should have a `?` icon that opens a
popover with:
- What this field does.
- Where to find the value (e.g. "Find your app_secret in the Feishu developer
  console under Credentials & Basic Info").
- A link to the full documentation.

---

## 13.2 No Diagnostic Mode for Users

**Current state.**
When something goes wrong, the user has no tool to collect diagnostic information.
They would need to know to look in `~/.jiuwenswarm/agent/.logs/`, which directory
the relevant log is in, and which log level to set.

**What good looks like.**
A `jiuwenswarm diagnostics` CLI command that:
- Collects the last 100 lines of each log file.
- Captures the config (with API keys redacted).
- Captures system info (OS, Python version, package versions).
- Writes a `jiuwenswarm-diagnostics-YYYY-MM-DD.txt` file.
- Prints: "Diagnostics saved. Share this file when reporting an issue."

**Operator note.**
When something goes wrong, the operator has no tool to collect diagnostic information in a single step. They would need to know to look in `~/.jiuwenswarm/agent/.logs/`, identify the relevant log directory, and know which log level to set. The same `jiuwenswarm diagnostics` CLI command serves both users and operators, but operators additionally need the command to be runnable remotely (e.g. via SSH) and to include channel-specific log sections.

---

## 13.3 Error Messages Do Not Reference Log Files

**Current state.**
When an error occurs, the user is not told where to look for more detail. They must
know that logs exist, where they are, and how to read them.

**What good looks like.**
Every error message that has more detail in the log should end with:
> "Full details in ~/.jiuwenswarm/agent/.logs/agent_server.log"

Or in the Web UI, a "Show log" button that opens a scrollable log panel filtered
to the current session and the last 60 seconds.

**Operator note.**
When an error occurs, neither the user nor the operator is told where to look for more detail. The operator must know that logs exist, where they are, and how to read them — none of this is documented at the point of error. For operators monitoring via CLI, errors written to stderr should include the log file path automatically.
