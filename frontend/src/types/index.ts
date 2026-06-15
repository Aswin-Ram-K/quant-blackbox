// ── API Types ───────────────────────────────────────────────────────────

export interface StrategyInfo {
  name: string
  description: string
  parameters: Record<string, any>
  markets: string[]
  timeframes: string[]
  tier: 'long-term' | 'swing' | 'intraday'
}

export interface Trade {
  id: string
  date: string
  strategy: string
  phase: string
  symbol: string
  side: 'buy' | 'sell'
  quantity: number
  entry_price: number
  exit_price: number
  pnl: number
  pnl_pct: number
  trigger: string
  reason: string
  outcome: 'good' | 'bad' | 'mixed'
  notes: string
  regime: string
  metadata: Record<string, any>
}

export interface BacktestResult {
  id: string
  strategy: string
  asset: string
  start_date: string
  end_date: string
  status: string
  metrics: Record<string, number>
  equity_curve: number[]
  trades: Trade[]
  regime_breakdown: Record<string, any>
}

export interface PortfolioState {
  cash: number
  positions: Position[]
  total_value: number
  unrealized_pnl: number
  realized_pnl: number
}

export interface Position {
  symbol: string
  quantity: number
  avg_price: number
  current_price: number
  pnl: number
  pnl_pct: number
}

export interface RegimeResult {
  asset: string
  regime: 'bull' | 'bear' | 'chop' | 'unknown'
  probabilities: Record<string, number>
  confidence: number
  timestamp: string
}

export interface HealthCheck {
  status: string
  service: string
  version: string
}

export interface FetchedData {
  asset: string
  data_points: number
  columns: string[]
  first_date: string | null
  last_date: string | null
  preview: Record<string, any>[]
  ohlcv: { time: string; open: number; high: number; low: number; close: number; volume?: number }[]
}

export interface DataSources {
  equities: Record<string, string>
  crypto: Record<string, string>
  forex: Record<string, string>
  commodities: Record<string, string>
}

// ── UI Types ────────────────────────────────────────────────────────────

export interface NavItem {
  id: string
  label: string
  icon: string
  shortLabel: string  // for mobile
  color: string
}

export interface MetricItem {
  label: string
  value: string
  status: 'pass' | 'warn' | 'fail' | 'neutral'
  trend?: 'up' | 'down' | 'flat'
  desc?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'ai' | 'system'
  content: string
  timestamp: number
  context?: Record<string, any>  // screen state when sent
}

export interface LogEntry {
  id: string
  strategy: string
  period_start: string
  period_end: string
  trades: Trade[]
  total_pnl: number
  win_rate: number
  description: string
  triggers: string[]
  analysis: string
  grade: 'A' | 'A-' | 'B' | 'B-' | 'C' | 'C+' | 'D' | 'F'
}
