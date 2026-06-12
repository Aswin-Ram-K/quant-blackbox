"""
Quant Black Box — Market Data Fetching.

Multi-source:
- Yahoo Finance (equities, ETFs, commodities, forex) via ``yfinance``
- CCXT (crypto) via ``ccxt``

Falls back gracefully when a source is unavailable.
"""

from __future__ import annotations

import logging
from typing import Optional

import pandas as pd

logger = logging.getLogger(__name__)


# ── Default symbol mapping ─────────────────────────────────────────────────

# Maps internal asset names to ticker symbols per source
SYMBOL_MAP: dict[str, dict[str, str]] = {
    "equities": {
        "SPY": "SPY",
        "QQQ": "QQQ",
        "AAPL": "AAPL",
        "TSLA": "TSLA",
        "GLD": "GLD",
        "USO": "USO",
    },
    "crypto": {
        "BTC/USD": "BTC/USD",
        "ETH/USD": "ETH/USD",
        "BTCUSD": "BTC/USD",
        "ETHUSD": "ETH/USD",
    },
    "forex": {
        "EUR/USD": "EURUSD=X",
        "GBP/USD": "GBPUSD=X",
        "USD/JPY": "JPY=X",
    },
    "commodities": {
        "GC=F": "GC=F",
        "CL=F": "CL=F",
        "SI=F": "SI=F",
    },
}


def _detect_asset_class(asset: str) -> str:
    """Auto-detect asset class from ticker symbol."""
    upper = asset.upper()
    if upper.endswith("=X"):
        return "forex"
    if "/" in upper or upper.endswith("USD") or upper in ("BTC", "ETH"):
        return "crypto"
    if any(upper.startswith(x) for x in ("GC", "CL", "SI", "HG")):
        return "commodities"
    return "equities"


def fetch_historical(
    asset: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    period: str = "2y",
    timeframe: str = "1d",
    source: str = "auto",
) -> pd.DataFrame:
    """
    Fetch historical OHLCV data for an asset.

    Parameters
    ----------
    asset : str
        Asset symbol (e.g. "SPY", "BTC/USD", "EUR/USD").
    start_date : str or None
        Start date in YYYY-MM-DD format.
    end_date : str or None
        End date in YYYY-MM-DD format.
    period : str
        yfinance period string (e.g. "1y", "2y", "5y") used when
        start/end dates are not specified.
    timeframe : str
        Interval string for yfinance (e.g. "1d", "1h", "15m").
    source : str
        "auto" | "yfinance" | "ccxt"

    Returns
    -------
    pd.DataFrame with columns: Open, High, Low, Close, Volume, [Adj Close]
    """
    asset_class = _detect_asset_class(asset) if source == "auto" else source
    ticker = _resolve_ticker(asset, asset_class)

    if source == "ccxt" or (source == "auto" and asset_class == "crypto"):
        return _fetch_ccxt(asset)

    return _fetch_yfinance(ticker, start_date, end_date, period, timeframe)


def _resolve_ticker(asset: str, asset_class: str) -> str:
    """Resolve an internal asset name to a source-specific ticker."""
    mapping = SYMBOL_MAP.get(asset_class, {})
    if asset in mapping:
        return mapping[asset]
    return asset  # use as-is


def _fetch_yfinance(
    ticker: str,
    start_date: Optional[str],
    end_date: Optional[str],
    period: str,
    timeframe: str,
) -> pd.DataFrame:
    """Fetch via yfinance."""
    import yfinance as yf

    try:
        kwargs = {"period": period}
        if start_date:
            kwargs["start"] = start_date
        if end_date:
            kwargs["end"] = end_date

        df = yf.Ticker(ticker).history(**kwargs)

        if df.empty:
            logger.warning(f"yfinance returned empty data for {ticker}")
            return pd.DataFrame()

        # Normalize column names
        cols = ["Open", "High", "Low", "Close", "Volume"]
        existing = [c for c in cols if c in df.columns]
        df = df[existing].copy()
        df = df.reset_index()

        # Rename 'Date' to 'date' for consistency
        if "Date" in df.columns:
            df = df.rename(columns={"Date": "date"})

        return df
    except Exception as e:
        logger.error(f"yfinance fetch failed for {ticker}: {e}")
        raise


def _fetch_ccxt(asset: str) -> pd.DataFrame:
    """Fetch via CCXT (crypto)."""
    try:
        import ccxt

        # Normalize symbol
        symbol = asset if "/" in asset else f"{asset}/USD"
        parts = symbol.split("/")
        base = parts[0]
        quote = parts[1] if len(parts) > 1 else "USD"

        exchange = ccxt.binance()

        timeframe_map = {
            "1m": "1m",
            "5m": "5m",
            "15m": "15m",
            "1H": "1h",
            "4H": "4h",
            "1D": "1d",
        }

        timeframe = timeframe_map.get("1d", "1d")
        limit = 1000  # max per call

        all_candles = []
        since = exchange.parse8601("2024-01-01T00:00:00Z")

        while True:
            candles = exchange.fetch_ohlcv(f"{base}/{quote}", timeframe, since=since, limit=limit)
            if not candles:
                break
            all_candles.extend(candles)
            since = candles[-1][0] + 1

        if not all_candles:
            logger.warning(f"CCXT returned empty data for {symbol}")
            return pd.DataFrame()

        df = pd.DataFrame(
            all_candles,
            columns=["timestamp", "Open", "High", "Low", "Close", "Volume"],
        )
        df["date"] = pd.to_datetime(df["timestamp"], unit="ms", utc=True)
        df = df[["date", "Open", "High", "Low", "Close", "Volume"]]
        return df

    except ImportError:
        logger.error("ccxt not installed — can't fetch crypto data")
        raise
    except Exception as e:
        logger.error(f"CCXT fetch failed for {asset}: {e}")
        raise
