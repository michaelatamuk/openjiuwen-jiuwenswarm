# JiuwenSwarm — New Audience Discovery Strategy

This document maps untapped audiences for JiuwenSwarm and, for each, identifies how they discover new tools. The goal is not to list features that would serve them — it is to understand where and how they would first encounter JiuwenSwarm.

The underlying principle is the same for almost every audience: **one piece of authentic content showing a real use case in their context, distributed through a channel they already trust.** The IDE plugin worked because it appeared inside developers' own tool. For each new audience, the equivalent is: appear in the format and channel they already inhabit, not on a product page they would never visit.

## What's Already Built (Updated Assessment)

Before reading audience gaps below, note what JiuwenSwarm already has — several items
previously listed as "missing" are actually already implemented:

| Capability | Status | Notes |
|---|---|---|
| **Web app (browser UI)** | ✅ Exists | Full-featured React SPA at `channels/web` — chat, sessions, file preview, multi-agent |
| **Slack, Discord, Telegram, WhatsApp, WeChat, DingTalk, Feishu** | ✅ Exists | Full channel integrations — gap is awareness, not capability |
| **File upload and document processing** | ✅ Exists | DOCX, Excel, PowerPoint, PDF awareness, Markdown+Mermaid+KaTeX rendering |
| **Multi-agent / team orchestration** | ✅ Exists | Team mode with member visualization, task tracking, leader-follower hierarchies |
| **Goal / objective persistence** | ✅ Exists | Goal bar, state management, convergence handling |
| **Voice in / out (STT + TTS)** | ✅ Exists | In the web app |
| **Session export and sharing** | ✅ Exists | Snapshot export, `/share-api/snapshot`, conversation history export |
| **Cron / scheduled tasks** | ✅ Exists | Cron panel in web app |
| **Extensions / plugin system** | ✅ Exists | Extension management panel |
| **Code mode + git diff** | ✅ Exists | Full git integration in web app (diff, commit, branch, code review) |
| **Execution tracing / debugging** | ✅ Exists | TraceHound panel |
| **Browser extension** | ✅ In development | `jiuwenswarm-browser` — ambient page-aware assistant in Chrome side panel |
| **BibTeX / Zotero export** | ✗ Missing | Would help academic researchers |
| **PubMed / arXiv / Semantic Scholar read integration** | ✗ Missing | Server-side tool; browser extension has page adapters but no deep API integration |
| **SEC EDGAR structured data** | ✗ Missing | Extension extracts text; structured financial data (XBRL, filings API) not yet integrated |
| **HIPAA-compliant deployment** | ✗ Missing | No documented compliance posture |
| **Air-gapped / local-model-only mode** | ✗ Partial | Can be self-hosted; explicit air-gap documentation missing |

**Consequence for audience analysis:** The "web app with no install" blocker previously listed
for Business Professionals, Content Creators, and Startup Founders is not a feature gap —
the web app exists. The real remaining blocker for those audiences is that the server still
requires local installation; a hosted SaaS deployment option is what's actually missing for
non-technical users who cannot run a Python server.

---

---

## Quick Summary

### Technical Builders

| Audience | Best Way to Reach Them | Missing Before Outreach |
|---|---|---|
| **Software Developers**<br/>Write code in IDEs every day | They already use the IDE plugin — this is the current core audience | Nothing blocking — ready now |
| **Data Scientists**<br/>Work with Python notebooks, ML models, data analysis | Post a working Kaggle notebook or Hugging Face demo showing a real task | No feature gap — needs one polished public demo (Kaggle notebook or HF Space) |
| **Data Engineers**<br/>Build ETL pipelines, orchestrate data workflows, manage data infrastructure | Guest post on the dbt blog or a talk at a DataOps / dbt conference | Integrations with dbt, Airflow, or Prefect; ability to read pipeline DAGs and understand task dependencies — without this the demo has no differentiation from a generic chat tool |
| **AI / ML Researchers**<br/>Study multi-agent systems, publish papers, build benchmarks | Publish a systems paper on arXiv with reproducible benchmarks | Benchmarking suite with reproducible numbers on standard multi-agent tasks; Papers With Code listing |
| **DevOps / SRE Teams**<br/>Handle server alerts, incidents, on-call rotations | "Show HN" post on Hacker News about a real incident response use case | Read integrations with PagerDuty, OpsGenie, Grafana, or Prometheus — without these the agent gives generic advice but cannot see the actual alert context |
| **QA / Test Engineers**<br/>Write test specs, automate regression suites, triage test failures | Blog post or Show HN on generating test specs from a real codebase automatically | CI integration (GitHub Actions, GitLab CI); ability to read JUnit/coverage reports and use them as agent input |
| **Cybersecurity Professionals**<br/>Research threats, test systems, analyze vulnerabilities | GitHub repo with security use case + DEF CON or Black Hat Arsenal demo | Local / air-gapped deployment option or explicit data-handling documentation — pentesters will not send vulnerability data to a cloud API without this |

### Knowledge & Business Workers

| Audience | Best Way to Reach Them | Missing Before Outreach |
|---|---|---|
| **Business Professionals**<br/>Run projects, analyze information, coordinate teams | 90-second LinkedIn video showing a real business task being completed | Web app exists but requires running a local server — a hosted SaaS deployment is what's actually missing; this audience cannot run a Python process |
| **Product Managers**<br/>Write specs, do competitive research, manage roadmaps | Case study in Lenny's Newsletter or Lenny's Slack community | Jira / Linear / Confluence read integration; ability to upload and process existing docs (PRDs, research decks) |
| **Financial Analysts**<br/>Research markets, model portfolios, write investment memos | LinkedIn post showing a real research workflow; direct outreach to fintech-forward fund analysts | Financial data connectors (SEC EDGAR, Yahoo Finance); structured tabular output; data residency documentation (required in regulated environments) |
| **Legal Professionals**<br/>Research cases, review contracts, monitor regulations | Case study from a real law firm + outreach to legal innovation teams at big firms | PDF / DOCX processing already exists in the web app. Real blockers: explicit data confidentiality posture (attorney-client privilege concerns are the actual barrier); audit trail of agent reasoning steps (TraceHound exists but needs legal-friendly export); hosted deployment with data residency guarantees |
| **Healthcare / Clinical Researchers**<br/>Synthesize clinical evidence, monitor guidelines, write trial protocols | Clinical informatics conference demo or co-authored systematic review | HIPAA compliance documentation or HIPAA-compliant deployment option; PubMed / ClinicalTrials.gov integration; PRISMA-format systematic review output |
| **Journalists / Investigators**<br/>Track sources, process documents, research stories | Article in Nieman Lab showing a real story that used JiuwenSwarm for research | Document upload + OCR (leaked PDFs, scanned records); continuous web / RSS monitoring mode; source attribution in agent output |
| **Academic Researchers**<br/>Run literature reviews, synthesize research, write papers | Co-author one real domain paper where JiuwenSwarm was used as a tool | PDF processing already exists. Real gaps: PubMed / arXiv / Semantic Scholar API integration for bulk literature ingestion; BibTeX / Zotero export (references in agent output are unstructured today); PRISMA-compatible systematic review output format |

### Creators, Educators & Operators

| Audience | Best Way to Reach Them | Missing Before Outreach |
|---|---|---|
| **Content Creators**<br/>Write newsletters, record YouTube videos, run podcasts | Get 2–3 YouTube creators in the "AI tools" niche to use it and show it | Web app exists but requires a local server — a hosted SaaS or one-click cloud deploy is what's missing; this audience uses Notion and Canva, not terminals |
| **Technical Writers**<br/>Maintain developer docs, write tutorials and release notes | Write the Docs conference talk or community post showing a real documentation workflow | Codebase-aware doc generation (read source → suggest matching docs); git integration; RST / MDX output; integration with ReadTheDocs or Mintlify |
| **Educators & Students**<br/>Teach AI courses, learn multi-agent systems | Get listed in GitHub Education toolbox; reach one professor who assigns it | Free or educational pricing tier; sandboxed / constrained execution mode for classroom safety; ready-made assignment templates and curriculum materials |
| **Startup Founders / Solo Operators**<br/>Run research, marketing, and ops alone without a team | Hacker News post framing JiuwenSwarm as a force multiplier for solo operators | Web app exists — main gap is hosted deployment (founders can tolerate more setup than creators, but SaaS is still better); workflow templates for common founder tasks (competitor research, investor memos, customer interview synthesis) would accelerate time-to-value |
| **Agencies & Freelancers**<br/>Build client projects, deliver AI solutions for hire | Revenue story on Indie Hackers: "how I finished a project in half the time" | Multi-project isolation (separate context per client); client-facing API or white-label option; project export format for client deliverables |

### Which ones to focus on first (fastest path to real users):

| Audience | How fast they can become users | How much effort it takes |
|---|---|---|
| Data Scientists | Fast — they discover tools online constantly | Low — one notebook demo or HF Space |
| DevOps / SRE | Fast — very active on Hacker News | Low — one honest post about a real use case |
| Agencies & Freelancers | Fast — always looking for leverage | Low — one Indie Hackers revenue story |
| Startup Founders / Solo Operators | Fast — very HackerNews-native, voracious tool adopters | Low — one Show HackerNews framed for solo operators |
| QA / Test Engineers | Fast — active in testing communities | Low — one blog post or Show HackerNews |
| Content Creators | Fast — one video = mass reach | Medium — finding the right creator |
| Product Managers | Medium — concentrated community | Medium — getting into Lenny's Slack |
| AI / ML researchers | Medium | Low — one arXiv paper |
| Data Engineers | Medium — community-driven discovery | Medium — requires a guest post or conference slot |
| Technical Writers | Medium — Write the Docs community is small but focused | Low — one talk or community post |
| Cybersecurity | Medium | Low — GitHub repo + DEF CON |
| Journalists | Medium | Medium — one Nieman Lab piece |
| Financial Analysts | Medium — LinkedIn and fintech-native | Medium — requires a credible workflow demo |
| Educators / students | Slow | Medium — GitHub Education listing |
| Business professionals | Slow | High — web app exists but requires hosted/SaaS deployment to remove local server dependency |
| Legal Professionals | Slow — relationship-driven industry | High — requires real case study + conference |
| Healthcare / Clinical Researchers | Slow — highly credentialed, evidence-required field | High — requires co-authored research or conference |
| Academic Researchers | Slow — long citation cycle | High — requires co-authored paper |

---

## Audiences (Detailed)

### Technical Builders

People who build software, run systems, or do technical research. They discover tools through GitHub, Hacker News, arXiv, and each other.

---

#### Data Scientists

**Who:** ML practitioners, data analysts, Kaggle competitors — people who work with notebooks, pipelines, and experiments, not IDEs.

**Where they discover tools:**
- Kaggle (competitions, notebooks, discussions)
- Hugging Face (Spaces, Hub, Discord)
- Towards Data Science / Medium
- Reddit r/MachineLearning and r/datascience
- Hacker News

**Discovery moves:**
- A working Kaggle notebook that uses JiuwenSwarm to automate a part of a real competition pipeline gets shared by competitors who found it useful.
- A Hugging Face Space demo gets visibility through HF's own promotion of notable Spaces — the HF team actively surfaces interesting projects to their millions of users.
- A single Hacker News front-page post reaches the entire data science community in one day.

---

#### AI / ML Researchers

**Who:** PhD students, postdocs, and lab researchers working on multi-agent systems, LLM evaluation, and AI orchestration — people who read papers and follow what gets cited.

**Where they discover tools:**
- arXiv (daily paper alerts by keyword)
- Papers With Code
- GitHub stars from researchers they follow
- Twitter/X ML community (researcher-to-researcher sharing)
- Workshop proceedings at NeurIPS, ICLR, EMNLP, ACL

**Discovery moves:**
- Publish a systems paper on arXiv describing JiuwenSwarm's multi-agent architecture with reproducible benchmarks. Citations compound over years. This is how AutoGen, LangGraph, and CrewAI got academic traction.
- List JiuwenSwarm on Papers With Code with benchmark numbers. Researchers browsing by task find it, use it to reproduce results, and cite it.
- One endorsement (star, tweet, or mention) from a known research lab account reaches thousands of researchers immediately.

---

#### DevOps and SRE Teams

**Who:** Infrastructure engineers, site reliability engineers, platform teams — people who deal with alerts, incidents, runbooks, and on-call rotations.

**Where they discover tools:**
- Hacker News ("Show HackerNews" posts from engineers about real operational problems)
- r/devops and r/sre
- DevOps Days conference talks
- Community blogs around incident tools (incident.io, PagerDuty, Grafana)
- Engineering blogs from well-known companies

**Discovery moves:**
- A "Show HackerNews: We built an incident response swarm that triages alerts and drafts the Slack summary automatically" post gets intense engagement from SREs who face exactly this problem.
- A write-up of one real production incident where JiuwenSwarm reduced mean-time-to-resolution, posted on a personal engineering blog and submitted to HackerNews, reaches this entire audience. SRE communities respond to operational war stories more than to product announcements.

---

#### Cybersecurity Professionals

**Who:** Penetration testers, threat intelligence analysts, security researchers, red team members — people who research vulnerabilities, analyze malware, and track threat actors.

**Where they discover tools:**
- DEF CON and Black Hat talks and tool releases
- Twitter/X infosec community (very active, tool-sharing culture)
- SecurityWeekly podcast
- GitHub (security tooling is heavily GitHub-native)
- r/netsec and r/cybersecurity

**Discovery moves:**
- The infosec community has a strong culture of sharing tools that solve real problems. A GitHub repo with a clear security-focused use case (threat intel aggregation, OSINT research orchestration, CVE triage automation) gets starred and shared organically within this community.
- A DEF CON talk or a Black Hat Arsenal demo puts a tool in front of thousands of security practitioners who are specifically there to discover new tooling. Arsenal in particular is a venue designed for exactly this.
- A Twitter/X thread from a known security researcher describing a real workflow using JiuwenSwarm spreads immediately through the infosec community.

---

### Knowledge & Business Workers

People who process large amounts of information professionally: research, writing, analysis, legal work, investigation. They discover tools through professional communities, conferences, and peer word-of-mouth.

---

#### Business Professionals (non-developers)

**Who:** Operations leads, consultants, analysts — people who coordinate complex knowledge work but don't write code.

**Where they discover tools:**
- LinkedIn posts from peers showing a real before/after
- ProductHunt launches
- Newsletter sponsorships (TLDR, The Hustle, Lenny's Newsletter)
- A short video a colleague forwards with "you need to see this"

**Discovery moves:**
- Post a 90-second screen recording on LinkedIn showing a swarm completing a real business task (competitive research, market summary, meeting prep). No feature announcement — just the output.
- A ProductHunt launch with a strong demo GIF gets seen by tens of thousands of product-aware professionals in a single day.
- Sponsoring one issue of a relevant newsletter (Lenny's Newsletter reaches ~700k product professionals) puts JiuwenSwarm in front of exactly this audience with no SEO or organic effort required.

---

#### Product Managers

**Who:** PMs at tech companies who are early adopters of productivity tools, actively looking for AI-assisted workflows for specs, competitive analysis, user research synthesis, and roadmap planning.

**Where they discover tools:**
- Lenny's Newsletter and Lenny's Slack community (the highest-density PM community online)
- Product Hunt
- Twitter/X PM community
- Mind the Product conference and Slack

**Discovery moves:**
- A case study post in Lenny's Slack ("I used a JiuwenSwarm agent team to synthesize 200 user interviews into a PRD in one afternoon") spreads organically — this community shares tools that save them time.
- Getting Lenny Rachitsky himself to mention it in his newsletter is a single-move that reaches the entire global PM community.
- A Twitter thread showing a real PM workflow (research → synthesis → spec draft) using JiuwenSwarm, written by a known PM voice, gets more reach than any product announcement.

---

#### Legal Professionals

**Who:** Lawyers, paralegals, legal researchers, and legal tech teams at law firms and corporate legal departments — people who spend significant time on case research, contract review, due diligence, and regulatory monitoring.

**Where they discover tools:**
- Legal tech conferences (ILTA, LegalTech NYC, CLOC)
- Above the Law and other legal media
- Legal innovation departments at large firms that actively scout tools
- Peer recommendations from other attorneys who found a time-saving tool
- Law school clinics and legal informatics courses

**Discovery moves:**
- A case study from a real law firm or in-house team showing how a JiuwenSwarm research swarm cut due diligence time on a real transaction gets circulated within the legal tech community, which is small and tight-knit.
- Above the Law (the most widely read legal media outlet) covers legal tech actively — one feature or mention there reaches hundreds of thousands of legal professionals.
- Legal innovation teams at large firms (most Am Law 100 firms have one) are specifically tasked with evaluating new tools. A direct outreach to two or three of those teams seeds the pipeline into multiple firms simultaneously.

---

#### Journalists and Investigative Reporters

**Who:** Data journalists, investigative reporters, research editors — people who track large document sets, monitor many sources, and synthesize information under deadline.

**Where they discover tools:**
- Nieman Lab (journalism innovation journalism)
- Online News Association (ONA) conference
- IRE (Investigative Reporters and Editors) community and conference
- Journalism school courses on computational journalism
- Twitter/X journalism community

**Discovery moves:**
- A real story where a journalist used JiuwenSwarm to process a large document dump or monitor multiple sources — written up as a methodology post — is exactly what Nieman Lab publishes. That audience is journalists who are looking for new methods.
- IRE conferences are attended by investigative reporters specifically looking for new tools and techniques. A workshop session there reaches the highest-density population of journalists who would actually use this.
- A single high-profile journalist publishing a thread about using JiuwenSwarm for research goes viral within the journalism community, which pays close attention to tools other reporters find useful.

---

#### Academic Researchers (domain scientists)

**Who:** Scientists in biology, law, medicine, economics, social science — people who run literature reviews, synthesize large bodies of evidence, and write systematic reviews. Not AI researchers; researchers who would *use* AI as a tool for their domain work.

**Where they discover tools:**
- Papers that cite the tool (they read what tools other labs in their field used)
- Domain-specific conferences and workshops
- University lab seminars and recommendations from advisors
- GitHub repos they stumble on while searching for a solution to a specific workflow problem

**Discovery moves:**
- The highest-leverage move is publishing **one real paper in a domain journal** co-authored with a lab that used JiuwenSwarm for their actual research workflow. A biology paper titled "Accelerating Systematic Review with Multi-Agent Orchestration" reaches every researcher in that discipline who faces the same bottleneck — and they search for the tool used.
- Domain-specific conference workshops (e.g. a computational social science workshop, a legal informatics session) are small but concentrated. A 20-minute demo there is seen by the exact decision-makers who would adopt and recommend the tool to their whole department.

---

### Creators, Educators & Operators

People who produce content, train others, or run client-facing work. They discover tools through peer recommendations, creator communities, and revenue stories.

---

#### Content Creators and Media Teams

**Who:** YouTubers, newsletter writers, podcasters, social media teams — people who produce content at volume and need research, drafting, and fact-checking to be faster.

**Where they discover tools:**
- Twitter/X (creator-to-creator sharing)
- YouTube tutorials and "AI tools I use" videos
- Creator newsletters and communities
- What known creators publicly mention using

**Discovery moves:**
- This audience does not read documentation. They watch someone else use the tool first. Reaching 2–3 creators in the "AI tools for creators" niche (YouTube channels with 100k+ subscribers covering AI productivity) with a working demo tailored to their workflow is the entire strategy. One "I used this to research and write my entire newsletter this week" video from a trusted creator reaches their full audience in 24 hours.
- The marginal cost of creating a custom demo for a specific creator's use case is low; the return if they feature it is their entire audience.

---

#### Educators and Students

**Who:** University professors teaching AI, data science, or systems courses; students in those courses who then become practitioners and bring tools with them into their first jobs.

**Where they discover tools:**
- GitHub Education and GitHub Classroom
- Course syllabi shared between professors
- University seminars and lab recommendations
- ISTE (K-12) and ACM SIGCSE (higher education CS) conferences
- Students discover through what their professors assign

**Discovery moves:**
- Getting listed in GitHub Education's toolbox gives immediate exposure to the entire university population that uses GitHub Classroom — which is most CS programs.
- One professor assigning JiuwenSwarm as the platform for a multi-agent systems course project creates a cohort of 30–100 students who use it for a semester, write about it publicly, and carry the habit into their careers. Professors share syllabi with other professors.
- A recorded lecture or tutorial designed for classroom use (posted on YouTube) gets used by professors who don't want to build their own materials — this is a low-effort, high-reach move.

---

#### Agencies and Freelancers

**Who:** Small development agencies, AI consulting freelancers, and independent operators who build on top of AI tools to deliver client work — people looking for leverage to take on more projects without more headcount.

**Where they discover tools:**
- Indie Hackers (community and podcast)
- ProductHunt
- Twitter/X bootstrapper and indie maker community
- My First Million podcast and similar business/operator podcasts
- Word of mouth within agency peer groups

**Discovery moves:**
- The discovery trigger for this group is almost always a revenue story: "here's how I delivered a client project in half the time and doubled my margin." A case study written by a freelancer who actually used JiuwenSwarm, posted on Indie Hackers, gets more traction than any feature announcement — this community is voracious about tools that improve unit economics.
- A ProductHunt launch specifically framed for agencies and freelancers ("build and deploy multi-agent systems for clients") reaches this audience in addition to the general developer audience that ProductHunt already reaches.

---

---

## New Channel: Browser Extension — Audience Fit

The `jiuwenswarm-browser` Chrome extension (in development) is an ambient research
assistant that lives in a side panel while the user browses. It auto-extracts page
content, supports pinning multiple tabs into a research session, and feeds that
context to the agent without copy-pasting. This is a genuinely different capability
from the web app — it meets the user on the page they are already reading.

**Audiences that the browser extension specifically unlocks or accelerates:**

| Audience | Why the extension fits | What it removes |
|---|---|---|
| **Financial Analysts** | They browse SEC EDGAR, Bloomberg, earnings calls, news — the extension reads those pages as they go and lets them ask questions mid-research | The "go to a separate app, paste the text" friction loop |
| **Journalists / Investigators** | They process many pages under deadline — pin a leaked filing, a PACER doc, a news article, ask the agent to cross-reference them | The context-assembly bottleneck |
| **Academic Researchers** | They read papers on arXiv, PubMed, Semantic Scholar — pin 5 papers, ask for synthesis or contradiction analysis | Eliminates PDF download + paste workflow |
| **Legal Professionals** | They read case law on Westlaw/Lexis, contracts in the browser — the extension reads alongside them | Contextual research without breaking reading flow |
| **Product Managers** | They browse competitor sites, review changelogs, read analyst reports — pin and synthesize without leaving the browser | Research synthesis from live sources rather than uploaded files |
| **DevOps / SRE** | They read runbooks, incident post-mortems, Grafana dashboards, monitoring docs during incidents | Contextual agent access during a live incident without switching apps |

**Audiences for which the browser extension adds less:**

| Audience | Why the web app or IDE plugin is a better fit |
|---|---|
| **Software Developers** | They work in their IDE; the IDE plugin is already the right surface. The extension is peripheral to their workflow. |
| **Data Scientists** | They work in JupyterLab; the JupyterLab extension is the right surface. The extension helps for reading papers but not for running experiments. |
| **Data Engineers** | Pipeline work happens in terminals and notebooks, not in the browser. |

**Discovery strategy for the extension:** The browser extension is installable from the
Chrome Web Store with zero server setup perception — users see it as a browser add-on
first. This makes it the lowest-friction entry point for non-developer audiences
(financial analysts, journalists, researchers) who would never install a Python server
but will install a browser extension. The extension then exposes the JiuwenSwarm server
as a local service requirement, which is discoverable once the user is already engaged.

---

## Prioritization

Not all audiences are equal in reachability or strategic value. A rough ranking by **speed to first meaningful user cohort**:

| Audience | Discovery speed | Effort | Leverage |
|---|---|---|---|
| Data scientists | Fast | Low (one HF Space or Kaggle notebook) | High — very online, tool-sharing culture |
| DevOps / SRE | Fast | Low (one HackerNews post) | Medium — converts well if use case resonates |
| Agencies / freelancers | Fast | Low (Indie Hackers post) | Medium — small individual impact, high count |
| Startup founders / solo operators | Fast | Low (one Show HackerNews post) | High — force-multiplier framing resonates immediately |
| QA / test engineers | Fast | Low (one blog post or Show HackerNews) | Medium — active in testing communities, adopt quickly |
| Content creators | Fast | Medium (finding right creator) | Very high — one video = mass reach |
| **Financial analysts (via browser extension)** | **Fast once extension is on Chrome Web Store** | **Medium (LinkedIn post + direct outreach; extension lowers install friction)** | **High — browser extension fits their read-then-analyze workflow exactly** |
| AI / ML researchers | Medium | Low (one arXiv paper) | High — citations compound |
| Cybersecurity | Medium | Low (GitHub + DEF CON) | Medium — niche but loyal |
| Product managers | Medium | Medium (Lenny's community) | High — early adopters, love sharing tools |
| **Journalists / investigators (via browser extension)** | **Medium — browser extension is familiar install; Nieman Lab piece triggers discovery** | **Medium** | **High — document-intensive workflow is a direct fit** |
| **Academic researchers (via browser extension)** | **Medium — arXiv/PubMed users install extensions routinely** | **Low-Medium (one well-placed demo in a research community)** | **High — eliminates PDF copy-paste loop; fits existing browsing habits** |
| Data engineers | Medium | Medium (dbt blog or conference) | Medium — growing community, pipeline-automation resonates |
| Technical writers | Medium | Low (Write the Docs talk or post) | Medium — small community, but docs teams influence developer tooling decisions |
| Financial analysts | Medium | Medium (LinkedIn post + direct outreach) | High — high willingness to pay, large research surface |
| Educators / students | Slow | Medium (GitHub Education) | High — sticky, long-term cohort |
| Business professionals | Slow | High (requires hosted deployment — web app exists, local server is the friction) | High if friction removed |
| Legal professionals | Slow | High (conference + case study) | High — high willingness to pay |
| Healthcare / clinical researchers | Slow | High (requires co-authored research or conference) | High — systematic review bottleneck is acute |
| Academic researchers | Slow | High (requires co-authorship) | Very high — decade-long citation trail |
