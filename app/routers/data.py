"""
Data endpoints
"""
from fastapi import APIRouter
from typing import List
from app.data.fetcher import fetch_data

router = APIRouter()


@router.get("/sources")
def list_data_sources():
    """List configured data sources."""
    return {
        "equities": {"yfinance": "free"},
        "crypto": {"ccxt": "free"},
        "forex": {"yfinance": "free"},
    }


@router.post("/fetch")
def fetch_market_data(asset: str, timeframe: str, days: int = 365):
    """Fetch market data for an asset."""
    try:
        df = fetch_data(asset, timeframe, days)
        return {
            "asset": asset,
            "data_points": len(df),
            "columns": list(df.columns) if df is not None else [],
            "first_date": str(df.index[0]) if df is not None and len(df) > 0 else None,
            "last_date": str(df.index[-1]) if df is not None and len(df) > 0 else None,
        }
    except Exception as e:
        return {"error": str(e)}
