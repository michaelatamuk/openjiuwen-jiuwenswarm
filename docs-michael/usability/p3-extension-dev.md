[← Index](README.md) · jiuwenswarm Usability Review

---

# P3 — Extension Developer

*The engineer extending jiuwenswarm from inside: writing custom rails, registering
tools, working within the Python SDK.*

This audience is distinct from the operator (who installs and runs jiuwenswarm) and
from the end-user (who chats with the agent). The extension developer writes Python
code that participates in the agent lifecycle — adding new rails, registering tools,
composing custom agents, and integrating jiuwenswarm into their own product. This
section evaluates how well jiuwenswarm supports that experience.

> Also relevant: **P10 (AI / Prompt Engineer)** works with the prompt section API
> (17.9) and the examples directory (17.6). P10 coverage will expand in a future
> dedicated section.

---

## §17 · Developer Usability

### 17.1 Rail Extension API Is Undocumented at the Public Surface

**Current state.**
The rail system is the primary extension point for developers. The base class hierarchy is:

```
AgentRail  (openjiuwen/core/single_agent/rail/base.py)
  └── DeepAgentRail  (openjiuwen/harness/rails/base.py)
```

`AgentRail` exposes 10 hook methods. `DeepAgentRail` adds 2 more task-loop hooks. A developer
must read both source files to know what hooks exist and what `ctx: AgentCallbackContext`
contains. There is no public reference page, no generated API docs, no README in
`openjiuwen/harness/rails/` explaining what a rail is. The only written description lives in
Chinese-language docs in `agent-core/docs/zh/`.

**What good looks like.**
A `RAILS.md` file at the root of `agent-core` (or a `docs/en/rails.md`) explaining:
- What a rail is and when to write one.
- The full hook lifecycle, in order of execution, with a timing diagram showing when each
  hook fires relative to the model call and tool call.
- A minimal working example that developers can paste and run.
- Common patterns: adding a prompt section, registering a tool, reading the callback context.

The `DeepAgentRail` docstring should list all 12 hooks, not just the 2 it adds. Right now a
developer reading only `DeepAgentRail` does not know the 10 `AgentRail` hooks exist.

---

### 17.2 Hook Execution Order Is Not Discoverable

**Current state.**
Twelve hooks exist across two base classes. A developer writing a rail that interacts with
model input and tool output needs to know: does `before_model_call` fire before or after the
prompt is assembled? Does `after_tool_call` receive the result before or after it is appended
to conversation history?

None of this is documented. The answers require reading the agent execution loop in
`openjiuwen/core/single_agent/agent.py` — which is not a short file.

There is also a `priority` integer on each rail. Higher priority runs first during `init()` and
callback dispatch. But whether `priority=85` runs before or after `priority=50` is not stated
anywhere except "higher runs first" — inferred from reading the test:

```python
# tests/unit_tests/core/single_agent/rail/test_rail.py
class HighPriorityRail(AgentRail):
    priority = 100
class LowPriorityRail(AgentRail):
    priority = 1
```

**What good looks like.**
A lifecycle diagram (ASCII is fine) showing the agent execution loop with arrows at each hook
point. Approximate:

```
agent.invoke(query)
  │
  ├── before_invoke
  │
  ├── on_user_message
  │
  └─[task loop]──────────────────────────────────────────────────────────
      │
      ├── before_task_iteration
      │
      ├── before_steering_drain
      │
      ├── before_model_call          ← prompt is final here
      │
      │   [LLM call]
      │
      ├── after_model_call           ← raw LLM response here
      │
      ├─[for each tool call]──────────────────────────────────────────────
      │   ├── before_tool_call       ← args are final here
      │   │   [tool execution]
      │   └── after_tool_call        ← result is here, not yet in history
      │
      └── after_task_iteration
      │
  ├── after_invoke
  └── [end]
```

This takes under an hour to write and saves every new developer from reading the agent loop.

---

### 17.3 `AgentCallbackContext` Has No Type Stubs or Usage Examples

**Current state.**
Every hook receives `ctx: AgentCallbackContext`. This object carries the current agent state:
conversation history, tool call results, the current model response, session ID, and more.
A developer writing a hook must discover what is accessible on `ctx` by reading the dataclass
definition — there are no examples showing `ctx.messages`, `ctx.tool_result`, or
`ctx.response` in the context of a hook.

Additionally, `ctx` mutability is implicit: some fields are read-only (reading them does not
affect the agent), others are writable (modifying them does affect the next step). This
distinction is never stated.

**What good looks like.**
A "Context reference" section in the developer docs listing every attribute of
`AgentCallbackContext`, its type, whether it is mutable, and which hooks it is populated in.
Example snippet:

| Attribute | Type | Mutable | Available from |
|---|---|---|---|
| `ctx.session_id` | `str` | No | `before_invoke` |
| `ctx.messages` | `list[Message]` | Yes | `before_model_call` |
| `ctx.response` | `ModelResponse` | No | `after_model_call` |
| `ctx.tool_call` | `ToolCall` | No | `before_tool_call` |
| `ctx.tool_result` | `ToolResult` | Yes | `after_tool_call` |

Until this table exists, every developer who writes a `before_model_call` hook has to guess
whether `ctx.messages` reflects the assembled prompt or the raw conversation history.

---

### 17.4 Tool Registration API Has No Developer Guide

**Current state.**
Tools are registered in a rail's `init()` method via `agent.ability_manager.add(tool_card)`.
This requires the developer to know:

1. That `ability_manager` exists on the agent object.
2. That it has an `add()` method accepting `ToolCard`.
3. That cleanup requires `agent.ability_manager.remove(tool_id)` in `uninit()`.
4. That `ToolCard.input_params` must be a JSON Schema dict (not a Pydantic model, not a
   function signature).

None of this appears in any public documentation. The only source of truth is the test file:

```python
# tests/unit_tests/core/single_agent/rail/test_rail.py
class ToolCarryingRail(AgentRail):
    def init(self, agent):
        tool_card = ToolCard(
            id="rail_tool",
            name="rail_tool",
            description="A rail tool",
            input_params={"type": "object", "properties": {}},
        )
        agent.ability_manager.add(tool_card)

    def uninit(self, agent):
        agent.ability_manager.remove("rail_tool")
```

A developer who does not know to look in the test directory will not find this pattern.

**What good looks like.**
A "Adding a tool from a rail" guide, showing the complete pattern: `ToolCard` definition with
a real JSON Schema, registration in `init()`, deregistration in `uninit()`, and how to handle
the tool's execution (where does the tool's Python function connect to the `ToolCard`?).

The relationship between `ToolCard` (metadata) and `LocalFunction` (implementation) is the
most confusing part for new developers — one provides the schema the LLM sees, the other
provides the Python that runs. This needs a diagram or a working end-to-end example.

---

### 17.5 `create_deep_agent()` Has Too Many Parameters With No Defaults Explained

**Current state.**
The primary factory function for creating an agent programmatically is `create_deep_agent()`.
It accepts 15+ parameters including `model`, `card`, `system_prompt`, `enable_task_loop`,
`max_iterations`, `rails`, `tools`, `mcps`, `skills`, `subagents`, `workspace`,
`sys_operation`, and more.

There is no documentation explaining:
- Which parameters are required vs optional.
- What the minimum viable invocation looks like.
- What `sys_operation` is and when a developer needs it.
- What `workspace` is and how it relates to `~/.jiuwenswarm/`.
- The difference between passing `tools` here vs registering tools in a rail.

A developer starting from the quickstart example in
`examples/context_evolver/quickstart_rail.py` gets a working snippet, but that example
hardcodes model credentials from env vars and omits half the parameters without explanation.

**What good looks like.**
A tiered guide: minimum invocation (5 lines), intermediate (add workspace and rails), advanced
(add subagents and sys_operation). Each tier shows the code and explains what each new
parameter enables. The docstring on `create_deep_agent()` should include all of this inline.

---

### 17.6 Examples Directory Is Not Discoverable and Inconsistently Structured

**Current state.**
Working examples live in `agent-core/examples/`. This directory contains:

```
examples/
  context_evolver/            # ContextEvolutionRail usage
  security_rail_demo/
    SensitiveDataSanitize/    # Custom rail: mask secrets
    ApiKeyGuardAlert/         # Custom rail: detect API keys
    ModelCallGuard/           # Custom rail: guard model calls
  # … more
```

Issues:
- `README.md` at the root of `examples/` does not exist — there is no index of what each
  example demonstrates.
- The security rail examples use `BaseSecurityRail` (a jiuwenswarm-specific subclass), not
  `DeepAgentRail` — confusing for a developer who just learned about `DeepAgentRail`.
- `context_evolver/quickstart_rail.py` imports `memory_service` from a module that requires
  a running database — not runnable without significant setup.
- No example demonstrates the simplest case: a rail that adds one line to the system prompt.

**What good looks like.**
An `examples/README.md` listing all examples with:
- What the example demonstrates.
- Prerequisites (what needs to be running, what env vars are needed).
- Expected output.

A `examples/00_hello_rail/` directory with the simplest possible working rail — one file, no
external dependencies, outputs "My rail ran" to the console. This is the "Hello World" that
every developer needs but currently does not exist.

---

### 17.7 Testing a Custom Rail Requires Knowing About Mock Infrastructure

**Current state.**
The testing infrastructure for rails is excellent — `MockLLMModel`, `create_text_response()`,
`create_tool_call_response()` — but it is entirely undocumented and lives in:

```
tests/unit_tests/fixtures/mock_llm.py
```

A developer who writes a custom rail and wants to test it has no path to discover this
infrastructure except reading the test source. There is no `testing/README.md`, no
"Testing your rail" section in any guide.

The pattern for writing a rail test is:

```python
class TestMyRail(unittest.IsolatedAsyncioTestCase):
    async def test_my_rail(self):
        agent, _ = _make_agent()          # Where is _make_agent() defined?
        await agent.register_rail(MyRail())
        mock_llm = MockLLMModel()         # Not importable without knowing the path
        mock_llm.set_responses([create_text_response("done")])
        with patch.object(agent, "_get_llm", return_value=mock_llm):
            result = await agent.invoke({"query": "test"})
        assert result["result_type"] == "answer"
```

`_make_agent()` is a private helper in the test file itself. `MockLLMModel` requires a direct
import from an internal path. Neither is part of a public test helper package.

**What good looks like.**
A `openjiuwen.testing` module that exports:
```python
from openjiuwen.testing import make_test_agent, MockLLMModel, text_response, tool_call_response
```

And a "Testing your rail" guide that shows the above pattern using these public imports. A
developer should be able to write a test for their custom rail in under 20 lines without reading
the internal test infrastructure.

---

### 17.8 No Stable Public API / No Semver Contract

**Current state.**
`agent-core` is at version `0.1.17`. `jiuwenswarm` (`workswarm`) is at `0.2.5.beta1`. The
`0.x` prefix signals pre-stable, which in practice means: any import path can change between
releases without a deprecation warning, and any internal class a developer subclasses may be
moved or renamed.

In practice, `jiuwenswarm` imports `agent-core` from a git SHA:
```toml
openjiuwen @ git+https://gitcode.com/openJiuwen/agent-core.git@...
```

A developer building on top of this system has no version guarantee. If they pin to a SHA,
they get no bug fixes. If they don't pin, any update may break their rail.

**What good looks like.**
- A documented `PUBLIC_API.md` listing which classes, functions, and modules are stable
  public API and which are implementation details subject to change.
- A `CHANGELOG.md` with a dedicated "Breaking changes for rail developers" section.
- Semantic versioning with proper minor/patch discipline once the API is declared stable.
- `@public` / `@internal` markers in docstrings for the transitional period.

---

### 17.9 Prompt Section API for Rails Is Hidden

**Current state.**
Rails inject content into the LLM system prompt by calling `add_section()` or
`add_from_prompt_section()` on a system prompt builder. This is one of the most common things
a developer would want a custom rail to do — "add my custom instructions to the prompt" — but
the API for doing it is not documented anywhere outside the source code.

The pattern requires knowing:
1. That `self.system_prompt_builder` can be obtained from `agent` in `init()`.
2. That sections have a `PromptPriority` or raw integer priority.
3. That `add_section(SectionName, text)` is the right method.
4. That the priority number determines insertion order in the system prompt.

This is the core developer extension use case and it has zero written documentation.

**What good looks like.**
A "Adding prompt content from a rail" guide:

```python
class MyContextRail(DeepAgentRail):
    def init(self, agent):
        self.prompt_builder = getattr(agent, "system_prompt_builder", None)

    async def before_model_call(self, ctx):
        if self.prompt_builder is None:
            return
        self.prompt_builder.add_section(
            name="MY_CUSTOM_CONTEXT",    # unique section name
            content="Always respond in bullet points.",
            priority=75,                 # inserts between priority 70 and 85 sections
        )
```

And a reference table of reserved priority ranges so developers know which slots are safe to
use for custom content without colliding with built-in sections.

---

### 17.10 No CLI Tool to Scaffold a New Rail or Skill

**Current state.**
Creating a new rail requires: creating a Python file, writing the class boilerplate, choosing
a priority, writing a registration call, and figuring out how to wire it in. There is no
`openjiuwen new-rail MyRailName` command. There is no cookiecutter template. There is no
`examples/template_rail/` directory to copy from.

The `openjiuwen` CLI command exists (`pyproject.toml` registers `openjiuwen = "openjiuwen.harness.cli.cli:cli"`),
but its subcommands are not documented externally.

**What good looks like.**
```
$ openjiuwen new rail --name my-context-rail --priority 75
Created: rails/my_context_rail.py
Created: tests/test_my_context_rail.py

rails/my_context_rail.py contains a minimal DeepAgentRail subclass.
tests/test_my_context_rail.py contains a working test using openjiuwen.testing.
```

A scaffolding command eliminates the cold-start friction for every new developer. The
generated files serve as a living example of the correct patterns.

---

### 17.11 Error Framework Is Not Exposed as a Developer API

**Current state.**
The error framework (`openjiuwen/core/common/exception/errors.py`) is well-designed:

```python
class BaseError(Exception):
    status: StatusCode
    recoverable: bool
    fatal: bool

    def to_dict(self) -> Dict[str, Any]: ...
    def to_json(self) -> str: ...
```

Helper functions exist: `build_error()`, `raise_error()`, `system_error()`, `validate_error()`.

A developer writing a custom rail that encounters an error has two options: raise a plain
Python exception (loses the structured error metadata) or use the framework (requires
discovering it). The framework is not mentioned in any developer-facing documentation.

If a rail raises a plain `RuntimeError`, the harness catches it but the structured error
context (`recoverable`, `fatal`, `code`) is lost, affecting how the agent decides to retry
or surface the error to the user.

**What good looks like.**
Document the error framework as part of the rail developer guide:

```python
from openjiuwen.core.common.exception import raise_error, StatusCode

async def before_tool_call(self, ctx):
    if self._is_blocked(ctx.tool_call.name):
        raise_error(
            StatusCode.PERMISSION_DENIED,
            f"Tool '{ctx.tool_call.name}' is blocked by MyRail",
            recoverable=False,
        )
```

Show that `recoverable=True` causes the agent to retry; `recoverable=False` aborts the task.
This is the correct API for rail authors to signal intent — but nobody knows it exists.

---

### 17.12 No Integration Test Layer Between Unit Tests and Full System

**Current state.**
The test suite has unit tests (mocked LLM, isolated rails) and manual end-to-end tests (full
system running). There is nothing in between: a test that runs a real rail against a real
(but small and controlled) agent without standing up the full jiuwenswarm stack.

A developer who writes a rail that interacts with the prompt builder, registers a tool, and
reads tool results needs to test all three interactions together — but the only way to do this
is the full unit test with `MockLLMModel`, which requires carefully sequencing mock responses
to exercise the rail in all three states. A single wrong mock response order causes the test
to pass for the wrong reason.

**What good looks like.**
An integration test helper:

```python
from openjiuwen.testing.integration import run_agent_with_rail

result = await run_agent_with_rail(
    rail=MyRail(),
    query="do the thing",
    llm_responses=["First I will call my_tool", tool_call("my_tool", {}), "Done."],
)
assert result.tool_calls[0].name == "my_tool"
assert "Done" in result.final_answer
```

This higher-level helper hides the mock sequencing complexity and lets the developer focus on
testing their rail's behavior, not the test framework mechanics.

---

### Summary: Developer Usability at a Glance

The rail and tool extension system is architecturally sound — the hook model, priority system,
and tool registration are clean and well-implemented. The gap is entirely in the developer
surface: documentation, discoverability, and tooling. A developer who reads the source code
can figure it out. A developer who relies on documentation cannot start.

**The five developer-facing changes with the highest impact:**

1. **Write `RAILS.md`** — lifecycle diagram, hook reference, `AgentCallbackContext` attribute
   table, full working example. Single document, one day to write, unlocks every developer.

2. **Create `openjiuwen.testing` as a public module** — `make_test_agent()`,
   `MockLLMModel`, `text_response()`, `tool_call_response()` exported from a stable path.
   Developers should not have to read internal test infrastructure to write their first test.

3. **Add `openjiuwen new rail` scaffold command** — generates a rail file and a test file
   from templates. Eliminates cold-start friction.

4. **Document prompt section insertion API** — the most common developer use case (add
   custom instructions to the system prompt) has zero documentation. One guide page fixes this.

5. **Publish a `PUBLIC_API.md`** — list which classes are stable API. Developers cannot
   build with confidence on a codebase where any class can move or be renamed without notice.

---
