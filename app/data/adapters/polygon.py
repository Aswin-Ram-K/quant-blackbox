"""
Polygon.io Adapter — Institutional quality data.

Free tier: 5 req/min, delayed data.
Starter tier: $29/mo — real-time data.
Growth tier: $199/mo.

Covers: equities, options, forex, crypto.
"""

from __future__ import annotations

import logging
import os
from typing import Optional

import pandas as pd

logger = logging.getLogger(__name__)

POLYGON_API_KEY=os.environ.get("POLYGON_API_KEY", "")


class PolygonAdapter:
    """Data adapter for Polygon.io API."""

    name = "Polygon.io"
    asset_classes = ["equities", "crypto", "forex", "options", "commodities"]
    tier = "free"  # Free tier available, paid tiers offer real-time

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or POLYGON_API_KEY

    def _get_api_key(self) -> str:
        if not self.api_key:
            raise ValueError("Polygon API key required. Set POLYGON_API_KEY env var or pass api_key param.")
        return self.api_key

    def fetch_ohlcv(
        self,
        symbol: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        interval: str = "1d",
    ) -> Optional[pd.DataFrame]:
        """
        Fetch OHLCV data from Polygon.

        Args:
            symbol: Ticker symbol (e.g., 'AAPL', 'X:BTCUSD', 'C:EURUSD')
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            interval: Time interval (1m, 5m, 15m, 1h, 4h, D, W, M)

        Returns:
            DataFrame with OHLCV data
        """
        if not self.api_key:
            return None

        import urllib.request
        import json

        try:
            # Normalize symbol for crypto/forex
            crypto_map = {"BTC-USD": "X:BTCUSD", "ETH-USD": "X:ETHUSD", "SOL-USD": "X:SOLUSD"}
            forex_map = {"EURUSD=X": "C:EURUSD", "GBPUSD=X": "C:GBPUSD", "USDJPY=X": "C:USDJPY"}

            polygon_symbol = symbol
            if symbol in crypto_map:
                polygon_symbol = crypto_map[symbol]
            elif symbol in forex_map:
                polygon_symbol = forex_map[symbol]

            # Map interval
            interval_map = {
                "1m": "1m", "5m": "5m", "15m": "15m", "30m": "30m",
                "1h": "1h", "4h": "4h", "1d": "D", "1w": "W", "1M": "M",
            }
            polygon_interval = interval_map.get(interval, "D")

            if not start_date:
                from datetime import datetime, timedelta  # noqa: F401
                now = datetime.utcnow()  # type: ignore[reportPossiblyUnboundVariable]
                start_date = (now - timedelta(days=365)).strftime("%Y-%m-%d")
            if not end_date:
                end_date = datetime.utcnow().strftime("%Y-%m-%d")  # type: ignore[reportPossiblyUnboundVariable]

            url = (
                f"https://api.polygon.io/v2/aggs/ticker/{polygon_symbol}/range/"
                f"1/{polygon_interval}/{start_date}/{end_date}"
                f"?adjusted=true&sort=asc&limit=50000&apiKey={self._get_api_key()}"
            )

            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            resp = urllib.request.urlopen(req, timeout=15)
            data = json.loads(resp.read().decode())

            if data and data.get("results"):
                results = data["results"]
                df = pd.DataFrame(results)

                # Rename columns to standard OHLCV
                col_map = {
                    "t": "timestamp",
                    "o": "open",
                    "h": "high",
                    "l": "low",
                    "c": "close",
                    "v": "volume",
                }
                df = df.rename(columns=col_map)

                # Convert timestamp to datetime (milliseconds)
                if "timestamp" in df.columns:
                    df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms", utc=True)
                    df.set_index("timestamp", inplace=True)

                # Keep only OHLCV
                df = df[["open", "high", "low", "close", "volume"]]
                return df.reset_index()

            return None
        except Exception as e:
            logger.debug(f"Polygon OHLCV fetch failed for {symbol}: {e}")
            return None

    def fetch_realtime_price(self, symbol: str) -> Optional[float]:
        """Get current price from Polygon."""
        if not self.api_key:
            return None

        import urllib.request
        import json

        try:
            crypto_map = {"BTC-USD": "X:BTCUSD", "ETH-USD": "X:ETHUSD", "SOL-USD": "X:SOLUSD"}
            forex_map = {"EURUSD=X": "C:EURUSD", "GBPUSD=X": "C:GBPUSD", "USDJPY=X": "C:USDJPY"}

            polygon_symbol = symbol
            if symbol in crypto_map:
                polygon_symbol = crypto_map[symbol]
            elif symbol in forex_map:
                polygon_symbol = forex_map[symbol]

            # Use last trade endpoint
            url = (
                f"https://api.polygon.io/v1/marketstatus/now"
                f"?apiKey={self._get_api_key()}"
            )

            # Or use the latest ticker
            url = (
                f"https://api.polygon.io/v2/reference/tickers/{polygon_symbol}"
                f"?apiKey={self._get_api_key()}"
            )

            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            resp = urllib.request.urlopen(req, timeout=10)
            data = json.loads(resp.read().decode())

            # For last trade: /v1/reference/tickers/{symbol}/last/trade
            url = (
                f"https://api.polygon.io/v1/reference/tickers/{polygon_symbol}/last/trade"
                f"?apiKey={self._get_api_key()}"
            )
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            resp = urllib.request.urlopen(req, timeout=10)
            data = json.loads(resp.read().decode())

            if data and data.get("results"):
                trade = data["results"]
                return float(trade.get("price", 0)) or None
            return None
        except Exception as e:
            logger.debug(f"Polygon realtime price fetch failed for {symbol}: {e}")
            return None
