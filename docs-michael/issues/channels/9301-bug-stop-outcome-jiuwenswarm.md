# [Bug][ide plugin]: Stop during streaming shows `completed` instead of `stopped` — jiuwenswarm

## Executive Summary

Clicking the `■` stop button while the assistant was streaming produced a
**completed** (blue) outcome badge instead of **stopped** (gray), although the
partial text was kept.

Root cause: the stop click finalizes the turn locally with `{ stopped: true }`, but
the server's `chat.final` can be processed around the same time. When that final is
finalized first (or arrives without a `stopped` field), `classifyOutcome()` sees
`hasFinal` and no stop marker and reports `completed`. The stop marker existed only
in the synthetic local finalize payload, so a racing server final lost it.

The fix records the stop intent on the specific turn (`pt.stopRequested`) and
classifies that turn as `stopped` even if the server final races the click. The
intent is cleared if the user answers a pending interrupt and resumes the turn, so a
completed turn is not misclassified.

Issue #8742 https://github.com/openJiuwen-ai/jiuwenswarm/issues/8742<br>
PR #9301 https://github.com/openJiuwen-ai/jiuwenswarm/pull/9301<br>
Paired: [GitCode #5437](https://gitcode.com/openJiuwen/jiuwenswarm/issues/5437)

## 🐞 Detailed Description of the Problem

Reproduction:

1. Send a query and wait for streaming to start (some text already visible).
2. Click the `■` stop button.

Expected: the turn footer badge shows `stopped` (gray) and the streamed text stays.
Actual: the badge shows `completed` (blue).

### Root cause

`finalizeTurn()` classifies the turn with `classifyOutcome()`:

```js
if (pt.hasError)   return 'error';
if (pt.stopped)    return 'stopped';
if (!pt.hasFinal)  return 'no_response';
if (pt.toolErrorCount > 0) return 'completed_with_issues';
return 'completed';
```

`pt.stopped` was only set from the `payload.stopped` of the local stop finalize
(`finalizeTurn(rid, { stopped: true })`). If the server's `chat.final` raced the
click and finalized the turn without `stopped`, the badge became `completed`.

### Environment

| Item | Value |
|---|---|
| IDE | PyCharm (VS Code shares the webview) |
| OS | Windows |
| Module | `jiuwenswarm/channels/ide/packages/shared-webview/chat.html` |

## Solution

- Store `stopRequested` on the pending turn object when the user clicks `■`.
- In `finalizeTurn()`: `if (payload.stopped || pt.stopRequested) pt.stopped = true;`
- Clear `pt.stopRequested`/`pt.stopped` in `sendAnswerForInterrupt()` when the user
  chooses to resume a pending question, so that turn can finish as `completed`.
- Streamed text is untouched; only the outcome classification changes.

### Compatibility

No API/backend change. Non-stopped turns are unaffected because the stop intent is
per-turn and only set by the stop button.

## Verification

- `npm run build` (VS Code extension, copies `shared-webview/chat.html`) passes.
- Generated `resources/chat.html` contains the per-turn `stopRequested` flag and the
  `payload.stopped || pt.stopRequested` guard.
- Expected runtime behaviour: stopping mid-stream yields a gray `stopped` badge even
  if the server final races the local stop; partial text remains visible. A turn
  resumed via an interrupt answer remains `completed`.
- The JetBrains plugin copies the same webview at `processResources`, so both IDEs
  receive the fix.

## Version Information

| Version |
|---|
| 0.1.0 |

## PR summary

**What type of PR is this?**
`/kind bug`

**What does this PR do / why do we need it**
Tracks that the user requested a stop and classifies the turn as stopped even when the
server's final arrives around the same time.

**Which issue(s) this PR fixes**
Fixes #8742

**Branch / commits**

| Item | Value |
|---|---|
| Branch | `fix/ide-stop-outcome` |
| Commit | `38a5b0ee7` `fix(ide): classify stopped turns correctly on stop click`<br>`e31cc7e8f` `fix(ide): scope stop intent to the stopped turn` |
| Merged into | `New-Features-Integration` (`352c6e790`, `fa0ddeefd`) |
