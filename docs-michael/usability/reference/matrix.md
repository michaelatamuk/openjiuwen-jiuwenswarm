[← Index](../README.md) · jiuwenswarm Usability Review

---

# Findings by Persona — Matrix

Quick-reference table for cross-persona navigation. Each finding ID is stable.
Full content is in the persona files linked in [README.md](README.md).

| Finding | Title | P1 | P2 | P3 | P4 | P5 | P6¹ | P13² |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **1.1** | Error messages give users nothing to act on | ● | | | | | | ○ |
| **1.2** | Mode naming is system-centric | ● | | | | | | |
| **1.3** | No structured feedback on responses | ● | | | | | | ○ |
| **1.4** | Skill creation entry point not obvious | ● | | | | | | |
| **1.5** | Conversation history not searchable | ● | | | | | | |
| **1.6** | No keyboard shortcuts | ● | | | | | | |
| **1.7** | No output length/style controls | ● | | | | | | |
| **1.8** | No undo for agent actions | ● | | | | | | |
| **1.9** | Long messages lack structure aids | ● | | | | | | |
| **2.1** | No startup validation | | ● | | | | | |
| **2.2** | Config file has no validation tool | | ● | | | | | |
| **2.3** | Powerful features invisible by default | | ● | | | | | |
| **2.4** | Onboarding ends before hard part | | ● | | | | | |
| **2.5** | Instance/port management confusing | | ● | | | | | |
| **2.6** | Permission system has no GUI | | ● | | ○ | | ○ | |
| **2.7** | Optional deps fail at runtime | | ● | | | | | |
| **2.8** | Documentation scattered | | ● | | | | | |
| **2.9** | Upgrade experience undefined | | ● | | | | | |
| **2.10** | Internationalization inconsistent | | ● | | | | | |
| **3.1** | No agent permission visibility before first action | ● | ○ | | | | ○ | |
| **3.2** | No diff/preview before file modify | ● | | | | | | |
| **3.3** | No task cancellation with defined semantics | ● | | | | | | ○ |
| **3.4** | No confirmation for destructive external actions | ● | ○ | | | | ○ | ○ |
| **4.1** | Graceful degradation is silent | ● | ○ | | | | | ○ |
| **4.2** | Session recovery after disconnect undefined | ● | ○ | | | | | ○ |
| **4.3** | Rate limiting and API failures opaque | ● | | | | | | |
| **4.4** | No persistent state for in-progress tasks | ● | ○ | | | | | |
| **5.1** | Setup wizard ends too early | ● | ○ | | | | | |
| **5.2** | Empty state has no direction | ● | | | | | | |
| **5.3** | No progressive onboarding after first use | ● | | | | | | |
| **5.4** | CLI first-run has no guidance | ● | ○ | | | | | |
| **6.1** | Thinking display hidden behind trajectory panel | ● | | | | | | |
| **6.2** | Tool calls shown but not explained | ● | | | | | | |
| **6.3** | Subagent activity not visible | ● | | | | | | |
| **6.4** | No explanation of why agent asked a question | ● | | | | | | ○ |
| **7.1** | No first-token latency indicator | ● | | | | | | ○ |
| **7.2** | No indication of context length pressure | ● | | | | | | |
| **7.3** | Skill execution has no progress feedback | ● | | | | | | |
| **8.1** | No notification when long tasks complete | ● | | | ○ | | | |
| **8.2** | No background task management | ● | | | | | | |
| **9.1** | No token or cost visibility | ○ | ● | | | | | |
| **9.2** | No optimization hints | ○ | ● | | | | | |
| **10.1** | Skill marketplace has no quality signals | ○ | ● | | | ● | | |
| **10.2** | No skill dependency management | | ● | | | ○ | | |
| **10.3** | No skill version management or rollback | | ● | | | ● | | |
| **10.4** | Skill testing has no infrastructure | | ○ | | | ● | | |
| **11.1** | No user identity or access control | ○ | ○ | | ○ | | ● | ○ |
| **11.2** | Conversation sharing is image-only | ● | | | | | ○ | |
| **11.3** | No shared skill library for teams | | ○ | | | ○ | ● | |
| **12.1** | No visibility into what is stored in memory | ● | | | | | | ○ |
| **12.2** | No indication of what agent sends to LLM | ● | | | | | | |
| **12.3** | No data retention policy UI | ○ | ● | | | | | |
| **13.1** | No in-context help | ● | | | | | | ○ |
| **13.2** | No diagnostic mode | ● | ○ | | | | | |
| **13.3** | Error messages don't reference log files | ● | ○ | | | | | ○ |
| **14.1** | No keyboard navigation across the UI | ● | | | | | | |
| **14.2** | No screen reader support audit | ● | | | | | | |
| **14.3** | No high-contrast or large-text mode | ● | | | | | | |
| **15.1** | Mobile layout not first-class | ● | | | | | | |
| **15.2** | No PWA support | ● | | | | | | |
| **16.1** | Skills and connectors separate but similar | ● | | | | | | |
| **16.2** | Settings organized by implementation not task | ● | ● | | | | | |
| **16.3** | Trajectory panel hidden and unnamed | ● | | | | | | |
| **17.1** | Rail API undocumented | | | ● | | | | |
| **17.2** | Hook execution order not discoverable | | | ● | | | | |
| **17.3** | AgentCallbackContext has no type stubs | | | ● | | | | |
| **17.4** | Tool registration has no developer guide | | | ● | | | | |
| **17.5** | create_deep_agent() too many undocumented params | | | ● | | | | |
| **17.6** | Examples directory not discoverable | | | ● | | | | |
| **17.7** | Testing a rail requires undocumented mock infra | | | ● | | | | |
| **17.8** | No stable public API / no semver contract | | | ● | ○ | | | |
| **17.9** | Prompt section API is hidden | | | ● | | | | |
| **17.10** | No scaffold CLI for new rail | | | ● | | | | |
| **17.11** | Error framework not exposed as developer API | | | ● | | | | |
| **17.12** | No integration test layer | | | ● | | | | |
| **18.1** | WebSocket-only API, no REST fallback | | | | ● | | | |
| **18.2** | E2A protocol in markdown, not machine-readable | | | | ● | | | |
| **18.3** | No published client SDK | | | | ● | | | |
| **18.4** | Authentication not enforced — open by default | | ○ | | ● | | | |
| **18.5** | WebSocket origin checking disabled by default | | ○ | | ● | | | |
| **18.6** | No multi-tenancy | | | | ● | | ● | |
| **18.7** | Custom channel API has no developer guide | | | | ● | | | |
| **18.8** | Webhook/event system is limited | | | | ● | | | |
| **18.9** | Session API has no documented response shapes | | | | ● | | | |
| **18.10** | No local development mode | | | | ● | | | |

**Legend:** ● primary persona (full content in their section) · ○ secondary persona (affected, pointer in their section)

¹ **P6 — Shared Deployment Operator**: person who deploys jiuwenswarm as a shared IM bot for others. Not a "team admin" — jiuwenswarm has no human team management system.
² **P13 — IM Channel User**: person who talks to jiuwenswarm through Feishu/Telegram/WeChat without Web UI access. Not yet fully covered; marked ○ where existing findings apply.

---
