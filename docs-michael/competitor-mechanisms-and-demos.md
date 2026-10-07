# Competitor Mechanisms & Demo Ideas

_Compiled 2026-10-06. Sources: vendor newsroom pages and third-party reporting (links inline)._

---

## 0. Reference: headquarters deck

Source: `AI Application Innovation — Industry Insights and Product Direction (21 pages, 2026-09-29).pptx` — title "AI Application Research and Product Plan", dated 2026-09-27. This section is the baseline the rest of the doc builds on.

### Thesis

- Agent apps are forming two super entry points: **production side** (unified workbench + multi-agent collaboration) and **consumer side** (system / super personal assistant).
- Shift: past `User → App → Service`; now `User → Agent → App / API / Tool / Skill`.
- Behind both entry points sits an **AgentOS**: intent-driven, agent development and runtime, multi-agent collaboration, long-term memory, identity authorization, tool & model routing.
- Production side must reliably take on long enterprise tasks; consumer side must continuously understand individuals and distribute services within authorized scope.

### Three forms of applications

| Form | Examples | Becomes |
|---|---|---|
| Agent-native | scheduling, price comparison, format conversion | standalone tool → Agent skill / Skill Hub |
| Headless backend service | e-commerce, banking, enterprise SaaS | standalone App → API / MCP / Plugin Hub |
| Agent-assisted | gaming, community, creative experiences | human interface → agent accompaniment |

### Industry cases in the deck

| Case | Side | Key points |
|---|---|---|
| Office Agent | Production / office | WorkBuddy vs Doubao Work vs Qwen Office; compared on users, tasks & delivery, context entry, business model, product hook |
| Grok Bot | Production / collaboration | Delegate via IM; bots hand off to each other; humans decide; fixed roles + memory + proactive follow-up; quota + overage billing |
| Claude Science | Production / professional | Research workbench (literature, code, compute, results); UCSF germline variant analysis ≈1/10 time (uncontrolled test) |
| Muse | Consumer / personal | Long-term assistant; memory, goals/experience, execution & permission mechanisms; free → subscription |
| Manus 2.0 | Consumer / general | Studio (editable timeline), Cloud Computer, Automations |
| Cue | Consumer / identity | Agent identity resources (email, phone, wallet, computer); shared goal, group-chat handoff, owner makes final decision |

### Four directions (Part 2 of the deck)

| Direction | Side | Reference | Entry point |
|---|---|---|---|
| OPC | Production / collaboration | Grok Bot | One-person-company Agent IM (sales / R&D / operations) |
| ScienceDiscovery | Production / professional | Claude Science | Research workbench (literature → compute → experiment → re-verify) |
| Digital Mate | Consumer / personal | Muse | All-in-one personal assistant / digital twin |
| Agent social network | Consumer / identity | Cue | Agents discover, negotiate, collaborate |

### Supplementary productivity directions

- **Omni Agent** — video (marketing, short films), design (e-commerce, posters), audio (voiceover, podcasts, music).
- **Data Agent** — business / financial analysis: data queries, anomaly analysis, periodic reports; BI/SQL, metric definitions.

Recurring themes: task and result continuity, long-term memory, authorization boundaries, human ownership of key decisions, and reuse of shared runtime / permission / task-continuity capabilities.

---

## 1. The competitor landscape (late 2026)

| Product | Vendor | Launched | Status | Model |
|---|---|---|---|---|
| **dots** | OpenAI | Sep 29, 2026 | GA rolling (Pro / Business Premium; Enterprise beta) | GPT-6 Astra |
| **Grok Bot** | xAI / SpaceXAI | Aug 11, 2026 | Beta (Enterprise Sep 3; Team Bots Sep 28) | vendor-managed (Grok) |
| **Muse** | Meta | Sep 8, 2026 | GA US/Canada; SMB edition Sep 29 | Muse Spark |
| **Manus 2.0 + Cue** | Manus | Sep 28–29, 2026 | Cue limited free early access | Cascade harness |
| **Claude Science** | Anthropic | Jun 30, 2026 | Beta | Claude |
| **Gemini 4 Argon / Spark** | Google | Sep–Oct 2026 | Argon GA; desktop computer-use in trusted testing | Gemini 4 |

---

## 2. OpenAI dots

Source: `https://openai.com/index/introducing-dots/`, safety blog `https://openai.com/index/how-we-build-safety-security-and-privacy-into-dots/`.

Always-on personal agents with their own cloud computer, browser, memory, and proactive background work.

- **Environment:** each dot has its own **cloud computer + browser**; can optionally connect the user's laptop/other devices. Isolated per user.
- **Autonomy:** works between conversations, handles multiple projects, "proactive research" runs in the background.
- **Memory:** learns goals, preferences, voice, standards; each dot's context is resettable; delegation minimizes retained sensitive detail.
- **Permissions / approvals:** built-in action rules; **Custom Rules** (allow / require-approval / block); **auto-review** independently checks each consequential action against instructions + rules + policy and can allow/block with a reason; code/tools sandboxed; monitoring can pause or stop work; password changes and money transfers stay with the user.
- **Credentials:** secure sign-in and saved-password flows keep passwords **out of model context** via an encrypted credential service; purchases only with already-saved merchant cards + approval.
- **Multi-agent:** future "teams of dots"; **specialist dots** with their own identity, credentials, and IT-provisioned hardware, connected to systems of record (enterprise pilots).
- **Integrations:** **4,000+ apps** via plugins; reaches users via ChatGPT desktop/web/mobile, **Slack, Teams** (texting soon); context carries across channels.
- **Enterprise:** specialist dots planned for **Microsoft Agent 365** governance/security.
- **Pricing:** first dot included in Pro / Business Premium; an "allowance for deeper work"; future: add more dots and **scale each dot's output by speed or monthly work amount**.

---

## 3. xAI / SpaceXAI Grok Bot

Sources: `https://x.ai/news/introducing-grok-bot`, `https://docs.x.ai/grok-bot/overview`, `https://docs.x.ai/grok-bot/teams-and-enterprises`.

Named always-on agents ("Bots") on a persistent cloud computer that sign into real tools.

- **Environment:** each user gets a dedicated **Firecracker microVM** (browser, `/workspace`, terminal); **all of that user's Bots share one computer** (shared cookies/files/logins); thin desktop/mobile clients; optional **local execution** with per-command approval.
- **Autonomy:** cloud work continues with the laptop closed; Bots run in parallel (one computer-use task per screen at a time).
- **Memory:** named Bots keep memory, files, browser sessions, preferences; context separate per Bot.
- **Skills & routines:** **skills** (reusable instructions); **routines** with **schedules + event triggers** (Slack, GitHub, etc.); **teach-by-demonstration** records a browser workflow (≤10 min) into a reusable routine; a Bot can own up to **50 routines**.
- **Permissions:** no access by default; sensitive actions route through **Auto Review** (independent review model); hands off login/2FA/CAPTCHA/payment to the human; masked secret-request flow; **team-enforced "ask first" rules**.
- **Secrets:** **Team Secrets** (up to 100/team) exposed only to **Team Setup scripts**, auto-redacted from logs.
- **Teams:** Bots message each other, share context in **group chats**, pass ownership; a **chief-of-staff** Bot can manage specialist Bots; **Team Bots** = one Bot a whole team talks to, with per-teammate private chats + **per-person private notes + shared team memory**, and **usage billed to the asker**.
- **Integrations:** MCP connectors via Marketplace; team connector policy; Cloud Agent delegation for coding; services without APIs via computer use.
- **Enterprise / governance:** Team Rules, enforced Auto-review, **Network Controls** (4 modes incl. team allowlist), Team Setup manifests, Manage Bot Computers (30-day inactive auto-terminate), **Action Recording** (metadata-only, secret-scrubbed), **OpenTelemetry export**, audit logs, Admin API.
- **Finance:** **Plaid** banking/investment access (Sep 27, 2026).
- **Pricing:** bundled with paid **Cursor** plans or linked SuperGrok / X Premium+; weekly allowance; 7-day trial credit.
- **Analytics:** **Conversation Insights** grouped by "Type of Work" and "Level of Automation".

---

## 4. Meta Muse (deep dive)

Sources: `https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/`, `https://about.fb.com/news/2026/09/introducing-muse-small-business/`, `http://security.muse.ai`, `http://introducing.muse.ai`.

Personal AI agent that "actually does the work," built to be safe/private and available to billions. Runs on **Muse Secure VM**; powered by **Muse Spark**.

| Mechanism | Detail |
|---|---|
| **Muse Secure VM** | Dedicated cloud VM per person housing **both the agent and the user's data**, with its own browser; contained so no other agent can reach it |
| **Sentinel agent** | Separate guard agent on the same machine, **isolated at the OS level**; nothing reaches the internet unless Sentinel approves, and it asks the user when needed |
| **Confidential VM** (promised "later this year") | Whole VM, including data and conversations, encrypted with a key **only the user holds** — "not even Meta can access it" |
| **Credential invisibility** | Muse has **no visibility** into passwords or payment methods; credentials stored separately and used without being seen; cannot see passwords typed into the browser |
| **Audit trail** | Shows a complete record of everything it has done **and plans to do** |
| **Granular per-app grants** | For each app, choose exactly what Muse may do (e.g. email: **read** vs. **read+send**); change or disconnect anytime |
| **Approvals** | Checks with the person before sensitive actions like sending an email or making a purchase |
| **Payments** | Checkout via **Stripe Link** with a **one-time-use card**; first AI agent covered by **Link purchase protections**; Shop Pay + 1Password coming |
| **Memory** | Remembers details mentioned once; makes unprompted suggestions (recipe reel → grocery list → dinner menu respecting friends' dietary restrictions); can **"forget"** specific things |
| **Privacy** | Opt out of training; conversations/VM data **not shared with ad systems** |
| **Small-business connectors** | Asana, Box, Canva, Dropbox, Figma, Granola, HighLevel, Intuit QuickBooks, Klaviyo, Lovable, Notion, Shopify, Slack, Stripe, Zoom + FB/IG business accounts; **custom connector SDK**; "already understands your business" from connected accounts |
| **Ideas tab** | Proactive suggestions for how to use it |
| **Surfaces** | Muse app + WhatsApp; coming to AI glasses; **Muse Charm** hardware (Connect 2026); open-sourced **Gadget SDK** |
| **Pricing** | Free for most; subscription plans for heavier use |

**Reported incidents:** a 0-day that allowed Mac backdoor access, and a permission bug that sent a stranger to a user's home.

---

## 5. Manus 2.0 + Cue

Sources: `https://manus.im/blog/introducing-manus-2-0`, third-party coverage.

- **Cascade harness:** in-house harness that loads specialist capabilities only when needed (vendor-reported: 23.2% fewer tokens, 28.2% faster, 32% lower cost).
- **Cloud Computer:** purchasable, always-on dedicated environment; hosts long-running automations and even multiplayer games.
- **Automations:** now start on **events** in connected services (new email, Slack message, calendar event, Notion update, ad-performance change), described in one prompt.
- **Cue = agent identity stack:** each agent gets its **own email address, phone number, wallet, and computer**; can take calls and leave summaries; multiple Cue agents share a **group chat** and hand work to each other; spends **within a user-set budget**.
- **Studio:** desktop workspace (docs, sheets, slides, sites, code, games, video) with an **editable video timeline** and **Alchemy** (video+code under user direction).

---

## 6. Anthropic Claude Science

Source: `https://www.anthropic.com/news/claude-science-ai-workbench`.

- **Environment:** runs **locally** (macOS/Linux) or on a **remote/HPC login node**; sensitive data stays on lab infra, only per-step context goes to Claude; scales one GPU → hundreds.
- **Multi-agent:** a generalist **coordinating agent** spins up specialist agents; a **reviewer agent** inspects outputs and self-corrects (actor–critic).
- **Sessions:** running session holds large data in memory; can **fork a session** to compare approaches.
- **Permissions:** drafts a plan and **asks before reaching new resources**; user can revoke compute decisions before job submission.
- **Artifacts:** every figure ships with **exact code + environment + plain-language description + full message history**; editable; in-line annotation.
- **Integrations:** 60+ curated domain skills/connectors (genomics, single-cell, proteomics, structural biology, cheminformatics); native 3D/genome/chemical rendering.
- **Pricing:** beta for Pro/Max/Team/Enterprise; academic discounts; up to 50 projects × $30,000 credits.

---

## 7. Google (adjacent)

- **Gemini 4 Argon** (Sep 30, 2026): frontier model, restricted first to trusted cyber defenders, then paid API + AI Ultra; 1M-token output.
- **Gemini desktop computer-use** (Oct 2, 2026, trusted testing): sandbox options to operate **outside selected folders, access the internet, work across apps without per-step approval**, with confirmation still required for purchases/legal.
- **Gemini Spark:** personal agent across Google services; expanded to macOS + connected apps.
- **Gemini Enterprise:** supports **unique AI agent identities**.

---

## 8. Cross-competitor mechanism summary

| Mechanism | From | Note |
|---|---|---|
| Proactive research hard-restricted to **read-only tools** | Dots | Autonomy with a provable no-side-effect guarantee |
| **Auto-review of actions vs. Custom Rules** (allow/require-approval/block), block reason returned to agent | Dots, Grok | A reusable policy engine, not a prompt |
| **Independent review model** enforcing non-disableable "ask-first" rules | Grok | Safety as a separate reviewer agent |
| **Secret broker:** use credentials without exposing them; setup-only secrets; auto-redacted logs | Dots, Muse, Grok | Enterprise-trust differentiator |
| **Credential/data isolation VM + client-held-key confidential mode** | Muse | "We can't see your data" as a product |
| **Per-app granular grants (read vs send) + done/planned audit trail** | Muse | Consent UI becoming table stakes |
| **Agent identity stack:** own email, phone number, wallet, computer | Manus Cue | Turns agents into reachable actors |
| **Budgeted spending + one-time-use virtual card + purchase protection** | Cue, Muse | Safe commerce |
| **Teach-by-demonstration → reusable skill/routine** | Grok Bot | Non-developers build automations |
| **Event-triggered routines** (Slack, GitHub, email, calendar, Notion, ad-perf) | Grok, Manus | Agents that react, not just respond |
| **Team Bots:** shared team memory + per-person private notes; **billed to the asker** | Grok | Multi-agent with economics |
| **Chief-of-staff agent** managing specialist agents | Grok | Orchestrator pattern in-product |
| **Per-user microVM shared by all that user's agents** | Grok | Cheaper isolation than per-agent |
| **Metadata-only, secret-scrubbed action recording + OpenTelemetry export** | Grok | Auditability as a feature |
| **Reproducible artifacts** (code + env + description + history) + reviewer agent | Claude Science | Trustable results |
| **Session forking** to compare approaches | Claude Science | Exploration UX |
| **Compute broker** asks before allocating; local/HPC with only per-step context leaving | Claude Science | Data-residency selling point |
| **"Already understands your business"** from connected accounts | Muse SMB | Onboarding as a moat |
| **Conversation Insights** by Type of Work / Level of Automation | Grok/Cursor | Product analytics for agents |
| **Broader computer-use with sandbox options** | Google (testing) | Direction of autonomy |

---

## 9. Demo ideas

Each demo clones one mechanism above: one screen, one wow, 2–3 days each on openjiuwen.

All demos share one **demo chassis** (chat + trace + artifact UI shell; fake-data pack; deterministic mock tools; a 60-second story).

| # | Demo | Mechanism it clones (explained) | 60-second wow |
|---|---|---|---|
| 1 | **Read-Only Scout** | **Dots "proactive research"**: the agent works in the background on its own but is hard-restricted to **read-only tools**, so it can never send, change, or control anything | Background agent prepares a briefing; a **write attempt is hard-denied** by tool policy |
| 2 | **Rulebook** | **Dots "auto-review" + Grok "ask-first rules"**: an independent check judges every action against user rules — **allow / require approval / block** — before it runs, and returns the block reason to the agent | Add "never email external domains" live → agent tries → blocked **with a reason** and re-plans |
| 3 | **Vault** | **Secret broker** (Dots, Muse, Grok): the agent **uses credentials without ever seeing them**; passwords/keys are stored separately and logs are auto-redacted | Agent logs into a mock site; **secrets never appear in context or logs** |
| 4 | **Audit Tape** | **Grok "Action Recording" + Muse audit trail**: every action is logged as **metadata-only, secret-scrubbed**; the user sees everything done **and planned**; export via **OpenTelemetry** | Click any step → provenance; export **OpenTelemetry**; secrets scrubbed |
| 5 | **Teach Me Once** | **Grok "teach-by-demonstration" + routines/triggers**: record a human browser workflow once (≤10 min), **compile it into a reusable routine**, then run it on a schedule or an event | Perform a workflow once → reusable routine, then runs on a **Slack event** |
| 6 | **Identity Kit** | **Manus "Cue" identity stack**: each agent gets its **own email address, phone number, wallet, and computer**, so it can be reached and act on its own | Agent with its **own email/phone** receives a request, does the work, replies |
| 7 | **Budget Guard** | **Cue budgets + Muse Stripe Link**: the agent spends only **within a user-set budget**, using a **one-time-use virtual card**; over-budget attempts are blocked | Agent pays with a **one-time-use card**; over-budget attempt blocked |
| 8 | **Repo of Record** | **Claude Science artifacts + reviewer agent**: every result ships with **exact code + environment + plain-language description + full history**, and a **reviewer agent** checks the output and self-corrects | Click a result → **exact code + env + history**; reviewer agent flags a wrong figure |
| 9 | **Cloud Buddy** | **Manus Cloud Computer + Grok microVM**: a **persistent cloud computer** keeps tasks running after you close your laptop, and you can **take over remotely** | Start a long task, **close the laptop**, watch it continue, take over from phone |
| 10 | **Fleet Copilot** | **Grok "Team Bots" + chief-of-staff**: a **manager agent runs specialist agents** in a group chat with **shared team memory + per-person private notes**, and bills usage to whoever asked | Manager agent runs 3 specialists in a group chat, keeps **shared + private memory**, bills the asker |

**Optional alternatives:** **Confidential Mode** (Muse client-held-key isolation) or **One-Click Business Brain** (Muse SMB connectors → instant "understands your business").

### Build order

- **First (high wow, low risk):** 2 Rulebook, 3 Vault, 4 Audit Tape, 8 Repo of Record.
- **Middle:** 1 Read-Only Scout, 6 Identity Kit, 10 Fleet Copilot.
- **Riskiest (environment-dependent):** 5 Teach Me Once (computer-use flakiness), 7 Budget Guard (payment sandboxing), 9 Cloud Buddy (long-running infra) — build in a sandbox with a pre-recorded fallback.

---

## 10. Same-vibe mini-products

Same vibe as the big products — always-on agents that do real work for a person or team — but small (2–3 days, one person on openjiuwen). The **flagship ten** are below; the **full catalog**, grouped by domain, follows.

| # | Mini-product | The job it does, end to end | Mini version of | Real scenario it's based on |
|---|---|---|---|---|
| 1 | **Inbox Copilot** | Watches your inbox; triages, drafts replies, flags what needs you, follows up | Dots / Muse / Grok Bot | Muse SMB "flag emails that need a response and write first drafts"; Grok "Inbox Manager" |
| 2 | **Morning Brief** | One sourced readout each morning from Slack, email, calendar, and notes | Grok "Chief of Staff" / MS Scout | Grok chief-of-staff bot ("scans Slack/email/calendar/meeting notes into a sourced readout"); Scout "Today" |
| 3 | **Travel Concierge** | Plans a trip, compares options, builds an itinerary, confirms before booking | Muse / Grok Bot | Muse "book travel"; Grok "Travel Coordinator" (compare flights, confirm before booking) |
| 4 | **Bill Negotiator** | Gets a bill lowered; finds subscriptions to cancel (all with approval) | Muse | Muse "negotiate on their behalf — get a lower bill"; Grok "Subscription Cleaner" |
| 5 | **Outbound SDR** | Researches accounts overnight, drafts personalized outreach in your voice, ready to approve | Grok Bot / Dots | Grok "Sales Outbound" (research overnight, draft in each seller's voice); Dots sales-proposal builder |
| 6 | **Invoice Desk** | Finds and matches invoices, chases owners, sends on approval | Dots specialist dot | Dots "invoice processing"; tester's "forgotten invoice → drafted and sent after approval" |
| 7 | **Content Studio** | Turns a transcript/recording into clips, show notes, and social posts | Dots / Manus Studio | Dots content-creator scenario (interview → clips + notes + posts); Manus Video Editor |
| 8 | **Bug-to-PR** | Watches feedback/CI, reproduces the bug, fixes it, opens a PR with proof video | Dots / Cursor Cloud Agent | Dots "turn feedback into tested fixes … complete PRs with videos"; Cursor Cloud Agents; Grok "Bug Reproduction" |
| 9 | **Literature Scout** | Reads the papers on a topic, builds an evidence base, drafts a review | Claude Science | Claude Science multi-agent literature review (Allen Institute, 100+ page reviews) |
| 10 | **Call Catcher** | An agent with its own phone number answers calls and leaves you summaries | Manus Cue | Cue "my agent takes my calls and leaves me a summary" |

### Full catalog

**Personal & life**

| Mini-product | The job it does | Modeled on |
|---|---|---|
| Subscription Cleaner | Finds unused subscriptions and cancels them on approval | Grok |
| Apartment Scout | Filters listings, books tours, and applies | Grok / Gemini + Zillow |
| Family Ops | Watches school emails and deadlines, loads a cart, books the celebration dinner | Muse |
| Deadline Catcher | Spots a time-sensitive item buried in email and alerts you | Muse |
| Meal Planner | Recipe → grocery list → dinner-party menu that respects friends' diets | Muse |
| Personal Trainer | Builds a training plan and adjusts it as life shifts | Muse / Grok "Arnold" |
| Car Seller | Lists and negotiates a car for more money | Muse |
| Personal Shopper | Finds and buys within budget, one-time-card checkout | Muse / Grok |
| Study Coach | Turns any material into an interactive study guide | Muse |
| Life Dashboard | Spends/sleep/health tracker as a living artifact | Muse |

**Communication & coordination**

| Mini-product | The job it does | Modeled on |
|---|---|---|
| Meeting Prep | A prep pack before every calendar event (notes, CRM, prior calls) | Grok |
| Meeting Scribe | Notes and action items from calls, then follows up | Grok / Zoom |
| Status Writer | A living to-do list plus a morning digest | Grok |
| Internal Comms Writer | Drafts company/team updates | Grok |
| Team Copilot | A shared team bot that answers metrics/docs questions | Grok Team Bots |
| Agent Team | A manager agent + specialists working a shared goal in one chat | Cue / OPC |

**Sales & marketing**

| Mini-product | The job it does | Modeled on |
|---|---|---|
| Account Researcher | Tiers accounts using CRM + external signals | Grok |
| CRM Hygienist | Keeps pipeline/data clean, flags stalls and commit risk | Grok |
| Deal Desk | Turns deal notes into CRM updates on approval | Grok |
| Pipeline Analyst | A Monday scoreboard with stalls and commit risk | Grok |
| Sales Call Coach | Reviews calls with timestamped coaching and a score | Grok |
| Competitive Intel Analyst | Monitors competitors and produces a digest | Grok |
| Paid Media Manager | Watches spend vs budget, recommends reallocation | Grok |
| Newsletter Writer | Drafts a newsletter from developing stories | Dots / Grok |
| Social Media Manager | Plans and drafts posts on a calendar | Grok |
| Presentation Designer | Builds on-brand decks from a master template | Grok |

**Money & finance**

| Mini-product | The job it does | Modeled on |
|---|---|---|
| Expense Manager | Reconciled receipts weekly, nudges owners | Grok |
| Contract Desk | Summarizes a week of contracts, key terms, blocked reviews | Grok / Harvey |
| Close Assistant | Assembles a financial close package | Microsoft Cowork |
| Vendor Portal Operator | Handles no-API vendor portals (renewals, seats, procurement) | Grok |
| Cash-Flow Watcher | Tracks cash flow and inventory in the background | Muse SMB |

**People**

| Mini-product | The job it does | Modeled on |
|---|---|---|
| Talent Scout | Sources, reaches out, and schedules candidates | Grok / Dots |
| Hiring Screener | Screens applicants against the role | Grok |
| Onboarding Manager | Runs new-hire onboarding end to end | Grok |
| Calendar Coordinator | Schedules across time zones | Grok |

**Product & engineering**

| Mini-product | The job it does | Modeled on |
|---|---|---|
| Cloud Agent Orchestrator | Launches, monitors, and summarizes many coding agents | Grok / Cursor |
| Repository Maintainer | Triages issues and reviews PRs on a schedule | GitHub / Cursor |
| Docs Auditor | Diffs docs against the shipped product | Grok |
| Feature Request Tracker | Mines chats and calls into a demand list | Grok |
| Prototype Builder | Prompt → a live prototype URL | Grok / Manus |

**Customer support**

| Mini-product | The job it does | Modeled on |
|---|---|---|
| Support Resolver | Resolves or deflects tickets, escalates to a human with full context | Fin / Decagon / Sierra / Dots |
| Ticket Triage | Drafts replies only, holds them for approval | Grok |
| Account Health Watcher | Maintains a churn/expansion watchlist | Grok |

**Research & knowledge**

| Mini-product | The job it does | Modeled on |
|---|---|---|
| Data Analyst with proof | Reruns analyses and ships results with code, environment, and a reviewer's check | Dots scientist / Claude Science |
| Paper Fact-checker | A reviewer agent flags bad citations and untraceable numbers | Claude Science |
| Regulatory Monitor | Tracks and summarizes regulatory changes | Harvey / Legora |

**Creator & media**

| Mini-product | The job it does | Modeled on |
|---|---|---|
| Video First-Cut | Raw footage → an editable first cut on a timeline | Manus |
| Game Builder | Prompt → a playable game published as a link | Manus |

**Verticals**

| Mini-product | The job it does | Modeled on |
|---|---|---|
| Contract Review | Bulk-reviews contracts and drafts redlines | Harvey / Legora |
| Healthcare Paperwork | Removes paperwork from clinical/payer workflows | Salesforce Health / Claude Science |
| Real-Estate Closer | Automates closings and coordination | HomeLight |
| Classroom Assistant | Grading and lesson support for teachers | Education agents |

---

## Sources

- OpenAI dots: `https://openai.com/index/introducing-dots/`
- xAI Grok Bot: `https://x.ai/news/introducing-grok-bot`, `https://docs.x.ai/grok-bot/overview`, `https://docs.x.ai/grok-bot/teams-and-enterprises`
- Meta Muse: `https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/`, `https://about.fb.com/news/2026/09/introducing-muse-small-business/`
- Manus 2.0 / Cue: `https://manus.im/blog/introducing-manus-2-0`
- Anthropic Claude Science: `https://www.anthropic.com/news/claude-science-ai-workbench`
- Google: `blog.google` Gemini Spark updates; Gemini 4 Argon coverage
