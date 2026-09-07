[← Index](../../README.md) · jiuwenswarm Usability Review

---

# Extension Developer

*The engineer extending jiuwenswarm from inside: writing custom rails, registering
tools, working within the Python SDK.*

This audience is distinct from the Instance Admin (who installs and runs jiuwenswarm) and
from the end-user (who chats with the agent). The extension developer writes Python
code that participates in the agent lifecycle — adding new rails, registering tools,
composing custom agents, and integrating jiuwenswarm into their own product.

> Also relevant: **AI / Prompt Engineer** works with the prompt section API
> and the examples directory. Its coverage will expand in a future
> dedicated section.

---

## Findings

*12 findings.*

### Extension Documentation & Stability

- **[The examples directory is undiscoverable and inconsistent](../../findings/extension-surface/documentation-and-stability.md#1-the-examples-directory-is-undiscoverable-and-inconsistent)** — No index, mixed base class usage, and no "hello world" rail that runs without external dependencies.
- **[No stable public API or semantic-versioning contract](../../findings/extension-surface/documentation-and-stability.md#2-no-stable-public-api-or-semantic-versioning-contract)** — Any import path can change without notice; developers cannot build with confidence on a 0.x codebase with no public API declaration.

### Rails & Context API

- **[The rail extension API has no public documentation](../../findings/extension-surface/rails-and-context-api.md#1-the-rail-extension-api-has-no-public-documentation)** — The primary extension point has no public reference page, no English README, and no lifecycle overview.
- **[Rail hook execution order can only be learned from source](../../findings/extension-surface/rails-and-context-api.md#2-rail-hook-execution-order-can-only-be-learned-from-source)** — A developer cannot know whether `before_model_call` fires before or after prompt assembly without reading the agent loop source.
- **[The hook context object is undocumented and untyped](../../findings/extension-surface/rails-and-context-api.md#3-the-hook-context-object-is-undocumented-and-untyped)** — The context object's attributes, types, mutability, and hook availability are nowhere documented.
- **[Adding prompt content from a rail is an undocumented hidden API](../../findings/extension-surface/rails-and-context-api.md#4-adding-prompt-content-from-a-rail-is-an-undocumented-hidden-api)** — Adding custom content to the system prompt — the most common extension use case — has zero documentation.
- **[The structured error API isn't documented for rail authors](../../findings/extension-surface/rails-and-context-api.md#5-the-structured-error-api-isnt-documented-for-rail-authors)** — The structured error framework exists and is well-designed but is never mentioned in any developer documentation.

### Extension Testing & Tooling

- **[Writing a rail test requires reverse-engineering mock infrastructure](../../findings/extension-surface/testing-and-tooling.md#1-writing-a-rail-test-requires-reverse-engineering-mock-infrastructure)** — The excellent mock test infrastructure is entirely undocumented and reachable only by reading internal test source.
- **[No CLI to scaffold a new rail or skill](../../findings/extension-surface/testing-and-tooling.md#2-no-cli-to-scaffold-a-new-rail-or-skill)** — No scaffold command, no template directory; every developer starts from a blank file.
- **[No integration test layer between unit tests and a full system](../../findings/extension-surface/testing-and-tooling.md#3-no-integration-test-layer-between-unit-tests-and-a-full-system)** — There is no mid-level test helper for testing a rail that interacts with the prompt builder and tools together.

### Tools & Agent Factory

- **[Registering tools from a rail has no developer guide](../../findings/extension-surface/tools-and-agent-factory.md#1-registering-tools-from-a-rail-has-no-developer-guide)** — The pattern for registering and cleaning up tools from a rail exists only in internal test files.
- **[The agent factory has too many undocumented parameters](../../findings/extension-surface/tools-and-agent-factory.md#2-the-agent-factory-has-too-many-undocumented-parameters)** — 15+ parameters with no documentation of which are required, what each does, or what the minimum viable call looks like.

---
