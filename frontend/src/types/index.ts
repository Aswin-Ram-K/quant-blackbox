// ─── API Response Types ─────────────────────────────────────────────────

export interface StrategyInfo {
  name: string
  description: string
  parameters: Record<string, any>
  markets: string[]
  timeframes: string[]
  tier: 'long-term' | 'swing' | 'intraday'
}

export interface StrategyRegisterRequest {
  name: string
  description: string
  parameters: Record<string, any>
  markets: string[]
  timeframes: string[]
  tier: string
}

export interface BacktestRequest {
  strategy_name: string
  asset: string
  timeframe: string
  start_date: string
  end_date: string
  initial_capital: number
  risk_per_trade: number
  params: Record<string, any>
}

export interface BacktestResponse {
  id: string
  status: string
  metrics: Record<string, any>
  equity_curve: number[]
  trades: Trade[]
  regime_breakdown: Record<string, any>
}

export interface Trade {
  entry_date: string
  exit_date: string
  symbol: string
  quantity: number
  entry_price: number
  exit_price: number
  pnl: number
  pnl_pct: number
  regime: string
}

export interface PaperTradeRequest {
  symbol: string
  quantity: number
  side: 'buy' | 'sell'
  order_type: 'market' | 'limit' | 'stop'
  limit_price?: number
  stop_loss?: number
}

export interface PaperTradeResponse {
  order_id: string
  status: string
  symbol: string
  quantity: number
  side: string
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
  regime: string
  probabilities: Record<string, number>
  confidence: number
  timestamp: string
}

export interface RegimeTrainRequest {
  asset: string
  lookback_days: number
}

export interface AnalyticsMetrics {
  win_rate: number
  profit_factor: number
  max_drawdown: number
  sharpe_ratio: number
  sortino_ratio: number
  recovery_time_days: number
  avg_win_loss_ratio: number
  trade_frequency: number
  regime_fit: {
    bull: number
    bear: number
    chop: number
  }
  improvement_score: number
}

export interface DataSources {
  equities: Record<string, string>
  crypto: Record<string, string>
  forex: Record<string, string>
  commodities: Record<string, string>
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
}

// ─── Custom Types ───────────────────────────────────────────────────────

export type Regime = 'bull' | 'bear' | 'chop' | 'unknown'

export type MetricCard = {
  name: string
  value: string
  label: string
  threshold: string
  status: 'pass' | 'warn' | 'fail'
  trend?: 'up' | 'down' | 'flat'
}

export type NavItem = {
  id: string
  label: string
  icon: string
  path: string
}
