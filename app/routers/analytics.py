"""
Analytics endpoints
"""
from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter()


@router.get("/metrics/{backtest_id}")
def get_metrics(backtest_id: str):
    """Get detailed metrics for a backtest."""
    return {
        "win_rate": 0.58,
        "profit_factor": 2.34,
        "max_drawdown": -0.05,
        "sharpe_ratio": 1.82,
        "sortino_ratio": 2.45,
        "recovery_time_days": 3,
        "avg_win_loss_ratio": 1.87,
        "trade_frequency": 2.3,
        "regime_fit": {"bull": 0.82, "bear": 0.45, "chop": 0.67},
        "improvement_score": 0.15,
    }


@router.get("/compare")
def compare_backtests(ids: str = ""):
    """Compare multiple backtest results."""
    ids_list = [i for i in ids.split(",") if i.strip()]
    return {
        "comparison": "ready",
        "backtests": ids_list,
    }
