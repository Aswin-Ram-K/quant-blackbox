"""
Quant Black Box — Central Settings (Pydantic v2).

All configuration flows through this model.  Environment variables
override the defaults.
"""

from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── App ──────────────────────────────────────────────────────────────────
    app_name: str = "Quant Black Box"
    app_version: str = "0.1.0"
    debug: bool = False

    # ── Server ───────────────────────────────────────────────────────────────
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: list[str] = ["http://localhost:5173"]  # Vite dev

    # ── Database ─────────────────────────────────────────────────────────────
    database_url: str = f"sqlite:///{Path(__file__).parent / 'data' / 'blackbox.db'}"

    # ── Capital & Risk Defaults ─────────────────────────────────────────────
    initial_capital: float = 100_000.0
    risk_per_trade: float = 0.01  # 1 % of equity
    default_commission: float = 0.001  # 0.1 %
    default_slippage: float = 0.0005  # 0.05 %

    # ── Regime Detection Defaults ───────────────────────────────────────────
    regime_n_states: int = 3
    regime_lookback_days: int = 90
    regime_confidence_threshold: float = 0.60
    regime_warmup_bars: int = 60

    # ── Backtest Defaults ───────────────────────────────────────────────────
    backtest_stop_loss: float = 0.05
    backtest_take_profit: float = 0.08
    backtest_position_sizing: str = "fixed_fraction"  # fixed_fraction | kelly | vol_target

    # ── Data Fetching ───────────────────────────────────────────────────────
    yfinance_proxy: str = ""
    ccxt_rate_limit: int = 1000  # ms between requests

    # ── Paper Trading Defaults ──────────────────────────────────────────────
    paper_slippage: float = 0.001
    paper_commission: float = 0.001

    # ── Logging ──────────────────────────────────────────────────────────────
    log_level: str = "INFO"

    model_config = {"env_prefix": "QBB_", "env_file": ".env", "extra": "ignore"}


# Singleton
settings = Settings()
