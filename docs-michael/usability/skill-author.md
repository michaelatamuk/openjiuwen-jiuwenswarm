[← Index](README.md) · jiuwenswarm Usability Review

---

# P5 — Skill Author

*Creates skills to publish to the marketplace for others to install — writes `SKILL.md`,
packages Python tools, tests and submits skills.*

Coverage for P5 is partial. The findings below are drawn from §10 (Skill Ecosystem),
which was investigated primarily from the operator/end-user perspective. A dedicated
investigation of the skill authoring workflow will produce additional findings.

---

## §10 · Skill Authoring (Partial)

### 10.3 No Skill Version Management or Rollback

**Current state.**
When a skill is updated — manually or via the evolution system — the previous
version is not retained. If an updated skill breaks, the skill author must manually
reconstruct the old `SKILL.md`. This is especially painful when the evolution system
automatically modifies a skill: there is no diff-for-approval step and no way to
see what changed.

**What good looks like.**
Git-style version history per skill: each save creates a version record. The skill
panel shows: "Current: v1.3 (saved 2h ago). Previous: v1.2, v1.1." One-click
rollback to any previous version. If the evolution system modifies a skill, the
change is shown as a diff for the skill author's approval before being committed.

### 10.4 Skill Testing Has No Infrastructure

**Current state.**
There is no way to test a skill with sample input from the UI before deploying it
to live use. A skill author must trigger the skill through a real chat session to
see how it behaves — there is no sandbox, no dry-run mode, no "test this skill"
panel.

**What good looks like.**
A "Test run" panel in the skill detail view: paste a sample user message, click Run,
see the skill's output. This is the skill equivalent of a unit test — it lets a
skill author validate their `SKILL.md` without affecting real users or sessions.
The trajectory panel already captures this data; wiring it to a skill test UI is
achievable.

### P5 Gaps

The following aspects of skill authoring have not been investigated yet:

- **SKILL.md format documentation** — is there a schema, a linter, or a guide for
  writing well-structured skill prompts?
- **Tool packaging** — how does a skill author package Python tools alongside a
  SKILL.md? What is the directory structure?
- **Submission process** — how does a skill get published to the marketplace?
  What validation does it go through?
- **Skill metadata** — ratings, install counts, author pages — is there an author
  dashboard?

---
