# Slide for Bot-hoster

> Light spec: put the big line + cards on the slide; the findings stay in notes. One slide, one message, nothing crowded.

## On the slide

**Bot-hoster** — Runs one instance as a shared bot a group talks to.

### Cards (the body)

- **Identity & Isolation** — no login, no per-user isolation
- **Shared Skills** — no shared skill library across instances

## Speaker notes

Maintains a bot a group uses. Because there is no multi-tenancy, all its users share one identity/workspace.
