[← Index](../README.md) · jiuwenswarm Usability Review

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

## Findings

> *The findings in this file are symptoms of a single systemic issue. [Read the root cause →](../findings/00-overview.md)*

*12 findings across 1 concern area.*

### §17 · Developer Usability

- **[17.1 Rail Extension API Is Undocumented at the Public Surface](../findings/17-developer-usability.md#171-rail-extension-api-is-undocumented-at-the-public-surface)** — The primary extension point has no public reference page, no English README, and no lifecycle overview.
- **[17.2 Hook Execution Order Is Not Discoverable](../findings/17-developer-usability.md#172-hook-execution-order-is-not-discoverable)** — A developer cannot know whether `before_model_call` fires before or after prompt assembly without reading the agent loop source.
- **[17.3 `AgentCallbackContext` Has No Type Stubs or Usage Examples](../findings/17-developer-usability.md#173-agentcallbackcontext-has-no-type-stubs-or-usage-examples)** — The context object's attributes, types, mutability, and hook availability are nowhere documented.
- **[17.4 Tool Registration API Has No Developer Guide](../findings/17-developer-usability.md#174-tool-registration-api-has-no-developer-guide)** — The pattern for registering and cleaning up tools from a rail exists only in internal test files.
- **[17.5 `create_deep_agent()` Has Too Many Parameters With No Defaults Explained](../findings/17-developer-usability.md#175-create_deep_agent-has-too-many-parameters-with-no-defaults-explained)** — 15+ parameters with no documentation of which are required, what each does, or what the minimum viable call looks like.
- **[17.6 Examples Directory Is Not Discoverable and Inconsistently Structured](../findings/17-developer-usability.md#176-examples-directory-is-not-discoverable-and-inconsistently-structured)** — No index, mixed base class usage, and no "hello world" rail that runs without external dependencies.
- **[17.7 Testing a Custom Rail Requires Knowing About Mock Infrastructure](../findings/17-developer-usability.md#177-testing-a-custom-rail-requires-knowing-about-mock-infrastructure)** — The excellent mock test infrastructure is entirely undocumented and reachable only by reading internal test source.
- **[17.8 No Stable Public API / No Semver Contract](../findings/17-developer-usability.md#178-no-stable-public-api--no-semver-contract)** — Any import path can change without notice; developers cannot build with confidence on a 0.x codebase with no public API declaration.
- **[17.9 Prompt Section API for Rails Is Hidden](../findings/17-developer-usability.md#179-prompt-section-api-for-rails-is-hidden)** — Adding custom content to the system prompt — the most common extension use case — has zero documentation.
- **[17.10 No CLI Tool to Scaffold a New Rail or Skill](../findings/17-developer-usability.md#1710-no-cli-tool-to-scaffold-a-new-rail-or-skill)** — No scaffold command, no template directory; every developer starts from a blank file.
- **[17.11 Error Framework Is Not Exposed as a Developer API](../findings/17-developer-usability.md#1711-error-framework-is-not-exposed-as-a-developer-api)** — The structured error framework exists and is well-designed but is never mentioned in any developer documentation.
- **[17.12 No Integration Test Layer Between Unit Tests and Full System](../findings/17-developer-usability.md#1712-no-integration-test-layer-between-unit-tests-and-full-system)** — There is no mid-level test helper for testing a rail that interacts with the prompt builder and tools together.

## Summary

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
