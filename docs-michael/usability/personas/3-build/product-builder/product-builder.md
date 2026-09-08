# Product Builder

*The on-top builder: installs a ready jiuwenswarm (or its SDK) and builds their own product that uses jiuwenswarm as its backend over the E2A/WebSocket (or ACP) API.*

## Findings that matter to them

*8 findings.*

### Connection & Security

- **[No API authentication: fine locally, a real risk once exposed](findings/security-and-isolation/1-no-api-authentication-fine-locally-a-risk-once-exposed.md)**
- **[WebSocket origin checks are off by default and undocumented](findings/security-and-isolation/2-websocket-origin-checks-are-off-by-default-and-undocumented.md)**

### Transport & Protocol

- **[External apps can only reach the agent over WebSocket, with no REST](findings/transport-and-protocol/1-external-apps-can-only-reach-the-agent-over-websocket-with-no-rest.md)**
- **[The E2A protocol spec is prose, not a machine-readable schema](findings/transport-and-protocol/2-the-e2a-protocol-spec-is-prose-not-a-machine-readable-schema.md)**
- **[No published client SDK, so every app re-implements the protocol](findings/transport-and-protocol/3-no-published-client-sdk-so-every-app-re-implements-the-protocol.md)**
- **[Session API methods have no documented response shapes](findings/transport-and-protocol/4-session-api-methods-have-no-documented-response-shapes.md)**

### Integration & Tooling

- **[Only shell-command hooks exist; there's no real webhook delivery](findings/integration-and-tooling/2-only-shell-command-hooks-exist-theres-no-real-webhook-delivery.md)**
- **[No local stub or dev mode for testing integrations](findings/integration-and-tooling/3-no-local-stub-or-dev-mode-for-testing-integrations.md)**

### Observability

*No findings yet.*
