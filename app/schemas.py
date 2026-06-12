"""
Quant Black Box — Pydantic v2 schemas for API request / response bodies.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


# ── Health ──────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str = "ok"
    app_name: str = "Quant Black Box"
    version: str = "0.1.0"


# ── Strategy ────────────────────────────────────────────────────────────────

class StrategyRegister(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    description: str = ""
    markets: list[str] = Field(default_factory=lambda: ["equities"])
    timeframes: list[str] = Field(
        default_factory=lambda: ["1D"]
    )
    tier: str = Field(..., pattern="^(long-term|swing|intraday)$")
    parameters: dict[str, Any] = Field(default_factory=dict)
    source_file: str = ""


class StrategySummary(BaseModel):
    name: str
    description: str = ""
    markets: list[str]
    timeframes: list[str]
    tier: str


class StrategyDetail(BaseModel):
    name: str
    description: str = ""
    markets: list[str]
    timeframes: list[str]
    tier: str
    parameters: dict[str, Any] = {}


# ── Backtest ────────────────────────────────────────────────────────────────

class BacktestRequest(BaseModel):
    strategy_name: str
    asset: str
    timeframe: str = "1D"
    start_date: str  # YYYY-MM-DD
    end_date: str
    params: dict[str, Any] = {}
    initial_capital: float = 100_000.0
    stop_loss: float = 0.05
    take_profit: float = 0.08
    commission: float = 0.001
    slippage: float = 0.0005
    position_sizing: str = "fixed_fraction"
    regime_filter: bool = False


class BacktestResultTrade(BaseModel):
    entry_date: str
    exit_date: str
    entry_price: float
    exit_price: float
    pnl_pct: float
    pnl_usd: float
    shares: float
    days_held: int
    regime: Optional[str] = None
    signal_type: str = "market"


class BacktestResultResponse(BaseModel):
    backtest_id: int
    status: str
    trades: list[BacktestResultTrade]
    metrics: dict[str, Any]
    equity_curve: list[float]
    regime_breakdown: dict[str, Any] | None = None


# ── Paper Trading ───────────────────────────────────────────────────────────

class PaperStartRequest(BaseModel):
    asset: str
    initial_capital: float = 100_000.0
    strategy_name: str = ""
    commission: float = 0.001
    slippage: float = 0.001


class PaperOrderRequest(BaseModel):
    symbol: str
    side: str = Field(..., pattern="^(buy|sell)$")
    order_type: str = "market"  # market | limit | stop-loss | take-profit
    quantity: float = Field(..., gt=0)
    limit_price: float | None = None
    stop_loss: float | None = None
    take_profit: float | None = None


class PaperOrderResponse(BaseModel):
    order_id: int
    status: str
    fill_price: float | None = None
    error: str | None = None


class PaperPosition(BaseModel):
    symbol: str
    quantity: float
    avg_entry_price: float
    current_price: float
    unrealized_pnl: float
    total_cost: float


class PaperPortfolio(BaseModel):
    session_id: int
    asset: str
    initial_capital: float
    cash: float
    market_value: float
    total_equity: float
    total_pnl: float
    total_pnl_pct: float
    positions: list[PaperPosition]
    orders: list[Any]  # simplified order list


# ── Analytics ───────────────────────────────────────────────────────────────

class MetricsResponse(BaseModel):
    backtest_id: int
    metrics: dict[str, Any]


class CompareRequest(BaseModel):
    backtest_ids: list[int]


class CompareResponse(BaseModel):
    comparisons: list[dict[str, Any]]


# ── Data ────────────────────────────────────────────────────────────────────

class FetchDataRequest(BaseModel):
    asset: str
    start_date: str = ""
    end_date: str = ""
    period: str = "2y"
    timeframe: str = "1d"
    source: str = "auto"  # auto | yfinance | ccxt


class FetchDataResponse(BaseModel):
    asset: str
    source: str
    rows: int
    columns: list[str]
    first_date: str = ""
    last_date: str = ""
    data_preview: list[dict[str, Any]] = []


# ── Regime ──────────────────────────────────────────────────────────────────

class RegimeCurrentResponse(BaseModel):
    asset: str
    regime: str
    confidence: float
    probabilities: dict[str, float]


class RegimeTrainRequest(BaseModel):
    asset: str
    start_date: str = ""
    end_date: str = ""
    period: str = "2y"
    n_states: int = 3
    lookback_days: int = 90
    confidence_threshold: float = 0.60


class RegimeTrainResponse(BaseModel):
    trained: bool
    asset: str
    regime: str | None = None
    confidence: float | None = None
    messages: list[str] = []


# ── Sources ─────────────────────────────────────────────────────────────────

class DataSourceResponse(BaseModel):
    name: str
    asset_class: str
    adapter: str
    is_active: bool
