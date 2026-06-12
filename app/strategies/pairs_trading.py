"""
Quant Black Box — Pairs Trading Strategy.

Mean-reversion strategy on two correlated assets.  Opens long/short
when the spread z-score deviates beyond a threshold.  Closes when the
spread reverts to the mean.
"""

from __future__ import annotations

import pandas as pd

from app.strategies.base import Signal, StrategyBase


class PairsTradingStrategy(StrategyBase):
    name = "Pairs Trading"
    description = (
        "Statistical arbitrage on two correlated assets.  Opens a "
        "long/short position when the spread z-score deviates beyond "
        "the threshold.  Closes when the spread reverts to the mean."
    )
    markets = ["equities", "crypto"]
    timeframes = ["1D", "4H", "1H"]
    tier = "swing"
    parameters = {
        "lookback": {"type": "int", "default": 20, "min": 10, "max": 100},
        "entry_zscore": {"type": "float", "default": 2.0, "min": 1.0, "max": 5.0},
        "exit_zscore": {"type": "float", "default": 0.5, "min": 0.0, "max": 2.0},
    }

    def analyze(
        self,
        data: dict[str, pd.DataFrame],
        params: dict,
    ) -> Signal:
        """Pairs trading requires a dict of {pair_name: DataFrame}.

        Accepts ``data`` as a dict with two DataFrames keyed by asset
        symbols, e.g. ``{"SPY": df1, "QQQ": df2}``.  Computes the
        log-price spread and its z-score.
        """
        if not isinstance(data, dict):
            return Signal(direction=0)

        if len(data) < 2:
            return Signal(direction=0)

        assets = list(data.keys())[:2]
        d1, d2 = [data[a] for a in assets]

        if d1.empty or d2.empty:
            return Signal(direction=0)

        lookback = int(params.get("lookback", 20))
        entry_z = float(params.get("entry_zscore", 2.0))
        exit_z = float(params.get("exit_zscore", 0.5))

        # Compute log returns spread
        log_price_1 = d1["Close"].log()
        log_price_2 = d2["Close"].log()
        spread = log_price_1 - log_price_2

        if len(spread) < lookback:
            return Signal(direction=0)

        rolling_mean = spread.rolling(window=lookback).mean()
        rolling_std = spread.rolling(window=lookback).std()
        z_score = (spread - rolling_mean) / rolling_std

        current_z = z_score.iloc[-1]

        if current_z > entry_z:
            return Signal(
                direction=-1,
                strength=0.75,
                metadata={
                    "type": "PAIRS",
                    "signal": "SHORT_SPREAD",
                    "reason": f"Spread z-score {current_z:.2f} above {entry_z}",
                    "pair": assets,
                },
            )

        if current_z < -entry_z:
            return Signal(
                direction=1,
                strength=0.75,
                metadata={
                    "type": "PAIRS",
                    "signal": "LONG_SPREAD",
                    "reason": f"Spread z-score {current_z:.2f} below {-entry_z}",
                    "pair": assets,
                },
            )

        if abs(current_z) < exit_z:
            return Signal(
                direction=0,
                strength=0.5,
                metadata={
                    "type": "PAIRS",
                    "signal": "CLOSE_SPREAD",
                    "reason": f"Spread reverted to mean (z={current_z:.2f})",
                },
            )

        return Signal(direction=0)
