"""
Quant Black Box — Backtesting Metrics.

Implements the 10-metric evaluation suite originally from
``logic/metrics.py`` in the algo-trading-bot, expanded with proper
risk-adjusted and regime-aware metrics.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from app.utils.helpers import safe_div


def calculate_metrics(
    trades: list[dict],
    equity_curve: list[float],
    starting_capital: float,
    regime_breakdown: dict | None = None,
) -> dict:
    """
    Calculate 10 performance metrics from trades and equity curve.

    Metrics:
      1.  Total Return
      2.  Win Rate
      3.  Profit Factor
      4.  Max Drawdown
      5.  Sharpe Ratio
      6.  Sortino Ratio
      7.  Win/Loss Ratio
      8.  Avg Trade Duration
      9.  Calmar Ratio
      10. Recovery Time

    Parameters
    ----------
    trades : list[dict]
        Each trade dict has keys: pnl_pct, pnl_usd, days, ...
    equity_curve : list[float]
        Daily equity values.
    starting_capital : float
        Initial capital.
    regime_breakdown : dict or None
        Optional regime-level performance breakdown.

    Returns
    -------
    dict
        All 10 metrics plus summary fields.
    """
    if not trades:
        final_capital = equity_curve[-1] if equity_curve else starting_capital
        return {
            "status": "NO_TRADES",
            "final_capital": final_capital,
            "starting_capital": starting_capital,
            "total_return": 0.0,
            "total_trades": 0,
            "win_rate": 0.0,
            "profit_factor": 0.0,
            "max_drawdown": 0.0,
            "sharpe_ratio": 0.0,
            "sortino_ratio": 0.0,
            "win_loss_ratio": 0.0,
            "avg_trade_duration": 0.0,
            "calmar_ratio": 0.0,
            "recovery_days": 0,
        }

    final_capital = equity_curve[-1] if equity_curve else starting_capital

    # 1. Total Return
    total_return = safe_div(final_capital - starting_capital, starting_capital)

    # 2. Win Rate
    wins = [t for t in trades if t.get("pnl_pct", 0) > 0]
    losses = [t for t in trades if t.get("pnl_pct", 0) < 0]
    win_rate = safe_div(len(wins), len(trades))

    # 3. Profit Factor
    gross_win = sum(t.get("pnl_pct", 0) for t in wins)
    gross_loss = abs(sum(t.get("pnl_pct", 0) for t in losses))
    profit_factor = safe_div(gross_win, gross_loss, 999.0)

    # 4. Max Drawdown
    equity = np.array(equity_curve)
    peak = np.maximum.accumulate(equity)
    drawdown = (equity - peak) / peak
    max_drawdown = float(np.min(drawdown)) if len(drawdown) > 0 else 0.0

    # 5. Sharpe Ratio (daily)
    daily_returns = np.diff(equity_curve) / equity_curve[:-1]
    daily_returns = daily_returns[np.isfinite(daily_returns)]
    sharpe = float(
        safe_div(np.mean(daily_returns), np.std(daily_returns), 0.0) * np.sqrt(252)
        if len(daily_returns) > 1 and np.std(daily_returns) > 0
        else 0.0
    )

    # 6. Sortino Ratio
    downside_returns = daily_returns[daily_returns < 0]
    downside_std = np.std(downside_returns) if len(downside_returns) > 0 else 1.0
    sortino = float(
        safe_div(np.mean(daily_returns), downside_std, 0.0) * np.sqrt(252)
        if len(daily_returns) > 1 and downside_std > 0
        else 0.0
    )

    # 7. Win/Loss Ratio
    avg_win = np.mean([t.get("pnl_pct", 0) for t in wins]) if wins else 0
    avg_loss = (
        np.mean([t.get("pnl_pct", 0) for t in losses]) if losses else 0
    )
    win_loss_ratio = safe_div(abs(avg_win), abs(avg_loss), 0.0)

    # 8. Avg Trade Duration
    durations = [t.get("days", 0) for t in trades]
    avg_duration = float(np.mean(durations)) if durations else 0

    # 9. Calmar Ratio
    calmar = safe_div(total_return, abs(max_drawdown), 0.0) if max_drawdown != 0 else 0.0

    # 10. Recovery Time (days to recover from peak drawdown)
    peak_cap = equity_curve[0]
    max_recovery = 0
    in_dd = False
    dd_start_idx = 0
    for i, eq in enumerate(equity_curve):
        if eq < peak_cap * 0.95:
            if not in_dd:
                in_dd = True
                dd_start_idx = i
        if in_dd and eq > equity_curve[dd_start_idx]:
            max_recovery = max(max_recovery, i - dd_start_idx)
            in_dd = False

    result = {
        "final_capital": round(final_capital, 2),
        "starting_capital": round(starting_capital, 2),
        "total_return": round(total_return, 6),
        "total_trades": len(trades),
        "total_wins": len(wins),
        "total_losses": len(losses),
        "win_rate": round(win_rate, 4),
        "profit_factor": round(profit_factor, 4),
        "max_drawdown": round(max_drawdown, 4),
        "sharpe_ratio": round(sharpe, 4),
        "sortino_ratio": round(sortino, 4),
        "win_loss_ratio": round(win_loss_ratio, 4),
        "avg_trade_duration": round(avg_duration, 1),
        "calmar_ratio": round(calmar, 4),
        "recovery_days": max_recovery,
    }

    if regime_breakdown:
        result["regime_breakdown"] = regime_breakdown

    return result
