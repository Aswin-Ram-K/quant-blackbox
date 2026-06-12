"""
Quant Black Box — Portfolio management for backtesting.

Handles position sizing, portfolio tracking, and P&L calculations
during backtesting.
"""

from __future__ import annotations

import numpy as np


class BacktestPortfolio:
    """Manages capital, positions, and P&L during a backtest."""

    def __init__(
        self,
        initial_capital: float = 100_000.0,
        commission: float = 0.001,
        slippage: float = 0.0005,
        position_sizing: str = "fixed_fraction",
        risk_per_trade: float = 0.01,
        kelly_fraction: float = 0.25,
    ):
        self.initial_capital = initial_capital
        self.cash = initial_capital
        self.position: dict | None = None
        self.commission = commission
        self.slippage = slippage
        self.position_sizing = position_sizing
        self.risk_per_trade = risk_per_trade
        self.kelly_fraction = kelly_fraction
        self.trades: list[dict] = []
        self.equity_curve: list[float] = []

    def buy(self, price: float, signal_strength: float = 0.0) -> bool:
        """Enter a long position. Returns True if position opened."""
        if self.position is not None:
            return False

        shares = self._calc_shares(price)
        if shares <= 0:
            return False

        cost = shares * price * (1 + self.slippage)
        commission_cost = cost * self.commission

        if cost + commission_cost > self.cash:
            return False

        self.cash -= cost + commission_cost
        self.position = {
            "entry_price": price,
            "shares": shares,
            "entry_bar": 0,
            "strength": signal_strength,
        }
        return True

    def sell(self, price: float, days_held: int = 0) -> dict | None:
        """Exit the current position. Returns trade record or None."""
        if self.position is None:
            return None

        sale_proceeds = self.position["shares"] * price * (1 - self.slippage)
        commission_cost = sale_proceeds * self.commission
        self.cash += sale_proceeds - commission_cost

        pnl_pct = safe_div(price - self.position["entry_price"], self.position["entry_price"])
        pnl_usd = pnl_pct * self.position["shares"] * self.position["entry_price"]

        trade = {
            "entry_price": self.position["entry_price"],
            "exit_price": price,
            "shares": self.position["shares"],
            "pnl_pct": round(pnl_pct, 6),
            "pnl_usd": round(pnl_usd, 2),
            "days": days_held,
        }

        self.trades.append(trade)
        self.position = None
        return trade

    def update_equity(self, current_price: float) -> float:
        """Update the current portfolio value and append to equity curve."""
        if self.position is not None:
            market_value = self.position["shares"] * current_price
            current_value = self.cash + market_value
        else:
            current_value = self.cash
        self.equity_curve.append(current_value)
        return current_value

    def _calc_shares(self, price: float) -> float:
        """Calculate position size based on the sizing method."""
        if self.position_sizing == "fixed_fraction":
            return self._fixed_fraction(price)
        elif self.position_sizing == "kelly":
            return self._kelly_criterion(price)
        elif self.position_sizing == "vol_target":
            return self._vol_target(price)
        else:
            return self._fixed_fraction(price)

    def _fixed_fraction(self, price: float) -> float:
        """Risk a fixed fraction of capital per position."""
        risk_amount = self.cash * self.risk_per_trade
        return max(safe_div(risk_amount, price), 0)

    def _kelly_criterion(self, price: float) -> float:
        """Kelly criterion position sizing (simplified)."""
        if not self.trades:
            return self._fixed_fraction(price)

        wins = [t for t in self.trades if t.get("pnl_pct", 0) > 0]
        win_rate = safe_div(len(wins), len(self.trades))

        if win_rate <= 0.5 or win_rate >= 1.0:
            return self._fixed_fraction(price)

        avg_win = np.mean([t["pnl_pct"] for t in wins])
        losses = [t for t in self.trades if t.get("pnl_pct", 0) < 0]
        avg_loss = abs(np.mean([t["pnl_pct"] for t in losses])) if losses else 1.0

        kelly = win_rate - safe_div(1 - win_rate, avg_win / avg_loss)
        kelly = max(kelly * self.kelly_fraction, 0)
        risk_amount = self.cash * min(kelly, 0.1)  # Cap at 10%

        return max(safe_div(risk_amount, price), 0)

    def _vol_target(self, price: float) -> float:
        """Volatility targeting: scale position inversely to recent vol."""
        if not self.equity_curve:
            return self._fixed_fraction(price)

        eq = np.array(self.equity_curve[-20:])  # last 20 bars
        daily_returns = np.diff(eq) / eq[:-1]
        vol = np.std(daily_returns) if len(daily_returns) > 1 else 0.01

        target_vol = 0.01  # 1% daily vol target
        scale = safe_div(target_vol, vol, 1.0)
        scale = min(scale, 2.0)  # Cap leverage

        return self._fixed_fraction(price) * scale


def safe_div(a, b, fallback=0.0):
    return a / b if b != 0 else fallback
