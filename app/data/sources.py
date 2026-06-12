"""
Quant Black Box — Data source adapters.

Maps asset classes to their primary data source and provides a
unified interface for fetching.
"""

from __future__ import annotations

from typing import Optional

import pandas as pd


# ── Source definitions ─────────────────────────────────────────────────────

SUPPORTED_SOURCES: dict[str, dict] = {
    "yahoo": {
        "name": "Yahoo Finance",
        "asset_classes": ["equities", "forex", "commodities"],
        "modules": ["equities", "etfs", "forex", "commodities"],
    },
    "ccxt": {
        "name": "CCXT (Binance)",
        "asset_classes": ["crypto"],
        "modules": ["binance"],
    },
}


def get_source_for_asset(asset: str, source: str = "auto") -> str:
    """
    Determine which data source to use for an asset.

    Parameters
    ----------
    asset : str
        Asset symbol.
    source : str
        Explicit source override ("yahoo", "ccxt", "auto").

    Returns
    -------
    str
        Source name ("yahoo", "ccxt", or "auto").
    """
    if source != "auto":
        return source

    upper = asset.upper()
    if upper.endswith("=X"):
        return "yahoo"
    if "/" in upper or upper.endswith("USD") or upper in ("BTC", "ETH"):
        return "ccxt"
    return "yahoo"


def list_sources() -> list[dict]:
    """Return metadata for all supported data sources."""
    return [
        {"name": v["name"], "adapter": k, "asset_classes": v["asset_classes"]}
        for k, v in SUPPORTED_SOURCES.items()
    ]
