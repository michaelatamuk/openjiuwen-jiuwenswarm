[← Index](../README.md) · jiuwenswarm Usability Review

---

# P4 — Application Developer

*The engineer building their own product, app, or service on top of jiuwenswarm as a backend.*

This audience is distinct from the extension developer in §P3 (who works inside the jiuwenswarm
codebase, writing rails and tools). The application developer treats jiuwenswarm as a black
box: they stand it up, connect to it over a network, and build their own frontend, workflow,
or integration on top of it. Their only contact with jiuwenswarm is the external API it
exposes.

---

## Findings

> *The findings in this file are symptoms of a single systemic issue. [Read the root cause →](../findings/00-overview.md)*

*11 findings across 2 concern areas.*

### §8 · Notification & Async

- **[8.1 No Notification When Long-Running Tasks Complete](../findings/08-async-notifications.md#81-no-notification-when-long-running-tasks-complete)** — There is no server-side push notification for task completion; a server-side app must hold a WebSocket open for the full task duration.

### §18 · Application Developer Usability

- **[18.1 The Primary API Is WebSocket-Only — No REST Fallback](../findings/18-app-developer.md#181-the-primary-api-is-websocket-only--no-rest-fallback)** — Every operation requires a persistent WebSocket and E2A envelope; one-shot automation use cases have no simpler path.
- **[18.2 E2A Protocol Is Documented in Markdown, Not in a Machine-Readable Format](../findings/18-app-developer.md#182-e2a-protocol-is-documented-in-markdown-not-in-a-machine-readable-format)** — No JSON Schema, AsyncAPI spec, or generated type stubs exist; developers cross-reference Markdown prose against source dataclasses.
- **[18.3 No Published Client SDK — Every App Reimplements the Protocol](../findings/18-app-developer.md#183-no-published-client-sdk--every-app-reimplements-the-protocol)** — No PyPI package, no npm package; every integration starts from scratch implementing WebSocket and E2A.
- **[18.4 Authentication Has No Enforcement — APIs Are Open by Default](../findings/18-app-developer.md#184-authentication-has-no-enforcement--apis-are-open-by-default)** — Anyone who can reach the WebSocket port can send any request; there is no authentication layer to enable.
- **[18.5 WebSocket Origin Checking Is Disabled by Default and Undocumented](../findings/18-app-developer.md#185-websocket-origin-checking-is-disabled-by-default-and-undocumented)** — Origin validation is controlled by undocumented environment variables; cross-origin access is unrestricted by default.
- **[18.6 No Multi-Tenancy — One Workspace, One User Namespace](../findings/18-app-developer.md#186-no-multi-tenancy--one-workspace-one-user-namespace)** — Different `user_id` values share the same memory and session list; building a multi-user product requires running one instance per user.
- **[18.7 Custom Channel API Exists But Has No Developer Guide](../findings/18-app-developer.md#187-custom-channel-api-exists-but-has-no-developer-guide)** — The `BaseChannel` interface is clean and has 11 reference implementations, but the registration mechanism and lifecycle contract are undocumented.
- **[18.8 Webhook/Event Notification System Is Limited](../findings/18-app-developer.md#188-webhookevent-notification-system-is-limited)** — No native webhook target type, no retry, no HMAC signature, no event for task completion; shell `curl` workaround is the only option.
- **[18.9 Session API Is Full-Featured But Has No Documented Response Shapes](../findings/18-app-developer.md#189-session-api-is-full-featured-but-has-no-documented-response-shapes)** — ~30 E2A methods have no request/response schema document; developers read source to discover field names.
- **[18.10 No Local Development Mode for Application Developers](../findings/18-app-developer.md#1810-no-local-development-mode-for-application-developers)** — Testing requires the full real stack; there is no stub gateway, no canned-response mode, no Docker Compose for CI.

## Summary

The E2A protocol is well-designed internally: it has a consistent envelope format, a clean
method namespace, streaming support, and a full session lifecycle. The problem is the same
as section 17 — it is implemented, not published. An application developer looking at
jiuwenswarm from the outside sees a WebSocket port, a Markdown file, and no SDK.

**The five changes that unblock application developers fastest:**

1. **Publish `jiuwenswarm-client` on PyPI and npm.** Wrap E2A in a clean Python and
   TypeScript SDK. Remove the protocol implementation barrier entirely. Without this,
   every integration starts with "implement WebSocket + E2A from scratch."

2. **Add a REST HTTP API wrapper for single-shot use cases.** `POST /api/chat` with a
   JSON body. No WebSocket required. Covers 80% of automation and scripting use cases.

3. **Publish an AsyncAPI spec for E2A.** Machine-readable protocol definition. Enables
   auto-generated clients, auto-generated docs, and prevents spec drift.

4. **Add API key authentication with config.yaml support.** One configurable field
   that enables `mode: api_key`. Makes jiuwenswarm deployable in any environment, not
   just localhost.

5. **Add user-scoped session isolation.** Route `session.list`, session memory, and
   session history through `user_id`. Unblocks every multi-user product built on top
   of jiuwenswarm.
