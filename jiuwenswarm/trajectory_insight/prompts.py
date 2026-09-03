# Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.

"""LLM prompt templates for the trajectory analysis stage.

Only the deterministic seeds plus a capped, redacted digest of the session are
ever placed into these prompts. Raw OTLP payloads must never reach the model.
"""

from __future__ import annotations

_ISSUE_SCHEMA_EN = """{
  "priority": 1,
  "title": "...",
  "description": "...",
  "evidence": "...",
  "impact": "...",
  "root_cause": "...",
  "recommendation": "...",
  "trace_id": "...",
  "span_id": "...",
  "turn_index": 3,
  "evolution": {
    "kind": "skill",
    "action": "modify",
    "target": "name-of-skill-or-file-or-config-key",
    "section": "Troubleshooting",
    "rationale": "...",
    "risk": "low",
    "confidence": 0.8,
    "artifacts": []
  }
}"""

_ANALYSIS_PROMPT_EN = (
    "You are an expert AI system diagnostician analyzing an agent session log "
    "from JiuwenSwarm, an AI agent platform.\n\n"
    "Analyze the session digest below and identify all notable issues, problems, "
    "anomalies, or improvement opportunities. You are given deterministic "
    "findings plus a condensed per-turn transcript.\n\n"
    "RULES:\n"
    "1. Keep only findings that are supported by evidence present in the digest.\n"
    "2. Deterministic findings are factual observations to consider, not a verdict. Use your judgment: include the ones you consider real problems, and mark expected or handled ones as low priority / FYI when relevant.\n"
    "3. Never invent content that is not in the digest.\n"
    "4. Never include API keys, tokens, or credentials even if they appear; redact them.\n"
    "5. For each issue, provide an 'evolution' suggestion ONLY when the evidence "
    "implicates an identifiable optimizable surface. Allowed kinds: skill, prompt, "
    "tool, rail, config, none. Prefer a skill/tool name that actually appears in the "
    "digest. Use 'none' for pure performance or informational findings.\n"
    "6. Set artifacts to an empty array.\n"
    "7. 'recommendation' must contain ONLY actions the agent itself can take in this "
    "session or the next one (verify inputs, use a different tool, rephrase, ask the "
    "user). NEVER recommend changing JiuwenSwarm code/tools/rails in 'recommendation' "
    "— code-level changes belong exclusively in 'evolution' and target developers, "
    "not this session.\n"
    "8. 'evolution' is only useful when it names something editable from this product: "
    "a skill present in the digest, a concrete config value, or an exact tool/rail "
    "name. A vague prompt-section label that maps to no editable file is NOT a valid "
    "suggestion — use kind 'none' instead.\n"
    "9. Severity judgment: a tool error the agent visibly handled afterwards (it "
    "explained the outcome and the turn continued normally) is NOT Critical/High — "
    "rate it Low or omit it. Critical/High is reserved for errors that block the task "
    "or repeat.\n\n"
    "SESSION DIGEST (may be truncated):\n"
    "{digest}\n\n"
    "Return ONLY a valid JSON array sorted by priority (most critical first). "
    "Each element must match exactly this schema:\n{issue_schema}\n"
    "If no issues are found, return []."
)

_ANALYSIS_PROMPT_ZH = (
    "你是 JiuwenSwarm AI 智能体平台的会话诊断专家。\n"
    "请分析以下会话摘要，找出值得关注的问题、异常与改进机会。"
    "你会先看到确定性发现，再看到压缩后的逐轮记录。\n\n"
    "规则：\n"
    "1. 只保留摘要中确有证据支持的问题。\n"
    "2. 确定性发现只是需要参考的事实性线索，不是最终结论。请自行判断：把真正构成问题的纳入，若属预期或被妥善处理可标记为低优先级 / 仅供参考。\n"
    "3. 不得虚构摘要中不存在的内容。\n"
    "4. 即使出现密钥或凭据也不得输出，一律改写为 <redacted>。\n"
    "5. 每个问题只有当证据指向某个可优化表面时才给出 evolution 建议；"
    "允许的 kind：skill、prompt、tool、rail、config、none。优先使用摘要中出现的"
    "skill/工具名称。纯性能或信息性问题填 none。\n"
    "6. artifacts 一律为空数组。\n"
    "7. recommendation 只能包含 Agent 本会话或下次能自己执行的动作"
    "（核实输入、改用它工具、改写措辞、询问用户）。严禁在 recommendation 里建议"
    "修改 JiuwenSwarm 代码/工具/rails——这类改动只能放在 evolution 中，且面向开发者，"
    "与本会话无关。\n"
    "8. evolution 只有当它能指向本产品中可编辑的对象时才有意义：摘要中出现的 skill、"
    "具体的 config 值、或确切的 tool/rail 名称。笼统的“提示词章节”这类无法对应到"
    "可编辑文件的建议不是有效建议——请填 kind=none。\n\n"
    "会话摘要（可能被截断）：\n"
    "{digest}\n\n"
    "只输出按优先级（最重要在前）排序的合法 JSON 数组，"
    "元素必须完全匹配如下结构：\n{issue_schema}\n"
    "若未发现问题，返回 []。"
)

_RETRY_PROMPT_EN = (
    "Your previous answer could not be parsed as a JSON array. Fix the format and "
    "return ONLY a valid JSON array matching this schema:\n{issue_schema}\n"
    "Do not add markdown fences or prose.\n\n"
    "The digest you analyzed was:\n{digest}\n\n"
    "Your previous answer was:\n{previous}"
)

_RETRY_PROMPT_ZH = (
    "上一次输出无法被解析为 JSON 数组。请修正格式，只返回与如下结构完全一致的"
    "合法 JSON 数组：\n{issue_schema}\n不要添加任何 markdown 围栏或说明文字。\n\n"
    "你分析的摘要：\n{digest}\n\n你上一次的输出：\n{previous}"
)


def build_analysis_prompt(digest: str, *, language: str = "en") -> str:
    """Build the diagnosis prompt for one capped digest."""
    template = _ANALYSIS_PROMPT_EN if language == "en" else _ANALYSIS_PROMPT_ZH
    return template.format(digest=digest, issue_schema=_ISSUE_SCHEMA_EN)


def build_retry_prompt(digest: str, previous: str, *, language: str = "en") -> str:
    """Build the JSON-repair prompt used after one unparsable answer."""
    template = _RETRY_PROMPT_EN if language == "en" else _RETRY_PROMPT_ZH
    return template.format(issue_schema=_ISSUE_SCHEMA_EN, digest=digest, previous=previous)


def build_change_prompt(
    *,
    language: str,
    file_path: str,
    content: str,
    issue_title: str,
    issue_evidence: str,
    issue_recommendation: str,
) -> str:
    """Build the prompt for proposing one exact, minimal file change."""
    if language == "zh":
        return (
            "你是一位严谨的代码维护者。请针对下面的问题，对指定文件做一次最小的、"
            "能落地的改动，并返回完整的新文件内容。\n"
            f"问题：{issue_title}\n证据：{issue_evidence}\n建议：{issue_recommendation}\n"
            f"文件路径：{file_path}\n\n文件当前内容：\n```\n{content}\n```\n\n"
            "要求：\n"
            "1. 只做与问题相关的必要修改，保留其余代码、导入和结构不变。\n"
            "2. 必须返回完整的更新后文件内容，不要省略任何行。\n"
            "3. 仅输出如下 JSON，不要包含其他文字：\n"
            '{"content": "完整的更新后文件内容", "summary": "一句话说明改了什么"}\n'
            "4. 如果无法安全修改（例如上下文不足或影响过大），返回 {\"content\": \"\"}。"
        )
    return (
        "You are a careful maintainer. Make one minimal, concrete change to the file below "
        "that addresses the reported problem, and return the COMPLETE updated file.\n"
        f"Issue: {issue_title}\nEvidence: {issue_evidence}\nSuggested direction: {issue_recommendation}\n"
        f"File path: {file_path}\n\nCurrent file content:\n```\n{content}\n```\n\n"
        "Rules:\n"
        "1. Change only what is needed for this issue; keep everything else (imports, structure) intact.\n"
        "2. Output the complete updated file with no lines omitted.\n"
        "3. Reply with ONLY the JSON object below, no prose:\n"
        '{"content": "the complete updated file content", "summary": "one sentence on the change"}\n'
        "4. If a safe change is not possible, return {\"content\": \"\"}."
    )
