"""
CCXT Adapter — Multi-exchange crypto data.

Provides OHLCV, orderbooks, and real-time prices from 100+ exchanges.
"""

from __future__ import annotations

import logging
from typing import Optional

import pandas as pd  # noqa: E402

logger = logging.getLogger(__name__)

try:
    import ccxt as _ccxt  # noqa: F401
    CCXT_AVAILABLE = True
    ccxt = _ccxt  # type: ignore
except ImportError:
    CCXT_AVAILABLE = False
    ccxt = None  # type: ignore


class CCXTAdapter:
    """Data adapter for crypto via CCXT."""

    name = "CCXT"
    asset_classes = ["crypto"]
    tier = "free"

    # Default exchanges to try
    DEFAULT_EXCHANGES = ["binance", "coinbase", "kraken"]

    def __init__(self, exchanges: Optional[list[str]] = None):
        self.exchange_names = exchanges or self.DEFAULT_EXCHANGES
        self._exchanges: dict[str, any] = {}
        self._init_exchanges()

    def _init_exchanges(self):
        """Initialize exchange instances."""
        for ex_name in self.exchange_names:
            try:
                exchange_class = getattr(ccxt, ex_name, None)
                if exchange_class:
                    exchange = exchange_class({
                        "enableRateLimit": True,
                        "options": {
                            "defaultType": "spot",
                        }
                    })
                    self._exchanges[ex_name] = exchange
            except Exception as e:
                logger.debug(f"Failed to init CCXT exchange {ex_name}: {e}")

    def fetch_ohlcv(
        self,
        symbol: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        interval: str = "1d",
    ) -> Optional[pd.DataFrame]:
        """Fetch OHLCV data from crypto exchanges."""
        if not CCXT_AVAILABLE:
            return None

        # Normalize symbol: BTC/USD -> BTC/USDT if needed
        if symbol.endswith("/USD"):
            symbol = symbol.replace("/USD", "/USDT")
        elif "/" not in symbol:
            # Check if it looks like a symbol like BTC, ETH, etc.
            if symbol.upper() in ("BTC", "ETH", "SOL", "ADA", "DOT", "MATIC", "AVAX"):
                symbol = f"{symbol.upper()}/USDT"

        timeframe_map = {
            "1m": "1m", "5m": "5m", "15m": "15m", "30m": "30m",
            "1h": "1h", "4h": "4h", "1d": "1d", "1w": "1w",
        }
        timeframe = timeframe_map.get(interval, "1d")

        since_ms = None
        if start_date:
            from datetime import datetime  # noqa: F401
            if isinstance(start_date, str):
                try:
                    dt = pd.Timestamp(start_date)
                    if dt is not pd.NaT:
                        since_ms = int(dt.timestamp() * 1000)  # type: ignore[union-attr]
                except (ValueError, TypeError):
                    pass

        for ex_name, exchange in self._exchanges.items():
            try:
                # Load markets first time
                if not exchange.markets:
                    exchange.load_markets()

                if symbol not in exchange.markets:
                    continue

                if since_ms:
                    raw = exchange.fetch_ohlcv(
                        symbol, timeframe, since=since_ms, limit=1000
                    )
                else:
                    raw = exchange.fetch_ohlcv(
                        symbol, timeframe, limit=1000
                    )

                if raw and len(raw) > 0:
                    df = pd.DataFrame(
                        raw, columns=["timestamp", "open", "high", "low", "close", "volume"]
                    )
                    df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms", utc=True)
                    df.set_index("timestamp", inplace=True)
                    return df
                return None

            except Exception as e:
                logger.debug(f"CCXT {ex_name} failed for {symbol}: {e}")
                continue
        return None

    def fetch_realtime_price(self, symbol: str) -> Optional[float]:
        """Get current price from crypto exchanges."""
        if not CCXT_AVAILABLE:
            return None

        if symbol.endswith("/USD"):
            symbol = symbol.replace("/USD", "/USDT")
        elif "/" not in symbol:
            if symbol.upper() in ("BTC", "ETH", "SOL", "ADA", "DOT", "MATIC", "AVAX"):
                symbol = f"{symbol.upper()}/USDT"

        for ex_name, exchange in self._exchanges.items():
            try:
                if not exchange.markets:
                    exchange.load_markets()
                if symbol in exchange.markets:
                    ticker = exchange.fetch_ticker(symbol)
                    return float(ticker.get("last", 0)) or None
            except Exception:
                continue
        return None

    def fetch_orderbook(self, symbol: str, depth: int = 20) -> Optional[dict]:
        """Fetch orderbook data."""
        if not CCXT_AVAILABLE:
            return None

        if symbol.endswith("/USD"):
            symbol = symbol.replace("/USD", "/USDT")

        for ex_name, exchange in self._exchanges.items():
            try:
                if not exchange.markets:
                    exchange.load_markets()
                if symbol in exchange.markets:
                    ob = exchange.fetch_order_book(symbol, limit=depth)
                    return {
                        "symbol": symbol,
                        "exchanges": [ex_name],
                        "bids": ob.get("bids", []),
                        "asks": ob.get("asks", []),
                    }
            except Exception:
                continue
        return None
