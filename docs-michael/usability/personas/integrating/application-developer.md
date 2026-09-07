[← Index](../../README.md) · jiuwenswarm Usability Review

---

# Application Developer

*The engineer building their own product on top of JiuwenSwarm over the E2A/WebSocket (or ACP) API.*

## Findings that matter to them

*10 findings.*

### Identity & Isolation

- **[No multi-tenancy: every user shares one workspace](../../findings/collaboration/identity-and-isolation.md#2-no-multi-tenancy-every-user-shares-one-workspace)**

### Integration & Local Development

- **[Writing a custom channel has no developer guide](../../findings/application-api/integration-and-local-development.md#1-writing-a-custom-channel-has-no-developer-guide)**
- **[Only shell-command hooks exist; there's no real webhook delivery](../../findings/application-api/integration-and-local-development.md#2-only-shell-command-hooks-exist-theres-no-real-webhook-delivery)**
- **[No local stub or dev mode for testing integrations](../../findings/application-api/integration-and-local-development.md#3-no-local-stub-or-dev-mode-for-testing-integrations)**

### Connection Security

- **[The API has no authentication and is open by default](../../findings/application-api/security-and-isolation.md#1-the-api-has-no-authentication-and-is-open-by-default)**
- **[WebSocket origin checks are off by default and undocumented](../../findings/application-api/security-and-isolation.md#2-websocket-origin-checks-are-off-by-default-and-undocumented)**

### Transport & Protocol

- **[External apps can only reach the agent over WebSocket, with no REST](../../findings/application-api/transport-and-protocol.md#1-external-apps-can-only-reach-the-agent-over-websocket-with-no-rest)**
- **[The E2A protocol spec is prose, not a machine-readable schema](../../findings/application-api/transport-and-protocol.md#2-the-e2a-protocol-spec-is-prose-not-a-machine-readable-schema)**
- **[No published client SDK, so every app re-implements the protocol](../../findings/application-api/transport-and-protocol.md#3-no-published-client-sdk-so-every-app-re-implements-the-protocol)**
- **[Session API methods have no documented response shapes](../../findings/application-api/transport-and-protocol.md#4-session-api-methods-have-no-documented-response-shapes)**
