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

*(Full finding → P2 chapter, §10.3)*

Skill authors are the ones who update `SKILL.md`. When the evolution system
automatically modifies a skill, there is no diff-for-approval step and no way to
roll back to a previous version. This affects skill authors more directly than
operators — it is their work that gets overwritten.

### 10.4 Skill Testing Has No Infrastructure

*(Full finding → P2 chapter, §10.4)*

A skill author cannot test their skill with sample inputs from the UI before
submitting it to the marketplace. Every test requires a live chat session. A
dedicated skill test runner (paste input, see output) is the most important
unimplemented tool for this persona.

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
