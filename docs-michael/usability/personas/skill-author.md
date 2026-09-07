[← Index](../README.md) · jiuwenswarm Usability Review

---

# P5 — Skill Author

*Creates skills to publish to the marketplace for others to install — writes `SKILL.md`,
packages Python tools, tests and submits skills.*

Coverage for P5 is partial. The findings below are drawn from §10 (Skill Ecosystem),
which was investigated primarily from the operator/end-user perspective. A dedicated
investigation of the skill authoring workflow will produce additional findings.

---

## Findings

*2 findings across 1 concern area.*

### §10 · Skill Ecosystem

- **[10.3 No Skill Version Management or Rollback](../findings/10-skill-ecosystem.md#103-no-skill-version-management-or-rollback)** — When the evolution system auto-modifies a skill, there is no diff-for-approval step and no way to recover the previous version.
- **[10.4 Skill Testing Has No Infrastructure](../findings/10-skill-ecosystem.md#104-skill-testing-has-no-infrastructure)** — A skill author must trigger skills through a real chat session; there is no sandbox or "test this skill" panel to validate a `SKILL.md` before publishing.

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
