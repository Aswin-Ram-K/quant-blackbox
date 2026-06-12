"""
Quant Black Box — Regime configuration defaults.

These defaults mirror the config.yaml regime section from the
algo-trading-bot and are used when the API doesn't provide overrides.
"""

from __future__ import annotations

from typing import Any

REGIME_CONFIG: dict[str, Any] = {
    "n_states": 3,
    "lookback_days": 90,
    "confidence_threshold": 0.60,
    "warmup_bars": 60,
    "retrain_frequency_days": 30,
    "enabled": True,
}


def get_config() -> dict[str, Any]:
    return dict(REGIME_CONFIG)


def update_config(updates: dict[str, Any]) -> dict[str, Any]:
    """Update regime config with new values."""
    REGIME_CONFIG.update(updates)
    return dict(REGIME_CONFIG)
