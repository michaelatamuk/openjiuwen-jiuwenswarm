# What's New in JiuwenSwarm — Since August 2026

A short, plain-English guide for people who already know the product and just want to
catch up on what changed in the last ~3 months.

*Last updated: 2026-10-24.*

Everything here is tagged with one of two labels:

- **[NEW]** — a genuinely new capability that did not exist before.
- **[UPGRADE]** — an existing capability that was re-worked so deeply that it now feels
  new. These are "much better", not "new".

This document is arranged for a talk: **four things are worth the full story**, and the
rest are grouped by theme so each can stay a short mention.

---

# The big things

## 1. Team Organization (Team of teams) — [NEW]

JiuwenSwarm went from single agent teams to an **organization of teams**. The key shift is
that you no longer assemble the work — you **brief an organization**: you state a goal, the
organization plans it and puts tasks on a shared board, and the expert teams best suited to
each task **claim** it. When the results come back, a lazily created **summary team**
consolidates them into one result. No graph to wire, no steps to sequence — the
organization routes the work itself, and it has its own web UI.

```mermaid
flowchart TB
    R([You ask for something]) --> O(One organization)
    O --> F(Finance team<br/>with its own agents)
    O --> L(Legal team<br/>with its own agents)
    O --> T(Technical team<br/>with its own agents)
    F --> S(Summary team<br/>with its own agents)
    L --> S
    T --> S
    S --> A([One result])
```

Two things make it much bigger than "run a few teams and merge the output":

- **Persistence — an organization, not a run.** The organization keeps its own memory: a
  shared task pool, task lineage, review state, an inbox and a workspace. Teams come and
  go; the organization stays, and you can re-brief it on a new goal tomorrow.
- **Composability — teams are products.** An expert team is a reusable, installable
  package, so composing an organization means choosing capabilities. Add a new expert team
  and it starts taking work immediately — which makes this an ecosystem of plug-in teams.

It also ships with governance built in: an independent review before a result is accepted,
and a distinct summary role.

The organization can also staff itself. The team leader can browse the catalog of installed
experts and **spawn one as a member**, and a scheduled task can declare inline members the
same way — including members that run on an external CLI. In a scheduled team, members can
also message each other directly instead of routing every exchange through the leader, so a
team can unblock itself. Hiring a new expert is now closer to choosing a capability than
wiring an integration.

How the three levels relate:

| Level | Think of it as… | What it gives you | Where it stops → and who picks it up |
|---|---|---|---|
| **Agent** | One person | Gets a task done. | Work that needs parallel hands, a second opinion, or lasting shared context. **→ Team** |
| **Team** | A department | A lead plus a crew split one goal, work in parallel, and stay in sync. | Goals that span several specialties, each deserving its own crew. **→ Organization** |
| **Organization** | A company | Many crews share one board: the right crew takes the right work, and one result comes back. | — |

## 2. Third-party agents as first-class team members — [NEW]

JiuwenSwarm can now host *other people's* agents as team members. Before, each one had to
be wired in by hand (Claude Code and Codex worked that way); the new "harness provider"
protocol lets any external agent — including the DeepSeek Harness — plug in through one
standard interface and act like a normal teammate. Sign-in and switching a member's model
or reasoning effort are handled for you.

Third-party agents that bring their own web UI can now be proxied on registry-assigned
ports, so the agent's interface comes with it. In scheduled work, an inline member can run
on an external CLI, and the separate external-CLI spawn path has been folded into the normal
teammate path, so an external agent is registered like any other member.

```mermaid
flowchart LR
    A[Claude Code] --> P{{One standard connection}}
    B[Codex] --> P
    C[DeepSeek Harness] --> P
    P --> T[Each joins your team<br/>as a normal member]
```

## 3. Computer Use — a hand on the desktop — [NEW]

The swarm stopped living only inside the browser and the terminal: it can now **operate the
whole desktop**. A new desktop-automation sub-agent (`cua_agent`) watches the host through
window screenshots and drives native applications with **real mouse and keyboard input** —
Office, IDEs, chat clients, system dialogs, settings panels. It finds the target window,
captures it, acts at pixel coordinates, then captures again to confirm the effect before it
reports done, instead of assuming the click landed.

This is a new subsystem, not a heavier tool:

- **A native engine, not brittle scripts.** `cua_engine` ships real platform backends behind
  one protocol — a Swift driver for macOS and a C# driver for Windows — plus an MCP runtime,
  so the desktop becomes a clean, callable capability rather than GUI automation bolted on.
- **One teammate among the others.** The same sub-agent is available to single-agent (deep),
  code, and team (swarm) modes; a team can hand off desktop work like any other capability.
- **Guarded by default.** It is opt-in, needs a vision model (perception is screenshots), and
  asks for confirmation before irreversible actions; because the input is real, it can pause
  while you use the machine and supports an emergency stop.

```mermaid
flowchart LR
    W([Window screenshot]) --> M[Vision model picks the next action]
    M --> I[Real click / type / scroll]
    I --> V[Capture again to verify]
    V -->|not there yet| W
    V -->|result visible| D([Done])
```

## 4. RSI — Recursive Self-Improvement — [NEW]

RSI is a new module that lets the system **improve itself**. It watches how the agent
actually behaved on real tasks, finds weak spots, and proposes changes to the agent's own
harness and prompts. A separate evaluator agent then scores those changes, and only the
ones that genuinely help are kept. There is also an online reinforcement-learning loop
that keeps tuning the agent over time — so the system gets better from real usage instead
of only from human editing.

*How this differs from our existing "self-evolving" work: self-evolving tunes the agent's
own prompts, tools and skills from experience; RSI goes one level up and improves the
harness itself, and can recursively improve how it does that.*

**New since October: diagnosis and attribution.** RSI's "find the weak spot" step is now a
visible feature. The trajectory viewer has a diagnosis panel: pick a run, or a slice of it,
and it attributes the outcome to root causes instead of only showing what happened. It also
adds **Reward scoring** — the deliverable is checked against the user's own words, claims are
judged against evidence gathered by actually running the deliverable, and the score is
computed in code rather than guessed by the model. Diagnosis is opt-in and experimental.

```mermaid
flowchart LR
    A([Agent does real work]) --> B[Spots its own weak spots]
    B --> C[Improves itself]
    C -->|tries again| A
```

---

# The rest, by theme

## Agents working with agents

### 5. Agent-teams rework — [UPGRADE]

The team engine was reworked in several deep ways. Team members can now be task-scoped, so
they live only as long as the task needs them and are shut down afterwards. Teams support
fork and checkpoint modes for branching work, and member models can be routed through
model groups. This is a substantial upgrade of the existing team system rather than a new
subsystem.

### 6. Scheduled dispatch + verification layer — [NEW]

Teams can now be put on a schedule. Instead of always running everything live, work can
be dispatched on a timer to read-only reviewers, and a verification step checks the
result before it is accepted. This targets autonomous runs where you want a safety check
without a human approving every single step.

Scheduled teams also show their handoffs and task flow in the group chat, so you can watch
work move between members instead of seeing only the final result. Member-to-member messaging
inside a scheduled run is an opt-in sub-switch.

## Getting smarter

### 7. Symphony — [UPGRADE]

Symphony's graph-based skill orchestration became substantially more capable. It now
learns from real executions and distills them into reusable, installable "skill packs",
groups equivalent skills together, and speaks the standard JGF graph format, so skills
can be composed and reused far more effectively.

### 8. Context evolution and proactive context — [UPGRADE]

The context and evolution rails were extended so the agent can gather useful context
proactively (for example, from GitCode) instead of only when asked. Context is now managed
in collections that you can browse and query, and the system gives clearer explanations of
how and why context was compacted. This builds on the context-evolution machinery that
already existed.

Memory is pluggable too: a Jiuwen memory rail can mount the built-in memory variant, or an
external AgentMemory service, alongside the existing context machinery.

### 9. LLM layer — thinking modes and model groups — [UPGRADE]

The model layer now supports explicit thinking and reasoning-intensity modes, model-group
configuration with routing policies, the OpenAI Responses API, and streaming of
function-call arguments as they are generated. This is an upgrade to the existing LLM
plumbing, but it changes how much control you have over model behavior and cost.

### 10. Multi-model collaboration (MoA) — [NEW]

You can now put several models on the same problem at once. With multi-model collaboration
enabled (experimental), you select a **model group** instead of a single model and the group
runs as a Mixture-of-Agents: the first model aggregates while the others act as references,
and a **verifier scores progress on an interval** — either a hosted JEV scorer or an ordinary
LLM verifier taken from the group — so the answer is judged as it is built, not only at the
end. It is single-agent only (not used for team or scheduled runs) and off by default.

### 11. Topic and prompt recommendations — [NEW]

The chat can now suggest what to ask next. With the recommendation switches on, it proposes
**topics** worth exploring and **prompts** you can send with one click, drawn from your history
and the current conversation. It is off by default, keeps topic history behind an explicit
consent boundary, and records feedback and an audit trail so you can see why a topic was
suggested.

## Control, safety and operations

### 12. Smart approval + permission modes — [NEW]

The permission system became much smarter. There are now three clear modes — Full
Access, Auto, and Strict — and permissions are tracked in layers (global, per-user, and
per-session). On top of that, a "smart approval" feature lets the model judge whether an
action is safe and approve it automatically, so users see far fewer prompts while still
staying protected.

### 13. A4P — intent authorization — [NEW]

A4P is an intent-authorization protocol. It lets a user pre-approve what an agent is
allowed to do for a session or a scheduled job, so the agent does not stop and ask for
permission on every action. Approvals are tied to a clearly stated intent, which makes
automation smoother while still keeping a record of exactly what was authorized.

Since October, a preflight step filters out requests that would not need a new authorization
anyway, smart-approval mode no longer turns A4P on by mistake, and the approval wait was
shortened from five minutes to three.

### 14. Heartbeat (re-worked) — [UPGRADE]

Heartbeat existed before as a lightweight keep-alive. It was re-worked into a Rail-based
heartbeat managed by the AgentServer, and it now has a web panel so you can see and manage
heartbeat tasks directly instead of treating them as an internal mechanism.

## Build, observe and ecosystem

### 15. Headless agent runtime (Process CLI + SDKs) — [NEW]

Previously the agent mostly ran inside the web app. Now it can run headless too: a new
"Process CLI" executes a single agent one-shot over standard input/output, and Python and
TypeScript SDKs let any program drive an agent directly. The runtime itself also moved
into a resident worker process, which makes startup faster and keeps the "listen for
requests" step separate from the heavier "load the runtime" step.

Deployment became more controllable too: agent and tool sandbox settings can now be managed
centrally through the etcd data plane.

### 16. Trajectory viewer — [NEW]

There is a brand-new way to look at what an agent did: a trajectory viewer. Every run is
saved with one consistent structure and stored by content, so you can replay it, page
through it turn by turn, and export it as an archive. It also surfaces timing such as
time-to-first-token, how context was compacted, and how a tool result looked to the model
versus what it actually returned. The diagnosis panel described under RSI sits on top of this
view.

### 17. Trajectory v2 — one consistent span-level schema — [UPGRADE]

Trajectory tracing already existed, but it was rebuilt around a single span-level schema
used across the whole system. Now every step of a run — model calls, tool calls, context
compaction — is recorded in exactly the same shape, so the viewer, the analysis tools, and
the backend all agree. It is technically an upgrade, but the data model and the new
viewer together amount to a next generation of the feature.

### 18. Marketplace / SkillHub — [NEW]

The marketplace grew into a hub for many kinds of assets, not just skills. There is now a
single search across skills, experts, plugins, and more, plus a web marketplace for
installing plugins and MCP servers. This makes it much easier to find and add new
capabilities to the product.

Skills themselves got easier to browse and safer to ship: each skill can carry a Chinese and
English display page, and built-in skills can be limited through a whitelist.

---

# Appendix — The slide

A single slide carrying the most important message (feature #1, Team Organization).

```
┌───────────────────────────────────────────────────────────────────────┐
│                                                                       │
│   From agents, to teams, to organizations                             │
│   Many expert teams, one goal, one result.                            │
│                                                                       │
│       •                  ●●●                 ▢▢▢                       │
│     Agent               Team             Organization                 │
│   one person         a department          a company                  │
│                                                                       │
│   Gets a task        Gets its part       Gets the whole job          │
│   done               done                done                         │
│                                                                       │
│                                                                       │
│   You don't manage agents.  You don't manage teams.                   │
│   You brief an organization.                                          │
│                                                                       │
│   Every angle covered — done well, not just done.                     │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

Copy, ready to lift:

- **Title:** From agents, to teams, to organizations
- **Subtitle:** Many expert teams, one goal, one result.
- **Agent** (one person): *Gets a task done.*
- **Team** (a department): *Gets its part done.*
- **Organization** (a company): *Gets the whole job done.*
- **Footer:** *You don't manage agents. You don't manage teams. You brief an organization.*
- **Punch:** *Every angle covered — done well, not just done.*
