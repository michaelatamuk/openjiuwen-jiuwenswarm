# [Bug][ide plugin]: Team Coding — continuing after a round returns an empty assistant reply — jiuwenswarm

## Executive Summary

In Team Coding mode, after a round finished, the next interaction could show an
empty assistant bubble. The IDE plugin's chat webview only rendered assistant text
from streamed `chat.delta` chunks. In team mode the leader's answer can arrive only
in the `chat.final` payload, and/or under a different request id than the
`chat.send` turn, so nothing was rendered.

The fix renders `chat.final` content when no deltas were streamed, falls back to the
latest live turn when the request id differs, and unwraps `team.leader:` /
leader-to-user `team.event:` payloads before display.

Issue #8869 https://github.com/openJiuwen-ai/jiuwenswarm/issues/8869<br>
PR #9296 https://github.com/openJiuwen-ai/jiuwenswarm/pull/9296

## 🐞 Detailed Description of the Problem

Reproduction:

1. Install the plugin and select **Team Coding**.
2. Ask two members to create `a.py` / `b.py` in parallel.
3. After the round completes, send another message.

Expected: the assistant replies. Actual: the assistant bubble is empty.

### Root cause

In `jiuwenswarm/channels/ide/packages/shared-webview/chat.html`,
`finalizeTurn()` built the turn's final text from `pt.textContent`
(streamed deltas) and never rendered `payload.content`:

```js
const finalText = (pt.textContent ? pt.textContent.trim() : '')
  || (payload && payload.content ? String(payload.content).trim() : '')
  || '';
```

That value was only stored as a timeline event; the assistant bubble stayed empty.
Additionally, the final could arrive with a request id different from the pending
`chat.send` turn, so `state.pendingTurns[rid]` was `undefined`.

### Environment

| Item | Value |
|---|---|
| IDE | PyCharm and VS Code |
| Mode | Team Coding |
| OS | Windows |
| Module | `jiuwenswarm/channels/ide/packages/shared-webview/chat.html` |

## Solution

- Added `displayTextFromFinalPayload()`: extracts `chat.final.content`, unwrapping
  `team.leader:{...}` and leader-to-user `team.event:{...}` payloads.
- `finalizeTurn()` now falls back to `getActivePendingTurn()` when the request id
  does not match and the payload has content.
- When the turn has no streamed text, the payload text is rendered into the
  assistant bubble and used for the `final` timeline entry.

```js
let pt = state.pendingTurns[rid];
if (!pt && payload && typeof payload.content === 'string' && payload.content.trim()) {
  pt = getActivePendingTurn();
}
...
const finalPayloadText = displayTextFromFinalPayload(payload);
if (!String(pt.textContent || '').trim() && finalPayloadText.trim()) {
  // append finalSpan to pt.streamEl, set pt.textContent
}
```

### Compatibility

Agent-mode turns that already stream text are unchanged: final content is only
rendered when the bubble is empty. No wire protocol or external interface change.

## Verification

- `npm run build` (VS Code extension, copies `shared-webview/chat.html`) passes.
- Generated `resources/chat.html` contains `displayTextFromFinalPayload()` and the
  final-content fallback.
- Expected runtime behaviour: a team turn that only delivers `chat.final` now shows
  the leader's text instead of an empty bubble; `team.leader:` / `team.event:`
  wrappers are unwrapped.
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
Renders `chat.final` content in the IDE chat transcript when no deltas streamed, so
Team Coding turns are not left with an empty assistant reply.

**Which issue(s) this PR fixes**
Fixes #8869

**Branch / commits**

| Item | Value |
|---|---|
| Branch | `fix/ide-team-final-content` |
| Commit | `b6aa94d66` `fix(ide): render team final content in chat transcript` |
| Merged into | `New-Features-Integration` (`13a841b2e`) |
