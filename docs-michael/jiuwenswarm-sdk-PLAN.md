# Development Plan — JiuwenSwarm SDK

**Architecture reference:** `jiuwenswarm-sdk-SIG.md`
**Requirements reference:** `jiuwenswarm-sdk-RAT.md`

Four phases from a clean public API boundary to a published TypeScript package
and a documented REST+WebSocket gateway. Each phase has an explicit scope,
ordered task list, and done criteria.

---

## Phase 0 — Prerequisites: Stabilize the Python Public API

Must be complete before any SDK façade or gateway code is written.
The goal is to know exactly what the public API is, so the façade doesn't
have to guess about internal interfaces.

### 0.1 Audit and define public exports

| Task | File | Done when |
|---|---|---|
| List all classes and functions currently used by harness entrypoints (`cli.py`, `factory.py`, `deep_agent.py`) | — (manual audit) | A written list of every internal symbol the façade will need to call |
| Add explicit public exports to `openjiuwen/core/__init__.py` | `openjiuwen/core/__init__.py` | `from openjiuwen.core import AgentCard, ToolCard, Runner, Session` works |
| Add explicit public exports to `openjiuwen/harness/__init__.py` | `openjiuwen/harness/__init__.py` | `from openjiuwen.harness import DeepAgent, DeepAgentConfig, create_deep_agent` works |
| Mark remaining internal symbols with leading underscore or `__all__` exclusion | changed `__init__.py` files | `mypy --strict` does not expose internal classes through public import paths |

### 0.2 Error hierarchy

| Task | File | Done when |
|---|---|---|
| Create `openjiuwen/sdk/errors.py` with `SdkError` hierarchy | `openjiuwen/sdk/errors.py` | All six exception classes (`ConnectionError`, `AuthError`, `SessionNotFoundError`, `ToolError`, `TimeoutError`, `ProtocolError`) importable from `openjiuwen.sdk` |

### 0.3 `SdkConfig` and environment loading

| Task | File | Done when |
|---|---|---|
| Create `openjiuwen/sdk/config.py` with `SdkConfig` dataclass | `openjiuwen/sdk/config.py` | `SdkConfig.from_env()` reads `JIUWENSWARM_URL`, `JIUWENSWARM_TOKEN`, `JIUWENSWARM_MODEL` |
| Unit test env loading | `tests/unit_tests/sdk/test_config.py` | All env-var paths covered |

**Phase 0 done when:** `from openjiuwen.sdk import SdkConfig, SdkError` works;
`mypy --strict openjiuwen/sdk/` passes; unit tests pass.

---

## Phase 1 — Python SDK: Agent, Session, Tool Façades

**Goal:** A Python developer can install the package, write 10 lines of code,
and get a streaming agent response. No gateway or TypeScript yet.

### Step 1 — EventEmitter mixin

| Task | File | Done when |
|---|---|---|
| Create `openjiuwen/sdk/events.py` with typed `EventEmitter` | `openjiuwen/sdk/events.py` | `emitter.on("token", cb)`, `.off(...)`, `.emit("token", "text")` work; `cb` receives correct args |
| Unit tests | `tests/unit_tests/sdk/test_events.py` | Register, fire, remove, multiple listeners, unknown events all tested |

### Step 2 — `_RunnerBridge` (internal adapter)

| Task | File | Done when |
|---|---|---|
| Create `openjiuwen/sdk/_internal/runner_bridge.py` | `openjiuwen/sdk/_internal/runner_bridge.py` | `bridge.run(prompt, session_id)` calls `Runner` and returns `AgentResult`; `bridge.stream(prompt, session_id)` returns `AsyncIterator[str]` |
| Create `openjiuwen/sdk/_internal/session_bridge.py` | `openjiuwen/sdk/_internal/session_bridge.py` | `session_bridge.list()`, `.create(title, mode)`, `.get(id)`, `.delete(id)` call the real session manager |

### Step 3 — `Agent` façade

| Task | File | Done when |
|---|---|---|
| Create `Agent` class with `create()`, `run()`, `stream()`, `on()`, `off()` | `openjiuwen/sdk/agent.py` | `async for token in agent.stream("hello"):` yields strings |
| `checkpoint()` and `restore()` | `openjiuwen/sdk/agent.py` | Checkpoint returns an opaque string ID; `restore(id)` recreates agent with same session |
| Sync wrapper `run_sync()` | `openjiuwen/sdk/_internal/sync_wrapper.py` | `agent.run_sync("hello")` works without caller managing event loop; raises `RuntimeError` if called from within a running loop |
| Unit tests (mocked bridge) | `tests/unit_tests/sdk/test_agent.py` | run, stream, events, checkpoint, run_sync |

### Step 4 — `Session` façade

| Task | File | Done when |
|---|---|---|
| Create `Session` class with `create()`, `list()`, `get()`, `delete()`, `history()` | `openjiuwen/sdk/session.py` | All five methods return typed dataclasses (`SessionInfo`, `ChatMessage`) |
| Unit tests | `tests/unit_tests/sdk/test_session.py` | All CRUD paths; `history()` returns ordered messages |

### Step 5 — `@tool` decorator

| Task | File | Done when |
|---|---|---|
| Create `@sdk.tool` decorator in `openjiuwen/sdk/tools.py` | `openjiuwen/sdk/tools.py` | Decorating an async function with `@sdk.tool(name=..., description=...)` registers it in the global tool registry; the agent picks it up via `Agent.create(tools=[fetch_url])` |
| Unit tests | `tests/unit_tests/sdk/test_tools.py` | Tool registers, agent receives it; invalid function signatures raise `SdkError` at decoration time |

### Step 6 — `__init__.py` and packaging

| Task | File | Done when |
|---|---|---|
| Re-export public symbols from `openjiuwen/sdk/__init__.py` | `openjiuwen/sdk/__init__.py` | `from openjiuwen.sdk import Agent, Session, tool, SdkConfig, SdkError` all work |
| Update `pyproject.toml` | `pyproject.toml` | `openjiuwen-sdk` is an installable distribution (or `openjiuwen[sdk]` extra); `pip install -e ".[sdk]"` succeeds |
| First-run example script | `examples/sdk/hello_agent.py` | Running the script with a live local server produces a streaming response (< 15 lines of code) |

**Phase 1 done when:**
- `examples/sdk/hello_agent.py` runs against a local server and streams a response
- `make type-check` passes for `openjiuwen/sdk/`
- All unit tests in `tests/unit_tests/sdk/` pass
- A developer with zero knowledge of `openjiuwen.core` internals can use the API from the docstrings alone

---

## Phase 2 — Team Façade + System Tests

**Goal:** The SDK exposes multi-agent team creation so developers can orchestrate
agent swarms from Python.

### Step 1 — `Team` façade

| Task | File | Done when |
|---|---|---|
| Create `Team` class with `create()`, `spawn()`, `send()`, `status()` | `openjiuwen/sdk/team.py` | `await Team.create()` returns a `Team`; `await team.spawn("task")` returns `TeamResult` |
| `TeamResult` and `TeamStatus` dataclasses | `openjiuwen/sdk/team.py` | Both are frozen dataclasses with typed fields; no internal classes exposed |
| Unit tests (mocked team runtime) | `tests/unit_tests/sdk/test_team.py` | create, spawn, send, status all tested |

### Step 2 — System tests

| Task | File | Done when |
|---|---|---|
| Integration test: connect, create session, stream response | `tests/system_tests/sdk/test_agent_stream.py` | Against a real local server; test is marked `@pytest.mark.system` and skipped in CI |
| Integration test: custom tool invoked by agent | `tests/system_tests/sdk/test_custom_tool.py` | Agent calls the registered tool and returns its result in the final response |
| Integration test: session persistence (create, send, history) | `tests/system_tests/sdk/test_session.py` | Session history returns the correct messages after a chat exchange |

**Phase 2 done when:**
- All Phase 1 criteria still hold
- `Team` façade unit tests pass
- System tests pass manually against a local server (not required in CI)
- `examples/sdk/hello_team.py` demonstrates team spawn in under 20 lines

---

## Phase 3 — HTTP REST + WebSocket Gateway

**Goal:** Any developer, in any language, can call JiuwenSwarm via `curl` or
a standard HTTP client. The gateway also consolidates the WebSocket protocol
into a versioned, documented endpoint.

### Step 1 — Auth middleware

| Task | File | Done when |
|---|---|---|
| `openjiuwen/gateway/auth.py` — Bearer token middleware | `openjiuwen/gateway/auth.py` | Requests without a valid token return 401 when auth is enabled; middleware is a no-op when `auth_token = None` |
| Unit tests | `tests/unit_tests/gateway/test_auth.py` | Valid token passes; invalid token returns 401; disabled auth passes all requests |

### Step 2 — REST routes

| Task | File | Done when |
|---|---|---|
| `/v1/health` | `openjiuwen/gateway/rest/health.py` | Returns `{status: "ok", version: "...", protocol_version: "1"}` |
| `/v1/sessions` CRUD | `openjiuwen/gateway/rest/sessions.py` | All four endpoints work; test with `httpx.AsyncClient` |
| `/v1/sessions/{id}/chat` (blocking) | `openjiuwen/gateway/rest/sessions.py` | Returns full response as JSON; agent completes before HTTP response |
| `/v1/sessions/{id}/chat/stream` (SSE) | `openjiuwen/gateway/rest/sessions.py` | Returns `text/event-stream`; sends `event: token` lines as agent produces tokens; ends with `event: done` |
| `/v1/agents` list + run + stream | `openjiuwen/gateway/rest/agents.py` | Agent list returns registered agents; run and stream work like session chat |
| `/v1/tools` list | `openjiuwen/gateway/rest/tools.py` | Returns all registered tools with name and description |
| Unit tests for all routes | `tests/unit_tests/gateway/` | Each route tested with mocked runtime bridge |

### Step 3 — WebSocket gateway

| Task | File | Done when |
|---|---|---|
| `/v1/ws` handler — envelope parsing | `openjiuwen/gateway/ws/router.py` | Accepts WS connection; parses JSON envelopes; dispatches to runtime |
| Version field in `ack` | `openjiuwen/gateway/ws/dispatcher.py` | `ack` payload includes `{"protocol_version": "1"}` |
| `client_type` forwarding | `openjiuwen/gateway/ws/dispatcher.py` | `connect` envelope with `client_type` is stored and passed to agent context |
| Existing clients connect to `/v1/ws` | manual test | Browser extension and mobile app connect to versioned WS path; `ack` received; chat works |

### Step 4 — FastAPI app assembly + server entrypoint

| Task | File | Done when |
|---|---|---|
| `build_gateway_app()` function | `openjiuwen/gateway/app.py` | Returns a FastAPI app with all routes mounted; accepts `GatewayConfig` |
| `--gateway` flag or standalone `python -m openjiuwen.gateway` | `openjiuwen/gateway/__main__.py` | `python -m openjiuwen.gateway --host 0.0.0.0 --port 19001` starts the gateway on a separate port (or same port as WS) |
| OpenAPI spec accessible at `/docs` | — (FastAPI default) | `curl http://localhost:19001/docs` returns Swagger UI HTML |
| `examples/sdk/rest_curl.sh` | `examples/sdk/rest_curl.sh` | A shell script showing `curl` examples for all major endpoints |

**Phase 3 done when:**
- `python -m openjiuwen.gateway` starts without errors
- All REST routes respond correctly (manual smoke test + unit tests)
- `/docs` shows a complete OpenAPI spec
- An existing browser extension client connects to `/v1/ws` and chat works
- `examples/sdk/rest_curl.sh` runs successfully against a local server

---

## Phase 4 — TypeScript / JavaScript SDK

**Goal:** Web and mobile developers can `npm install @jiuwenswarm/sdk` and get
the same ergonomic experience as the Python SDK. The existing browser extension
and mobile app can optionally migrate to this package.

### Step 1 — Project setup

| Task | File | Done when |
|---|---|---|
| Create `packages/sdk/` directory with `package.json`, `tsconfig.json` | `packages/sdk/` | `npm install` in `packages/sdk/` succeeds |
| Configure `tsup` for dual CJS + ESM output | `packages/sdk/tsup.config.ts` | `npm run build` produces `dist/index.cjs`, `dist/index.mjs`, `dist/index.d.ts` |
| Configure `vitest` | `packages/sdk/vitest.config.ts` | `npm test` runs and exits cleanly (no test files yet) |

### Step 2 — Protocol types and constants

| Task | File | Done when |
|---|---|---|
| `src/protocol/types.ts` | `packages/sdk/src/protocol/types.ts` | `InboundEnvelope`, `OutboundEnvelope`, `SessionInfo`, `AgentMode`, `ChatMessage` typed; mirrors server protocol exactly |
| `src/protocol/constants.ts` | `packages/sdk/src/protocol/constants.ts` | `MSG` object with all envelope type strings |
| `src/protocol/validate.ts` | `packages/sdk/src/protocol/validate.ts` | `parseEnvelope(raw)` returns typed envelope or throws `ProtocolError` |
| Unit tests | `packages/sdk/tests/protocol.test.ts` | Valid and invalid JSON payloads all covered |

### Step 3 — EventEmitter

| Task | File | Done when |
|---|---|---|
| `src/events/EventEmitter.ts` — typed, no Node.js dep | `packages/sdk/src/events/EventEmitter.ts` | `emitter.on("token", cb)`, `.off(...)`, `.emit("token", "text")` work in browser and Node |
| Unit tests | `packages/sdk/tests/emitter.test.ts` | Register, fire, remove, multiple listeners |

### Step 4 — Reconnect logic

| Task | File | Done when |
|---|---|---|
| `src/client/reconnect.ts` — delay sequence 1→2→5→10→30 s | `packages/sdk/src/client/reconnect.ts` | `ReconnectScheduler` tracks attempts, computes delays, calls back at the right time; `cancel()` stops it |
| Unit tests | `packages/sdk/tests/reconnect.test.ts` | Delay sequence verified; cancel stops further callbacks |

### Step 5 — `JiuwenSwarmClient`

| Task | File | Done when |
|---|---|---|
| Core `connect()` / `disconnect()` | `packages/sdk/src/client/JiuwenSwarmClient.ts` | Opens WebSocket; sends `ack` on open; parses incoming envelopes; dispatches events |
| `send(message, options?)` | `packages/sdk/src/client/JiuwenSwarmClient.ts` | Sends `chat` envelope; `token` events fire during streaming; `done` fires at end |
| `sendEnvelope(type, payload)` | `packages/sdk/src/client/JiuwenSwarmClient.ts` | Low-level send; serializes to JSON |
| `tool_call` auto-rejection | `packages/sdk/src/client/JiuwenSwarmClient.ts` | Any `tool_call` envelope triggers immediate `tool_result {error: "not supported"}` response |
| Node.js / browser / React Native detection | `packages/sdk/src/client/JiuwenSwarmClient.ts` | Uses native `WebSocket` if available; falls back to `ws` package if present; throws `ConnectionError` if neither |
| Unit tests (mock WebSocket) | `packages/sdk/tests/client.test.ts` | connect, send, token/done events, tool_call rejection, reconnect on close |

### Step 6 — `SessionManager`

| Task | File | Done when |
|---|---|---|
| `src/session/SessionManager.ts` | `packages/sdk/src/session/SessionManager.ts` | `list()`, `create()`, `setActive()`, `refresh()`, `active` getter all work; sessions populated from `sessions` envelope |
| Unit tests | `packages/sdk/tests/session.test.ts` | All methods; active session persists across refresh |

### Step 7 — Barrel export and docs

| Task | File | Done when |
|---|---|---|
| `src/index.ts` — re-export all public symbols | `packages/sdk/src/index.ts` | `import { JiuwenSwarmClient, SessionManager } from "@jiuwenswarm/sdk"` resolves correctly in both CJS and ESM |
| TypeDoc configuration | `packages/sdk/typedoc.json` | `npm run docs` generates HTML reference in `packages/sdk/docs/` |
| `examples/sdk/hello_client.ts` | `examples/sdk/hello_client.ts` | Script connects to local server, creates session, streams a response, disconnects — under 20 lines |
| `examples/sdk/react_hook.tsx` | `examples/sdk/react_hook.tsx` | A minimal React hook example using the client |

### Step 8 — npm publish

| Task | File | Done when |
|---|---|---|
| Set `publishConfig` in `package.json` | `packages/sdk/package.json` | `npm publish --dry-run` shows correct package contents (dist/, README, no src/) |
| Add `README.md` to `packages/sdk/` | `packages/sdk/README.md` | Quick-start section with 3 code examples (connect, stream, custom events) |
| Publish `0.1.0` to npm (or private registry) | — | `npm install @jiuwenswarm/sdk` works from a fresh project |

**Phase 4 done when:**
- `npm install @jiuwenswarm/sdk` works
- `examples/sdk/hello_client.ts` runs with `ts-node` against a local server
- All vitest unit tests pass
- TypeDoc generates a reference without errors

---

## Explicit Deferrals

These are in the RAT/SIG but intentionally out of scope for the four phases above:

| Feature | Reason deferred |
|---|---|
| Migrating browser extension to `@jiuwenswarm/sdk` | Extension works; migration is additive polish for v2 |
| Migrating mobile app to `@jiuwenswarm/sdk` | Same reason; protocol duplication is acceptable for v1 |
| Go / Rust / Java SDK | REST API covers these languages adequately for v1 |
| SDK dashboard / usage analytics | Requires hosted mode |
| Rate limiting and per-token quotas in gateway | Requires hosted mode and multi-tenant auth |
| MCP wrapper in Python SDK | MCP is team-coordination only; not a priority for SDK audience |
| Webhooks (async result delivery) | Requires hosted mode; SSE is sufficient for v1 |

---

## Dependency Graph (phases)

```
Phase 0 (stabilize Python public API)
    │
    ▼
Phase 1 (Python SDK: Agent, Session, Tool)
    │
    ├──► Phase 2 (Team façade + system tests)   ← can overlap with Phase 3
    │
    └──► Phase 3 (HTTP REST + WebSocket gateway)
              │
              ▼
         Phase 4 (TypeScript SDK)   ← depends on Phase 3 for the WS protocol spec
```

Phase 2 and Phase 3 are independent of each other once Phase 1 is done and can
be worked in parallel. Phase 4 depends on Phase 3 being stable (the TypeScript
SDK talks to the versioned WebSocket endpoint).
