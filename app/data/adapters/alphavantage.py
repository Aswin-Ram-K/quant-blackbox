"""
Alpha Vantage Adapter — Multi-asset data.

Free tier: 5 calls/min, 500/day.
Pro tier: $49.99/mo.

Covers: equities, forex, crypto, commodities, technical indicators.
"""

from __future__ import annotations

import logging
import os
from typing import Optional

import pandas as pd

logger = logging.getLogger(__name__)

ALPHAVANTAGE_API_KEY=os.environ.get("ALPHAVANTAGE_API_KEY", "")


class AlphaVantageAdapter:
    """Data adapter for Alpha Vantage API."""

    name = "Alpha Vantage"
    asset_classes = ["equities", "forex", "crypto", "commodities"]
    tier = "free"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or ALPHAVANTAGE_API_KEY

    def _get_api_key(self) -> str:
        if not self.api_key:
            raise ValueError("Alpha Vantage API key required. Set ALPHA_VANTAGE_API_KEY env var or pass api_key param.")
        return self.api_key

    def fetch_ohlcv(
        self,
        symbol: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        interval: str = "1d",
    ) -> Optional[pd.DataFrame]:
        """Fetch OHLCV data from Alpha Vantage."""
        if not self.api_key:
            return None

        import urllib.request
        import json

        try:
            # Map interval to Alpha Vantage function
            if interval in ("1m", "5m", "15m", "30m", "60m"):
                # Use TIME_SERIES_INTRADAY
                interval_map = {
                    "1m": "1min", "5m": "5min", "15m": "15min",
                    "30m": "30min", "60m": "60min",
                }
                av_interval = interval_map.get(interval, "60min")

                url = (
                    f"https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY"
                    f"&symbol={symbol}&interval={av_interval}"
                    f"&outputsize=compact&apikey={self._get_api_key()}"
                )
            else:
                # Use TIME_SERIES_DAILY or WEEKLY or MONTHLY
                if interval == "1w":
                    func = "TIME_SERIES_WEEKLY"
                elif interval == "1M":
                    func = "TIME_SERIES_MONTHLY"
                else:
                    func = "TIME_SERIES_DAILY"

                url = (
                    f"https://www.alphavantage.co/query?function={func}"
                    f"&symbol={symbol}&outputsize=compact&apikey={self._get_api_key()}"
                )

            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            resp = urllib.request.urlopen(req, timeout=15)
            data = json.loads(resp.read().decode())

            # Parse the response — structure depends on function
            if "Time Series (1min)" in data:
                ts_key = "Time Series (1min)"
            elif "Weekly Time Series" in data:
                ts_key = "Weekly Time Series"
            elif "Monthly Time Series" in data:
                ts_key = "Monthly Time Series"
            else:
                ts_key = "Time Series (Daily)"

            ts_data = data.get(ts_key, {})
            if not ts_data:
                return None

            # Convert to DataFrame
            rows = []
            for date_str, values in ts_data.items():
                rows.append({
                    "date": date_str,
                    "open": float(values.get("1. open", 0)),
                    "high": float(values.get("2. high", 0)),
                    "low": float(values.get("3. low", 0)),
                    "close": float(values.get("4. close", 0)),
                    "volume": int(values.get("5. volume", 0)),
                })

            if rows:
                df = pd.DataFrame(rows)
                df["date"] = pd.to_datetime(df["date"])
                df.set_index("date", inplace=True)
                return df
            return None

        except Exception as e:
            logger.debug(f"Alpha Vantage OHLCV fetch failed for {symbol}: {e}")
            return None

    def fetch_realtime_price(self, symbol: str) -> Optional[float]:
        """Get current price from Alpha Vantage."""
        if not self.api_key:
            return None

        import urllib.request
        import json

        try:
            url = (
                f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE"
                f"&symbol={symbol}&apikey={self._get_api_key()}"
            )
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            resp = urllib.request.urlopen(req, timeout=10)
            data = json.loads(resp.read().decode())

            if "Global Quote" in data:
                quote = data["Global Quote"]
                price_str = quote.get("05. price", "")
                if price_str:
                    return float(price_str)
            return None
        except Exception as e:
            logger.debug(f"Alpha Vantage realtime price fetch failed for {symbol}: {e}")
            return None
