"""
Market data fetcher — yfinance for equities/ETFs, CCXT for crypto, forex via yfinance
"""
import pandas as pd
from typing import Optional

try:
    import yfinance as yf
except ImportError:
    yf = None


def fetch_data(
    asset: str,
    timeframe: str = "1D",
    days: int = 365,
    adjust: bool = True,
) -> Optional[pd.DataFrame]:
    """Fetch market data for an asset.

    Args:
        asset: Asset symbol (e.g., 'AAPL', 'BTC-USD')
        timeframe: Data granularity ('1D', '1h', '5m', etc.)
        days: Lookback period in days
        adjust: Whether to adjust OHLCV for splits/dividends

    Returns:
        DataFrame with OHLCV data, or None on failure
    """
    if yf is None:
        return None

    try:
        ticker = yf.Ticker(asset)
        df = ticker.history(
            period=f"{days}d",
            interval=timeframe,
            auto_adjust=adjust,
        )
        if df is not None and len(df) > 0:
            return df
        return None
    except Exception:
        return None


def get_supported_assets() -> dict:
    """Return supported asset categories."""
    return {
        "equities": {
            "source": "yfinance",
            "symbols": [
                "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA",
                "SPY", "QQQ", "IWM", "VTI", "VOO",
            ],
            "tick_format": "{symbol}",
        },
        "crypto": {
            "source": "yfinance",  # Crypto via yfinance (BTC-USD)
            "symbols": [
                "BTC-USD", "ETH-USD", "SOL-USD", "ADA-USD",
                "DOT-USD", "MATIC-USD", "AVAX-USD",
            ],
            "tick_format": "{symbol}-USD",
        },
        "forex": {
            "source": "yfinance",
            "symbols": [
                "EURUSD=X", "GBPUSD=X", "USDJPY=X", "AUDUSD=X",
                "USDCAD=X", "USDCHF=X",
            ],
            "tick_format": "{base}{quote}=X",
        },
        "commodities": {
            "source": "yfinance",
            "symbols": [
                "GC=F", "CL=F", "SI=F", "HG=F",
                "ZC=F", "ZW=F", "ZB=F",
            ],
            "tick_format": "{symbol}={futures}",
        },
    }
