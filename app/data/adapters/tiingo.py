"""
Tiingo Adapter — Real-time and historical data.

Free tier: 50 symbols/hr.
Pro tier: $29/mo.
"""

from __future__ import annotations

import logging
import os
from typing import Optional

import pandas as pd

logger = logging.getLogger(__name__)

TIINGO_API_KEY = os.environ.get("TIINGO_API_KEY", "")


class TiingoAdapter:
    """Data adapter for Tiingo API."""

    name = "Tiingo"
    asset_classes = ["equities", "crypto", "forex", "commodities"]
    tier = "free"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or TIINGO_API_KEY

    def _get_api_key(self) -> str:
        if not self.api_key:
            raise ValueError("Tiingo API key required. Set TIINGO_API_KEY env var or pass api_key param.")
        return self.api_key

    def fetch_ohlcv(
        self,
        symbol: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        interval: str = "1d",
    ) -> Optional[pd.DataFrame]:
        """Fetch OHLCV data from Tiingo."""
        if not self.api_key:
            return None

        import urllib.request
        import json

        try:
            # Tiingo uses 'daily' interval, 'weekly', 'monthly'
            # For minute data, uses 'min' interval
            params = {"resolution": interval, "startDate": start_date, "endDate": end_date}
            params_str = "&".join(f"{k}={v}" for k, v in params.items() if v)

            url = f"https://api.tiingo.com/iex/daily-prices/{symbol}/prices?token={self._get_api_key()}{f'&{params_str}' if params_str else ''}"

            req = urllib.request.Request(url, headers={
                "User-Agent": "Mozilla/5.0",
                "Content-Type": "application/json",
            })
            resp = urllib.request.urlopen(req, timeout=10)
            data = json.loads(resp.read().decode())

            if data:
                df = pd.DataFrame(data)
                if "date" in df.columns:
                    df["date"] = pd.to_datetime(df["date"])
                    df.set_index("date", inplace=True)
                elif "formattedDate" in df.columns:
                    df["formattedDate"] = pd.to_datetime(df["formattedDate"])
                    df.set_index("formattedDate", inplace=True)

                # Normalize columns
                if "close" in df.columns:
                    df = df[["open", "high", "low", "close", "volume"]].copy()
                    df.columns = ["open", "high", "low", "close", "volume"]
                    return df.reset_index()

            return None
        except Exception as e:
            logger.debug(f"Tiingo OHLCV fetch failed for {symbol}: {e}")
            return None

    def fetch_realtime_price(self, symbol: str) -> Optional[float]:
        """Get current price from Tiingo."""
        if not self.api_key:
            return None

        import urllib.request
        import json

        try:
            url = f"https://api.tiingo.com/iex/prices/{symbol}/latest?token={self._get_api_key()}"
            req = urllib.request.Request(url, headers={
                "User-Agent": "Mozilla/5.0",
                "Content-Type": "application/json",
            })
            resp = urllib.request.urlopen(req, timeout=10)
            data = json.loads(resp.read().decode())

            if data and "close" in data:
                return float(data["close"])
            return None
        except Exception as e:
            logger.debug(f"Tiingo realtime price fetch failed for {symbol}: {e}")
            return None

    def fetch_news(self, symbol: str, limit: int = 20) -> Optional[list[dict]]:
        """Fetch news articles from Tiingo."""
        if not self.api_key:
            return None

        import urllib.request
        import json

        try:
            url = (
                f"https://api.tiingo.com/iex/{symbol}/news?token={self._get_api_key()}&limit={limit}"
            )
            req = urllib.request.Request(url, headers={
                "User-Agent": "Mozilla/5.0",
                "Content-Type": "application/json",
            })
            resp = urllib.request.urlopen(req, timeout=10)
            data = json.loads(resp.read().decode())

            if data:
                articles = []
                for item in data[:limit]:
                    articles.append({
                        "title": item.get("title", ""),
                        "source": item.get("source", ""),
                        "url": item.get("url", ""),
                        "published_at": item.get("publishedAt", ""),
                        "summary": item.get("body", ""),
                    })
                return articles
            return None
        except Exception as e:
            logger.debug(f"Tiingo news fetch failed for {symbol}: {e}")
            return None
