# [Bug][ide plugin]: Rejecting a plan leaves the IDE stuck in streaming mode — jiuwenswarm

## Executive Summary

In Plan & Execute mode, clicking **Reject** on the plan approval card left the turn
stuck: the stop (`■`) icon remained, the input stayed disabled, clicking `■` did not
return the send arrow, and no further turn could be started.

Root cause: the WebUI sends `plan_skip` for "Reject" (no revision), which makes
`PlanApprovalInterruptRail` call `request_force_finish()` and end the turn. The IDE
rendered the generic `approve` / `reject` options and sent `reject`, which maps to a
generic `RejectResult` instead of `plan_skip`, so the agent stayed in plan mode and
no turn-finishing final was produced. The webview remained in streaming state. If no
pending turn was left, the stop button's finalize loop also did nothing.

Issue #8755 https://github.com/openJiuwen-ai/jiuwenswarm/issues/8755<br>
PR #9300 https://github.com/openJiuwen-ai/jiuwenswarm/pull/9300

## 🐞 Detailed Description of the Problem

Reproduction:

1. PyCharm plugin, **Plan & Execute** mode.
2. Ask the agent to read the project and prepare a plan for creating `core.py`,
   without executing it.
3. Click **Reject** on the plan approval card.

Expected: the round ends normally and the next turn can be started.
Actual: the `■` stop icon stays, the input is disabled, and clicking `■` does not
switch it back to the send arrow.

### Root cause

- Backend `interface.py` maps answer values:
  - `plan_execute` → approved plan execution
  - `plan_skip` → `{"approved": False, "plan_skip": True}` and the rail calls
    `request_force_finish(...)`
  - `plan_revise` → reject with revision feedback
  - a plain `reject` → generic `RejectResult` (stay in plan mode)
- The IDE's generic question card has only `approve` / `reject`; it sent `reject`,
  so the plan was not "skipped" and no final ended the turn.
- `finalizeTurn()` deliberately ignores a premature final while an interrupt is
  unanswered. With no later final, `state.streaming` stayed `true`.
- If `state.pendingTurns` was empty by then, the stop-button handler finalized
  nothing and never called `setStreaming(false)`.

### Environment

| Item | Value |
|---|---|
| IDE | PyCharm (VS Code shares the webview) |
| Mode | Plan & Execute |
| OS | Windows |
| Module | `jiuwenswarm/channels/ide/packages/shared-webview/chat.html` |

## Solution

In `shared-webview/chat.html`:
- Capture `plan_approval_kind` on the pending turn when rendering the question card.
- Add `mapInterruptAnswerValue()`: for `plan_approval`, map only `reject` →
  `plan_skip`. `approve` is left unchanged because the IDE does not send the WebUI's
  follow-up "execute" message; `plan_execute` would end the turn without implementing
  the plan.
- Stop (`■`) force-finalizes turns waiting on an interrupt by setting
  `questionAnswered = true`, disables the question card buttons, and unconditionally
  calls `setStreaming(false)` when no live turn remains.
- `sendAnswerForInterrupt()` ignores clicks from a card whose turn is no longer
  pending.

```js
function mapInterruptAnswerValue(pt, value) {
  if (pt && pt.planApprovalKind === 'plan_approval' && value === 'reject') {
    return 'plan_skip';
  }
  return value;
}
```

### Compatibility

No API/backend change. Non-plan questions keep their original values. Approve keeps
the existing ALLOW_ONCE behavior; reject now matches the WebUI's skip behavior.

## Verification

- `npm run build` (VS Code extension, copies `shared-webview/chat.html`) passes.
- Generated `resources/chat.html` contains `mapInterruptAnswerValue`, the
  `planApprovalKind` capture, and the stop-button fallback.
- Expected runtime behaviour: Reject sends `plan_skip`; the rail force-finishes the
  turn; streaming clears and the input is usable. Approve continues to use the normal
  ALLOW_ONCE path. Stop (`■`) releases the UI even if no pending turn is tracked, and
  stale question-card clicks are ignored.
- Regression test: approve sends `approve`, reject sends `plan_skip`, and a stopped
  question card is disabled and cannot send an answer.
- The JetBrains plugin copies the same webview at `processResources`, so PyCharm and
  VS Code both receive the fix.

## Version Information

| Version |
|---|
| 0.1.0 |

## PR summary

**What type of PR is this?**
`/kind bug`

**What does this PR do / why do we need it**
Makes plan Reject send `plan_skip` (like the WebUI) and hardens the stop button so a
turn waiting on an interrupt cannot leave the IDE stuck in streaming mode.

**Which issue(s) this PR fixes**
Fixes #8755

**Branch / commits**

| Item | Value |
|---|---|
| Branch | `fix/ide-plan-reject-stuck` |
| Commit | `29aca1a6a` `fix(ide): finish plan approval turn on reject`<br>`0f721b2dc` `fix(ide): keep approve path and guard stopped question cards` |
| Merged into | `New-Features-Integration` (`3ffa2bb17`, `40bb4551a`) |
