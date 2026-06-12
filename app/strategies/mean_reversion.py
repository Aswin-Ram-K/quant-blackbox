"""
Quant Black Box — Mean Reversion Strategy (ported from algo-trading-bot).

Buys when RSI is oversold (<30) and price touches the lower Bollinger Band.
Exits when RSI > 70 or price crosses the Bollinger middle band.

Original: logic/strategies.py::mean_reversion_strategy
"""

from __future__ import annotations

import pandas as pd

from app.strategies.base import Signal, StrategyBase


class MeanReversionStrategy(StrategyBase):
    name = "Mean Reversion"
    description = (
        "Crypto/equity mean reversion. Buys when RSI is oversold "
        "(<30) and price touches the lower Bollinger Band. Exits when "
        "RSI returns to 70 or price reaches the middle band."
    )
    markets = ["crypto", "equities"]
    timeframes = ["1D", "4H", "1H", "15m", "5m"]
    tier = "swing"
    parameters = {
        "rsi_period": {"type": "int", "default": 14, "min": 5, "max": 50},
        "bb_std": {"type": "int", "default": 2, "min": 1, "max": 4},
        "rsi_oversold": {"type": "float", "default": 30.0, "min": 10, "max": 40},
        "rsi_overbought": {"type": "float", "default": 70.0, "min": 60, "max": 90},
    }

    def analyze(self, data: pd.DataFrame, params: dict) -> Signal:
        rsi_period = int(params.get("rsi_period", 14))
        bb_std = int(params.get("bb_std", 2))
        rsi_os = float(params.get("rsi_oversold", 30))
        rsi_ob = float(params.get("rsi_overbought", 70))

        if len(data) < rsi_period + 20:
            return Signal(direction=0)

        # RSI
        delta = data["Close"].diff()
        gain = delta.where(delta > 0, 0).rolling(window=rsi_period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=rsi_period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))

        # Bollinger Bands
        rolling_mean = data["Close"].rolling(window=20).mean()
        rolling_std = data["Close"].rolling(window=20).std()
        lower_band = rolling_mean - (bb_std * rolling_std)
        upper_band = rolling_mean + (bb_std * rolling_std)

        current_rsi = rsi.iloc[-1]
        current_price = data["Close"].iloc[-1]

        if current_rsi < rsi_os and current_price <= lower_band.iloc[-1]:
            return Signal(
                direction=1,
                strength=0.75,
                metadata={
                    "type": "MEAN_REV",
                    "signal": "BUY",
                    "reason": f"RSI={current_rsi:.1f} oversold, price at lower BB",
                },
            )

        if current_rsi > rsi_ob or current_price >= rolling_mean.iloc[-1]:
            return Signal(
                direction=-1,
                strength=0.7,
                metadata={
                    "type": "MEAN_REV",
                    "signal": "SELL",
                    "reason": f"RSI={current_rsi:.1f} overbought or price at middle band",
                },
            )

        return Signal(direction=0)
