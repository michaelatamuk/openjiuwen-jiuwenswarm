# Slide for Bot-hoster

> Light spec: put the big line + cards on the slide; the findings stay in notes. One slide, one message, nothing crowded.

## On the slide

**Bot-hoster** — Runs one instance as a shared bot a group talks to.

### Cards (the body)

- **Identity & Isolation** — no login or per-user isolation
- **Shared Skill Library** — no shared skill library across instances
- **Rate Limiting & Quotas** — no per-user rate limits or quotas

## Speaker notes

Maintains a bot a group uses; no multi-tenancy means all its users share one identity.
