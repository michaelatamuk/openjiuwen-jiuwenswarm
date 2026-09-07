[← Index](../README.md) · jiuwenswarm Usability Review

---

# §21 · Transport & Protocol

*How an application connects to jiuwenswarm and talks to the agent.*

---

## 21.1 The Primary API Is WebSocket-Only — No REST Fallback

**Current state.**
jiuwenswarm's external interface is the E2A (Everything-to-Agent) protocol, carried over
WebSocket. There is no HTTP REST API. Every operation — sending a chat message, listing
sessions, fetching history, uploading a file — requires a persistent WebSocket connection
and the E2A envelope format:

```json
{
  "protocol_version": "1.0",
  "request_id": "abc123",
  "session_id": "sess_xyz",
  "method": "chat.send",
  "params": { "content": "Parse this invoice" },
  "channel": "web",
  "user_id": "user_001",
  "timestamp": "2026-09-06T10:00:00Z",
  "is_stream": true
}
```

For an application developer whose stack is REST-native (mobile app, server-side script,
simple automation), this is a barrier. Maintaining a WebSocket connection requires async
infrastructure, reconnection logic, and stream multiplexing. A one-shot "send a message
and wait for reply" use case requires the same WebSocket machinery as a real-time chat UI.

**What good looks like.**
A thin HTTP REST wrapper that covers the most common single-shot use cases:

```
POST /api/chat     { session_id, message }  → { response_text, session_id }
GET  /api/sessions                          → [ { id, name, updated_at } ]
GET  /api/sessions/:id/history              → [ { role, content, timestamp } ]
```

The WebSocket API remains for streaming and real-time use. The REST API is a convenience
layer for integrations that don't need streaming. Under the hood, the gateway translates
REST requests into E2A envelopes and returns the final response.

---

## 21.2 E2A Protocol Is Documented in Markdown, Not in a Machine-Readable Format

**Current state.**
The E2A protocol specification lives in two Markdown files:
- `docs/en/E2A-protocol.md`
- `docs/zh/E2A-protocol.md`

These describe the envelope fields and method names in prose. There is no:
- JSON Schema for the `E2AEnvelope` or `E2AResponse` structures
- OpenAPI/AsyncAPI specification
- Generated type stubs (`e2a.d.ts`, `e2a.pyi`)
- Protobuf or MessagePack schema

An application developer implementing an E2A client must manually read the Markdown doc,
then cross-reference the actual dataclass in `jiuwenswarm/common/e2a/models.py` to get the
true field names and types. When the protocol changes, there is no version diff or
structured changelog for the envelope format.

The `ReqMethod` enum (all valid method names like `chat.send`, `session.create`, etc.) is
defined in `jiuwenswarm/common/e2a/constants.py` — source code only, not surfaced anywhere
for consumers.

**What good looks like.**
An AsyncAPI 3.0 specification file (`docs/api/e2a-asyncapi.yaml`) that fully describes:
- All WebSocket message schemas (request and response)
- All method names with their params and response shapes
- Error codes and their meanings
- The streaming response protocol (how chunks relate to a single request)

This file can be used to auto-generate client SDKs in any language via AsyncAPI generators.
It is also the ground truth that prevents spec-code drift.

---

## 21.3 No Published Client SDK — Every App Reimplements the Protocol

**Current state.**
A `WebSocketAgentServerClient` class exists in:
```
jiuwenswarm/gateway/routing/agent_client.py
```

It is the internal client the gateway uses to talk to the agent server. It handles envelope
serialization, response deserialization, and streaming chunking. But it is:
- An internal class, not exported as a public package
- Written for gateway-to-agentserver communication, not for external-app-to-gateway
- Not documented, not versioned, not published to PyPI

An external Python developer must either copy this class into their project (fragile) or
implement E2A from scratch (duplicated effort). A JavaScript/TypeScript developer has no
reference implementation at all — only the Markdown spec and the web frontend's ad-hoc
WebSocket usage in `hooks/useWebSocket.ts`.

**What good looks like.**
A published `jiuwenswarm-client` package on PyPI:

```python
from jiuwenswarm_client import JiuwenswarmClient, ChatSession

client = JiuwenswarmClient("ws://localhost:19000/ws")
session = await client.session.create(name="my task")

async for chunk in session.chat("Parse this invoice"):
    print(chunk.text, end="", flush=True)
```

And a TypeScript/JavaScript equivalent (`@jiuwenswarm/client` on npm):

```typescript
import { JiuwenswarmClient } from "@jiuwenswarm/client";

const client = new JiuwenswarmClient("ws://localhost:19000/ws");
const session = await client.sessions.create({ name: "my task" });

for await (const chunk of session.chat("Parse this invoice")) {
  process.stdout.write(chunk.text);
}
```

Both packages generated from the AsyncAPI spec (see 21.2), so they stay in sync with the
protocol automatically.

---

## 21.4 Session API Is Full-Featured But Has No Documented Response Shapes

**Current state.**
The E2A protocol supports a complete session lifecycle:
`session.create`, `session.list`, `session.switch`, `session.rename`, `session.fork`,
`session.delete`, `session.get_metadata`, `session.pin`, `session.color_set`.

But the response shape for each method is nowhere documented outside the server source code.
A developer calling `session.create` does not know that the response `data` contains
`session_id`, `created_at`, `project_id`, and `mode` until they either read
`session_metadata.py` or inspect a live response. There is no request/response schema
document for any of the ~30 E2A methods.

This is the difference between an API that is *implemented* and an API that is *published*.

**What good looks like.**
A method reference document (or AsyncAPI spec — see 21.2) listing every method with its
request params and response data shape:

```
session.create
  Request params:
    name: string (optional) — display name for the session
    project_id: string (optional, default "default")
    mode: "work" | "code" (optional, default "work")
  Response data:
    session_id: string
    name: string
    project_id: string
    mode: string
    created_at: ISO 8601 timestamp
```

30 methods × ~5 fields each = a half-day of documentation that eliminates hours of source
reading for every application developer.

---
