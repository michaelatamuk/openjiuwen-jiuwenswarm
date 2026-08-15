# JiuwenSwarm SDK — Usage Examples

Assumes the SDKs are installed and a JiuwenSwarm server is running locally on
`localhost:19000` (WebSocket) / `localhost:19001` (REST).

---

## Table of Contents

1. [Python SDK](#python-sdk)
   - [In-process vs remote mode](#0-in-process-vs-remote-mode)
   - [Quick start](#1-quick-start)
   - [Streaming responses](#2-streaming-responses)
   - [Session management](#3-session-management)
   - [Custom tools](#4-custom-tools)
   - [Workflow (DAG orchestration)](#5-workflow-dag-orchestration)
   - [Long-term memory](#6-long-term-memory)
   - [Knowledge base and RAG](#7-knowledge-base-and-rag)
   - [Multi-agent team](#8-multi-agent-team)
   - [SwarmFlow](#9-swarmflow)
   - [Evaluation](#10-evaluation)
   - [Observability (OpenTelemetry)](#11-observability-opentelemetry)
   - [Workspace (coding agent on a directory)](#12-workspace-coding-agent-on-a-directory)
   - [Checkpoint and restore](#13-checkpoint-and-restore)
   - [Multimodal inputs (vision and audio)](#14-multimodal-inputs-vision-and-audio)
   - [Multi-rollout](#15-multi-rollout)
   - [Task loop event hooks](#16-task-loop-event-hooks)
   - [A2A remote agents](#17-a2a-remote-agents)
   - [Sub-workflow composition](#18-sub-workflow-composition)
   - [Agent builder](#19-agent-builder)
   - [Prompt builder](#20-prompt-builder)
   - [Custom store and checkpointer backend](#21-custom-store-and-checkpointer-backend)
   - [Security rails and tool permission engine](#22-security-rails-and-tool-permission-engine)
   - [LSP integration](#23-lsp-integration)
   - [Human-in-the-loop (HITT)](#24-human-in-the-loop-hitt)
   - [Agentic retrieval](#25-agentic-retrieval)
   - [Graph knowledge base](#26-graph-knowledge-base)
   - [Context engine and compression](#27-context-engine-and-compression)
   - [Online RL and trajectory collection](#28-online-rl-and-trajectory-collection)
   - [MCP server exposure](#29-mcp-server-exposure)
2. [TypeScript / JavaScript SDK](#typescript--javascript-sdk)
   - [Connect and chat](#1-connect-and-chat)
   - [Session management](#2-session-management)
   - [Streaming with React](#3-streaming-with-react)
   - [Knowledge base query via REST](#4-knowledge-base-query-via-rest)
   - [Reconnect handling](#5-reconnect-handling)
   - [Intercepting tool calls](#6-intercepting-tool-calls)
3. [REST API (curl / any language)](#rest-api--curl--any-language)
   - [Health check](#1-health-check)
   - [Sessions](#2-sessions)
   - [Blocking chat](#3-blocking-chat)
   - [Streaming chat (SSE)](#4-streaming-chat-sse)
   - [List agents and tools](#5-list-agents-and-tools)
   - [Knowledge base query](#6-knowledge-base-query)
   - [Run evaluation batch](#7-run-evaluation-batch)
   - [Agent streaming (SSE)](#8-agent-streaming-sse)
   - [Checkpoint and restore](#9-checkpoint-and-restore)

---

## Python SDK

Install:
```bash
pip install openjiuwen-sdk
```

---

### 0. In-process vs remote mode

The Python SDK has two distinct entry points. All other examples in this
section use **in-process mode**.

**In-process** — the agent runtime (`openjiuwen.core`, `openjiuwen.harness`)
runs inside your Python process. You configure which LLM to call via
`ModelConfig`. No separate server process needed.

```python
from openjiuwen.sdk import Agent, ModelConfig

agent = await Agent.create(
    "my-agent",
    model=ModelConfig(provider="openai", model="gpt-4o"),
)
result = await agent.run("Hello!")
```

**Remote** — your code connects to a JiuwenSwarm server running elsewhere
(another process, another machine, a cloud endpoint) via the WebSocket gateway.
The server owns the runtime and LLM credentials. Configure the connection via
`RemoteConfig`. This is the same protocol the browser extension and mobile app
use, now available from Python.

```python
from openjiuwen.sdk import Agent, RemoteConfig

agent = await Agent.connect(
    "ws://localhost:19000/v1/ws",
    auth_token="your-token",
)
# or from environment variables (JIUWENSWARM_URL, JIUWENSWARM_TOKEN):
agent = await Agent.connect(RemoteConfig.from_env().server_url,
                            auth_token=RemoteConfig.from_env().auth_token)

result = await agent.run("Hello from a remote client!")
```

`Agent.connect()` supports the same `run()`, `stream()`, and `on()` API as
`Agent.create()`. It does **not** support `checkpoint()`, `workspace`,
in-process `event_handler`, or custom backend registration — those require
direct access to the runtime.

---

### 1. Quick start

```python
import asyncio
from openjiuwen.sdk import Agent, ModelConfig

async def main():
    model_cfg = ModelConfig.from_env()  # reads JIUWENSWARM_MODEL, OPENAI_API_KEY, etc.
    agent = await Agent.create("my-agent", model=model_cfg)

    result = await agent.run("What is the capital of France?")
    print(result.text)
    # → Paris is the capital of France.

asyncio.run(main())
```

Sync variant (no event loop management):
```python
from openjiuwen.sdk import Agent, ModelConfig

agent = Agent.create_sync("my-agent", model=ModelConfig.from_env())
result = agent.run_sync("Summarize the Eiffel Tower in one sentence.")
print(result.text)
```

---

### 2. Streaming responses

```python
import asyncio
from openjiuwen.sdk import Agent, ModelConfig

async def main():
    agent = await Agent.create("streamer", model=ModelConfig.from_env())

    async for token in agent.stream("Write a haiku about the ocean."):
        print(token, end="", flush=True)
    print()

asyncio.run(main())
```

Event-based alternative:
```python
async def main():
    agent = await Agent.create("streamer", model=ModelConfig.from_env())

    agent.on("token", lambda text: print(text, end="", flush=True))
    agent.on("done", lambda: print("\n[done]"))
    agent.on("error", lambda msg: print(f"\n[error] {msg}"))

    await agent.stream("Explain asyncio in plain English.")
```

---

### 3. Session management

```python
import asyncio
from openjiuwen.sdk import Agent, Session, ModelConfig

async def main():
    model_cfg = ModelConfig.from_env()

    # Create a named session
    session = await Session.create(title="Research: Python async", mode="default")
    print(session.id)  # → "sess_abc123"

    # Use the session across multiple agent calls
    agent = await Agent.create("researcher", model=model_cfg)
    await agent.run("What is an event loop?", session_id=session.id)
    await agent.run("Give me a code example.", session_id=session.id)

    # Read back the conversation
    messages = await session.history()
    for msg in messages:
        print(f"[{msg.role}] {msg.text[:80]}")

    # List all sessions
    all_sessions = await Session.list()
    print(f"{len(all_sessions)} sessions total")

    # Delete when done
    await session.delete()

asyncio.run(main())
```

---

### 4. Custom tools

```python
import asyncio
import httpx
from openjiuwen.sdk import Agent, ModelConfig, tool

@tool(name="fetch_url", description="Fetch the text content of a URL.")
async def fetch_url(url: str) -> str:
    async with httpx.AsyncClient() as client:
        r = await client.get(url, timeout=10)
        r.raise_for_status()
        return r.text[:4000]  # trim for context window

@tool(name="word_count", description="Count the number of words in a text.")
async def word_count(text: str) -> int:
    return len(text.split())

async def main():
    agent = await Agent.create(
        "web-reader",
        tools=[fetch_url, word_count],
        model=ModelConfig.from_env(),
    )
    result = await agent.run("Fetch https://example.com and count the words.")
    print(result.text)

asyncio.run(main())
```

---

### 5. Workflow (DAG orchestration)

Workflows compose LLM calls, tool calls, branches, and loops declaratively.

```python
import asyncio
from openjiuwen.sdk import Workflow, ModelConfig
from openjiuwen.sdk.workflow import (
    Start, End,
    LLMComponent, ToolComponent,
    BranchComponent, Condition,
)

async def main():
    # Define components
    start = Start()
    classify = LLMComponent(
        name="classify",
        prompt="Classify this text as 'technical' or 'general': {{input}}",
        output_var="category",
    )
    technical_answer = LLMComponent(
        name="technical_answer",
        prompt="Give a detailed technical explanation of: {{input}}",
    )
    simple_answer = LLMComponent(
        name="simple_answer",
        prompt="Explain in simple terms: {{input}}",
    )
    branch = BranchComponent(
        name="route",
        conditions=[
            Condition(expression="category == 'technical'", target="technical_answer"),
        ],
        default_target="simple_answer",
    )
    end = End()

    # Wire the DAG
    workflow = Workflow(
        name="adaptive-qa",
        components=[start, classify, branch, technical_answer, simple_answer, end],
        edges=[
            (start, classify),
            (classify, branch),
            (branch, technical_answer),
            (branch, simple_answer),
            (technical_answer, end),
            (simple_answer, end),
        ],
        model=ModelConfig.from_env(),
    )

    session = await workflow.create_session()
    result = await workflow.run(session, input="What is a garbage collector?")
    print(result.text)

asyncio.run(main())
```

Loop example (summarise a list of URLs one by one):
```python
from openjiuwen.sdk.workflow import LoopComponent

loop = LoopComponent(
    name="summarise_urls",
    iterate_over="urls",        # variable containing a list
    item_var="url",
    body=[
        LLMComponent(
            name="summarise",
            prompt="Summarise the content at {{url}} in one sentence.",
        )
    ],
    collect_output_as="summaries",
)
```

---

### 6. Long-term memory

Memory persists across sessions and is scoped to user or global contexts.

```python
import asyncio
from openjiuwen.sdk import Agent, ModelConfig
from openjiuwen.sdk.memory import MemoryScope

async def main():
    agent = await Agent.create(
        "memory-agent",
        model=ModelConfig.from_env(),
        memory_scope=MemoryScope.USER,   # persists per user_id
        user_id="user_42",
    )

    # Store a fact explicitly
    await agent.memory.add("The user prefers responses in bullet points.")

    # Retrieve relevant memories before a prompt
    memories = await agent.memory.search("user preferences")
    for m in memories:
        print(f"  [{m.score:.2f}] {m.text}")

    # Agent automatically injects relevant memories into context
    result = await agent.run("Explain the Python GIL.")
    print(result.text)  # Response will be in bullet points

asyncio.run(main())
```

---

### 7. Knowledge base and RAG

```python
import asyncio
from openjiuwen.sdk.knowledge import KnowledgeBase, Retriever, Document

async def main():
    # Build a knowledge base from documents
    kb = await KnowledgeBase.create(
        name="company-docs",
        embedding_model="text-embedding-3-small",
        vector_store="chroma",          # or "milvus"
    )

    # Index documents
    await kb.add_documents([
        Document(text="Our refund policy allows returns within 30 days."),
        Document(text="Customer support is available Monday–Friday, 9–5 PST."),
        Document(
            text="Pro plan includes unlimited API calls and priority support.",
            metadata={"source": "pricing.md"},
        ),
    ])

    # Retrieve relevant chunks for a query
    retriever = Retriever(kb, strategy="hybrid", top_k=3)
    results = await retriever.retrieve("What are the support hours?")
    for r in results:
        print(f"[{r.score:.2f}] {r.text}")

    # Use the KB as context in an agent
    from openjiuwen.sdk import Agent, ModelConfig
    agent = await Agent.create(
        "support-bot",
        knowledge_bases=[kb],
        model=ModelConfig.from_env(),
    )
    result = await agent.run("Can I return a product I bought last week?")
    print(result.text)

asyncio.run(main())
```

---

### 8. Multi-agent team

```python
import asyncio
from openjiuwen.sdk import Team, Agent, ModelConfig

async def main():
    model_cfg = ModelConfig.from_env()

    # Create specialist agents
    researcher = await Agent.create("researcher", model=model_cfg)
    writer = await Agent.create("writer", model=model_cfg)
    reviewer = await Agent.create("reviewer", model=model_cfg)

    # Assemble into a team
    team = await Team.create(
        agents=[researcher, writer, reviewer],
        model=model_cfg,
    )

    # Leader spawns work across the team
    result = await team.spawn(
        "Research the latest advances in quantum computing and write "
        "a 500-word summary suitable for a general audience."
    )
    print(result.final_output)

    # Check what each member did
    status = await team.status()
    for member in status.members:
        print(f"  {member.name}: {member.turns} turns, {member.tool_calls} tool calls")

asyncio.run(main())
```

---

### 9. SwarmFlow

SwarmFlow composes agent work using `parallel`, `pipeline`, and `phase`
primitives for structured multi-step orchestration.

```python
import asyncio
from openjiuwen.sdk.swarmflow import run_swarmflow, agent, parallel, pipeline, phase

# Define a SwarmFlow script as a Python module (can also be inline)
META = {
    "name": "research-and-publish",
    "description": "Research a topic, write an article, then proofread it.",
}

async def run(args: dict) -> str:
    topic = args["topic"]

    # Phase 1: parallel research across three angles
    research_results = await parallel(
        agent("researcher", f"Research economic impacts of {topic}"),
        agent("researcher", f"Research environmental impacts of {topic}"),
        agent("researcher", f"Research social impacts of {topic}"),
    )

    # Phase 2: combine into a draft (sequential)
    draft = await pipeline(
        agent("writer", f"Write a 600-word article on {topic} using: {research_results}"),
        agent("editor", "Improve flow and clarity of the draft."),
    )

    # Phase 3: final checks in parallel
    await parallel(
        agent("fact-checker", f"Verify all claims in: {draft}"),
        agent("proofreader", f"Fix grammar and spelling in: {draft}"),
    )

    return draft


async def main():
    result = await run_swarmflow(
        script=run,
        args={"topic": "large language models"},
        meta=META,
    )
    print(result.final_output)
    # Inspect execution timeline
    for phase_record in result.phases:
        print(f"  Phase {phase_record.index}: {len(phase_record.activities)} activities")

asyncio.run(main())
```

---

### 10. Evaluation

```python
import asyncio
from openjiuwen.sdk.eval import (
    MetricEvaluator,
    ExactMatchMetric,
    LLMAsJudgeMetric,
    EvalCase,
)

async def main():
    # Define test cases
    cases = [
        EvalCase(input="What is 2 + 2?",       expected="4"),
        EvalCase(input="Capital of Japan?",     expected="Tokyo"),
        EvalCase(input="Who wrote Hamlet?",     expected="Shakespeare"),
    ]

    # Run the agent and collect predictions
    from openjiuwen.sdk import Agent, ModelConfig
    agent = await Agent.create("eval-target", model=ModelConfig.from_env())
    for case in cases:
        result = await agent.run(case.input)
        case.prediction = result.text

    # Score with multiple metrics
    evaluator = MetricEvaluator(
        metrics=[
            ExactMatchMetric(),
            LLMAsJudgeMetric(criteria="Is the answer factually correct?"),
        ]
    )
    scored = await evaluator.batch_evaluate(cases)

    for case in scored:
        print(f"Q: {case.input}")
        print(f"  exact_match={case.scores['exact_match']:.0f}  "
              f"llm_judge={case.scores['llm_judge']:.2f}")

asyncio.run(main())
```

Custom metric:
```python
from openjiuwen.sdk.eval import Metric, EvalCase

class LengthMetric(Metric):
    """Scores 1.0 if the prediction is under 50 words, else 0.0."""
    name = "brevity"

    async def score(self, case: EvalCase) -> float:
        return 1.0 if len(case.prediction.split()) <= 50 else 0.0
```

---

### 11. Observability (OpenTelemetry)

```python
from openjiuwen.sdk.tracing import init_otel_tracer, OtelTracerConfig
from openjiuwen.sdk import Agent, ModelConfig

# Call once at application startup
init_otel_tracer(OtelTracerConfig(
    endpoint="http://localhost:4317",   # OTLP gRPC collector
    service_name="my-agent-service",
    sample_rate=1.0,
    redact_llm_content=False,           # set True in production
))

# All subsequent agent/workflow calls emit spans automatically
async def main():
    agent = await Agent.create("traced-agent", model=ModelConfig.from_env())
    result = await agent.run("Explain tracing in one sentence.")
    print(result.text)
    # Spans appear in your OTel backend (Jaeger, Tempo, Datadog, …)
```

---

### 12. Workspace (coding agent on a directory)

`Workspace` gives an agent a bounded view of a local directory. The agent can
read files, make edits, run shell commands, and write diffs — all scoped to the
workspace root.

```python
import asyncio
from openjiuwen.sdk import Agent, ModelConfig
from openjiuwen.sdk.workspace import Workspace

async def main():
    # Point the workspace at an existing project
    workspace = Workspace(root="/path/to/my-project")

    agent = await Agent.create(
        "code-agent",
        workspace=workspace,
        model=ModelConfig.from_env(),
    )

    # Agent reads, edits, and runs code inside the workspace
    result = await agent.run(
        "Find all TODO comments in the Python files and create a TASKS.md "
        "that lists each one with its file and line number."
    )
    print(result.text)

    # Inspect what the agent changed
    diff = await workspace.diff()
    print(diff)

    # Workspace tracks created/modified files
    for path in workspace.modified_files:
        print(f"  modified: {path}")

asyncio.run(main())
```

Sandbox mode — agent runs in an isolated container:
```python
workspace = Workspace(
    root="/path/to/my-project",
    sandbox=True,           # run shell commands in a container
    sandbox_image="python:3.11-slim",
)
```

---

### 13. Checkpoint and restore

Checkpoints save the full agent state (session history, memory, tool registry,
workspace snapshot) to a persistent store. Restore picks up exactly where
execution stopped.

```python
import asyncio
from openjiuwen.sdk import Agent, ModelConfig

async def main():
    agent = await Agent.create("long-task", model=ModelConfig.from_env())

    # Start a multi-step task
    await agent.run("Step 1: outline a 10-chapter book on distributed systems.")

    # Save state — returns an opaque checkpoint ID
    checkpoint_id = await agent.checkpoint()
    print(f"Checkpoint saved: {checkpoint_id}")

    # --- some time later, or in a different process ---

    restored = await Agent.restore(checkpoint_id, model=ModelConfig.from_env())
    result = await restored.run("Step 2: write a 200-word summary of chapter 1.")
    print(result.text)

asyncio.run(main())
```

Automatic checkpointing every N turns:
```python
agent = await Agent.create(
    "auto-checkpoint",
    model=ModelConfig.from_env(),
    checkpoint_every=5,          # save after every 5 task-loop turns
    checkpoint_store="sqlite",   # or "postgres", "s3"
)
```

---

### 14. Multimodal inputs (vision and audio)

```python
import asyncio
from openjiuwen.sdk import Agent, ModelConfig
from openjiuwen.sdk.multimodal import ImageInput, AudioInput, VisionModelConfig, AudioModelConfig

async def main():
    agent = await Agent.create(
        "vision-agent",
        model=ModelConfig.from_env(),
        vision_config=VisionModelConfig(model="gpt-4o"),
    )

    # Describe an image from a local file
    result = await agent.run(
        "What is shown in this image? List every object you can identify.",
        images=[ImageInput.from_file("/path/to/diagram.png")],
    )
    print(result.text)

    # Image from URL
    result = await agent.run(
        "Compare these two charts and summarise the key difference.",
        images=[
            ImageInput.from_url("https://example.com/chart_a.png"),
            ImageInput.from_url("https://example.com/chart_b.png"),
        ],
    )
    print(result.text)

asyncio.run(main())
```

Audio transcription and reasoning:
```python
async def main():
    agent = await Agent.create(
        "audio-agent",
        model=ModelConfig.from_env(),
        audio_config=AudioModelConfig(model="whisper-1"),
    )

    result = await agent.run(
        "Transcribe this recording and extract any action items mentioned.",
        audio=[AudioInput.from_file("/path/to/meeting.mp3")],
    )
    print(result.text)
```

---

### 15. Multi-rollout

Run the same prompt multiple times and compare outputs — useful for measuring
response variance, selecting the best answer, or generating a diverse set of
candidates for fine-tuning.

```python
import asyncio
from openjiuwen.sdk import Agent, ModelConfig
from openjiuwen.sdk.rollout import MultiRolloutConfig, MultiRolloutExecutor

async def main():
    agent = await Agent.create("rollout-agent", model=ModelConfig.from_env())

    rollout_cfg = MultiRolloutConfig(
        n=5,                        # run 5 times
        temperature=0.9,            # high temperature for diversity
        concurrency=3,              # up to 3 runs in parallel
    )

    executor = MultiRolloutExecutor(agent, rollout_cfg)
    results = await executor.run("Write a one-sentence tagline for a cloud storage product.")

    for i, r in enumerate(results):
        print(f"[{i+1}] {r.text}")

    # Pick the highest-scored result (requires an evaluator)
    from openjiuwen.sdk.eval import LLMAsJudgeMetric, EvalCase
    metric = LLMAsJudgeMetric(criteria="Most creative and memorable tagline")
    best = await executor.best_of(results, metric=metric)
    print(f"\nBest: {best.text}")

asyncio.run(main())
```

---

### 16. Task loop event hooks

`TaskLoopEventHandler` lets you observe or intercept every step of the agent's
internal task loop: before and after each LLM call, each tool call, each turn,
and on completion or error.

```python
import asyncio
from openjiuwen.sdk import Agent, ModelConfig
from openjiuwen.sdk.hooks import TaskLoopEventHandler

class AuditLogger(TaskLoopEventHandler):
    """Logs every tool call to stdout for auditing."""

    async def on_turn_start(self, turn: int) -> None:
        print(f"[turn {turn}] starting")

    async def on_tool_call(self, name: str, args: dict) -> None:
        print(f"[tool] {name}({args})")

    async def on_tool_result(self, name: str, result: str) -> None:
        print(f"[tool] {name} → {result[:120]}")

    async def on_llm_call(self, messages: list) -> None:
        print(f"[llm] {len(messages)} messages in context")

    async def on_done(self, result) -> None:
        print(f"[done] {len(result.text)} chars output")

    async def on_error(self, error: Exception) -> None:
        print(f"[error] {type(error).__name__}: {error}")

async def main():
    agent = await Agent.create(
        "hooked-agent",
        model=ModelConfig.from_env(),
        event_handler=AuditLogger(),
    )
    await agent.run("List the files in the current directory and count them.")

asyncio.run(main())
```

Blocking a tool call (return early with a custom response):
```python
class ToolGuard(TaskLoopEventHandler):
    async def on_tool_call(self, name: str, args: dict) -> str | None:
        if name == "shell" and "rm" in args.get("command", ""):
            return "Error: destructive shell commands are not allowed."
        return None   # None means: proceed normally
```

---

### 17. A2A remote agents

A2A (Agent-to-Agent) lets you call an agent running on a remote host as if it
were a local agent. The remote agent exposes itself over JSON-RPC; your code
calls it through the same `Agent` façade.

**Server side — expose an agent:**
```python
import asyncio
from openjiuwen.sdk import Agent, ModelConfig
from openjiuwen.sdk.a2a import A2AServer

async def main():
    agent = await Agent.create("specialist", model=ModelConfig.from_env())

    server = A2AServer(
        agent=agent,
        interface_url="http://10.0.1.5:9000",
        host="0.0.0.0",
        port=9000,
    )
    print("A2A server listening on :9000")
    await server.serve_forever()

asyncio.run(main())
```

**Client side — call the remote agent:**
```python
import asyncio
import os
from openjiuwen.sdk.a2a import RemoteAgent

async def main():
    # Connect to the remote agent by URL — A2A uses JSON-RPC, not the WS gateway.
    # Pass an auth token if the remote A2A server requires it.
    remote = await RemoteAgent.connect(
        "http://10.0.1.5:9000",
        auth_token=os.environ.get("JIUWENSWARM_TOKEN"),
    )

    # Use exactly like a local agent
    result = await remote.run("Analyse the dataset and return a summary.")
    print(result.text)

    # Streaming works too
    async for token in remote.stream("Write a report on the findings."):
        print(token, end="", flush=True)

asyncio.run(main())
```

Compose local and remote agents into a team:
```python
import os
from openjiuwen.sdk import Agent, Team, ModelConfig
from openjiuwen.sdk.a2a import RemoteAgent

async def main():
    model_cfg = ModelConfig.from_env()
    # local_writer runs in-process; remote_analyst runs on a remote A2A server
    local_writer = await Agent.create("writer", model=model_cfg)
    remote_analyst = await RemoteAgent.connect(
        "http://10.0.1.5:9000",
        auth_token=os.environ.get("JIUWENSWARM_TOKEN"),
    )

    team = await Team.create(agents=[local_writer, remote_analyst], model=model_cfg)
    result = await team.spawn("Analyse sales data and write an executive summary.")
    print(result.final_output)
```

---

### 18. Sub-workflow composition

`SubWorkflowComponent` embeds one `Workflow` inside another, enabling reuse of
common pipelines.

```python
import asyncio
from openjiuwen.sdk import Workflow, ModelConfig
from openjiuwen.sdk.workflow import (
    Start, End, LLMComponent, SubWorkflowComponent,
)

async def main():
    model_cfg = ModelConfig.from_env()

    # --- Reusable inner workflow: translate + proofread ---
    translate = LLMComponent(
        name="translate",
        prompt="Translate the following to French: {{text}}",
        output_var="translated",
    )
    proofread = LLMComponent(
        name="proofread",
        prompt="Fix any grammar errors in: {{translated}}",
        output_var="proofread_text",
    )
    translation_pipeline = Workflow(
        name="translate-and-proofread",
        components=[Start(), translate, proofread, End()],
        edges=[(Start(), translate), (translate, proofread), (proofread, End())],
        model=model_cfg,
    )

    # --- Outer workflow that calls the inner one ---
    summarise = LLMComponent(
        name="summarise",
        prompt="Summarise this article in 3 sentences: {{input}}",
        output_var="text",
    )
    translate_sub = SubWorkflowComponent(
        name="translate_summary",
        workflow=translation_pipeline,
        input_mapping={"text": "text"},          # outer var → inner input
        output_mapping={"proofread_text": "final"},
    )
    outer = Workflow(
        name="summarise-and-translate",
        components=[Start(), summarise, translate_sub, End()],
        edges=[
            (Start(), summarise),
            (summarise, translate_sub),
            (translate_sub, End()),
        ],
        model=model_cfg,
    )

    session = await outer.create_session()
    result = await outer.run(session, input="[long English article text here]")
    print(result.text)   # French, proofread summary

asyncio.run(main())
```

---

### 19. Agent builder

`AgentBuilder` constructs agents programmatically from config objects rather
than calling `Agent.create()` with keyword arguments. Useful when building
agents dynamically from user configuration or a database.

```python
import asyncio
from openjiuwen.sdk.builder import AgentBuilder, LlmAgentBuilder

async def main():
    # Build a plain LLM agent
    agent = (
        LlmAgentBuilder()
        .name("support-bot")
        .system_prompt("You are a helpful customer support agent for Acme Corp.")
        .model("gpt-4o")
        .temperature(0.3)
        .max_turns(20)
        .tool("fetch_url")       # reference a registered tool by name
        .tool("word_count")
        .build()
    )
    await agent.init()
    result = await agent.run("How do I reset my password?")
    print(result.text)

asyncio.run(main())
```

Build a workflow agent (wraps a `Workflow` behind the `Agent` interface):
```python
from openjiuwen.sdk.builder import WorkflowBuilder
from openjiuwen.sdk.workflow import LLMComponent, Start, End

agent = (
    WorkflowBuilder()
    .name("qa-workflow-agent")
    .add_component(Start())
    .add_component(LLMComponent(name="answer", prompt="Answer: {{input}}"))
    .add_component(End())
    .add_edge(Start(), "answer")
    .add_edge("answer", End())
    .build()
)
```

---

### 20. Prompt builder

`PromptBuilder` helps iterate on system prompts using feedback and bad-case
examples. It generates candidate templates, scores them, and refines based on
observed failures.

```python
import asyncio
from openjiuwen.sdk.prompt import MetaTemplateBuilder, FeedbackPromptBuilder

async def main():
    # Start from a rough intent
    builder = MetaTemplateBuilder(
        intent="Answer customer support questions concisely and politely.",
        examples=[
            {"input": "Where is my order?",  "ideal": "I can look that up — please share your order ID."},
            {"input": "I want a refund.",     "ideal": "I'm sorry to hear that. Refunds take 3–5 business days."},
        ],
    )
    template_v1 = await builder.build()
    print("Generated prompt:\n", template_v1)

asyncio.run(main())
```

Refine using bad cases (prompts the model answered poorly):
```python
from openjiuwen.sdk.prompt import FeedbackPromptBuilder

async def main():
    bad_cases = [
        {
            "input": "My package arrived broken.",
            "bad_response": "That sucks.",
            "reason": "Too informal; no action offered.",
        },
    ]

    builder = FeedbackPromptBuilder(
        current_prompt="You are a helpful support agent.",
        bad_cases=bad_cases,
    )
    improved_prompt = await builder.refine()
    print("Improved prompt:\n", improved_prompt)
```

---

### 21. Custom store and checkpointer backend

Replace the default in-memory or SQLite backends with your own database or
object store.

**Custom session store (PostgreSQL example):**
```python
from openjiuwen.sdk.extensions import register_store
from openjiuwen.sdk.extensions.store import BaseSessionStore, SessionRecord

class PostgresSessionStore(BaseSessionStore):
    def __init__(self, dsn: str) -> None:
        self._dsn = dsn

    async def save(self, record: SessionRecord) -> None:
        # INSERT or UPDATE into your sessions table
        ...

    async def load(self, session_id: str) -> SessionRecord | None:
        # SELECT from your sessions table
        ...

    async def list(self) -> list[SessionRecord]:
        ...

    async def delete(self, session_id: str) -> None:
        ...

# Register before creating any agents
register_store("postgres", PostgresSessionStore(dsn="postgresql://localhost/mydb"))
```

**Custom checkpointer (S3 example):**
```python
from openjiuwen.sdk.extensions import register_checkpointer
from openjiuwen.sdk.extensions.checkpointer import BaseCheckpointer
import json, boto3

class S3Checkpointer(BaseCheckpointer):
    def __init__(self, bucket: str) -> None:
        self._s3 = boto3.client("s3")
        self._bucket = bucket

    async def save(self, checkpoint_id: str, state: dict) -> None:
        self._s3.put_object(
            Bucket=self._bucket,
            Key=f"checkpoints/{checkpoint_id}.json",
            Body=json.dumps(state),
        )

    async def load(self, checkpoint_id: str) -> dict:
        obj = self._s3.get_object(
            Bucket=self._bucket,
            Key=f"checkpoints/{checkpoint_id}.json",
        )
        return json.loads(obj["Body"].read())

register_checkpointer("s3", S3Checkpointer(bucket="my-agent-checkpoints"))

# Use it when creating an agent
agent = await Agent.create(
    "persistent-agent",
    model=ModelConfig.from_env(),
    checkpoint_store="s3",
)
```

---

### 22. Security rails and tool permission engine

JiuwenSwarm's `PermissionEngine` enforces fine-grained, configurable tool
permissions at the harness level. Every tool call is evaluated before
execution. Developers can define allow/deny policies per tool category,
attach approval callbacks, and integrate with custom audit systems.

```python
import asyncio
from openjiuwen.sdk import Agent, ModelConfig
from openjiuwen.harness.security import (
    PermissionEngine,
    PermissionsSection,
    PermissionLevel,
)

# Define a permission policy: allow read-only tools, require approval for writes,
# block destructive file operations entirely.
policy = PermissionsSection(
    default_level=PermissionLevel.ALLOW,
    tool_overrides={
        "shell":          PermissionLevel.ASK,       # prompt before any shell command
        "file_write":     PermissionLevel.ASK,
        "file_delete":    PermissionLevel.DENY,      # never allowed
        "process_kill":   PermissionLevel.DENY,
    },
    trusted_directories=["/workspace/project"],      # restrict file ops to this tree
)

engine = PermissionEngine(config=policy)

async def main():
    agent = await Agent.create(
        "guarded-agent",
        model=ModelConfig.from_env(),
        permission_engine=engine,
    )

    # The agent can read freely, must ask before writing, and cannot delete files.
    result = await agent.run("Refactor src/utils.py to use pathlib.")
    print(result.text)

asyncio.run(main())
```

Attach a custom approval callback (human-in-the-loop for permission prompts):

```python
from openjiuwen.harness.security import ToolPermissionHost, PermissionConfirmationRequest

class CLIApprovalHost(ToolPermissionHost):
    async def request_confirmation(
        self, req: PermissionConfirmationRequest
    ) -> bool:
        answer = input(f"\n[SECURITY] Allow tool '{req.tool_name}'? (y/n): ")
        return answer.strip().lower() == "y"

engine = PermissionEngine(config=policy, host=CLIApprovalHost())
```

Update the policy at runtime (e.g., after the user grants elevated access):

```python
engine.update_config(PermissionsSection(default_level=PermissionLevel.ALLOW))
engine.update_trusted_dirs(["/workspace/project", "/workspace/data"])
```

---

### 23. LSP integration

JiuwenSwarm agents can interact with a live Language Server Protocol (LSP)
server to get real-time diagnostics, type information, and code actions.
This gives the coding agent the same signals a human developer sees in an IDE.

```python
import asyncio
from openjiuwen.harness import lsp
from openjiuwen.harness.lsp import InitializeOptions

async def main():
    # Start the LSP server (e.g., pyright for Python)
    await lsp.initialize_lsp(
        options=InitializeOptions(
            server_command=["pyright-langserver", "--stdio"],
            root_uri="file:///workspace/project",
            language_id="python",
        )
    )

    # Check LSP readiness
    status = lsp.get_lsp_status()
    print(f"LSP ready: {status.ready}, server: {status.server_name}")

    # Expose the LSP tool to an agent — the agent can request diagnostics and
    # hover information autonomously during its task loop.
    lsp_tool = lsp.get_lsp_tool()

    from openjiuwen.sdk import Agent, ModelConfig
    agent = await Agent.create(
        "lsp-agent",
        model=ModelConfig.from_env(),
        tools=[lsp_tool],         # agent can call 'lsp_diagnostics', 'lsp_hover', etc.
    )

    result = await agent.run(
        "Fix all type errors in src/handlers.py. Use the LSP to verify each fix."
    )
    print(result.text)

    # Inspect accumulated diagnostics from this session
    diagnostics = lsp.get_pending_lsp_diagnostics(max_per_file=10, max_total=50)
    for file_diags in diagnostics:
        print(f"\n{file_diags.uri} — {len(file_diags.items)} remaining issues:")
        for item in file_diags.items:
            print(f"  line {item.range.start.line}: [{item.severity}] {item.message}")

    await lsp.shutdown_lsp()

asyncio.run(main())
```

---

### 24. Human-in-the-loop (HITT)

JiuwenSwarm's HITT (Human-In-The-Team) feature adds a real user as a member
of a multi-agent team. The human agent receives messages from other agents and
can reply, approve, redirect, or provide additional context — turning the
agent team into a collaborative human-AI system.

```python
import asyncio
from openjiuwen.sdk import Agent, Team, ModelConfig
from openjiuwen.agent_teams.schema.team import TeamRole, TeamMemberSpec, TeamAgentSpec

async def main():
    model_cfg = ModelConfig.from_env()

    # Two AI agents
    researcher = await Agent.create("researcher", model=model_cfg)
    writer     = await Agent.create("writer",     model=model_cfg)

    # Specify the team structure including a human member
    spec = TeamAgentSpec(
        predefined_members=[
            TeamMemberSpec(
                member_name="researcher",
                role_type=TeamRole.TEAMMATE,
                agent=researcher,
            ),
            TeamMemberSpec(
                member_name="writer",
                role_type=TeamRole.TEAMMATE,
                agent=writer,
            ),
            TeamMemberSpec(
                member_name="alice",
                role_type=TeamRole.HUMAN_AGENT,  # human participant
                description="Domain expert who approves research plans.",
            ),
        ],
        enable_hitt=True,   # activate human-in-the-team protocol
    )

    team = await Team.create(spec=spec, model=model_cfg)

    # The team will pause and route messages to the human member at decision points.
    # The human interacts via the configured transport (WebSocket session, stdin, etc.)
    result = await team.spawn(
        "Research the impact of LLMs on legal discovery workflows and write a report."
    )
    print(result.final_output)

asyncio.run(main())
```

The human agent's approval is required before the team proceeds past
decision checkpoints. Messages to the human are delivered through the
active session WebSocket, so the human can participate from any JiuwenSwarm
client (browser extension, IDE plugin, mobile app).

---

### 25. Agentic retrieval

`AgenticRetriever` wraps any base retriever with an LLM-driven loop that
rewrites the query, expands retrieved context via graph traversal, and fuses
results over multiple rounds. It dramatically improves recall on complex or
ambiguous questions compared to a single embedding lookup.

```python
import asyncio
from openjiuwen.sdk import Agent, ModelConfig
from openjiuwen.core.retrieval import (
    AgenticRetriever,
    KnowledgeBase,
    KnowledgeBaseConfig,
    Document,
)

async def main():
    model_cfg = ModelConfig.from_env()

    # Build a standard knowledge base
    kb = KnowledgeBase(
        config=KnowledgeBaseConfig(
            name="research-papers",
            embedding_model="text-embedding-3-small",
            vector_store="chroma",
        )
    )
    await kb.add_documents([
        Document(text="Transformers were introduced in 'Attention Is All You Need' (2017)."),
        Document(text="RLHF was used to align GPT models to human preferences."),
        Document(text="Constitutional AI (CAI) is an Anthropic technique for self-critique."),
        Document(text="Sparse mixture-of-experts reduces FLOPs by activating only a few experts."),
    ])

    # Wrap the KB's built-in retriever with AgenticRetriever
    agentic = AgenticRetriever(
        retriever=kb.retriever,
        llm_client=model_cfg.build_llm_client(),   # used for query rewriting
        max_rounds=3,                               # up to 3 retrieval rounds
        top_k_per_round=5,
    )

    # The agentic retriever rewrites the query, retrieves, decides if it needs
    # more context, and iterates — all automatically.
    results = await agentic.retrieve(
        query="How do modern LLMs reduce inference costs while maintaining quality?"
    )
    for r in results:
        print(f"[score={r.score:.2f}] {r.text}")

    # Attach the agentic retriever directly to an agent
    agent = await Agent.create(
        "research-agent",
        model=model_cfg,
        knowledge_bases=[kb],
        retriever=agentic,          # overrides the default single-shot retriever
    )
    result = await agent.run("Explain the key techniques for efficient LLM inference.")
    print(result.text)

asyncio.run(main())
```

---

### 26. Graph knowledge base

`GraphKnowledgeBase` extends the standard `KnowledgeBase` with a knowledge
graph layer. Documents are chunked, embedded, and also parsed into
subject-predicate-object triples. Retrieval uses both vector similarity and
graph traversal, dramatically improving recall for relationship queries
("What connects A to B?", "What did X influence?").

```python
import asyncio
from openjiuwen.sdk import Agent, ModelConfig
from openjiuwen.core.retrieval import (
    GraphKnowledgeBase,
    KnowledgeBaseConfig,
    Document,
)

async def main():
    model_cfg = ModelConfig.from_env()

    gkb = GraphKnowledgeBase(
        config=KnowledgeBaseConfig(
            name="tech-history",
            embedding_model="text-embedding-3-small",
            vector_store="chroma",
        ),
        # Graph-specific components (defaults to built-in if not specified)
        llm_client=model_cfg.build_llm_client(),  # used for triple extraction
    )

    await gkb.add_documents([
        Document(text="Alan Turing invented the Turing machine, which influenced the Church-Turing thesis."),
        Document(text="The Church-Turing thesis underpins the theory of computability."),
        Document(text="Von Neumann architecture was inspired by Turing's stored-program concept."),
        Document(text="Modern CPUs implement Von Neumann architecture."),
    ])

    # Graph retrieval follows relationship chains, not just embedding similarity
    results = await gkb.retrieve(
        query="How does Turing's work connect to modern CPUs?",
        top_k=5,
        use_graph=True,   # enable graph traversal in addition to vector search
    )
    for r in results:
        print(f"[score={r.score:.2f}] {r.text}")

    # Attach to an agent
    agent = await Agent.create(
        "historian",
        model=model_cfg,
        knowledge_bases=[gkb],
    )
    result = await agent.run(
        "Trace the intellectual lineage from Turing to modern computing hardware."
    )
    print(result.text)

asyncio.run(main())
```

---

### 27. Context engine and compression

JiuwenSwarm's `ContextEngine` manages the agent's in-context message window
with pluggable compression processors. When context grows large, processors
can summarise older messages, offload tool results, or compact the dialogue —
keeping the agent within token limits without losing important information.

```python
import asyncio
from openjiuwen.sdk import Agent, ModelConfig
from openjiuwen.core.context_engine import (
    ContextEngine,
    ContextEngineConfig,
    FullCompactProcessor,
    MessageSummaryOffloader,
    ToolResultBudgetProcessor,
)

async def main():
    model_cfg = ModelConfig.from_env()

    # Configure a compression strategy: budget tool results, then summarise old messages
    engine = ContextEngine(
        config=ContextEngineConfig(
            max_messages=200,
            token_limit=16_000,
        ),
        processors=[
            # First, trim oversized tool results
            ToolResultBudgetProcessor(max_chars_per_result=2000),
            # Then, summarise message history when the window is 80% full
            MessageSummaryOffloader(
                trigger_ratio=0.8,
                summary_model=model_cfg.build_llm_client(),
            ),
            # Final fallback: full compact (aggressive summarisation)
            FullCompactProcessor(model=model_cfg.build_llm_client()),
        ],
    )

    agent = await Agent.create(
        "long-context-agent",
        model=model_cfg,
        context_engine=engine,
    )

    # The agent can now handle very long research tasks without hitting token limits
    result = await agent.run(
        "Read all files in /workspace and produce a comprehensive architecture document."
    )
    print(result.text)

    # Inspect how much context was used
    stats = engine.last_stats
    if stats:
        print(f"\nContext stats: {stats.input_tokens} tokens used, "
              f"{stats.compressions_applied} compressions applied")

asyncio.run(main())
```

Use `MicroCompactProcessor` for lighter, turn-by-turn compaction instead:

```python
from openjiuwen.core.context_engine import MicroCompactProcessor

engine = ContextEngine(
    config=ContextEngineConfig(token_limit=8_000),
    processors=[MicroCompactProcessor()],  # compact after every N turns
)
```

---

### 28. Online RL and trajectory collection

JiuwenSwarm's `OnlineRLOptimizer` enables in-deployment learning from agent
trajectories. The agent runs, produces trajectories (sequences of actions and
outcomes), and the optimizer updates model behaviour using reinforcement
learning — without stopping production traffic.

```python
import asyncio
from openjiuwen.sdk import Agent, ModelConfig
from openjiuwen.agent_evolving import OnlineRLOptimizer, RLConfig
from openjiuwen.agent_evolving.agent_rl import (
    RLTask,
    RolloutWithReward,
    RewardRegistry,
)

# Define a reward function — returns a float in [0, 1]
def code_quality_reward(rollout: RolloutWithReward) -> float:
    """Reward based on whether the agent's code passes tests."""
    if "all tests passed" in rollout.outcome.lower():
        return 1.0
    elif "test failed" in rollout.outcome.lower():
        return 0.1
    return 0.5

async def main():
    model_cfg = ModelConfig.from_env()

    # Register the reward function
    reward_registry = RewardRegistry()
    reward_registry.register("code_quality", code_quality_reward)

    rl_config = RLConfig(
        task_type="code_generation",
        reward_function="code_quality",
        learning_rate=1e-5,
        rollouts_per_step=4,          # collect 4 rollouts before each update
        online=True,                   # update in real-time as trajectories arrive
    )

    optimizer = OnlineRLOptimizer(
        config=rl_config,
        reward_registry=reward_registry,
    )

    # Create agent with RL optimizer attached — trajectories are collected automatically
    agent = await Agent.create(
        "rl-agent",
        model=model_cfg,
        rl_optimizer=optimizer,
    )

    # Run tasks; optimizer updates weights in the background
    tasks = [
        "Implement a binary search function in Python with tests.",
        "Write a function to flatten a nested list.",
        "Implement merge sort and verify it sorts correctly.",
    ]
    for task in tasks:
        result = await agent.run(task)
        print(f"[task] {task[:50]}...\n[result] {result.text[:200]}\n")

    # Inspect collected trajectories
    trajectories = optimizer.get_trajectories()
    print(f"\nCollected {len(trajectories)} trajectories this session.")
    for t in trajectories[:2]:
        print(f"  reward={t.reward:.2f} | turns={t.num_turns}")

asyncio.run(main())
```

Collect trajectories without online updates (for offline batch training):

```python
from openjiuwen.agent_evolving import OfflineRLOptimizer

offline = OfflineRLOptimizer(config=rl_config, reward_registry=reward_registry)
agent = await Agent.create("data-collection-agent", model=model_cfg, rl_optimizer=offline)

# Run tasks → trajectories accumulate
for task in tasks:
    await agent.run(task)

# Export for offline training
offline.export_trajectories("trajectories_batch_001.jsonl")
```

---

### 29. MCP server exposure

JiuwenSwarm can expose its agent runtime as a **Model Context Protocol (MCP)**
server over stdio. External MCP clients (other AI systems, orchestrators, or
IDE plugins) can then call JiuwenSwarm agents as MCP tools.

```python
# Run the JiuwenSwarm MCP server as a subprocess.
# It reads OPENJIUWEN_TEAM_JOIN from the environment to discover the agent team.
import subprocess, os

proc = subprocess.Popen(
    ["python", "-m", "openjiuwen.agent_teams.mcp"],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    env={**os.environ, "OPENJIUWEN_TEAM_JOIN": "team://my-team@localhost:9000"},
)
# proc.stdin / proc.stdout speak the MCP stdio protocol (JSON-RPC newline-delimited)
```

Or build the MCP server programmatically and embed it in your process:

```python
import asyncio
from openjiuwen.agent_teams.mcp import build_server

async def main():
    server = build_server()  # reads OPENJIUWEN_TEAM_JOIN from env
    # server is a low-level `mcp.server.lowlevel.Server` instance
    # Run it with the MCP stdio transport
    from mcp.server.stdio import stdio_server
    async with stdio_server() as (reader, writer):
        await server.run(reader, writer, server.create_initialization_options())

asyncio.run(main())
```

This makes JiuwenSwarm agents callable from any MCP-compatible client:

```json
// Example MCP tool call arriving on stdin
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "jiuwenswarm_run",
    "arguments": {
      "prompt": "Summarise the latest commits in this repository.",
      "session_id": "sess_abc123"
    }
  }
}
```

---

## TypeScript / JavaScript SDK

Install:
```bash
npm install @jiuwenswarm/sdk
# Node.js only (browser uses native WebSocket):
npm install ws
```

---

### 1. Connect and chat

```typescript
import { JiuwenSwarmClient } from "@jiuwenswarm/sdk";

const client = new JiuwenSwarmClient({
  url: "ws://localhost:19000/v1/ws",
  authToken: process.env.JIUWENSWARM_TOKEN,
  onToken: (text) => process.stdout.write(text),
  onDone: (sessionId) => console.log(`\n[done] session=${sessionId}`),
  onError: (msg) => console.error(`[error] ${msg}`),
});

await client.connect();

const session = await client.sessions.create("My first session");
client.sessions.setActive(session.id);

await client.send("Explain the event loop in JavaScript.");

// Disconnect when done
client.disconnect();
```

---

### 2. Session management

```typescript
import { JiuwenSwarmClient } from "@jiuwenswarm/sdk";

const client = new JiuwenSwarmClient({ url: "ws://localhost:19000/v1/ws" });
await client.connect();

// List existing sessions
const sessions = await client.sessions.list();
console.log(`${sessions.length} sessions found`);
sessions.forEach((s) => console.log(`  ${s.id}  ${s.title}`));

// Resume an existing session
const target = sessions.find((s) => s.title === "Research notes");
if (target) {
  client.sessions.setActive(target.id);
  await client.send("Continue where we left off.");
}

// Create a fresh session
const fresh = await client.sessions.create("New topic", "default");
client.sessions.setActive(fresh.id);
await client.send("Tell me about quantum entanglement.");
```

---

### 3. Streaming with React

```tsx
import { useEffect, useRef, useState } from "react";
import { JiuwenSwarmClient } from "@jiuwenswarm/sdk";

export function ChatWidget() {
  const clientRef = useRef<JiuwenSwarmClient | null>(null);
  const [output, setOutput] = useState("");
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const client = new JiuwenSwarmClient({
      url: "ws://localhost:19000/v1/ws",
      onToken: (text) => setOutput((prev) => prev + text),
      onDone: () => setConnected(true),
      onError: (msg) => console.error(msg),
    });

    client.on("connected", () => setConnected(true));
    client.on("disconnected", () => setConnected(false));

    client.connect().then(async () => {
      const session = await client.sessions.create("React chat");
      client.sessions.setActive(session.id);
    });

    clientRef.current = client;
    return () => client.disconnect();
  }, []);

  const handleSend = async (message: string) => {
    setOutput("");
    await clientRef.current?.send(message);
  };

  return (
    <div>
      <p>Status: {connected ? "connected" : "disconnected"}</p>
      <pre>{output}</pre>
      <button onClick={() => handleSend("Summarise the Python GIL.")}>
        Ask
      </button>
    </div>
  );
}
```

---

### 4. Knowledge base query via REST

The TypeScript SDK does not wrap the knowledge base directly — use the REST
API from TypeScript with `fetch`:

```typescript
async function queryKnowledgeBase(query: string): Promise<string[]> {
  const res = await fetch("http://localhost:19001/v1/knowledge/company-docs/query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.JIUWENSWARM_TOKEN}`,
    },
    body: JSON.stringify({ query, top_k: 3 }),
  });
  const data = await res.json();
  return data.results.map((r: { text: string }) => r.text);
}

// Then inject context into your chat message
const context = await queryKnowledgeBase("refund policy");
await client.send(`Using this context: ${context.join(" ")}. Answer: Can I return my order?`);
```

---

### 5. Reconnect handling

The client reconnects automatically after an unexpected disconnection using
exponential back-off (1 s → 2 s → 5 s → 10 s → 30 s, capped). You can
observe and override this behaviour.

```typescript
import { JiuwenSwarmClient } from "@jiuwenswarm/sdk";

const client = new JiuwenSwarmClient({
  url: "ws://localhost:19000/v1/ws",
  reconnect: {
    maxAttempts: 10,          // stop after 10 failed attempts (default: Infinity)
    initialDelayMs: 1000,
    maxDelayMs: 30_000,
    factor: 2,                // multiply delay by 2 each attempt
  },
  onToken: (text) => process.stdout.write(text),
});

// Observe reconnect lifecycle
client.on("disconnected", (reason) => {
  console.warn(`[ws] disconnected: ${reason}`);
});

client.on("reconnecting", (attempt, delayMs) => {
  console.log(`[ws] reconnecting in ${delayMs}ms (attempt ${attempt})`);
});

client.on("connected", () => {
  console.log("[ws] connected");
  // Re-activate the session after reconnect — sessions survive on the server
  client.sessions.refresh().then(() => {
    const active = client.sessions.active;
    if (active) client.sessions.setActive(active.id);
  });
});

await client.connect();
```

Disable automatic reconnect (manage it yourself):
```typescript
const client = new JiuwenSwarmClient({
  url: "ws://localhost:19000/v1/ws",
  reconnect: false,
});

client.on("disconnected", async () => {
  console.warn("Disconnected — attempting manual reconnect in 5 s");
  await new Promise((r) => setTimeout(r, 5000));
  await client.connect();
});
```

---

### 6. Intercepting tool calls

By default the client rejects any `tool_call` envelope from the server with
`{error: "not supported"}`. You can intercept and handle tool calls yourself.

```typescript
import { JiuwenSwarmClient, ToolCallEnvelope } from "@jiuwenswarm/sdk";

const client = new JiuwenSwarmClient({
  url: "ws://localhost:19000/v1/ws",

  // Return a string result or throw to send an error back to the server
  onToolCall: async (call: ToolCallEnvelope): Promise<string> => {
    if (call.name === "get_user_location") {
      // Obtain from the browser's Geolocation API
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject)
      );
      return JSON.stringify({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    }

    if (call.name === "read_clipboard") {
      return await navigator.clipboard.readText();
    }

    throw new Error(`Tool not implemented: ${call.name}`);
  },
});

await client.connect();
const session = await client.sessions.create("Tool demo");
client.sessions.setActive(session.id);
await client.send("What city am I in right now?");
```

---

## REST API — curl / any language

Base URL: `http://localhost:19001`

All requests that require auth include:
```
-H "Authorization: Bearer $JIUWENSWARM_TOKEN"
```

---

### 1. Health check

```bash
curl http://localhost:19001/v1/health
```
```json
{
  "status": "ok",
  "version": "0.1.0",
  "protocol_version": "1"
}
```

---

### 2. Sessions

```bash
# List sessions
curl http://localhost:19001/v1/sessions

# Create a session
curl -X POST http://localhost:19001/v1/sessions \
  -H "Content-Type: application/json" \
  -d '{"title": "API test", "mode": "default"}'

# Get a session (with message history)
curl http://localhost:19001/v1/sessions/sess_abc123

# Delete a session
curl -X DELETE http://localhost:19001/v1/sessions/sess_abc123
```

---

### 3. Blocking chat

Waits for the full agent response before returning:

```bash
curl -X POST http://localhost:19001/v1/sessions/sess_abc123/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is a REST API?"}'
```
```json
{
  "response": "A REST API (Representational State Transfer) is ...",
  "session_id": "sess_abc123"
}
```

---

### 4. Streaming chat (SSE)

```bash
curl -N -X POST http://localhost:19001/v1/sessions/sess_abc123/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "Write a short poem about the sea."}'
```
```
event: token
data: {"text": "The"}

event: token
data: {"text": " waves"}

event: token
data: {"text": " crash"}

...

event: done
data: {"session_id": "sess_abc123"}
```

Python example using `httpx`:
```python
import httpx

with httpx.Client() as client:
    with client.stream(
        "POST",
        "http://localhost:19001/v1/sessions/sess_abc123/chat/stream",
        json={"message": "Explain machine learning."},
    ) as r:
        for line in r.iter_lines():
            if line.startswith("data:"):
                import json
                data = json.loads(line[5:])
                if "text" in data:
                    print(data["text"], end="", flush=True)
```

---

### 5. List agents and tools

```bash
# List registered agents
curl http://localhost:19001/v1/agents
```
```json
{
  "agents": [
    {"id": "deep-agent", "name": "DeepAgent", "description": "General coding agent"},
    {"id": "support-bot", "name": "SupportBot", "description": "Customer support"}
  ]
}
```

```bash
# Run an agent (blocking)
curl -X POST http://localhost:19001/v1/agents/support-bot/run \
  -H "Content-Type: application/json" \
  -d '{"prompt": "How do I reset my password?"}'

# List registered tools
curl http://localhost:19001/v1/tools
```
```json
{
  "tools": [
    {"name": "fetch_url", "description": "Fetch the text content of a URL."},
    {"name": "word_count", "description": "Count the number of words in a text."}
  ]
}
```

---

### 6. Knowledge base query

```bash
# Create a knowledge base
curl -X POST http://localhost:19001/v1/knowledge \
  -H "Content-Type: application/json" \
  -d '{"name": "company-docs", "embedding_model": "text-embedding-3-small", "vector_store": "chroma"}'

# Add documents
curl -X POST http://localhost:19001/v1/knowledge/company-docs/documents \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {"text": "Refunds are accepted within 30 days of purchase."},
      {"text": "Support hours are Monday–Friday, 9am–5pm PST."}
    ]
  }'

# Query
curl -X POST http://localhost:19001/v1/knowledge/company-docs/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What are your support hours?", "top_k": 2}'
```
```json
{
  "results": [
    {"text": "Support hours are Monday–Friday, 9am–5pm PST.", "score": 0.94},
    {"text": "Refunds are accepted within 30 days of purchase.", "score": 0.41}
  ]
}
```

---

### 7. Run evaluation batch

```bash
curl -X POST http://localhost:19001/v1/eval/batch \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "deep-agent",
    "metrics": ["exact_match", "llm_judge"],
    "cases": [
      {"input": "What is 2 + 2?",    "expected": "4"},
      {"input": "Capital of Japan?", "expected": "Tokyo"}
    ]
  }'
```
```json
{
  "results": [
    {
      "input": "What is 2 + 2?",
      "prediction": "4",
      "scores": {"exact_match": 1.0, "llm_judge": 1.0}
    },
    {
      "input": "Capital of Japan?",
      "prediction": "The capital of Japan is Tokyo.",
      "scores": {"exact_match": 0.0, "llm_judge": 0.95}
    }
  ],
  "summary": {
    "exact_match": 0.5,
    "llm_judge": 0.975
  }
}
```

---

### 8. Agent streaming (SSE)

Like session chat streaming, but drives a named agent directly without needing
a pre-created session:

```bash
curl -N -X POST http://localhost:19001/v1/agents/support-bot/stream \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A customer says their order has not arrived after 14 days. Draft a reply."}'
```
```
event: token
data: {"text": "Dear Customer,"}

event: token
data: {"text": " Thank you for reaching out."}

...

event: done
data: {"agent_id": "support-bot", "session_id": "sess_xyz789"}
```

Go example using `net/http`:
```go
package main

import (
    "bufio"
    "fmt"
    "net/http"
    "strings"
)

func main() {
    body := strings.NewReader(`{"prompt":"Summarise the HTTP/2 spec in 3 bullet points."}`)
    req, _ := http.NewRequest("POST", "http://localhost:19001/v1/agents/deep-agent/stream", body)
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", "Bearer "+token)

    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()

    scanner := bufio.NewScanner(resp.Body)
    for scanner.Scan() {
        line := scanner.Text()
        if strings.HasPrefix(line, "data:") {
            fmt.Print(strings.TrimPrefix(line, "data: "))
        }
    }
}
```

---

### 9. Checkpoint and restore

```bash
# Save agent state — returns a checkpoint ID
curl -X POST http://localhost:19001/v1/agents/deep-agent/checkpoint \
  -H "Content-Type: application/json" \
  -d '{"session_id": "sess_abc123"}'
```
```json
{
  "checkpoint_id": "ckpt_20240801_abc123",
  "session_id": "sess_abc123",
  "created_at": "2024-08-01T14:32:00Z"
}
```

```bash
# List available checkpoints
curl http://localhost:19001/v1/checkpoints

# Restore from a checkpoint — creates a new session pre-loaded with the saved state
curl -X POST http://localhost:19001/v1/checkpoints/ckpt_20240801_abc123/restore
```
```json
{
  "session_id": "sess_restored_def456",
  "restored_from": "ckpt_20240801_abc123",
  "message_count": 12
}
```

```bash
# Continue the restored session normally
curl -X POST http://localhost:19001/v1/sessions/sess_restored_def456/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Continue from where we left off."}'
```
