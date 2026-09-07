[← Index](../README.md) · jiuwenswarm Usability Review

---

# §7 · Performance & Perceived Speed

*Does the system feel fast, and does it communicate when it is not?*

*Primary persona: P1. Also relevant to: P13.*

---

## 7.1 No First-Token Latency Indicator

**Current state.**
`StreamingContent.tsx` renders tokens as they arrive. But between submitting a
message and the first token appearing, there is a gap (model warm-up, context
assembly, routing). During this gap the user sees nothing — no spinner, no progress.

**What good looks like.**
Immediately on message submit, show an animated "thinking" indicator (three dots,
a pulsing bar) that disappears when the first token arrives. The `HarnessProgressBar`
component already exists — it should be visible from the moment the user submits.

---

## 7.2 No Indication of Context Length Pressure

**Current state.**
There is a proactive notification for "context limit reached" via WebSocket, but
this appears only at the limit. Users have no advance warning.

**What good looks like.**
A small token counter in the chat input area, similar to what Claude.ai and ChatGPT
show. At 70% capacity, change color to yellow. At 90%, show a warning: "Approaching
context limit — older messages may be summarized." This gives users time to start a
new session before the agent starts forgetting early context.

---

## 7.3 Skill Execution Has No Progress Feedback

**Current state.**
When a skill is executing (potentially for minutes), the user sees only a generic
tool call card. There is no progress bar, no step count, no estimated time.

**What good looks like.**
Skills should be able to emit progress events that render as a live progress bar
in the tool call card: "parse-invoice: processed 3 of 12 files…". This requires a
lightweight progress protocol in the skill execution harness, but the UI infrastructure
(`HarnessProgressBar`) already exists.
