# [Bug][ide plugin]: Skills enable/disable switch does nothing — jiuwenswarm

## Executive Summary

In the IDE Skills list, clicking a skill's ON/OFF switch had no effect.

The feature itself exists: `skills.toggle` persists the `enabled` flag via
`set_skill_enabled` (`skills_state.json`) and `skills.list` returns it. The bug was
the identifier: the IDE sent `skill_id`, but the API expects `name`. Local/builtin
skills often have an empty `skill_id`, so the toggle was a no-op and the optimistic
UI updated the wrong (first) item.

Issue #8476 https://github.com/openJiuwen-ai/jiuwenswarm/issues/8476<br>
PR #9308 https://github.com/openJiuwen-ai/jiuwenswarm/pull/9308<br>
Paired: [GitCode #5313](https://gitcode.com/openJiuwen/jiuwenswarm/issues/5313)

## 🐞 Detailed Description of the Problem

Reproduction:

1. `☰` menu → Skills.
2. Click a skill's enable/disable switch.

Expected: the skill toggles and the state persists.
Actual: nothing happens.

### Root cause

- `skills.toggle` reads `params["name"]` and returns
  `{"success": false, "detail": "缺少参数: name"}` when it is missing.
- The IDE sent `{ skill_id, enabled }` (see `toggleSkill` in both hosts).
- `skills.list` entries may have an empty `skill_id`; the optimistic update matched by
  `skill_id`, so it toggled the first entry rather than the clicked one.
- The hosts ignored `success: false` and still posted `skill_toggled`.

### Environment

| Item | Value |
|---|---|
| IDE | PyCharm (VS Code shares the webview) |
| OS | Windows |
| Module | `jiuwenswarm/channels/ide/packages/shared-webview/chat.html` + both hosts |
| API | `skills.toggle` expects `name` |

## Solution

- Webview `skillKey(skill) = skill.skill_id || skill.name`; the toggle button uses it
  as the stable key, sends both `skillId` and `name`, and matches optimistic updates
  by the same key.
- VS Code `SessionManager.toggleSkill(name, enabled)` sends `{ name, enabled }` and
  returns the response payload.
- JetBrains `SessionManager.toggleSkill(name, enabled)` sends `{ name, enabled }` and
  returns the response `JsonObject`.
- Hosts check `success === false` and post `skills_error` with the backend detail
  instead of reporting a successful toggle.
- Review follow-up: removed the two stray closing braces in the JetBrains
  `toggle_skill` branch that broke `compileKotlin`.
- Review follow-up: replaced the inline `onclick` with an escaped
  `data-skill-key` attribute and delegated click handling on `#skills-list`,
  avoiding HTML-attribute injection through skill names.

### Compatibility

No API/backend change. `skills.toggle` already exists and is persisted. Skills with a
non-empty `skill_id` keep working; empty-id skills now toggle by name.

## Verification

- VS Code: `npx tsc --noEmit` → exit 0; `npm run build` → build complete.
- JetBrains: the same Kotlin changes compiled and packaged with
  `./gradlew buildPlugin` → `BUILD SUCCESSFUL`; the review-blocking brace error is
  fixed and `compileKotlin` passes.
- Webview: a regression test with a skill name containing quotes verifies the
  toggle is delegated correctly and no extra HTML attribute is injected.
- Expected runtime behaviour: clicking ON/OFF persists the state and the list reflects
  the server-confirmed value; backend failures surface as an error.
- NFI merge was clean after resolving the `updateSkills` conflict in favour of the
  delegated data-attribute handler.

## Version Information

| Version |
|---|
| 0.1.0 |

## PR summary

**What type of PR is this?**
`/kind bug`

**What does this PR do / why do we need it**
Sends the skill `name` to `skills.toggle` (instead of `skill_id`), keys the UI by
name, and surfaces backend toggle failures.

**Which issue(s) this PR fixes**
Fixes #8476

**Branch / commits**

| Item | Value |
|---|---|
| Branch | `fix/ide-skill-toggle` |
| Commit | `d0c3b2fa3` `fix(ide): toggle skills by name`<br>`c2c68ab8c` `fix(ide): fix skill toggle braces and DOM injection` |
| Merged into | `New-Features-Integration` (`07844e702`, `40b3e8a08`) |
