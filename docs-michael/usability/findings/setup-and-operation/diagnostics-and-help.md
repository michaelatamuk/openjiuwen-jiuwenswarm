[← Index](../../README.md) · jiuwenswarm Usability Review

---

# Diagnostics & Support

*Getting unstuck and reporting problems.*

---

## 1 No single command to gather diagnostics for a bug report

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

It should also be runnable remotely (e.g. via SSH) and include channel-specific log
sections.

---

## 2 Errors don't point to the log entry with more detail

**Current state.**
When an error occurs, the user is not told where to look for more detail. They must
know that logs exist, where they are, and how to read them.

**What good looks like.**
Every error message that has more detail in the log should end with:
> "Full details in ~/.jiuwenswarm/agent/.logs/agent_server.log"

Or in the Web UI, a "Show log" button that opens a scrollable log panel filtered
to the current session and the last 60 seconds. Errors written to stderr should also
include the log file path automatically, so the detail is reachable without opening a
separate viewer.

See also [Error messages give no explanation or next step](../conversation/errors-and-feedback.md#1-error-messages-give-no-explanation-or-next-step), which covers the message content and machine-readable codes.

---

## 3 No help or tooltips at the point of confusion

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

