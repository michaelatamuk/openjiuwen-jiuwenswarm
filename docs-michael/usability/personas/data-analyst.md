[← Index](../README.md) · jiuwenswarm Usability Review

---

# Data Analyst

*Analyzes aggregate agent behavior: usage patterns, task success rates, most-used skills, failure modes — to inform product and deployment decisions.*

This persona works with data, not with the agent directly. They want structured, queryable records of what the agent has done across many sessions and many users. Their output is dashboards, reports, and recommendations: "The parse-invoice skill fails 23% of the time on PDFs over 5MB" or "90% of tasks are completed in under 3 tool calls."

**Key questions this persona needs answered:**
- How many sessions ran in the last 30 days, and what was the average task completion rate?
- Which skills are used most? Which fail most?
- What is the distribution of tool call counts per session?
- Can I export raw session/trajectory data into a data warehouse or analytics tool?
- Are there per-user usage metrics (for a shared deployment)?

---

## Findings

> *The findings in this file are symptoms of a single systemic issue. [Read the root cause →](../findings/00-overview.md)*

*Not yet investigated. The findings below are expected based on the current codebase state — they will be confirmed and detailed when this persona is formally covered.*

### Expected finding areas

**No structured telemetry export** — Trajectory data is stored in the database but there is no export command or API endpoint that returns it in a structured format (JSONL, Parquet, CSV) suitable for analytics tools.

**No usage dashboard** — There is no built-in dashboard showing aggregate metrics: session count, skill usage, failure rates, token consumption by session. The Web UI shows per-session trajectory but no cross-session aggregation.

**OTel tracing is opt-in and undiscovered** — The OpenTelemetry integration (`team_observability.enabled`) could feed a metrics backend, but it is disabled by default and not documented in any operator guide. (Related: see [operator.md](operator.md).)

**No per-user metrics in shared deployments** — Even with session isolation enabled, there is no API to query "how many sessions did user X have this week?" The `user_id` field is stored but not exposed in any query interface.

**Retention policy limits historical analysis** — Trajectory data expires based on `retention_days`. There is no way to export before expiry, so historical analysis is limited to the retention window.
