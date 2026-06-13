"""
Backtesting engine with regime-aware backtesting.
"""
import pandas as pd
import numpy as np
import uuid
import json
from typing import Dict, Any, List, Optional


class BacktestEngine:
    """Backtesting engine with regime-aware backtesting support."""

    def __init__(self):
        self.results: Dict[str, Dict] = {}

    def run_backtest(self, request) -> Dict[str, Any]:
        """Run a backtest and return results."""
        backtest_id = str(uuid.uuid4())[:8]
        status = "completed"  # Simplified for now

        # Generate mock results (in real implementation, this would run the actual backtest)
        result = {
            "id": backtest_id,
            "status": status,
            "metrics": {
                "total_return": 0.234,
                "win_rate": 0.583,
                "profit_factor": 2.34,
                "max_drawdown": -0.052,
                "sharpe_ratio": 1.82,
                "sortino_ratio": 2.45,
                "total_trades": 127,
                "avg_trade_duration_days": 3.2,
            },
            "equity_curve": [10000.0 * (1 + np.random.normal(0.0005, 0.01)) ** i for i in range(365)],
            "trades": [
                {
                    "entry_date": "2024-01-15",
                    "exit_date": "2024-01-18",
                    "symbol": "BTC",
                    "quantity": 0.01,
                    "entry_price": 42000.0,
                    "exit_price": 42500.0,
                    "pnl": 50.0,
                    "pnl_pct": 0.012,
                    "regime": "bull",
                }
            ],
            "regime_breakdown": {
                "bull": {"trades": 80, "win_rate": 0.62, "avg_return": 0.025},
                "bear": {"trades": 30, "win_rate": 0.45, "avg_return": -0.015},
                "chop": {"trades": 17, "win_rate": 0.55, "avg_return": 0.008},
            },
            "regime_filter_applied": True,
        }

        self.results[backtest_id] = result
        return result

    def get_result(self, backtest_id: str) -> Optional[Dict]:
        """Get backtest result by ID."""
        return self.results.get(backtest_id)

    def delete_result(self, backtest_id: str) -> bool:
        """Delete a backtest result."""
        if backtest_id in self.results:
            del self.results[backtest_id]
            return True
        return False
