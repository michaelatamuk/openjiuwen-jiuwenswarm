[← Index](README.md) · jiuwenswarm Usability Review

---

# Top 10 Problems

Ten **distinct** problems (each different in kind), ranked by usability impact. Related individual findings are noted under each so nothing is lost, but no problem shares a root cause with another.

1. **No control or reversal over agent actions** — the agent edits files and sends externally with no preview/confirm; there's no safe stop, and no general undo (only code-mode change cards can be discarded).
   *(file-preview/approval · confirm destructive external · safe stop · limited undo for code-mode changes)*
2. **Failures are invisible** — a subsystem can go down and you're never told; logs aren't reachable from the UI.
   *(silent failures · no reachable log view)*
3. **Errors give no way to act** — no cause, no next step, no pointer to the log; and you can't tell the agent its answer is wrong.
   *(unactionable errors · no feedback/retry on answers)*
4. **Setup and config fail silently and too late** — wrong credentials fail only on the first chat; the wizard ends before the model is verified; no config validation; upgrades can silently break it.
   *(credentials at startup · setup wizard · config validation · safe upgrade)*
5. **Context and cost are hidden and oversized** — trivial prompts still build the full context, with no token/cost visibility or breakdown of what consumes it.
   *(full context for trivial prompts · token/cost visibility · context attribution)*
6. **Conversation management** — past conversations aren't searchable, and long tasks give no notification when they finish.
   *(history search · completion notification)*
7. **No visibility or control over what personal data is sent to the model.**
   *(memory visibility · prompt disclosure)*
8. **The GUI isn't fully translated.**
   *(incomplete i18n)*
9. **Developer/API adoption is high-friction** — the rail/API is undocumented, there's no scaffold command, and no published SDK, so extending or integrating means reading source and re-implementing.
    *(rail docs · scaffold CLI · SDK)*
10. **The skill ecosystem is hard to work with** — no versioning/rollback, no sandbox to test a skill before live use, no quality signals in the marketplace, and no clear entry point to create one.
    *(skill versioning · skill testing · marketplace quality · skill creation)*

## More distinct problems (11–20)

Lower impact than the top ten, but still real, distinct issues.

11. **You can't see *why* the agent acted** — reasoning and the reason behind tool calls are hidden.
12. **Nothing indicates the agent is working** — a blank gap before the first token; long skills show no progress.
13. **You can't see or correct what the agent remembers about you** — memory is stored but not reviewable or editable.
14. **Data is kept forever** — no retention or expiry controls.
15. **Powerful features exist but are never surfaced** — trajectory, OTel, SSH, and debug trace are hidden unless you know the config keys.
16. **Navigation and settings confuse** — settings grouped by code module; skills and connectors split apart; the activity view is hidden behind an unclear name ("TraceHound").
17. **Onboarding is thin** — the empty screen gives no example; modes have no names or descriptions; nothing introduces features after first run.
18. **Accessibility** — the UI can't be fully driven by keyboard; no screen-reader support; no high-contrast or large-text option.
19. **Mobile isn't first-class** — the Web UI isn't usable on a phone; there's no installable/offline (PWA) version.
20. **You can't shape the agent's output** — no length or style preference; long replies lack structure.

## Long tail — remaining distinct problems (21–28)

Lower impact still, but each a different real issue. The corpus yields no clean 21–30: what's left beyond these is developer-detail (already under #9) or minor polish.

21. Conversations can only be shared as a flat image — no link, Markdown, or JSON export.
22. No single command to gather diagnostics for a bug report.
23. No visibility into which ports, URLs, or processes are running after startup.
24. Permission rules can only be edited in raw YAML — no GUI and no way to test a rule.
25. No in-context help or tooltips where the user is stuck.
26. Clarification questions carry no context about what the agent was doing.
27. Operator logs and config mix languages unpredictably.
28. Skill Python dependencies and conflicts are invisible to the author.

---

**Not in this list (conditional on a shared/exposed deployment):** Web-UI no-login and no API authentication — low for a personal local agent.

---
