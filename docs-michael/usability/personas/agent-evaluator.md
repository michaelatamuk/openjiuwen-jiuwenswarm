[← Index](../README.md) · jiuwenswarm Usability Review

---

# Agent QA / Evaluator

*Tests agent quality: runs benchmark tasks, compares model responses across versions, measures task success rate, and catches regressions before they reach users.*

This persona treats the agent as a system under test. They write evaluation suites, run them against the agent, and interpret the results. They may be a developer, a researcher, or a dedicated QA role. Their goal is to answer: "Is this version of the agent better or worse than the previous one, and for which task types?"

**Key questions this persona needs answered:**
- Can I run a fixed set of tasks against the agent and get structured, comparable results?
- Can I replay a specific session exactly — same model, same context, same tool calls — to isolate what changed?
- Can I compare two model versions side-by-side on the same task?
- Can I measure task success rate automatically, without manually reviewing every output?
- Can I run evaluations in CI/CD without standing up the full jiuwenswarm stack?

---

## Findings

*Not yet investigated. The findings below are expected based on the current codebase state — they will be confirmed and detailed when this persona is formally covered.*

### Expected finding areas

**No golden-set eval framework** — There is no built-in way to define a set of input/expected-output pairs and run them automatically against the agent.

**No deterministic replay** — Sessions cannot be replayed exactly. Even with the same input, model temperature and tool call ordering may differ.

**Trajectory data is not eval-friendly** — The trajectory system captures all agent activity, but there is no query interface for "give me all sessions where tool X was called and the response contained Y."

**No version comparison UI** — There is no way to run the same task against two different model configurations and view the outputs side-by-side.

**No CI integration** — Running evals requires the full jiuwenswarm stack. There is no lightweight eval harness, no Docker Compose for CI, no headless mode that skips the Web UI.

**No task success metric** — There is no built-in notion of task success/failure. Evaluators must implement their own scoring on top of raw trajectory data.
