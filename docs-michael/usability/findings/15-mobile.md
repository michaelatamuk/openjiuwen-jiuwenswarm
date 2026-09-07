[← Index](../README.md) · jiuwenswarm Usability Review

---

# §15 · Mobile & Cross-Platform

*Using jiuwenswarm on a phone or tablet.*

*Primary persona: P1. Also relevant to: P13.*

---

## 15.1 Mobile Layout Exists But Is Not a First-Class Experience

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

## 15.2 No Native App (PWA) Support

**Current state.**
The Web UI is a standard React SPA. No `manifest.json`, no service worker, no
offline support, no install-to-homescreen capability.

**What good looks like.**
A Progressive Web App manifest that allows users to install jiuwenswarm to their
phone homescreen. Service worker for offline mode (read past conversations, queue
messages to send when reconnected). Push notification support for task completion.
