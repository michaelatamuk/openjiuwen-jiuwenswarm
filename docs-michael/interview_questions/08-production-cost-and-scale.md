# Production, cost and scale

8 unique questions, deduplicated from the archived docs. Each `##` is one question; identical questions from other docs were merged. Full source files are in `orig/`.

## 1. Designing caching for repeated or semantically similar queries

**General:** Layer caches: exact-match response/prompt cache, provider prefix/prompt caching, embedding cache, and — harder — a semantic cache that embeds the query and returns a prior answer for similar queries above a similarity threshold. The semantic cache needs a threshold and invalidation strategy, and exact-match caches need a stable key including model and parameters.

**Jiuwen:** Caching is exact-match, not semantic. Core has a session KV-cache runtime with affinity/lineage identities (parent/child sessions, team members, compressors) to reuse inference KV state. The product memory index keeps a SQLite `embedding_cache` keyed by text hash, and `agent_evolving` has its own embedding cache. `ToolCallDeduplicationRail` is an exact `(tool_name, args-hash)` per-turn result cache for read-only tools. Local vLLM/transformers use prefix/prompt caches.

```mermaid
flowchart TD
    Q["query"] --> EX{"exact-match key?"}
    EX -->|"embedding text-hash"| EMB["embedding_cache hit"]
    EX -->|"tool (name,args-hash)"| TOOL["ToolCallDeduplicationRail hit"]
    EX -->|"session lineage"| KV["KV-cache reuse (local inference)"]
    EX -->|"no exact hit"| MISS["compute"]
    Q -.->|"absent"| SEM["semantic cache: embed query → similar prior answer"]
```

<sub>**Anchors:**<br>&bull; `agent-core/openjiuwen/core/kv_cache/kv_cache_runtime.py:32` — `KVCacheRuntime`; `agent-core/openjiuwen/core/kv_cache/__init__.py:10` — `KVCacheAffinityConfig`<br>&bull; `jiuwenswarm/jiuwenswarm/agents/harness/common/memory/manager.py:31` — `EMBEDDING_CACHE_TABLE`; `:773` text-hash lookup before embedding<br>&bull; `jiuwenswarm/jiuwenswarm/agents/harness/common/rails/tool_dedup_rail.py:47` — exact per-turn tool result cache<br>&bull; `agent-core/openjiuwen/core/retrieval/lazy_load.py:25` — lazy import cache; `agent-core/openjiuwen/core/context_engine/token/tiktoken_counter.py:221` — reusable encodings<br>&bull; `agent-core/openjiuwen/agent_evolving/ttse/stores.py:522` — embedding cache limit; `agent-core/openjiuwen/symphony/retrieval/llm/vllm/client.py:176` — prefix cache</sub>

**Gap.** No semantic/response cache anywhere — nothing embeds a query and looks up a prior answer by similarity. Tool dedup is exact-arg and single-turn only; embedding cache is memory-only.

---

# Security

<sub>_Canonical source: `orig/ai-engineer-technical-questions_for_engineers.md`; also covered in: engineering, rag-1._</sub>

## 2. First cut at 50% cost reduction: route simple queries to a smaller model, reduce top-k

**General:** The cheapest high-impact cuts: route easy queries to a smaller/cheaper model (classify query difficulty first), lower `top_k`, cache, shorten the prompt (fewer examples, tighter context), and reduce the agent's iteration cap. Start with model routing and top-k because they cut the dominant (generation/input-token) cost directly.

**Jiuwen:** Model selection is about availability and endpoint distribution, not cost or query difficulty. `build_model_allocator` dispatches four availability strategies (`round_robin`, `by_model_name`, `router`, `intelli_router`); allocation happens at member construction from a `model_name` hint and is immutable per member. `IntelliRouter` is rate-aware only through `tpm`/`rpm`. The only retrieval-size knob is the static `top_k` (default 5). There is no query-classification-to-model routing and no cost-aware top-k policy.

```mermaid
flowchart TD
    COST["cut 50%"] --> MR["route simple queries → smaller model"]
    MR -.->|"absent"| X["no query-difficulty / cost-aware routing"]
    COST --> TK["reduce top_k"]
    TK --> S["static top_k=5, no cost-aware/adaptive policy"]
    COST --> CACHE["cache"]
    CACHE --> N["exact embedding/tool caches only (no semantic cache)"]
```

<sub>**Anchors:**<br>&bull; `agent-core/openjiuwen/agent_teams/models/allocator.py:559` — `build_model_allocator` (4 availability strategies); `:240` `ByModelNameAllocator`; `:520` `resolve_member_model` (no query awareness)<br>&bull; `agent-core/openjiuwen/agent_teams/models/pool.py:38` — `ModelPoolEntry`; `:278` `tpm`/`rpm` rate-aware only<br>&bull; `agent-core/openjiuwen/core/retrieval/common/config.py:46` — `top_k: int = 5` (only retrieval-size config)<br>&bull; `jiuwenswarm/jiuwenswarm/agents/harness/common/memory/manager.py:773` — exact embedding cache (no semantic cache)</sub>

**Gap.** No query-classification-to-model routing, no cost-aware routing, and no adaptive top-k.

<sub>_Canonical source: `orig/rag-practical-interview-questions_for_engineers.md`; also covered in: rag-practical._</sub>

## 3. How do you control cost in a system where usage scales unpredictably

**General:** Bound the loop (max iterations/rounds/time), cap tokens per request and per session, make cheap models do cheap work, cache, offload/summarize context, and surface per-run cost so it can be budgeted and alerted. Retries and huge tool outputs are common hidden cost sources.

**Jiuwen:** The product tracks provider-reported session cost and enforces a per-session cap: totals accumulate under a lock, `set_session_cost_limit` sets a ceiling only when provider cost metadata is available, and `raise_if_session_cost_limit_exceeded` raises when over. Core limits repetition via ReAct `max_iterations` (default 5, harness 15), team `BudgetLedger` token ceilings, and `ModelAnomalyDetectionRail`'s tool-loop compaction/bailout. `ToolCallDeduplicationRail` counts repeated read-only calls and warns.

```mermaid
flowchart TD
    M["model call"] --> D{"tool calls?"}
    D -->|yes| T["run tools"]
    T --> L{"loop guard: repeated (tool,args)"}
    L -->|"threshold"| CMP["compact / abort"]
    T --> M
    SESS["session cost cap (usage_cost.py)"] -.->|"pre-flight + mid-stream"| M
    BUD["team BudgetLedger token ceiling"] -.-> T
    ITER["max_iterations 5 / 15"] -.-> M
```

<sub>**Anchors:**<br>&bull; `jiuwenswarm/jiuwenswarm/server/runtime/usage_cost.py:171` — `raise_if_session_cost_limit_exceeded`; `:196` `set_session_cost_limit` (requires provider cost)<br>&bull; `agent-core/openjiuwen/core/single_agent/agents/react_agent.py:288` — `max_iterations`; `agent-core/openjiuwen/harness/schema/config.py:252` — harness default 15<br>&bull; `agent-core/openjiuwen/agent_teams/workflow/engine/budget.py:27` — `BudgetLedger`<br>&bull; `agent-core/openjiuwen/harness/rails/model_anomaly_detection_rail.py:74/90` — tool-loop threshold + bailout<br>&bull; `jiuwenswarm/jiuwenswarm/agents/harness/common/rails/tool_dedup_rail.py:157` — cross-turn repeat counter; `agent-core/openjiuwen/harness/goal/evaluation.py:298` — `max_attempts`</sub>

**Gap.** Cost enforcement is inert unless the provider reports cost metadata, and totals/limits are per-process (not shared across replicas). No cost-aware model downgrade.

<sub>_Canonical source: `orig/genai-interview-questions_for_engineers.md`; also covered in: genai._</sub>

## 4. How would you reduce cost for a high-volume RAG system without degrading answer quality

**General:** Cut the dominant (input-token/generation) cost: rerank a larger candidate set down to a smaller k, cache (exact and semantic), route easy queries to smaller models, shorten prompts (fewer examples, tighter context), summarize long chunks, and cap the agent's iterations. Prefer quality-preserving levers (rerank+tighten, cache, route) over blind k reduction.

**Jiuwen:** The product tracks provider-reported session cost and enforces a per-session cap; core caps repetition via `max_iterations`, team `BudgetLedger`, and anomaly/dedup rails; conversation compaction reduces context tokens. But embedding cost is never tracked, there is no semantic/response cache, no rerank-to-K lever in the KB, and no query-difficulty/cost-aware model routing.

```mermaid
flowchart TD
    COST["cut cost"] --> M["meter generation (session cost cap)"]
    COST --> L["loop caps: max_iterations · ledger · anomaly/dedup rails"]
    COST --> CE["context compaction (conversation tokens)"]
    COST -.->|"absent"| X["rerank-to-K · semantic cache · cost-aware model routing"]
```

<sub>**Anchors:**<br>&bull; `jiuwenswarm/jiuwenswarm/server/runtime/usage_cost.py:171/196` — session cost cap<br>&bull; `agent-core/openjiuwen/core/single_agent/agents/react_agent.py:288` — `max_iterations`; `agent-core/openjiuwen/harness/schema/config.py:252` — harness default<br>&bull; `agent-core/openjiuwen/agent_teams/workflow/engine/budget.py:27` — `BudgetLedger`<br>&bull; `agent-core/openjiuwen/core/context_engine/processor/compressor/full_compact_processor.py:184` — 180k compaction<br>&bull; `agent-core/openjiuwen/agent_teams/models/allocator.py:559` — availability routing (not cost/quality)</sub>

<sub>_Canonical source: `orig/rag-system-design-interview-questions_for_engineers.md`; also covered in: rag-system._</sub>

## 5. Multithreading vs. multiprocessing, which matters more for I/O-bound LLM API calls

**General:** For I/O-bound work (network calls to LLM APIs, vector DBs), async I/O or threads beat multiprocessing: the CPU is idle while waiting, so you want concurrency, not extra processes. Async is the most efficient (no thread-per-request overhead) when your stack is async end to end; threads are the fallback for blocking SDKs. Multiprocessing only pays off for CPU-bound work (local inference, heavy parsing) because it escapes the GIL.

**Jiuwen:** The LLM path is single-process asyncio/anyio. `httpx.AsyncClient` instances share a process-global `AsyncConnectionPool` via `HttpXConnectorPool`, and `AsyncOpenAI`/`AsyncAnthropic` clients are cached process-wide with `httpx.Limits(max_connections=100, max_keepalive_connections=20)`. Blocking work is offloaded with `asyncio.to_thread`/`run_in_executor`, never `multiprocessing`. Embeddings use an `asyncio.Semaphore(max_concurrent)` (default 50), with a `ThreadPoolExecutor` only for the sync facade. `multiprocessing` appears only in tests, the observability trace store, and process isolation — not as an LLM throughput strategy.

```mermaid
flowchart TD
    IO["I/O-bound LLM calls"] --> ASYNC["asyncio/anyio (default)"]
    ASYNC --> POOL["shared httpx AsyncConnectionPool (max 100 / keepalive 20)"]
    ASYNC --> CACHE["process-wide AsyncOpenAI/AsyncAnthropic client cache"]
    BLOCK["blocking SDK/file work"] --> TO["asyncio.to_thread / run_in_executor"]
    EMB["embeddings"] --> SEM["asyncio.Semaphore(max_concurrent=50) + batch 8"]
    MP["multiprocessing"] -.->|"only tests / trace store / process isolation"| X["not an LLM throughput strategy"]
```

<sub>**Anchors:**<br>&bull; `agent-core/openjiuwen/core/common/clients/llm_client.py:52` — `HttpXConnectorPool` (`AsyncConnectionPool`)<br>&bull; `agent-core/openjiuwen/core/foundation/llm/model_clients/openai_model_client.py:383` — process-wide `_client_cache`; `:1118` `httpx.Limits(max_connections=100, max_keepalive_connections=20)`<br>&bull; `agent-core/openjiuwen/core/foundation/llm/model_clients/anthropic_model_client.py:719` — same pooling for `AsyncAnthropic`<br>&bull; `agent-core/openjiuwen/core/retrieval/embedding/api_embedding.py:55` — `asyncio.Semaphore(max_concurrent)`; `:120` `ThreadPoolExecutor` for sync path<br>&bull; `jiuwenswarm/jiuwenswarm/server/agent_ws_server.py:5326` — `asyncio.to_thread(...)` offload; `jiuwenswarm/jiuwenswarm/server/runtime/agent_warm_pool.py:154` — semaphore-bounded warm pool</sub>

**Gap.** No process-level parallelism to escape the GIL for tokenization/parsing at scale; sync embedding still consumes a thread per concurrent request.

<sub>_Canonical source: `orig/ai-engineer-technical-questions_for_engineers.md`; also covered in: engineering._</sub>

## 6. Reducing latency in a multi-step LLM pipeline

**General:** Stream tokens so time-to-first-token matters more than total; run independent steps in parallel; cache prompts/prefixes and embeddings; route easy steps to faster/smaller models; and avoid blocking the event loop. Measure TTFT and per-stage latency to find the bottleneck.

**Jiuwen:** End-to-end streaming is supported (ReAct `stream` → session stream iterator → WebSocket chunk frames), and TTFT is measured per model call (`ttft_ms`). Shared persistent HTTP clients avoid per-call TLS setup, parallel tool execution shortens multi-tool turns, and local inference uses prompt/prefix KV-cache reuse. `IntelliRouter` provides a reliable router across deployments, and the product caches built model objects by name.

```mermaid
flowchart LR
    REQ["multi-step pipeline"] --> ST["streaming (SSE/WS chunks) + TTFT measured"]
    REQ --> PAR["parallel tool execution"]
    REQ --> CACHE["KV/prefix cache (local inference) · model object cache"]
    REQ --> ROUTE["IntelliRouter → deployment selection"]
    REQ --> TO["asyncio.to_thread for blocking work"]
    REQ -.->|"absent"| X["speculative decoding · latency-based routing · cross-request batching"]
```

<sub>**Anchors:**<br>&bull; `agent-core/openjiuwen/core/single_agent/agents/react_agent.py:2938` — `stream` entry; `:1758` `ttft_ms`<br>&bull; `agent-core/openjiuwen/core/foundation/llm/model.py:197` — stream first-chunk/idle timeouts<br>&bull; `agent-core/openjiuwen/core/kv_cache/kv_cache_runtime.py:32` — session KV-cache runtime<br>&bull; `agent-core/openjiuwen/symphony/retrieval/llm/vllm/client.py:176` — `prepare_prefix_cache`<br>&bull; `agent-core/openjiuwen/core/foundation/llm/model_clients/intelli_router_model_client.py:32` — `ReliableRouter`<br>&bull; `jiuwenswarm/jiuwenswarm/server/runtime/agent_adapter/interface_deep.py:6353` — model object cache by name</sub>

**Gap.** No speculative decoding, no latency/SLA-based routing, no cross-request batching; prefix caching exists only for local inference.

<sub>_Canonical source: `orig/ai-engineer-technical-questions_for_engineers.md`; also covered in: engineering, genai, llm-applied, rag-1._</sub>

## 7. What happens to your architecture at 10x current traffic

**General:** You hit dependencies and queues before arithmetic: provider rate limits and 429s, serialized tool/DB access, memory pressure from context, and connection pools. Costs scale roughly linearly with tokens but can super-linearly if retries or coordination rise. Fixes are caching, concurrency limits, queues/shards, backpressure, and cheaper routing — plus autoscaling at the process boundary.

**Jiuwen:** The system has per-process bounded resources rather than elastic scaling. LLM HTTP concurrency is capped by a shared httpx pool (`max_connections=100`, keepalive 20); embeddings by a semaphore (default 50) with batch size 8; team sub-agent fan-out by a semaphore (default 10); the warm pool and message queues have their own bounds. Internal channels use bounded `asyncio.Queue(maxsize=...)`; workflow HTTP supports token-bucket rate limiting; retries/backoff exist at model and tool layers. There is no autoscaling.

```mermaid
flowchart TD
    X["10x traffic"] --> RL["provider rate limits / 429"]
    X --> POOL["bounded conn pool (100/30 per host)"]
    X --> SEM["semaphores: embeddings 50 · sub-agents 10"]
    X --> Q["bounded asyncio.Queue (backpressure)"]
    RL --> FIX["retry + backoff · rate limit"]
    POOL --> FIX
    SEM --> FIX
    Q --> FIX
    FIX -.->|"absent"| AUTO["no autoscaling / distributed limiter / bulkheads"]
```

<sub>**Anchors:**<br>&bull; `agent-core/openjiuwen/core/common/clients/connector_pool.py:21` — `limit: 100`, `limit_per_host: 30`; `agent-core/openjiuwen/core/foundation/llm/model_clients/openai_model_client.py:1118` — pool limits<br>&bull; `agent-core/openjiuwen/core/retrieval/embedding/api_embedding.py:55` — concurrency semaphore<br>&bull; `agent-core/openjiuwen/core/multi_agent/teams/hierarchical_msgbus/p2p_ability_manager.py:34` — max parallel sub-agents<br>&bull; `agent-core/openjiuwen/core/workflow/components/tool/http/http_request_component.py:110` — `HttpRateLimitConfig`<br>&bull; `agent-core/openjiuwen/core/runner/message_queue_inmemory.py:34` — bounded queue; `agent-core/openjiuwen/harness/subagent_runtime/activity_events.py:53` — bounded activity queue<br>&bull; `agent-core/openjiuwen/harness/rails/model_anomaly_detection_rail.py:35` — backoff schedule; `jiuwenswarm/jiuwenswarm/server/runtime/agent_warm_pool.py:154` — warm-pool semaphore split</sub>

**Gap.** No HPA/autoscaling, no global/distributed rate limiter or admission control, no cross-tenant bulkheads. Connection caps and cost totals are per-process, so N replicas multiply the effective limit.

<sub>_Canonical source: `orig/ai-engineer-technical-questions_for_engineers.md`; also covered in: ai-agent, engineering, genai._</sub>

## 8. Where cost concentrates: embedding is cheap and one-time, generation scales with traffic

**General:** Embedding is a one-time (or change-only) indexing cost and is cheap per token; the recurring, traffic-scaling cost is generation — especially input tokens when you stuff long context. So optimization effort should go to the generation loop (fewer iterations, smaller context, cheaper model) more than to embeddings. Measure input vs output tokens separately.

**Jiuwen:** Embedding is batched and effectively one-time: `APIEmbedding` chunks texts (`max_batch_size=8`, `max_concurrent=50`) and `compute_chunk_embeddings` runs at index/update time. Generation is what is metered: `usage_cost.add_session_usage` accumulates provider-reported `input_tokens`/`output_tokens`/`total_tokens` (and optional costs) per session, fed by every `chat.usage_metadata` event. Core tracks KV/prompt-cache hit rates (tokens, not dollars). The only per-token dollar rates are hardcoded estimates in the auto-harness budget rail.

```mermaid
flowchart LR
    EMB["embedding (one-time)"] --> B["batched, concurrent, at index time (not metered as cost)"]
    GEN["generation (per traffic)"] --> U["usage_cost.add_session_usage: input/output/total tokens + optional cost"]
    GEN --> C["core: KV/prompt-cache hit-rate tokens (not $)"]
    GEN --> E["auto-harness budget rail: hardcoded 3e-6 in / 15e-6 out per token"]
```

<sub>**Anchors:**<br>&bull; `agent-core/openjiuwen/core/retrieval/embedding/api_embedding.py:45` — `max_batch_size: int = 8`, `max_concurrent: int = 50`; `:167` batch + gather<br>&bull; `agent-core/openjiuwen/core/retrieval/indexing/indexer/embed_chunks.py:21` — `compute_chunk_embeddings` at index/update time<br>&bull; `agent-core/openjiuwen/core/context_engine/usage/provider_usage.py:14` — normalizes input/cache tokens; `agent-core/openjiuwen/core/context_engine/usage/session_aggregator.py:45` — cache hit-rate aggregation<br>&bull; `jiuwenswarm/jiuwenswarm/server/runtime/usage_cost.py:101` — `add_session_usage`; `jiuwenswarm/jiuwenswarm/server/runtime/agent_adapter/interface_deep.py:17212` — usage events<br>&bull; `agent-core/openjiuwen/auto_harness/rails/budget_rail.py:24` — input `3e-6` / output `15e-6` USD per token; `:85` cost computed</sub>

**Gap.** Embedding cost is never tracked, there is no embedding result cache, and session totals are in-process (lost on restart).

<sub>_Canonical source: `orig/rag-practical-interview-questions_for_engineers.md`; also covered in: rag-practical._</sub>
