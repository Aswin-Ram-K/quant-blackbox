"""
Quant Black Box — Regime labeling helpers.

Provides utility functions for mapping HMM states to semantic labels,
and for generating regime labels for strategy filtering.
"""

from __future__ import annotations

from app.regime.detector import (
    REGIME_LABELS,
    REGIME_COMPATIBLE_STRATEGIES,
    STRATEGY_REGIME_MAP,
    RegimeDetector,
)

__all__ = [
    "REGIME_LABELS",
    "REGIME_COMPATIBLE_STRATEGIES",
    "STRATEGY_REGIME_MAP",
    "RegimeDetector",
]
