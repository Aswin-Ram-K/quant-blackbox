"""
Quant Black Box — Volatility Strategy (ported from algo-trading-bot).

Buys when price breaks above its N-day high on volume 2x average.
Sells when price closes below N-day SMA.

Original: logic/strategies.py::vol_strategy
"""

from __future__ import annotations

import pandas as pd

from app.strategies.base import Signal, StrategyBase


class VolatilityStrategy(StrategyBase):
    name = "Volatility"
    description = (
        "Volatility regime shift. Buys on breakout above N-day high "
        "with volume > 2× average. Sells on fade below N-day SMA."
    )
    markets = ["equities", "crypto", "commodities"]
    timeframes = ["1D", "4H", "1H", "15m", "5m", "1m"]
    tier = "intraday"
    parameters = {
        "lookback": {"type": "int", "default": 10, "min": 3, "max": 50},
        "volume_mult": {"type": "float", "default": 2.0, "min": 1.0, "max": 10.0},
    }

    def analyze(self, data: pd.DataFrame, params: dict) -> Signal:
        lookback = int(params.get("lookback", 10))
        volume_mult = float(params.get("volume_mult", 2.0))

        if len(data) < lookback:
            return Signal(direction=0)

        last = data.iloc[-1]
        window = data.tail(lookback)

        highest_high = window["High"].max()
        avg_vol = window["Volume"].mean()

        if last["Close"] > highest_high and last["Volume"] > avg_vol * volume_mult:
            return Signal(
                direction=1,
                strength=0.8,
                metadata={
                    "type": "VOLATILITY",
                    "signal": "BUY",
                    "reason": "Volatility breakout with high volume",
                },
            )

        if last["Close"] < data["Close"].tail(lookback).mean():
            return Signal(
                direction=-1,
                strength=0.65,
                metadata={
                    "type": "VOLATILITY",
                    "signal": "SELL",
                    "reason": "Fade below N-day SMA",
                },
            )

        return Signal(direction=0)
