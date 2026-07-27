# Requirements Analysis — JiuwenSwarm SkillsBench Score Improvements

---

## Source of Demand

- **Proactive Planning** — Performance Enhancement
- **Product Requirements** — JiuwenSwarm Product / Benchmark Quality & Reliability

---

## Demand Background

### WHY

JiuwenSwarm is our AI agent system designed to solve real-world programming and data tasks autonomously. SkillsBench is an external benchmark with 87 such tasks — each scored pass or fail — that measures how reliably an agent can complete them without human help.

Currently, JiuwenSwarm fails on the majority of these tasks. Analysis of failure patterns reveals the causes are not deep reasoning gaps but a set of well-understood, fixable operational problems: the agent crashes mid-task, gets stuck repeating the same failing action, loses track of what it is supposed to produce, wastes its limited step budget on redundant work, or writes the right answer to the wrong file path. Each of these failure modes has a concrete engineering fix.

This document proposes a coordinated set of 20 improvements — across both the JiuwenSwarm runtime and its underlying agent-core engine — that together address every major failure category. The improvements are designed to be layered on top of each other; each one independently increases the pass rate, and all together they are expected to push the score from the current baseline to the highest achievable level, potentially passing all 87 tasks.

### WHEN

All improvements are targeted for delivery within the current development cycle. Several are already implemented in feature branches and are ready for integration testing. The remainder are planned and will be built to complete the full set.

### WHAT

The 20 improvements are grouped below by the problem they solve. Each is a proposal — to be built and shipped — not yet active in the production system.

---

#### Group 1 — Stability: Stop the agent from crashing before it even starts

**Event Loop Fix (agent-core #28 and jiuwenswarm #119)**
Two separate but identical fixes — one at the engine level, one at the runtime level — that prevent the system from freezing or crashing due to an async programming error. Without these, tasks can silently die before any useful work is done.

**ACP Tool Unblock (jiuwenswarm #139)**
A bug fix that stops the runtime from incorrectly refusing to let the agent use tools it legitimately needs. Tasks were failing simply because a required action was blocked by mistake.

---

#### Group 2 — Scale: Try more than one approach, submit the best

**Multi-Rollout Task Execution (agent-core #38)**
Instead of making one attempt at a task, the system runs the same task multiple times in parallel — each attempt using a different strategy. The strongest result is submitted. More attempts means a higher chance that at least one attempt succeeds.

**Auto-Harness Best-of-N (agent-core #37)**
When the agent's output fails an internal quality check, the system automatically generates several repaired versions in parallel and promotes the best one. This turns a single failure into a self-correcting process.

---

#### Group 3 — Session Start: Make sure the agent begins with everything it needs

**Task Description Re-injection (jiuwenswarm #371)**
The agent's task instructions are locked into a permanent part of its memory that cannot be overwritten or forgotten as the session progresses. Without this, the agent can drift away from the original goal mid-task.

**Output Format Reminder (jiuwenswarm #401)**
Before the agent starts working, it is told exactly what format and structure the final answer must take. This prevents the agent from producing a correct answer in the wrong format, which scores zero.

**External Skill Discovery (jiuwenswarm #214)**
At the start of each task, the system scans the task environment and shows the agent which specialist tools and skill scripts are available for that specific task. Agents that know the right tools exist are far more likely to use them correctly.

---

#### Group 4 — Budget Awareness: Don't waste the limited number of steps

**Iteration Budget Awareness (jiuwenswarm #368)**
When the agent is running low on available steps, it receives an explicit warning and is directed to wrap up the task immediately. This prevents the agent from running out of steps mid-solution.

**Tool Call Deduplication Cache (jiuwenswarm #372)**
If the agent tries to run an identical action it has already run, the system returns the cached result instantly instead of spending a step on a redundant operation. This saves budget for productive work.

**Autonomous Execution Mode (jiuwenswarm #370)**
Language that causes the agent to pause and ask for human confirmation is replaced with language that tells it to decide and act on its own. This removes unnecessary stalls that consume time and steps without making progress.

---

#### Group 5 — Loop Breaking: Escape patterns that consume steps without progress

**Anti-Repetition Prompt Fix (agent-core #26)**
A change to the agent's core instructions that discourages it from repeating the same reasoning or action over and over. Repetition loops are one of the most common ways tasks fail — the agent burns its entire step budget going in circles.

**Failure Pattern Memory Rail (jiuwenswarm #396)**
The system keeps a running list of actions the agent has already tried that did not work, and reminds the agent of this list before each new step. The agent is told not to repeat approaches that have already failed.

**Step-Back Rail (jiuwenswarm #399)**
After several consecutive failed actions, the agent is forced to stop, reflect, and try a completely different strategy. This prevents the agent from making tiny variations of a broken approach indefinitely.

**Verifier Circuit Breaker Rail (jiuwenswarm #409)**
If the same test failure repeats multiple times in a row, the system escalates: first it tells the agent to rethink, then it tells it to abandon the current approach entirely and start fresh. This breaks the most destructive SkillsBench pattern, where an agent patches the same failing line fifteen times and times out.

---

#### Group 6 — Context Management: Keep important information from getting lost

**Context Headroom Guard (jiuwenswarm #397)**
As the conversation history fills up memory, the system increasingly asks the agent to be concise. This slows down memory pressure and prevents the agent from losing track of what it has already learned.

**Prompt Serialisation (agent-core #21)**
The way the agent's instructions are recorded and stored is standardised, making it possible to reliably compare results across runs and detect when a change to the instructions caused a regression in performance.

---

#### Group 7 — Output Quality: Make sure the final answer is correct and in the right place

**Self-Verification Loop (jiuwenswarm #328)**
After producing an answer, the agent runs the same scoring check that the benchmark will use. If the check fails, the agent goes back and fixes the problem before the final answer is submitted. This catches avoidable errors before they cost a point.

**Bash Output Truncation (jiuwenswarm #334)**
When a command produces very long output, the system keeps both the beginning and the end — rather than just the beginning. Error messages from the benchmark verifier always appear at the end of output, so this ensures the agent can always read and act on failure diagnostics.

---

#### Group 8 — Multi-Agent Verification: Add a second reviewer in team mode

**Team Verification Layer (agent-core #123 / jiuwenswarm #121)**
When multiple agents work together on a task, a dedicated reviewer agent independently scores each sub-agent's output before it is passed to the lead agent. The lead receives a scored result rather than a bare answer, giving it better information to make the final decision.

---

### Requirement Type

☑ **Performance Enhancement** — directly increases benchmark pass rate
☑ **Functionality** — new operational rails and runtime behaviours
☑ **Trust (Reliability / Availability)** — crash prevention and stable execution

---

## Needs Assessment

### Requirement Decomposition

Each of the 20 items above is an independent deliverable. Features already in branches (marked with a PR number) are ready for integration and testing. Features not yet started will each require one developer to design, implement, and write targeted tests before merging.

The improvements in Groups 1–2 (stability and scale) are foundational and should be delivered first, as they affect all subsequent runs. Groups 3–8 layer on top and can be delivered in parallel or in any order.

### Constraints

- All improvements are additive — they do not change the core agent logic, only the conditions under which it operates. Existing behaviour is not broken.
- The multi-rollout feature (Group 2) multiplies compute usage proportionally to N. The value of N must be set to balance cost against score improvement.
- The self-verification loop (Group 7) requires the benchmark verifier script to be accessible inside the agent's container at task time. This is the case for SkillsBench but must be confirmed for other benchmarks before reuse.

### Impact on Existing Systems

- No changes to the OpenJiuwen platform API, database, or web UI.
- The agent-core changes affect all agents built on the engine, not just JiuwenSwarm. Each change must be validated against the existing agent-core test suite.
- Increased parallel runs (multi-rollout) will raise compute and API token costs during benchmark evaluation runs.

### External Dependencies

- None. All improvements are internal to JiuwenSwarm and agent-core. No new third-party services, APIs, or infrastructure components are required.
