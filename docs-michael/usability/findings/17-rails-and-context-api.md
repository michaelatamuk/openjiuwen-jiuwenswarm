[← Index](../README.md) · jiuwenswarm Usability Review

---

# §17 · Rails & Context API

*Writing rails, understanding hook execution order, and using the callback context.*

---

## 17.1 Rail Extension API Is Undocumented at the Public Surface

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

## 17.2 Hook Execution Order Is Not Discoverable

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

## 17.3 `AgentCallbackContext` Has No Type Stubs or Usage Examples

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

## 17.4 Prompt Section API for Rails Is Hidden

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

## 17.5 Error Framework Is Not Exposed as a Developer API

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
