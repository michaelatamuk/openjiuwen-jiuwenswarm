[← Index](../../README.md) · jiuwenswarm Usability Review

---

# Mobile & Cross-Device

*Using jiuwenswarm on a phone or tablet.*

---

## 1 The web UI isn't usable as a proper mobile experience

**Current state.**
`useResponsive.ts` implements breakpoints and `isMobile` detection. The
`ConversationSidebar` collapses and floats on small screens. The `useResponsivePanelResize`
hook mutually excludes team and single-agent panels. Breakpoints at 1130px, 1000px,
and 800px are defined.

**What good looks like.**
Mobile should be treated as a real use case, not a fallback. The Feishu and Telegram
channels mean users are on mobile frequently. The Web UI should be fully usable on
a 375px viewport: input area docked to bottom, conversation fills viewport, panels
accessible via bottom sheet or drawer. The current panel architecture (left sidebar +
chat + right panel) collapses poorly to mobile.

---

## 2 No installable or offline (PWA) version

**Current state.**
The Web UI is a standard React SPA. No `manifest.json`, no service worker, no
offline support, no install-to-homescreen capability.

**What good looks like.**
A Progressive Web App manifest that allows users to install jiuwenswarm to their
phone homescreen. Service worker for offline mode (read past conversations, queue
messages to send when reconnected). Push notification support for task completion.

---
