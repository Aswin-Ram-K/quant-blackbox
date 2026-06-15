"""
FRED Adapter — Federal Reserve Economic Data.

Provides macroeconomic time series for regime classification.
No API key required for modest usage.
"""

from __future__ import annotations

import logging
from typing import Optional

import pandas as pd

logger = logging.getLogger(__name__)

try:
    import fredapi as _fredapi  # noqa: F401
    FRED_AVAILABLE = True
    fredapi = _fredapi  # type: ignore
except ImportError:
    FRED_AVAILABLE = False
    fredapi = None  # type: ignore


# Common macro series IDs we care about
MACRO_SERIES = {
    "fed_funds_rate": "FEDFUNDS",        # Effective federal funds rate
    "cpi": "CPIAUCSL",                    # Consumer Price Index
    "unemployment": "UNRATE",             # Unemployment rate
    "gdp": "GDP",                         # Gross Domestic Product
    "gdp_growth": "A191RL1Q225SBEA",      # Real GDP growth rate
    "treasury_2y": "TWSF2YI",             # 2-year Treasury yield
    "treasury_10y": "DGS10",              # 10-year Treasury yield
    "treasury_3m": "DTB3MAT",             # 3-month Treasury bill
    "yield_curve": "SP500",               # S&P 500 index
    "vix": "VIXFK",                       # VIX for equities
    "m2_money_supply": "M2SL",            # M2 money supply
    "consumer_confidence": "CCCIMP",      # Consumer Confidence
    "industrial_production": "INDPRO",     # Industrial Production
    "retail_sales": "RSAKS",               # Retail Sales
    "housing_starts": "HOUST",             # Housing Starts
    "ISM_manufacturing": "MANEMP",         # ISM Employment
    "joltas": "JTSJOL",                    # Job openings
    "dxy": "DXY",                          # Dollar Index
}


class FREDAdapter:
    """Data adapter for FRED macroeconomic data."""

    name = "FRED"
    asset_classes = ["macro"]
    tier = "free"

    def __init__(self, api_key: Optional[str] = None):
        """Initialize FRED adapter.

        Args:
            api_key: FRED API key. Optional — public key works for low volume.
                     Set env var FRED_API_KEY or pass here.
        """
        self.api_key = api_key
        self._fred: any = None

    def _get_connection(self):
        """Lazy-init FRED connection."""
        if self._fred is None and FRED_AVAILABLE and fredapi is not None:  # type: ignore[reportAttributeAccessIssue]
            try:
                key = self.api_key or "YOUR_PUBLIC_KEY"  # public key works
                self._fred = fredapi.Fred(key=key)  # type: ignore[reportOptionalMemberAccess]
            except Exception as e:
                logger.debug(f"FRED init failed: {e}")
        return self._fred

    def fetch_macro(
        self,
        series_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Optional[pd.DataFrame]:
        """Fetch a macroeconomic time series from FRED.

        Args:
            series_id: FRED series ID (e.g., 'FEDFUNDS', 'CPIAUCSL')
            start_date: Start date string (e.g., '2020-01-01')
            end_date: End date string

        Returns:
            DataFrame with date index and value column
        """
        fred = self._get_connection()
        if fred is None:
            return None

        try:
            if start_date and end_date:
                data = fred.get_series(series_id, observation_start=start_date, observation_end=end_date)
            else:
                data = fred.get_series(series_id)

            if data is not None and len(data) > 0:
                df = pd.DataFrame({series_id: data})
                df.index.name = "date"
                df.reset_index(inplace=True)
                df.columns = ["date", series_id]
                return df
            return None
        except Exception as e:
            logger.debug(f"FRED fetch failed for {series_id}: {e}")
            return None

    def fetch_macro_bulk(
        self,
        series_ids: Optional[list[str]] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Optional[pd.DataFrame]:
        """Fetch multiple series and merge into a single DataFrame.

        Args:
            series_ids: List of FRED series IDs. Defaults to MACRO_SERIES values.
            start_date: Start date
            end_date: End date

        Returns:
            DataFrame with date index and one column per series
        """
        fred = self._get_connection()
        if fred is None:
            return None

        if series_ids is None:
            series_ids = list(MACRO_SERIES.values())

        frames = []
        for sid in series_ids:
            try:
                if start_date and end_date:
                    data = fred.get_series(sid, observation_start=start_date, observation_end=end_date)
                else:
                    data = fred.get_series(sid)
                if data is not None and len(data) > 0:
                    frames.append(data.to_frame(name=sid))
            except Exception:
                continue

        if frames:
            result = pd.concat(frames, axis=1)
            result = result.dropna(how="all")
            return result.reset_index()
        return None
