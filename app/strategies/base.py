"""
Quant Black Box — Strategy base class and signal types.

All strategies inherit from ``StrategyBase`` and implement:
- ``name`` / ``description`` / ``markets`` / ``timeframes`` / ``tier``
- ``parameters`` — default parameter schema
- ``analyze(data, params) -> Signal`` — signal generation
- ``validate_params(params) -> bool`` — validation hook

Signals are returned as a simple dataclass for type safety.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import pandas as pd


@dataclass
class Signal:
    """A trading signal with optional metadata.

    Attributes
    ----------
    direction : int
        1 = BUY, -1 = SELL, 0 = HOLD
    strength : float
        Signal confidence (0–1).  Strategy-specific.
    metadata : dict
        Arbitrary info (e.g. stop_loss, take_profit, rationale).
    """

    direction: int  # 1=buy, -1=sell, 0=hold
    strength: float = 0.0
    metadata: dict[str, Any] = field(default_factory=dict)

    @property
    def is_buy(self) -> bool:
        return self.direction == 1

    @property
    def is_sell(self) -> bool:
        return self.direction == -1

    @property
    def is_hold(self) -> bool:
        return self.direction == 0

    def to_dict(self) -> dict:
        return {"direction": self.direction, "strength": self.strength, **self.metadata}


class StrategyBase:
    """Abstract base for all quant strategies.

    Subclasses must set ``name``, ``description``, ``markets``,
    ``timeframes``, ``tier``, and ``parameters``.
    """

    name: str = ""
    description: str = ""
    markets: list[str] = field(default_factory=lambda: ["equities"])
    timeframes: list[str] = field(
        default_factory=lambda: ["1D", "4H", "1H", "15m", "5m", "1m"]
    )
    tier: str = "swing"  # long-term | swing | intraday
    parameters: dict[str, Any] = {}

    def analyze(self, data: pd.DataFrame, params: dict) -> Signal:
        """Return a Signal for the current bar.

        Parameters
        ----------
        data : pd.DataFrame
            OHLCV data with columns: Open, High, Low, Close, Volume.
            The last row is the current bar to evaluate.
        params : dict
            Strategy parameters (merged with defaults).

        Returns
        -------
        Signal
        """
        raise NotImplementedError

    def validate_params(self, params: dict) -> bool:
        """Return True if params are valid. Override for custom checks."""
        return True

    def get_default_params(self) -> dict[str, Any]:
        """Return the default parameter dict."""
        return dict(self.parameters)

    def __repr__(self) -> str:
        return f"<Strategy {self.name}>"

    def __init_subclass__(cls, **kwargs):
        """Auto-register any StrategyBase subclass on definition."""
        try:
            from app.strategies.registry import register_strategy
            if hasattr(cls, "name") and cls.name:
                register_strategy(cls())
        except ImportError:
            pass  # Registry not yet loaded
