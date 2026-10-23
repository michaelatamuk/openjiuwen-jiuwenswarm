# [Bug][ide plugin]: File references in assistant replies are not clickable — jiuwenswarm

## Executive Summary

File references in the assistant reply, such as `` `check_model_cfg.py:12` `` or
`ide-plugin-install/check_model_cfg.py:12`, were not clickable; clicking did not open
the file at the referenced line.

Two causes:
1. The backtick file-link regex only handled simple ASCII relative paths, so an
   absolute Windows path with unicode/spaces was not turned into a link.
2. When a link was produced, both hosts passed the path straight to an absolute-path
   resolver, so relative references could not be opened.

The fix broadens the inline file-reference detection and resolves relative/bare paths
against the workspace/project root (with a basename fallback).

Issue #8627 https://github.com/openJiuwen-ai/jiuwenswarm/issues/8627<br>
PR #9303 https://github.com/openJiuwen-ai/jiuwenswarm/pull/9303<br>
Paired: [GitCode #5384](https://gitcode.com/openJiuwen/jiuwenswarm/issues/5384)

## 🐞 Detailed Description of the Problem

Reproduction: ask the assistant to include these four file references:

1. `ide-plugin-install/check_model_cfg.py:12`
2. `E:/mwl/swarm串讲插件-智能审批/code/ide-plugin-install/check_model_cfg.py:12`
3. `check_model_cfg.py:12`
4. `ide-plugin-install/check_model_cfg.py`

Expected: each reference is a clickable file link that opens the file at the line.
Actual: clicking does nothing.

### Root cause

`renderInline()` only matched:

```
`((?:(?:\.{1,2}\/)?(?:[\w\-]+\/)+)?[\w.\-]+\.\w{2,6}(?::\d+)?)`
```

This excludes absolute Windows drive prefixes (`E:`), unicode directory names and
spaces. Separately, the hosts used `LocalFileSystem.findFileByPath(path)` /
`vscode.Uri.file(path)`, which need an absolute path, so relative references failed
even when a link was rendered.

### Environment

| Item | Value |
|---|---|
| IDE | PyCharm and VS Code |
| OS | Windows |
| Module | `jiuwenswarm/channels/ide/packages/shared-webview/chat.html` + both hosts |

## Solution

- `shared-webview/chat.html`: a single backtick handler links inline code ending in a
  file extension when it has a line suffix or a path separator. It supports absolute
  Windows paths, unicode and spaces, and skips URLs (`://`).
- VS Code `ChatPanel.ts`: relative paths resolve against the workspace root; if the
  file does not exist there, fall back to
  `vscode.workspace.findFiles('**/<basename>')` with glob metacharacters escaped.
- JetBrains `ChatToolWindow.kt`: relative paths resolve against `project.basePath`
  (Windows separators normalized); fall back to `FilenameIndex.getFilesByName(...)`
  inside a read action on a pooled thread, with lookup errors handled.

### Compatibility

No backend/API change. Non-file inline code is still rendered as `<code>`; URLs are
excluded. Absolute paths behave as before.

## Verification

- Regex checked against all four issue forms — each produces a file link.
- VS Code: `npx tsc --noEmit` → exit 0; `npm run build` → build complete.
- JetBrains: the same `ChatToolWindow.kt` change compiled and packaged with
  `./gradlew buildPlugin` → `BUILD SUCCESSFUL`.
- Review follow-up: the filename-index fallback now runs off the EDT under a read
  action and is guarded by try/catch; relative Windows-style paths are normalized,
  and VS Code glob metacharacters in basenames are escaped.
- Expected runtime behaviour: clicking a reference opens the file at the line;
  relative/bare names resolve against the workspace/project root with a basename
  fallback.

## Version Information

| Version |
|---|
| 0.1.0 |

## PR summary

**What type of PR is this?**
`/kind bug`

**What does this PR do / why do we need it**
Makes file references in assistant replies clickable by broadening the inline link
regex and resolving relative/bare paths in both IDE hosts.

**Which issue(s) this PR fixes**
Fixes #8627

**Branch / commits**

| Item | Value |
|---|---|
| Branch | `fix/ide-file-links` |
| Commit | `c78b9589b` `fix(ide): make file references in replies clickable`<br>`53207be72` `fix(ide): harden file link fallback lookups` |
| Merged into | `New-Features-Integration` (`a436bd7ff`, `4e611a0e7`) |
