[← Index](../README.md) · jiuwenswarm Usability Review

---

# §10 · Skill Ecosystem

*Discovering, installing, and managing skills across the instance.*

*Primary persona: P2. Also relevant to: P5.*

---

## 10.1 Skill Marketplace Has No Quality Signals

**Current state.**
`MarketplacePage.tsx` shows skill cards with logo, name, status, and install button.
There are no ratings, no usage counts, no author reputation, no reviews, no "last
updated" date. Users cannot assess quality before installing.

**What good looks like.**
Each skill card should show:
- Star rating (1–5) from community or internal team.
- Number of installs.
- Last updated date.
- Author verified badge (if published by the jiuwenswarm team).
- A one-paragraph description and a "Preview" that shows the SKILL.md content.

---

## 10.2 No Skill Dependency Management

**Current state.**
Skills can have Python `requirements.txt`. These are presumably installed at skill
load time, but there is no UI showing which skills have dependencies, whether they
are installed, or whether two skills conflict.

**What good looks like.**
A dependency panel per skill showing: required packages, installed status, version
conflicts with other installed skills. A "Install dependencies" button that runs in
the background with a progress indicator.

---

## 10.3 No Skill Version Management or Rollback

**Current state.**
When a skill is updated — manually or via the evolution system — the previous
version is not retained. If an updated skill breaks, the user must manually
reconstruct the old `SKILL.md`.

**What good looks like.**
Git-style version history per skill: each save creates a version record. The skill
panel shows: "Current: v1.3 (saved 2h ago). Previous: v1.2, v1.1." One-click
rollback to any previous version. If the evolution system modifies a skill, the
change is shown as a diff for user approval before being committed.

**Skill author note.**
When a skill is updated — manually or via the evolution system — the previous version is not retained. If an updated skill breaks, the skill author must manually reconstruct the old `SKILL.md`. This is especially painful when the evolution system automatically modifies a skill: there is no diff-for-approval step and no way to see what changed. The "diff for user approval" step is critical for skill authors, as it gives them an explicit review gate before a system-generated modification is committed.

---

## 10.4 Skill Testing Has No Infrastructure

**Current state.**
There is no way to test a skill with sample input from the UI before deploying it
to live use. The user must trigger the skill through a real chat session.

**What good looks like.**
A "Test run" panel in the skill detail view: paste a sample input, click Run, see
the output. This is the skill equivalent of a unit test. The trajectory panel already
captures this data — wiring it to a skill test UI is achievable.

**Skill author note.**
There is no way to test a skill with sample input from the UI before deploying it to live use. A skill author must trigger the skill through a real chat session to see how it behaves — there is no sandbox, no dry-run mode, no "test this skill" panel. A "Test run" panel in the skill detail view lets a skill author validate their `SKILL.md` without affecting real users or sessions. The trajectory panel already captures this data; wiring it to a skill test UI is achievable.
