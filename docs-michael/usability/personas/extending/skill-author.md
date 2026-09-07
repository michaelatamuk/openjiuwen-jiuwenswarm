[← Index](../../README.md) · jiuwenswarm Usability Review

---

# Skill Author

*Creates skills to publish to the marketplace for others to install — writes `SKILL.md`,
packages Python tools, tests and submits skills.*

Coverage is partial. The findings below are drawn from the skill-ecosystem concerns,
which were investigated primarily from the Instance Admin and End-User perspective. A dedicated
investigation of the skill authoring workflow will produce additional findings.

---

## Findings

> *The findings in this file are symptoms of a single systemic issue. [Read the root cause →](../../findings/00-overview.md)*

*2 findings.*

### Skills

- **[Skill updates can't be reviewed or rolled back](../../findings/skills/versioning.md#1-skill-updates-cant-be-reviewed-or-rolled-back)** — When the evolution system auto-modifies a skill, there is no diff-for-approval step and no way to recover the previous version.
- **[Skills can only be tested through a live chat](../../findings/skills/authoring-and-testing.md#3-skills-can-only-be-tested-through-a-live-chat)** — A skill author must trigger skills through a real chat session; there is no sandbox or "test this skill" panel to validate a `SKILL.md` before publishing.

### Gaps

The following aspects of skill authoring have not been investigated yet:

- **SKILL.md format documentation** — is there a schema, a linter, or a guide for
  writing well-structured skill prompts?
- **Tool packaging** — how does a skill author package Python tools alongside a
  SKILL.md? What is the directory structure?
- **Submission process** — how does a skill get published to the marketplace?
  What validation does it go through?
- **Skill metadata** — ratings, install counts, author pages — is there an author
  dashboard?
