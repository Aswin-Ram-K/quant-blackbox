"""
Quant Black Box — SQLAlchemy data models.

All persistence tables live here.  Tables:
- strategy          metadata for registered strategies
- backtest_run      one row per backtest invocation
- backtest_trade    individual trades within a backtest
- backtest_result   10-metric evaluation stored as JSON
- paper_session     paper-trading session config
- paper_order       orders within a session
- paper_position    live positions during a session
- data_source       configured data source adapters
- regime_snapshot   snapshot of regime model + predictions
"""

from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class StrategyModel(Base):
    """Strategy metadata (registered strategies)."""

    __tablename__ = "strategies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(80), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    markets = Column(JSON, nullable=False)  # ['equities','crypto',...]
    timeframes = Column(JSON, nullable=False)
    tier = Column(String(20), nullable=False)  # long-term | swing | intraday
    parameters = Column(JSON, nullable=True)  # param schema
    source_file = Column(String(255), nullable=True)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )


class BacktestRunModel(Base):
    """A single backtest invocation."""

    __tablename__ = "backtest_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    strategy_name = Column(String(80), nullable=False)
    asset = Column(String(50), nullable=False)
    timeframe = Column(String(10), nullable=False)
    start_date = Column(String(20), nullable=False)
    end_date = Column(String(20), nullable=False)
    params = Column(JSON, nullable=True)  # strategy parameters used
    initial_capital = Column(Float, default=100_000.0)
    status = Column(String(20), default="running")  # running | completed | failed
    error_msg = Column(Text, nullable=True)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    trades = relationship("BacktestTradeModel", back_populates="backtest", cascade="all, delete-orphan")
    result = relationship("BacktestResultModel", back_populates="backtest", uselist=False, cascade="all, delete-orphan")


class BacktestTradeModel(Base):
    """Individual trade within a backtest."""

    __tablename__ = "backtest_trades"

    id = Column(Integer, primary_key=True, autoincrement=True)
    backtest_id = Column(Integer, ForeignKey("backtest_runs.id", ondelete="CASCADE"), nullable=False)
    entry_date = Column(String(20), nullable=False)
    exit_date = Column(String(20), nullable=False)
    entry_price = Column(Float, nullable=False)
    exit_price = Column(Float, nullable=False)
    pnl_pct = Column(Float, nullable=False)
    pnl_usd = Column(Float, nullable=False)
    shares = Column(Float, nullable=False)
    days_held = Column(Integer, default=0)
    regime = Column(String(40), nullable=True)
    signal_type = Column(String(20), default="market")

    backtest = relationship("BacktestRunModel", back_populates="trades")


class BacktestResultModel(Base):
    """10-metric evaluation for a backtest."""

    __tablename__ = "backtest_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    backtest_id = Column(Integer, ForeignKey("backtest_runs.id", ondelete="CASCADE"), nullable=False)
    metrics = Column(JSON, nullable=True)  # full 10-metric dict
    equity_curve = Column(JSON, nullable=True)  # list of capital values
    regime_breakdown = Column(JSON, nullable=True)

    backtest = relationship("BacktestRunModel", back_populates="result")


class PaperSessionModel(Base):
    """Paper trading session."""

    __tablename__ = "paper_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    asset = Column(String(50), nullable=False)
    initial_capital = Column(Float, default=100_000.0)
    strategy_name = Column(String(80), nullable=True)
    commission = Column(Float, default=0.001)
    slippage = Column(Float, default=0.001)
    is_active = Column(Integer, default=1)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )


class PaperOrderModel(Base):
    """Orders within a paper session."""

    __tablename__ = "paper_orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("paper_sessions.id", ondelete="CASCADE"), nullable=False)
    symbol = Column(String(50), nullable=False)
    side = Column(String(10), nullable=False)  # buy | sell
    order_type = Column(String(20), default="market")
    quantity = Column(Float, nullable=False)
    limit_price = Column(Float, nullable=True)
    stop_loss = Column(Float, nullable=True)
    take_profit = Column(Float, nullable=True)
    fill_price = Column(Float, nullable=True)
    status = Column(String(20), default="pending")  # pending | filled | rejected
    error = Column(Text, nullable=True)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )


class PaperPositionModel(Base):
    """Live positions within a paper session."""

    __tablename__ = "paper_positions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("paper_sessions.id", ondelete="CASCADE"), nullable=False)
    symbol = Column(String(50), nullable=False)
    quantity = Column(Float, default=0.0)
    avg_entry_price = Column(Float, default=0.0)
    current_price = Column(Float, default=0.0)
    unrealized_pnl = Column(Float, default=0.0)
    total_cost = Column(Float, default=0.0)


class DataSourceModel(Base):
    """Data source configuration."""

    __tablename__ = "data_sources"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(80), unique=True, nullable=False)
    asset_class = Column(String(30), nullable=False)  # equities, crypto, forex, commodities
    adapter = Column(String(50), nullable=False)  # yfinance, ccxt, etc.
    config = Column(JSON, nullable=True)
    is_active = Column(Integer, default=1)


class RegimeSnapshotModel(Base):
    """Snapshot of regime model + predictions."""

    __tablename__ = "regime_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    asset = Column(String(50), nullable=False)
    regime_label = Column(String(40), nullable=False)
    probabilities = Column(JSON, nullable=True)
    confidence = Column(Float, default=0.0)
    trained_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
