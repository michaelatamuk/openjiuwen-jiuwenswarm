[← Index](../README.md) · jiuwenswarm Usability Review

---

# P3 — Extension Developer

*The engineer extending jiuwenswarm from inside: writing custom rails, registering
tools, working within the Python SDK.*

This audience is distinct from the operator (who installs and runs jiuwenswarm) and
from the end-user (who chats with the agent). The extension developer writes Python
code that participates in the agent lifecycle — adding new rails, registering tools,
composing custom agents, and integrating jiuwenswarm into their own product.

> Also relevant: **P10 (AI / Prompt Engineer)** works with the prompt section API
> (17.4) and the examples directory (20.1). P10 coverage will expand in a future
> dedicated section.

---

## Findings

> *The findings in this file are symptoms of a single systemic issue. [Read the root cause →](../findings/00-overview.md)*

*12 findings across 4 concern areas.*

### §17 · Rails & Context API

- **[17.1 Rail Extension API Is Undocumented at the Public Surface](../findings/17-rails-and-context-api.md#171-rail-extension-api-is-undocumented-at-the-public-surface)** — The primary extension point has no public reference page, no English README, and no lifecycle overview.
- **[17.2 Hook Execution Order Is Not Discoverable](../findings/17-rails-and-context-api.md#172-hook-execution-order-is-not-discoverable)** — A developer cannot know whether `before_model_call` fires before or after prompt assembly without reading the agent loop source.
- **[17.3 `AgentCallbackContext` Has No Type Stubs or Usage Examples](../findings/17-rails-and-context-api.md#173-agentcallbackcontext-has-no-type-stubs-or-usage-examples)** — The context object's attributes, types, mutability, and hook availability are nowhere documented.
- **[17.4 Prompt Section API for Rails Is Hidden](../findings/17-rails-and-context-api.md#174-prompt-section-api-for-rails-is-hidden)** — Adding custom content to the system prompt — the most common extension use case — has zero documentation.
- **[17.5 Error Framework Is Not Exposed as a Developer API](../findings/17-rails-and-context-api.md#175-error-framework-is-not-exposed-as-a-developer-api)** — The structured error framework exists and is well-designed but is never mentioned in any developer documentation.

### §18 · Tools & Agent Factory

- **[18.1 Tool Registration API Has No Developer Guide](../findings/18-tools-and-agent-factory.md#181-tool-registration-api-has-no-developer-guide)** — The pattern for registering and cleaning up tools from a rail exists only in internal test files.
- **[18.2 `create_deep_agent()` Has Too Many Parameters With No Defaults Explained](../findings/18-tools-and-agent-factory.md#182-create_deep_agent-has-too-many-parameters-with-no-defaults-explained)** — 15+ parameters with no documentation of which are required, what each does, or what the minimum viable call looks like.

### §19 · Testing & Tooling

- **[19.1 Testing a Custom Rail Requires Knowing About Mock Infrastructure](../findings/19-testing-and-tooling.md#191-testing-a-custom-rail-requires-knowing-about-mock-infrastructure)** — The excellent mock test infrastructure is entirely undocumented and reachable only by reading internal test source.
- **[19.2 No CLI Tool to Scaffold a New Rail or Skill](../findings/19-testing-and-tooling.md#192-no-cli-tool-to-scaffold-a-new-rail-or-skill)** — No scaffold command, no template directory; every developer starts from a blank file.
- **[19.3 No Integration Test Layer Between Unit Tests and Full System](../findings/19-testing-and-tooling.md#193-no-integration-test-layer-between-unit-tests-and-full-system)** — There is no mid-level test helper for testing a rail that interacts with the prompt builder and tools together.

### §20 · Documentation & API Stability

- **[20.1 Examples Directory Is Not Discoverable and Inconsistently Structured](../findings/20-documentation-and-api-stability.md#201-examples-directory-is-not-discoverable-and-inconsistently-structured)** — No index, mixed base class usage, and no "hello world" rail that runs without external dependencies.
- **[20.2 No Stable Public API / No Semver Contract](../findings/20-documentation-and-api-stability.md#202-no-stable-public-api--no-semver-contract)** — Any import path can change without notice; developers cannot build with confidence on a 0.x codebase with no public API declaration.

---
