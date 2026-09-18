# Interview question bank — Jiuwen

Four question sets answering recurring AI-engineering interview questions. Each doc has the same shape: a short **General** answer that transfers to any interview, then a **Jiuwen** answer describing how this codebase implements it, with a Mermaid diagram and an **Anchors** list for each question.

## Docs

| Doc | Questions | Focus |
|---|---|---|
| [ai-agent-interview-questions_for_engineers.md](ai-agent-interview-questions_for_engineers.md) | 27 | Core concepts, planning and reasoning, tool use and reliability, memory, multi-agent, cost and production, safety |
| [ai-agent-framework-interview-questions_for_engineers.md](ai-agent-framework-interview-questions_for_engineers.md) | 24 | Framework value, state and execution, tool integration, multi-agent orchestration, reliability and control, framework selection |
| [ai-agent-rag-retrieval-interview-questions_for_engineers.md](ai-agent-rag-retrieval-interview-questions_for_engineers.md) | 28 | Embeddings and similarity, chunking, sparse vs. dense, reranking, retrieval evaluation, multi-document and complex queries, scale and freshness |
| [llm-interview-questions_for_engineers.md](llm-interview-questions_for_engineers.md) | 24 | Architecture, tokens and sampling, context and memory, prompting, fine-tuning, model behavior, evaluation and comparison |

Each set ends with a `> **The pattern worth noticing:**` line and a strong-vs-weak summary table.

## How to read an answer

- **General** — the framework-agnostic answer; this is the part that transfers to any interview.
- **Jiuwen** — how this codebase implements the mechanism, or an explicit statement that it does not. Code references are collected in the **Anchors** list under each Jiuwen answer, as `path:line` — short description.

## Conventions

- **Anchors** use full repository paths and are `file:line`; they may drift as code changes. Where a mechanism is absent, config-gated, or inert, that is stated rather than implied. All anchors were verified to resolve to a real file and line when written, and their line contents spot-checked.
- **Layers.** "The framework" is `agent-core/openjiuwen` — the thin `core/` SDK plus the heavier `harness/`, `agent_teams/`, `extensions/`, and `auto_harness/` layers. The product built on it is `jiuwenswarm/jiuwenswarm/`. Answers say which layer carries a mechanism.
- **Paths** are relative to the repository root.
