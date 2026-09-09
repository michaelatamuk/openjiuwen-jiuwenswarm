# Product Builder

*The on-top builder: installs a ready jiuwenswarm (or its SDK) and builds their own product that uses jiuwenswarm as its backend over the E2A/WebSocket (or ACP) API.*

## Findings that matter to them

*13 findings.*

### Connection & Security

- **[No API authentication: fine locally, a real risk once exposed](findings/security-and-isolation/1-no-api-authentication-fine-locally-a-risk-once-exposed.md)**
- **[WebSocket origin checks are off by default and undocumented](findings/security-and-isolation/2-websocket-origin-checks-are-off-by-default-and-undocumented.md)**

- **[No single answer to what a gateway can reach](findings/security-and-isolation/gateway-blast-radius-unstated.md)**
### Transport & Protocol

- **[External apps can only reach the agent over WebSocket, with no REST](findings/transport-and-protocol/1-external-apps-can-only-reach-the-agent-over-websocket-with-no-rest.md)**
- **[The E2A protocol spec is prose, not a machine-readable schema](findings/transport-and-protocol/2-the-e2a-protocol-spec-is-prose-not-a-machine-readable-schema.md)**
- **[No published client SDK, so every app re-implements the protocol](findings/transport-and-protocol/3-no-published-client-sdk-so-every-app-re-implements-the-protocol.md)**
- **[Session API methods have no documented response shapes](findings/transport-and-protocol/4-session-api-methods-have-no-documented-response-shapes.md)**

### Integration & Tooling

- **[Only shell-command hooks exist; there's no real webhook delivery](findings/integration-and-tooling/2-only-shell-command-hooks-exist-theres-no-real-webhook-delivery.md)**
- **[No local stub or dev mode for testing integrations](findings/integration-and-tooling/3-no-local-stub-or-dev-mode-for-testing-integrations.md)**

- **[No migration/import path from an existing agent setup](findings/integration-and-tooling/no-migration-path-in.md)**
- **[Browser runs stop at a blocker with nowhere to go](findings/integration-and-tooling/browser-blocker-no-human-handoff.md)**
- **[The SDK has no reference cron backend](findings/integration-and-tooling/sdk-no-reference-cron-backend.md)**
### Observability

*No findings yet.*



### Documentation

- **[Headline capabilities ship undocumented](findings/documentation/headline-capabilities-undocumented.md)**