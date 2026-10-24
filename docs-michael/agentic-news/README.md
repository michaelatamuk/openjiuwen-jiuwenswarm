# Monthly Agentic AI Briefing

One short briefing per month on the most important agentic AI news around the world.

It is written for someone who follows the industry but does not read every launch. It is ranked
by impact, not by how loud the announcement was, and written in plain English.

## Asking for a month

When I ask for "November" or "December", create `YYYY-MM.md` in this folder, read this note
first, and add the new file to the index at the bottom.

## Research lenses

Each month is researched through independent lenses. Run each lens as a separate sub-agent with
fresh context. Do not use one broad "general" pass: it drifts toward business and platform news and
misses model-layer stories.

**Global technology.** Models, architectures, APIs and SDKs, protocols, benchmarks, open weights,
developer tools and papers. Include **non-generative and structured-output models** —
decision/scoring/classification models, embeddings and rerankers, speech models, world models — not
only chat LLMs. Treat “new model” as **new kind of model**, not only a new LLM; LLM release trackers
are one source, not the definition of the market. Search model cards, API changelogs, GitHub, arXiv,
benchmark leaderboards and engineering blogs, plus startup/product coverage, because a new kind of
model often appears there before it enters LLM trackers. If a source names a new category, search
that term.

**Global products and platforms.** Consumer and enterprise agents, devices, operating systems,
commerce, distribution and adoption.

**Global safety and policy.** Incidents, containment, liability, regulation and standards.

**Global money.** Funding, M&A, IPOs, market structure and major enterprise deals.

**China.** The Chinese market and its technology, in Chinese and English. Cover Chinese model
releases — including non-generative and structured-output models — APIs, benchmarks, open weights,
papers and developer tools as well as platforms, office agents, agent hardware, policy, adoption and
funding. Do not let Chinese model coverage collapse into LLM release trackers. Do not treat China as
only a market or policy story.

Each lens runs in parallel and works from separate notes. No lens gets a list of names; the topic
frame is the only guidance. Each returns a broad memo of everything that might matter: date, what
happened, why it matters, status, and sources. There is no fixed number of items at this stage.

I merge the memos by theme, then run the importance review below, then choose what makes the final
brief. Overlap is normal. If two lenses cover the same event, I keep the better-sourced version. If
they disagree, I say so. For two months at once, run the lenses for each month.

## After the merge: importance review

Research is deliberately broad. Importance is decided only after all memos are merged — not by
the sub-agents while they search.

For each item, ask:

- Does it change what agents can do, who controls access, what it costs, or what is allowed?
- Is it real — shipped, deployed, confirmed — or only announced, preview, reported or rumoured?
- Is it broad or local? A national rule or a platform launch is different from a regional pilot.
- Is it new, or a follow-up to last month?
- Would the reader miss something important if it were removed?

Then give each item one role:

- **Headline** — the stories that changed the direction. These get the top-story treatment.
- **Context** — useful but not decisive. These move to “Also worth knowing.”
- **Cut** — minor product updates, small launches, model benchmark news without agent impact, or
  items that are only a vendor claim.

The number of headlines follows the month. A quiet month may have three; a heavy month may have
seven. Do not force a number.

A big claim with weak evidence is not automatically a headline. Caveat it or downgrade it.

**Pattern check.** After judging items one by one, look for a cluster: three or more companies,
in two or more markets, shipping the same new form factor or capability within a few weeks. If
the cluster exists, treat it as a category even when each individual product is small. Do not let
a new category hide inside “Also worth knowing” just because every launch looked minor on its own.
Example: agent phones, glasses, rings, keychains and pocket assistants became “ambient agent
hardware” in September–October 2026.

**Inside a headline story.** Not every item in a headline is equally important. Keep the
hierarchy:

- **Anchor** — what actually shipped, changed or was confirmed. Put it first.
- **Signal** — what it points to: a major platform entering, a new form factor, a direction. Keep
  it, but label it as early or announced.
- **Support** — scale, OS integration, payments, distribution.
- **Context** — enablers such as chips or components, and minor accessories. Use one context line
  or move them to “Also worth knowing”; do not give them a full bullet.

Example: in an agent-hardware story, the phone that shipped is the anchor; a keychain announced
for December is a signal; glasses with payment are support; a chip is context.

Within each role, order by status and scale: launched/GA first, then beta, then preview or
waitlist, then announced or early access. At the same status, put the larger distribution or
impact first. Do not leave a broad beta below a small private preview. Apply this order **inside
each geographic group** — non-Chinese first, then Chinese — so the China block is ordered on its
own merits, not appended in whatever order it arrived.

**One bullet, one item.** If a bullet contains several products, split out the one that matters
and move the rest to a context line. A bundle of four products hides which one is the story.

**Order the headlines by dependency, not by research chronology.** Start with the biggest shift,
then the layers that enable it, then the consequences, then distribution and market. A useful
default: what the agent is → how it decides → how it runs → what went wrong → where it lives →
how it is sold. Re-read the summary sentence and make the order match it.

## Coverage check

After the importance review, compare the merged pool with the previous brief. If a major thread is
missing, run a targeted search before writing. Absence from the memos is not evidence of absence.

**Do not give the recall list to the discovery agents.** They must find stories on their own;
otherwise the test is rigged and the result proves nothing. The list below is for the editor's final
check only, and it is not evidence that discovery works.

**Completeness audit.** After a clean merge, give a separate auditor agent only the draft and the
month — not the recall list — and ask it to find important stories missing from the draft, using
monthly recaps, newsletters and primary sources. If it finds something, add it. That audit, not the
list, is the test of coverage.

- **Decision models:** Jev/TypeSafe, OpenAI Decisions API, Microsoft-Decision, Cloudflare Clef,
  Snowflake Decision, AWS Strands Decider.
- **Personal agents:** Dots, Muse, Duet, Manus/Cue, Xiaodou, Yuanbao Assistant.
- **Agent hardware:** phones, glasses, rings, keychains, pocket assistants, agent PCs.
- **Protocols and identity:** MCP, A2A, KYA, UCP/WebMCP, agent payments.
- **Control and safety:** runtime permissions, containment, rogue-agent incidents, liability.
- **China:** platforms, office agents, agent phones, policy, export rules, funding.
- **Money:** major M&A, IPOs, large rounds, blocked deals.

A missing known thread is a research failure, not an editorial choice. Check it before the brief is
finished.

**Do not filter reported items out.** Mark them `reported`, `testing` or `announced`; do not delete
them. A blanket "confirmed only" rule systematically penalises China, where launches often surface
first as testing, press reports or leaked projects. Xiaowei, "Spell" and Super Xiaodu were cut this
way in September, and the China block falsely looked empty.

**Region balance test.** If one geographic block has one item and the other has nine, do not accept
it. Ask whether the imbalance is real or a bucketing artefact. Chinese personal agents ship inside
the phone OS, not as standalone apps, so they were filed under hardware and the personal-agents
story looked Western-only. When a product's form differs by market, cross-reference it and say so in
the **Why it matters** line instead of letting the category definition hide it.

**Cut log.** Before finishing, list the major items you cut and why: duplicate, lower impact, weak
evidence, too detailed or out of scope. If something is cut only because the document is full,
reconsider. A cut item is not the same as an unimportant item.

## How the merged brief reads

- China and the rest of the world appear in the same stories when they belong together.
- **Geography is shown by grouping, not by tags.** Inside each story, non-Chinese items come first and
  Chinese items follow under a bold `**China**` divider. Individual bullets then carry only a date,
  not a country: `**Meta Muse (Sep 8):**`. "Also worth knowing" is split into `**Outside China**` and
  `**China**` blocks.
- The `Where` column in the short version still gives the at-a-glance split, because the table has no
  dividers.
- Similar-scale news gets similar space, wherever it comes from.
- The short version is a small table: theme, what happened, where.
- China appears inside the main stories rather than in a separate section.

## Structure

1. **Title + one-sentence summary.** Then a single **"If you read one thing"** line: the month's
   most consequential fact, even if it is not the first story.
2. **The short version** — a small table: `Theme | What happened | Where`. Keep the cells short;
   the detail belongs in the stories. The Theme cell uses the **same wording as the story heading**,
   so the table and the bodies name the same thing. The table follows the order of the stories below,
   not their importance, and says so underneath.
3. **Top stories** — the items that survived the importance review. The month decides how many:
   a heavy month gets more, a quiet month gets fewer. Each story starts with a bold metadata line
   (`**Sep 8–30** — status`), then a one-sentence lead, then a few short bullets (non-Chinese first,
   Chinese under a `**China**` divider), then a **Why it matters** line.
4. **Also worth knowing** — smaller items that still matter, each with a country label.
5. **What changed vs last month.**
6. **What to watch next month.**
7. **Cut log** — what was left out and why.
8. **Sources and caveats.**

Run the **plain-language pass** before the cut log, so the cut log describes real content rather
than sentences that were never readable.

Length follows the month: a normal month is around 900–1,200 words, and a heavy month like
October 2026 can run longer.

## Style

- Plain English, short sentences.
- Explain jargon once.
- **Say what it does, not what it is called.** A bullet should tell the reader what the product
  lets someone do; internal names go in brackets or are dropped. "The Harness plus memory and an
  AG-UI .NET SDK" says nothing. "Until now every team wrote its own code to keep an agent going —
  remembering what it had done, showing the user what it was doing, and picking up after a crash.
  Microsoft now sells that code as a kit" says what happened.
- **Give the contrast, not the feature list.** For infrastructure, the news is usually what used to
  be manual or missing. "Memory, progress streaming and checkpoint/resume" is an inventory of
  parts; the reader needs to know what changed for the team building the agent.
- **Do not paraphrase your own jargon.** If the only change is a synonym — `UI` to `interface`,
  "harness" to "scaffolding" — the sentence is still unexplained. Add the missing context or cut it.
- If a reader needs the vendor's vocabulary to understand a bullet, rewrite the bullet.
- Dates as `Oct 21`; the year in the title.
- Chinese names in English plus Chinese/pinyin on first use.
- Say whether something is announced, in preview, in beta, generally available, on a waitlist,
  testing or reported.
- Mark vendor-run numbers.
- No hype.

## Plain-language pass

Run this after the content is settled and before the cut log. Read every bullet as someone who
works in the industry's *adjacent* world — a policy analyst, a finance reporter, a product manager —
not as an engineer at the company involved.

For each bullet, ask:

1. **Can I say what changed before and after?** If the answer is only a list of features, rewrite it.
   "Memory, progress streaming and checkpoint/resume" fails; "teams used to write this themselves;
   Microsoft now sells it as a kit" passes.
2. **Does it rely on a word I have not defined?** Loop, runtime, harness, sandbox, orchestrator,
   stateless, checkpoint. Define once in the story lead, then reuse.
3. **If the fix is a synonym, have I actually fixed anything?** `UI` → `interface` and `harness` →
   `scaffolding` are not explanations.
4. **Would the sentence still make sense in a year, without the vendor's launch post?** If it only
   parses next to the announcement, it is marketing residue.

Rewrite the bullet, not the reader. If a clause cannot survive question 1, cut the clause rather
than decorate it.

## Status words

- **Launched / GA** — available to customers.
- **Preview / beta** — limited access; may change.
- **Waitlist** — not generally available; people can request access.
- **Testing** — internal tests; no public release.
- **Reported** — press reports or people familiar, not confirmed by the company.
- **Announced** — the company said it will happen; not yet available.

## Sources

Company announcements and reporting. Any credible source is fine. The China lens may use Chinese
sources and translate them; label state media. Cross-check dates and funding numbers.

Link the main source for each top story. When sources disagree on a count, use the best-supported
figure and note the range in the caveats. End with caveats for vendor claims, reported figures,
previews and disputed numbers.

## File index

- `2026-09.md` (previous)
- `2026-10.md` (current; built from five lenses, Oct 24)
- `2026-11.md` (next)

Earlier drafts — September v1 to v4 and October v1 to v2 — are kept in `archive/` for comparison.

## Definition

**Agentic AI** here means software that can plan, call tools, and take actions with some
autonomy — not a chatbot that only writes text. A "personal agent" is an always-on agent that
works for one person across apps. A "decision model" answers typed questions (yes/no, choice,
score) with probabilities instead of writing prose. The **agent loop** is the cycle of asking the
model what to do, running the tool it names, feeding the result back and repeating. The **runtime**
(or harness) is the software that runs that loop: sessions, sandboxes, memory, retries and logs.
