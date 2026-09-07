[← Index](../../README.md) · jiuwenswarm Usability Review

---

# Accessibility & Keyboard

*Operating the UI regardless of ability.*

---

## 1 The UI can't be driven fully by keyboard

**Current state.**
Tab focus traversal, arrow key navigation in lists, and keyboard activation of
buttons have not been verified. The React component library used (`shadcn/ui`,
`lucide-react`) supports accessibility, but it requires implementation discipline
in the consuming components.

**What good looks like.**
Every interactive element — session list items, skill cards, settings toggles,
tool call expand buttons — should be reachable and operable by keyboard. Focus
indicators should be visible. `ConversationSidebar` session items should support
arrow-key navigation.

---

## 2 No screen-reader support; streaming output isn't announced

**Current state.**
No `aria-label`, `aria-live` regions for streaming content, or `role` attributes
are visible in the explored code. Streaming text in `StreamingContent.tsx` has no
`aria-live="polite"` region, so screen readers would not announce new content.

**What good looks like.**
- The streaming output area should be an `aria-live="polite"` region.
- Tool call status changes should announce via `aria-live="assertive"` when
  a tool succeeds or fails.
- All icon-only buttons should have `aria-label`.
- A one-time accessibility audit (axe-core, Lighthouse) to surface the full list.

---

## 3 No high-contrast or large-text option

**Current state.**
The UI has a light/dark mode. No high-contrast theme, no font size controls, no
zoom-safe layout testing documented.

**What good looks like.**
Respect the OS `prefers-contrast: more` and `prefers-reduced-motion` media queries.
Use relative font units (`rem`) throughout so browser font size preferences apply.

---

## 4 Core actions have no keyboard shortcuts

**Current state.**
No documented keyboard shortcuts exist in the Web UI. The chat input handles `Enter`
to submit, but actions like "new conversation", "stop agent", "switch mode", "open
settings", and "focus input" have no keyboard access.

**What good looks like.**
A small keybindings layer with at minimum:
- `Ctrl+K` / `Cmd+K` — new conversation
- `Escape` — stop/interrupt agent
- `Ctrl+/` / `Cmd+/` — command palette
- `Ctrl+,` / `Cmd+,` — open settings
- Arrow keys to navigate session list when focused

A `?` key or `Shift+?` that opens a keybindings reference overlay.

---

