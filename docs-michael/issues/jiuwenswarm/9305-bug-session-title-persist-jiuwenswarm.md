# [Bug][ide plugin]: Session rename is lost after switching away and back — jiuwenswarm

## Executive Summary

Renaming session1, switching to session2, then switching back to session1 replaced the
user's name with the session id.

Root cause: `session.switch` does not return a `title` (the backend payload has
`session_id`, `mode`, `switched`, `moa_enabled`). Both IDE hosts used
`(payload.title || sid)`, so every switch overwrote the saved rename with the id.

The fix falls back to the persisted title from `session.list` when the switch
response has none.

Issue #8501 https://github.com/openJiuwen-ai/jiuwenswarm/issues/8501<br>
PR #9305 https://github.com/openJiuwen-ai/jiuwenswarm/pull/9305<br>
Paired: [GitCode #5322](https://gitcode.com/openJiuwen/jiuwenswarm/issues/5322)

## 🐞 Detailed Description of the Problem

Reproduction:

1. Rename session1 to a custom name.
2. Open the session menu and switch to session2.
3. Switch back to session1.

Expected: session1 keeps the user-entered name.
Actual: the name is auto-changed (to the session id).

### Root cause

`SessionManager.switchSession` (VS Code and JetBrains):

```ts
this._sessionTitle = (payload.title as string) || sid;
```

`session.switch` has no `title` in its payload, so the expression always fell back to
`sid`. The rename itself is persisted by the backend (`apply_session_rename`), so the
correct title was available via `session.list`.

### Environment

| Item | Value |
|---|---|
| IDE | PyCharm and VS Code |
| OS | Windows |
| Module | `jiuwenswarm/channels/ide/packages/*/client/SessionManager` |
| API | existing `session.switch` / `session.list` |

## Solution

When `session.switch` returns no title, fetch `session.list` and use the entry matching
the target session id:

- VS Code `SessionManager.ts`: `listSessions().find((s) => s.session_id === sid && s.title)`.
- JetBrains `SessionManager.kt`: same via `listSessions()`.

The session-id fallback is retained when no persisted title exists.

### Compatibility

No API/backend change. An extra `session.list` request is made only when the switch
response has no title (which is the current backend behavior). Existing session-switch
mode handling is preserved.

## Verification

- VS Code: `npx tsc --noEmit` → exit 0; `npm run build` → build complete.
- JetBrains: the same `SessionManager.kt` change compiled and packaged with
  `./gradlew buildPlugin` → `BUILD SUCCESSFUL`.
- Expected runtime behaviour: session1's user-entered title survives switching to
  session2 and back; no session-id fallback when a persisted title exists.
- NFI merge combined this with the session-mode return value; `tsc --noEmit` passes.

## Version Information

| Version |
|---|
| 0.1.0 |

## PR summary

**What type of PR is this?**
`/kind bug`

**What does this PR do / why do we need it**
Restores the persisted session title after a switch instead of falling back to the
session id.

**Which issue(s) this PR fixes**
Fixes #8501

**Branch / commits**

| Item | Value |
|---|---|
| Branch | `fix/ide-session-title-persist` |
| Commit | `e0de4d17a` `fix(ide): restore persisted session title on switch` |
| Merged into | `New-Features-Integration` (`b590b0410`) |
