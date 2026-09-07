[← Index](README.md) · jiuwenswarm Usability Review

---

# P4 — Application Developer

*The engineer building their own product, app, or service on top of jiuwenswarm as a backend.*

This audience is distinct from the extension developer in §P3 (who works inside the jiuwenswarm
codebase, writing rails and tools). The application developer treats jiuwenswarm as a black
box: they stand it up, connect to it over a network, and build their own frontend, workflow,
or integration on top of it. Their only contact with jiuwenswarm is the external API it
exposes.

---

## §8 · Async Task Notifications

*How application developers receive signals when long-running tasks complete.*

### 8.1 No Server-Side Task Completion Notification

**Current state.**
For tasks that run for minutes, there is no server-side mechanism to notify an
application when the task completes. The only notification mechanisms are browser-side
(Web Notifications API, tab badge) — which require the browser tab to be open. A
server-side application or automation script has no push notification to listen for
without keeping a WebSocket connection open for the full duration of the task.

**What good looks like.**
A native webhook system where application developers configure a URL to receive
a POST request when a task completes:
```yaml
hooks:
  on_task_complete:
    - type: webhook
      url: "https://myapp.example.com/jiuwenswarm-events"
      secret: "whsec_abc123"
      retry: 3
```
This is covered in full in finding 18.8 (Webhook/Event Notification System Is Limited).
For application developers, the webhook approach is far preferable to polling or
holding a WebSocket connection open: it works with serverless functions, scales
independently, and doesn't require persistent connection management.

---

## §18 · Application Developer Usability

### 18.1 The Primary API Is WebSocket-Only — No REST Fallback

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

### 18.2 E2A Protocol Is Documented in Markdown, Not in a Machine-Readable Format

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

### 18.3 No Published Client SDK — Every App Reimplements the Protocol

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

Both packages generated from the AsyncAPI spec (see 18.2), so they stay in sync with the
protocol automatically.

---

### 18.4 Authentication Has No Enforcement — APIs Are Open by Default

**Current state.**
The `E2AAuth` structure exists in the protocol:

```python
# jiuwenswarm/common/e2a/models.py
@dataclass
class E2AAuth:
    method_id: str | None = None
    bearer_token: str | None = None
    api_key_ref: str | None = None
    credential_ref: str | None = None
    extra_headers: dict[str, str] = field(default_factory=dict)
```

However, this structure is carried through the protocol but not validated anywhere. Anyone
who can reach `ws://localhost:19000/ws` can connect and send any E2A request — no API key,
no token, no session secret is checked. Origin validation exists (`ws_origin.py`) but is
disabled by default.

For a local deployment, this is acceptable. For an application developer who exposes
jiuwenswarm to the internet (or even to a LAN with untrusted devices), there is no
authentication layer to enable. The only protection is network-level: don't expose the port.

**What good looks like.**
A configurable authentication gate at the gateway level:

```yaml
# config.yaml
gateway:
  auth:
    mode: none          # default — no auth, local use only
    # mode: api_key     — require X-API-Key header on WS upgrade
    # mode: bearer      — require Authorization: Bearer <token> on WS upgrade
    api_keys:
      - key: "sk-my-app-key-123"
        label: "My external app"
        scopes: ["chat", "session"]
```

Authentication should fail at WebSocket handshake time, not after the connection is
established. Unauthenticated connections should receive a 401 HTTP response during the
upgrade, not a connected-then-rejected response.

---

### 18.5 WebSocket Origin Checking Is Disabled by Default and Undocumented

**Current state.**
WebSocket origin validation is controlled by two environment variables:
- `JIUWENSWARM_ENABLE_ORIGIN_CHECK=1` — enables origin validation
- `JIUWENSWARM_WS_ALLOWED_ORIGIN_HOSTS=host1.com,host2.com` — sets the allowlist

These are not mentioned in `config.yaml`, not in the operator onboarding docs, not in any
Web UI settings panel. An operator deploying jiuwenswarm behind a reverse proxy and exposing
it to the internet does not know this mechanism exists.

By default, any browser page on any origin can connect to the WebSocket — an XSS attack
on any page served alongside jiuwenswarm would have unrestricted WebSocket access to the
agent.

**What good looks like.**
Origin configuration promoted to `config.yaml` as a first-class field:

```yaml
gateway:
  web_channel:
    allowed_origins:
      - "http://localhost:5173"
      - "https://myapp.example.com"
    # Empty list = block all cross-origin connections
    # Not set = allow all (with a startup WARNING printed)
```

A startup warning when `allowed_origins` is not configured and the server is not
bound to loopback: "⚠ WebSocket origin validation is disabled. Set
`gateway.web_channel.allowed_origins` to restrict access."

---

### 18.6 No Multi-Tenancy — One Workspace, One User Namespace

**Current state.**
jiuwenswarm is a single-workspace system. All sessions, memory, and skills belong to one
agent identity in `~/.jiuwenswarm/`. While the E2A protocol carries a `user_id` field, this
is used for logging and channel routing, not for data isolation. Two users calling the
same jiuwenswarm instance with different `user_id` values share the same memory, the same
installed skills, and can see each other's session list.

For an application developer building a multi-user product (a SaaS tool, a team assistant,
a customer-facing agent), this is a hard blocker. The only workaround is running a separate
jiuwenswarm instance per user — multiplying infrastructure cost and operational complexity.

**What good looks like.**
A `user_id`-scoped isolation layer:
- Sessions are scoped to `user_id`: user A cannot list or access user B's sessions.
- Memory is scoped to `user_id`: each user has their own `USER.md` and `MEMORY.md`.
- Installed skills are shared (system-level) or per-user depending on config.
- The `session.list` method returns only the sessions belonging to the requesting `user_id`.

This does not require separate processes — it requires namespace prefixes in session IDs
and memory paths: `~/.jiuwenswarm/users/{user_id}/sessions/` instead of
`~/.jiuwenswarm/agent/sessions/`.

---

### 18.7 Custom Channel API Exists But Has No Developer Guide

**Current state.**
The `BaseChannel` abstract class in `jiuwenswarm/gateway/channel_manager/base.py` defines a
clean interface for implementing a custom integration channel:

```python
class BaseChannel(ABC):
    async def start(self) -> None: ...      # begin listening for inbound messages
    async def stop(self) -> None: ...       # clean up
    async def send(self, msg, ...) -> None: # send outbound message to user
    def is_allowed(self, sender_id) -> bool # check sender permission
```

11 built-in channels exist (Feishu, Telegram, Discord, WeChat, DingTalk, Slack, WhatsApp,
etc.) as working reference implementations. But:
- No `CHANNELS.md` or developer guide explains how to register a custom channel.
- The registration mechanism (how a custom `BaseChannel` subclass is wired into the
  `ChannelManager`) is not documented.
- The lifecycle contract (`start()` must be non-blocking, `send()` must handle
  `RoutingTarget` correctly) is not written down.
- The relationship between `Message`, `E2AEnvelope`, and `ChannelMetadata` is implicit.

An application developer who wants to integrate jiuwenswarm with their own messaging
platform (a custom NATS-based event bus, an internal Slack-like tool) must reverse-engineer
a working channel from source.

**What good looks like.**
A `CHANNELS.md` guide covering:
1. When to write a custom channel (vs. using the Web/WebSocket channel directly).
2. The full lifecycle: `start()` → receive inbound → call `self.bus.route_user_message()`
   → receive response in `send()`.
3. A minimal working example channel (HTTP polling or webhook receiver) in under 80 lines.
4. How to register the channel with `ChannelManager` at startup.
5. The `RoutingTarget` model — what it means and how to use it in `send()`.

---

### 18.8 Webhook/Event Notification System Is Limited

**Current state.**
A `GatewayHookHandler` exists with four events:

```python
async def on_session_start(self, session_id, source) -> None
async def on_user_prompt_submit(self, session_id, prompt) -> None
async def on_session_end(self, session_id, reason) -> None
async def on_notification(self, notification_type, message, session_id) -> None
```

These hooks fire shell commands configured in `hooks.yaml`. They can be used to POST to a
webhook URL via a shell `curl` command — but this is a workaround, not a designed feature.
There is no native "HTTP webhook" target type, no retry on failure, no delivery guarantee,
no signature (HMAC) for webhook security, and no event for the most useful cases:

- Agent task completed (with result summary)
- Agent tool call executed (which tool, what args)
- Agent error occurred
- Streaming response started / ended

**What good looks like.**
A native webhook destination in `config.yaml`:

```yaml
hooks:
  on_task_complete:
    - type: webhook
      url: "https://myapp.example.com/jiuwenswarm-events"
      secret: "whsec_abc123"   # HMAC-SHA256 signature header
      retry: 3
      timeout_seconds: 10
  on_agent_error:
    - type: webhook
      url: "https://myapp.example.com/jiuwenswarm-events"
```

Each webhook POST delivers a structured JSON payload:
```json
{
  "event": "task_complete",
  "session_id": "sess_xyz",
  "timestamp": "2026-09-06T10:05:22Z",
  "data": {
    "summary": "Parsed 3 invoices, wrote output.csv",
    "duration_ms": 14200,
    "tool_calls_count": 7
  }
}
```

With HMAC signature in `X-Jiuwenswarm-Signature` so the receiving app can verify the
request is authentic.

---

### 18.9 Session API Is Full-Featured But Has No Documented Response Shapes

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
A method reference document (or AsyncAPI spec — see 18.2) listing every method with its
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

### 18.10 No Local Development Mode for Application Developers

**Current state.**
An application developer building against jiuwenswarm must run the full stack (agent server
+ gateway + model API) to test their integration. There is no:
- Mock/stub gateway that replays canned responses without an LLM
- Sandbox mode with a local "echo agent" that returns predictable replies
- Response recording/playback for deterministic integration tests
- Docker Compose file for spinning up the full stack in CI

The only development mode is real: real WebSocket, real E2A protocol, real LLM API calls.
This makes integration tests slow, expensive, and non-deterministic.

**What good looks like.**
A `jiuwenswarm-dev` mode that starts a lightweight stub gateway:

```
$ jiuwenswarm-dev --stub
Stub gateway running at ws://localhost:19000/ws
Responds to chat.send with configurable canned replies.
No LLM required. No API keys required.

Configure responses in ~/.jiuwenswarm/dev/stubs.yaml:
  - method: chat.send
    pattern: ".*invoice.*"
    response: "I found 3 invoices. Processing now."
```

And a Docker Compose file in the repo root that starts agentserver + gateway + web UI with
one command, for developers who want the real stack without manual process management.

---

### Summary: Application Developer Usability at a Glance

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

---
