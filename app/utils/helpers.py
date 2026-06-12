"""
Quant Black Box — Utility helpers.
"""

from __future__ import annotations

import hashlib
from datetime import datetime, timezone


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def row_id(seed: str, extra: str = "") -> str:
    """Deterministic short hash for caching."""
    return hashlib.md5(f"{seed}:{extra}".encode()).hexdigest()[:12]


def safe_div(a: float, b: float, fallback: float = 0.0) -> float:
    """Division that never raises ZeroDivisionError."""
    return a / b if b != 0 else fallback


def pct_to_price(base: float, pct: float) -> float:
    """Convert a percentage offset to a price (e.g. stop-loss below entry)."""
    return base * (1.0 - pct)


def price_to_pct(price: float, base: float) -> float:
    """Convert a price difference to a percentage."""
    return safe_div(price - base, base)


def format_capital(val: float) -> str:
    """Format a dollar value."""
    if val < 0:
        return f"-${abs(val):,.2f}"
    return f"${val:,.2f}"


def format_pnl(pct: float) -> str:
    """Format a PnL percentage."""
    sign = "+" if pct >= 0 else ""
    return f"{sign}{pct:.2%}"
