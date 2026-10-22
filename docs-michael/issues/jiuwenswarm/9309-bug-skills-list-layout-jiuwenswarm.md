# [Bug][ide plugin]: Skills list overlay layout is broken / not adaptive — jiuwenswarm

## Executive Summary

The Skills overlay looked cramped and did not adapt to the panel width: long skill
names/descriptions were forced onto one line and squeezed the ON/OFF button.

Root cause: the overlay and the `#` skill picker share the `.skill-item` class. The
picker's CSS was global and appears later in the stylesheet, so its
`white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 5px`
overrode the overlay's flex layout.

The fix scopes the picker rules under `#skill-popup` and makes overlay items wrap and
stay within the panel width.

Issue #8462 https://github.com/openJiuwen-ai/jiuwenswarm/issues/8462<br>
PR #9309 https://github.com/openJiuwen-ai/jiuwenswarm/pull/9309<br>
Paired: [GitCode #5309](https://gitcode.com/openJiuwen/jiuwenswarm/issues/5309)

## 🐞 Detailed Description of the Problem

Reproduction:

1. `☰` menu → Skills.
2. Observe the list, especially skills with long names/descriptions or a narrow panel.

Actual: items are cramped/misaligned; text is cut to one line and the toggle button
is squeezed.

### Root cause

```css
/* global, loaded after the overlay rules */
.skill-item {
  padding: 5px 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

Because the selector was unscoped, it applied to the overlay's `.skill-item` too and
overrode the earlier flex layout (`display:flex`, `gap`, padding, etc.).

### Environment

| Item | Value |
|---|---|
| IDE | PyCharm (VS Code shares the webview) |
| OS | Windows |
| Module | `jiuwenswarm/channels/ide/packages/shared-webview/chat.html` |

## Solution

- Scope picker styles to `#skill-popup .skill-item` (including `:hover`, `.active`,
  `.sk-desc`).
- Overlay `.skill-item`: `align-items: flex-start`, `min-width: 0`,
  `box-sizing: border-box`.
- `.skill-name` / `.skill-trigger`: allow wrapping (`overflow-wrap: anywhere`,
  `word-break: break-word`).
- `.skill-desc`: wrap and clamp to 2 lines via `-webkit-line-clamp`.

### Compatibility

CSS-only. The `#` picker keeps its compact single-line ellipsis style; the overlay
keeps its flex layout and wrapping behaviour.

## Verification

- `npm run build` (VS Code extension, copies `shared-webview/chat.html`) passes.
- Generated `resources/chat.html` contains the scoped `#skill-popup .skill-item`
  rules and the adaptive overlay styles.
- Expected runtime behaviour: names/descriptions wrap within the panel, the toggle
  button stays aligned, and the picker is unchanged.
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
Scopes the skill-picker CSS and makes the Skills overlay list adaptive (wrapping,
min-width and alignment).

**Which issue(s) this PR fixes**
Fixes #8462

**Branch / commits**

| Item | Value |
|---|---|
| Branch | `fix/ide-skills-list-layout` |
| Commit | `de21d09e7` `fix(ide): scope skill picker styles and make skills list adaptive` |
| Merged into | `New-Features-Integration` (`073ef5abe`) |
