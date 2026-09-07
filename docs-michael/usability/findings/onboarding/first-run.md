[← Index](../../README.md) · jiuwenswarm Usability Review

---

# First Run

*The path from install to first success.*

---

## 1 Setup wizard ends before the model is confirmed working

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

## 2 Running the CLI without config gives no next step

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

---
