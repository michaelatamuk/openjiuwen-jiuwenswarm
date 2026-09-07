[← Index](../../README.md) · jiuwenswarm Usability Review

---

# Skill Authoring & Dependencies

*Creating, installing and testing skills.*

---

## 1 Creating a skill has no clear entry point

**Current state.**
Creating a skill routes between `skill-creator-normal`, `swarmskill-creator`, and
`skill-omni-creation` based on what the user types into the chat input. The routing
logic lives inside the `SKILL.md` of the skill-creator skill itself — not in any
user-facing UI. A user wanting to create a skill has no guided entry point.

**What good looks like.**
A "Create Skill" button in the Skills panel (`SkillPanel/index.tsx`) that opens a
short wizard: what kind of skill? (single-agent / team / from URL) — and routes the
user to the right creator with an opening prompt already filled in.

---

## 2 Skill Python dependencies and conflicts are invisible

**Current state.**
Skills can have Python `requirements.txt`. These are presumably installed at skill
load time, but there is no UI showing which skills have dependencies, whether they
are installed, or whether two skills conflict.

**What good looks like.**
A dependency panel per skill showing: required packages, installed status, version
conflicts with other installed skills. A "Install dependencies" button that runs in
the background with a progress indicator.

---

## 3 Skills can only be tested through a live chat

**Current state.**
There is no way to test a skill with sample input from the UI before deploying it
to live use. The user must trigger the skill through a real chat session.

**What good looks like.**
A "Test run" panel in the skill detail view: paste a sample input, click Run, see
the output. This is the skill equivalent of a unit test. The trajectory panel already
captures this data — wiring it to a skill test UI is achievable.

---
