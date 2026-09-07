[← Index](../../README.md) · jiuwenswarm Usability Review

---

# Extension Testing & Tooling

*Testing and scaffolding custom rails.*

---

## 1 Writing a rail test requires reverse-engineering mock infrastructure

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

## 2 No CLI to scaffold a new rail or skill

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

## 3 No integration test layer between unit tests and a full system

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

