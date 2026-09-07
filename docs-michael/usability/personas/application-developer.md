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

- **[8.1 No Notification When Long-Running Tasks Complete](../findings/08-async-notifications.md#81-no-notification-when-long-running-tasks-complete)** — There is no server-side push notification for task completion; a server-side app must hold a WebSocket open for the full task duration.

### §21 · Transport & Protocol

- **[21.1 The Primary API Is WebSocket-Only — No REST Fallback](../findings/21-transport-and-protocol.md#211-the-primary-api-is-websocket-only--no-rest-fallback)** — Every operation requires a persistent WebSocket and E2A envelope; one-shot automation use cases have no simpler path.
- **[21.2 E2A Protocol Is Documented in Markdown, Not in a Machine-Readable Format](../findings/21-transport-and-protocol.md#212-e2a-protocol-is-documented-in-markdown-not-in-a-machine-readable-format)** — No JSON Schema, AsyncAPI spec, or generated type stubs exist; developers cross-reference Markdown prose against source dataclasses.
- **[21.3 No Published Client SDK — Every App Reimplements the Protocol](../findings/21-transport-and-protocol.md#213-no-published-client-sdk--every-app-reimplements-the-protocol)** — No PyPI package, no npm package; every integration starts from scratch implementing WebSocket and E2A.
- **[21.4 Session API Is Full-Featured But Has No Documented Response Shapes](../findings/21-transport-and-protocol.md#214-session-api-is-full-featured-but-has-no-documented-response-shapes)** — ~30 E2A methods have no request/response schema document; developers read source to discover field names.

### §22 · Security & Isolation

- **[22.1 Authentication Has No Enforcement — APIs Are Open by Default](../findings/22-security-and-isolation.md#221-authentication-has-no-enforcement--apis-are-open-by-default)** — Anyone who can reach the WebSocket port can send any request; there is no authentication layer to enable.
- **[22.2 WebSocket Origin Checking Is Disabled by Default and Undocumented](../findings/22-security-and-isolation.md#222-websocket-origin-checking-is-disabled-by-default-and-undocumented)** — Origin validation is controlled by undocumented environment variables; cross-origin access is unrestricted by default.
- **[22.3 No Multi-Tenancy — One Workspace, One User Namespace](../findings/22-security-and-isolation.md#223-no-multi-tenancy--one-workspace-one-user-namespace)** — Different `user_id` values share the same memory and session list; building a multi-user product requires running one instance per user.

### §23 · Integration & Local Development

- **[23.1 Custom Channel API Exists But Has No Developer Guide](../findings/23-integration-and-local-development.md#231-custom-channel-api-exists-but-has-no-developer-guide)** — The `BaseChannel` interface is clean and has 11 reference implementations, but the registration mechanism and lifecycle contract are undocumented.
- **[23.2 Webhook/Event Notification System Is Limited](../findings/23-integration-and-local-development.md#232-webhookevent-notification-system-is-limited)** — No native webhook target type, no retry, no HMAC signature, no event for task completion; shell `curl` workaround is the only option.
- **[23.3 No Local Development Mode](../findings/23-integration-and-local-development.md#233-no-local-development-mode)** — Testing requires the full real stack; there is no stub gateway, no canned-response mode, no Docker Compose for CI.

---
