# [Bug][ide plugin]: Team Coding — leader's task result is not shown after all members finish — jiuwenswarm

## Executive Summary

In Team Coding mode, after all members completed their tasks, the leader's
result/feedback did not appear in the IDE chat transcript, although the same session
in the WebUI shows it.

The IDE plugin intercepted every team event and sent it only to the Swarm Map, then
returned early. User-facing team messages (`team.message` / `team.event` from
`team_leader`, or a p2p message to `user`) were therefore never forwarded to the
chat. The fix mirrors the WebUI predicate and forwards those messages to the
webview, which appends them to the live assistant turn.

Issue #8864 https://github.com/openJiuwen-ai/jiuwenswarm/issues/8864<br>
PR #9297 https://github.com/openJiuwen-ai/jiuwenswarm/pull/9297

## 🐞 Detailed Description of the Problem

Reproduction:

1. Install the plugin and select **Team Coding**.
2. Ask two members to create `a.py` / `b.py` in parallel.
3. Wait for all members to finish.

Expected: the leader reports the result in the transcript.
Actual: the transcript has no leader feedback (the WebUI does show it).

### Root cause

`ChatPanel.onJiuwenMessage()` consumed team events for the Swarm Map and stopped:

```ts
const rawTeamEvent = this.extractTeamEventDelta(msg);
if (rawTeamEvent !== null) {
  this.swarmStateManager.applyTeamEvent(rawTeamEvent);
  ...
  return;   // never reaches the chat transcript
}
```

The WebUI additionally renders user-facing team events as chat messages
(`teamEventUtils.parseTeamEventMessage`): leader-to-user
(`from_member === "team_leader"` and not p2p/broadcast) and
`team.message.p2p` with `to_member === "user"`.

### Environment

| Item | Value |
|---|---|
| IDE | PyCharm and VS Code |
| Mode | Team Coding |
| OS | Windows |
| Module | `jiuwenswarm/channels/ide/packages/vscode-extension` + `shared-webview/chat.html` |

## Solution

- `ChatPanel.ts`: added `extractUserFacingTeamMessage()` (same predicate as the
  WebUI) and forward such messages to the webview as `team_message`.
- `protocol.ts`: added `team_message` to `ExtToWebviewMsg`.
- `shared-webview/chat.html`: handle `team_message` via
  `appendTeamLeaderMessage()`, which appends the text to the active assistant turn
  and skips content already present (no duplicates with streamed/final text).

```ts
const teamText = this.extractUserFacingTeamMessage(rawTeamEvent);
if (teamText) {
  this.postToWebview({ type: 'team_message', content: teamText });
}
```

### Compatibility

Swarm Map behaviour is unchanged; only user-facing messages are also copied into
the transcript. Member-to-member traffic is not added to the chat.

## Verification

- `npx tsc --noEmit` → exit 0.
- `npm run build` → build complete; updated webview copied to `resources/`.
- Expected runtime behaviour: leader feedback after members finish is appended to the
  assistant turn; duplicate text is suppressed; p2p member-to-member messages stay
  out of the chat.
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
Forwards leader-to-user / p2p-to-user team messages to the IDE chat transcript so the
leader's task result is visible after all members finish.

**Which issue(s) this PR fixes**
Fixes #8864

**Branch / commits**

| Item | Value |
|---|---|
| Branch | `fix/ide-team-leader-message` |
| Commit | `d74cef34b` `fix(ide): forward team leader messages to chat transcript` |
| Merged into | `New-Features-Integration` (`d97964ed8`) |
