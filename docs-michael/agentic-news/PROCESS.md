# Research and Editorial Process

## Workflow — run in this order

1. [Run five lenses in parallel](#1-research-lenses)
2. [Merge memos by theme](#2-merge)
3. [Run importance review on merged pool](#3-importance-review)
4. [Check coverage against recall table](#4-coverage-check) ← do not give this to discovery agents
5. [Run completeness audit with a fresh agent](#5-completeness-audit)
6. [Run final sweep across named outlets](#6-final-sweep)
7. [Run plain-language pass on every bullet](#7-plain-language-pass)
8. [Write the cut log](#8-cut-log)
9. [Verify source integrity](#9-source-integrity-check)

---

## 1. Research lenses

Run each lens as a separate sub-agent with fresh context. No lens gets a list of names; the topic
frame is the only guidance. Each returns a broad memo of everything that might matter: date, what
happened, why it matters, status, and sources. There is no fixed number of items at this stage.

### Global technology

Models, architectures, APIs and SDKs, protocols, benchmarks, open weights, developer tools and
papers. Include **non-generative and structured-output models** — decision/scoring/classification
models, embeddings and rerankers, speech models, world models — not only chat LLMs.

Treat "new model" as **new kind of model**, not only a new LLM. LLM release trackers are one
source, not the definition of the market. Search model cards, API changelogs, GitHub, arXiv,
benchmark leaderboards and engineering blogs, plus startup and product coverage, because a new
kind of model often appears there before it enters LLM trackers. If a source names a new category,
search that term.

**Hard requirement:** check the changelogs of non-AI-primary vendors explicitly — Snowflake,
Databricks, Salesforce Einstein, Oracle OCI AI, AWS Bedrock, Azure AI Studio, SAP AI Core. These
vendors ship models and agent tools inside data-platform products, not in AI-specific outlets.
Missing them is a systematic failure mode.

### Global products and platforms

Consumer and enterprise agents, devices, operating systems, commerce, distribution and adoption.

### Global safety and policy

Incidents, containment, liability, regulation and standards. Also record what labs and platforms
**stopped** doing — paused training, withdrawn internet access, delayed launches, blocked
integrations — because a retreat is a decision, not an incident, and the other lenses do not see
it.

### Global money

Funding, M&A, IPOs, market structure and major enterprise deals.

**Hard requirement:** scan general business press (Reuters, Bloomberg, FT), not only AI funding
trackers. An M&A deal where an AI company acquires a non-AI-primary company will not appear in
AI-specific funding roundups; the AI connection is in the strategic rationale, not the headline.

### China

The Chinese market and its technology, in Chinese and English. Cover Chinese model releases —
including non-generative and structured-output models — APIs, benchmarks, open weights, papers
and developer tools as well as platforms, office agents, agent hardware, policy, adoption and
funding. Do not let Chinese model coverage collapse into LLM release trackers. Do not treat China
as only a market or policy story.

**Naming note:** Chinese product launches often have three simultaneous names — internal codename,
official Chinese name, English name in international coverage — and none of them match. When a
product is found under one name, search the others. Xiaodou = Spell = 小豆. Qwen Go = Personal
Agent = 通义去. Search by company name (Alibaba, ByteDance, Tencent, Moonshot, Zhipu, MiniMax,
StepX, OPPO AI) not only by product name.

---

## 2. Merge

Merge the memos by theme. Overlap is normal — keep the better-sourced version. If two lenses
disagree, say so. For two months at once, run the lenses for each month separately.

---

## 3. Importance review

Research is deliberately broad. Importance is decided only after all memos are merged — not by the
sub-agents while they search.

For each item, ask:

- Does it change what agents can do, who controls access, what it costs, or what is allowed?
- Is it real — shipped, deployed, confirmed — or only announced, preview, reported or rumoured?
- Is it broad or local? A national rule or a platform launch is different from a regional pilot.
- Is it new, or a follow-up to last month?
- Would the reader miss something important if it were removed?

Give each item one role:

- **Headline** — stories that changed the direction. These get the top-story treatment.
- **Context** — useful but not decisive. Move to "Also worth knowing."
- **Cut** — minor product updates, small launches, model benchmark news without agent impact, or
  items that are only a vendor claim.

The number of headlines follows the month. A quiet month may have three; a heavy month may have
seven. Do not force a number.

A big claim with weak evidence is not automatically a headline. Caveat it or downgrade it.

**Pattern check.** After judging items one by one, look for a cluster: three or more companies, in
two or more markets, shipping the same new form factor or capability within a few weeks. If the
cluster exists, treat it as a category even when each individual product looked minor. Do not let
a new category hide in "Also worth knowing."

**Inside a headline story.** Keep the hierarchy:

- **Anchor** — what actually shipped, changed or was confirmed. Put it first.
- **Signal** — what it points to: a major platform entering, a new form factor, a direction. Label
  it as early or announced.
- **Support** — scale, OS integration, payments, distribution.
- **Context** — enablers such as chips or components. One context line or move to "Also worth
  knowing."

Within each role, order by status and scale: launched/GA first, then beta, then preview or
waitlist, then announced or early access. At the same status, put the larger distribution first.
Apply this order **inside each geographic group** — non-Chinese first, then Chinese — so the China
block is ordered on its own merits.

**Order the headlines by dependency, not by research chronology.** Start with the biggest shift,
then the layers that enable it, then the consequences, then distribution and market.

**Do not filter reported items out.** Mark them `reported`, `testing` or `announced`; do not
delete them. A blanket "confirmed only" rule systematically penalises China, where launches often
surface first as testing, press reports or leaked projects.

**Region balance test.** If one geographic block has one item and the other has nine, ask whether
the imbalance is real or a bucketing artefact before accepting it.

---

## 4. Coverage check

**Do not give this table to discovery agents.** It is for the editor's final check only. The table
is not evidence that discovery works; it is a backstop for when it fails.

After the importance review, work through every row below. Mark each item: **covered** (in the
draft), **absent** (not in the draft), or **gap** (partially covered, needs a targeted search).
For every **absent** or **gap** item, run a targeted search before finishing.

A missing known thread is a research failure, not an editorial choice.

| Category | Items to verify each month |
|---|---|
| **Decision models** | TypeSafe/Jev, OpenAI Decisions API, Microsoft-Decision, Cloudflare Clef, Snowflake Decision, AWS Strands Decider, Liquid AI, any new entrant in the Jev Decision Index |
| **Personal agents** | OpenAI Dots, Meta Muse, Anthropic Duet, Manus/Cue, Instinct; China: Xiaodou/Spell, Yuanbao Assistant, Qwen Go, Xiaowei/WeChat |
| **Agent hardware** | Agent phones, glasses, rings, keychains, pocket assistants, agent PCs; China: iFlytek, StepX, OPPO AI Mind, Qwen hardware |
| **Protocols and identity** | MCP (spec version), A2A (version, signed Agent Cards), KYA, UCP, WebMCP; new W3C or IETF drafts |
| **Agent payments** | AP2 mandate spec, Visa TAP, Mastercard Agent Pay, ACP (OpenAI/Stripe), Stripe MPP; any payment-network agent update |
| **Control and safety** | Runtime permissions, sandbox escapes, rogue-agent incidents, liability allocation; what the labs **stopped** doing |
| **China** | ByteDance/Doubao, Tencent/Yuanbao/WeChat, Alibaba/Qwen, Moonshot/Kimi, MiniMax, Zhipu, DeepSeek, StepX; MIIT/CAC/MOFCOM policy; funding rounds |
| **Money** | Rounds ≥$100M; M&A where the acquirer or strategic rationale is agent-related; IPOs; large compute deals |
| **Non-AI-primary vendors** | Snowflake, Databricks, Salesforce, Oracle, SAP, ServiceNow, Workday — each may have shipped agent models or tools inside a platform update |
| **Enterprise harnesses** | Microsoft Foundry/Agent Framework, AWS Bedrock AgentCore, Google Agent Development Kit; major version releases |

---

## 5. Completeness audit

Give a separate auditor agent only the draft and the month — not the recall table. Ask it to find
important stories missing from the draft, using monthly recaps, newsletters and primary sources.
If it finds something, add it.

That audit, not the recall table, is the real test of coverage quality.

---

## 6. Final sweep

**This is not optional.**

Fetch the front page (or AI/tech section, page 1 and 2) of each outlet below. List every headline
not already in the draft. Add anything important.

| Outlet | Why it's here |
|---|---|
| [The Verge](https://www.theverge.com/ai-artificial-intelligence) | Consumer tech and platform decisions |
| [TechCrunch](https://techcrunch.com/category/artificial-intelligence/) | Startup launches, funding and lab announcements |
| [Reuters Technology](https://www.reuters.com/technology/) | Business wire; M&A, enterprise deals, policy |
| [The Record](https://therecord.media/) | Security incidents, sandbox escapes, breach coverage |
| [TechNode](https://technode.com/) | China tech in English; platform launches, policy, funding |

The lenses are framed by topic, so they systematically miss anything that is a **decision** rather
than an **event**: a lab withdrawing access, a platform closing a door, a launch delayed, a policy
paused. The sweep catches these because it reads the front page directly rather than searching by
topic.

September's sweep found nothing the lenses had missed. October's found the month's lead story
(Anthropic and OpenAI both cutting their agents off the live internet), OpenAI's Decisions API,
the US order to remove DeepSeek, Tesla Optimus production, and the Orchestra Bio acquisition. All
five lenses had missed them.

---

## 7. Plain-language pass

Run this after the content is settled and before the cut log. Read every bullet as someone who
works in the industry's adjacent world — a policy analyst, a finance reporter, a product manager —
not as an engineer at the company involved.

For each bullet, ask:

1. **Can I say what changed before and after?** If the answer is only a list of features, rewrite
   it. "Memory, progress streaming and checkpoint/resume" fails; "teams used to write this
   themselves; Microsoft now sells it as a kit" passes.
2. **Does it rely on a word I have not defined?** Loop, runtime, harness, sandbox, orchestrator,
   stateless, checkpoint. Define once in the story lead, then reuse.
3. **If the fix is a synonym, have I actually fixed anything?** `UI` → `interface` is not an
   explanation.
4. **Would the sentence still make sense in a year, without the vendor's launch post?** If it only
   parses next to the announcement, it is marketing residue.

Rewrite the bullet, not the reader. If a clause cannot survive question 1, cut the clause.

---

## 8. Cut log

Before finishing, list every major item cut and why: duplicate, lower impact, weak evidence, too
detailed or out of scope. If something is cut only because the document is full, reconsider.

A cut item is not the same as an unimportant item.

---

## 9. Source integrity check

Before publishing, verify that every URL in the **Sources and caveats** section maps to at least
one claim in the body of the document. A URL with no corresponding sentence is either an editorial
error (content was drafted but dropped) or a stale reference that should be removed.

Run this check: for each source URL, find the sentence it supports. If none exists, either write
the sentence or remove the URL.

---

## Sources policy

Link the main source for each top story. Any credible source is acceptable. The China lens may use
Chinese sources and translate them; label state media. Cross-check dates and funding numbers.

When sources disagree on a count, use the best-supported figure and note the range in caveats.
End the brief with caveats for vendor claims, reported figures, previews and disputed numbers.
