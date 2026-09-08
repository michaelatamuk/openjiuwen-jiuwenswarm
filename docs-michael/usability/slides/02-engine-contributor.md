# Slide 2 — Engine Contributor

> Self-contained spec for building this slide. You should not need any other file to produce it.

## The one line (put this big on the slide)

**Engine Contributor** — The under-the-hood builder: contributes code to the openjiuwen / jiuwenswarm codebase — extending the engine from the inside (rails, tools, the agent factory).

## Who this person is

The under-the-hood builder: contributes code to the openjiuwen / jiuwenswarm codebase — extending the engine from the inside (rails, tools, the agent factory).

## What concerns them (the slide body)

This persona's own concerns — show them as a set of cards/tiles, one per group:

**Extension Documentation & Stability** (2):

- [No stable public API or semantic-versioning contract
- [The examples directory is undiscoverable and inconsistent

**Rails & Context API** (5):

- [Adding prompt content from a rail is an undocumented hidden API
- [Rail hook execution order can only be learned from source
- [The hook context object is undocumented and untyped
- [The rail extension API has no public documentation
- [The structured error API isn't documented for rail authors

**Extension Testing & Tooling** (3):

- [No CLI to scaffold a new rail or skill
- [No integration test layer between unit tests and a full system
- [Writing a rail test requires reverse-engineering mock infrastructure

**Tools & Agent Factory** (2):

- [Registering tools from a rail has no developer guide
- [The agent factory has too many undocumented parameters

**Custom Channels** (1):

- [Writing a custom channel has no developer guide

## Speaker notes (short)

"Engine Contributor: The under-the-hood builder: contributes code to the openjiuwen / jiuwenswarm codebase — extending the engine from the inside (rails, tools, the agent factory). These are the 13 concerns specific to them; anything shared comes from the base persona above them."
