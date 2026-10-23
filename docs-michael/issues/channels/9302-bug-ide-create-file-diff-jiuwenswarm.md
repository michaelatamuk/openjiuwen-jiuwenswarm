# [Bug][ide plugin]: No diff editor when the assistant creates a file — jiuwenswarm

## Executive Summary

In VS Code's **Execute** mode, asking the agent to create a file (for example
`hello.py` containing `print('hello world')`) did not open a diff editor. PyCharm was
reported as affected too, but its current implementation already parses string
arguments and supports `str_replace_editor` `create`, so only VS Code needed a code
change.

Two defects in the VS Code extension caused this:

1. `ChatPanel.ts` only treated `tool_call.arguments` as an object. When the backend
   sent it as a JSON string, `filePath` was `undefined`, so the entire diff branch was
   skipped and the edit was applied directly.
2. After fixing the path extraction, `str_replace_editor` with `command: "create"`
   still produced an empty proposed side, because the new content is carried in
   `file_text` while `computeProposedContent` only read `content` / `new_string` /
   `new_str`.

Issue #8978 https://github.com/openJiuwen-ai/jiuwenswarm/issues/8978<br>
PR #9302 https://github.com/openJiuwen-ai/jiuwenswarm/pull/9302<br>
Paired: [GitCode #5555](https://gitcode.com/openJiuwen/jiuwenswarm/issues/5555)

## 🐞 Detailed Description of the Problem

Reproduction:

1. VS Code plugin, **Execute** mode.
2. Ask: `在项目根目录创建hello.py文件，内容为print('hello world')`.
3. Wait for the agent to request the file creation and observe the diff editor.

Expected: the diff editor opens automatically for the new file, with the proposed
content on the right.

Actual: no diff editor opens; the file is written directly.

### Root cause

The file-edit branch in `ChatPanel.ts` extracted arguments with a direct cast:

```ts
const args = (payload.tool_call as Record<string, unknown>)?.arguments as Record<string, unknown>
  || payload.tool_input || payload.input || {};
const filePath = (args.file_path as string) || (args.path as string) || undefined;
```

If `arguments` is a JSON string, `args.file_path` / `args.path` are `undefined`.
Everything inside `if (filePath)` — including the `useDiffViewer` branch — is skipped,
so `DiffApplier.handleToolCall` applies the change without showing a diff.

Once the path is recovered, the proposed-content helper still loses the new file body:

```ts
if (command === 'create' || !original) {
  return args.content ?? args.new_string ?? args.new_str ?? '';
}
```

`str_replace_editor` sends the created file body in `file_text`, not `content`, so the
diff would open with an empty proposed side.

PyCharm's `DiffApplier.kt` already parses string `arguments` and reads `file_text` for
`create`, which is why it is unaffected by these two defects.

### Environment

| Item | Value |
|---|---|
| IDE | VS Code (primary); PyCharm reported but current code already handles it |
| Mode | Execute (`code.normal`) |
| OS | Windows |
| Module | `jiuwenswarm/channels/ide/packages/vscode-extension/src/ui/ChatPanel.ts`, `.../src/editor/DiffViewer.ts` |

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

Accept `file_text` when computing the proposed content and pass it through from the
tool call:

```ts
if (command === 'create' || !original) {
  return args.file_text ?? args.content ?? args.new_string ?? args.new_str ?? '';
}

if (command === 'write_file') {
  return args.file_text ?? args.content ?? args.new_string ?? args.new_str ?? '';
}
```

### Compatibility

No API or backend change. Object-form arguments behave exactly as before. Malformed
argument strings fall back to `{}` and do not throw. PyCharm is unaffected.

## Verification

- `npx tsc --noEmit` → exit 0.
- `npm run build` (VS Code extension) → build complete.
- Expected runtime behaviour: a create/edit tool call whose `arguments` is a JSON
  string now resolves the file path; for `create` the diff editor opens with the
  `file_text` body on the proposed side. Rejecting leaves the file absent; accepting
  creates it.
- No behaviour change for object-form arguments or non-edit tools.
- Review follow-up: argument parsing is shared with the rewind path, reads
  `payload.arguments`, rejects `null`/array JSON results instead of crashing, and logs
  malformed JSON. `tsc --noEmit` passes.

## Version Information

| Version |
|---|
| 0.1.0 |

## PR summary

**What type of PR is this?**
`/kind bug`

**What does this PR do / why do we need it**
Restores file-path extraction for JSON-string tool arguments and uses `file_text` for
create/write diff proposals, so VS Code opens a populated diff editor when the agent
creates a file. The same argument-parsing change also fixes the missing rollback bar
tracked by #8701.

**Which issue(s) this PR fixes**
Fixes #8701
Fixes #8978

**Branch / commits**

| Item | Value |
|---|---|
| Branch | `fix/ide-vscode-rewind-snapshot` |
| Commit | `c12621728` `fix(ide): parse JSON tool args before taking rewind snapshot` |
| Commit | `35fb61bdf` `fix(ide): show created file content in diff viewer` |
| Commit | `3feaeb37a` `fix(ide): harden tool argument parsing` |
| Merged into | `New-Features-Integration` (`3d3a70cbd`, `3b3d0dcf2`) |
