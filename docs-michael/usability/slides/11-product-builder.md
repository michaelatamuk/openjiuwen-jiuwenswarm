# Slide for Product Builder

> Light spec: put the big line + cards on the slide; the findings stay in notes. One slide, one message, nothing crowded.

## On the slide

**Product Builder** — Builds their own product using jiuwenswarm as backend (B2B2C).

### Cards (the body)

- **Connection & Security** — no API auth; weak origin checks
- **Transport & Protocol** — WebSocket-only; prose spec; no SDK
- **Integration & Tooling** — no stubs/dev mode; only shell hooks
- **Observability** — no run or cost observability
- **Documentation** — docs incomplete or show the wrong (Chinese) UI

## Speaker notes

Installs a ready jiuwenswarm and builds a consumer product on top over E2A/WebSocket/ACP; connection, protocol and integration friction.
