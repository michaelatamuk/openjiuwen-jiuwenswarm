# agent-tools repository — what the components do

A high-level, functional view of `C:\Workspace\openjiuwenothers\agent-tools`: what each part is for, independent of file names and layout.

---

## In one sentence

The repo contains a **serving layer for LLM inference** (routing requests and managing KV-cache across model workers), an **agent debugging toolkit** (turning runtime logs into performance reports and failure diagnoses), and two **archives** (a competition record and a lottery web page).

---

## Component 1 — Inference router (the largest component)

**What it does:** sits between clients and a pool of model workers and decides *which* worker should serve each request, so that cached prompt prefixes get reused instead of recomputed.

| Responsibility | Explanation |
|---|---|
| Front door | Exposes an OpenAI-compatible chat/completion API, so any OpenAI client can talk to it |
| Cache-aware routing | Picks the worker that already holds the most matching prompt-prefix cache, to cut prefill cost and time-to-first-token |
| Load balancing | Falls back to round-robin or workload-weighted selection when cache state does not decide |
| Session affinity | Keeps a conversation on the same worker so its cache stays warm across turns |
| Hint-driven scheduling | Accepts optional client hints (priority, expected output length, expected request count/interval, a shared prefix id) and uses them to plan routing |
| Worker discovery | Learns which model workers exist — either from a static config or from a live registry that workers join and leave |
| Split prefill/decode | Supports architectures where prefill and decode run on separate machines, pairing them per request |
| Resilience | Circuit breaking and retries when workers fail |
| Observability | Exposes metrics (latency, tokens, load) for monitoring |

**Why it exists:** naive load balancing wastes GPU work because it recomputes prompts that another worker already cached. This component makes routing cache-aware so the cluster reuses what it has already computed.

---

## Component 2 — vLLM cache plugin

**What it does:** extends the model engine itself so that cached prompt data can be **released on demand and shared** — the capability the router depends on to keep caches accurate and reusable.

| Responsibility | Explanation |
|---|---|
| Active cache release | Lets the client tell the engine that a portion of a conversation is no longer needed, so the engine can free and age those cache blocks immediately instead of waiting for eviction |
| Cache aging policy | Changes how freed blocks are recycled so that actively released data is reused first, keeping useful cache alive longer |
| Cache sharing / isolation | Lets different clients share cached blocks under a shared identifier, or keep them isolated with a per-client identifier |
| Runtime visibility | Can emit detailed debug tracing of allocation, cache hits, release, and eviction to diagnose cache behavior |

**Why it exists:** in multi-turn agent conversations, context gets compressed or tool results get unloaded; without active release, stale cache lingers and drags down hit rate. It is delivered as a plugin into the model engine, and because it hooks engine internals it must track specific engine versions.

**Relationship to Component 1:** they are two ends of one feature. This component makes the engine able to release and share cache and to label requests by client; the router uses that state to route and to keep caches warm.

---

## Component 3 — Agent diagnostics toolkit

**What it does:** helps engineers understand *why an agent run was slow or failed*, by turning runtime logs into human-readable reports and diagnoses.

| Tool | What it does |
|---|---|
| Log collector | Gathers the relevant runtime logs and session data into one bundle for support |
| Trace report generator | Reconstructs a single agent execution from its debug logs and produces an HTML performance report: model calls, tool calls, sub-agents, step timings, token usage, and charts showing where time and tokens went |
| Session performance skill | A packaged analysis routine that produces the same style of performance report plus flowcharts and structured data for a given session |
| Log diagnosis skill | A structured troubleshooting routine that first decides *which layer* is at fault (agent runtime vs. its surrounding platform vs. frontend/delivery vs. model/network), collects supporting evidence, and produces a report with an explicit confidence level |

**Why it exists:** agent runs are hard to debug after the fact. These tools make a run reconstructable and make failure attribution systematic rather than guesswork.

---

## Component 4 — Agent tool archive (competition record)

**What it does:** stores standalone agent tools built by teams for a challenge. Each is an independent example rather than a shipping component.

| Entry | What it does |
|---|---|
| Computer-use tool | Drives a GUI to complete tasks from screenshots |
| Investment analysis tool | Runs many analyst perspectives (value, growth, sentiment, technical, etc.) over financial data |
| LangGraph migration tool | Converts an agent built on another framework into this ecosystem's project format |
| Web-scraper tool | Scrapes and serves web content as an agent tool |
| Image-search tool | Searches for images as an agent tool |
| Reference example | The official template tool |

**Why it exists:** as a record of community contributions and reusable examples.

---

## Component 5 — Lottery web tool (unrelated)

**What it does:** a self-contained browser page for running a community prize draw, with its own test runner. It is not connected to the agent or inference code.

---

## Known update dates

Repo history is a single squashed commit and file timestamps are checkout-time, so no component carries a build date. The only real dates are the ones written into the content:

| Component | Date stated in content |
|---|---|
| Log diagnosis skill | 2026-05-12 (`Last updated`, evolution entries) |
| LangGraph migration tool | 2026-01-24 (`更新日期`); sample report 2026-01-26 |
| All other components | no date stated |

## How the parts relate

| Part | Depends on | Used by |
|---|---|---|
| Inference router | worker discovery + model engines | whoever serves models to the agent |
| vLLM cache plugin | the model engine | the inference router's cache-aware behavior |
| Diagnostics toolkit | agent runtime logs | engineers debugging the product |
| Competition archive | nothing | examples / reference only |
| Lottery tool | nothing | nothing |

The two inference components form one coherent subsystem. The diagnostics tools form a second. The remaining directories are archives.

---

## Bottom line

If you ignore the archives, the repo is two things:

1. **A cache-aware inference serving layer** — a smart router plus a model-engine plugin that together reuse and release prompt caches across a worker pool.
2. **An agent diagnostics suite** — log collection, trace-to-report parsing, and packaged skills for performance analysis and failure diagnosis.
