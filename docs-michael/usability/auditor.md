[← Index](README.md) · jiuwenswarm Usability Review

---

# Auditor / Compliance Officer

*Reviews what the agent did, what data it accessed, and what external calls it made — for legal, security, or regulatory purposes.*

This persona does not interact with the agent directly. They arrive after the fact and need to reconstruct a complete, verifiable picture of what happened in a session: which tools were called, what files were read or written, what external services were contacted, what data left the system.

**Key questions this persona needs answered:**
- What exactly did the agent do in session X, in what order, at what timestamps?
- Did the agent access or transmit any PII or confidential data?
- Which external APIs or services were called, with what payloads?
- Can I produce a signed, tamper-evident record of this session for a regulator?
- What data is currently stored, and where, and for how long?

---

## Findings

*Not yet investigated. The findings below are expected based on the current codebase state — they will be confirmed and detailed when this persona is formally covered.*

### Expected finding areas

**Audit log format** — The trajectory system captures agent activity, but the output format is designed for developer debugging (JSON with internal field names), not for compliance audit (structured, human-readable, exportable). There is no dedicated audit export.

**Data lineage** — No tool exists to answer "did the agent touch file X in any session this month?" across sessions.

**PII detection** — No mechanism flags or redacts PII before it is sent to the LLM or written to memory.

**External call inventory** — There is no consolidated log of external HTTP calls made by tools across sessions, queryable by time range or destination.

**Retention and deletion** — Trajectory data has a `retention_days` config option. Conversation history and memory have no retention policy. There is no "delete all data for user X" command.

**Export** — No structured export of session data (JSONL, CSV, Parquet) for ingestion into a SIEM or compliance tool.
