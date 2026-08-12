# System Investigation — jiuwenswarm-mobile

**Related document:** `jiuwenswarm-mobile-RAT.md` — product requirements and business background.
This document covers architecture, module decomposition, sequence diagrams, technical
constraints, system impact, and external dependencies.

---

## Feature Scope

`jiuwenswarm-mobile` is a cross-platform mobile application (iOS + Android) built with
Expo (React Native) and TypeScript. It is a thin client — the JiuwenSwarm reasoning
engine, memory, retrieval, and tool execution all remain on the server. The app
provides the mobile-native input surfaces (chat, camera, voice, share sheet) and the
same session-based experience as the browser extension and IDE plugin.

Three logical layers:

1. **Connection layer** — React Native WebSocket client; same envelope protocol as the
   browser extension; reconnects on app foreground; gracefully rejects browser-only
   tool calls.

2. **State layer** — Zustand stores for connection, sessions, and chat history;
   `expo-secure-store` for credentials; `AsyncStorage` for offline session cache.

3. **UI layer** — Expo Router screens (Connect, Sessions, Chat, Capture, Settings);
   mobile-native inputs (camera, voice, share sheet); push notifications.

---

## Architecture

```
  ┌─────────────────────────────────────────────────────────────────────┐
  │                    iOS / Android device                              │
  │                                                                      │
  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
  │  │ Share sheet  │  │   Camera     │  │    Voice (STT)           │   │
  │  │ (iOS ext /   │  │ expo-camera  │  │  @rn-voice/voice         │   │
  │  │  Android     │  │              │  │                          │   │
  │  │  intent)     │  └──────┬───────┘  └──────────┬─────────────┘   │
  │  └──────┬───────┘         │                      │                  │
  │         │                 │  base64 image         │  transcribed     │
  │         │  shared URL     │  in context block     │  text → input    │
  │         └─────────────────┼──────────────────────┘                  │
  │                           │                                          │
  │  ┌────────────────────────▼─────────────────────────────────────┐   │
  │  │                    Expo Router screens                        │   │
  │  │                                                               │   │
  │  │  connect.tsx   sessions/index.tsx   sessions/[id]/chat.tsx   │   │
  │  │  capture.tsx   settings.tsx                                   │   │
  │  └────────────────────────┬─────────────────────────────────────┘   │
  │                           │  reads / writes                          │
  │  ┌────────────────────────▼─────────────────────────────────────┐   │
  │  │                    Zustand stores                             │   │
  │  │  connectionStore   sessionStore   chatStore                   │   │
  │  └────────────────────────┬─────────────────────────────────────┘   │
  │                           │  dispatches / receives                   │
  │  ┌────────────────────────▼─────────────────────────────────────┐   │
  │  │                    WsClient.ts                                │   │
  │  │  React Native WebSocket · exponential back-off reconnect      │   │
  │  │  envelope send / onEvent subscriber · tool_call rejection     │   │
  │  └────────────────────────┬─────────────────────────────────────┘   │
  └───────────────────────────┼─────────────────────────────────────────┘
                              │
                              │  ws://192.168.x.x:19000  (LAN dev)
                              │  wss://server.example.com (production)
                              │
  ┌───────────────────────────▼─────────────────────────────────────────┐
  │                    JiuwenSwarm server                                │
  │  (bound to 0.0.0.0 for LAN dev; TLS termination for production)     │
  │                                                                      │
  │  SessionManager · WsGateway · ContextEngine · ToolDispatcher        │
  │  MemoryManager · LLM client (OpenAI / Anthropic / Ollama)           │
  └─────────────────────────────────────────────────────────────────────┘
```

### Design Principles

**Server is the single source of truth for sessions.**
Sessions are created and stored server-side, exactly as in the browser extension and
IDE plugin. The app caches the session list locally for instant display on launch but
always re-syncs from the server on connect. Sessions created on mobile are immediately
visible in the web app and browser extension.

**WsClient is the only network boundary.**
All communication with the server goes through `WsClient`. Stores do not hold
WebSocket references. This makes reconnect logic, error handling, and offline states
manageable in one place.

**Stores are the single source of truth for UI state.**
Screens read from Zustand stores and dispatch actions. Stores subscribe to `WsClient`
events on mount. There is no prop drilling; any screen can read session or chat state
directly.

**Protocol reuse without duplication.**
The WebSocket envelope format (`type`, `session_id`, `payload`) is identical to the
browser extension and IDE plugin. The type definitions and MSG constants are candidates
for extraction into a shared `@jiuwenswarm/shared` package to avoid maintaining three
copies. Until that package exists, `src/protocol/types.ts` mirrors the canonical
definitions from `jiuwenswarm-browser/src/shared/`.

**Mobile-only context sources.**
The browser extension builds context from pinned tab content extracted by content
scripts. The mobile app has no equivalent mechanism. Context comes from three sources:
(a) URLs shared via the share sheet — the server fetches these via its `read_page`
tool; (b) camera captures sent as base64 PNG in the context block; (c) user-typed
session notes prepended before every message.

**Graceful tool_call rejection.**
The server may dispatch `tool_call` envelopes intended for browser-native tools
(`highlight_text`, `scroll_to`, etc.). The mobile client cannot execute these. Rather
than silently ignoring them (which causes the server to wait indefinitely), `WsClient`
responds immediately with a `tool_result` envelope containing
`{error: "tool not available on mobile client"}`.

---

## Module Layout

```
jiuwenswarm-mobile/
│
├── app/                            Expo Router — file-based navigation
│   ├── _layout.tsx                 Root layout: providers (Zustand, SafeArea,
│   │                               GestureHandler), WsClient init on mount,
│   │                               AppState foreground listener for reconnect,
│   │                               Linking handler for Android share intents
│   ├── index.tsx                   Redirect: /connect if no server URL saved,
│   │                               else /sessions
│   ├── connect.tsx                 Onboarding screen: server URL field, optional
│   │                               auth token, Test Connection button,
│   │                               mDNS hint (mishkas-macbook.local)
│   ├── sessions/
│   │   ├── index.tsx               Session list: FlatList of ResearchSession,
│   │   │                           active indicator, + New modal, tap → chat
│   │   └── [id]/
│   │       └── chat.tsx            Chat screen: message FlatList, TextInput,
│   │                               Send button, mode selector, voice button,
│   │                               camera button, streaming token append,
│   │                               notes toggle panel
│   ├── capture.tsx                 Camera screen: expo-camera viewfinder,
│   │                               capture button, preview, "Add to session"
│   └── settings.tsx                Server URL, auth token, notification prefs,
│                                   disconnect, app version
│
├── src/
│   ├── connection/
│   │   ├── WsClient.ts             React Native WebSocket client; connects to
│   │   │                           server URL from connectionStore; exponential
│   │   │                           back-off (1→2→5→10→30 s); onEvent(fn)
│   │   │                           subscriber pattern; send(type, payload);
│   │   │                           tool_call interception → immediate rejection
│   │   └── useConnection.ts        React hook: connected flag, reconnect(),
│   │                               error message; subscribes to connectionStore
│   │
│   ├── stores/
│   │   ├── connectionStore.ts      Zustand: serverUrl, authToken, connected,
│   │   │                           lastError; setServerUrl, setConnected actions
│   │   ├── sessionStore.ts         Zustand: sessions[], activeSessionId;
│   │   │                           refresh() → server list_sessions RPC;
│   │   │                           createSession(title, mode);
│   │   │                           setActive(id); persists activeSessionId
│   │   │                           to AsyncStorage
│   │   └── chatStore.ts            Zustand: messages keyed by sessionId;
│   │                               appendToken(sessionId, text);
│   │                               finalizeMessage(sessionId, text?);
│   │                               appendError(sessionId, message);
│   │                               notes: Record<sessionId, string>;
│   │                               setNote(sessionId, text) + auto-persist
│   │
│   ├── protocol/
│   │   ├── types.ts                AgentMode, ResearchSession, ChatMessage,
│   │   │                           InboundEnvelope, TokenPayload, DonePayload,
│   │   │                           ErrorPayload, ToolCallPayload (mirrors
│   │   │                           jiuwenswarm-browser/src/shared/types.ts)
│   │   └── constants.ts            MSG action strings, WS_URL(host, port) builder
│   │                               (mirrors jiuwenswarm-browser/src/shared/constants.ts)
│   │
│   ├── capture/
│   │   └── DocumentCapture.ts      expo-camera wrapper; captureAsync() returns
│   │                               base64 PNG; buildContextBlock(base64) wraps
│   │                               image in a context string for chat.send
│   │
│   ├── voice/
│   │   └── VoiceInput.ts           @react-native-voice/voice wrapper; start(),
│   │                               stop(); onResult(text) callback; handles
│   │                               Android/iOS permission differences;
│   │                               push-to-talk mode (hold) or toggle mode
│   │
│   ├── notifications/
│   │   └── push.ts                 expo-notifications: requestPermission(),
│   │                               getExpoPushToken(), sendTokenToServer();
│   │                               notification received handler (foreground
│   │                               and background); navigate to relevant session
│   │                               on tap
│   │
│   ├── storage/
│   │   ├── SecureStore.ts          expo-secure-store wrappers: getServerUrl(),
│   │   │                           setServerUrl(), getAuthToken(),
│   │   │                           setAuthToken(), clearAll()
│   │   └── SessionCache.ts         AsyncStorage wrappers: saveSessionList(),
│   │                               loadSessionList(), saveActiveSessionId(),
│   │                               loadActiveSessionId(), saveNotes(),
│   │                               loadNotes(sessionId)
│   │
│   └── theme/
│       ├── tailwind.config.js      NativeWind config: custom colors, fonts,
│       │                           spacing to match JiuwenSwarm design system
│       └── colors.ts               Shared color tokens (background, surface,
│                                   accent, text, error, connected/disconnected)
│
├── ios/
│   ├── JiuwenSwarmApp/             Main iOS target (Expo-generated)
│   └── JiuwenSwarmShare/           Share Extension target
│       ├── ShareViewController.swift  Receives NSExtensionItem (URL or text);
│       │                              writes to App Group UserDefaults;
│       │                              closes extension UI immediately
│       └── Info.plist              NSExtensionActivationRule: web URLs only;
│                                   NSLocalNetworkUsageDescription;
│                                   NSAppTransportSecurity local networking
│
├── android/
│   └── app/src/main/
│       ├── AndroidManifest.xml     IntentFilter for ACTION_SEND text/plain
│       │                           and text/x-url; usesCleartextTraffic (dev)
│       └── network_security_config.xml  Permits cleartext to 192.168.0.0/16
│                                        and 10.0.0.0/8 for local dev
│
├── app.json                        Expo app config: bundleId, permissions,
│                                   iOS entitlements (App Groups), EAS project ID
├── eas.json                        EAS Build profiles: development, preview, production
└── package.json
```

---

## Key Sequence Diagrams

### 1. App launch and server connect

```
User        app/index.tsx    SecureStore.ts   connectionStore   WsClient.ts   Server
  │               │                │                │               │            │
  │  open app     │                │                │               │            │
  │──────────────►│                │                │               │            │
  │               │  getServerUrl()│                │               │            │
  │               │───────────────►│                │               │            │
  │               │◄── url ────────│                │               │            │
  │               │                │                │               │            │
  │   url empty   │                │                │               │            │
  │◄── redirect   │                │                │               │            │
  │    /connect   │                │                │               │            │
  │               │                │                │               │            │
  │  enter URL,   │                │                │               │            │
  │  tap Connect  │                │                │               │            │
  │──────────────►│                │                │               │            │
  │               │  setServerUrl()│                │               │            │
  │               │───────────────►│                │               │            │
  │               │                │  setServerUrl  │               │            │
  │               │                │───────────────►│               │            │
  │               │                │                │  connect(url) │            │
  │               │                │                │──────────────►│            │
  │               │                │                │               │  ws open   │
  │               │                │                │               │───────────►│
  │               │                │                │               │◄── ack ────│
  │               │                │                │◄─ connected ──│            │
  │               │                │                │               │            │
  │               │                │                │  list_sessions RPC         │
  │               │                │                │───────────────────────────►│
  │               │                │                │◄── sessions[] ─────────────│
  │◄── redirect   │                │                │               │            │
  │    /sessions  │                │                │               │            │
```

---

### 2. User sends a chat message

```
User       chat.tsx     chatStore      sessionStore    WsClient.ts    Server
  │            │             │               │               │            │
  │  type text │             │               │               │            │
  │  tap Send  │             │               │               │            │
  │───────────►│             │               │               │            │
  │            │  getNotes() │               │               │            │
  │            │────────────►│               │               │            │
  │            │◄── notes ───│               │               │            │
  │            │             │  activeId     │               │            │
  │            │             │──────────────►│               │            │
  │            │             │◄── sessionId ─│               │            │
  │            │             │               │               │            │
  │            │  appendMessage(user, text)  │               │            │
  │            │────────────►│               │               │            │
  │            │             │               │               │            │
  │            │  WsClient.send("chat.send", {               │            │
  │            │    content: text,           │               │            │
  │            │    context: notes,          │               │            │
  │            │    mode, session_id})       │               │            │
  │            │──────────────────────────────────────────► │            │
  │            │             │               │               │  ws.send() │
  │            │             │               │               │───────────►│
  │            │             │               │               │            │
  │            │             │               │               │◄── token ──│
  │            │  appendToken(sessionId, text)               │            │
  │◄── text    │────────────►│               │               │            │
  │   streams  │             │               │               │◄── token ──│
  │   in       │◄── re-render│               │               │            │
  │            │             │               │               │◄── done ───│
  │            │  finalizeMessage(sessionId) │               │            │
  │            │────────────►│               │               │            │
  │◄── input   │             │               │               │            │
  │   re-enabled             │               │               │            │
```

---

### 3. Share URL from Safari (iOS)

```
User (Safari)   ShareViewController.swift   App Groups     app/_layout.tsx   WsClient.ts   Server
      │                   │                     │                 │               │            │
      │  tap Share →      │                     │                 │               │            │
      │  JiuwenSwarm      │                     │                 │               │            │
      │──────────────────►│                     │                 │               │            │
      │                   │  write shared URL   │                 │               │            │
      │                   │  to group defaults  │                 │               │            │
      │                   │────────────────────►│                 │               │            │
      │                   │  completeRequest()  │                 │               │            │
      │                   │  (closes sheet)     │                 │               │            │
      │                   │                     │                 │               │            │
      │  main app opens   │                     │                 │               │            │
      │  (or foregrounds) │                     │                 │               │            │
      │                   │                     │  read URL       │               │            │
      │                   │                     │◄────────────────│               │            │
      │                   │                     │  clear entry    │               │            │
      │                   │                     │◄────────────────│               │            │
      │                   │                     │                 │               │            │
      │                   │                     │  send("chat.send", {            │            │
      │                   │                     │    content: "Summarize: <url>", │            │
      │                   │                     │    session_id})  │              │            │
      │                   │                     │─────────────────────────────── ►│            │
      │                   │                     │                 │               │  ws.send() │
      │                   │                     │                 │               │───────────►│
      │◄── chat screen    │                     │                 │               │            │
      │    opens with     │                     │                 │               │◄── tokens ─│
      │    response       │                     │                 │               │            │
```

---

### 4. Camera capture → add to session

```
User      capture.tsx    DocumentCapture.ts    chatStore    WsClient.ts    Server
  │            │                │                  │             │            │
  │  tap 📷    │                │                  │             │            │
  │───────────►│                │                  │             │            │
  │            │  captureAsync()│                  │             │            │
  │            │───────────────►│                  │             │            │
  │            │                │  expo-camera     │             │            │
  │            │                │  captures frame  │             │            │
  │            │◄── base64 PNG ─│                  │             │            │
  │            │                │                  │             │            │
  │◄── preview │                │                  │             │            │
  │   shown    │                │                  │             │            │
  │            │                │                  │             │            │
  │  tap       │                │                  │             │            │
  │  "Add to   │                │                  │             │            │
  │  session"  │                │                  │             │            │
  │───────────►│                │                  │             │            │
  │            │  buildContextBlock(base64)         │             │            │
  │            │───────────────►│                  │             │            │
  │            │◄── "[Image captured...]\n<b64>" ──│             │            │
  │            │                │                  │             │            │
  │            │  appendMessage(user, "[Photo]")   │             │            │
  │            │──────────────────────────────────►│             │            │
  │            │                │                  │             │            │
  │            │  send("chat.send", {context: b64_block, ...})   │            │
  │            │─────────────────────────────────────────────── ►│            │
  │            │                │                  │             │  ws.send() │
  │◄── navigate│                │                  │             │───────────►│
  │   to chat  │                │                  │             │◄── tokens ─│
```

---

### 5. App background → foreground reconnect

```
User      AppState listener    connectionStore    WsClient.ts    Server
  │              │                   │                │             │
  │  home button │                   │                │             │
  │─────────────►│                   │                │             │
  │              │  (iOS suspends app within seconds) │             │
  │              │                   │                │  ws closed  │
  │              │                   │◄── disconnected│             │
  │              │                   │                │             │
  │  return to   │                   │                │             │
  │  app         │                   │                │             │
  │─────────────►│                   │                │             │
  │              │  state === "active"│               │             │
  │              │  connectionStore.serverUrl         │             │
  │              │──────────────────►│                │             │
  │              │                   │  connect(url)  │             │
  │              │                   │───────────────►│             │
  │              │                   │                │  ws open    │
  │              │                   │                │────────────►│
  │              │                   │                │◄── ack ─────│
  │              │                   │◄── connected ──│             │
  │◄── status dot│                   │                │             │
  │   goes green │                   │                │             │
```

---

## Component Breakdown

### `src/connection/`

| Module | Responsibility |
|---|---|
| `WsClient.ts` | Owns the `WebSocket` instance; `connect(url)` opens connection with optional `Authorization` header for auth token; `send(type, payload)` serialises to JSON; `onEvent(fn)` subscriber pattern dispatched from `ws.onmessage`; exponential back-off on `onclose` (delays: 1, 2, 5, 10, 30 s); `disconnect()` closes cleanly; intercepts `tool_call` envelopes and immediately responds with error `tool_result` |
| `useConnection.ts` | React hook; subscribes to `connectionStore`; exposes `connected`, `error`, `reconnect()`; used by the status indicator in the chat screen header |

### `src/stores/`

| Module | Responsibility |
|---|---|
| `connectionStore.ts` | Zustand store; `serverUrl: string`, `authToken: string`, `connected: boolean`, `lastError: string \| null`; `setServerUrl(url)` persists to SecureStore; `setConnected(flag)` called by WsClient; `setError(msg)` |
| `sessionStore.ts` | Zustand store; `sessions: ResearchSession[]`, `activeSessionId: string \| null`; `refresh()` sends `list_sessions` via WsClient and populates sessions; `createSession(title, mode)` sends `new_session` RPC; `setActive(id)` persists to AsyncStorage; `init()` restores `activeSessionId` from AsyncStorage on launch |
| `chatStore.ts` | Zustand store; `messages: Record<sessionId, ChatMessage[]>`; `streaming: Record<sessionId, boolean>`; `notes: Record<sessionId, string>`; `appendToken(sid, text)` grows the last assistant message; `finalizeMessage(sid, text?)` sets `streaming[sid] = false`; `appendError(sid, msg)` adds an error message bubble; `setNote(sid, text)` persists to SessionCache |

### `src/storage/`

| Module | Responsibility |
|---|---|
| `SecureStore.ts` | Thin wrappers over `expo-secure-store`: `getServerUrl()`, `setServerUrl(url)`, `getAuthToken()`, `setAuthToken(token)`, `clearAll()`; uses platform keychain (iOS Keychain, Android Keystore) |
| `SessionCache.ts` | Thin wrappers over `AsyncStorage`: `saveSessionList(sessions)`, `loadSessionList()`, `saveActiveSessionId(id)`, `loadActiveSessionId()`, `saveNotes(sid, text)`, `loadNotes(sid)`; used for instant display before server sync completes |

### `src/capture/`

| Module | Responsibility |
|---|---|
| `DocumentCapture.ts` | Wraps `expo-camera`; `requestPermission()` returns boolean; `captureAsync()` returns `{base64: string, width, height}`; `buildContextBlock(base64)` produces `[Image captured — describe what you see]\n<base64_truncated_to_500KB>`; the context block is passed as the `context` field in `chat.send` |

### `src/voice/`

| Module | Responsibility |
|---|---|
| `VoiceInput.ts` | Wraps `@react-native-voice/voice`; `requestPermission()` for microphone; `start()` begins recognition; `stop()` ends recognition; `onResult(cb)` fires with partial and final transcriptions; `onError(cb)` for timeout or no-speech; handles Android/iOS API differences; no audio is sent to the server — recognition is on-device |

### `src/notifications/`

| Module | Responsibility |
|---|---|
| `push.ts` | `requestPermission()` → boolean; `getExpoPushToken()` → string token; `sendTokenToServer(token)` → sends `register_push_token` message via WsClient (server must handle this message type — v2 feature); `setupNotificationHandler()` — foreground notification interceptor navigates to the relevant session; background notifications handled by OS |

### `app/` screens

| Screen | Responsibility |
|---|---|
| `connect.tsx` | Text input for server URL (placeholder: `ws://mishkas-macbook.local:19000`); auth token input (optional, hidden); "Test Connection" button — calls `WsClient.connect()`, shows success/error; on success saves URL and navigates to `/sessions`; shows mDNS usage hint |
| `sessions/index.tsx` | `FlatList` of `ResearchSession`; active session shown with accent border; "New Session" bottom sheet: name input + mode selector; tap session → navigate to `/sessions/[id]/chat`; pull-to-refresh calls `sessionStore.refresh()` |
| `sessions/[id]/chat.tsx` | `FlatList` of messages (user bubbles right, assistant bubbles left); `TextInput` with auto-grow (max 5 lines); Send button; mode `SegmentedControl` (`research / chat / summarize / compare`); voice button (hold-to-talk or toggle); camera button → navigate to `/capture`; notes toggle → slide-up panel with `TextInput`; streaming token append via `chatStore`; scroll-to-bottom on new token |
| `capture.tsx` | `expo-camera` viewfinder; capture button; after capture: preview image with "Add to session" and "Retake" buttons; "Add to session" calls `DocumentCapture.buildContextBlock(base64)` then sends via `WsClient` and navigates back to chat |
| `settings.tsx` | Shows current server URL and connection status; "Edit server" → back to connect screen; "Auth token" field; notification toggle; "Disconnect" clears SecureStore and navigates to `/connect`; app version and build number |

### iOS Share Extension

| Component | Responsibility |
|---|---|
| `ShareViewController.swift` | Receives `NSExtensionItem`; extracts URL from `NSItemProvider` with type `public.url` or plain text; writes to App Group `UserDefaults` with key `jiuwen_shared_url`; calls `extensionContext.completeRequest()`; shows no UI (immediate action) |
| App Groups entitlement | Allows `ShareViewController` and the main app to share a `UserDefaults` suite (`group.com.jiuwenswarm.app`) |
| `_layout.tsx` Linking handler | On `AppState "active"` event: reads `jiuwen_shared_url` from App Group UserDefaults via a native module; if present, clears it and calls `sendSharedUrl(url)` which dispatches to `WsClient` |

---

## Technical Constraints

**iOS ATS — `ws://` blocked in production.**
Apple's App Transport Security policy rejects plain WebSocket connections in production
builds. The development `app.config.js` sets `NSAllowsLocalNetworking: true` and
`NSAllowsArbitraryLoadsInWebContent: false`. Production builds require the server to
expose a `wss://` endpoint with a valid TLS certificate. The settings screen must
make the URL scheme visible and warn if the user enters a `ws://` URL in a production
build.

**iOS background suspension.**
iOS suspends the app within seconds of it moving to the background and does not allow
background WebSocket connections (no `VoIP` pushkit without App Store justification).
The WebSocket must reconnect on every foreground event. Any streaming response in
progress at suspension time is lost — the `chatStore` should mark the last assistant
message as interrupted rather than showing a broken partial response.

**Android cleartext traffic.**
Android 9+ blocks `ws://` by default. The development build includes a
`network_security_config.xml` that permits cleartext to RFC 1918 address ranges
(`192.168.0.0/16`, `10.0.0.0/8`, `172.16.0.0/12`). The production build does not
include this config, enforcing `wss://` for all connections.

**Share Extension — separate process, no direct IPC.**
The iOS Share Extension runs in a separate sandboxed process. It cannot import Swift/ObjC
code from the main app target, call React Native, or directly invoke JavaScript.
App Groups is the only supported IPC mechanism. The extension must be as small as
possible (no large frameworks) to meet Apple's extension memory limits (~120 MB).

**tool_call handling.**
The server's agent may generate `tool_call` envelopes for browser tools at any time.
`WsClient` must intercept these before dispatching to stores and respond synchronously.
If the rejection `tool_result` is not sent, the server's tool-call timeout fires after
its configured duration and the agent receives a timeout error — worse UX than an
immediate rejection.

**Camera capture context size.**
A full-resolution iPhone photo base64-encoded exceeds 10 MB, which would overwhelm the
server's context window and the WebSocket message buffer. `DocumentCapture.ts` must
resize captured images to a maximum width of 1024 px before base64 encoding, keeping
the context block under 500 KB. The resize is done with `expo-image-manipulator`.

**Voice recognition is on-device.**
`@react-native-voice/voice` uses the platform's built-in STT (Apple's Speech framework
on iOS, Android's `SpeechRecognizer`). No audio is sent to the JiuwenSwarm server.
Recognition quality depends on the platform and requires a network connection for
Apple's server-side recognition model on older iOS versions.

**mDNS on Android below API 33.**
Android resolves `.local` hostnames only on API 33+ via NSD. Devices on API 26–32
must use a numeric IP. The connect screen should show the numeric IP as the primary
hint for Android users, with the `.local` hostname as a secondary option.

**Expo managed workflow limitations.**
The Share Extension and `@react-native-voice/voice` require native code not covered
by Expo's managed workflow. Two options: (a) use Expo's custom dev client with an
`expo-plugin` for the native additions (preferred — keeps EAS Build); (b) eject to
bare workflow. Option (a) is recommended: it adds the native targets without losing
EAS tooling.

---

## Impact on Existing Systems

### JiuwenSwarm server

Two small changes needed:
1. **Bind to `0.0.0.0`** rather than `127.0.0.1` when a `--lan` or `--host 0.0.0.0`
   flag is passed. The default remains `127.0.0.1` to preserve existing security behaviour.
2. **`client_type` field in `ack` response** — the mobile client sends
   `{channel_id: "mobile"}` in its connect message; the server can use this to avoid
   dispatching browser-only `tool_call` types to the mobile client (optional
   optimisation — the mobile WsClient handles rejection regardless).

### Shared protocol package

Adding a third TypeScript client creates pressure to stop duplicating `types.ts` and
`constants.ts`. The recommended approach is to create `packages/jiuwenswarm-shared`
as a workspace package in a monorepo (or publish `@jiuwenswarm/shared` to npm). The
mobile app, browser extension, and IDE plugin all import from it. The package contains
only type definitions and constants — no runtime code, no platform dependencies.

### JiuwenSwarm web app

No changes required. Sessions created from mobile are server-side objects visible in
the web app immediately.

### Browser extension and IDE plugin

No changes required. The new `channel_id: "mobile"` connect field is a new key; existing
clients use `channel_id: "browser"` and `channel_id: "ide"`. The server ignores unknown
channel IDs from existing clients.

---

## External Dependencies

### Runtime (shipped in app bundle)

| Package | Version | Purpose |
|---|---|---|
| `expo` | SDK 51+ | Managed workflow: build system, SDK, EAS integration |
| `expo-router` | v3 | File-based navigation |
| `expo-camera` | — | Camera viewfinder and frame capture |
| `expo-image-manipulator` | — | Resize captured images before base64 encoding |
| `expo-secure-store` | — | Encrypted credential storage (iOS Keychain / Android Keystore) |
| `expo-notifications` | — | Push notification token + handlers |
| `@react-native-voice/voice` | — | On-device speech-to-text |
| `zustand` | 4.x | Global state management |
| `nativewind` | 4.x | Tailwind-syntax styling for React Native |
| `react-native-safe-area-context` | — | Notch and home-indicator insets |
| `react-native-gesture-handler` | — | Swipe gestures for navigation |
| `@react-native-async-storage/async-storage` | — | Session list and notes cache |

### Build tooling

| Tool | Purpose |
|---|---|
| EAS Build | Cloud compilation for iOS (`.ipa`) and Android (`.aab`) |
| EAS Update | OTA JavaScript bundle delivery (bypasses App Store review for JS changes) |
| Xcode (local) | Required for Share Extension development and iOS simulator testing |
| Android Studio (local) | Android emulator and manifest editing |

### Runtime (user must supply)

| Dependency | Required for | Notes |
|---|---|---|
| JiuwenSwarm server on LAN | All features during local development | Bound to `0.0.0.0:19000`; LAN IP or `.local` hostname |
| JiuwenSwarm hosted server | Production use | Requires `wss://` with TLS certificate |
| Apple Developer account | iOS distribution and Share Extension entitlements | $99/year |
| Google Play Console | Android distribution | $25 one-time fee |
