# Quant Black Box — Build Plan & Checklist
**Version:** 1.0
**Date:** June 2026
**Status:** Planning (Not Yet Executing)
**Last Updated:** 2026-06-11

---

## Core Principles

### 1. Version Control Rules
- Every strategy becomes its **own private Git repository** on Aswin-Ram-K's GitHub
- No code is pushed to the primary `quant-blackbox` repo without explicit approval
- The primary repo is only for the **platform shell** (data vault, CI/CD, indexer)
- Each strategy repo is versioned independently with semantic versioning (`v0.1.0`, `v0.2.0`, etc.)
- Batched commits before pushes — never trivial, never massive

### 2. Change Documentation
- Every strategy repository maintains a `CHANGELOG.md` with:
  - **Change:** What was modified
  - **Reason:** Why the change was made
  - **Effect:** The observed outcome (tracked post-launch)
- Research documents are preserved as **AI training data** for future model training
- No data is thrown away — everything is indexed and stored

### 3. Architecture Decisions
- **Data Vault:** Standalone product, separate from quant-blackbox
- **CI/CD:** Hosted on GitHub (GitHub Actions), not GitHub-hosted runners
- **Storage:** Local-only for now (no cloud backups yet)
- **Build Order:** Data Vault → CI/CD → Multi-Factor Resources → Strategy Integration

---

## Build Phases

### Phase 0: Foundation — Git Architecture
**Goal:** Establish the version control structure before any code is written

- [ ] **0.1** — Create `quant-blackbox-data-vault` repository (standalone)
  - Purpose: Indexes all strategy repos, manages metadata, stores training data
  - Structure defined but empty
  - Push point: After Phase 0 complete

- [ ] **0.2** — Set up primary repo structure (`quant-blackbox`)
  - Only contains: platform shell, CI/CD config, indexer config
  - No strategy code lives here
  - Push point: After Phase 0 complete

- [ ] **0.3** — Define the strategy repo template
  - Standard structure every strategy will follow
  - Includes: CHANGELOG.md, README.md, tests/, src/
  - Push point: After Phase 0 complete

- [ ] **0.4** — Establish Git workflow rules (documented)
  - Batched commits only
  - Pre-push approval required
  - Commit messages follow convention
  - Push point: After Phase 0 complete

**Checkpoint 0 Status:** 🔲 Not Started
**Git Pushes for this Phase:**
- `quant-blackbox-data-vault` → created but empty
- `quant-blackbox` → created, platform shell only

---

### Phase 1: Data Vault (Standalone Product)
**Goal:** Build the data warehouse that indexes all future strategy data

- [ ] **1.1** — Design data vault schema
  - Metadata table: strategy name, version, parameters, dates
  - Performance metrics table: Sharpe, Drawdown, Win Rate, etc.
  - Factor exposure table: sentiment scores, macro indicators, etc.
  - Trade log table: entry/exit, P&L, conditions
  - Research doc table: qualitative research, AI training data
  - Push point: Schema documented but no code

- [ ] **1.2** — Build data ingestion pipeline
  - Connectors for: yfinance, CCXT, news APIs, sentiment APIs, economic data
  - Normalization layer: ensure consistent schemas across sources
  - Storage: SQLite (local), Parquet (archival)
  - Push point: Pipeline tested locally

- [ ] **1.3** — Build indexing engine
  - Indexes all strategy repositories (clones/reads metadata)
  - Aggregates performance metrics across strategies
  - Generates "training dataset" for future ML models
  - Push point: Indexer tested

- [ ] **1.4** — Build redundancy and backup system
  - Local redundancy: snapshots, version history
  - Cloud backup: TBD (AWS S3, Backblaze B2, etc.)
  - Automated backup schedule
  - Push point: Backup system tested

- [ ] **1.5** — Build API for data vault
  - REST API: fetch metadata, metrics, trade logs
  - WebSocket for real-time updates
  - Push point: API tested, documented

**Checkpoint 1 Status:** 🔲 Not Started
**Git Pushes for this Phase:**
- `quant-blackbox-data-vault` → initial structure + schema + pipeline (commit 1)
- `quant-blackbox-data-vault` → indexing engine (commit 2)
- `quant-blackbox-data-vault` → backup system (commit 3)
- `quant-blackbox-data-vault` → API layer (commit 4)

---

### Phase 2: CI/CD Pipeline (GitHub Actions)
**Goal:** Automated testing, validation, and deployment pipeline

- [ ] **2.1** — Design CI/CD workflow
  - Triggers: push to main, PR opened, schedule (daily backtest runs)
  - Stages: lint → test → backtest → report → notify
  - Push point: Workflow designed but not coded

- [ ] **2.2** — Build CI workflow (GitHub Actions)
  - Automated tests on every push
  - Performance validation (backtest runs)
  - Report generation (metrics, charts)
  - Slack/Discord/Telegram notifications
  - Push point: Workflow file created

- [ ] **2.3** — Build CD workflow (manual approval gate)
  - Pre-deployment checks
  - Approval required for production pushes
  - Rollback capability
  - Push point: CD workflow created

- [ ] **2.4** — Integrate data vault CI/CD
  - Pipeline runs against data vault schema
  - Validates all strategy repos have required structure
  - Ensures CHANGELOG is maintained
  - Push point: Integration tested

**Checkpoint 2 Status:** 🔲 Not Started
**Git Pushes for this Phase:**
- `quant-blackbox` → CI/CD workflows (commit 1)
- `quant-blackbox` → pipeline integration (commit 2)

---

### Phase 3: Multi-Factor Resources
**Goal:** Establish data sources for qualitative factors

- [ ] **3.1** — News Sentiment Sources
  - [ ] Research and evaluate sources (top 3 per category)
  - [ ] Evaluate cost, accuracy, update frequency
  - [ ] Select final sources
  - [ ] Implement connectors (API calls, rate limiting)
  - [ ] Normalize and store in data vault
  - Push point: Connectors working

- [ ] **3.2** — Social/Market Sentiment Sources
  - [ ] Research and evaluate sources (Reddit, X, TradingView, etc.)
  - [ ] Implement sentiment extraction
  - [ ] Store sentiment scores in data vault
  - Push point: Sentiment pipeline working

- [ ] **3.3** — Fear/Market Indicators
  - [ ] Fear & Greed Index (CNN, Bloomberg, etc.)
  - [ ] VIX/VVIX term structure
  - [ ] Put/Call ratios
  - [ ] Max pain, Gamma Exposure (GEX)
  - [ ] Store in data vault
  - Push point: Indicator pipeline working

- [ ] **3.4** — Macroeconomic Indicators
  - [ ] Interest rate changes (Fed announcements)
  - [ ] GDP/recession indicators
  - [ ] Inflation data (CPI, PCE)
  - [ ] Unemployment, consumer sentiment
  - [ ] Government/policy tracking (legislation, trade)
  - [ ] Store in data vault
  - Push point: Macro pipeline working

- [ ] **3.5** — Institutional Flow Data
  - [ ] Insider trading (SEC Form 4)
  - [ ] Institutional holdings (13F filings)
  - [ ] Smart money indicators
  - [ ] Store in data vault
  - Push point: Flow pipeline working

- [ ] **3.6** — Alternative Data Sources
  - [ ] Google Trends (search volume spikes)
  - [ ] Crypto-specific: whale movements, on-chain data
  - [ ] Supply chain data, shipping indices
  - [ ] Commodity inventory data
  - [ ] Store in data vault
  - Push point: Alternative data pipeline working

**Checkpoint 3 Status:** 🔲 Not Started
**Git Pushes for this Phase:**
- `quant-blackbox` → data source connectors (batch 1)
- `quant-blackbox` → data source connectors (batch 2)
- `quant-blackbox` → integration complete (commit 1)

---

### Phase 4: Strategy Architecture & Templates
**Goal:** Establish the strategy framework that all strategies will follow

- [ ] **4.1** — Define strategy contract/interface
  - Required fields: name, version, parameters, markets
  - Required methods: analyze(), validate_params(), backtest()
  - Required output: Signal(direction, strength, metadata)
  - Push point: Contract defined, no code

- [ ] **4.2** — Build strategy base classes
  - Base Strategy (abstract)
  - Backtestable Strategy (with data ingestion)
  - Multi-factor Strategy (with qualitative data)
  - Push point: Base classes working

- [ ] **4.3** — Build multi-factor integration layer
  - Connects strategies to data vault
  - Fetches sentiment, macro, fear indicators per bar
  - Normalizes all inputs to consistent scale
  - Handles missing data gracefully
  - Push point: Integration tested

- [ ] **4.4** — Build strategy templating system
  - Standardized directory structure
  - Parameter configuration system
  - Backtest runner template
  - Metrics evaluation template
  - Push point: Template system working

- [ ] **4.5** — Set up strategy repository templates
  - Cloneable starter repo for new strategies
  - Includes CHANGELOG.md, README.md, tests/, src/
  - Push point: Template ready

**Checkpoint 4 Status:** 🔲 Not Started
**Git Pushes for this Phase:**
- `quant-blackbox` → strategy base classes (commit 1)
- `quant-blackbox` → multi-factor layer (commit 2)
- `quant-blackbox` → templating system (commit 3)

---

### Phase 5: First Qualitative Factor Strategy
**Goal:** Build a complete strategy using qualitative factors as proof of concept

- [ ] **5.1** — Design first strategy concept
  - Choose 2-3 factors from Phase 3 to combine
  - Example: "Momentum + Sentiment + Macro Regime"
  - Define parameter space
  - Push point: Strategy design documented

- [ ] **5.2** — Implement strategy in its own repo
  - Create `strategy-qualitative-alpha` (or similar) as separate private repo
  - Implement strategy contract
  - Add initial tests
  - Push point: First code in strategy repo (after approval)

- [ ] **5.3** — Run initial backtest
  - Connect to data vault
  - Fetch required factors
  - Run backtest engine
  - Evaluate initial results
  - Push point: Backtest complete

- [ ] **5.4** — Optimize parameters
  - Run parameter sweep
  - Document results in CHANGELOG
  - Select best parameters
  - Push point: Parameters optimized

- [ ] **5.5** — Paper trade validation
  - Run on paper trading data
  - Monitor for 30 days (or equivalent simulated period)
  - Compare to backtest results
  - Push point: Paper trading complete

**Checkpoint 5 Status:** 🔲 Not Started
**Git Pushes for this Phase:**
- Strategy repo created (after approval)
- Strategy initial implementation (after approval)
- Backtest complete (after approval)
- Paper trading complete (after approval)

---

### Phase 6: Platform Integration
**Goal:** Integrate the data vault and CI/CD with the main quant-blackbox platform

- [ ] **6.1** — Integrate data vault with backtesting engine
  - Strategies pull data from data vault
  - Results saved back to data vault
  - Push point: Integration working

- [ ] **6.2** — Build dashboard/API for strategy management
  - List all strategies with metadata
  - View performance metrics
  - Start/stop paper trading
  - Push point: Dashboard working

- [ ] **6.3** — Build strategy performance comparison
  - Compare strategies on same metrics
  - Generate heatmaps/rankings
  - Push point: Comparison working

- [ ] **6.4** — Set up automated retraining schedule
  - Weekly/daily retraining of strategies
  - Parameter optimization cycles
  - Performance monitoring alerts
  - Push point: Automation working

**Checkpoint 6 Status:** 🔲 Not Started
**Git Pushes for this Phase:**
- `quant-blackbox` → platform integration (batch 1)
- `quant-blackbox` → dashboard/API (batch 2)
- `quant-blackbox` → automation (batch 3)

---

### Phase 7: Production Readiness
**Goal:** Make the system production-ready for 24/7 operation

- [ ] **7.1** — Add redundancy layer
  - Data backup (local snapshots)
  - Service restart on crash
  - Health checks
  - Push point: Redundancy working

- [ ] **7.2** — Add monitoring/alerts
  - Strategy health monitoring
  - Data feed health
  - Performance anomaly detection
  - Push point: Monitoring working

- [ ] **7.3** — Final documentation
  - API docs
  - Strategy docs
  - Maintenance docs
  - Push point: Docs complete

- [ ] **7.4** — Security audit
  - API key management
  - Access control
  - Data encryption (at rest)
  - Push point: Security complete

- [ ] **7.5** — Performance tuning
  - Optimize data ingestion
  - Optimize backtesting speed
  - Push point: Tuning complete

**Checkpoint 7 Status:** 🔲 Not Started
**Git Pushes for this Phase:**
- `quant-blackbox` → production readiness (batch 1)
- `quant-blackbox` → final commit (only after Phase 7 complete)

---

## Git Workflow Rules (Finalized)

### Commit Rules
- [ ] All commits must have descriptive messages
- [ ] Format: `[Phase] Description - Reason`
  - Example: `[Phase 3.1] Add news sentiment connector - Using Finnhub API for real-time sentiment scores`
- [ ] Batch commits — minimum of related changes in one commit

### Push Rules
- [ ] NO push without explicit user approval
- [ ] Batched pushes (2-5 commits grouped together)
- [ ] Before push: run all tests, verify backtest engine
- [ ] After push: update build plan checklist to mark push point

### Strategy Repository Rules
- [ ] Each strategy = separate private repo on `Aswin-Ram-K` GitHub
- [ ] Strategy repos inherit from `quant-blackbox` base classes
- [ ] Each strategy repo must have: `CHANGELOG.md`, `README.md`, `tests/`, `src/`
- [ ] Changes documented in CHANGELOG with reasoning and effect
- [ ] Version numbers: `v0.1.0`, `v0.2.0`, etc. (semantic versioning)

### Data Vault Rules
- [ ] Data vault = standalone product (separate repo)
- [ ] Every backtest result stored in data vault
- [ ] Every research doc stored in data vault
- [ ] Local storage only (no cloud yet)
- [ ] Automated backups (schedule TBD)

---

## Key Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Version Control | Every strategy = separate repo | Isolation, independent versioning, corporate-level control |
| Push Policy | Manual approval required | No downtime, prevent accidents |
| Data Storage | Local only (initially) | Control, cost, simplicity; cloud later |
| CI/CD Hosting | GitHub Actions (self-hosted) | Free tier, integrated with GitHub, maintain ourselves |
| Data Vault | Standalone product | Reusable, clean separation of concerns |
| Build Order | Data Vault → CI/CD → Multi-Factor → Strategy | Foundation first, strategy on top |
| Documentation | AI training data preserved | Future model training, knowledge base |
| Change Tracking | CHANGELOG per strategy | Reasoning + effect = learning system |

---

## Current State

- **Algorithmic backtesting engine:** Working (4 strategies, 5 markets, 10 metrics)
- **Qualitative factor research:** In progress (Phase 3)
- **Data vault:** Planned (Phase 1)
- **CI/CD:** Planned (Phase 2)
- **Strategy templates:** Planned (Phase 4)
- **First qualitative strategy:** Not started (Phase 5)
- **Production readiness:** Not started (Phase 7)

**Ready to execute:** Upon user approval, we begin Phase 0 (Foundation).

---

## Upcoming Approval Points

1. **Phase 0 complete** → Approve initial repo structure
2. **Data vault schema approved** → Begin building
3. **Data source selections (Phase 3)** → Approve which sources to use
4. **First strategy design (Phase 5)** → Approve strategy concept
5. **Each strategy repo creation** → Approve before any code is pushed
6. **Each batched push** → Approve before pushing to any repo

**No code will be executed until Phase 5 approval.**
**No code will be pushed until explicit approval for each push point.**
