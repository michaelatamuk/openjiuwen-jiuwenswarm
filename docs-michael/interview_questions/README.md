# Interview question bank — organized and deduplicated

A curated set of AI-engineering interview questions, deduplicated and grouped by topic. Every unique question is answered once, with a short **General** answer, a **Jiuwen** answer describing how this codebase implements it, a Mermaid diagram, and `file:line` **Anchors**.

## Structure

```
interview_questions/
  README.md                     this guide
  01-llm-foundations.md         }
  02-prompting-and-output-control.md
  03-fine-tuning-and-customization.md
  04-rag-and-retrieval.md       }  190 unique questions,
  05-rag-system-design.md       }  one place each
  06-agents-tools-and-memory.md
  07-evaluation.md
  08-production-cost-and-scale.md
  09-security-and-safety.md
  10-general-engineering.md
  90-ai-engineer-interview-patterns.md     }
  91-llm-interview-patterns.md             }  reference docs
  92-llm-architecture-patterns.md          }
  93-llm-terms-glossary.md                 }
  orig/                         the original docs, archived unchanged
```

The numbered `01`–`10` files were assembled from the archived docs: near-identical and same-concept questions were merged, so each question appears once. Patterns and the glossary are reference material, not questions.

## Read in this order

| File | Questions | Focus |
|---|---|---|
| [01-llm-foundations.md](01-llm-foundations.md) | 15 | Tokens, embeddings, self-attention, encoder/decoder, positional encoding, sampling, context window |
| [02-prompting-and-output-control.md](02-prompting-and-output-control.md) | 8 | Zero/few-shot/CoT, system vs user prompts, JSON output |
| [03-fine-tuning-and-customization.md](03-fine-tuning-and-customization.md) | 7 | Full FT vs LoRA, instruction tuning, when to fine-tune, small-dataset risk |
| [04-rag-and-retrieval.md](04-rag-and-retrieval.md) | 54 | Chunking, embeddings, dense/sparse, reranking, query understanding, RAG failure modes |
| [05-rag-system-design.md](05-rag-system-design.md) | 16 | Whiteboard design prompts, scale, freshness, multi-tenancy, access control |
| [06-agents-tools-and-memory.md](06-agents-tools-and-memory.md) | 44 | Function calling, loops, frameworks, state, planning, memory, multi-agent |
| [07-evaluation.md](07-evaluation.md) | 23 | Retrieval metrics, faithfulness, LLM-as-judge, regression suites, production eval |
| [08-production-cost-and-scale.md](08-production-cost-and-scale.md) | 6 | Cost, latency, caching, concurrency, 10x scaling |
| [09-security-and-safety.md](09-security-and-safety.md) | 8 | Prompt injection, untrusted content, sensitive data, harmful output, jailbreaks |
| [10-general-engineering.md](10-general-engineering.md) | 9 | Retries, error isolation, model choice, stakeholder judgment, rule-based vs LLM |

## Reference docs

| File | Scope |
|---|---|
| [90-ai-engineer-interview-patterns.md](90-ai-engineer-interview-patterns.md) | 7 recurring technical-interview dynamics |
| [91-llm-interview-patterns.md](91-llm-interview-patterns.md) | 7 recurring LLM interview dynamics |
| [92-llm-architecture-patterns.md](92-llm-architecture-patterns.md) | 7 recurring LLM architecture patterns |
| [93-llm-terms-glossary.md](93-llm-terms-glossary.md) | 20-term glossary with where each term bites |

## How to read an answer

- **General** — the framework-agnostic answer; this is the part that transfers to any interview.
- **Jiuwen** — how this codebase implements the mechanism, or an explicit statement that it does not. Code references are collected in the **Anchors** line, as `path:line` — short description.
- Each question ends with a line naming its canonical source doc and the other docs that covered it, so you can trace it back.

## Conventions

- **Anchors** use full repository paths and are `file:line`; they may drift as code changes. Where a mechanism is absent, config-gated, or inert, that is stated rather than implied. All anchors were verified to resolve to a real file and line when written, and their line contents spot-checked.
- **Layers.** "The framework" is `agent-core/openjiuwen` — the thin `core/` SDK plus the heavier `harness/`, `agent_teams/`, `extensions/`, and `auto_harness/` layers. The product built on it is `jiuwenswarm/jiuwenswarm/`. Answers say which layer carries a mechanism.
- **Paths** are relative to the repository root. The uncompressed originals live in [`orig/`](orig/README.md).
