[← Index](../../README.md) · jiuwenswarm Usability Review

---

# Skill Versioning

*Updating and rolling back skills.*

---

## 1 Skill updates can't be reviewed or rolled back

**Current state.**
When a skill is updated — manually or via the evolution system — the previous
version is not retained. If an updated skill breaks, the user must manually
reconstruct the old `SKILL.md`.

**What good looks like.**
Git-style version history per skill: each save creates a version record. The skill
panel shows: "Current: v1.3 (saved 2h ago). Previous: v1.2, v1.1." One-click
rollback to any previous version. If the evolution system modifies a skill, the
change is shown as a diff for user approval before being committed.

---

