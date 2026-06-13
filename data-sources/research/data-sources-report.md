# Market Data Sources — Quant Black Box
**Date: June 2026** | **Scope: Free → Paid, cheapest entry → highest impact**

---

## Tier 0: ZERO COST (Free Forever)

### 1. yfinance — **Primary Data Source** ✅ Already integrated
- **What:** Historical and real-time quotes for stocks, ETFs, crypto, forex, commodities via Yahoo Finance
- **Coverage:** All US equities, ETFs, crypto, forex pairs, major commodities
- **Data types:** OHLCV (1m to 1D), dividends, splits
- **Limits:** ~2,000 requests/day per IP, rate-limited real-time
- **Impact:** ★★★★★ — Covers every market we need, completely free
- **Best for:** Daily/hourly backtesting, strategy development, regime detection
- **Install:** `pip install yfinance`

```python
# Crypto: BTC-USD, ETH-USD, SOL-USD
# Equities: AAPL, MSFT, SPY, QQQ
# Forex: EURUSD=X, GBPUSD=X
# Commodities: GC=F (gold), CL=F (crude oil), SI=F (silver)
```

### 2. CCXT — **Primary Crypto Source** ✅ Already integrated
- **What:** Unified API for 100+ crypto exchanges (Binance, Coinbase, Kraken, etc.)
- **Coverage:** 5000+ trading pairs across all major exchanges
- **Data types:** OHLCV, order books, trades, tickers
- **Limits:** Exchange-specific rate limits (usually generous)
- **Impact:** ★★★★★ — Only way to get granular crypto data for free
- **Best for:** Crypto-specific backtesting, crypto arbitrage, granular crypto OHLCV

### 3. FRED API — **Macro Data**
- **What:** Federal Reserve Economic Data — interest rates, CPI, GDP, unemployment
- **Coverage:** 800,000+ economic time series
- **Cost:** Completely free, no key required for modest usage
- **Impact:** ★★★★☆ — Essential for regime classification (bull/bear/Chop)
- **Best for:** Economic regime detection, macro overlay on strategies

### 4. SEC EDGAR — **Fundamental Data**
- **What:** SEC filings (10-K, 10-Q, 8-K) for all public companies
- **Coverage:** All US-listed companies, 20+ years of history
- **Cost:** Free, no API key needed
- **Impact:** ★★★☆☆ — Good for fundamental strategies, quality factor
- **Best for:** Earnings data, balance sheet analysis, dividend screening

---

## Tier 1: VERY LOW COST ($0–$30/mo)

### 5. Alpha Vantage — **Free Tier (5 calls/min, 500/day)**
- **Cost:** Free tier (500 calls/day), Pro: $49.99/mo
- **What:** Real-time + historical stock, forex, crypto, commodities, technical indicators
- **Impact:** ★★★☆☆ — Good supplement to yfinance for real-time
- **Best for:** Real-time quotes when yfinance is rate-limited

### 6. Finnhub — **Free Tier (60 calls/min)**
- **Cost:** Free tier (60 calls/min, 60 credits/sec), Pro: $199/mo
- **What:** Real-time quotes, news, earnings, insider trading, fundamental data
- **Impact:** ★★★☆☆ — Excellent for news/sentiment overlay
- **Best for:** News sentiment analysis, insider trading signals

### 7. FCSAPI — **Free Tier (100 req/day)**
- **Cost:** Free tier (100 req/day), Starter: $5/mo, Pro: $19/mo
- **What:** 100+ forex pairs, 20+ stock indices, commodities, crypto
- **Impact:** ★★★☆☆ — Cheap forex coverage
- **Best for:** Forex trading, cheap forex data

### 8. Tiingo — **Free Tier (50 symbols/hr)**
- **Cost:** Free tier (50 symbols/hr), Pro: $29/mo
- **What:** Real-time quotes, historical EOD, news, fundamentals, mutual funds
- **Impact:** ★★★★☆ — Higher quality than yfinance, free tier is decent
- **Best for:** Higher quality historical data, news sentiment

---

## Tier 2: MODERATE COST ($30–$100/mo)

### 9. Polygon.io (now Massive) — **Best Paid Option**
- **Cost:** Free (5 req/min, delayed data), Starter: $29/mo, Growth: $199/mo
- **What:** Real-time + historical tick data, options, forex, crypto
- **Impact:** ★★★★★ — Institutional quality data
- **Best for:** When you need real-time tick-level data for live trading

### 10. Twelve Data — **Free Tier (800 req/day)**
- **Cost:** Free (800 req/day), Starter: $49/mo
- **What:** Real-time + historical quotes, forex, crypto, commodities, indicators
- **Impact:** ★★★☆☆ — Good all-rounder
- **Best for:** Multi-asset coverage when other sources fail

### 11. MarketStack — **Free Tier (100 req/month!)**
- **Cost:** Free (100 req/month), Basic: $10/mo, Pro: $25/mo
- **What:** Real-time quotes, historical data, fundamentals, dividends
- **Impact:** ★★★☆☆ — Cheap but very limited free tier
- **Best for:** Occasional fundamental data

---

## Tier 3: HIGH IMPACT ($100–$300/mo)

### 12. Interactive Brokers API — **Free with Account**
- **Cost:** FREE — just need an IBKR account, $0/month minimum
- **What:** Real-time quotes, historical data, live trading, options, futures, forex, commodities
- **Impact:** ★★★★★ — One API covers ALL markets + live execution
- **Best for:** Live multi-asset trading (replaces separate data feeds)
- **Note:** Requires account verification, minimum $10k for margin

### 13. Alpaca — **Free Paper Trading**
- **Cost:** FREE for paper trading, commissions apply for live
- **What:** Real-time + historical US equities, options, crypto
- **Impact:** ★★★★☆ — Already integrated for paper trading
- **Best for:** Paper trading, backtesting US equities

---

## RECOMMENDATION

| Market | Primary Source | Backup | Upgrade Path |
|--------|---------------|--------|--------------|
| **Equities** | yfinance (free) | Alpha Vantage (free) | Tiingo ($29/mo) or Polygon ($29/mo) |
| **Crypto** | CCXT (free) | yfinance (free) | Polygon ($29/mo) for real-time |
| **Forex** | yfinance (free) | FCSAPI ($5/mo) | Polygon ($29/mo) |
| **Commodities** | yfinance (free) | Alpha Vantage (free) | Polygon ($29/mo) |
| **Macro** | FRED (free) | — | — |
| **Fundamental** | SEC EDGAR (free) | FCSAPI ($5/mo) | Polygon ($29/mo) |
| **News/Sentiment** | Reddit API (free) | Finnhub (free) | Polygon ($29/mo) |
| **Live Trading** | Alpaca (free paper) | IBKR API (free) | IBKR live ($0–$1/mo) |

**Total monthly cost: $0** with current setup
**Full coverage upgrade: $29/mo** (Polygon/Starter tier covers equities, crypto, forex, commodities, options)
**Live trading: $0** (Alpaca paper, IBKR account)

---

## Data Quality Comparison

| Source | Accuracy | Update Frequency | Historical Depth | Reliability |
|--------|----------|-----------------|-----------------|-------------|
| yfinance | ★★★☆☆ | ~5 min delayed | 10+ years | Moderate (rate limited) |
| CCXT | ★★★★☆ | Real-time | 5+ years per exchange | High |
| Tiingo | ★★★★☆ | Real-time (delayed free) | 20+ years | High |
| Polygon | ★★★★★ | Real-time tick | 10+ years | Very High |
| FRED | ★★★★★ | Monthly/Quarterly | 30+ years | Very High |
| IBKR | ★★★★★ | Real-time tick | 10+ years | Very High |

---

*Research compiled June 2026. All pricing accurate as of this date.*
