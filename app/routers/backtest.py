"""
Backtesting endpoints
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
from app.backtesting.engine import BacktestEngine
from app.schemas import BacktestRequest, BacktestResponse

router = APIRouter()

engine = BacktestEngine()


@router.post("/run", response_model=BacktestResponse)
def run_backtest(request: BacktestRequest):
    """Run a backtest for a strategy on specified data."""
    try:
        result = engine.run_backtest(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{backtest_id}/results")
def get_backtest_results(backtest_id: str):
    """Get results for a completed backtest."""
    result = engine.get_result(backtest_id)
    if not result:
        raise HTTPException(status_code=404, detail="Backtest not found")
    return result


@router.delete("/{backtest_id}")
def delete_backtest(backtest_id: str):
    """Delete a backtest result."""
    engine.delete_result(backtest_id)
    return {"status": "deleted", "id": backtest_id}
