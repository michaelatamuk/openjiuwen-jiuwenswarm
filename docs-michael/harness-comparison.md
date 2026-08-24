# Runtime Harness Comparison: deepseek-harness vs jiuwenswarm

**Date**: August 2026
**Author**: Technical Analysis
**Projects**:
- `deepseek-harness` → `/Users/mishka/PycharmProjects/openjiuwenothers/deepseek-harness`
- `jiuwenswarm` → `/Users/mishka/PycharmProjects/openjiuwen/jiuwenswarm`

---

## 1. TL;DR

| | jiuwenswarm | deepseek-harness |
|---|---|---|
| **Language** | Python 3.11+ | TypeScript / Node.js 22+ |
| **Architecture** | Facade + Adapter pattern | Plugin framework (Cordis) — everything swappable |
| **Loop design** | ReAct (Reason → Act → Observe) | Reactive event-driven (turn/step state machine) |
| **Maturity** | Stable — actively deployed | 0.1.1-rc.2 — production-grade engineering, pre-release |
| **Primary audience** | Teams deploying full agent platforms | Developers embedding agents into products |
| **Key strength** | Multi-channel reach, skill evolution, team agents | Auditability, composability, replay |

### 1.1 How to read this — start from what you know

If you already know **jiuwenswarm**, read each section's **jiuwenswarm** half first as your baseline, then the **deepseek-harness** half, comparing against it. To make that concrete, the table below maps each jiuwenswarm concept you already use to the deepseek-harness concept that plays the same role, so a deepseek section is readable as "here is jiuwen's X, and deepseek does it this way."

| jiuwenswarm concept | deepseek-harness equivalent |
|---|---|
| `JiuWenSwarm` facade / `process_message_stream` | `ctx.agents` + the `ReactLoopAgent` driver (each agent/session has its own driver) |
| `DeepAgent` SDK ReAct loop | Turn/step state machine (`turn()` → `preStep()` → `step()` → `runGroup()`) |
| Rails middleware (a large, priority-ordered set: Memory, Security, SkillUse, `PermissionInterrupt`, TaskPlanning, …) | `tools/*` waterfalls (`tools/pre-execute`, `tools/execute`, `tools/post-execute`) + monotonic `ToolGuard`s |
| SecurityRail / `PermissionInterruptRail` | `ctx.sandbox` (process confinement) + `tools/pre-execute` approval (`ask`/`deny`) + permission presets |
| `PersistenceCheckpointer` (JSONL history) | `SessionPersistence` — an **append-only session log** with JSONL (default) or SQLite backend |
| SQLite-vec + FTS5 semantic memory | No equivalent — deepseek has no vector store; context is the session log + on-demand skills |
| Context compression (LLM summarization) | Compaction (turn archival) + a tool-result pruner + spill policy |
| SkillNet skill hub | `dsh-skill` — provider-based markdown instruction documents injected on demand |
| Channels (Feishu/Slack/web/…) | Web UI + ACP server + Python SDK (far fewer entry points) |
| A2A / A2X / ACP protocols (distributed agents) | ACP (automation server) + in-process subagent delegation |
| `task_tool` / team orchestration | `subagent` / `subagent_fork` / `list_agents` / `send_message` |
| `JiuwenBox` sandbox server | `dsh-sandbox` — native OS sandbox (macOS `sandbox-exec`, Linux `bwrap`/Landlock, Windows ACL) |
| `max_iterations` step cap | No per-agent step-count cap; bounded by `maxTokens` output cap + compaction |
| `json-repair` for malformed args | None — tool arguments stream as raw JSON and are preserved verbatim |

Reading tip: deepseek-harness's defining trait is that **the durable session log is the source of truth** — model history, the request the model sees, replay, forking, and persistence all derive from one append-only log. Nearly every architectural difference from jiuwenswarm traces back to that one choice.

---

## 2. Core Architecture

### 2.1 jiuwenswarm

The central idea is the **JiuWenSwarm facade**: a single async entry point (`process_message_stream`) that routes to one of two adapters (Deep or Code) based on session mode. Adapters wrap the openjiuwen `DeepAgent` SDK which runs the ReAct loop internally.

```
JiuWenSwarm → JiuWenSwarmDeepAdapter → openjiuwen DeepAgent SDK → ReAct loop → tools
```

The **Rails system** intercepts every tool call and prompt before and after execution. Rails are composable, priority-ordered middleware that lives mostly in the `openjiuwen` SDK (a large set: `MemoryRail`, `SecurityRail`, `SkillUseRail`, `PermissionInterruptRail`, `TaskPlanningRail`, `SubagentRail`, `HeartbeatRail`, …) plus jiuwenswarm-side rails (project memory, avatar, response/runtime prompt, multimodal image, stream events, iteration budget, …). There is no `PermissionsRail` — the permission role is `PermissionInterruptRail`.

```python
[rails around each tool call and prompt] → [tool executes] → result
```

History is recorded as JSONL files on disk per session. There is no equivalent of the deepseek-harness append-only event log with replay capability.

### 2.2 deepseek-harness

The central idea is the **Cordis plugin framework**: every component — LLM adapter, tool registry, sandbox, subprocess runner, filesystem, session log, and the agent loop itself — is a plugin that conforms to a capability seam interface. Nothing is hardcoded.

```
Capability Seam = Definition (interface) + Provider (implementation) + Consumer (caller)
```

The consequence of "everything is a plugin" is that the whole product is **composable and embeddable**: you mount the plugins you want, swap implementations behind a seam (a different model provider, a different sandbox, a different filesystem), give different sessions different capability sets, and embed the harness inside your own application. The running system is a plugin tree declared in config, not a fixed program.

The agent loop is a **reactive state machine**:

```
Inbox (two ordered lists: `next-turn` and `next-step`) → preStep() → step() → LLM stream → BlockAssembler → tool-calls → runGroup() → results → next step
```

Every event (turn/start, step/start, assistant/chunk, assistant/message, tool/call, tool/result, turn/end) is appended to a **durable append-only session log** — the single source of truth. This enables full replay, forking at any between-turn boundary, and auditing exactly what the model saw, under the invariant **"model-visible ⟺ logged"**: the model sees exactly what is in the log, nothing else. Persistence is a swappable backend seam (JSONL by default, SQLite as an alternative). Tool calls are dispatched to a **parallel scheduler** (`runGroup`) that respects `isConcurrencySafe()` per tool and commits results in **model-declared order**.

Each agent runs **isolated** — its own session log and its own scoped set of capabilities — so one process can host many independent agents, and agents can compose (delegate to sub-agents, inherit a parent's toolset, or coordinate in a team). This isolation and composition are what make the "everything is a plugin" design usable for more than a single chatbot.

For the deeper internals — how the plugin tree boots, how requests are reconstructed from the log, the event taxonomy, per-agent scoping and the initiator, capability seams and the extension points, and the plan/goal/workflow/compaction seams — see [Appendix A](#appendix-a-deepseek-harness-internals-deep-dive).

---

## 3. Agent Loop Mechanics

### 3.1 jiuwenswarm — ReAct Loop

The loop runs inside the openjiuwen DeepAgent SDK. jiuwenswarm wraps it with a streaming adapter:

```
for each event from agent.run(query):
  "tool_call"   → stream chat.tool_call chunk → (SDK auto-executes tool)
  "tool_result" → stream chat.tool_result chunk
  "message"     → stream chat.partial / chat.final chunk
  error         → stream chat.error chunk with error_type classification
```

Key design decisions:
- **Checkpointing after each turn** — disk-persisted `PersistenceCheckpointerProvider`
- **Context compression** when token count exceeds threshold: LLM-based summarization of old turns, keep recent N turns verbatim
- **`max_iterations` guard** in React config (default: 10 steps per query)

### 3.2 deepseek-harness — Turn/Step State Machine

```
For each inbox batch:
  turn/start ──→ while True:
                   preStep() — decide what messages go in this step
                   step/start
                   user/message appended for each inbox item
                   LLM call (streaming)
                   BlockAssembler collects chunks → ContentBlocks
                   assistant/message appended
                   if tool-calls present:
                     runGroup() — parallel dispatch up to maxParallelToolCalls
                     tool results appended
                     continue loop
                   else:
                     break
                 turn/end (with reason: completed | max-tokens | blocked | aborted | error)
```

Key design decisions:
- **A turn runs one or more steps** — it continues while a tool call requests another model turn or new steering arrives, and ends only when nothing is owed (no tool calls, no pending steering).
- **`max-tokens` is sticky** — if any step hits the output-token ceiling, the whole turn records `max-tokens` rather than `completed`, so a truncation is never misread as a clean stop.
- **AbortController per turn** — clean cancellation at any step
- **Inbox target** (`next-turn` vs `next-step`) — controls whether new inbox messages are consumed within the current turn
- **`agent/turn-stopping` waterfall** — plugins can veto or delay turn termination
- **Error quarantine** — errors are logged and rethrown; the session log always knows the cause

### Comparison

| | jiuwenswarm | deepseek-harness |
|---|---|---|
| Loop driver | openjiuwen SDK (internal) | Custom reactive engine |
| Cancellation | No explicit per-turn abort | AbortController per turn |
| Parallel tool calls | No — sequential execution | Yes — `maxParallelToolCalls`, order-preserving |
| Turn vs step distinction | Opaque (inside SDK) | Explicit (turn = one inbox batch, step = one LLM call) |
| Replay | No — JSONL history only | Full — reconstruct any past session from log |
| Fork at turn boundary | No | Yes |
| Max steps guard | `max_iterations` in config | No per-agent step-count cap (loop runs to quiescence; `maxTokens` output cap + compaction bound it) |

---

## 4. Parsing Model Output

### 4.1 jiuwenswarm

Parsing is delegated entirely to the openjiuwen SDK. jiuwenswarm consumes already-parsed `event.type == "tool_call"` events with structured `event.tool_name` and `event.tool_input`. The harness has no direct visibility into raw model output.

One Rail (`json-repair` dependency) patches malformed JSON in tool arguments before passing them to executors.

### 4.2 deepseek-harness

The **BlockAssembler** processes streaming chunks incrementally (`text-delta`, `reasoning-delta`, `tool-call-delta` → `block-end`), folding them into `ContentBlock[]`:

- Supports two tool-presentation modes: **`native`** (every visible tool schema is sent; the model emits structured `tool-call` blocks per provider protocol) and **`code`** (the model is shown a single `run_code` tool plus a generated TypeScript/Python SDK prompt; it calls other tools from *inside* the program via `await tools.name(args)` bindings). There is **no regex parsing of fenced tool-call syntax**.
- Handles interrupted streams: an aborted/cancelled stream finalizes its delivered text/reasoning prefix as an `assistant/message` with `interrupted: true`; undispatched tool calls are dropped.
- Content block types: `text`, `reasoning` (thinking, distinct from visible text), `image`, `tool-call`, `tool-result`.
- Replay is not a re-execution: rebuilding a session from the log re-derives history and re-renders tool results via the pure `presentCall`/`presentResult` projections. There is no "setValue/onChange" replay-feedback mechanism in the harness.

### Comparison

| | jiuwenswarm | deepseek-harness |
|---|---|---|
| Raw chunk access | No — SDK-internal | Yes — every chunk logged |
| Native function calling | Yes (via SDK) | Yes |
| SDK-execution mode (`code`) | No | Yes — `run_code` + generated SDK prompt |
| Malformed JSON repair | `json-repair>=0.30.0` dep | No — tool arguments stream as raw JSON and are preserved verbatim |
| Streaming parse | SDK-internal | Yes — incremental BlockAssembler |
| Interrupted stream handling | Not exposed | Logged, preserved |

---

## 5. Tool / Action Surface

### 5.1 jiuwenswarm built-in tools (40+, approximate)

The tool set is large and lives mostly in the `openjiuwen` SDK plus jiuwenswarm-registered tools. Representative verified names:

| Category | Tools |
|---|---|
| File ops | `read_file`, `write_file` (plus edit, mkdir, move, copy, delete, patch) |
| Execution | `bash` / `code` (program execution) |
| Web | `web_fetch` / `web_search` (free/paid search providers: Jina, Serper, Perplexity, Bocha) |
| Browser | `browser_run_task` (Playwright via MCP) |
| Memory | `write_memory`, `read_memory`, `memory_search`, `memory_get`, `edit_memory` |
| Skills | `skill_index_build`, `skill_branch_explore`, `skill_branch_peek` |
| Multi-agent / team | `task_tool` (dispatch sub-agents: research, browser, coding), team orchestration, A2A/A2X |
| LSP / editor / terminal | `lsp`, `create_terminal`, `read_terminal_output`, `wait_for_terminal_exit`, `release_terminal`, `read_text_file`, `write_text_file` |
| Multimodal | `audio_question_answering`, `audio_metadata`, `generate_image`, `visual_question_answering`, `video_understanding` |
| Files-to-user | `send_file_to_user` |
| MCP / ACP passthrough | Dynamic from any configured MCP server; `acp_chat` drives external ACP agents |
| Cron | `cron_list_jobs`, `cron_create_job`, … |

Notable: `send_file_to_user` handles multi-turn dedup, workspace materialization, and cross-channel targeting (Feishu, web, etc.).

### 5.2 deepseek-harness built-in tools (composition-dependent)

The tool set is defined by the profile composition (the `dsh-base` bundle, platform-gated), not a fixed hardcoded list — the base profile mounts **20+ tool plugins** exposing a comparable number of model-facing names. Exact names/count vary by platform and overlay. Representative tools:

| Tool | What it does |
|---|---|
| `read` | Read a file window (line-numbered, syntax-highlightable) |
| `write` / `edit` | Create/overwrite / search-replace edit a file |
| `list` / `grep` / `glob` | Directory listing / regex search / path glob |
| `bash` / `pwsh` | Shell command (POSIX vs Windows selection) |
| `run_code` | Code Mode transport: run a TS/Python program that calls tools via `tools.name(args)` (only presented under `code` mode) |
| `web_search` / `web_fetch` | Web search / fetch (fetch is provider-gated; disabled in the base profile) |
| `todo_write` | Todo-list snapshot |
| `skill` | Load a skill's instruction content into context |
| `ask_user_question` | Human-in-the-loop question |
| `subagent` / `subagent_fork` / `list_agents` / `send_message` | Child-agent delegation and continuable background agents |
| `job_start` / `job_poll` / `job_cancel` | Background task control |
| `workflow` / `goal` / `ralph` | Workflow runs, same-session goals, fresh-agent iteration |
| LSP / `terminal` / `session_query` / `str_replace_editor` | Code intelligence, persistent terminals, session history, atomic edits |

Tool output rendering:
```typescript
interface ToolOutputDefinition {
  schema: JsonSchemaNode
  render(args, value): ContentBlock[]          // What the model sees
  presentationMeta?(args, value): JsonValue    // What the UI sees (diff, path, etc.)
}
```

Render intents are a `card`-tagged union. **Call-time** cards: `generic`, `terminal`, `diff`. **Result-time** cards additionally: `search` (grep/glob), `read` (line-numbered file), `web` (search/fetch). `locations` is a field on generic/diff cards (files for editor follow-along), not a card type.

### Comparison

| | jiuwenswarm | deepseek-harness |
|---|---|---|
| Total built-in tools | ~40+ | 20+ (composition-dependent) |
| Multimodal tools | Yes (audio, image, video) | No |
| Browser automation | Yes (Playwright via MCP) | No (MCP plug-in point) |
| Multi-agent dispatch | `task_tool`, team orchestration, A2A/A2X | `subagent`/`subagent_fork`/`list_agents`/`send_message` + ACP |
| Memory tools | Yes (`write_memory`, `read_memory`, `memory_search`, …) | No built-in |
| MCP support | Yes | Yes (client, via plugins) |
| LSP integration | No | Yes |
| File diff rendering | No | Yes (UI) |
| Tool render intents | None (SDK-internal) | Call: generic/terminal/diff; result: +search/read/web (6 card types) |

---

## 6. Execution & Sandboxing

### 6.1 jiuwenswarm

Execution modes:

| Mode | Transport | Isolation |
|---|---|---|
| Local (SysOperation) | Direct subprocess | `rlimit` (CPU: 300s, RAM: 4GB) |
| Sandbox (JiuwenBox) | HTTP to jiuwenbox-server | Full filesystem isolation, no network |
| Browser MCP | HTTP/SSE port 8940 | Process boundary |
| Remote Agent (A2A) | gRPC/HTTP | Network boundary |

Safety rails:
```python
class SecurityRail:
    async def __call__(self, tool_call):
        if "bash" in tool_call.name:
            cmd = tool_call.input.get("command", "")
            if any(danger in cmd for danger in ["rm -rf", "sudo", ":(){"]):
                return None  # Block
        return tool_call
```

A separate `bash_tool_safety.py` installs hooks to block dangerous operations.

### 6.2 deepseek-harness

Subprocess execution uses a layered abstraction:

```typescript
abstract class SubprocessRuntime extends Service {
  abstract resolveExecutable(command, env?, signal?): Promise<string>
  abstract spawn(spec: SubprocessSpawnSpec): SubprocessHandle
  abstract spawnTerminal(spec): Promise<SubprocessTerminalHandle>
}
```

Environment scrubbing: removes `KEY|PASSWORD|SECRET|TOKEN` patterns and all `DSH_*` names from inherited env.

Sandbox backends:
- **macOS**: `sandbox-exec` / Seatbelt with a DSL profile (write-deny default + write allow-lists)
- **Linux**: bubblewrap (`bwrap`) or Landlock LSM via the `@deepseek-ai/node-addon-landlock-run` native addon
- **Windows**: ACL-based restricted-token runner (`dsh-sandbox-windows-acl`)
- **Fail-closed**: violations deny access, not warn
- **Docker/Remote**: capability seam allows swapping the backend → container executor (E2B sandbox adapter exists as a POC)

No built-in Docker support, but it's a clean plug-in point. E2B sandbox adapter exists as a POC.

### Comparison

| | jiuwenswarm | deepseek-harness |
|---|---|---|
| Native OS sandbox | Via JiuwenBox (separate server) | Yes (macOS/Linux/Windows) |
| Docker support | JiuwenBox (custom) | Plug-in point (E2B POC) |
| Env scrubbing | Not explicit | Yes (secrets stripped) |
| Resource limits | rlimit (CPU/RAM) | Via sandbox profiles |
| Network egress control | JiuwenBox (disallow_network) | Via sandbox policy |
| Safety rails | SecurityRail middleware | Capability seam / policy |
| Fail-closed | Yes (SecurityRail blocks) | Yes |
| Remote execution | A2A protocol | Via subprocess swap |

---

## 7. Observation / Feedback Loop

### 7.1 jiuwenswarm

Tool results flow through the SDK as structured events. jiuwenswarm streams them to clients as chunks:

```python
elif event.type == "tool_result":
    yield AgentResponseChunk(payload={
        "event_type": "chat.tool_result",
        "result": event.output,
    })
```

The SDK feeds the result back to the model automatically. Memory can augment what the model sees:

```python
# Before model call:
memory_context = memory_rail.retrieve(query, top_k=3)
system_prompt += f"\n\nPast insights:\n{memory_context}"
```

Context compression kicks in when tokens exceed a threshold — LLM-based summarization of old turns.

### 7.2 deepseek-harness

Every tool result is rendered into `ContentBlock[]` via the tool's `render()` function and appended to the session log as a `tool/result` event. The model then sees it as a `tool-result` message in the next step.

**Critical invariant**: the model sees **exactly** what is logged. This is enforced architecturally — `session.deriveMessages()` reconstructs the full conversation from the log, and this reconstructed form is what goes into the LLM request. There is no separate "prompt construction" that could diverge from the log.

Output size management is layered: each tool's own `render()` projects the model-facing content, and the harness adds composition-level policies — a spill policy (large results spill to a locator) and a tool-result pruner (compacts oversized tool results into the configured budget).

### Comparison

| | jiuwenswarm | deepseek-harness |
|---|---|---|
| Model-visible = logged | Not enforced | Hard invariant |
| Result rendering | SDK-internal | Per-tool render functions |
| Memory injection | Yes (SQLite-vec/FTS5, proactive extraction) | No (skill system instead) |
| Context compression | LLM-based summarization | Compaction (archive turns) |
| Observation format control | Opaque to harness | Full (ContentBlock[]) |
| Streaming to clients | WebSocket chunks (event_type + payload) | Via ACP / web |

---

## 8. Context / Memory Management

### 8.1 jiuwenswarm

Three explicit memory layers:

```
Layer 1: Short-term (PersistenceCheckpointer)
  → Disk-based JSONL, per-session, survives restarts

Layer 2: Long-term (SQLite-vec + FTS5 + markdown memory)
  → Cross-session semantic search (hybrid vector + full-text), proactive extraction, "dreaming" pruning

Layer 3: Working memory (context window)
  → LLM-managed, compressed on overflow
```

Proactive memory extraction: after each turn, the system runs an async extraction job that identifies learnings and persists them (markdown memory indexed into the local SQLite-vec + FTS5 store). A "dreaming" sweep prunes stale entries. Note: long-term memory is **not** ChromaDB — it uses a local **SQLite + `sqlite-vec` + FTS5** store (with optional PostgreSQL vectors / Redis for scale).

### 8.2 deepseek-harness

Memory model is **scope-based**, not conversation-level:
- Each agent has its own **scope** (plugin layer) that disposes cleanly when the agent disposes
- Session log is the durable store; `deriveMessages()` reconstructs conversation
- **Skills** inject dynamic instruction context (markdown documents loaded on-demand)
- No separate vector store or cross-session memory
- **Compaction**: old turns can be archived; restored as summaries
- **Fork**: branch a session from a between-turn boundary (it rejects a prefix that ends inside an open turn) — creates an independent conversation from that point

### Comparison

| | jiuwenswarm | deepseek-harness |
|---|---|---|
| Session persistence | JSONL history + SQLite-vec/FTS5 memory | Append-only event log (JSONL or SQLite) |
| Cross-session memory | Yes (SQLite-vec + FTS5) | No |
| Memory extraction | Yes (proactive, auto) | No |
| Memory retrieval in prompt | Yes (top-k semantic) | No |
| Context compression | LLM summarization | Compaction (turn archival) |
| Fork / replay | No | Yes |
| Skill-as-context injection | Yes (SkillNet) | Yes (dynamic markdown) |

---

## 9. Configuration Systems

### 9.1 jiuwenswarm — YAML + env vars with recursive resolution

```yaml
model_name: deepseek-v4-flash
memory:
  mode: long_term
sandbox:
  runtime: jiuwenbox
  endpoint: http://127.0.0.1:5000
```

Resolution: `${VAR:-default}` syntax, recursive through entire YAML tree. API keys are decrypted if a crypto provider is registered. Priority: env vars > config.yaml > defaults.

A single `get_config()` call handles everything — no layered patch system.

### 9.2 deepseek-harness — Cordis YAML with layered patches

Configuration is a declarative plugin tree:

```yaml
- id: llm-deepseek
  name: '@deepseek-ai/dsh-llm-deepseek'
  config:
    maxRetries: 5
    mode: bounded

- id: bash
  name: '@deepseek-ai/dsh-bash-local'
  config:
    graceMs: 200
```

Patches are applied in this order:
1. `dsh-base` bundle patches
2. Additional bundles
3. Profile-level `cordis.patch.yml`
4. Home-level `$DSH_HOME/cordis.patch.yml`
5. CLI `--patch` overlays
6. Telemetry disable

Config schema is TypeScript interface → auto-validated at boot. Environment variables: `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, `DSH_HOME`, `DSH_TELEMETRY_DISABLED`.

### Comparison

| | jiuwenswarm | deepseek-harness |
|---|---|---|
| Config format | config.yaml + .env | Cordis YAML (plugin tree) |
| Layered overrides | No (single config + env) | Yes (6-layer patch chain) |
| Schema validation | Pydantic (partial) | TypeScript interface → auto |
| Secret handling | Crypto provider decryption | Env var scrubbing |
| Runtime reconfiguration | No | Via `installSettingsSection` |
| Multi-profile support | Via multiple config files | Yes (`$DSH_HOME/profiles/<name>/`) |

---

## 10. Multi-Agent Support

### 10.1 jiuwenswarm

Multi-agent is first-class and deeply integrated:

```
Leader Agent
  ├─ Research Agent    (web search + summarization)
  ├─ Browser Agent     (Playwright browser control)
  └─ Coding Agent      (code understanding + generation)

Remote Teams (A2A protocol):
  Local Leader ──── A2A gRPC/HTTP ──── Remote Agent
```

- **`task_tool`**: dispatch sub-agents (research, browser, coding)
- **Team orchestration**: a `TeamManager` coordinates member agents, with a token-budget-limited **SwarmFlow** team mode
- **A2A / A2X protocols**: standardized inter-agent communication (A2A over gRPC/HTTP for distributed teams; A2X agent registry) — jiuwenswarm also supports **ACP** as a channel/protocol and an `acp_chat` tool to drive external ACP agents
- **Channel routing**: output is routed to specific channels (web, Feishu, Slack, …) via channel adapters and `send_file_to_user` cross-channel targeting

### 10.2 deepseek-harness

Multi-agent is a capability seam. The `AgentLoopSettings` supports multiple configured agents that boot at startup. Agents communicate and compose via:
- **Subagent delegation** — `subagent` / `subagent_fork` tools spawn child agents; a `send_message` channel reaches continuable background children; the in-process driver composes a child from its parent's capability set (`agentPresets.composeFrom`)
- **ACP (Agent Client Protocol)**: automation server protocol for structured agent-to-automation integration (not an inter-agent channel)
- Each agent has its own scope, session log, and inbox — full isolation

The Cordis plugin layer allows a supervisor agent to register child agents and route tool calls to them.

Capabilities are also **per-session composable** via agent presets — a reusable composition that gives one session a different tool/capability set, and lets a child agent inherit its parent's exact capabilities. An experimental **Agent Teams** seam layers durable teams (a roster, task board, and peer mailbox) over continuable subagents.

### Comparison

| | jiuwenswarm | deepseek-harness |
|---|---|---|
| Multi-agent support | First-class, built-in | Capability seam (pluggable) |
| Predefined sub-agent types | Research, Browser, Coding | No |
| Inter-agent protocol | A2A / A2X (also ACP channel + `acp_chat`) | ACP (automation server) + in-process subagent delegation |
| Distributed teams | Yes (A2A/A2X) | Via ACP server |
| Token budget control | `swarmflow_budget` | `maxParallelToolCalls` |
| Agent isolation | Process/network boundary | Scope + session per agent |

---

## 11. Skill Systems

### 11.1 jiuwenswarm — SkillNet + Self-Evolution

Skills are managed via `skillnet-ai` (an external skill hub). The system supports:
- `skill_index_build` / `skill_branch_explore` — discovery and navigation
- **Self-evolution**: skills can be automatically improved based on usage patterns (`EVOLUTION_AUTO_SCAN`)
- Skills can be invoked directly as tools

The "dreaming" mechanism prunes stale memory/skills and reinforces effective ones, making the agent improve over time.

### 11.2 deepseek-harness — Dynamic Skill Registry

Skills are **markdown instruction documents** loaded on-demand:

```typescript
interface SkillDefinition {
  name: string
  description: string
  whenToUse?: string
  source: 'project-dsh' | 'project-agents' | 'runtime' | 'user-dsh' | 'user-agents' | 'custom' | 'bundled' | (string & {})
  content: string              // Markdown body injected into prompt
  invocation: SkillInvocationPolicy
  resourceBase?: SkillResourceBase
  metadata?: Record<string, unknown>
}
```

Skills are discovered via providers, ranked, and injected into the model's context when relevant. Plugins can register skill providers. Layering: global → per-scope (agent-specific).

### Comparison

| | jiuwenswarm | deepseek-harness |
|---|---|---|
| Skill format | SkillNet (external hub) | Markdown + YAML frontmatter |
| Skill discovery | `skillnet-ai` API | Provider-based (layered) |
| Self-improvement | Yes (auto-evolution, dreaming) | No |
| Skill injection | Tool invocation | Prompt context injection |
| User-defined skills | Yes | Yes (user-dsh source) |

---

## 12. Observability & Testing

### 12.1 jiuwenswarm

- `opentelemetry-api/sdk` in dependencies but integration depth unclear
- JSONL history files per session (not structured traces)
- **pytest** with `--asyncio-mode=auto`
- ~80+ test files covering: error handling, channel integrations, cost calculation, MCP lifecycle
- No snapshot/replay testing
- No coverage gate mentioned

### 12.2 deepseek-harness

- **OpenTelemetry** export is available but **opt-in and disabled by default**: `dsh-session-telemetry-otel` mirrors session-log records onto OTLP/HTTP **logs** (gated by `DSH_TELEMETRY_MODE`). It is log/session-record export, not span-level tracing, and the durable in-process log is the authoritative observability record.
- Every LLM chunk, every tool call, every state transition is durably logged
- **Snapshot testing**: record a real session, replay it in CI without API key
- **100% unit test coverage gate** on all packages
- **Vitest** with `tsx` for TypeScript
- E2E tests skipped automatically without `DEEPSEEK_API_KEY`
- Test types: unit, e2e, snapshot (replay)

### Comparison

| | jiuwenswarm | deepseek-harness |
|---|---|---|
| OTel export | Partial (dep present) | Opt-in OTLP **logs** of session records (default-off) |
| Structured durable session log | No (JSONL history only) | Yes (append-only, source of truth) |
| Session replay | No | Yes (snapshot tests) |
| Coverage gate | None mentioned | 100% (unit packages) |
| Test framework | pytest | Vitest |
| E2E without API key | Manual integration test | Snapshot replay |

---

## 13. Deployment & Channels

### 13.1 jiuwenswarm

Channels (10+):
- Web (WebSocket), TUI, Desktop (PyWebView)
- Feishu, DingTalk (streaming), WeChat Work, Telegram, Discord, Slack, WhatsApp

Deployment:
- **Single machine** (default)
- **Multi-process** (ZMQ + PostgreSQL, optional `distribute` extra)
- **Distributed** (A2A protocol, remote agents)

### 13.2 deepseek-harness

- **CLI** (`dsh web` / `dsh headless`) — web UI or batch mode
- **Python SDK** — JSON-RPC over stdio to bundled Node runtime; `pip install deepseek-harness`
- **ACP server** — Agent Client Protocol for automation integrations
- **Headless + plugins** — embedded deployment

Single-machine. No built-in multi-process or distributed deployment.

### Comparison

| | jiuwenswarm | deepseek-harness |
|---|---|---|
| Web UI | Yes (WebSocket) | Yes (built-in) |
| CLI/TUI | Yes | Yes |
| Desktop app | Yes (PyWebView) | No |
| IM channels (Feishu/Slack/etc.) | Yes (10+ channels) | No |
| Python SDK | No (is the Python service) | Yes |
| Distributed deployment | Yes (A2A + ZMQ) | No |
| Multi-process | Yes (optional) | No |

---

## 14. Dependencies & Ecosystem

### 14.1 jiuwenswarm

```
Runtime: Python 3.11+
Key dependencies:
  openjiuwen (git+gitcode.com/openJiuwen/agent-core, develop branch)
  fastapi>=0.115        (HTTP)
  uvicorn>=0.30         (ASGI)
  pydantic>=2.0
  skillnet-ai==0.0.16   (skill hub)
  opentelemetry-api/sdk>=1.28
  json-repair>=0.30.0
  tree-sitter>=0.25.0   (code parsing)
  sqlite-vec==0.1.6     (vector extension)
  pgvector>=0.4.2       (PostgreSQL vectors)
  faiss-cpu>=1.7.0      (vector search)
  websockets>=12.0
  psutil>=7.2.2
  croniter>=2.0.0       (cron scheduling)
  portalocker>=3.2.0    (file locking)
  aiosqlite>=0.22.1

+ 10 channel SDKs (lark-oapi, telegram, discord, slack, wecom, dingtalk, ...)

Security floors enforced:
  python-multipart>=0.0.31  (CVE-2026-42561)
  lxml>=6.1.0               (CVE-2026-41066)
  pillow>=12.2.0            (CVE-2026-40192)
```

Heavy dependency footprint. Core agent-core is a git dependency on `develop` branch (no pinned version).

### 14.2 deepseek-harness

```
Runtime: Node.js ^22.19.0 || >=24.0.0
Package manager: pnpm 11.7.0
TypeScript: ^6.0.3
Test: Vitest ^4.1.8
Build: tsdown ^0.22.2
Lint: oxlint 1.76.0

Key internal packages (all @deepseek-ai/*):
  cordis (vendored framework), dsh-llm, dsh-session, dsh-scope,
  dsh-tools, dsh-agent, dsh-agent-loop, dsh-subprocess,
  dsh-sandbox, dsh-sandbox-local, dsh-skill

External:
  @agentclientprotocol/sdk (ACP)
  @deepseek-ai/node-addon-landlock-run (Linux sandbox)
```

Monorepo with strict package boundaries. ESM-only.

---

## 15. Head-to-Head Scorecard

Rated 1–5 per dimension, from the perspective of building the best possible runtime harness.

| Dimension | jiuwenswarm | deepseek-harness |
|---|:---:|:---:|
| **Architecture cleanliness** | 3 | 5 |
| **Auditability / replay** | 1 | 5 |
| **Parallel tool execution** | 1 | 5 |
| **Sandboxing depth** | 3 | 4 |
| **Tool surface breadth** | 5 | 3 |
| **Multi-agent coordination** | 5 | 3 |
| **Cross-session memory** | 5 | 1 |
| **Channel reach** | 5 | 1 |
| **Skill self-evolution** | 4 | 2 |
| **Observability (durable log + tracing)** | 2 | 4 |
| **Test quality / coverage** | 3 | 5 |
| **Config flexibility** | 3 | 4 |
| **Deployment options** | 5 | 2 |
| **Dependency hygiene** | 2 | 4 |
| **Model provider agnosticism** | 4 | 4 |
| **Streaming / low latency** | 3 | 5 |
| **TOTAL** | **54** | **57** |

---

## 16. What Each Does Better

### jiuwenswarm does better:

1. **Tool breadth** — 40+ built-in tools including multimodal (audio, image, video), browser automation, multi-agent dispatch. deepseek-harness has ~20+ (composition-dependent).

2. **Multi-agent as product** — Research, Browser, and Coding sub-agents are production-ready specializations. deepseek-harness has the seam but no built-in specializations.

3. **Cross-session memory** — SQLite-vec + FTS5 semantic memory with proactive extraction and dreaming-based pruning. deepseek-harness has no cross-session memory.

4. **Channel reach** — 10+ channels (Feishu, DingTalk, Slack, Discord, Telegram, WeChat, WhatsApp, web, TUI, desktop). deepseek-harness is CLI + web only.

5. **Deployment** — Distributed multi-process with A2A protocol, ZMQ, PostgreSQL. deepseek-harness is single-machine.

6. **Skill evolution** — SkillNet + auto-evolution + dreaming makes the agent system improve over time. deepseek-harness skills are static markdown documents.

### deepseek-harness does better:

1. **Architecture** — Cordis plugin seams make every component swappable without forking. jiuwenswarm is coupled to the openjiuwen SDK (git dev branch) in ways that can't be substituted.

2. **Auditability** — The "model-visible = logged" invariant is enforced architecturally. You can reconstruct exactly what the model saw in any past session. jiuwenswarm has no equivalent.

3. **Parallel tool execution** — `runGroup()` with `maxParallelToolCalls` and order-preserving result commit. jiuwenswarm executes tools sequentially.

4. **Streaming** — BlockAssembler assembles token deltas incrementally and every raw chunk is logged, giving low-latency token-level streaming to clients and full replay fidelity. (Tool execution still waits for the complete assembled message.) jiuwenswarm streams results to clients but its internals are SDK-opaque.

5. **Testing discipline** — 100% unit coverage gate, snapshot replay tests that run without an API key. jiuwenswarm has no coverage gate and no replay.

6. **Dependency hygiene** — Pure ESM, pinned pnpm, strict package boundaries. jiuwenswarm's core SDK is a git dev-branch dependency.

7. **Sandbox on native OS** — macOS sandbox-exec, Linux Landlock (fail-closed). jiuwenswarm requires a separate JiuwenBox server.

---

## 17. Key Gaps in Both (for "best harness" target)

| Gap | jiuwenswarm status | deepseek-harness status |
|---|---|---|
| Stream-native parallel tool execution | ❌ Missing | ✅ Done |
| Semantic context truncation | LLM summarization (blunt) | Compaction (turn-level) |
| Prompt injection in tool outputs | SecurityRail (partial) | Not addressed |
| Snapshot/restore mid-trajectory | Not built | Not built |
| Structured pre-execution safety policy | Rails (per-type) | Waterfall (pluggable) |
| Cross-agent shared memory | SQLite-vec + FTS5 (per-agent) | Not built |
| Tool output size management | Not explicit | Per-tool render + spill + tool-result pruner |
| Contamination-resistant eval | Out of scope | Out of scope |

---

## 18. Conclusion

**deepseek-harness** is the more rigorous engineering artifact. Its plugin architecture, durable session log, parallel tool scheduler, and streaming pipeline represent the state of the art for a runtime harness that needs to be auditable, composable, and correct under load. If you are building a harness to embed into products or to serve as a platform for other harnesses to build on, this is the better foundation.

**jiuwenswarm** is the more complete product. It ships a working agent platform with multi-channel deployment, multi-agent teams, cross-session memory, and skill evolution. If you need an agent system running in production today that handles real users across Feishu, Slack, and a web UI, jiuwenswarm gets there faster.

For building the **best runtime harness**, the synthesis is:
- Take deepseek-harness's **architectural model** (plugin seams, durable event log, parallel tool scheduler, streaming parser, OS-native sandbox)
- Take jiuwenswarm's **feature surface** (tool breadth, multi-agent specializations, cross-session memory, channel connectors)
- Add what both are missing: stream-native parallel action, semantic truncation, mid-trajectory snapshot/restore, structured pre-execution policy engine

---

## Appendix A: deepseek-harness internals deep-dive

Reference for the deepseek-harness internals referenced from [§2.2](#22-deepseek-harness). Facts are checked against the repository source.

### A.1 Boot and composition: profiles, bundles, patches

A running `dsh` is a **plugin tree** composed at boot, not a fixed program. `boot()` (in `app-boot`) creates a root `Context`, installs the Loader, mounts a root `cordis:include` entry pointing at a `cordis.yml`, and waits for every entry to reach the ACTIVE fiber state (`assertEntriesActivated`); a failing entry fails the boot loudly.

Composition is **layered and patchable**:
- A **profile** (`$DSH_HOME/profiles/<name>/`) is a directory with a `package.json` (`dsh.profile.bundles` list) and a user `cordis.patch.yml`.
- A **bundle** is a package declaring `dsh.bundle.patch` (e.g. `dsh-base`, `dsh-web-app`, `dsh-headless`). `dsh-base` is the shared core of every profile.
- Layers apply in order over an empty entry list: each bundle in the profile's list, then the profile patch, then the home-level patch, then any `--patch` overlay. A patch targets a row by `id` and replaces its whole `config`, or inserts new rows. The composition is visible via `dsh --profile <name> --dump-config`.

Every component — LLM adapter, tool registry, sandbox, persistence backend, session, and the agent loop itself — is a row in this tree, so each is replaceable or patchable from configuration. Loading is **service-availability driven**, not row order: a plugin (fiber) stays PENDING until all its declared `inject` services exist, then activates.

### A.2 Request reconstructability

Beyond "model-visible ⟺ logged", the harness makes every model request a **pure function of the session log**. Each step appends a `request/header` event recording the frozen call config (provider/model/effort/sampling), the rendered system prompt, and the assembled tool schemas; `foldRequestHeader` reconstructs the current header from the latest snapshot. `deriveMessages()` projects model history from the surface, so the assembled `GenerateOptions` for any step can be rebuilt purely from the log. This is the basis of the snapshot/replay tests and the "no separate prompt construction that could diverge" claim.

### A.3 Event taxonomy

Events are typed via declaration-merging and split into three domains with distinct guarantees:
- **Session events** (durable, append-only): `turn/start`, `turn/end`, `step/start`, `step/end`, `user/message`, `assistant/chunk`, `assistant/message`, `tool/call`, `tool/result`, plus log-only records. These survive reload and are the source of truth.
- **Agent events** (`agent/*`, live): `agent/created`, `agent/disposed`, `agent/pre-step`, `agent/request`, `agent/request-error`, `agent/turn-stopping`, inbox notifications — carry a live `Agent`, for observing/intercepting work in flight.
- **Capability events** (`tools/*`, `llm/*`, `fs/*`, `session/*`, ...): attach policy and adapters to a seam without importing the loop.

**Model-visible ⟺ logged** is structural: `SessionEventMap` is merge-extensible, so a new model-visible input requires a new session event, rendered from the log.

### A.4 Scope and initiator machinery

Per-agent isolation is not just a session: each `Agent` owns a **scope** (`agent.ctx`) — a scoped registration layer such that tools, prompt sections, variables, restrictions, and listeners registered through it are visible only to that agent and unwind when it disposes. Registrations are **effects**: every contribution returns a disposer, and unloading a fiber tears its contributions down in reverse order.

The **initiating agent** is carried through a process-local asynchronous driver chain via two `AsyncLocalStorage`s. `ctx.agents.withInitiator(agent, op)` runs `op` with that agent inherited; `requireInitiator()` recovers it. This is how tool execution knows which agent it runs on behalf of (`ToolExecutionInput.agent`) without passing it explicitly through every call. Ambient presence is attribution, never authorization — identity stays explicit at worker/process/wire boundaries.

### A.5 Capability seams and extension points

A **capability seam** is complete only when it has all three roles: Service Definition (the `ctx.<key>` class), one or more Providers, and one or more Consumers. The `shell` group is canonical: `dsh-shell` (definition), `dsh-bash-local`/`dsh-bash-sandbox` (providers), `dsh-tool-bash` (consumer).

New behavior attaches to documented seams rather than editing the loop:
- Add a model provider → register an adapter on `ctx.llm`.
- Add a model-facing capability → register on `ctx.tools`; its schema joins prompt assembly.
- Add shell execution → register a `ctx.shell` backend (the local one spawns through `ctx.subprocess`).
- Add persistent terminals → register a `ctx.terminals` backend plus `dsh-tool-terminal`.
- Add filesystem access/policy → register a `ctx.fs` provider or listen to `fs/*`.
- Confine processes → use a `ctx.sandbox` backend; consumers wrap argv before spawning.
- Add human commands → register on `ctx.commands` (dispatch without a model turn).
- Add background work → register on `ctx.jobs`.
- Intercept a request/tool/turn → its `agent/*` or `tools/*` event.

Composed seams that sit on these primitives:
- **Agent presets** — a per-session composition (a reusable cordis.yml fragment) giving one session a different capability set; `composeFrom` joins a child agent to the *same standing composition* its parent already runs on, so a child inherits the parent's exact plugins, tools, and prompt sections.
- **Subagents** — a named-provider seam, from a fresh in-process child agent (`spawn`) to a fork of the parent's history (`fork`). The `subagent` / `subagent_fork` tools delegate; a continuable background child exposes `send_message` and `list_agents`. Delegation records a durable `delegationDepth` and parent lineage in the session header. The experimental **Agent Teams** seam layers a durable roster, task board, and mailbox over continuable subagents.
- **Hook bridges** — `dsh-hooks` bridges the **Claude Code** and **Codex** hook wire protocols (SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, Stop) onto the harness's typed `agent/*` extension points; a `hooks/` wire-protocol library shares the parsing.
- **Plan / goal / workflow / compaction / spill** — plan mode as logged `plan/mode` state; persisted same-session goals with `active/paused/blocked/complete` phases driven by `goal-round-driver`; runnable scripts on a worker-thread provider; turn-archival compaction with a tool-result pruner that preserves the model-visible result within a budget; and spill-to-locator for large text results.

### A.6 Persistence durability contract

A persistence backend stores every event losslessly — including `assistant/chunk`, because `seq` must stay contiguous (chunks cannot be filtered from the canonical log). The base profile uses the JSONL backend under `$DSH_HOME/sessions`; SQLite is an alternative backend. `Session.append` validates every event as lossless JSON at the append site, so a bad event never enters the log and cannot silently diverge from disk. Crash recovery closes an orphaned open turn with synthetic closers; a torn physical tail is discarded.
