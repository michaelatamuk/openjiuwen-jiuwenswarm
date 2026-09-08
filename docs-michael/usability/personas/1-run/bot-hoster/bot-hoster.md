# Bot-hoster

*Runs one jiuwenswarm as a shared bot that a group talks to (Feishu/Telegram/WeChat) and keeps it working for them — one person maintaining the group's bot, not everyone self-hosting.*

Because jiuwenswarm has no login or multi-tenancy, all the group's users currently share one identity and workspace; per-user isolation/limits would need those capabilities.

## Findings that matter to them

*3 findings.*

### Identity & Isolation

- **[No login on the Web UI: local Web users share one identity](findings/collaboration/identity-and-isolation/1-no-login-on-the-web-ui-local-web-users-share-one-identity.md)**
- **[No multi-tenancy: every user shares one workspace](findings/collaboration/identity-and-isolation/2-no-multi-tenancy-every-user-shares-one-workspace.md)**
### Shared Skill Library

- **[No shared skill library across instances](findings/collaboration/shared-library/1-no-shared-skill-library-across-instances.md)**

### Rate Limiting & Quotas

*No findings yet.*
