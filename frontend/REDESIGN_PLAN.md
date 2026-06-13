# Quant Black Box — UI Redesign Plan

## New Structure

### 1. Main Page (Dashboard)
- Ongoing strategies with status indicators
- Quick metrics (P&L, win rate, active positions)
- Regime detection status
- Recent activity log
- Quick actions (new strategy, run backtest, view logs)

### 2. Strategy Builder (with AI Chat)
- TradingView chart with live data
- Strategy parameters (visual sliders/inputs)
- Embedded chat window connecting to AI
- AI can "see" the screen context
- Strategy code editor (Python)
- One-click register back to backend
- Separate memory/context for strategy sessions

### 3. Strategy Log Book
- All past strategies with filters
- Expandable entries showing:
  - Strategy applied (name, parameters, timeframe)
  - Period (start/end dates)
  - Triggers used
  - All trades with P&L
  - Total P&L for the run
  - Why it was done (reasoning)
  - Good/bad trade assessment
  - Analytics (regime performance, risk metrics)
- Searchable/filterable
- Exportable

### 4. Market Data
- Asset browser (equities, crypto, forex, commodities)
- Charts with real data from APIs
- Multiple timeframes
- Regime detection per asset

## Technical Changes

### Mobile-Friendly
- Responsive grid layouts
- Touch-friendly buttons (min 44px)
- Bottom nav on mobile, sidebar on desktop
- Collapsible sidebar with hamburger menu
- Fluid typography
- Safe area padding for mobile

### Collapsible Sidebar
- Toggle button in header
- Sidebar collapses to icon-only on mobile
- Overlay mode on mobile when open
- Persistent state (localStorage)
- Keyboard shortcut (Ctrl+B or ESC)

### TradingView Data
- Proper API integration (Yahoo Finance, CCXT)
- Fallback mock data if APIs fail
- Loading states with skeleton screens
- Auto-refresh on timeframe change
- Candlestick + equity curve overlay
- Zoom/pan support

### AI Chat Integration
- WebSocket/REST connection to AI service
- Screen context capture (screenshot of chart + params)
- Chat history preserved
- Separate conversation thread for strategy building
- Screenshot capture on each message
- Code generation with syntax highlighting
- One-click apply to strategy builder

### Strategy Log Book
- Database-backed storage
- Each strategy run is a "session"
- Sessions include:
  - Metadata (strategy, params, timeframe, period)
  - Reasoning (why applied)
  - Triggers (what signals fired)
  - Trades (entry/exit, P&L, timestamps)
  - Analytics (metrics computed from trades)
  - Assessment (good/bad trade post-mortem)
- Filtering by:
  - Strategy name
  - Date range
  - P&L
  - Win/loss status
  - Asset class
- Aggregate analytics across all runs of a strategy
