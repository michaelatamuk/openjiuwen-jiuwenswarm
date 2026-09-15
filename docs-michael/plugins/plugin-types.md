# Plugin types

Each type is a plug-point (a contract). The **plugin** is the **provider** that implements it — the piece you swap. So "memory" is not a plugin; a memory *provider* is.

Rows are split by origin: an agent-core item and a jiuwenswarm item are different things, not the same type.

## Part of the system — Yes

| Type | Explanation | Examples — agent-core | Examples — jiuwenswarm |
|---|---|---|---|
| core tools | a callable tool the model can invoke | filesystem, shell, todo, code, ask-user, cron, goal | — |
| product tools | a callable tool the model can invoke | — | web, vision, audio, image, cron, skill, acp-chat |
| core rails | a hook that runs in the agent loop | security, task-planning, budget-notice, heartbeat, lsp, mcp, task-completion, tool-call-resilience | — |
| product rails | a hook that runs in the agent loop | — | code rails, execution-guard, permissions, symphony, member/evolution rails |
| core subagents | a delegate agent | explore, plan, code, browser, research, verification, mobile-gui | — |
| product subagents | a delegate agent | — | statusline-setup (plus swarm overrides of code, browser) |
| team runtime | a runtime for spawning + messaging members | multi-agent, agent-teams | — |
| LLM providers | a model client (chat-completions) | openai, anthropic, deepseek, openrouter, dashscope, siliconflow, intelli-router | — |
| LLM vendors | a vendor/model catalog | — | alibaba (qwen), minimax, maas, baidu, mimo, kimi, zhipu, volcengine, deepseek, openrouter |
| harness providers | a whole-harness runtime | native, claudecode, codex, dsh | — |
| external-agent hooks | control-plane hooks for claude-code/codex/dsh (intercept tools/prompts) | hook protocol (ToolDecision, BeforePrompt, BeforeTool) | — |
| memory provider | stores/recalls facts | lite, graph, external (mem0, agentarts, lakebase, jiuwen, openjiuwen, openviking) | — |
| dreaming orchestrator | idle-aware periodic scheduler that triggers the sweep | built-in | — |
| dreaming sweeper | scan + compress + extract + promote memories | — | sweeper, auto-memory |
| retrieval | a vector store / retriever | vector store, embedding, reranker, query-rewriter | — |
| compaction | a strategy to shrink the context | — | context-optimizer, tool-result-pruner |
| MCP client | a client that connects to an MCP server | stdio, sse, streamable-http clients + mcp rail (list/read resources) | — |
| MCP registry/marketplace | manages which MCP servers to connect | — | registry, config, marketplace, credentials |
| browser | a browser runtime | — | playwright (chromium) |
| skill runtime | use/create/recommend skills | use-rail, create-rail, skill tools (use/list/recommend), recommender | — |
| skill management | manage/develop/discover skills | — | skill manager (CRUD/files/types/archive), skill-dev pipeline (generate/test/package), discovery/retrieval, marketplace/UI |
| marketplace | a Hub client (remote install) | — | hub client |
| fs | a filesystem implementation | local, sandbox | — |
| workspace | a workspace manager | local, remote | — |
| shell | a shell implementation | bash, pwsh | — |
| sandbox | an execution sandbox | local, jiuwenbox, yuanrong | — |
| sys_operation | an OS-operation implementation | local, sandbox | — |
| core session store | a session backend | checkpointer, redis | — |
| product session store | a session backend | — | jsonl, sqlite |
| storage | a key-value/blob store | json, sqlite, redis | — |
| kv_cache | a key-value cache | in-memory, persistent | — |
| core observability | a tracer / exporter | local, otel | — |
| product observability | a tracer / exporter | — | trajectory store, sink |
| workflow | a workflow engine | graph, multi-rollout | — |
| goal | a goal tracker / evaluator | built-in | — |
| core permissions | a permission policy | permission engine, policy | — |
| product permissions | a permission policy | — | permissions rails |
| LSP | a language server | python, typescript | — |
| personal-context | a rail that injects remembered facts | built-in | — |

## Part of the system — Maybe

| Type | Explanation | Examples — agent-core | Examples — jiuwenswarm | Why only maybe |
|---|---|---|---|---|
| adapter | an agent adapter (spec → session) | — | interface_deep, interface_code | the contract is generic, but these adapters are jiuwenswarm-specific |
| channels | a channel transport | — | web, tui, desktop, ide, acp, cli, browser, feishu, slack, dingtalk, wechat, wecom, telegram, whatsapp, discord | the transports stay jiuwenswarm; only the IM connectors are generic |
| gateway | the process/transport gateway | — | gateway | the definition is generic, but jiuwenswarm's gateway is product-specific |
| team orchestration | the product's team policy (roles, assembly, presets) | — | swarm | jiuwenswarm's team/swarm behavior is product policy |

## Not part of the system

None of the types above fall here. The fixed things below are not plugins:

| Item | Why it is not a plugin |
|---|---|
| kernel | it is the plugin system itself |
| loader | it is the composition mechanism |
| security invariants (permission enforcement, sandbox boundaries) | fixed by design — must not be disabled |
| protocol constants | fixed by spec — they stay fixed |

## Code anchors (verified)

- `agent-core/openjiuwen/harness/manifest/models.py` — `ElementKind.TOOL | RAIL | SUBAGENT`.
- `agent-core/openjiuwen/harness/schema/deep_agent_spec.py` — `register_rail_provider` / `register_tool_provider` / `register_subagent_provider` + the three registries.
- `agent-core/openjiuwen/harness/manifest/meta_elements.py` — `harness.rail.entry_point` / `harness.tool.entry_point` reading `openjiuwen.rail` / `openjiuwen.tool`.
- `agent-core/openjiuwen/core/foundation/store/__init__.py` — `openjiuwen.vector_stores` entry-point group.
- `agent-core/openjiuwen/core/foundation/tool/mcp/client/{stdio,sse,streamable_http,mcp}_client.py` — MCP clients.
- `agent-core/openjiuwen/harness_providers/factory.py` — hardcoded `resolve_provider` chain (`native`/`native_v2`/`claudecode`/`codex`/`dsh`).
- `agent-core/openjiuwen/harness_protocol/hooks.py` — external-agent hook protocol.
- `agent-core/openjiuwen/harness/rails/*` — agent_mode, budget_notice, heartbeat, lsp, mcp, model_anomaly_detection, personal_context, progressive_tool, sys_operation, task_completion, task_planning, tool_call_resilience.
- `agent-core/openjiuwen/harness/tools/shell/{bash,powershell}/_tool.py` — `BashTool` / `PowerShellTool`.
- `agent-core/openjiuwen/core/sys_operation/local/{fs_operation,shell_operation}.py` — local fs / shell.
- `agent-core/openjiuwen/core/foundation/llm/model_clients/{openai,anthropic,intelli_router,openai_account}_model_client.py` — model clients.
- `agent-core/openjiuwen/core/{memory,retrieval,session,sys_operation,workflow,graph,context_engine,kv_cache,multi_agent}` and `agent_teams/` and `core/memory/dreaming/orchestrator.py` — in-box contract dirs.
- `agent-core/openjiuwen/harness/{tools,subagents,skills,lsp,prompts,observability,security,personal_context,goal,workspace}` — in-box capability dirs.
- `jiuwenswarm/jiuwenswarm/agents/swarm/providers/*` — 44 `@harness_element` declarations re-exporting the catalog into the product.
- `jiuwenswarm/jiuwenswarm/agents/harness/common/memory/dreaming/sweeper.py` — dreaming sweeper.
- `jiuwenswarm/jiuwenswarm/tools/context_optimizer/` — compaction.
- `jiuwenswarm/jiuwenswarm/gateway/` — the product gateway.
- `jiuwenswarm/jiuwenswarm/server/runtime/marketplace/*` — Hub client.
- `jiuwenswarm/jiuwenswarm/common/playwright_mcp_runtime.py` — browser runtime.
- `jiuwenswarm/jiuwenswarm/extensions/hook_event.py` — product lifecycle events (not external-agent hooks).
- `jiuwenswarm/jiuwenswarm/channels/*` and `gateway/channel_manager/im_platforms/*` (feishu, slack, dingtalk, wechat, wecom, telegram, whatsapp, discord, xiaoyi) and `server/runtime/{mcp,skill,session,marketplace}` — product capabilities.
