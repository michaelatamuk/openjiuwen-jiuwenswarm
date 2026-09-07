[← Index](README.md) · jiuwenswarm Usability Review

---

# Findings by Persona — Matrix

Which findings affect which persona. Findings are identified per concern file; their local number and title are shown. Full text lives in the file linked from [README.md](README.md).

| File | # | Title | Web User | Instance Admin | Extension | Application | Skill Author | Shared Bot Admin |
|---|---|---|---|---|---|---|---|---|---|
| 1-error-messages-give-no-explanation-or-next-step | 1 | Error messages give no explanation or next step | ● |  |  |  |  |  |
| 2-no-way-to-rate-retry-or-correct-an-agent-answer | 2 | No way to rate, retry or correct an agent answer | ● |  |  |  |  |  |
| explanation | 1 | Agent reasoning is hidden in a separate panel | ● |  |  |  |  |  |
| explanation | 2 | Tool calls show what ran but not why | ● |  |  |  |  |  |
| explanation | 3 | Subagents work invisibly with no progress view | ● |  |  |  |  |  |
| explanation | 4 | Clarification questions appear with no context | ● |  |  |  |  |  |
| messages-and-history | 1 | Past conversations can't be searched | ● |  |  |  |  |  |
| messages-and-history | 2 | No notification when a long task finishes | ● |  |  | ○ |  |  |
| messages-and-history | 3 | Background tasks look identical to idle sessions | ● |  |  |  |  |  |
| messages-and-history | 4 | Conversations can only be shared as a flat image | ● |  |  |  |  | ○ |
| output-and-speed | 1 | No control over reply length or writing style | ● |  |  |  |  |  |
| output-and-speed | 2 | Long agent replies have no structure aids | ● |  |  |  |  |  |
| output-and-speed | 3 | Nothing is shown while waiting for the first token | ● |  |  |  |  |  |
| output-and-speed | 4 | No warning before the context limit drops early memory | ● |  |  |  |  |  |
| output-and-speed | 5 | Long-running skills show no progress | ● |  |  |  |  |  |
| approve-and-preview | 1 | File changes are applied with no preview or approval | ● |  |  |  |  |  |
| approve-and-preview | 2 | Destructive external actions fire without confirmation | ● | ○ |  |  |  | ○ |
| permissions | 1 | Users aren't told what the agent is allowed to do before it acts | ● | ○ |  |  |  | ○ |
| stop-resume-undo | 1 | No stop button that safely interrupts the agent | ● |  |  |  |  |  |
| stop-resume-undo | 2 | Agent file writes and sends can't be undone | ● |  |  |  |  |  |
| stop-resume-undo | 3 | Unclear what the agent does when a session disconnects | ● | ○ |  |  |  |  |
| stop-resume-undo | 4 | A crash loses in-progress tasks with no way to resume | ● | ○ |  |  |  |  |
| memory-visibility | 1 | Users can't see what the agent has remembered | ● |  |  |  |  |  |
| memory-visibility | 2 | No way to see what personal data is sent to the model | ● |  |  |  |  |  |
| retention | 1 | Data is kept indefinitely with no expiry controls | ○ | ● |  |  |  |  |
| diagnostics-and-help | 1 | No single command to gather diagnostics for a bug report | ● | ○ |  |  |  |  |
| diagnostics-and-help | 2 | Errors don't point to the log entry with more detail | ● | ○ |  |  |  |  |
| diagnostics-and-help | 3 | No help or tooltips at the point of confusion | ● |  |  |  |  |  |
| economics | 1 | No visibility into token usage or session cost | ○ | ● |  |  |  |  |
| economics | 2 | No hints about what is consuming the context | ○ | ● |  |  |  |  |
| health-and-degradation | 1 | Degraded subsystems fail silently and users assume all is fine | ● | ○ |  |  |  |  |
| health-and-degradation | 2 | Rate limits and API failures hang or show nothing useful | ● |  |  |  |  |  |
| run-and-manage | 1 | No visibility into which ports and URLs are in use |  | ● |  |  |  |  |
| run-and-manage | 2 | Powerful features exist but are never surfaced |  | ● |  |  |  |  |
| run-and-manage | 3 | Logs and config mix languages unpredictably |  | ● |  |  |  |  |
| run-and-manage | 4 | Upgrading can silently break an existing config |  | ● |  |  |  |  |
| run-and-manage | 5 | Documentation is scattered with no guide for common tasks |  | ● |  |  |  |  |
| run-and-manage | 6 | Permission rules can only be edited in raw YAML |  | ● |  | ○ |  | ○ |
| startup-and-config | 1 | Wrong credentials surface only on the first chat, never at startup |  | ● |  |  |  |  |
| startup-and-config | 2 | The config file has no validation or check tool |  | ● |  |  |  |  |
| startup-and-config | 3 | Missing optional extras fail when used, not at startup |  | ● |  |  |  |  |
| startup-and-config | 4 | Setup ends before credentials are tested |  | ● |  |  |  |  |
| empty-state-and-choosing | 1 | Empty screen offers no example or next step | ● |  |  |  |  |  |
| empty-state-and-choosing | 2 | Agent modes have no user-facing names or descriptions | ● |  |  |  |  |  |
| first-run | 1 | Setup wizard ends before the model is confirmed working | ● | ○ |  |  |  |  |
| first-run | 2 | Running the CLI without config gives no next step | ● | ○ |  |  |  |  |
| navigation-and-settings | 1 | Skills and connectors are split apart though they're the same kind of thing | ● |  |  |  |  |  |
| navigation-and-settings | 2 | Settings are organized by code module, not by user task | ● | ● |  |  |  |  |
| navigation-and-settings | 3 | The activity view is hidden behind an unclear name | ● |  |  |  |  |  |
| progressive | 1 | No guidance introduces features after first run | ● |  |  |  |  |  |
| accessibility | 1 | The UI can't be driven fully by keyboard | ● |  |  |  |  |  |
| accessibility | 2 | No screen-reader support; streaming output isn't announced | ● |  |  |  |  |  |
| accessibility | 3 | No high-contrast or large-text option | ● |  |  |  |  |  |
| accessibility | 4 | Core actions have no keyboard shortcuts | ● |  |  |  |  |  |
| mobile | 1 | The web UI isn't usable as a proper mobile experience | ● |  |  |  |  |  |
| mobile | 2 | No installable or offline (PWA) version | ● |  |  |  |  |  |
| authoring-and-testing | 1 | Creating a skill has no clear entry point | ● |  |  |  |  |  |
| authoring-and-testing | 2 | Skill Python dependencies and conflicts are invisible |  | ● |  |  | ○ |  |
| authoring-and-testing | 3 | Skills can only be tested through a live chat |  | ○ |  |  | ● |  |
| marketplace | 1 | Marketplace shows no ratings, usage or freshness | ○ | ● |  |  | ● |  |
| versioning | 1 | Skill updates can't be reviewed or rolled back |  | ● |  |  | ● |  |
| identity-and-isolation | 1 | All users share one identity, memory and permissions | ○ | ○ |  | ○ |  | ● |
| identity-and-isolation | 2 | No multi-tenancy: every user shares one workspace |  |  |  | ● |  | ● |
| shared-library | 1 | No shared skill library across instances |  | ○ |  |  | ○ | ● |
| documentation-and-stability | 1 | The examples directory is undiscoverable and inconsistent |  |  | ● |  |  |  |
| documentation-and-stability | 2 | No stable public API or semantic-versioning contract |  |  | ● | ○ |  |  |
| rails-and-context-api | 1 | The rail extension API has no public documentation |  |  | ● |  |  |  |
| rails-and-context-api | 2 | Rail hook execution order can only be learned from source |  |  | ● |  |  |  |
| rails-and-context-api | 3 | The hook context object is undocumented and untyped |  |  | ● |  |  |  |
| rails-and-context-api | 4 | Adding prompt content from a rail is an undocumented hidden API |  |  | ● |  |  |  |
| rails-and-context-api | 5 | The structured error API isn't documented for rail authors |  |  | ● |  |  |  |
| testing-and-tooling | 1 | Writing a rail test requires reverse-engineering mock infrastructure |  |  | ● |  |  |  |
| testing-and-tooling | 2 | No CLI to scaffold a new rail or skill |  |  | ● |  |  |  |
| testing-and-tooling | 3 | No integration test layer between unit tests and a full system |  |  | ● |  |  |  |
| tools-and-agent-factory | 1 | Registering tools from a rail has no developer guide |  |  | ● |  |  |  |
| tools-and-agent-factory | 2 | The agent factory has too many undocumented parameters |  |  | ● |  |  |  |
| integration-and-local-development | 1 | Writing a custom channel has no developer guide |  |  |  | ● |  |  |
| integration-and-local-development | 2 | Only shell-command hooks exist; there's no real webhook delivery |  |  |  | ● |  |  |
| integration-and-local-development | 3 | No local stub or dev mode for testing integrations |  |  |  | ● |  |  |
| security-and-isolation | 1 | The API has no authentication and is open by default |  | ○ |  | ● |  |  |
| security-and-isolation | 2 | WebSocket origin checks are off by default and undocumented |  | ○ |  | ● |  |  |
| transport-and-protocol | 1 | External apps can only reach the agent over WebSocket, with no REST |  |  |  | ● |  |  |
| transport-and-protocol | 2 | The E2A protocol spec is prose, not a machine-readable schema |  |  |  | ● |  |  |
| transport-and-protocol | 3 | No published client SDK, so every app re-implements the protocol |  |  |  | ● |  |  |
| transport-and-protocol | 4 | Session API methods have no documented response shapes |  |  |  | ● |  |  |

**Legend:** ● primary persona · ○ secondary persona
