"""
Yahoo Finance Adapter — Equities, Forex, Commodities.

Primary data source for free tier.
Covers: all US equities, ETFs, forex pairs, commodities.
Source: yfinance (free, ~2000 req/day rate-limited).
"""

from __future__ import annotations

import logging
from datetime import datetime  # noqa: F401
from typing import Optional

import pandas as pd

logger = logging.getLogger(__name__)

try:
    import yfinance as _yf  # noqa: F401
    YF_AVAILABLE = True
    yfinance = _yf  # type: ignore
except ImportError:
    YF_AVAILABLE = False
    yfinance = None  # type: ignore


class YahooAdapter:
    """Data adapter for Yahoo Finance (equities, forex, commodities)."""

    name = "Yahoo Finance"
    asset_classes = ["equities", "forex", "commodities"]
    tier = "free"

    def __init__(self):
        pass

    def _normalize_symbol(self, symbol: str) -> str:
        """Normalize symbol format for yfinance."""
        if symbol.endswith("/USD"):
            return symbol.replace("/USD", "/USDT")
        return symbol

    def fetch_ohlcv(
        self,
        symbol: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        interval: str = "1d",
    ) -> Optional[pd.DataFrame]:
        """Fetch OHLCV data from Yahoo Finance.

        Args:
            symbol: Asset symbol (e.g., 'AAPL', 'BTC-USD', 'EURUSD=X')
            start_date: Start date (YYYY-MM-DD), optional
            end_date: End date (YYYY-MM-DD), optional
            interval: Time interval ('1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w')

        Returns:
            DataFrame with DatetimeIndex, columns: Open, High, Low, Close, Volume
        """
        if not YF_AVAILABLE or yfinance is None:  # type: ignore[reportAttributeAccessIssue]
            return None

        symbol = self._normalize_symbol(symbol)

        try:
            ticker = yfinance.Ticker(symbol)  # type: ignore[reportAttributeAccessIssue]

            period_map = {
                "1m": "5d", "5m": "5d", "15m": "5d", "30m": "5d",
                "1h": "60d", "4h": "60d", "1d": "5y", "1w": "5y",
            }
            period = period_map.get(interval, "5y")

            if start_date or end_date:
                if start_date is None:
                    start_date = "2020-01-01"
                if end_date is None:
                    end_date = datetime.utcnow().strftime("%Y-%m-%d")  # type: ignore[reportPossiblyUnboundVariable]
                df = ticker.history(start=start_date, end=end_date, interval=interval)
            else:
                df = ticker.history(period=period, interval=interval)

            if df is not None and len(df) > 0:
                # Normalize column names to lowercase
                df = df.rename(columns={
                    "Open": "open", "High": "high",
                    "Low": "low", "Close": "close", "Volume": "volume",
                })
                return df
            return None

        except Exception as e:
            logger.debug(f"Yahoo fetch failed for {symbol}: {e}")
            return None

    def fetch_realtime_price(self, symbol: str) -> Optional[float]:
        """Fetch current price from Yahoo Finance."""
        if not YF_AVAILABLE or yfinance is None:  # type: ignore[reportAttributeAccessIssue]
            return None

        symbol = self._normalize_symbol(symbol)
        try:
            ticker = yfinance.Ticker(symbol)  # type: ignore[reportAttributeAccessIssue]
            info = ticker.info
            if info and isinstance(info, dict) and "regularMarketPrice" in info:
                return float(info["regularMarketPrice"])
            return None
        except Exception:
            return None

    def fetch_fundamentals(self, symbol: str) -> Optional[dict]:
        """Fetch key fundamentals from Yahoo Finance."""
        if not YF_AVAILABLE or yfinance is None:  # type: ignore[reportAttributeAccessIssue]
            return None

        symbol = self._normalize_symbol(symbol)
        try:
            import yfinance as _yf2  # type: ignore
            ticker = _yf2.Ticker(symbol)
            info = ticker.info
            if not info or not isinstance(info, dict):
                return None

            return {
                "symbol": symbol,
                "company_name": info.get("longName", info.get("shortName", "")),
                "market_cap": info.get("marketCap"),
                "pe_ratio": info.get("trailingPE"),
                "dividend_yield": info.get("dividendYield"),
                "52_week_high": info.get("fiftyTwoWeekHigh"),
                "52_week_low": info.get("fiftyTwoWeekLow"),
                "volume": info.get("volume"),
                "avg_volume": info.get("averageVolume"),
                "sector": info.get("sector"),
                "industry": info.get("industry"),
                "beta": info.get("beta"),
            }
        except Exception as e:
            logger.debug(f"Yahoo fundamentals fetch failed for {symbol}: {e}")
            return None

    def fetch_news(self, symbol: str, limit: int = 10) -> Optional[list[dict]]:
        """Fetch recent news articles from Yahoo Finance."""
        if not YF_AVAILABLE or yfinance is None:  # type: ignore[reportAttributeAccessIssue]
            return None

        symbol = self._normalize_symbol(symbol)
        try:
            ticker = yfinance.Ticker(symbol)  # type: ignore[reportAttributeAccessIssue]
            news = ticker.news
            if not news:
                return None

            articles = []
            for item in news[:limit]:
                articles.append({
                    "title": item.get("title", ""),
                    "source": item.get("publisher", ""),
                    "url": item.get("link", ""),
                    "published_at": item.get("providerPublishTime", 0),
                    "summary": "",
                })
            return articles
        except Exception:
            return None
