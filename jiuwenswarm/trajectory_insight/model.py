# Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.

"""Model resolution for the trajectory analysis LLM stage.

The gateway process has no user-bound runtime, so the analyzer uses the same
product default model that ordinary agent runs use (``get_default_models``).
The optional ``trajectory_ui.analysis.model`` override selects a matching entry
by model name or alias.
"""

from __future__ import annotations

from typing import Any

from jiuwenswarm.common.config import get_default_models
from jiuwenswarm.trajectory_insight.config import get_analysis_settings


def _matches(entry: dict[str, Any], target: str) -> bool:
    client = entry.get("model_client_config") or {}
    model_name = str(client.get("model_name") or "")
    alias = str(entry.get("alias") or client.get("alias") or "")
    return model_name == target or alias == target


def resolve_model_for_analysis(config=None):
    """Build a Model for the analysis LLM stage, or None when unavailable.

    Returns:
        ``openjiuwen.core.foundation.llm.Model`` instance or ``None``.
    """
    from openjiuwen.core.foundation.llm import Model
    from openjiuwen.core.foundation.llm.schema.config import ModelClientConfig, ModelRequestConfig

    settings = get_analysis_settings(config)
    entries = get_default_models(config)
    if not entries:
        return None

    target = (settings.model or "").strip()
    if target:
        selected = next((entry for entry in entries if _matches(entry, target)), None)
        if selected is None:
            selected = dict(entries[0])
            client = dict(selected.get("model_client_config") or {})
            client["model_name"] = target
            selected["model_client_config"] = client
    else:
        selected = entries[0]

    client_raw = selected.get("model_client_config") or {}
    if not isinstance(client_raw, dict):
        return None

    model_name = str(client_raw.get("model_name") or "")
    client_provider = str(client_raw.get("client_provider") or "")
    api_base = str(client_raw.get("api_base") or "")
    if not model_name or not client_provider or not api_base:
        return None

    client_kwargs: dict[str, Any] = {
        "client_provider": client_provider,
        "api_base": api_base.rstrip("/"),
        "api_key": client_raw.get("api_key") or "",
        "verify_ssl": bool(client_raw.get("verify_ssl", False)),
    }
    for key in ("endpoint_profile", "custom_headers", "timeout", "max_retries"):
        if key in client_raw:
            client_kwargs[key] = client_raw[key]
    model_client_config = ModelClientConfig(**client_kwargs)

    model_obj = selected.get("model_config_obj") or {}
    model_request_kwargs: dict[str, Any] = {
        "model": model_name,
        "temperature": 0.2,
    }
    if isinstance(model_obj, dict):
        for key in ("temperature", "max_tokens", "top_p", "reasoning_level"):
            if key in model_obj:
                model_request_kwargs[key] = model_obj[key]
    model_request_config = ModelRequestConfig(**model_request_kwargs)

    return Model(model_config=model_request_config, model_client_config=model_client_config)
