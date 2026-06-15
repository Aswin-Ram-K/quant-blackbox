"""
Quant Black Box — Data adapters package.

Unified adapters for all market data sources:
- Yahoo Finance (equities, forex, commodities)
- CCXT (crypto, 100+ exchanges)
- FRED (macroeconomic data)
- SEC EDGAR (fundamentals)
- Finnhub (news, sentiment, insider trading)
- Tiingo (multi-asset)
- Polygon.io (institutional quality, paid)
- Alpha Vantage (multi-asset)

Individual adapters are imported from their modules:
  from app.data.adapters.yahoo import YahooAdapter
  from app.data.adapters.ccxt_crypto import CCXTAdapter
  etc.

DataService lives in app.data.service — imported separately to avoid circular imports.
"""

from app.data.adapters.yahoo import YahooAdapter
from app.data.adapters.ccxt_crypto import CCXTAdapter
from app.data.adapters.fred import FREDAdapter
from app.data.adapters.sec_edgar import EDGARAdapter
from app.data.adapters.finnhub import FinnhubAdapter
from app.data.adapters.tiingo import TiingoAdapter
from app.data.adapters.polygon import PolygonAdapter
from app.data.adapters.alphavantage import AlphaVantageAdapter

__all__ = [
    "YahooAdapter",
    "CCXTAdapter",
    "FREDAdapter",
    "EDGARAdapter",
    "FinnhubAdapter",
    "TiingoAdapter",
    "PolygonAdapter",
    "AlphaVantageAdapter",
]
