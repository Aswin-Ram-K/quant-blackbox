"""
Quant Black Box — Momentum Strategy (ported from algo-trading-bot).

Buys when the asset breaks above the N-day high on elevated volume.
Sells on breakdown below N-day low.

Original: logic/strategies.py::momentum_strategy
"""

from __future__ import annotations

import pandas as pd

from app.strategies.base import Signal, StrategyBase


class MomentumStrategy(StrategyBase):
    name = "Momentum"
    description = (
        "Equity momentum swing breakout. Buys when price breaks above "
        "the high of the last N lookback days on volume exceeding the "
        "N-day average. Sells on breakdown below N-day low."
    )
    markets = ["equities"]
    timeframes = ["1D", "4H", "1H"]
    tier = "swing"
    parameters = {
        "lookback": {"type": "int", "default": 20, "min": 5, "max": 100},
        "volume_mult": {"type": "float", "default": 1.2, "min": 0.5, "max": 5.0},
    }

    def analyze(self, data: pd.DataFrame, params: dict) -> Signal:
        lookback = int(params.get("lookback", 20))
        volume_mult = float(params.get("volume_mult", 1.2))

        if len(data) < lookback:
            return Signal(direction=0)

        last = data.iloc[-1]
        window = data.tail(lookback + 1)

        # Conditions
        highest_high = window["High"].iloc[:-1].max()
        avg_vol = window["Volume"].iloc[:-1].mean()

        if last["Close"] > highest_high and last["Volume"] > avg_vol * volume_mult:
            return Signal(
                direction=1,
                strength=0.8,
                metadata={"type": "MOMENTUM", "signal": "BUY", "reason": "Breakout above N-day high with volume"},
            )

        if last["Close"] < window["Low"].iloc[:-1].min():
            return Signal(
                direction=-1,
                strength=0.7,
                metadata={"type": "MOMENTUM", "signal": "SELL", "reason": "Breakdown below N-day low"},
            )

        return Signal(direction=0)
