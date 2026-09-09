# Slide for Agent Integrator

> Light spec: put the big line + cards on the slide; the findings stay in notes. One slide, one message, nothing crowded.

## On the slide

**Agent Integrator** — Wires jiuwenswarm into a multi-agent system via A2A (M2M).

### Cards (the body)

- **Discovery & Card** — agent card has minimal capability info for orchestrators
- **Task Lifecycle** — completion signals need stream parsing; no simple done/fail
- **Outbound & Delegation** — can't call other agents; terminal node only
- **Protocol & Compatibility** — optional dep; no push; version pinning unclear
- **Structured Output** — tool calls are textified, not structured artifacts

## Speaker notes

Connects an external agent framework (ADK, LangGraph, CrewAI) over A2A HTTP/JSON-RPC; machine-to-machine, no human in the loop. The biggest gap: jiuwenswarm can receive A2A calls but cannot call other agents, so it is a terminal node rather than a full multi-agent participant.
