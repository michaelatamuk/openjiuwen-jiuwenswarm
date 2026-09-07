[← Index](../README.md) · jiuwenswarm Usability Review

---

# §20 · Documentation & API Stability

*Examples that teach, and an API contract developers can rely on.*

---

## 20.1 Examples Directory Is Not Discoverable and Inconsistently Structured

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

## 20.2 No Stable Public API / No Semver Contract

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
