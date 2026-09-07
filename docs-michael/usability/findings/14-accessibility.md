[← Index](../README.md) · jiuwenswarm Usability Review

---

# §14 · Accessibility

*Can all users operate the product regardless of ability?*

---

## 14.1 No Keyboard Navigation Across the UI

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

## 14.2 No Screen Reader Support Audit

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

## 14.3 No High-Contrast or Large-Text Mode

**Current state.**
The UI has a light/dark mode. No high-contrast theme, no font size controls, no
zoom-safe layout testing documented.

**What good looks like.**
Respect the OS `prefers-contrast: more` and `prefers-reduced-motion` media queries.
Use relative font units (`rem`) throughout so browser font size preferences apply.
