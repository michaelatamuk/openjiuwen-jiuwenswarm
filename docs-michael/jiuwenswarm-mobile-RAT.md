# Requirements Analysis — jiuwenswarm-mobile

---

## Source of Demand

- **Proactive Planning** — New Product Surface / Audience Expansion
- **Product Requirements** — JiuwenSwarm Platform / Consumer and Mobile-First Reach

---

## Demand Background

### WHY

JiuwenSwarm currently serves only users who work at a desktop: engineers in an IDE,
data scientists in JupyterLab, and researchers in a browser. Every integration requires
a desktop computer with a locally running JiuwenSwarm server. This architecture, while
excellent for privacy and power users, excludes the majority of people who could
benefit from an AI agent — those who primarily work on a phone or tablet, or who want
access outside of their workstation.

The mobile context introduces use patterns that no existing integration handles:

- **On-the-go research** — reading a document, article, or email on a phone and wanting
  to query the agent about it immediately, without switching to a computer.
- **Document capture** — photographing a physical document (whiteboard, printed report,
  business card, contract) and sending it into a research session for analysis.
- **Voice input** — speaking a question or note rather than typing, particularly while
  commuting or multitasking.
- **Share sheet** — sharing any URL from any iOS or Android app directly into a
  JiuwenSwarm session without opening a browser first.
- **Session continuity** — picking up a research session that was started on the desktop
  (in the browser extension or web app) and continuing it on a phone, or vice versa.

The goal is a thin, native-feeling mobile client for iOS and Android that speaks the
same WebSocket protocol as all other JiuwenSwarm integrations. The heavy work
(reasoning, memory, retrieval, tool execution) stays on the server. The app provides
the mobile-native input surfaces and the same session-based chat experience.

### WHEN

New product, proactively planned. Development can begin immediately using a local
JiuwenSwarm server on the same WiFi network (server bound to `0.0.0.0:19000` rather
than `127.0.0.1:19000`). Production release requires a hosted/cloud server mode so
users without self-hosted infrastructure can connect.

### WHAT

The feature is a cross-platform mobile application (iOS + Android) built with Expo
(React Native) and TypeScript. It has three logical layers:

---

**Layer 1 — Connection and protocol**

Manages the WebSocket connection to the JiuwenSwarm server. Identical protocol to the
browser extension and IDE plugin — no server-side changes are required for the basic
chat and session features.

| Capability | Component | Description |
|---|---|---|
| WebSocket client | `WsClient` | React Native WebSocket (browser-compatible API); exponential back-off reconnect; re-connects on app foreground |
| Connection store | `connectionStore` | Zustand store: server URL, auth token, connected flag, last error |
| Token streaming | `WsClient.onEvent` | Handles `token` / `done` / `error` envelopes; streams text into chat store |
| Tool call handling | `WsClient` | Receives `tool_call` envelopes; responds with `tool_result {error: "not supported on mobile"}` to avoid server hang |

---

**Layer 2 — Session and chat state**

Manages research sessions and per-session chat history entirely client-side. The server
is the source of truth for sessions; the app caches them locally for offline display.

| Capability | Component | Description |
|---|---|---|
| Session list and active pointer | `sessionStore` | Zustand store: `sessions[]`, `activeSessionId`; `createSession`, `setActive`, `refresh` |
| Chat message history | `chatStore` | Zustand store: `messages` per session; append streaming tokens; finalize on `done` |
| Session notes | `chatStore` | Per-session freeform notes (same as browser extension NoteEditor); prepended to context on send |
| Persistent local state | `storage/SecureStore` | Server URL and auth token in `expo-secure-store`; session cache in `AsyncStorage` |

---

**Layer 3 — Mobile-native input surfaces**

The capabilities that differentiate the mobile app from other JiuwenSwarm integrations.

| Capability | Component | Description |
|---|---|---|
| Camera document capture | `capture/DocumentCapture` | `expo-camera` viewfinder; capture button; image sent as base64 PNG in context block; optional OCR pre-processing |
| Voice input | `voice/VoiceInput` | `@react-native-voice/voice` for STT; transcribed text inserted into chat input; push-to-talk or toggle mode |
| iOS Share Extension | `ios/JiuwenSwarmShare/` | Separate iOS binary target; receives shared URL from any app via the iOS share sheet; stores URL in App Groups shared storage; main app picks it up and sends to session |
| Android share intent | `android/` manifest | `IntentFilter` for `text/plain` and `text/x-url`; received via React Native `Linking` API; converted to fetch-and-pin action |
| Push notifications | `notifications/push` | `expo-notifications`; device token sent to server; server pushes a notification when an agent task completes or a long response is ready |

---

### Requirement Type

☑ **Functionality** (new product surface)
☑ **Operation and Maintenance Methods** (local WiFi dev, hosted-mode production)
☑ **Compatibility** (iOS 16+ and Android API 26+; same server protocol as existing clients)

---

## Needs Assessment

### Requirement Decomposition

| Sub-requirement | Scope |
|---|---|
| WebSocket client with reconnect | `src/connection/WsClient.ts` |
| Connection state and config | `src/stores/connectionStore.ts` |
| Session list / create / switch | `src/stores/sessionStore.ts` |
| Chat message history and streaming | `src/stores/chatStore.ts` |
| Secure storage (URL, token) | `src/storage/SecureStore.ts` |
| AsyncStorage session cache | `src/storage/SessionCache.ts` |
| Onboarding / server connect screen | `app/connect.tsx` |
| Session list screen | `app/sessions/index.tsx` |
| Chat screen | `app/sessions/[id]/chat.tsx` |
| Camera capture screen | `app/capture.tsx` |
| Settings screen | `app/settings.tsx` |
| Camera document capture | `src/capture/DocumentCapture.ts` |
| Voice input (STT) | `src/voice/VoiceInput.ts` |
| Push notification setup | `src/notifications/push.ts` |
| iOS Share Extension | `ios/JiuwenSwarmShare/` (separate Xcode target) |
| Android share intent handler | `android/` manifest + `app/_layout.tsx` Linking handler |
| Shared protocol types | `src/protocol/types.ts`, `src/protocol/constants.ts` |
| Navigation and layout | `app/_layout.tsx` (Expo Router root layout) |
| Theming and design system | `src/theme/` (NativeWind / Tailwind config) |

### Constraints

**iOS App Transport Security (ATS) blocks plain WebSocket:**
iOS enforces HTTPS/WSS for all outbound connections by default. `ws://` connections
to a local server are blocked unless `NSAllowsLocalNetworking: true` is set in the
app's `Info.plist`. For production, the server must support `wss://` (TLS). The
development build (`app.config.js`) includes the ATS exception for local network use;
the production build requires a valid TLS certificate on the server.

**iOS terminates background WebSocket connections:**
When the app moves to the background, iOS suspends it within seconds. The WebSocket
connection is dropped. The app must reconnect on the next foreground event
(`AppState.addEventListener("change", ...)`). Any in-progress agent response will be
lost; the server should treat the disconnection as a client timeout.

**iOS local network permission (iOS 14+):**
Connecting to a LAN device (home server, laptop on same WiFi) requires the user to
grant "Local Network" access. The permission prompt shows the first time the app
attempts a connection to a non-internet host. `Info.plist` must include
`NSLocalNetworkUsageDescription`.

**iOS Share Extension is a separate binary:**
The iOS share extension (the "JiuwenSwarm" option in the share sheet) runs in a
separate process with a different bundle ID (`com.jiuwenswarm.app.share`). It cannot
directly call into the main app. Communication happens via App Groups: the extension
writes the shared URL to a group `UserDefaults`; the main app reads it on next launch
or foreground. Expo's managed workflow requires a custom native plugin (`expo-plugin`)
or Bare workflow to add a Share Extension target.

**Android cleartext traffic policy:**
Android 9+ (API 28+) blocks plain HTTP and WS traffic by default. Development builds
require `android:usesCleartextTraffic="true"` in `AndroidManifest.xml` or a
`network_security_config.xml` that permits cleartext to `127.0.0.1` and the local
subnet. Production builds must use `wss://`.

**No browser-native tool support:**
The server may dispatch `tool_call` envelopes requesting browser-native actions
(`highlight_text`, `scroll_to`, `fill_form`, `take_screenshot`) that are meaningless
on mobile. The mobile WsClient must respond immediately with a `tool_result` envelope
containing `{error: "tool not supported on mobile client"}` to prevent the agent from
waiting indefinitely. The agent prompt should ideally be informed that the client is
mobile so it avoids invoking browser tools.

**No pinned-page mechanism:**
The browser extension pins pages by injecting a content script into the page's tab and
extracting the DOM. The mobile app has no equivalent — it cannot access page content
running in other apps or Safari tabs. Context comes from three sources only: (a) shared
URLs received via the share sheet, where the server fetches the page via `read_page`
tool; (b) camera captures sent as base64 image context; (c) user-typed session notes.

**Push notification server dependency:**
For push notifications to work, the JiuwenSwarm server must support APNS (Apple Push
Notification Service) for iOS and FCM (Firebase Cloud Messaging) for Android. The
mobile app registers a device token and sends it to the server on each launch. This
requires server-side changes not present in the current codebase — it is a v2 feature.

**EAS Build required for iOS distribution:**
Compiling an iOS `.ipa` requires a Mac with Xcode or EAS Build (Expo's cloud build
service). Local development (`npx expo start`) with Expo Go works for most features
except the Share Extension, custom native modules (voice), and push notification
testing. A development build (`eas build --profile development`) is required for full
feature testing on a physical device.

**mDNS on Android:**
iOS resolves `.local` hostnames (mDNS / Bonjour) natively. Android requires the
`jmdns` library or API 33+ NSD for `.local` resolution. For development, the Android
app should fall back to a numeric IP if the `.local` hostname fails to resolve.

### Impact of Requirement Implementation on Existing Systems

**JiuwenSwarm server — minor changes:**
The existing WebSocket gateway requires two small changes: (1) bind to `0.0.0.0`
rather than `127.0.0.1` to accept connections from other devices on the LAN; (2) add
an optional `client_type` field to the `ack` envelope so the server knows the
connecting client is mobile and can avoid dispatching browser-only `tool_call` types.
All other protocol behaviour is unchanged.

**Shared protocol package:**
The WebSocket envelope types and MSG constants are currently duplicated between
`jiuwenswarm-browser/src/shared/` and the IDE plugin. Adding a third client (mobile)
is the right moment to extract a shared TypeScript package — `packages/jiuwenswarm-shared`
in a monorepo or `@jiuwenswarm/shared` on npm — so all clients import from one source.
This is a low-risk refactor: the types themselves do not change.

**JiuwenSwarm web app:** No changes required. Sessions created or modified from the
mobile app are server-side objects, immediately visible in the web app.

**Browser extension and IDE plugin:** No changes required. The server protocol is
additive; the new `client_type` field in ack is ignored by existing clients.

**Existing JiuwenSwarm users:** No impact. The mobile app is a separate installable
distributed through the App Store and Google Play.

### External Dependencies

| Dependency | Purpose | Notes |
|---|---|---|
| `expo` | Managed workflow: build config, SDK, EAS | SDK 51+ recommended |
| `expo-router` | File-based navigation (Expo Router v3) | |
| `expo-camera` | Camera viewfinder and capture | Requires camera permission |
| `expo-secure-store` | Encrypted storage for server URL and auth token | iOS Keychain / Android Keystore |
| `expo-notifications` | Push notification token + local scheduling | Requires APNS/FCM server support |
| `@react-native-voice/voice` | Speech-to-text via platform STT engines | Requires microphone permission; bare workflow or custom plugin |
| `zustand` | Lightweight global state (sessions, chat, connection) | |
| `nativewind` | Tailwind CSS syntax for React Native styling | |
| `react-native-safe-area-context` | Safe area insets (notch, home indicator) | |
| `react-native-gesture-handler` | Gesture support for swipe navigation | |
| EAS Build | Cloud compilation for iOS and Android | Subscription required for iOS |
| EAS Update | OTA JavaScript bundle updates | Bypasses App Store review for JS-only changes |
| JiuwenSwarm server (`0.0.0.0` mode) | All agent features during local development | Default `ws://192.168.x.x:19000` on LAN |
| Apple Developer account | iOS distribution and Share Extension entitlements | Paid ($99/year) |
| Google Play Console | Android distribution | Paid ($25 one-time) |
