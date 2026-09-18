# Prompting and output control

8 unique questions, deduplicated from the archived docs. Each `##` is one question; identical questions from other docs were merged. Full source files are in `orig/`.

## 1. How do you get consistent, parseable output like JSON from an LLM

**General:** Layer the guarantees: prefer a provider JSON/schema mode or tool/function calling with a JSON Schema so the model is constrained at generation time; validate against the schema; on failure, return the validation error to the model for a retry; only then parse. Fenced or free-text JSON should be a last resort with tolerant extraction and repair.

**Jiuwen:** The core harness has **no native `response_format`/JSON mode**; structured output is enforced by giving the model a single-use `structured_output` tool whose `ToolCard.input_params` is the caller's JSON Schema, so the provider's tool-use layer constrains arguments. On success the arguments are captured on the tool instance and a finish rail ends the round; on failure the error tool-result is returned for self-correction, and the workflow engine retries then validates the captured object with pydantic `model_validate` or `jsonschema.validate`. For text-based JSON (compression summaries), `JsonOutputParser` strips code fences and `json.loads` the payload, returning `None` on decode failure rather than raising.

```mermaid
flowchart TD
    REQ["want JSON output"] --> TOOL["attach structured_output tool: input_params = JSON Schema"]
    TOOL --> MODEL["model tool-call constrained by schema"]
    MODEL --> CAP["capture args + StructuredOutputFinishRail → end round"]
    MODEL -->|failure| ERR["error tool-result → self-correct"]
    ERR --> RETRY["workflow engine retries (default 2)"]
    RETRY --> VAL{"validate: pydantic model_validate / jsonschema.validate"}
    VAL -->|pass| OK(["structured object"])
    VAL -->|fail| ERR
    TXT["text-based JSON"] --> JP["JsonOutputParser: strip fences → json.loads (None on failure)"]
```

<sub>**Anchors:**<br>&bull; `agent-core/openjiuwen/agent_teams/tools/structured_output_tool.py:46` — `StructuredOutputTool`; `:82` `input_params = schema_json`; `:97` `StructuredOutputFinishRail.after_tool_call`<br>&bull; `agent-core/openjiuwen/agent_teams/workflow/backends/team_worker_backend.py:230` — attaches one `StructuredOutputTool` per schema; `:484` finish rail; `:498` reminder<br>&bull; `agent-core/openjiuwen/agent_teams/workflow/engine/schema.py:55` — `resolve_schema()`; `:74` `coerce()` (pydantic/jsonschema)<br>&bull; `agent-core/openjiuwen/agent_teams/workflow/engine/primitives.py:693` — retries; `:763` `coerce(res.structured, ...)`; `agent-core/openjiuwen/agent_teams/workflow/engine/runtime.py:62` `retries: int = 2`<br>&bull; `agent-core/openjiuwen/core/foundation/llm/output_parsers/json_output_parser.py:15` — fence/bare extraction + `json.loads`; `:92` `stream_parse()`<br>&bull; `agent-core/openjiuwen/core/context_engine/processor/compressor/round_level_compressor.py:713` — `JsonOutputParser()`; `:1266` validates `{"blocks":[...]}`</sub>

**Gap.** No `response_format`/`json_schema`/grammar-constrained decoding in `core/foundation/llm`. No automatic JSON repair — invalid output is dropped/retried, not fixed. `StructuredOutputTool` lives in `agent_teams`, not a general core primitive.

---

# Fine-tuning

<sub>_Canonical source: `orig/llm-fundamentals-interview-questions_for_engineers.md`; also covered in: llm-fund._</sub>

## 2. How do you structure a prompt to get consistent, parseable output like JSON

**General:** Layer the guarantees: prefer a provider JSON/schema mode or tool/function calling with a JSON Schema so the model is constrained at generation time; validate against the schema; on failure return the validation error to the model for a retry; only then parse. Fenced or free-text JSON should be a last resort with tolerant extraction and repair.

**Jiuwen:** The core harness has no native `response_format`/JSON mode; structured output is enforced by giving the model a single-use `structured_output` tool whose `ToolCard.input_params` is the caller's JSON Schema, so the provider's tool-use layer constrains arguments. On success the arguments are captured and a finish rail ends the round; on failure the error is returned for self-correction and the workflow engine retries then validates with pydantic/jsonschema. For text-based JSON, `JsonOutputParser` strips code fences and `json.loads`, returning `None` on failure.

```mermaid
flowchart TD
    REQ["want JSON output"] --> TOOL["attach structured_output tool: input_params = JSON Schema"]
    TOOL --> MODEL["model tool-call constrained by schema"]
    MODEL --> CAP["capture args + StructuredOutputFinishRail → end round"]
    MODEL -->|failure| ERR["error tool-result → self-correct"]
    ERR --> RETRY["workflow engine retries (default 2)"]
    RETRY --> VAL{"validate: pydantic / jsonschema"}
    VAL -->|pass| OK(["structured object"])
    VAL -->|fail| ERR
    TXT["text-based JSON"] --> JP["JsonOutputParser: strip fences → json.loads (None on failure)"]
```

<sub>**Anchors:**<br>&bull; `agent-core/openjiuwen/agent_teams/tools/structured_output_tool.py:46` — `StructuredOutputTool`; `:82` `input_params = schema_json`; `:97` `StructuredOutputFinishRail.after_tool_call`<br>&bull; `agent-core/openjiuwen/agent_teams/workflow/backends/team_worker_backend.py:230` — attaches one tool per schema; `:484` finish rail; `:498` reminder<br>&bull; `agent-core/openjiuwen/agent_teams/workflow/engine/schema.py:55` — `resolve_schema()`; `:74` `coerce()`<br>&bull; `agent-core/openjiuwen/agent_teams/workflow/engine/primitives.py:693` — retries; `:763` `coerce(res.structured, ...)`; `agent-core/openjiuwen/agent_teams/workflow/engine/runtime.py:62` `retries: int = 2`<br>&bull; `agent-core/openjiuwen/core/foundation/llm/output_parsers/json_output_parser.py:15/92` — extraction + `stream_parse()`</sub>

<sub>_Canonical source: `orig/genai-interview-questions_for_engineers.md`; also covered in: genai._</sub>

## 3. How do you validate structured output from a model before acting on it

**General:** Never trust the model's structuring. Validate against a schema (Pydantic/JSON Schema), coerce or reject, and only act on validated data. Prefer constraining the model with a schema at generation time, then validate the result anyway.

**Jiuwen:** The model's structured output is validated before it is acted on. When that output is a tool call, `LocalFunction.invoke` validates the arguments via `SchemaUtils.validate_with_schema` before the function runs; `StructuredOutputTool` constrains the model to emit schema-shaped arguments and only force-finishes on success, so failures reach the model. Workflow and agent-team schemas validate their JSON output before use.

```mermaid
flowchart TD
    I(["input"]) --> M
    subgraph LOOP["ReAct loop"]
    direction TB
        M["model call"] --> O["model output: structured content (JSON / tool-call arguments)"]
        O --> V{"matches the schema?"}
        V -->|valid| ACT["act on it (run tool / use the value)"] --> M
        V -->|invalid| R["reject → error to model"] --> M
    end
    O -->|"no structured output → plain answer"| A(["final answer"])
    ACT ~~~ A
```

<sub>**Anchors:**<br>&bull; `agent-core/openjiuwen/core/foundation/tool/function/function.py:65` — validate before invoking<br>&bull; `agent-core/openjiuwen/core/common/utils/schema_utils.py:115` — `validate_with_schema`<br>&bull; `agent-core/openjiuwen/agent_teams/tools/structured_output_tool.py:46` — schema-constrained structured output<br>&bull; `agent-core/openjiuwen/agent_teams/workflow/engine/schema.py:74` — workflow/team schema coercion</sub>

<sub>_Canonical source: `orig/ai-agent-interview-questions_for_engineers.md`; also covered in: ai-agent._</sub>

## 4. How does the framework validate a tool call's structured output before executing it

**General:** Parse the model's arguments against the tool's JSON Schema; repair obviously damaged JSON (unbalanced brackets) when possible; reject with a readable error so the model can retry. Never run a function on unvalidated arguments.

**Jiuwen:** Before executing, `AbilityManager._execute_single_tool_call` parses the model's raw argument string with `_parse_tool_arguments_with_repair`, which first tries `json.loads`, then `_repair_tool_arguments_json` to balance brackets/braces; unrecoverable JSON raises an `AbilityExecutionError` fed back to the model. The parsed dict is passed to `tool.invoke`, where `LocalFunction`/`MCPTool` call `SchemaUtils.format_with_schema`, which runs `validate_with_schema` (jsonschema, falling back to a dynamically created Pydantic model) and then fills defaults. The `structured_output` tool uses the caller's JSON Schema as its own `input_params`, so the same validation path constrains captured results.

```mermaid
flowchart TD
    RAW["model tool-call arguments (string)"] --> P{"json.loads ok?"}
    P -->|no| REP["_repair_tool_arguments_json (balance brackets)"]
    P -->|yes| D
    REP -->|"still broken"| ERR["AbilityExecutionError → back to model"]
    REP -->|fixed| D["parsed dict → tool.invoke"]
    D --> V["SchemaUtils.format_with_schema → validate_with_schema"]
    V -->|valid| RUN["function runs (defaults filled)"]
    V -->|invalid| ERR
```

<sub>**Anchors:**<br>&bull; `agent-core/openjiuwen/core/single_agent/ability_manager.py:482` — `_repair_tool_arguments_json()`; `:537` `_parse_tool_arguments_with_repair()`; `:1419` execution path rewrites `tool_call.arguments`<br>&bull; `agent-core/openjiuwen/core/foundation/tool/function/function.py:76` — `LocalFunction.invoke`; `:82` validation via `SchemaUtils.format_with_schema`<br>&bull; `agent-core/openjiuwen/core/common/utils/schema_utils.py:115` — `validate_with_schema()` (jsonschema → Pydantic fallback); `:23` `format_with_schema()`; `:49` calls validate then fills defaults<br>&bull; `agent-core/openjiuwen/core/foundation/tool/mcp/base.py:208` — `MCPTool.invoke` validates MCP args via the same path<br>&bull; `agent-core/openjiuwen/agent_teams/tools/structured_output_tool.py:82` — `input_params = schema_json`; `:86` `invoke`<br>&bull; `agent-core/openjiuwen/core/foundation/tool/base.py:90` — `ToolCard.input_params` is the schema source</sub>

**Gap.** Validation is skipped when `input_params` is falsy. The JSON repair only balances brackets/quotes — it does not fix unquoted barewords or trailing commas, which raise and round-trip an error to the model. Schema validation lives inside the tool (`LocalFunction`/`MCPTool`), so a raw `Tool` subclass that does not call `SchemaUtils` gets no automatic argument validation.

<sub>_Canonical source: `orig/ai-agent-framework-interview-questions_for_engineers.md`; also covered in: framework._</sub>

## 5. What's the difference between a system prompt and a user prompt

**General:** The system prompt sets persistent role, rules, persona, and constraints for the whole conversation; the user prompt is the per-turn request. Providers give the system message higher priority and apply it consistently, while user turns are the changing input. Some APIs (Anthropic) pass system content as a separate top-level field rather than a role in the message list.

**Jiuwen:** The system prompt is a single assembled string from priority-ordered, host-injectable sections; rails mutate the `SystemPromptBuilder` (add/remove sections) before the model call, and `ReActAgent` renders it once as a `SystemMessage` passed as `system_messages`. User turns are admitted separately as `UserMessage` history; the context engine windows `system_messages` and `context_messages` independently. Provider mapping differs: OpenAI chat keeps `role:"system"` in the list, Anthropic lifts system content to the top-level `system` parameter (with an opt-in mid-conversation system path), and the Responses API folds system/developer into `instructions`.

```mermaid
flowchart TD
    RAILS["rails: add/remove sections"] --> SPB["SystemPromptBuilder"]
    SPB --> SM["one SystemMessage (index 0)"]
    USER["user turn"] --> UM["UserMessage history"]
    SM --> CTX["context window: system_messages and context_messages windowed independently"]
    UM --> CTX
    CTX --> MAP{"provider mapping"}
    MAP --> OAI["OpenAI: role:system in message list"]
    MAP --> ANT["Anthropic: top-level system param + opt-in mid-conv system"]
    MAP --> RESP["Responses API: → instructions"]
```

<sub>**Anchors:**<br>&bull; `agent-core/openjiuwen/core/single_agent/agents/react_agent.py:1504` — builds one `SystemMessage`; `:883` `_admit_user_message()` writes a `UserMessage`<br>&bull; `agent-core/openjiuwen/core/context_engine/context/context.py:574` — `get_context_window(system_messages, ...)`; `:718` `_get_window_messages()` windows independently<br>&bull; `agent-core/openjiuwen/harness/rails/task_planning_rail.py:154` — rail adds/removes a system-prompt section<br>&bull; `agent-core/openjiuwen/harness/rails/security/prompt_security_rail.py:17` — security section injection<br>&bull; `agent-core/openjiuwen/harness/prompts/prompt_attachment_manager.py:591` — user→system re-role per provider<br>&bull; `agent-core/openjiuwen/core/foundation/llm/model_clients/anthropic_model_client.py:379` — lifts system into top-level blocks; `:858` `params["system"]`<br>&bull; `agent-core/openjiuwen/core/foundation/llm/utils/responses_utils.py:142` — system/developer → `instructions`</sub>

<sub>_Canonical source: `orig/llm-fundamentals-interview-questions_for_engineers.md`; also covered in: llm-fund._</sub>

## 6. What's the difference between a system prompt and a user prompt, and why does that separation matter

**General:** The system prompt sets persistent role, rules, persona, and constraints for the whole conversation; the user prompt is the per-turn request. Providers give the system message higher priority and apply it consistently, while user turns are the changing input. Some APIs (Anthropic) pass system content as a separate top-level field.

**Jiuwen:** The system prompt is a single assembled string from priority-ordered, host-injectable sections; rails mutate the `SystemPromptBuilder` before the model call, and `ReActAgent` renders it once as a `SystemMessage` passed as `system_messages`. User turns are admitted separately as `UserMessage` history; the context engine windows `system_messages` and `context_messages` independently. Provider mapping differs: OpenAI keeps `role:"system"`, Anthropic lifts it to a top-level `system` parameter, and the Responses API folds system/developer into `instructions`.

```mermaid
flowchart TD
    RAILS["rails: add/remove sections"] --> SPB["SystemPromptBuilder"]
    SPB --> SM["one SystemMessage (index 0)"]
    USER["user turn"] --> UM["UserMessage history"]
    SM --> CTX["context window: system_messages and context_messages windowed independently"]
    UM --> CTX
    CTX --> MAP{"provider mapping"}
    MAP --> OAI["OpenAI: role:system in message list"]
    MAP --> ANT["Anthropic: top-level system param"]
    MAP --> RESP["Responses API: → instructions"]
```

<sub>**Anchors:**<br>&bull; `agent-core/openjiuwen/core/single_agent/agents/react_agent.py:1504` — builds one `SystemMessage`; `:883` `_admit_user_message()`<br>&bull; `agent-core/openjiuwen/core/context_engine/context/context.py:574` — `get_context_window(system_messages, ...)`; `:718` `_get_window_messages()`<br>&bull; `agent-core/openjiuwen/harness/rails/task_planning_rail.py:154` — rail adds/removes a system-prompt section<br>&bull; `agent-core/openjiuwen/harness/rails/security/prompt_security_rail.py:17` — security section injection<br>&bull; `agent-core/openjiuwen/harness/prompts/prompt_attachment_manager.py:591` — user→system re-role per provider<br>&bull; `agent-core/openjiuwen/core/foundation/llm/model_clients/anthropic_model_client.py:379` — lifts system into top-level blocks; `:858` `params["system"]`<br>&bull; `agent-core/openjiuwen/core/foundation/llm/utils/responses_utils.py:142` — system/developer → `instructions`</sub>

<sub>_Canonical source: `orig/genai-interview-questions_for_engineers.md`; also covered in: genai._</sub>

## 7. What's the difference between zero-shot, few-shot, and chain-of-thought prompting?

**General:** Zero-shot (instruction only) works for tasks seen in instruction tuning. Few-shot (worked examples) helps when format/label conventions are hard to specify. Chain-of-thought (step-by-step) helps multi-step reasoning, largely subsumed by native reasoning models. All cost tokens.

**Jiuwen:** The runtime agent is zero-shot (instruction-only `PromptSection`s + ReAct loop). Few-shot lives only in tuning tooling; CoT appears in auxiliary prompts and implicitly in compaction; reasoning-model output is preserved via `reasoning_content`.

```mermaid
flowchart TD
    Z["zero-shot: instruction-only system prompt"] --> LOOP["ReAct loop"]
    F["few-shot: examples → tuning tooling only"] -.-> LOOP
    C["CoT: auxiliary prompts / native reasoning"] -.-> LOOP
    R["reasoning_content parsed & preserved"] -.-> LOOP
```

<sub>**Anchors:**<br>&bull; `agent-core/openjiuwen/harness/prompts/sections/identity.py:11` — zero-shot identity<br>&bull; `agent-core/openjiuwen/dev_tools/tune/optimizer/example_optimizer.py:109` — few-shot injection (tuning)<br>&bull; `agent-core/openjiuwen/core/workflow/components/llm/questioner_comp.py:68` — explicit CoT<br>&bull; `agent-core/openjiuwen/core/foundation/llm/model_clients/openai_model_client.py:347` — `reasoning_content`</sub>

---

# RAG

<sub>_Canonical source: `orig/llm-applied-interview-questions_for_engineers.md`; also covered in: llm-applied._</sub>

## 8. Zero-shot vs. few-shot vs. chain-of-thought, when does each actually improve output

**General:** Zero-shot (instruction only) works for tasks the model saw in instruction tuning. Few-shot (worked examples) helps when the task has a specific format, label set, or edge-case convention the instruction can't fully specify. Chain-of-thought (ask for intermediate reasoning) helps multi-step reasoning/arithmetic, especially for smaller models, and is largely subsumed by native reasoning models. All three cost prompt tokens; examples and CoT are not free wins on simple tasks.

**Jiuwen:** The runtime agent is fundamentally zero-shot: the system prompt is assembled from instruction-only `PromptSection`s (identity, safety, skills, tools, task guidance) and the model is steered through the ReAct tool-calling loop, not worked examples. Few-shot machinery exists only in the evolution/tuning tooling (`agent_evolving`, `dev_tools/tune`), which formats cases into example blocks and injects them as prompt gradients. Chain-of-thought appears in auxiliary prompts (workflow `questioner_comp` has an explicit "Let's think step by step") and implicitly in the compaction prompt's `<analysis>`-then-`<summary>` structure. Reasoning-model output is preserved: clients parse `reasoning_content`, and DeepSeek profiles inject an empty `reasoning_content` into assistant history.

```mermaid
flowchart TD
    subgraph RT["Runtime (ReAct agent)"]
    direction TB
    SYS["instruction-only PromptSections → SystemMessage"] --> LOOP["tool-calling loop (zero-shot)"]
    end
    subgraph TUNE["Evolution / tuning tooling"]
    direction TB
    CASES["Case → example i / question / expected answer"] --> GRAD["inject as few-shot prompt gradient"]
    end
    subgraph AUX["Auxiliary prompts"]
    direction TB
    COT["questioner_comp: 'Let's think step by step'"] --> A1["workflow questioner"]
    AN["compaction: <analysis> before <summary>"] --> A2["context compression"]
    end
    REASON["reasoning_content parsed & preserved"] -.-> RT
```

<sub>**Anchors:**<br>&bull; `agent-core/openjiuwen/core/single_agent/agents/react_agent.py:842` — renders `role=="system"` template messages; `:1504` `SystemMessage(content=prompt_builder.build())`<br>&bull; `agent-core/openjiuwen/core/single_agent/prompts/builder.py:219` — `build()` joins priority-ordered sections<br>&bull; `agent-core/openjiuwen/harness/prompts/sections/identity.py:11` — default identity prompt (zero-shot)<br>&bull; `agent-core/openjiuwen/agent_evolving/utils.py:238` — `convert_cases_to_examples()`<br>&bull; `agent-core/openjiuwen/dev_tools/tune/optimizer/example_optimizer.py:109` — `init_examples()` few-shot injection<br>&bull; `agent-core/openjiuwen/core/foundation/llm/model_clients/openai_model_client.py:347` — parses `reasoning_content`; `agent-core/openjiuwen/core/foundation/llm/utils/endpoint_profiles.py:33` — DeepSeek empty `reasoning_content`<br>&bull; `agent-core/openjiuwen/core/workflow/components/llm/questioner_comp.py:68` — explicit CoT instruction</sub>

**Gap.** No task-level few-shot examples are injected by `harness/` or `core/single_agent`; tool descriptions have occasional usage lines but no worked input/output demos. No global CoT instruction in the DeepAgent system prompt — reasoning is delegated to the model's native channel.

<sub>_Canonical source: `orig/llm-fundamentals-interview-questions_for_engineers.md`; also covered in: genai, llm-fund._</sub>
