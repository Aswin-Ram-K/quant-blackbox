"""
Quant Black Box — Dependency injection patterns.
"""

from __future__ import annotations

from collections import defaultdict

import pandas as pd

from sqlalchemy.orm import Session

from database import get_db  # noqa: F401 — re-exported


# In-memory store for backtest results (persisted to DB on completion).
# Maps backtest_id -> BacktestResult
_backtest_cache: dict[int, dict] = {}

# In-memory store for paper trading sessions.
# Maps session_id -> session state dict
_paper_sessions: dict[int, dict] = {}

# Session counter (simple auto-increment)
_backtest_id_counter: int = 0
_paper_id_counter: int = 0


def next_backtest_id() -> int:
    global _backtest_id_counter
    _backtest_id_counter += 1
    return _backtest_id_counter


def next_paper_id() -> int:
    global _paper_id_counter
    _paper_id_counter += 1
    return _paper_id_counter


def register_backtest_result(backtest_id: int, result: dict) -> None:
    _backtest_cache[backtest_id] = result


def get_backtest_result(backtest_id: int) -> dict | None:
    return _backtest_cache.get(backtest_id)


def register_paper_session(session_id: int, state: dict) -> None:
    _paper_sessions[session_id] = state


def get_paper_session(session_id: int) -> dict | None:
    return _paper_sessions.get(session_id)


def load_historical_data(
    asset: str,
    start_date: str | None = None,
    end_date: str | None = None,
    period: str = "2y",
    timeframe: str = "1d",
) -> pd.DataFrame:
    """
    Convenience: fetch historical data for a given asset.
    Uses the data fetcher module.
    """
    from app.data.fetcher import fetch_historical

    return fetch_historical(asset, start_date, end_date, period, timeframe)
