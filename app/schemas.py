"""
Pydantic schemas for API
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


class StrategyInfo(BaseModel):
    """Strategy metadata."""
    name: str
    description: str
    parameters: Dict[str, Any]
    markets: List[str]
    timeframes: List[str]
    tier: str  # "long-term", "swing", "intraday"


class StrategyRegisterRequest(BaseModel):
    """Request to register a strategy dynamically."""
    name: str
    description: str
    parameters: Dict[str, Any]
    markets: List[str]
    timeframes: List[str]
    tier: str


class BacktestRequest(BaseModel):
    """Request to run a backtest."""
    strategy_name: str
    asset: str
    timeframe: str = "1D"
    start_date: str
    end_date: str
    initial_capital: float = 10000.0
    risk_per_trade: float = 0.01
    params: Dict[str, Any] = {}


class BacktestResponse(BaseModel):
    """Backtest result."""
    id: str
    status: str  # "running", "completed", "failed"
    metrics: Dict[str, Any] = {}
    equity_curve: List[float] = []
    trades: List[Dict[str, Any]] = []
    regime_breakdown: Dict[str, Any] = {}


class PaperTradeRequest(BaseModel):
    """Request to place a paper trade."""
    symbol: str
    quantity: float
    side: str = "buy"  # "buy" or "sell"
    order_type: str = "market"  # "market", "limit", "stop"
    limit_price: Optional[float] = None
    stop_loss: Optional[float] = None


class PaperTradeResponse(BaseModel):
    """Paper trade response."""
    order_id: str
    status: str
    symbol: str
    quantity: float
    side: str


class RegimeTrainRequest(BaseModel):
    """Request to train a regime model."""
    asset: str
    lookback_days: int = 90
