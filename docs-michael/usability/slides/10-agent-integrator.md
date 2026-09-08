# Slide for Agent Integrator

> Light spec: put the big line + cards on the slide; the findings stay in notes. One slide, one message, nothing crowded.

## On the slide

**Agent Integrator** — Wires jiuwenswarm into a multi-agent system via the A2A protocol.

### Cards (the body)

- **Discovery & Card** — agent card has minimal capability info for orchestrators
- **Task Lifecycle** — completion signals require stream parsing; no simple done/fail event
- **Outbound & Delegation** — jiuwenswarm cannot call other agents; terminal node only
- **Protocol & Compatibility** — optional dep; no push notifications; version pinning unclear
- **Structured Output** — tool calls are textified, not structured artifacts; semantic loss

## Speaker notes

Connects an external agent framework (Google ADK, LangGraph, CrewAI, etc.) to jiuwenswarm via the A2A HTTP/JSON-RPC protocol. Machine-to-machine — no human in the loop. Their concern is not UX: it is whether jiuwenswarm behaves as a reliable, well-described agent peer. The biggest gap: jiuwenswarm can receive A2A calls but cannot itself call other agents, making it a terminal node rather than a full participant in a multi-agent pipeline.
