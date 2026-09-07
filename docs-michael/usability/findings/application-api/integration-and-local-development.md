[← Index](../../README.md) · jiuwenswarm Usability Review

---

# Integration & Local Development

*Custom channels, events and a local dev loop.*

---

## 1 Writing a custom channel has no developer guide

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

## 2 Only shell-command hooks exist; there's no real webhook delivery

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

## 3 No local stub or dev mode for testing integrations

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

