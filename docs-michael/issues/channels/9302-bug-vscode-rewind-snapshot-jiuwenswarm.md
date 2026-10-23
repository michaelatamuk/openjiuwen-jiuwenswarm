# [Bug][ide plugin]: No rollback bar in VS Code after the assistant edits a file — jiuwenswarm

## Executive Summary

In the VS Code plugin, after the assistant edited a file (e.g. appending a line to
`hello.py`) no rollback bar appeared. The PyCharm plugin showed one.

Root cause: VS Code's file-edit detection assumed `tool_call.arguments` was already an
object. When the backend sent `arguments` as a JSON string, `args.file_path` /
`args.path` were `undefined`, so no pre-edit snapshot was taken. The edit was still
applied, but `promoteSnapshots()` had nothing to promote after `chat.final`, so the
`rewindable` state never turned on.

Issue #8701 https://github.com/openJiuwen-ai/jiuwenswarm/issues/8701<br>
PR #9302 https://github.com/openJiuwen-ai/jiuwenswarm/pull/9302<br>
Paired: [GitCode #5422](https://gitcode.com/openJiuwen/jiuwenswarm/issues/5422)

## 🐞 Detailed Description of the Problem

Reproduction:

1. VS Code plugin, **Execute** mode (default config).
2. Ask: append `print('bye world')` to `hello.py`.
3. Wait for the edit to finish.

Expected: a rollback bar appears for the edited file (PyCharm does show diff + rollback).
Actual: VS Code has no diff viewer and no rollback bar; the file is modified directly.

### Root cause

`ChatPanel.ts` extracted arguments with a direct cast:

```ts
const args = (payload.tool_call as Record<string, unknown>)?.arguments as Record<string, unknown>
  || payload.tool_input || payload.input || {};
const filePath = (args.file_path as string) || (args.path as string) || undefined;
```

If `arguments` is a JSON string, `args.file_path` is `undefined`, so
`DiffApplier.ensureSnapshot(filePath)` is skipped. `DiffApplier.handleToolCall` still
applies the change, so the file is edited without a snapshot. On `chat.final`,
`DiffApplier.promoteSnapshots()` returns false and no `rewindable` message is sent.

PyCharm already parses a string `arguments` value, which is why only VS Code was
affected.

### Environment

| Item | Value |
|---|---|
| IDE | VS Code (PyCharm unaffected) |
| Mode | Execute |
| OS | Windows |
| Module | `jiuwenswarm/channels/ide/packages/vscode-extension/src/ui/ChatPanel.ts` |

## Solution

Parse `tool_call.arguments` when it is a string before extracting the file path:

```ts
const rawArgs = (payload.tool_call as Record<string, unknown>)?.arguments
  || payload.tool_input || payload.input || {};
let args: Record<string, unknown> = {};
if (typeof rawArgs === 'string') {
  try { args = JSON.parse(rawArgs) as Record<string, unknown>; } catch { args = {}; }
} else if (rawArgs && typeof rawArgs === 'object') {
  args = rawArgs as Record<string, unknown>;
}
```

### Compatibility

No API/backend change. Malformed JSON falls back to `{}` and does not throw. Object
arguments behave exactly as before. PyCharm is unaffected.

Review follow-up: tool-argument parsing now goes through one shared helper that also
reads `payload.arguments`, rejects `JSON.parse` results that are `null`/arrays, and
logs parse failures. Snapshots are captured before the agent edits files, so undo
restores the actual pre-turn content instead of the already-modified file.

## Verification

- `npx tsc --noEmit` → exit 0.
- `npm run build` (VS Code extension) → build complete.
- Expected runtime behaviour: a file-edit call whose `arguments` is a JSON string now
  resolves the path, snapshots the file, and enables the rollback bar after the turn.
- No behavior change for object-form arguments or non-edit tools.

## Version Information

| Version |
|---|
| 0.1.0 |

## PR summary

**What type of PR is this?**
`/kind bug`

**What does this PR do / why do we need it**
Parses JSON-string tool arguments before extracting the edited file path, restoring the
pre-edit snapshot and the VS Code rollback bar.

**Which issue(s) this PR fixes**
Fixes #8701

**Branch / commits**

| Item | Value |
|---|---|
| Branch | `fix/ide-vscode-rewind-snapshot` |
| Commit | `c12621728` `fix(ide): parse JSON tool args before taking rewind snapshot`<br>`c8a21af5e` `fix(ide): capture rewind snapshots before agent edits`<br>`3feaeb37a` `fix(ide): harden tool argument parsing` |
| Merged into | `New-Features-Integration` (`2c195a10c`, `ca18de68b`, `3b3d0dcf2`) |
