# Development Plan — jiuwenswarm-mobile

**Architecture reference:** `jiuwenswarm-mobile-SIG.md`
**Requirements reference:** `jiuwenswarm-mobile-RAT.md`

Five phases from project init to App Store. Each phase has an explicit scope,
ordered task list, and done criteria. Nothing in a later phase is needed to complete
an earlier one.

---

## Phase 0 — Prerequisites

Must be complete before any app code is written.

### 0.1 Server — bind to LAN

The JiuwenSwarm server currently binds to `127.0.0.1`. Add a `--host` flag (or
`JIUWENSWARM_HOST` env var) so it can bind to `0.0.0.0` for LAN development.

| Task | File | Done when |
|---|---|---|
| Add `--host` CLI argument | `agent-core` server entrypoint | `python -m jiuwenswarm --host 0.0.0.0` starts and accepts LAN connections |
| Add `client_type` to ack envelope | server WebSocket gateway | `ack` payload includes `{"client_type": "mobile"}` when mobile connects |
| Verify from laptop | — | `wscat -c ws://192.168.x.x:19000` connects and receives `ack` |

### 0.2 Project init

| Task | Command / Action | Done when |
|---|---|---|
| Create Expo project | `npx create-expo-app jiuwenswarm-mobile -t expo-template-blank-typescript` | Project runs in Expo Go |
| Install Expo Router | `npx expo install expo-router` + configure `app.json` | File-based routing works |
| Install all dependencies | See dependency table in SIG | `npx expo start` has no missing-module errors |
| Configure NativeWind | `tailwind.config.js` + `global.css` | A test component renders with Tailwind classes |
| Configure TypeScript paths | `tsconfig.json` `paths`: `@stores/*`, `@connection/*`, `@protocol/*` | Imports resolve without relative `../../..` chains |
| Set up EAS project | `eas init` | `eas.json` created; project linked to Expo account |
| Set up `eas.json` profiles | development, preview, production | `eas build --profile development` succeeds for Android (no Apple account needed yet) |
| Create `src/protocol/types.ts` | Mirror from `jiuwenswarm-browser/src/shared/types.ts` | `ResearchSession`, `AgentMode`, `InboundEnvelope`, etc. defined |
| Create `src/protocol/constants.ts` | Mirror from `jiuwenswarm-browser/src/shared/constants.ts` | `MSG`, `WS_URL()` defined |
| Create `src/theme/colors.ts` | Define color tokens | Background, surface, accent, text, error, connected/disconnected |

**Done when:** `npx expo start` launches with no errors; a development build installs
on a physical device; the device can ping the server IP on the same WiFi.

---

## Phase 1 — MVP: Connect, Sessions, Chat

**Goal:** A user can point the app at the LAN server, see their sessions, send a
message, and receive a streaming response. Nothing mobile-specific yet — this is
the core protocol client.

### Task order

Build bottom-up: storage → stores → connection → screens.

#### Step 1 — Storage layer

| Task | File | Done when |
|---|---|---|
| Secure credential storage | `src/storage/SecureStore.ts` | `setServerUrl / getServerUrl / setAuthToken / getAuthToken / clearAll` work; values survive app restart |
| Session cache | `src/storage/SessionCache.ts` | `saveSessionList / loadSessionList / saveActiveSessionId / loadActiveSessionId / saveNotes / loadNotes` work |

#### Step 2 — Protocol stores

Build each store with no UI — test with unit tests or a debug screen.

| Task | File | Done when |
|---|---|---|
| Connection store | `src/stores/connectionStore.ts` | `serverUrl`, `authToken`, `connected`, `lastError`; actions update state; `setServerUrl` persists via SecureStore |
| Session store | `src/stores/sessionStore.ts` | `sessions[]`, `activeSessionId`; `createSession`, `setActive`; `refresh()` populates from server; `activeSessionId` persists via SessionCache |
| Chat store | `src/stores/chatStore.ts` | `messages` per session; `appendToken`, `finalizeMessage`, `appendError`; `notes` per session; `setNote` persists via SessionCache |

#### Step 3 — WebSocket client

| Task | File | Done when |
|---|---|---|
| WsClient core | `src/connection/WsClient.ts` | `connect(url)` opens socket; `send(type, payload)` serialises to JSON; `onEvent(fn)` dispatches parsed envelopes; `disconnect()` closes cleanly |
| Reconnect logic | `src/connection/WsClient.ts` | On `onclose`, retries with delays 1→2→5→10→30 s; stops when `disconnect()` called |
| `tool_call` rejection | `src/connection/WsClient.ts` | Any `tool_call` envelope triggers immediate `tool_result {error: "not available on mobile"}` before reaching stores |
| `useConnection` hook | `src/connection/useConnection.ts` | Returns `connected`, `error`, `reconnect()`; re-renders on store changes |
| Wire stores to WsClient events | `src/connection/WsClient.ts` | `token` → `chatStore.appendToken`; `done` → `chatStore.finalizeMessage`; `error` → `chatStore.appendError`; `sessions` response → `sessionStore` |

#### Step 4 — Root layout and navigation

| Task | File | Done when |
|---|---|---|
| Root layout | `app/_layout.tsx` | Wraps app in `GestureHandlerRootView`, `SafeAreaProvider`; calls `WsClient.connect()` on mount using stored URL; registers `AppState` listener to reconnect on `"active"` |
| Redirect logic | `app/index.tsx` | If no server URL in SecureStore → redirect to `/connect`; else → redirect to `/sessions` |

#### Step 5 — Screens

| Task | File | Done when |
|---|---|---|
| Connect screen | `app/connect.tsx` | Text input for server URL; "Test Connection" button calls `WsClient.connect()` and shows ✓ or error message; on success saves URL and navigates to `/sessions` |
| Session list screen | `app/sessions/index.tsx` | `FlatList` of sessions from `sessionStore`; active session highlighted; pull-to-refresh calls `sessionStore.refresh()`; "New Session" button opens modal with name + mode inputs; tap session → `/sessions/[id]/chat` |
| Chat screen | `app/sessions/[id]/chat.tsx` | `FlatList` of messages; user bubbles right, assistant bubbles left; `TextInput` auto-grows to 5 lines; Send button; mode `SegmentedControl`; streaming tokens append in real time; scroll-to-bottom on new token; input disabled while streaming |
| Settings screen | `app/settings.tsx` | Shows server URL and connection status dot; "Edit server" → `/connect`; "Disconnect" clears SecureStore and navigates to `/connect`; app version |

**Phase 1 done when:**
- Connect screen successfully connects to LAN server
- Session list loads real sessions from the server
- New session can be created and appears in the list
- Sending a message in chat produces a streaming response
- App reconnects after going to background and returning
- Server tool calls are silently rejected without the app hanging

---

## Phase 2 — Mobile-native inputs: Camera and Voice

**Goal:** Add the two inputs that differentiate the mobile app from all other
JiuwenSwarm clients.

### 2.1 Camera document capture

| Task | File | Done when |
|---|---|---|
| Request camera permission | `src/capture/DocumentCapture.ts` | `requestPermission()` returns `true` after user grants; shows alert if denied |
| Capture and resize | `src/capture/DocumentCapture.ts` | `captureAsync()` captures frame; `expo-image-manipulator` resizes to max 1024 px wide; returns base64 string under 500 KB |
| Context block builder | `src/capture/DocumentCapture.ts` | `buildContextBlock(base64)` returns `"[Image captured — describe what you see]\n<base64>"` |
| Capture screen | `app/capture.tsx` | `expo-camera` viewfinder; capture button; after capture shows preview with "Add to session" and "Retake"; "Add to session" sends context block via `WsClient` and navigates back to chat |
| Camera button in chat | `app/sessions/[id]/chat.tsx` | 📷 button navigates to `/capture`; on return, captured context appears as a user message and response streams in |

### 2.2 Voice input

| Task | File | Done when |
|---|---|---|
| Request microphone permission | `src/voice/VoiceInput.ts` | `requestPermission()` returns `true`; shows alert if denied |
| STT wrapper | `src/voice/VoiceInput.ts` | `start()` begins recognition; `stop()` ends it; `onResult(cb)` fires with transcribed text; `onError(cb)` for no-speech or timeout; handles Android/iOS API differences |
| Voice button in chat | `app/sessions/[id]/chat.tsx` | 🎤 button; hold to record, release to send; transcribed text appears in `TextInput`; user can edit before sending |

**Phase 2 done when:**
- Camera capture works on physical iOS and Android devices
- Photographed text is understood by the agent in its response
- Voice dictation produces accurate transcription and inserts into chat input
- Both permissions are requested with clear usage descriptions

---

## Phase 3 — Share Sheet

**Goal:** Users can share any URL from any app into JiuwenSwarm without opening the
app first.

### 3.1 iOS Share Extension

The Share Extension is a separate Xcode target. It requires native code — use Expo's
custom native plugin approach to avoid ejecting.

| Task | Location | Done when |
|---|---|---|
| Configure App Groups entitlement | `app.json` expo-plugin + Apple Developer portal | App and extension share `group.com.jiuwenswarm.app` UserDefaults suite |
| Create Share Extension target | `ios/JiuwenSwarmShare/` | Appears in Xcode as a separate target alongside the main app |
| `ShareViewController.swift` | `ios/JiuwenSwarmShare/ShareViewController.swift` | Receives `NSExtensionItem`; extracts URL from `public.url` or plain text provider; writes to App Group UserDefaults key `jiuwen_shared_url`; calls `extensionContext.completeRequest()` immediately (no UI shown) |
| Native module — read App Group | `ios/` | JS-callable `AppGroupStorage.getSharedUrl()` and `.clearSharedUrl()` using a small Expo Module |
| Handle shared URL on foreground | `app/_layout.tsx` | `AppState "active"` handler calls `AppGroupStorage.getSharedUrl()`; if present, clears it and sends to active session via WsClient as `"Please summarize or discuss: <url>"` |

### 3.2 Android Share Intent

| Task | Location | Done when |
|---|---|---|
| Add IntentFilter | `android/app/src/main/AndroidManifest.xml` | App appears in Android share sheet for `text/plain` and URLs |
| Handle intent | `app/_layout.tsx` | `Linking.getInitialURL()` and `Linking.addEventListener` extract shared URL; sends to active session |

**Phase 3 done when:**
- On iOS: sharing a URL from Safari shows "JiuwenSwarm" in the share sheet; tapping it opens the app and sends the URL to the active session; agent response appears in chat
- On Android: sharing a URL from Chrome shows JiuwenSwarm in the share dialog; same result

---

## Phase 4 — Push Notifications

**Dependency:** Server must implement APNS (iOS) and FCM (Android) token storage and
dispatch. This is a server-side feature; the client side is straightforward once the
server is ready.

### 4.1 Client side

| Task | File | Done when |
|---|---|---|
| Request notification permission | `src/notifications/push.ts` | `requestPermission()` prompts user; returns boolean |
| Get Expo push token | `src/notifications/push.ts` | `getExpoPushToken()` returns token string; works on physical device only (not simulator) |
| Send token to server | `src/notifications/push.ts` | `sendTokenToServer(token)` sends `{type: "register_push_token", payload: {token, platform}}` via WsClient after successful connect |
| Foreground notification handler | `src/notifications/push.ts` | `setupNotificationHandler()` intercepts foreground notifications and displays them as in-app banners |
| Notification tap handler | `app/_layout.tsx` | `Notifications.addNotificationResponseReceivedListener` extracts `sessionId` from notification data; navigates to `/sessions/[sessionId]/chat` |
| Notification permission toggle | `app/settings.tsx` | Shows current permission status; links to system settings if denied |

**Phase 4 done when:**
- App registers device token with server on each connect
- Agent completing a long task triggers a push notification on the device
- Tapping the notification opens the correct session's chat screen

---

## Phase 5 — Distribution

### 5.1 App assets

| Task | Done when |
|---|---|
| App icon (1024×1024 PNG) | `app.json` icon configured; Expo generates all required sizes |
| Splash screen | Splash shows during startup on both platforms |
| App name, bundle ID, version | `app.json` configured; matches Apple Developer and Google Play registrations |

### 5.2 iOS App Store

| Task | Done when |
|---|---|
| Apple Developer account enrolled | `developer.apple.com` — paid membership active |
| App ID registered | Bundle ID `com.jiuwenswarm.app` created in Apple Developer portal |
| Certificates and provisioning profiles | EAS Build handles automatically via `eas credentials` |
| Production build | `eas build --platform ios --profile production` succeeds; `.ipa` uploaded to App Store Connect |
| App Store Connect listing | Name, subtitle, description, keywords, screenshots (6.7" required; 6.1", 5.5" recommended), privacy policy URL |
| Privacy manifest | `PrivacyInfo.xcprivacy` — declares: NSUserDefaults, NSLocalNetwork, microphone, camera |
| Submit for review | App Store Connect → submit; pass review |

### 5.3 Google Play

| Task | Done when |
|---|---|
| Google Play Console account | One-time $25 registration |
| Production build | `eas build --platform android --profile production` succeeds; `.aab` downloaded |
| Play Console listing | Title, short description, full description, screenshots (phone required; tablet optional), feature graphic, privacy policy URL |
| Content rating questionnaire | Completed in Play Console |
| Submit for review | Internal test → closed test → production; pass review |

### 5.4 OTA updates

| Task | Done when |
|---|---|
| Configure EAS Update | `eas.json` update channel per profile; `app.json` `runtimeVersion` policy set |
| First OTA publish | `eas update --branch production --message "initial"` succeeds; devices receive update without App Store re-review |

**Phase 5 done when:**
- App is live on App Store and Google Play
- OTA update pipeline is verified: a JS-only change ships to users without App Store review

---

## Explicit deferrals

These are in the SIG but intentionally out of scope for all five phases above:

| Feature | Reason deferred |
|---|---|
| Hosted / cloud server mode | Separate infrastructure work; LAN mode is sufficient for v1 |
| Session notes panel in chat | Low priority for v1; keyboard space on mobile is limited |
| Annotation sync from browser extension | Requires hosted mode |
| mDNS resolution on Android API < 33 | Edge case; numeric IP fallback is sufficient for v1 |
| Tablet / iPad layout | Phone layout works on iPad; dedicated layout is a v2 refinement |
| Shared `@jiuwenswarm/shared` package | Worthwhile before v2; for v1, `src/protocol/` mirrors are acceptable |

---

## Dependency graph (phases)

```
Phase 0 (server + project setup)
    │
    ▼
Phase 1 (connect + sessions + chat)  ← must be complete before any other phase
    │
    ├──► Phase 2 (camera + voice)    ← no dependency on Phase 3 or 4
    │
    ├──► Phase 3 (share sheet)       ← no dependency on Phase 2 or 4
    │
    └──► Phase 4 (push notifications) ← requires server-side APNS/FCM work in parallel
             │
             ▼
         Phase 5 (distribution)      ← requires Phase 1, 2, 3 complete; Phase 4 optional
```

Phases 2, 3, and 4 are independent of each other and can be worked on in any order
once Phase 1 is done. Phase 5 should not start until at least Phases 1, 2, and 3
are complete and stable.
