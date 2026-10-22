# [Bug][ide plugin]: Resend (`↺`) button is not visually prominent — jiuwenswarm

## Executive Summary

Hovering a user message in the IDE chat panel showed the `↺` resend control, but it
was a 10px, borderless glyph at 60% opacity, so it was easy to miss.

This is a UI/design issue rather than a functional failure. The fix turns it into a
clear compact pill with a background, border, larger glyph and stronger hover state,
aligned under the user bubble.

Issue #8636 https://github.com/openJiuwen-ai/jiuwenswarm/issues/8636<br>
PR #9304 https://github.com/openJiuwen-ai/jiuwenswarm/pull/9304<br>
Paired: [GitCode #5390](https://gitcode.com/openJiuwen/jiuwenswarm/issues/5390)

## 🐞 Detailed Description of the Problem

Reproduction:

1. Install the plugin and start a conversation.
2. Hover over a user message.

Expected: the resend action is clearly discoverable.
Actual: a tiny `↺` glyph appears faintly below the bubble; easy to overlook.

### Root cause

`.resend-btn` used `background: none`, `border: none`, `font-size: 10px`,
`padding: 0`, and `opacity: 0.6` when the message was hovered. It had no shape or
contrast against the chat background.

### Environment

| Item | Value |
|---|---|
| IDE | PyCharm and VS Code |
| OS | Windows |
| Module | `jiuwenswarm/channels/ide/packages/shared-webview/chat.html` |

## Solution

Restyle `.resend-btn` as a compact pill:

- `background: var(--bg3)`, `border: 1px solid var(--border)`
- `font-size: 12px`, `padding: 2px 7px`, `border-radius: 10px`
- `align-self: flex-end` (right under the user bubble)
- visible at ~95% opacity on message hover (was 60%)
- fully opaque with accent border/text on direct hover
- transitions on opacity/color/border/background

### Compatibility

CSS-only change; the click handler and resend behavior are unchanged.

## Verification

- `npm run build` (VS Code extension, copies `shared-webview/chat.html`) passes.
- Generated `resources/chat.html` contains the new `.resend-btn` styles.
- Expected visual result: the resend control is clearly visible on hover, aligned
  with the user bubble and highlighted on direct hover.
- The JetBrains plugin copies the same webview at `processResources`, so both IDEs
  receive the change.

## Version Information

| Version |
|---|
| 0.1.0 |

## PR summary

**What type of PR is this?**
`/kind bug`

**What does this PR do / why do we need it**
Makes the hover-only resend control visually prominent (pill shape, border,
background, larger glyph, stronger hover state).

**Which issue(s) this PR fixes**
Fixes #8636

**Branch / commits**

| Item | Value |
|---|---|
| Branch | `fix/ide-resend-button` |
| Commit | `550e3aa9e` `fix(ide): make the resend button more visible` |
| Merged into | `New-Features-Integration` (`753842c7c`) |
