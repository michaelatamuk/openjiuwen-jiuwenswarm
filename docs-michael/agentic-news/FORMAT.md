# Brief Format

## Reference example

`2026-10-alt.md` is the reference implementation of this format. When in doubt, look at how
something is handled there.

---

## Structure

Every brief has these sections, in this order:

1. **Opening paragraph** — two to four sentences. Describes the state of the field at the end of
   the month, not a list of events. The reader should understand what changed and why it matters
   before reading anything else.

2. **Main sections** — one section per major development of the month. A heavy month gets more; a
   quiet month gets fewer. Each section:
   - A **section header that is a complete sentence** describing what happened: "Personal AI
     assistants became something you can buy in a store." Not a category label like "Products" or
     "Personal agents."
   - A **one- to three-sentence lead** that sets up what the section covers and why it matters.
     Significance belongs here, not in a labelled "Why it matters:" paragraph at the end.
   - The **body** — either named entries or prose, depending on the story (see below).

3. **Also in October** — items that matter but are not large enough for a full section. A flat
   bullet list. Each bullet names the company or product, says what it is, and says what happened.

4. **What was different this month vs [last month]** — a short bullet list. The most important
   change first.

5. **What to watch in [next month]** — a short bullet list. Concrete, testable questions.

6. **How confident are we in each claim** — a bullet list. One line per claim that is not
   confirmed: what the claim is, and what kind of evidence it rests on (press report, vendor
   number, estimate, not yet filed).

7. **Sources** — all source links as inline hyperlinks in a single flowing list separated by ·
   dots. Not a bibliography. Not grouped by story. If a source covers multiple stories, list it
   once.

8. **What was left out and why** — two paragraphs. First: items that were cut and the reason.
   Second: items the research process missed, added later, and why they were missed. This is an
   honest record, not a formality.

---

## Named entries vs. prose — the rule

**Use named entries** (`**Company Name (date):**` then description) when each actor did something
different that the reader needs to know specifically. Example: eight companies each launched a
different product. The reader needs to know what each one did.

**Use prose** when multiple actors did the same thing and the point is the pattern, not the
individual differences. Example: two labs both cut internet access in the same month. The story is
the simultaneity and what it means — not a list of how Anthropic's version differed from OpenAI's.

Apply this rule consistently. Do not mix the two within a section without a reason.

---

## Geography

There are no geographic sections or dividers inside the main sections. Every company or product
gets its own entry at the same level regardless of where it is from. A Chinese phone maker's
product launch gets the same named-entry treatment as an American one.

Geography appears only in **Also in October** and in the **short version table** (if used). In
"Also in October" you may group by region if the items are genuinely region-specific and have no
natural counterpart in another region. Do not group by region if the items are the same kind of
story (a Chinese funding round belongs next to a US funding round, not in a separate block).

---

## Self-contained writing

Every product, company and technical term must be explained on its first appearance with one
appended clause. The reader should not need to look anything up.

- **Right:** "Vercel provides sandboxed computing environments — isolated containers where AI
  agents can run code safely, separated from the rest of the system."
- **Wrong:** "A vulnerability in Vercel Sandbox allowed a rogue agent to exfiltrate data."

The same rule applies to acronyms, standards names and regulatory instruments. Name it, then say
what it does.

---

## Section headers

Section headers are complete sentences that tell the reader what happened. They are not category
labels.

- **Right:** "The two largest AI labs admitted they could not control their assistants on the
  internet — and disconnected them"
- **Wrong:** "Safety" or "Lab incidents" or "Internet access"

The header should be specific enough that a reader skimming only the headers gets an accurate
picture of the month.

---

## Significance

Do not use a labelled "Why it matters:" paragraph. Write the significance into the prose directly.
If a fact needs a separate paragraph to explain why it matters, the original sentence did not carry
enough information.

- **Right:** "The benchmark leader this month is a model embedded in a data-warehouse product — a
  sign that decision scoring is being absorbed into existing infrastructure rather than sold as a
  standalone service."
- **Wrong:** "Snowflake Decision ranked first.\n\n**Why it matters:** This signals that decision
  scoring is becoming infrastructure."

---

## Style

- Plain English. Short sentences. No jargon without an immediate explanation.
- Say what the product does, not what it is called. "A wearable clip that acts as a personal AI
  assistant" is information. "Amazon's first agentic wearable" is not.
- Give the contrast. "Until now these existed only as subscriptions; this month they went on sale
  as hardware under $100" tells the reader what changed. A feature list does not.
- Dates as `Oct 21`; the year in the title only.
- Mark unconfirmed claims at the point of use: "about 25% daily use, according to press reports"
  or "— vendor numbers" inline. Do not rely on the confidence section to carry caveats that belong
  in the sentence.
- No hype. Do not use "revolutionary", "groundbreaking", "game-changing" or similar.

---

## Status words

Use these words exactly when the item is not generally available.

| Word | Meaning |
|---|---|
| **GA** | Available to anyone now. |
| **Beta** | Limited access; features may change. |
| **Preview** | Limited access; may change. Use when the company uses this word. |
| **Waitlist** | Not generally available; people can request access. |
| **Testing** | Internal tests; no public release. |
| **Announced** | Said it will happen; not yet available. |
| **Reported** | Press reports or people familiar, not confirmed by the company. |

---

## Length

Length follows the month. A normal month: roughly 1,200–1,600 words in the body (not counting
sources, confidence section and cut log). A heavy month: longer. A quiet month: shorter. Do not
pad to hit a word count.

The right length is the minimum needed to give the reader an accurate picture of the month.
