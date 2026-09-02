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
    "2. Drop or merge deterministic findings the digest does not corroborate.\n"
    "3. Never invent content that is not in the digest.\n"
    "4. Never include API keys, tokens, or credentials even if they appear; redact them.\n"
    "5. For each issue, provide an 'evolution' suggestion ONLY when the evidence "
    "implicates an identifiable optimizable surface. Allowed kinds: skill, prompt, "
    "tool, rail, config, none. Prefer a skill/tool name that actually appears in the "
    "digest. Use 'none' for pure performance or informational findings.\n"
    "6. Set artifacts to an empty array.\n\n"
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
    "2. 摘要无法佐证的确定性发现应合并或删除。\n"
    "3. 不得虚构摘要中不存在的内容。\n"
    "4. 即使出现密钥或凭据也不得输出，一律改写为 <redacted>。\n"
    "5. 每个问题只有当证据指向某个可优化表面时才给出 evolution 建议；"
    "允许的 kind：skill、prompt、tool、rail、config、none。优先使用摘要中出现的"
    "skill/工具名称。纯性能或信息性问题填 none。\n"
    "6. artifacts 一律为空数组。\n\n"
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
