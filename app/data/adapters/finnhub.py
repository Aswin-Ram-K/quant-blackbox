"""
Finnhub Adapter — News, sentiment, insider trading, fundamentals.

Free tier: 60 calls/min, 60 credits/sec.
Pro tier: $199/mo.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timedelta
from typing import Optional

import pandas as pd

logger = logging.getLogger(__name__)

FINNHUB_API_KEY = os.environ.get("FINNHUB_API_KEY", "")


class FinnhubAdapter:
    """Adapter for Finnhub API (news, sentiment, insider trading)."""

    name = "Finnhub"
    asset_classes = ["equities", "crypto", "forex"]
    tier = "free"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or FINNHUB_API_KEY

    def _get_api_key(self) -> str:
        if not self.api_key:
            raise ValueError("Finnhub API key required. Set FINNHUB_API_KEY env var or pass api_key param.")
        return self.api_key

    def fetch_news(self, symbol: str, limit: int = 20) -> Optional[list[dict]]:
        """Fetch recent news articles for a symbol."""
        if not self.api_key:
            return None

        import urllib.request
        import json

        try:
            # Finnhub news endpoint
            from datetime import datetime, timedelta
            from_date = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")
            to_date = datetime.utcnow().strftime("%Y-%m-%d")

            url = (
                f"https://finnhub.io/api/v1/company-news?symbol={symbol}"
                f"&from={from_date}&to={to_date}&token={self._get_api_key()}"
            )
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            resp = urllib.request.urlopen(req, timeout=10)
            data = json.loads(resp.read().decode())

            if data:
                # Convert to standardized format
                articles = []
                for item in data[:limit]:
                    articles.append({
                        "title": item.get("headline", ""),
                        "source": item.get("source", ""),
                        "url": item.get("url", ""),
                        "published_at": item.get("datetime", ""),
                        "summary": item.get("summary", ""),
                    })
                return articles

            return None
        except Exception as e:
            logger.debug(f"Finnhub news fetch failed for {symbol}: {e}")
            return None

    def fetch_sentiment(self, symbol: str) -> Optional[float]:
        """
        Get sentiment score from Finnhub.

        Returns score between -1.0 (negative) and 1.0 (positive).
        Based on recent news analysis.
        """
        if not self.api_key:
            return None

        import urllib.request
        import json

        try:
            url = (
                f"https://finnhub.io/api/v1/model/sentiment?symbol={symbol}"
                f"&token={self._get_api_key()}"
            )
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            resp = urllib.request.urlopen(req, timeout=10)
            data = json.loads(resp.read().decode())

            if data and isinstance(data, dict):
                # Finnhub returns sentiment scores
                return float(data.get("score", 0.0))
            return None
        except Exception as e:
            logger.debug(f"Finnhub sentiment fetch failed for {symbol}: {e}")
            return None

    def fetch_insider_trading(self, symbol: str, limit: int = 10) -> Optional[list[dict]]:
        """Fetch insider trading data."""
        if not self.api_key:
            return None

        import urllib.request
        import json

        try:
            url = (
                f"https://finnhub.io/api/v1/stock/symbol?exchange=US&token={self._get_api_key()}"
            )
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            resp = urllib.request.urlopen(req, timeout=10)
            data = json.loads(resp.read().decode())

            if isinstance(data, list):
                return data[:limit]
            return None
        except Exception as e:
            logger.debug(f"Finnhub insider trading fetch failed for {symbol}: {e}")
            return None

    def fetch_realtime_price(self, symbol: str) -> Optional[float]:
        """Get current price from Finnhub."""
        if not self.api_key:
            return None

        import urllib.request
        import json

        try:
            # Map crypto symbols
            crypto_map = {"BTC-USD": "X:BTCUSD", "ETH-USD": "X:ETHUSD", "SOL-USD": "X:SOLUSD"}
            if symbol in crypto_map:
                symbol = crypto_map[symbol]

            url = f"https://finnhub.io/api/v1/quote?symbol={symbol}&token={self._get_api_key()}"
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            resp = urllib.request.urlopen(req, timeout=10)
            data = json.loads(resp.read().decode())

            if data and "c" in data:  # c = current price
                return float(data["c"])
            return None
        except Exception as e:
            logger.debug(f"Finnhub realtime price fetch failed for {symbol}: {e}")
            return None
