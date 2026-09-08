# Slide 9 — Product Builder

> Self-contained spec for building this slide. You should not need any other file to produce it.

## The one line (put this big on the slide)

**Product Builder** — The on-top builder: installs a ready jiuwenswarm (or its SDK) and builds their own product that uses jiuwenswarm as its backend over the E2A/WebSocket (or ACP) API.

## Who this person is

The on-top builder: installs a ready jiuwenswarm (or its SDK) and builds their own product that uses jiuwenswarm as its backend over the E2A/WebSocket (or ACP) API.

## What concerns them (the slide body)

This persona's own concerns — show them as a set of cards/tiles, one per group:

**Connection & Security** (2):

- [No API authentication: fine locally, a real risk once exposed
- [WebSocket origin checks are off by default and undocumented

**Transport & Protocol** (4):

- [External apps can only reach the agent over WebSocket, with no REST
- [The E2A protocol spec is prose, not a machine-readable schema
- [No published client SDK, so every app re-implements the protocol
- [Session API methods have no documented response shapes

**Integration & Tooling** (2):

- [Only shell-command hooks exist; there's no real webhook delivery
- [No local stub or dev mode for testing integrations

## Speaker notes (short)

"Product Builder: The on-top builder: installs a ready jiuwenswarm (or its SDK) and builds their own product that uses jiuwenswarm as its backend over the E2A/WebSocket (or ACP) API. These are the 8 concerns specific to them; anything shared comes from the base persona above them."
