[← Index](../README.md) · jiuwenswarm Usability Review

---

# §5 · Onboarding & First-Run Experience

*The experience from `pip install` to first successful task.*

---

## 5.1 The Setup Wizard Ends Too Early

**Current state.**
`ModelSetupGuide.tsx` has 3 steps: welcome → settings spotlight → models module
spotlight. The wizard ends at the models panel. The user must then figure out how
to fill in provider credentials and validate them. If the model is misconfigured,
the error only appears on the first chat.

**What good looks like.**
The wizard should not complete until the user has sent one successful message. Every
step should be testable inline. Suggested flow:
1. Welcome — what jiuwenswarm does in 3 bullet points.
2. Choose model provider — dropdown with logos (DeepSeek, OpenAI, Anthropic,
   Huawei MaaS, Azure, Custom). Each option shows which fields are required.
3. Enter credentials — with a "Test connection" button that makes a live API call.
   Show: ✓ Connected (320ms) or ✗ Invalid API key — check your provider dashboard.
4. (Optional) Enable a channel — Feishu, Telegram, etc., same test pattern.
5. Send your first message — prefilled with a suggested starter task.

The guide should be re-enterable at any time (e.g. from a `?` icon), not just on first run.

---

## 5.2 Empty State Has No Direction

**Current state.**
An empty conversation shows a blank input area. There is a `WelcomeBubble` component
with adaptive positioning, but its content is not known without reading the code.

**What good looks like.**
The empty state should show:
- 3–5 example tasks tailored to the active mode ("Parse my invoices", "Refactor
  this Python file", "Search the web for…").
- A prompt suggestion chip that inserts the text into the input on click.
- A "What can I do?" link that opens a short capability overview.

---

## 5.3 No Progressive Onboarding After First Use

**Current state.**
After the setup wizard there is no further onboarding. Features like trajectory,
skills, team mode, memory, and the connector market are never introduced unless
the user stumbles upon them.

**What good looks like.**
A "tip of the session" system: once per new feature area first encountered, show a
small non-blocking tooltip. Examples:
- First time an agent completes a multi-step task: "Did you know you can see exactly
  what the agent did? Open the Trajectory panel →"
- First time the agent writes a file: "You can review file changes before they're
  applied. Enable change preview in settings →"
- After 5 sessions: "You've had 5 conversations. Memory lets the agent remember your
  preferences. Enable it →"

---

## 5.4 CLI First-Run Has No Guidance

**Current state.**
Running `jiuwenswarm` from the terminal with no config gives an unclear error. There
is no `jiuwenswarm --help` output that walks through what to do first.

**What good looks like.**
```
$ jiuwenswarm
No config found at ~/.jiuwenswarm/config/config.yaml.
Run 'jiuwenswarm-init' to set up your workspace, then 'jiuwenswarm-start'.
```
And `jiuwenswarm-init` should interactively prompt for the minimum required
configuration (model provider, API key) before exiting.
