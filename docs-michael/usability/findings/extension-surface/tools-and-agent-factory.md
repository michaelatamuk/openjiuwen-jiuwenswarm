[← Index](../../README.md) · jiuwenswarm Usability Review

---

# Tools & Agent Factory

*Registering tools and creating agents.*

---

## 1 Registering tools from a rail has no developer guide

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

## 2 The agent factory has too many undocumented parameters

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

