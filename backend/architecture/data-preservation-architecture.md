# Backend Architecture — Data Preservation & API Design
**Date: June 2026**

---

## The Problem
Right now our system:
1. Fetches data → uses it → throws it away
2. No persistent indexing of research
3. No structured storage of backtest results
4. No redundancy or backup strategy

## The Goal
Build a **permanent knowledge base** that:
- Stores ALL research, backtests, and qualitative factors
- Preserves data with redundancy
- Provides a clean API for future strategy development
- Grows in value over time (unlike disposable data)

---

## Architecture

### Layer 1: Data Ingestion Engine (ETL)
```python
# /backend/data_ingestion/
├── news_sentiment.py     # Finnhub + GDELT news ingestion
├── geopolitical.py       # GDELT geopolitical events
├── economic.py           # FRED economic indicators
├── market_data.py        # yfinance + CCXT price data
├── social.py             # Reddit/Twitter/Google Trends
└── scheduler.py          # Cron-like scheduler for all ingesters
```

**What it does:**
- Runs on a schedule (every 6h for news, daily for economic, weekly for social)
- Stores raw data to `data/raw/` as immutable timestamped files
- Cleans and normalizes data, stores to `data/processed/`
- Logs every fetch operation for auditing

### Layer 2: Database Layer
```
Backend Database (PostgreSQL):
├── qualitative_data/       # News sentiment, geopolitical events
├── market_data/            # Price data, OHLCV
├── backtest_results/       # All backtest runs stored permanently
├── strategy_performance/   # Live strategy performance tracking
├── research_metadata/      # Indexes, tags, categories for research
└── system_log/             # All operations logged
```

**Why PostgreSQL over SQLite:**
- Better concurrent access
- Full-text search for research indexing
- Better query performance on large datasets
- Can migrate to cloud later if needed

### Layer 3: REST API Layer
```python
# /backend/api/
├── data_api.py             # GET/POST research data
├── backtest_api.py         # GET/POST backtest results
├── strategy_api.py         # GET/POST strategy configs
├── qualitative_api.py      # GET/POST sentiment/ geopolitical data
├── indexing_api.py         # Search, tag, categorize research
└── backup_api.py           # Trigger backup, view status
```

**API Endpoints (Examples):**

```
# Data Ingestion
POST /api/v1/data/ingest/news          # Ingest news articles
POST /api/v1/data/ingest/sentiment     # Ingest sentiment scores
POST /api/v1/data/ingest/geopolitical  # Ingest geopolitical events

# Research & Indexing
GET  /api/v1/research/search?q=AI+sentiment    # Search research
POST /api/v1/research/tag                       # Tag research items
GET  /api/v1/research/category/sentiment        # Get all sentiment research
POST /api/v1/research/index                     # Index new research

# Backtesting
POST /api/v1/backtest/run                      # Run new backtest
GET  /api/v1/backtest/{id}                     # Get backtest results
GET  /api/v1/backtest/comparison               # Compare multiple backtests
GET  /api/v1/backtest/results?q=high_sharpe    # Search by metrics

# Strategies
GET  /api/v1/strategies                        # List all strategies
POST /api/v1/strategies/evaluate               # Evaluate strategy on data
GET  /api/v1/strategies/performance            # Get performance history

# Data Quality & Monitoring
GET  /api/v1/data/status                       # Check data freshness
GET  /api/v1/data/ingestion/stats              # Ingestion stats
POST /api/v1/data/backup                       # Trigger backup
GET  /api/v1/data/backup/status                # Backup status
```

### Layer 4: Data Preservation & Backup System
```python
# /backend/data_backup/
├── backup_engine.py      # Automated backup scheduler
├── rsync_sync.py         # Remote server sync
├── cloud_sync.py         # Cloud storage sync
└── restore.py            # Manual restore utility
```

**Backup Strategy:**
```
Primary: PostgreSQL on server
  ↓ (every 6h)
Secondary: Remote server (rsync)
  ↓ (daily)
Tertiary: Cloud storage (S3/Backblaze B2)
  ↓ (weekly full, daily incremental)
Quarantine: Local backup drive (when available)
```

---

## Implementation Roadmap

### Phase 1: Database Setup (Week 1)
- [ ] Install PostgreSQL
- [ ] Create database schema (tables for qualitative data, backtest results, etc.)
- [ ] Set up automated backup to remote server
- [ ] Create data ingestion pipeline for news sentiment
- [ ] Create data ingestion pipeline for geopolitical events

### Phase 2: API Development (Week 2)
- [ ] Build REST API for data ingestion
- [ ] Build REST API for backtest result storage
- [ ] Build REST API for research indexing/search
- [ ] Build REST API for backup management
- [ ] Test all endpoints with curl/Postman

### Phase 3: Data Ingestion (Week 3)
- [ ] Implement NewsAPI + GDELT integration
- [ ] Implement Finnhub sentiment integration
- [ ] Implement FRED economic indicators integration
- [ ] Implement Google Trends integration
- [ ] Schedule automated ingestion (every 6h)

### Phase 4: Analytics & Indexing (Week 4)
- [ ] Build search/indexing engine (full-text search)
- [ ] Build research categorization system
- [ ] Build backtest comparison engine
- [ ] Build strategy performance tracker
- [ ] Build dashboard for data health monitoring

### Phase 5: Production Hardening (Week 5)
- [ ] Add redundancy (failover to secondary server)
- [ ] Add monitoring/alerting for data freshness
- [ ] Add automated testing for data quality
- [ ] Add documentation for API usage
- [ ] Final backup/redundancy testing

---

## Technology Stack

| Component | Technology | Why |
|-----------|------------|-----|
| **Database** | PostgreSQL | Full-text search, concurrent access, production-ready |
| **Backend** | FastAPI | Modern, async, auto-docs |
| **Ingestion** | AsyncIO + HTTPX | Fast, concurrent data fetching |
| **Scheduler** | APScheduler | Reliable cron-like scheduling |
| **Backup** | rsync + cron | Simple, reliable, battle-tested |
| **Storage** | Local + Remote + Cloud | Three-tier redundancy |
| **Search** | PostgreSQL FTS + SQLite | Fast, no external dependency |
| **Caching** | Redis (optional) | Fast access to frequently used data |

---

## Storage Strategy

### Raw Data (Immutable)
```
data/raw/
├── news/2026-06-12/
│   ├── finnhub_articles.jsonl
│   └── gdelt_events.csv
├── sentiment/2026-06-12/
│   ├── news_sentiment.json
│   ├── reddit_sentiment.json
│   └── google_trends.json
└── geopolitical/2026-06-12/
    └── gdelt_events.csv
```

### Processed Data (Cleaned & Indexed)
```
data/processed/
├── news_sentiment.parquet    # Columnar, fast query
├── geopolitical_events.parquet
├── economic_indicators.parquet
└── social_sentiment.parquet
```

### Backtest Results (Permanent Archive)
```
data/results/
├── backtests/
│   ├── 2026-06-12_1000_momentum_backtest.json  # Each backtest saved
│   └── 2026-06-12_1200_carry_backtest.json
├── comparisons/
│   └── 2026-06-12_strategy_comparison.json
└── performance/
    └── live_strategy_tracking.json
```

### Database (PostgreSQL)
```sql
-- Table: qualitative_data
CREATE TABLE qualitative_data (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    source VARCHAR(50),  -- 'finnhub', 'gdelt', 'reddit'
    type VARCHAR(50),    -- 'news', 'sentiment', 'geopolitical'
    content JSONB,       -- Flexible storage for varying data
    score NUMERIC,       -- Sentiment/score
    tags TEXT[],         -- Searchable tags
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table: backtest_results
CREATE TABLE backtest_results (
    id SERIAL PRIMARY KEY,
    strategy VARCHAR(50),
    date DATE NOT NULL,
    parameters JSONB,
    metrics JSONB,       -- {sharpe, sortino, max_drawdown, ...}
    equity_curve JSONB,  -- Full equity curve
    regime_breakdown JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table: research_metadata
CREATE TABLE research_metadata (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    category VARCHAR(50),  -- 'sentiment', 'political', 'economic'
    tags TEXT[],
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast search
CREATE INDEX idx_qualitative_date ON qualitative_data(date);
CREATE INDEX idx_qualitative_source ON qualitative_data(source);
CREATE INDEX idx_qualitative_type ON qualitative_data(type);
CREATE INDEX idx_qualitative_score ON qualitative_data(score);
CREATE INDEX idx_backtest_strategy ON backtest_results(strategy);
CREATE INDEX idx_backtest_date ON backtest_results(date);
```

---

## Why This Architecture Preserves Value

1. **Data is indexed, not thrown away** — Every fetch, every backtest, every piece of research is stored permanently
2. **Redundancy** — Three backup tiers ensure no data loss
3. **Searchable** — Full-text search means you can find any insight from any date
4. **Structured** — Consistent schema means easy querying and analysis
5. **API-driven** — Any future strategy can query this database directly
6. **Audit trail** — Every operation logged means you know what data was used when

This turns your trading system from a disposable tool into a **growing knowledge base** that compounds in value over time.

---

*Architecture designed June 2026. Ready for implementation.*
