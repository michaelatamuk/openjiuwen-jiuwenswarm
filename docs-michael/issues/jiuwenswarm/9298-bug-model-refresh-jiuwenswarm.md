# [Bug][ide plugin]: Session model stays on placeholder `your-model-name` after model config — jiuwenswarm

## Executive Summary

A session created before a model was configured kept showing `your-model-name` in
the IDE model field/picker even after a model was configured in the local
JiuwenSwarm app. Both the PyCharm and VS Code plugins were affected.

Root cause: both IDE hosts fetched `models.list` only once, on the `connected`
event. Configuring a model later does not reconnect, so the early placeholder
response stayed cached for the lifetime of the connection.

The fix refreshes the model list when the model picker is opened, using the existing
`models.list` request, and updates both the header label and the picker entries.

Issue #8842 https://github.com/openJiuwen-ai/jiuwenswarm/issues/8842<br>
PR #9298 https://github.com/openJiuwen-ai/jiuwenswarm/pull/9298

## 🐞 Detailed Description of the Problem

Reproduction:

1. Install the local JiuwenSwarm app **without** configuring a model.
2. Install the IDE plugin and create a session.
3. Configure a model in the local app.

Expected: the session model refreshes to the configured model.
Actual: the model field remains on the placeholder `your-model-name`.

### Root cause

- The WebUI/IDE host calls `models.list` once during the `connected` status update
  (`ChatPanel.sendCurrentStatus` / `ChatToolWindow` status handler).
- At that time the local config has no real model, so the response contains the
  placeholder entry / `active_model`.
- Configuring a model later does not trigger a reconnect or another `models.list`,
  so the webview keeps rendering the stale list.

### Environment

| Item | Value |
|---|---|
| IDE | PyCharm and VS Code |
| OS | Windows |
| Module | `jiuwenswarm/channels/ide/packages/vscode-extension` + `shared-webview/chat.html` + `jetbrains-plugin` |
| API | existing `models.list` (no API change) |

## Solution

- `shared-webview/chat.html`
  - `toggleModelDropdown()` sends `refresh_models` when the picker opens.
  - New `models_updated` host message updates `state.models` / `state.activeModel`
    and re-renders the label + picker.
- VS Code `ChatPanel.ts` / `protocol.ts`
  - Handle `refresh_models`, call `SessionManager.listModels()` again, reply with
    `models_updated`.
- JetBrains `ChatToolWindow.kt`
  - Handle `refresh_models`, call `service.session.listModels()` on a pooled thread,
    reply with `models_updated`.

```ts
case 'refresh_models': {
  void this.refreshModels();
  break;
}
```

### Compatibility

No API or backend change: `models.list` already exists and was already called on
connect. Only the timing of the call changes (on picker open). Agent/team chat
behaviour is unaffected.

## Verification

- VS Code: `npx tsc --noEmit` → exit 0; `npm run build` → build complete.
- JetBrains: the same `ChatToolWindow.kt` change was compiled and packaged with
  `./gradlew buildPlugin` in the IDE repo → `BUILD SUCCESSFUL`.
- Expected runtime behaviour: after configuring a model in the local app, opening the
  model picker re-fetches `models.list` and replaces `your-model-name` with the real
  model in both the header and the picker.
- Residual: if the local server still returns the placeholder after the refresh, the
  remaining part is backend config reload, not the IDE.

## Version Information

| Version |
|---|
| 0.1.0 |

## PR summary

**What type of PR is this?**
`/kind bug`

**What does this PR do / why do we need it**
Re-fetches the model list when the IDE model picker opens so sessions created before
model config stop showing the `your-model-name` placeholder.

**Which issue(s) this PR fixes**
Fixes #8842

**Branch / commits**

| Item | Value |
|---|---|
| Branch | `fix/ide-model-refresh` |
| Commit | `9e3d40bfa` `fix(ide): refresh model list when picker opens` |
| Merged into | `New-Features-Integration` (`9bd403bb0`) |
