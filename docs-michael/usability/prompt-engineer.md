[← Index](README.md) · jiuwenswarm Usability Review

---

# AI / Prompt Engineer

*Crafts and optimizes the system prompts, persona instructions, and skill descriptions that shape agent behavior — iterates on prompt text to improve output quality.*

This persona works at the boundary between the agent's configuration and its behavior. They are not necessarily a software developer — they may be a domain expert, a product designer, or a dedicated "prompt ops" role. Their primary tool is text: they write and refine the instructions that tell the agent who it is, how to respond, and what to prioritize.

In jiuwenswarm, prompt content comes from multiple sources: the `config.yaml` system prompt, installed skills (`SKILL.md` files), memory (`MEMORY.md`, `USER.md`), and custom rails that inject prompt sections at runtime. A prompt engineer needs to see all of these at once and understand how they combine.

**Key questions this persona needs answered:**
- What is the exact system prompt the agent received for this call, assembled from all sources?
- How do I test a prompt change without affecting the live agent?
- Can I compare the agent's output before and after a prompt change on the same input?
- Which section of the prompt is responsible for the behavior I'm seeing?
- How do I version and roll back prompt changes?

---

## Findings

*Not yet investigated. The findings below are expected based on the current codebase state — they will be confirmed and detailed when this persona is formally covered.*

### Expected finding areas

**No live prompt inspector** — The assembled system prompt is not visible in the Web UI. There is no way to see what the agent actually received for a given call without enabling debug trace (`debug_trace.agent.enabled: true`) and reading raw log files.

**No prompt sandbox** — There is no "test mode" that lets a prompt engineer submit a query and see the response without affecting the session history or memory.

**No A/B comparison** — There is no built-in way to compare the agent's response to the same query under two different prompt configurations side-by-side.

**No version history for prompt sources** — Changes to `SKILL.md`, the config system prompt, and `MEMORY.md` are not versioned. A prompt engineer who makes a change that degrades quality cannot roll back without manually tracking the previous text.

**Prompt section API is undocumented** — Rails can inject prompt sections at runtime (via `system_prompt_builder.add_section()`), but this mechanism is not documented. A prompt engineer working with a developer to inject dynamic context has no reference for how this works. (Related: finding 17.9 in [extension-developer.md](extension-developer.md).)

**Priority system is opaque** — Multiple prompt sections from different sources (config, skills, rails, memory) are assembled in priority order. The priority values and what they mean are not documented for non-developer prompt engineers.
