[← Index](../README.md) · jiuwenswarm Usability Review

---

# Security Researcher

*Tests the security posture of a jiuwenswarm deployment: prompt injection, permission bypass, authentication gaps, data leakage between users.*

This persona deliberately tries to break the system. They may be an internal security team member, an external penetration tester, or a bug bounty researcher. They need a documented threat model, known attack surfaces, and a test harness that lets them reproduce and verify findings.

**Key questions this persona needs answered:**
- What is the documented threat model for jiuwenswarm?
- What are the known attack surfaces (prompt injection, tool permission bypass, WebSocket auth, cross-user data leakage)?
- How do I set up a test environment that is isolated from production?
- What security controls are in place by default, and which require explicit configuration?
- Where can I report a vulnerability?

---

## Findings

> *The findings in this file are symptoms of a single systemic issue. [Read the root cause →](../findings/00-overview.md)*

*Not yet investigated. The findings below are expected based on the current codebase state — they will be confirmed and detailed when this persona is formally covered.*

### Expected finding areas

**No documented threat model** — There is no `SECURITY.md`, no threat model document, and no published list of known attack surfaces or out-of-scope behaviors.

**WebSocket authentication disabled by default** — Anyone who can reach the WebSocket port can send any E2A request without authentication. Origin validation exists but is disabled by default and undocumented. (Related: finding 18.4 in [application-developer.md](application-developer.md) and finding 18.5.)

**Prompt injection surface** — The agent processes user-provided text as instructions. The rail system can add guards (`before_tool_call` hooks), but there is no built-in prompt injection detection or documented mitigation.

**Cross-user data leakage** — Without `per_chat_bot_user` session scoping, all users in a shared deployment share the same memory and can potentially read each other's stored facts. The session isolation mechanism is a single undocumented config field. (Related: finding 18.6 in [application-developer.md](application-developer.md).)

**Tool permission model** — The tiered permission system (`config.yaml:1129–1286`) uses regex rules. It is unclear whether these rules are evaluated against the tool name as called by the LLM or as registered — a potential bypass surface. There is no security-focused documentation of the permission model.

**No security configuration hardening guide** — There is no document listing "before exposing jiuwenswarm to the internet, do X, Y, Z." An operator following the getting-started guide would deploy with auth disabled and origin checking off.
