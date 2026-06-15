"""
Quant Black Box — Unified data service with adapter routing.

Routes requests to the right data adapter based on asset type,
with automatic fallback between sources.
"""

from __future__ import annotations

import logging
from typing import Optional

import pandas as pd

from app.data.adapters.yahoo import YahooAdapter
from app.data.adapters.ccxt_crypto import CCXTAdapter
from app.data.adapters.fred import FREDAdapter
from app.data.adapters.sec_edgar import EDGARAdapter
from app.data.adapters.finnhub import FinnhubAdapter
from app.data.adapters.tiingo import TiingoAdapter
from app.data.adapters.polygon import PolygonAdapter
from app.data.adapters.alphavantage import AlphaVantageAdapter
from app.data.storage import store_data, load_data, delete_data

logger = logging.getLogger(__name__)


class DataService:
    """
    Central data service that routes requests to the appropriate adapter.

    Supports:
    - OHLCV data from multiple sources
    - Fundamental data
    - Macroeconomic data
    - News and sentiment
    - Real-time prices
    - Automatic fallback between sources
    """

    def __init__(
        self,
        api_keys: Optional[dict] = None,
        use_cache: bool = True,
    ):
        """
        Initialize the data service.

        Args:
            api_keys: Dict of API keys for optional services
                e.g. {"finnhub": "key", "polygon": "key", "tiingo": "key"}
            use_cache: Whether to cache fetched data to disk
        """
        self.api_keys = api_keys or {}
        self.use_cache = use_cache

        # Initialize adapters
        self._yahoo = YahooAdapter()
        self._ccxt = CCXTAdapter()

        # Optional adapters (only if keys provided)
        self._fred = FREDAdapter(api_key=self.api_keys.get("fred"))
        self._edgar = EDGARAdapter()
        self._finnhub = FinnhubAdapter(api_key=self.api_keys.get("finnhub"))
        self._tiingo = TiingoAdapter(api_key=self.api_keys.get("tiingo"))
        self._polygon = PolygonAdapter(api_key=self.api_keys.get("polygon"))
        self._alphavantage = AlphaVantageAdapter(api_key=self.api_keys.get("alphavantage"))

        # Asset routing: determine primary adapter for each asset type
        self._asset_router: dict[str, list] = {
            "equities": [self._yahoo, self._finnhub, self._tiingo, self._polygon, self._alphavantage],
            "crypto": [self._ccxt, self._polygon, self._finnhub, self._tiingo],
            "forex": [self._yahoo, self._polygon, self._finnhub],
            "commodities": [self._yahoo, self._polygon, self._finnhub],
            "macro": [self._fred],
        }

    def _determine_asset_class(self, symbol: str) -> str:
        """Determine the asset class from the symbol."""
        upper = symbol.upper()
        if upper.endswith("=X"):
            return "forex"
        if "/" in upper or upper in ("BTC", "ETH", "SOL"):
            return "crypto"
        return "equities"

    def _get_adapter_for_asset(self, asset_class: str) -> list:
        """Get the list of adapters for an asset class."""
        return self._asset_router.get(asset_class, [self._yahoo])

    def fetch_ohlcv(
        self,
        symbol: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        interval: str = "1d",
        source: Optional[str] = None,
    ) -> Optional[pd.DataFrame]:
        """
        Fetch OHLCV data for a symbol, with fallback chain.

        Args:
            symbol: Asset symbol (e.g., 'AAPL', 'BTC-USD', 'EURUSD=X')
            start_date: Start date string (YYYY-MM-DD)
            end_date: End date string
            interval: Time interval ('1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w')
            source: Optional explicit source override

        Returns:
            DataFrame with OHLCV data, or None
        """
        # Try cached data first
        if self.use_cache:
            cached = load_data(symbol)
            if cached is not None and len(cached) > 0:
                logger.debug(f"Using cached data for {symbol}")
                return cached

        asset_class = self._determine_asset_class(symbol)
        adapters = self._get_adapter_for_asset(asset_class)

        # If source specified, only try that one
        if source:
            for adapter in adapters:
                if adapter.name.lower() == source.lower() or type(adapter).__name__.lower() == source.lower():
                    df = adapter.fetch_ohlcv(symbol, start_date, end_date, interval)
                    if df is not None:
                        if self.use_cache:
                            store_data(symbol, df)
                        return df
                    break
            return None

        # Try fallback chain
        for adapter in adapters:
            try:
                df = adapter.fetch_ohlcv(symbol, start_date, end_date, interval)
                if df is not None and len(df) > 0:
                    logger.info(f"Fetched {len(df)} bars for {symbol} from {adapter.name}")
                    if self.use_cache:
                        store_data(symbol, df)
                    return df
            except Exception as e:
                logger.debug(f"{adapter.name} failed for {symbol}: {e}")
                continue

        return None

    def fetch_realtime_price(self, symbol: str) -> Optional[float]:
        """Get current price with fallback chain."""
        asset_class = self._determine_asset_class(symbol)
        adapters = self._get_adapter_for_asset(asset_class)

        for adapter in adapters:
            try:
                price = adapter.fetch_realtime_price(symbol)
                if price is not None:
                    logger.info(f"Realtime price for {symbol} from {adapter.name}: {price}")
                    return price
            except Exception:
                continue
        return None

    def fetch_fundamentals(self, symbol: str) -> Optional[dict]:
        """Get fundamentals with fallback chain."""
        adapters = self._get_adapter_for_asset("equities")
        for adapter in adapters:
            try:
                if hasattr(adapter, 'fetch_fundamentals'):
                    data = adapter.fetch_fundamentals(symbol)
                    if data:
                        logger.info(f"Fetched fundamentals for {symbol} from {adapter.name}")
                        return data
            except Exception:
                continue
        return None

    def fetch_news(self, symbol: str, limit: int = 20) -> Optional[list[dict]]:
        """Get news with fallback chain."""
        adapters = self._get_adapter_for_asset("equities")
        for adapter in adapters:
            try:
                if hasattr(adapter, 'fetch_news'):
                    news = adapter.fetch_news(symbol, limit)
                    if news:
                        logger.info(f"Fetched {len(news)} news articles for {symbol} from {adapter.name}")
                        return news
            except Exception:
                continue
        return None

    def fetch_sentiment(self, symbol: str) -> Optional[float]:
        """Get sentiment score with fallback chain."""
        adapters = self._get_adapter_for_asset("equities")
        for adapter in adapters:
            try:
                if hasattr(adapter, 'fetch_sentiment'):
                    score = adapter.fetch_sentiment(symbol)
                    if score is not None:
                        return score
            except Exception:
                continue
        return None

    def fetch_macro(self, series_id: str, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Optional[pd.DataFrame]:
        """Fetch macroeconomic data from FRED."""
        return self._fred.fetch_macro(series_id, start_date, end_date)

    def fetch_macro_bulk(self, series_ids: Optional[list[str]] = None, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Optional[pd.DataFrame]:
        """Fetch multiple macro series at once."""
        return self._fred.fetch_macro_bulk(series_ids, start_date, end_date)

    def fetch_orderbook(self, symbol: str, depth: int = 20) -> Optional[dict]:
        """Get orderbook data for crypto/forex."""
        asset_class = self._determine_asset_class(symbol)
        adapters = self._get_adapter_for_asset(asset_class)
        for adapter in adapters:
            try:
                if hasattr(adapter, 'fetch_orderbook'):
                    ob = adapter.fetch_orderbook(symbol, depth)
                    if ob:
                        return ob
            except Exception:
                continue
        return None

    def list_available_adapters(self) -> list[dict]:
        """List all available adapters and their capabilities."""
        return [
            {"name": "Yahoo Finance", "asset_classes": ["equities", "forex", "commodities"], "tier": "free", "has_fundamentals": True, "has_realtime": True, "has_news": False},
            {"name": "CCXT", "asset_classes": ["crypto"], "tier": "free", "has_fundamentals": False, "has_realtime": True, "has_orderbook": True, "has_news": False},
            {"name": "FRED", "asset_classes": ["macro"], "tier": "free", "has_fundamentals": False, "has_realtime": False, "has_news": False},
            {"name": "SEC EDGAR", "asset_classes": ["equities"], "tier": "free", "has_fundamentals": True, "has_realtime": False, "has_news": False},
            {"name": "Finnhub", "asset_classes": ["equities", "crypto", "forex"], "tier": "free", "has_fundamentals": False, "has_realtime": True, "has_news": True, "has_sentiment": True},
            {"name": "Tiingo", "asset_classes": ["equities", "crypto", "forex", "commodities"], "tier": "free", "has_fundamentals": False, "has_realtime": True, "has_news": True},
            {"name": "Polygon.io", "asset_classes": ["equities", "crypto", "forex", "options", "commodities"], "tier": "paid", "has_fundamentals": False, "has_realtime": True},
            {"name": "Alpha Vantage", "asset_classes": ["equities", "forex", "crypto", "commodities"], "tier": "free", "has_fundamentals": False, "has_realtime": True},
        ]
