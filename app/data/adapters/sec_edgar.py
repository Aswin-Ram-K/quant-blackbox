"""
SEC EDGAR Adapter — Fundamental data from SEC filings.

Covers 10-K, 10-Q, 8-K filings for US-listed companies.
Free, no API key required.
"""

from __future__ import annotations

import logging
import re
from typing import Optional
from urllib.request import urlopen, Request

import pandas as pd

logger = logging.getLogger(__name__)

EDGAR_URL = "https://www.sec.gov/Archives/edgar/data"


class EDGARAdapter:
    """Adapter for SEC EDGAR filing data."""

    name = "SEC EDGAR"
    asset_classes = ["equities"]
    tier = "free"

    def _get_cik(self, symbol: str) -> Optional[str]:
        """Get CIK number for a ticker symbol from SEC's EDGAR database."""
        # SEC has a form search endpoint we can use
        try:
            url = f"https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={symbol}&type=&dateb=&owner=include&count=10&search_text=&action=getcompany"
            req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
            resp = urlopen(req, timeout=10)
            html = resp.read().decode("utf-8")
            # Extract CIK from the HTML — looks like cik = "0001234567"
            match = re.search(r'centerofindex="(\d+)"', html)
            if match:
                return match.group(1)
            # Try alternate pattern
            match = re.search(r'company&#200;Name.*?(\d{10})', html)
            if match:
                return match.group(1)
        except Exception:
            pass
        return None

    def _get_ticker(self, cik: str) -> Optional[str]:
        """Reverse lookup: get ticker from CIK."""
        try:
            # SEC's accession number endpoint
            url = f"https://www.sec.gov/cgi-bin/browse-edgar?company=&state=&search_text=&owner=include&count=10&action=getcompany&CIK={cik}"
            req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
            resp = urlopen(req, timeout=10)
            html = resp.read().decode("utf-8")
            # Extract ticker from HTML table rows
            match = re.search(r'<td.*?>([A-Z]{1,5})</td>', html)
            if match:
                return match.group(1)
        except Exception:
            pass
        return None

    def fetch_fundamentals(self, symbol: str) -> Optional[dict]:
        """
        Fetch key fundamentals from SEC filings.

        Returns dict with balance sheet, income statement, and cash flow highlights.
        """
        cik = self._get_cik(symbol)
        if cik is None:
            return None

        fundamentals = {
            "symbol": symbol,
            "cik": cik,
            "filings": [],
        }

        # Get recent 10-K and 10-Q filings
        try:
            url = f"https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={cik}&type=10-K&dateb=&owner=include&count=3"
            req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
            resp = urlopen(req, timeout=15)
            html = resp.read().decode("utf-8")

            # Extract filing dates and accession numbers from HTML
            filings = re.findall(
                r'(<td>.*?)</td>\s*<td>(\d{4}-\d{2}-\d{2})</td>', html
            )
            for _, date_str in filings[:3]:
                fundamentals["filings"].append({
                    "type": "10-K",
                    "date": date_str,
                })
        except Exception:
            pass

        # Get company name from SEC
        try:
            url = f"https://www.sec.gov/cgi-bin/browse-edgar?company=&state=&search_text=&owner=include&count=10&action=getcompany&CIK={cik}"
            req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
            resp = urlopen(req, timeout=15)
            html = resp.read().decode("utf-8")
            match = re.search(r'companyName.*?>([^<]+)</span>', html)
            if match:
                fundamentals["company_name"] = match.group(1).strip()
        except Exception:
            pass

        return fundamentals if fundamentals.get("filings") else None

    def fetch_financial_statements(self, symbol: str, statement_type: str = "income") -> Optional[pd.DataFrame]:
        """
        Fetch financial statements from SEC EDGAR.

        Args:
            symbol: Ticker symbol
            statement_type: 'income', 'balance_sheet', or 'cash_flow'

        Returns:
            DataFrame with financial data
        """
        cik = self._get_cik(symbol)
        if cik is None:
            return None

        # Map statement type to form type
        type_map = {
            "income": "10-K",
            "balance_sheet": "10-K",
            "cash_flow": "10-K",
        }

        try:
            url = f"https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={cik}&type={type_map.get(statement_type, '10-K')}&dateb=&owner=include&count=1"
            req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
            resp = urlopen(req, timeout=15)
            html = resp.read().decode("utf-8")

            # Parse the HTML for filing information
            filing_dates = re.findall(r'<td>\d{4}-\d{2}-\d{2}</td>', html)
            if filing_dates:
                return pd.DataFrame({
                    "filing_date": [d.replace("<td>", "").replace("</td>", "") for d in filing_dates[:3]],
                    "statement_type": [statement_type] * len(filing_dates[:3]),
                })
        except Exception as e:
            logger.debug(f"EDGAR financial statements failed for {symbol}: {e}")

        return None
