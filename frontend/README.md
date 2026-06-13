# Quant Black Box — Frontend Dashboard

Single-page React application for quantitative trading strategy management.

## Tech Stack

- **React 19** + TypeScript
- **Vite 6** — fast dev server & build
- **Tailwind CSS 3** — dark trading UI theme
- **TradingView Lightweight Charts** — professional candlestick charts
- **Zustand** — state management
- **React Router** — page navigation

## Pages

| Page | What it does |
|------|--------------|
| **Dashboard** | 10-metric overview, regime indicator, strategy list, quick actions |
| **Strategy Builder** | Configure preset strategies (Momentum, Mean Reversion, Carry, Volatility, Pairs) with parameter sliders. Write custom Python strategy code in the code editor. |
| **Backtest** | Select strategy + asset + timeframe, run backtests. View candlestick charts with equity curve overlay, trade log tables, regime breakdown, metrics summary. |
| **Paper Trading** | Place buy/sell orders (market, limit, stop). View portfolio positions, P&L, order history. |
| **Market Data** | Browse assets by category (equities, crypto, forex, commodities). Fetch OHLCV data with charts. Regime detection per asset. Retraining HMM. |
| **Analytics** | Deep-dive into the 10 success/failure metrics. Scorecard with pass/warn/fail. Regime fit donut charts. Improvement trend history. |

## Getting Started

```bash
cd /home/zer0null/quant-blackbox/frontend
npm install        # already done
npm run dev        # starts on http://localhost:5173
npm run build      # production build
npm run preview    # preview production build locally
```

## API Integration

The frontend connects to the FastAPI backend at `localhost:8000` via Vite's dev proxy. Production builds hit `/api/v1/*` relative URLs.

Environment variable for custom API URL:
```env
VITE_API_URL=http://your-server:8000/api/v1
```

## Project Structure

```
frontend/
├── src/
│   ├── pages/          # 6 main pages
│   ├── components/     # shared components (CandlestickChart)
│   ├── services/       # API client (api.ts)
│   ├── store/          # Zustand state (appStore.ts)
│   ├── types/          # TypeScript types (index.ts)
│   ├── lib/            # utility functions (utils.ts)
│   ├── App.tsx         # main app with sidebar navigation
│   ├── main.tsx        # entry point
│   └── index.css       # Tailwind styles + custom components
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Building for Production

```bash
npm run build
# output in dist/
```

Serve `dist/` with any static file server (Nginx, Vercel, Cloudflare Pages, etc.).
