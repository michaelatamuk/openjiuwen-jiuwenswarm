[← Index](../../README.md) · jiuwenswarm Usability Review

---

# Connection Security

*Authenticating app connections.*

---

## 1 The API has no authentication and is open by default

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

## 2 WebSocket origin checks are off by default and undocumented

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

