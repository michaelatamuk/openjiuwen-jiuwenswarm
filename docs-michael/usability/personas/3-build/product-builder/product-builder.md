# Product Builder

*The on-top builder: installs a ready jiuwenswarm (or its SDK) and builds their own product that uses jiuwenswarm as its backend over the E2A/WebSocket (or ACP) API.*

## Findings that matter to them

*8 findings.*

### Integration & Local Development

- **[No local stub or dev mode for testing integrations](findings/application-api/integration-and-local-development/3-no-local-stub-or-dev-mode-for-testing-integrations.md)**
- **[Only shell-command hooks exist; there's no real webhook delivery](findings/application-api/integration-and-local-development/2-only-shell-command-hooks-exist-theres-no-real-webhook-delivery.md)**
### Connection Security

- **[No API authentication: fine locally, a real risk once exposed](findings/application-api/security-and-isolation/1-no-api-authentication-fine-locally-a-risk-once-exposed.md)**
- **[WebSocket origin checks are off by default and undocumented](findings/application-api/security-and-isolation/2-websocket-origin-checks-are-off-by-default-and-undocumented.md)**
### Transport & Protocol

- **[External apps can only reach the agent over WebSocket, with no REST](findings/application-api/transport-and-protocol/1-external-apps-can-only-reach-the-agent-over-websocket-with-no-rest.md)**
- **[No published client SDK, so every app re-implements the protocol](findings/application-api/transport-and-protocol/3-no-published-client-sdk-so-every-app-re-implements-the-protocol.md)**
- **[Session API methods have no documented response shapes](findings/application-api/transport-and-protocol/4-session-api-methods-have-no-documented-response-shapes.md)**
- **[The E2A protocol spec is prose, not a machine-readable schema](findings/application-api/transport-and-protocol/2-the-e2a-protocol-spec-is-prose-not-a-machine-readable-schema.md)**
