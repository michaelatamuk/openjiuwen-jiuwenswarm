[← Index](../../README.md) · jiuwenswarm Usability Review

---

# Output & Perceived Speed

*Shaping responses and signalling latency and progress.*

---

## 1 No control over reply length or writing style

**Current state.**
There is no global setting or per-message instruction for response length or style.
If the agent tends to be verbose, the user must add "be brief" to every message.

**What good looks like.**
A persistent preference (saved to MEMORY.md or user config) for response style:
terse / standard / detailed. A per-message override via a small pill control next
to the send button. The agent should read this preference from memory and apply it
without being reminded.

---

## 2 Long agent replies have no structure aids

**Current state.**
`StreamingContent.tsx` renders text with simple whitespace-preserving display.
For long agent responses with multiple sections, there is no table of contents, no
jump-to-section, no folding.

**What good looks like.**
Auto-detect headers in agent output (`## Section`) and render a sticky mini-TOC
at the top of the message panel for long responses. Collapsible sections for
code blocks and lengthy reasoning chains.

---

## 3 Nothing is shown while waiting for the first token

**Current state.**
`StreamingContent.tsx` renders tokens as they arrive. But between submitting a
message and the first token appearing, there is a gap (model warm-up, context
assembly, routing). During this gap the user sees nothing — no spinner, no progress.

**What good looks like.**
Immediately on message submit, show an animated "thinking" indicator (three dots,
a pulsing bar) that disappears when the first token arrives. The `HarnessProgressBar`
component already exists — it should be visible from the moment the user submits.

---

## 4 No warning before the context limit drops early memory

**Current state.**
There is a proactive notification for "context limit reached" via WebSocket, but
this appears only at the limit. Users have no advance warning.

**What good looks like.**
A small token counter in the chat input area, similar to what Claude.ai and ChatGPT
show. At 70% capacity, change color to yellow. At 90%, show a warning: "Approaching
context limit — older messages may be summarized." This gives users time to start a
new session before the agent starts forgetting early context.

---

## 5 Long-running skills show no progress

**Current state.**
When a skill is executing (potentially for minutes), the user sees only a generic
tool call card. There is no progress bar, no step count, no estimated time.

**What good looks like.**
Skills should be able to emit progress events that render as a live progress bar
in the tool call card: "parse-invoice: processed 3 of 12 files…". This requires a
lightweight progress protocol in the skill execution harness, but the UI infrastructure
(`HarnessProgressBar`) already exists.

---
