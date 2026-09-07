[← Index](../README.md) · jiuwenswarm Usability Review

---

# P4 — Application Developer

*The engineer building their own product, app, or service on top of jiuwenswarm as a backend.*

This audience is distinct from the extension developer (P3, who works inside the jiuwenswarm
codebase writing rails and tools). The application developer treats jiuwenswarm as a black
box: they stand it up, connect to it over a network, and build their own frontend, workflow,
or integration on top of it. Their only contact with jiuwenswarm is the external API it
exposes.

---

## Findings

> *The findings in this file are symptoms of a single systemic issue. [Read the root cause →](../findings/00-overview.md)*

*11 findings across 4 concern areas.*

### §8 · Async Notifications

- **[No notification when a long task finishes](../findings/conversation/messages-and-history.md#2-no-notification-when-a-long-task-finishes)** — There is no server-side push notification for task completion; a server-side app must hold a WebSocket open for the full task duration.

### §21 · Transport & Protocol

- **[External apps can only reach the agent over WebSocket, with no REST](../findings/application-api/transport-and-protocol.md#1-external-apps-can-only-reach-the-agent-over-websocket-with-no-rest)** — Every operation requires a persistent WebSocket and E2A envelope; one-shot automation use cases have no simpler path.
- **[The E2A protocol spec is prose, not a machine-readable schema](../findings/application-api/transport-and-protocol.md#2-the-e2a-protocol-spec-is-prose-not-a-machine-readable-schema)** — No JSON Schema, AsyncAPI spec, or generated type stubs exist; developers cross-reference Markdown prose against source dataclasses.
- **[No published client SDK, so every app re-implements the protocol](../findings/application-api/transport-and-protocol.md#3-no-published-client-sdk-so-every-app-re-implements-the-protocol)** — No PyPI package, no npm package; every integration starts from scratch implementing WebSocket and E2A.
- **[Session API methods have no documented response shapes](../findings/application-api/transport-and-protocol.md#4-session-api-methods-have-no-documented-response-shapes)** — ~30 E2A methods have no request/response schema document; developers read source to discover field names.

### §22 · Security & Isolation

- **[The API has no authentication and is open by default](../findings/application-api/security-and-isolation.md#1-the-api-has-no-authentication-and-is-open-by-default)** — Anyone who can reach the WebSocket port can send any request; there is no authentication layer to enable.
- **[WebSocket origin checks are off by default and undocumented](../findings/application-api/security-and-isolation.md#2-websocket-origin-checks-are-off-by-default-and-undocumented)** — Origin validation is controlled by undocumented environment variables; cross-origin access is unrestricted by default.
- **[No multi-tenancy: every user shares one workspace](../findings/collaboration/identity-and-isolation.md#2-no-multi-tenancy-every-user-shares-one-workspace)** — Different `user_id` values share the same memory and session list; building a multi-user product requires running one instance per user.

### §23 · Integration & Local Development

- **[Writing a custom channel has no developer guide](../findings/application-api/integration-and-local-development.md#1-writing-a-custom-channel-has-no-developer-guide)** — The `BaseChannel` interface is clean and has 11 reference implementations, but the registration mechanism and lifecycle contract are undocumented.
- **[Only shell-command hooks exist; there's no real webhook delivery](../findings/application-api/integration-and-local-development.md#2-only-shell-command-hooks-exist-theres-no-real-webhook-delivery)** — No native webhook target type, no retry, no HMAC signature, no event for task completion; shell `curl` workaround is the only option.
- **[No local stub or dev mode for testing integrations](../findings/application-api/integration-and-local-development.md#3-no-local-stub-or-dev-mode-for-testing-integrations)** — Testing requires the full real stack; there is no stub gateway, no canned-response mode, no Docker Compose for CI.

---
