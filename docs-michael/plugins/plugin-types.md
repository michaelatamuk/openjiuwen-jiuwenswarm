# Plugin types

Each type is a plug-point (a contract). The **plugin** is the **provider** that implements it — the piece you swap. So "memory" is not a plugin; a memory *provider* is.

The test for the whole table: a capability is a plugin type only if it has (or will have) a **protocol/contract that several providers implement**. "Not part" = no protocol, one concrete implementation.

## Part of the system — Yes

### Only in agent-core

| Type | Explanation | Examples |
|---|---|---|
| team runtime | a runtime for spawning + messaging members | multi-agent, agent-teams |
| harness providers | a whole-harness runtime | native, claudecode, codex, dsh |
| external-agent hooks | control-plane hooks for claude-code/codex/dsh (intercept tools/prompts) | hook protocol |
| permission engine | enforces permissions — mandatory seam, only the policy is swappable | checker, file guard, shell AST, tiered policy, net guard, tool policy |
| retrieval | a vector store / retriever | vector store, embedding, reranker, query-rewriter |
| tracer/exporter | collects traces | otel, local |
| MCP client | a client that connects to an MCP server | stdio, sse, streamable-http |
| session checkpointer | saves/restores session state | in-memory, persistence, redis |
| fs | a filesystem implementation | local, sandbox |
| workspace | a workspace manager | local, remote |
| shell | a shell implementation | bash, pwsh |
| sandbox | an execution sandbox | local, jiuwenbox, yuanrong |
| sys_operation | an OS-operation implementation | local, sandbox |
| storage | a key-value/blob store | json, sqlite, redis |
| kv_cache | a key-value cache | in-memory, persistent |
| workflow | a workflow engine | graph, multi-rollout |
| goal | a goal tracker / evaluator | manager, assessment, store, evaluation |
| LSP | a language server | python, typescript |
| personal-context | a rail + sources that gather and inject the user's personal context | github, gitcode, feishu, local files, rss, bookmarks, cursor, zhihu, toutiao |

### Only in jiuwenswarm

| Type | Explanation | Examples |
|---|---|---|
| compaction | a strategy to shrink the context | context-optimizer, tool-result-pruner |
| proactive recommendation | recommends proactive actions | proactive engine, profile extractor, feedback collector, situation report |
| marketplace | a hub client for skills/plugins/packages | remote (Team Skills Hub) |
| channels | a channel transport | web, tui, desktop, ide, acp, cli, browser, feishu, slack, dingtalk, wechat, wecom, telegram, whatsapp, discord |

### In both

| Type | Explanation | Examples — agent-core | Examples — jiuwenswarm |
|---|---|---|---|
| tools | a callable tool the model can invoke | filesystem, shell, todo, code, ask-user, cron, goal | web, vision, audio, image, cron, skill, acp-chat |
| rails | a hook that runs in the agent loop | security, task-planning, budget-notice, heartbeat, lsp, mcp, task-completion, tool-call-resilience | code rails, execution-guard, permissions, symphony, member/evolution rails |
| subagents | a delegate agent | explore, plan, code, browser, research, verification, mobile-gui | statusline-setup, swarm code + browser variants |
| models | a model client (text / vision / audio) + vendor catalog | Providers: openai, anthropic, deepseek, openrouter, dashscope, siliconflow, intelli-router | Vendors: alibaba (qwen), minimax, maas, baidu, mimo, kimi, zhipu, volcengine, deepseek, openrouter |
| memory | stores + consolidates/extracts memories | Providers: lite, graph, external (mem0, agentarts, lakebase, jiuwen, openjiuwen, openviking) | Processes: auto-memory, memory-rpc, dreaming sweeper |
| skill | use, create, recommend, or build skills | Runtime: use-rail, create-rail, skill tools, recommender | Builder: generate, test, validate, improve, package |
| trajectory store | stores agent trajectories | Evolution/RL: in-memory, file, redis, local | Observability: sqlite, sink |

## Part of the system — Maybe

| Type | Explanation | Examples — agent-core | Examples — jiuwenswarm | Why only maybe |
|---|---|---|---|---|
| adapter | an agent adapter (spec → session) | — | interface_deep, interface_code | the contract is generic, but these adapters are jiuwenswarm-specific |
| gateway | the process/transport gateway | — | gateway | the definition is generic, but jiuwenswarm's gateway is product-specific |
| team orchestration | the product's team policy (roles, assembly, presets) | — | swarm | jiuwenswarm's team/swarm behavior is product policy |

## Not part of the system

None of the types above fall here. The fixed things below are not plugins:

| Item | Why it is not a plugin |
|---|---|
| kernel | it is the plugin system itself |
| loader | it is the composition mechanism |
| skill manager (CRUD) | create/update/delete + archive skills — management, not a pluggable contract |
| session management | manager, message store, history, archive — management, not a pluggable backend |
| security invariants (permission enforcement, sandbox boundaries) | fixed by design — must not be disabled |
| protocol constants | fixed by spec — they stay fixed |

## Code anchors (verified)

- `agent-core/openjiuwen/harness/manifest/models.py` — `ElementKind.TOOL | RAIL | SUBAGENT`.
- `agent-core/openjiuwen/harness/schema/deep_agent_spec.py` — `register_rail_provider` / `register_tool_provider` / `register_subagent_provider` + the three registries.
- `agent-core/openjiuwen/harness/manifest/meta_elements.py` — `harness.rail.entry_point` / `harness.tool.entry_point` reading `openjiuwen.rail` / `openjiuwen.tool`.
- `agent-core/openjiuwen/core/foundation/store/__init__.py` — `openjiuwen.vector_stores` entry-point group.
- `agent-core/openjiuwen/core/foundation/tool/mcp/client/{stdio,sse,streamable_http,mcp}_client.py` — MCP clients.
- `agent-core/openjiuwen/harness/tools/browser_move/*` — managed browser + playwright runtime.
- `agent-core/openjiuwen/harness_providers/factory.py` — hardcoded `resolve_provider` chain (`native`/`native_v2`/`claudecode`/`codex`/`dsh`).
- `agent-core/openjiuwen/harness_protocol/hooks.py` — external-agent hook protocol.
- `agent-core/openjiuwen/harness/rails/*` — agent_mode, budget_notice, heartbeat, lsp, mcp, model_anomaly_detection, personal_context, progressive_tool, sys_operation, task_completion, task_planning, tool_call_resilience.
- `agent-core/openjiuwen/harness/tools/shell/{bash,powershell}/_tool.py` — `BashTool` / `PowerShellTool`.
- `agent-core/openjiuwen/core/sys_operation/local/{fs_operation,shell_operation}.py` — local fs / shell.
- `agent-core/openjiuwen/core/foundation/llm/model_clients/{openai,anthropic,intelli_router,openai_account}_model_client.py` — model clients.
- `agent-core/openjiuwen/core/{memory,retrieval,session,sys_operation,workflow,graph,context_engine,kv_cache,multi_agent}` and `agent_teams/` and `core/memory/dreaming/orchestrator.py` — in-box contract dirs.
- `agent-core/openjiuwen/harness/{tools,subagents,skills,lsp,prompts,observability,security,personal_context,goal,workspace}` — in-box capability dirs.
- `jiuwenswarm/jiuwenswarm/agents/swarm/providers/*` — 44 `@harness_element` declarations re-exporting the catalog into the product.
- `jiuwenswarm/jiuwenswarm/agents/harness/common/{memory_rpc.py,auto_memory/,memory/dreaming/sweeper.py}` — jiuwenswarm memory.
- `jiuwenswarm/jiuwenswarm/tools/context_optimizer/` — compaction.
- `jiuwenswarm/jiuwenswarm/gateway/` — the product gateway.
- `jiuwenswarm/jiuwenswarm/server/runtime/marketplace/*` — Hub client.
- `jiuwenswarm/jiuwenswarm/common/playwright_mcp_runtime.py` — browser runtime.
- `jiuwenswarm/jiuwenswarm/extensions/hook_event.py` — product lifecycle events (not external-agent hooks).
- `jiuwenswarm/jiuwenswarm/channels/*` and `gateway/channel_manager/im_platforms/*` (feishu, slack, dingtalk, wechat, wecom, telegram, whatsapp, discord, xiaoyi) and `server/runtime/{mcp,skill,session,marketplace}` — product capabilities.
