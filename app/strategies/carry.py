"""
Quant Black Box — Commodity Carry / Trend Strategy (ported from algo-trading-bot).

Buys when the 50-day SMA crosses above the 200-day SMA (golden cross).
Sells on death cross (50-day SMA crosses below 200-day SMA).

Original: logic/strategies.py::commodity_carry_strategy
"""

from __future__ import annotations

import pandas as pd

from app.strategies.base import Signal, StrategyBase


class CarryStrategy(StrategyBase):
    name = "Carry"
    description = (
        "Commodity/equity carry strategy. Long when 50-day SMA > "
        "200-day SMA (uptrend). Exits when 50-day SMA < 200-day SMA."
    )
    markets = ["commodities", "equities", "crypto"]
    timeframes = ["1D", "4H"]
    tier = "long-term"
    parameters = {
        "sma_fast": {"type": "int", "default": 50, "min": 10, "max": 100},
        "sma_slow": {"type": "int", "default": 200, "min": 50, "max": 500},
        "momentum_filter": {
            "type": "bool",
            "default": True,
            "choices": [True, False],
        },
    }

    def analyze(self, data: pd.DataFrame, params: dict) -> Signal:
        sma_fast_period = int(params.get("sma_fast", 50))
        sma_slow_period = int(params.get("sma_slow", 200))
        use_momentum = bool(params.get("momentum_filter", True))

        if len(data) < sma_slow_period:
            return Signal(direction=0)

        sma_fast = data["Close"].rolling(window=sma_fast_period).mean()
        sma_slow = data["Close"].rolling(window=sma_slow_period).mean()

        current_sma_fast = sma_fast.iloc[-1]
        current_sma_slow = sma_slow.iloc[-1]
        prev_sma_fast = sma_fast.iloc[-2]

        current_price = data["Close"].iloc[-1]

        if use_momentum:
            # Buy: golden cross + momentum (SMA fast still rising)
            if current_sma_fast > current_sma_slow and current_sma_fast > prev_sma_fast:
                return Signal(
                    direction=1,
                    strength=0.85,
                    metadata={
                        "type": "CARRY",
                        "signal": "BUY",
                        "reason": "Golden cross with positive momentum",
                    },
                )

            if current_sma_fast < current_sma_slow:
                return Signal(
                    direction=-1,
                    strength=0.8,
                    metadata={
                        "type": "CARRY",
                        "signal": "SELL",
                        "reason": "Death cross",
                    },
                )
        else:
            if current_sma_fast > current_sma_slow:
                return Signal(
                    direction=1,
                    strength=0.75,
                    metadata={
                        "type": "CARRY",
                        "signal": "BUY",
                        "reason": "50 SMA above 200 SMA",
                    },
                )
            if current_sma_fast < current_sma_slow:
                return Signal(
                    direction=-1,
                    strength=0.75,
                    metadata={
                        "type": "CARRY",
                        "signal": "SELL",
                        "reason": "50 SMA below 200 SMA",
                    },
                )

        return Signal(direction=0)
