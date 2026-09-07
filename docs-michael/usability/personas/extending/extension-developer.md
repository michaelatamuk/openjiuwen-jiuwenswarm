[← Index](../../README.md) · jiuwenswarm Usability Review

---

# Extension Developer

*The engineer who extends JiuwenSwarm from inside: rails, tools, and the Python SDK.*

## Findings that matter to them

*12 findings.*

### Extension Documentation & Stability

- **[The examples directory is undiscoverable and inconsistent](../../findings/extension-surface/documentation-and-stability.md#1-the-examples-directory-is-undiscoverable-and-inconsistent)**
- **[No stable public API or semantic-versioning contract](../../findings/extension-surface/documentation-and-stability.md#2-no-stable-public-api-or-semantic-versioning-contract)**

### Rails & Context API

- **[The rail extension API has no public documentation](../../findings/extension-surface/rails-and-context-api.md#1-the-rail-extension-api-has-no-public-documentation)**
- **[Rail hook execution order can only be learned from source](../../findings/extension-surface/rails-and-context-api.md#2-rail-hook-execution-order-can-only-be-learned-from-source)**
- **[The hook context object is undocumented and untyped](../../findings/extension-surface/rails-and-context-api.md#3-the-hook-context-object-is-undocumented-and-untyped)**
- **[Adding prompt content from a rail is an undocumented hidden API](../../findings/extension-surface/rails-and-context-api.md#4-adding-prompt-content-from-a-rail-is-an-undocumented-hidden-api)**
- **[The structured error API isn't documented for rail authors](../../findings/extension-surface/rails-and-context-api.md#5-the-structured-error-api-isnt-documented-for-rail-authors)**

### Extension Testing & Tooling

- **[Writing a rail test requires reverse-engineering mock infrastructure](../../findings/extension-surface/testing-and-tooling.md#1-writing-a-rail-test-requires-reverse-engineering-mock-infrastructure)**
- **[No CLI to scaffold a new rail or skill](../../findings/extension-surface/testing-and-tooling.md#2-no-cli-to-scaffold-a-new-rail-or-skill)**
- **[No integration test layer between unit tests and a full system](../../findings/extension-surface/testing-and-tooling.md#3-no-integration-test-layer-between-unit-tests-and-a-full-system)**

### Tools & Agent Factory

- **[Registering tools from a rail has no developer guide](../../findings/extension-surface/tools-and-agent-factory.md#1-registering-tools-from-a-rail-has-no-developer-guide)**
- **[The agent factory has too many undocumented parameters](../../findings/extension-surface/tools-and-agent-factory.md#2-the-agent-factory-has-too-many-undocumented-parameters)**
