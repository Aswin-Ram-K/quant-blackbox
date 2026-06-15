"""
Data endpoints — unified data service with multi-source support.
"""

from fastapi import APIRouter
from typing import Optional
from app.data.service import DataService

router = APIRouter()

# Global service instance
data_service = DataService()


@router.get("/sources")
def list_data_sources():
    """List all available data sources with their capabilities."""
    adapters = data_service.list_available_adapters()
    return {
        "sources": adapters,
        "total": len(adapters),
        "free_sources": len([a for a in adapters if a["tier"] == "free"]),
        "paid_sources": len([a for a in adapters if a["tier"] == "paid"]),
    }


@router.post("/fetch")
def fetch_market_data(
    symbol: str,
    interval: str = "1d",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    source: Optional[str] = None,
):
    """Fetch OHLCV data for a symbol."""
    try:
        df = data_service.fetch_ohlcv(
            symbol, start_date, end_date, interval, source
        )
        if df is None:
            return {"error": f"No data available for {symbol}"}
        return {
            "symbol": symbol,
            "data_points": len(df),
            "columns": list(df.columns),
            "first_date": str(df.index[0]) if len(df) > 0 else None,
            "last_date": str(df.index[-1]) if len(df) > 0 else None,
            "interval": interval,
            "source_used": "auto",  # Could track this per adapter
        }
    except Exception as e:
        return {"error": str(e)}


@router.get("/price/{symbol}")
def get_realtime_price(symbol: str):
    """Get current real-time price for a symbol."""
    try:
        price = data_service.fetch_realtime_price(symbol)
        if price is None:
            return {"error": f"No price data for {symbol}"}
        return {
            "symbol": symbol,
            "price": price,
        }
    except Exception as e:
        return {"error": str(e)}


@router.get("/fundamentals/{symbol}")
def get_fundamentals(symbol: str):
    """Get fundamental data for a symbol."""
    try:
        data = data_service.fetch_fundamentals(symbol)
        if data is None:
            return {"error": f"No fundamentals for {symbol}"}
        return {"symbol": symbol, "data": data}
    except Exception as e:
        return {"error": str(e)}


@router.get("/news/{symbol}")
def get_news(symbol: str, limit: int = 20):
    """Get recent news for a symbol."""
    try:
        news = data_service.fetch_news(symbol, limit)
        if news is None:
            return {"error": f"No news for {symbol}"}
        return {
            "symbol": symbol,
            "count": len(news),
            "articles": news,
        }
    except Exception as e:
        return {"error": str(e)}


@router.get("/sentiment/{symbol}")
def get_sentiment(symbol: str):
    """Get sentiment score for a symbol (-1.0 to 1.0)."""
    try:
        score = data_service.fetch_sentiment(symbol)
        if score is None:
            return {"error": f"No sentiment data for {symbol}"}
        return {
            "symbol": symbol,
            "sentiment": score,
            "interpretation": (
                "positive" if score > 0.2 else
                "negative" if score < -0.2 else
                "neutral"
            ),
        }
    except Exception as e:
        return {"error": str(e)}


@router.get("/macro")
def get_macro_data(
    series_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    bulk: bool = False,
):
    """
    Fetch macroeconomic data from FRED.

    Use series_id for a single series, or bulk=True for all series.
    Common series: FEDFUNDS, CPIAUCSL, UNRATE, DGS10, SP500
    """
    try:
        if bulk:
            df = data_service.fetch_macro_bulk(start_date=start_date, end_date=end_date)
            if df is None:
                return {"error": "No macro data available"}
            return {
                "type": "macro_bulk",
                "series": list(df.columns) if len(df.columns) > 1 else ["date"],
                "data_points": len(df),
            }
        elif series_id:
            df = data_service.fetch_macro(series_id, start_date, end_date)
            if df is None:
                return {"error": f"No macro data for {series_id}"}
            return {
                "type": "macro_single",
                "series": series_id,
                "data_points": len(df),
                "first_date": str(df["date"].iloc[0]) if len(df) > 0 else None,
                "last_date": str(df["date"].iloc[-1]) if len(df) > 0 else None,
            }
        else:
            return {"error": "Provide series_id or bulk=True"}
    except Exception as e:
        return {"error": str(e)}


@router.get("/orderbook/{symbol}")
def get_orderbook(symbol: str, depth: int = 20):
    """Get orderbook data for crypto/forex."""
    try:
        ob = data_service.fetch_orderbook(symbol, depth)
        if ob is None:
            return {"error": f"No orderbook for {symbol}"}
        return {
            "symbol": symbol,
            "depth": depth,
            "bids_count": len(ob.get("bids", [])),
            "asks_count": len(ob.get("asks", [])),
            "spread": (
                ob.get("asks", [{}])[0].get("price", 0) -
                ob.get("bids", [{}])[0].get("price", 0)
            ) if ob.get("asks") and ob.get("bids") else None,
        }
    except Exception as e:
        return {"error": str(e)}


@router.delete("/cache/{symbol}")
def clear_cache(symbol: str):
    """Clear cached data for a symbol."""
    try:
        from app.data.storage import delete_data
        deleted = delete_data(symbol)
        return {"symbol": symbol, "cache_cleared": deleted}
    except Exception as e:
        return {"error": str(e)}

