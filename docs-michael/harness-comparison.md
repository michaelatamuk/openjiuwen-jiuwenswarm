# Runtime Harness Comparison: deepseek-harness vs jiuwenswarm

**Date**: August 2026
**Author**: Technical Analysis
**Projects**:
- `deepseek-harness` → `/Users/mishka/PycharmProjects/openjiuwenothers/deepseek-harness`
- `jiuwenswarm` → `/Users/mishka/PycharmProjects/openjiuwen/jiuwenswarm`

---

## 1. TL;DR

| | deepseek-harness | jiuwenswarm |
|---|---|---|
| **Language** | TypeScript / Node.js 22+ | Python 3.11+ |
| **Architecture** | Plugin framework (Cordis) — everything swappable | Facade + Adapter pattern |
| **Loop design** | Reactive event-driven (turn/step state machine) | ReAct (Reason → Act → Observe) |
| **Maturity** | 0.1.1-rc.2 — production-grade engineering, pre-release | Stable — actively deployed |
| **Primary audience** | Developers embedding agents into products | Teams deploying full agent platforms |
| **Key strength** | Auditability, composability, replay | Multi-channel reach, skill evolution, team agents |

---

## 2. Core Architecture

### 2.1 deepseek-harness

The central idea is the **Cordis plugin framework**: every component — LLM adapter, tool registry, sandbox, subprocess runner, filesystem, session log — is a plugin that conforms to a capability seam interface. Nothing is hardcoded.

```
Capability Seam = Definition (interface) + Provider (implementation) + Consumer (caller)
```

The agent loop is a **reactive state machine**:

```
Inbox (priority queue) → preStep() → step() → LLM stream → BlockAssembler → tool-calls → runGroup() → results → next step
```

Every event (turn/start, step/start, assistant/chunk, assistant/message, tool/call, tool/result, turn/end) is appended to a **durable append-only session log** (SQLite). The invariant: "model-visible ⟺ logged." This enables full replay, forking at any turn boundary, and auditing exactly what the model saw.

Tool calls are extracted from the assembled `ContentBlock[]` stream and dispatched to a **parallel scheduler** (`runGroup`) that respects `isConcurrencySafe()` per tool. Results are committed in **model-declared order** regardless of completion order.

### 2.2 jiuwenswarm

The central idea is the **JiuWenSwarm facade**: a single async entry point (`process_message_stream`) that routes to one of two adapters (Deep or Code) based on session mode. Adapters wrap the openjiuwen `DeepAgent` SDK which runs the ReAct loop internally.

```
JiuWenSwarm → JiuWenSwarmDeepAdapter → openjiuwen DeepAgent SDK → ReAct loop → tools
```

The **Rails system** intercepts every tool call before and after execution. Rails are composable middleware:

```python
MemoryRail → SecurityRail → PermissionsRail → SkillUseRail → [tool executes] → result
```

History is recorded as JSONL files on disk per session. There is no equivalent of the deepseek-harness append-only event log with replay capability.

---

## 3. Agent Loop Mechanics

### 3.1 deepseek-harness — Turn/Step State Machine

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
- **AbortController per turn** — clean cancellation at any step
- **Inbox target** (`next-turn` vs `next-step`) — controls whether new inbox messages are consumed within the current turn
- **`agent/turn-stopping` waterfall** — plugins can veto or delay turn termination
- **Error quarantine** — errors are logged and rethrown; the session log always knows the cause

### 3.2 jiuwenswarm — ReAct Loop

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

### Comparison

| | deepseek-harness | jiuwenswarm |
|---|---|---|
| Loop driver | Custom reactive engine | openjiuwen SDK (internal) |
| Cancellation | AbortController per turn | No explicit per-turn abort |
| Parallel tool calls | Yes — `maxParallelToolCalls`, order-preserving | No — sequential execution |
| Turn vs step distinction | Explicit (turn = one inbox batch, step = one LLM call) | Opaque (inside SDK) |
| Replay | Full — reconstruct any past session from log | No — JSONL history only |
| Fork at turn boundary | Yes | No |
| Max steps guard | Configurable per agent | `max_iterations` in config |

---

## 4. Parsing Model Output

### 4.1 deepseek-harness

The **BlockAssembler** processes streaming chunks token-by-token:

- Supports two tool modes: **`native`** (model emits structured `tool-call` blocks per provider protocol) and **`code`** (model emits tool calls inside markdown code fences, parsed by regex)
- Handles interrupted streams (partial blocks from aborted calls are preserved in the session log with `interrupted: true`)
- Content block types: `text`, `tool-call`, `thinking` (for reasoning models)
- **Suppresses `onChange`-equivalent** — when programmatic `setValue` is called during a replay, the change event is not fed back to the loop

In code mode, the harness parses patterns like:

```
```python
tool_name(arg1=value1, arg2=value2)
```
```

and extracts them into structured `ToolCallBlock` objects.

### 4.2 jiuwenswarm

Parsing is delegated entirely to the openjiuwen SDK. jiuwenswarm consumes already-parsed `event.type == "tool_call"` events with structured `event.tool_name` and `event.tool_input`. The harness has no direct visibility into raw model output.

One Rail (`json-repair` dependency) patches malformed JSON in tool arguments before passing them to executors.

### Comparison

| | deepseek-harness | jiuwenswarm |
|---|---|---|
| Raw chunk access | Yes — every chunk logged | No — SDK-internal |
| Native function calling | Yes | Yes (via SDK) |
| Code-fence fallback mode | Yes — full regex parser | No |
| Malformed JSON repair | Via `json-repair` package | `json-repair>=0.30.0` dep |
| Streaming parse | Yes — incremental BlockAssembler | SDK-internal |
| Interrupted stream handling | Logged, preserved | Not exposed |

---

## 5. Tool / Action Surface

### 5.1 deepseek-harness built-in tools (17)

| Tool | What it does |
|---|---|
| `read_file` | Read file content with hash, encoding detection |
| `write_file` | Write/overwrite file; git-aware diff |
| `list_directory` | Directory listing with metadata |
| `bash` | Shell command via subprocess (platform-adaptive) |
| `run_code` | In-process TS/Python execution |
| `search_files` | Regex search with context lines |
| `fetch_web` | HTTP GET with caching |
| `search_web` | Web search (provider-based) |
| `create_todo` | Task tracking |
| `search_skills` | Dynamic skill discovery |
| `invoke_skill` | Execute loaded skills |
| `ask_user` | Human-in-the-loop input |
| `job_*` | Background task control |
| `mcp` | Model Context Protocol passthrough |
| LSP tools | Code intelligence (go-to-def, hover, etc.) |
| Workspace tools | Multi-root project handling |

Tool output rendering:
```typescript
interface ToolOutputDefinition {
  schema: JsonSchemaNode
  render(args, value): ContentBlock[]          // What the model sees
  presentationMeta?(args, value): JsonValue    // What the UI sees (diff, path, etc.)
}
```

Render modes: `generic`, `terminal`, `diff`, `locations`.

### 5.2 jiuwenswarm built-in tools (40+)

| Category | Tools |
|---|---|
| File ops | `read_file`, `write_file`, `list_files`, `create_directory`, `move_file`, `copy_file`, `delete_file`, `patch_file`, `send_file_to_user` |
| Execution | `bash`, `code` |
| Web | `web_fetch`, `web_free_search`, `web_paid_search` (Jina/Serper/Perplexity/Bocha) |
| Browser | `browser_run_task` (Playwright via MCP) |
| Memory | `memory.write`, `memory.read`, `memory.delete` |
| Skills | `skill_index_build`, `skill_branch_explore` |
| Multi-agent | `task_tool`, `invoke_agent` |
| Session | `todo_modify`, `send_to_channel` |
| Multimodal | `audio_transcribe`, `image_generate`, `video_understand` |
| MCP passthrough | Dynamic from any configured MCP server |

Notable: `send_file_to_user` handles multi-turn dedup, workspace materialization, and cross-channel targeting (Feishu, web, etc.).

### Comparison

| | deepseek-harness | jiuwenswarm |
|---|---|---|
| Total built-in tools | ~17 | ~40+ |
| Multimodal tools | No | Yes (audio, image, video) |
| Browser automation | No (MCP plug-in point) | Yes (Playwright via MCP) |
| Multi-agent dispatch | Via `ask_user` / ACP | `task_tool`, `invoke_agent` |
| Memory tools | No built-in | Yes (write/read/delete) |
| MCP support | Yes | Yes |
| LSP integration | Yes | No |
| File diff rendering | Yes (UI) | No |
| Tool result render modes | 4 (generic/terminal/diff/locations) | None (SDK-internal) |

---

## 6. Execution & Sandboxing

### 6.1 deepseek-harness

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
- **macOS**: `sandbox-exec` with DSL profile
- **Linux**: Landlock LSM (native addon) or seccomp
- **Windows**: ACL-based file access control
- **Fail-closed**: violations deny access, not warn
- **Docker/Remote**: capability seam allows swapping `ctx.subprocess` → container executor

No built-in Docker support, but it's a clean plug-in point. E2B sandbox adapter exists as a POC.

### 6.2 jiuwenswarm

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

### Comparison

| | deepseek-harness | jiuwenswarm |
|---|---|---|
| Native OS sandbox | Yes (macOS/Linux/Windows) | Via JiuwenBox (separate server) |
| Docker support | Plug-in point (E2B POC) | JiuwenBox (custom) |
| Env scrubbing | Yes (secrets stripped) | Not explicit |
| Resource limits | Via sandbox profiles | rlimit (CPU/RAM) |
| Network egress control | Via sandbox policy | JiuwenBox (disallow_network) |
| Safety rails | Capability seam / policy | SecurityRail middleware |
| Fail-closed | Yes | Yes (SecurityRail blocks) |
| Remote execution | Via subprocess swap | A2A protocol |

---

## 7. Observation / Feedback Loop

### 7.1 deepseek-harness

Every tool result is rendered into `ContentBlock[]` via the tool's `render()` function and appended to the session log as a `tool/result` event. The model then sees it as a `tool-result` message in the next step.

**Critical invariant**: the model sees **exactly** what is logged. This is enforced architecturally — `session.deriveMessages()` reconstructs the full conversation from the log, and this reconstructed form is what goes into the LLM request. There is no separate "prompt construction" that could diverge from the log.

Output size management: each tool defines its own render function and can truncate internally. No global truncation policy is enforced at the harness level.

### 7.2 jiuwenswarm

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

### Comparison

| | deepseek-harness | jiuwenswarm |
|---|---|---|
| Model-visible = logged | Hard invariant | Not enforced |
| Result rendering | Per-tool render functions | SDK-internal |
| Memory injection | No (skill system instead) | Yes (ChromaDB, proactive extraction) |
| Context compression | Compaction (archive turns) | LLM-based summarization |
| Observation format control | Full (ContentBlock[]) | Opaque to harness |
| Streaming to clients | Via ACP / web | WebSocket chunks (event_type + payload) |

---

## 8. Context / Memory Management

### 8.1 deepseek-harness

Memory model is **scope-based**, not conversation-level:
- Each agent has its own **scope** (plugin layer) that disposes cleanly when the agent disposes
- Session log is the durable store; `deriveMessages()` reconstructs conversation
- **Skills** inject dynamic instruction context (markdown documents loaded on-demand)
- No separate vector store or cross-session memory
- **Compaction**: old turns can be archived; restored as summaries
- **Fork**: branch a session at any turn — creates independent conversation from that point

### 8.2 jiuwenswarm

Three explicit memory layers:

```
Layer 1: Short-term (PersistenceCheckpointer)
  → Disk-based JSONL, per-session, survives restarts

Layer 2: Long-term (ChromaDB)
  → Cross-session embeddings, proactive extraction, "dreaming" pruning

Layer 3: Working memory (context window)
  → LLM-managed, compressed on overflow
```

Proactive memory extraction: after each turn, the system runs an async extraction job that identifies learnings and upserts them into ChromaDB. A "dreaming" sweep prunes stale entries.

### Comparison

| | deepseek-harness | jiuwenswarm |
|---|---|---|
| Session persistence | SQLite event log | JSONL files + ChromaDB |
| Cross-session memory | No | Yes (ChromaDB) |
| Memory extraction | No | Yes (proactive, auto) |
| Memory retrieval in prompt | No | Yes (top-k semantic) |
| Context compression | Compaction (turn archival) | LLM summarization |
| Fork / replay | Yes | No |
| Skill-as-context injection | Yes (dynamic markdown) | Yes (SkillNet) |

---

## 9. Configuration Systems

### 9.1 deepseek-harness — Cordis YAML with layered patches

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

### 9.2 jiuwenswarm — YAML + env vars with recursive resolution

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

### Comparison

| | deepseek-harness | jiuwenswarm |
|---|---|---|
| Config format | Cordis YAML (plugin tree) | config.yaml + .env |
| Layered overrides | Yes (6-layer patch chain) | No (single config + env) |
| Schema validation | TypeScript interface → auto | Pydantic (partial) |
| Secret handling | Env var scrubbing | Crypto provider decryption |
| Runtime reconfiguration | Via `installSettingsSection` | No |
| Multi-profile support | Yes (`$DSH_HOME/profiles/<name>/`) | Via multiple config files |

---

## 10. Multi-Agent Support

### 10.1 deepseek-harness

Multi-agent is a capability seam. The `AgentLoopSettings` supports multiple configured agents that boot at startup. Agents communicate via:
- **ACP (Agent Client Protocol)**: automation server protocol for structured agent-to-automation integration
- **`ask_user`** tool used as inter-agent communication in some patterns
- Each agent has its own scope, session log, and inbox — full isolation

The Cordis plugin layer allows a supervisor agent to register child agents and route tool calls to them.

### 10.2 jiuwenswarm

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
- **`invoke_agent`**: call team members directly
- **SwarmFlow**: token-budget-limited autonomous team operation
- **A2A (Agent-to-Agent) protocol**: standardized inter-agent communication over gRPC/HTTP for distributed teams
- **Channel routing**: `send_to_channel` routes output to specific channels (web, Feishu, Slack, etc.)

### Comparison

| | deepseek-harness | jiuwenswarm |
|---|---|---|
| Multi-agent support | Capability seam (pluggable) | First-class, built-in |
| Predefined sub-agent types | No | Research, Browser, Coding |
| Inter-agent protocol | ACP | A2A (gRPC/HTTP) |
| Distributed teams | Via ACP server | Yes (A2A) |
| Token budget control | `maxParallelToolCalls` | `swarmflow_budget` |
| Agent isolation | Scope + session per agent | Process/network boundary |

---

## 11. Skill Systems

### 11.1 deepseek-harness — Dynamic Skill Registry

Skills are **markdown instruction documents** loaded on-demand:

```typescript
interface SkillDefinition {
  name: string
  description: string
  whenToUse?: string
  source: 'project-dsh' | 'runtime' | 'user-dsh' | 'bundled'
  content: string              // Markdown body injected into prompt
  invocation: SkillInvocationPolicy
  resourceBase?: SkillResourceBase
  metadata?: Record<string, unknown>
}
```

Skills are discovered via providers, ranked, and injected into the model's context when relevant. Plugins can register skill providers. Layering: global → per-scope (agent-specific).

### 11.2 jiuwenswarm — SkillNet + Self-Evolution

Skills are managed via `skillnet-ai` (an external skill hub). The system supports:
- `skill_index_build` / `skill_branch_explore` — discovery and navigation
- **Self-evolution**: skills can be automatically improved based on usage patterns (`EVOLUTION_AUTO_SCAN`)
- Skills can be invoked directly as tools

The "dreaming" mechanism prunes stale memory/skills and reinforces effective ones, making the agent improve over time.

### Comparison

| | deepseek-harness | jiuwenswarm |
|---|---|---|
| Skill format | Markdown + YAML frontmatter | SkillNet (external hub) |
| Skill discovery | Provider-based (layered) | `skillnet-ai` API |
| Self-improvement | No | Yes (auto-evolution, dreaming) |
| Skill injection | Prompt context injection | Tool invocation |
| User-defined skills | Yes (user-dsh source) | Yes |

---

## 12. Observability & Testing

### 12.1 deepseek-harness

- **Full OpenTelemetry** trace per run
- Every LLM chunk, every tool call, every state transition is durably logged
- **Snapshot testing**: record a real session, replay it in CI without API key
- **100% unit test coverage gate** on all packages
- **Vitest** with `tsx` for TypeScript
- E2E tests skipped automatically without `DEEPSEEK_API_KEY`
- Test types: unit, e2e, snapshot (replay)

### 12.2 jiuwenswarm

- `opentelemetry-api/sdk` in dependencies but integration depth unclear
- JSONL history files per session (not structured traces)
- **pytest** with `--asyncio-mode=auto`
- ~80+ test files covering: error handling, channel integrations, cost calculation, MCP lifecycle
- No snapshot/replay testing
- No coverage gate mentioned

### Comparison

| | deepseek-harness | jiuwenswarm |
|---|---|---|
| Full OTel tracing | Yes | Partial (dep present) |
| Structured span-level logs | Yes | No (JSONL history only) |
| Session replay | Yes (snapshot tests) | No |
| Coverage gate | 100% (unit packages) | None mentioned |
| Test framework | Vitest | pytest |
| E2E without API key | Snapshot replay | Manual integration test |

---

## 13. Deployment & Channels

### 13.1 deepseek-harness

- **CLI** (`dsh web` / `dsh headless`) — web UI or batch mode
- **Python SDK** — JSON-RPC over stdio to bundled Node runtime; `pip install deepseek-harness`
- **ACP server** — Agent Client Protocol for automation integrations
- **Headless + plugins** — embedded deployment

Single-machine. No built-in multi-process or distributed deployment.

### 13.2 jiuwenswarm

Channels (10+):
- Web (WebSocket), TUI, Desktop (PyWebView)
- Feishu, DingTalk (streaming), WeChat Work, Telegram, Discord, Slack, WhatsApp

Deployment:
- **Single machine** (default)
- **Multi-process** (ZMQ + PostgreSQL, optional `distribute` extra)
- **Distributed** (A2A protocol, remote agents)

### Comparison

| | deepseek-harness | jiuwenswarm |
|---|---|---|
| Web UI | Yes (built-in) | Yes (WebSocket) |
| CLI/TUI | Yes | Yes |
| Desktop app | No | Yes (PyWebView) |
| IM channels (Feishu/Slack/etc.) | No | Yes (10+ channels) |
| Python SDK | Yes | No (is the Python service) |
| Distributed deployment | No | Yes (A2A + ZMQ) |
| Multi-process | No | Yes (optional) |

---

## 14. Dependencies & Ecosystem

### 14.1 deepseek-harness

```
Runtime: Node.js ^22.19.0 || >=24.0.0
Package manager: pnpm 11.7.0
TypeScript: ^6.0.3
Test: Vitest ^4.1.8
Build: tsdown ^0.22.2
Lint: oxlint 1.76.0

Key internal packages (all @deepseek-ai/*):
  dsh-cordis, dsh-llm, dsh-session, dsh-scope,
  dsh-tools, dsh-agent, dsh-agent-loop, dsh-subprocess,
  dsh-sandbox, dsh-sandbox-local, dsh-skill

External:
  @agentclientprotocol/sdk (ACP)
  @deepseek-ai/node-addon-landlock-run (Linux sandbox)
```

Monorepo with strict package boundaries. ESM-only.

### 14.2 jiuwenswarm

```
Runtime: Python 3.11+
Key dependencies:
  openjiuwen (git+gitcode.com/openJiuwen/agent-core, develop branch)
  chromadb>=1.5.0       (vector store)
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

---

## 15. Head-to-Head Scorecard

Rated 1–5 per dimension, from the perspective of building the best possible runtime harness.

| Dimension | deepseek-harness | jiuwenswarm |
|---|:---:|:---:|
| **Architecture cleanliness** | 5 | 3 |
| **Auditability / replay** | 5 | 1 |
| **Parallel tool execution** | 5 | 1 |
| **Sandboxing depth** | 4 | 3 |
| **Tool surface breadth** | 3 | 5 |
| **Multi-agent coordination** | 3 | 5 |
| **Cross-session memory** | 1 | 5 |
| **Channel reach** | 1 | 5 |
| **Skill self-evolution** | 2 | 4 |
| **Observability (tracing)** | 5 | 2 |
| **Test quality / coverage** | 5 | 3 |
| **Config flexibility** | 4 | 3 |
| **Deployment options** | 2 | 5 |
| **Dependency hygiene** | 4 | 2 |
| **Model provider agnosticism** | 4 | 4 |
| **Streaming / low latency** | 5 | 3 |
| **TOTAL** | **58** | **54** |

---

## 16. What Each Does Better

### deepseek-harness does better:

1. **Architecture** — Cordis plugin seams make every component swappable without forking. jiuwenswarm is coupled to the openjiuwen SDK (git dev branch) in ways that can't be substituted.

2. **Auditability** — The "model-visible = logged" invariant is enforced architecturally. You can reconstruct exactly what the model saw in any past session. jiuwenswarm has no equivalent.

3. **Parallel tool execution** — `runGroup()` with `maxParallelToolCalls` and order-preserving result commit. jiuwenswarm executes tools sequentially.

4. **Streaming** — BlockAssembler processes chunks incrementally, enabling action before the full response is received. jiuwenswarm streams results to clients but acts after completion.

5. **Testing discipline** — 100% unit coverage gate, snapshot replay tests that run without an API key. jiuwenswarm has no coverage gate and no replay.

6. **Dependency hygiene** — Pure ESM, pinned pnpm, strict package boundaries. jiuwenswarm's core SDK is a git dev-branch dependency.

7. **Sandbox on native OS** — macOS sandbox-exec, Linux Landlock (fail-closed). jiuwenswarm requires a separate JiuwenBox server.

### jiuwenswarm does better:

1. **Tool breadth** — 40+ built-in tools including multimodal (audio, image, video), browser automation, multi-agent dispatch. deepseek-harness has 17.

2. **Multi-agent as product** — Research, Browser, and Coding sub-agents are production-ready specializations. deepseek-harness has the seam but no built-in specializations.

3. **Cross-session memory** — ChromaDB-backed semantic memory with proactive extraction and dreaming-based pruning. deepseek-harness has no cross-session memory.

4. **Channel reach** — 10+ channels (Feishu, DingTalk, Slack, Discord, Telegram, WeChat, WhatsApp, web, TUI, desktop). deepseek-harness is CLI + web only.

5. **Deployment** — Distributed multi-process with A2A protocol, ZMQ, PostgreSQL. deepseek-harness is single-machine.

6. **Skill evolution** — SkillNet + auto-evolution + dreaming makes the agent system improve over time. deepseek-harness skills are static markdown documents.

---

## 17. Key Gaps in Both (for "best harness" target)

| Gap | deepseek-harness status | jiuwenswarm status |
|---|---|---|
| Stream-native parallel tool execution | ✅ Done | ❌ Missing |
| Semantic context truncation | Compaction (turn-level) | LLM summarization (blunt) |
| Prompt injection in tool outputs | Not addressed | SecurityRail (partial) |
| Snapshot/restore mid-trajectory | Not built | Not built |
| Structured pre-execution safety policy | Waterfall (pluggable) | Rails (per-type) |
| Cross-agent shared memory | Not built | ChromaDB (per-agent) |
| Tool output size management | Per-tool render | Not explicit |
| Contamination-resistant eval | Out of scope | Out of scope |

---

## 18. Conclusion

**deepseek-harness** is the more rigorous engineering artifact. Its plugin architecture, durable session log, parallel tool scheduler, and streaming pipeline represent the state of the art for a runtime harness that needs to be auditable, composable, and correct under load. If you are building a harness to embed into products or to serve as a platform for other harnesses to build on, this is the better foundation.

**jiuwenswarm** is the more complete product. It ships a working agent platform with multi-channel deployment, multi-agent teams, cross-session memory, and skill evolution. If you need an agent system running in production today that handles real users across Feishu, Slack, and a web UI, jiuwenswarm gets there faster.

For building the **best runtime harness**, the synthesis is:
- Take deepseek-harness's **architectural model** (plugin seams, durable event log, parallel tool scheduler, streaming parser, OS-native sandbox)
- Take jiuwenswarm's **feature surface** (tool breadth, multi-agent specializations, cross-session memory, channel connectors)
- Add what both are missing: stream-native parallel action, semantic truncation, mid-trajectory snapshot/restore, structured pre-execution policy engine
