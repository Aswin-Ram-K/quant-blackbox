"""
Quant Black Box — Data persistence (SQLite + parquet).

Provides caching of fetched data so repeated requests for the same
asset/date range are served from disk rather than re-downloading.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

import pandas as pd

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data_store"
DATA_DIR.mkdir(exist_ok=True)


def store_data(asset: str, df: pd.DataFrame) -> Path:
    """Save OHLCV data to parquet for caching."""
    safe_name = asset.replace("/", "_").replace("=", "_").replace("-", "_")
    path = DATA_DIR / f"{safe_name}.parquet"
    df.to_parquet(path, index=False)
    logger.info(f"Stored {len(df)} bars for {asset} -> {path}")
    return path


def load_data(asset: str) -> Optional[pd.DataFrame]:
    """Load cached OHLCV data if available."""
    safe_name = asset.replace("/", "_").replace("=", "_").replace("-", "_")
    path = DATA_DIR / f"{safe_name}.parquet"
    if path.exists():
        df = pd.read_parquet(path)
        logger.info(f"Loaded {len(df)} cached bars for {asset}")
        return df
    return None


def delete_data(asset: str) -> bool:
    """Delete cached data for an asset."""
    safe_name = asset.replace("/", "_").replace("=", "_").replace("-", "_")
    path = DATA_DIR / f"{safe_name}.parquet"
    if path.exists():
        path.unlink()
        return True
    return False
