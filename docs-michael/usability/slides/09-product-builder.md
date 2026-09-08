# Slide for Product Builder

> Light spec: put the big line + cards on the slide; the findings stay in notes. One slide, one message, nothing crowded.

## On the slide

**Product Builder** — Builds their own product using jiuwenswarm as its backend.

### Cards (the body)

- **Connection & Security** — no API auth; weak origin checks
- **Transport & Protocol** — WebSocket-only; prose spec, no SDK
- **Integration & Tooling** — no dev stubs; only shell hooks

## Speaker notes

Installs a ready jiuwenswarm and builds on top of it over the E2A/WebSocket/ACP API for their own product's users.
