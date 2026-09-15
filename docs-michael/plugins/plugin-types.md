# Plugin types

Each type is a plug-point (a contract). The **plugin** is the **provider** that implements it — the piece you swap. So "memory" is not a plugin; a memory *provider* is.

## Part of the system — Yes

| Type | Explanation | Examples |
|---|---|---|
| tools | a callable tool the model can invoke | filesystem, shell, todo, code, ask-user, cron, web, skill, goal |
| rails | a hook that runs in the agent loop | security, task-planning, budget-notice, heartbeat, lsp, mcp, agent-mode, task-completion, tool-call-resilience |
| subagents | a delegate agent | explore, plan, code, browser, research, verification, mobile-gui |
| team | a team runtime (spawn + message members) | in-process, remote, external (codex, claudecode) |
| LLM providers | a model client (chat-completions) | openai, anthropic, intelli-router, deepseek |
| harness providers | a whole-harness runtime | native, claudecode, codex, dsh |
| hooks | an external-agent hook bridge | claude-code hooks, codex hooks |
| memory | a memory provider (stores/recalls facts) | lite, graph, external, dreaming |
| retrieval | a vector store / retriever | vector store, embedding, reranker, query-rewriter |
| context | a prompt section | persona, plan, runtime context, skill catalog |
| compaction | a strategy to shrink the context | basic, tool-result-pruner |
| MCP | a connection to an MCP server | stdio, http, file/dir |
| browser | a browser runtime | playwright (chromium) |
| skill | a source of skills | filesystem, remote |
| marketplace | a Hub client (remote install) | remote marketplace |
| fs | a filesystem implementation | local, sandbox |
| workspace | a workspace manager | local, remote |
| shell | a shell implementation | bash, pwsh |
| sandbox | an execution sandbox | local, jiuwenbox, yuanrong |
| sys_operation | an OS-operation implementation | local, sandbox |
| session store | a session backend | jsonl, sqlite, redis |
| storage | a key-value/blob store | json, sqlite, redis |
| kv_cache | a key-value cache | in-memory, persistent |
| observability | a tracer / exporter | local, otel |
| workflow | a workflow engine | graph, multi-rollout |
| goal | a goal tracker / evaluator | built-in |
| permissions | a permission policy | read-only, workspace-write, danger-full-access |
| LSP | a language server | python, typescript |
| personal-context | a rail that injects remembered facts | built-in |

## Part of the system — Maybe

| Type | Explanation | Examples | Why only maybe |
|---|---|---|---|
| adapter | an agent adapter (spec → session) | interface_deep, interface_code | the contract is generic, but these adapters are jiuwenswarm-specific |
| channels | a channel transport | web, tui, desktop, ide, acp, cli, browser, feishu, slack, dingtalk, wechat, wecom, telegram, whatsapp, discord | the transports stay jiuwenswarm; only the IM connectors are generic |
| gateway | the process/transport gateway | in-process, split-process, remote | the definition is generic, but jiuwenswarm's gateway is product-specific |

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
- `agent-core/openjiuwen/harness_providers/factory.py` — hardcoded `resolve_provider` chain (`native`/`native_v2`/`claudecode`/`codex`/`dsh`).
- `agent-core/openjiuwen/harness/rails/*` — agent_mode, budget_notice, heartbeat, lsp, mcp, model_anomaly_detection, personal_context, progressive_tool, sys_operation, task_completion, task_planning, tool_call_resilience.
- `agent-core/openjiuwen/harness/tools/shell/{bash,powershell}/_tool.py` — `BashTool` / `PowerShellTool`.
- `agent-core/openjiuwen/core/sys_operation/local/{fs_operation,shell_operation}.py` — local fs / shell.
- `agent-core/openjiuwen/core/foundation/llm/model_clients/{openai,anthropic,intelli_router,openai_account}_model_client.py` — model clients.
- `agent-core/openjiuwen/core/{memory,retrieval,session,sys_operation,workflow,graph,context_engine,kv_cache,multi_agent}` and `agent_teams/` — in-box contract dirs.
- `agent-core/openjiuwen/harness/{tools,subagents,skills,lsp,prompts,observability,security,personal_context,goal,workspace}` — in-box capability dirs.
- `jiuwenswarm/jiuwenswarm/agents/swarm/providers/*` — 44 `@harness_element` declarations re-exporting the catalog into the product.
- `jiuwenswarm/jiuwenswarm/gateway/` — the product gateway.
- `jiuwenswarm/jiuwenswarm/server/runtime/marketplace/*` — Hub client.
- `jiuwenswarm/jiuwenswarm/common/playwright_mcp_runtime.py` — browser runtime.
- `jiuwenswarm/jiuwenswarm/extensions/hook_event.py` — external-agent hooks.
- `jiuwenswarm/jiuwenswarm/channels/*` and `gateway/channel_manager/im_platforms/*` (feishu, slack, dingtalk, wechat, wecom, telegram, whatsapp, discord, xiaoyi) and `server/runtime/{mcp,skill,session,marketplace}` — product capabilities.
