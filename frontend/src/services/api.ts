import type {
  BacktestRequest,
  BacktestResponse,
  PaperTradeRequest,
  PaperTradeResponse,
  PortfolioState,
  RegimeResult,
  StrategyInfo,
  AnalyticsMetrics,
  DataSources,
  FetchedData,
  HealthCheck,
} from '@/types'

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!res.ok) {
    const error = await res.text().catch(() => res.statusText)
    throw new Error(`API Error ${res.status}: ${error}`)
  }

  if (res.status === 204) return {} as T
  return res.json()
}

// ─── Health ────────────────────────────────────────────────────────────

export async function getHealth(): Promise<HealthCheck> {
  return request('/health')
}

// ─── Strategies ────────────────────────────────────────────────────────

export async function listStrategies(): Promise<StrategyInfo[]> {
  return request(`${API_BASE}/strategies/`)
}

export async function getStrategy(name: string): Promise<StrategyInfo> {
  return request(`${API_BASE}/strategies/${name}`)
}

export async function registerStrategy(
  payload: { name: string; description: string; parameters: Record<string, any>; markets: string[]; timeframes: string[]; tier: string }
): Promise<StrategyInfo> {
  return request(`${API_BASE}/strategies`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ─── Backtest ──────────────────────────────────────────────────────────

export async function runBacktest(payload: BacktestRequest): Promise<BacktestResponse> {
  return request(`${API_BASE}/backtest/run`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getBacktestResult(id: string): Promise<BacktestResponse> {
  return request(`${API_BASE}/backtest/${id}/results`)
}

// ─── Paper Trading ─────────────────────────────────────────────────────

export async function startPaperTrading(): Promise<{ status: string }> {
  return request(`${API_BASE}/live/start`, { method: 'POST' })
}

export async function placePaperOrder(payload: PaperTradeRequest): Promise<PaperTradeResponse> {
  return request(`${API_BASE}/live/order`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getPortfolio(): Promise<PortfolioState> {
  return request(`${API_BASE}/live/portfolio`)
}

// ─── Analytics ─────────────────────────────────────────────────────────

export async function getMetrics(backtestId: string): Promise<AnalyticsMetrics> {
  return request(`${API_BASE}/analytics/metrics/${backtestId}`)
}

export async function compareBacktests(ids: string[]): Promise<any> {
  return request(`${API_BASE}/analytics/compare?ids=${ids.join(',')}`)
}

// ─── Data ──────────────────────────────────────────────────────────────

export async function listDataSources(): Promise<DataSources> {
  return request(`${API_BASE}/data/sources`)
}

export async function fetchMarketData(
  asset: string,
  timeframe: string = '1D',
  days: number = 365
): Promise<FetchedData> {
  return request(`${API_BASE}/data/fetch?asset=${asset}&timeframe=${timeframe}&days=${days}`, {
    method: 'POST',
    body: JSON.stringify({ asset, timeframe, days }),
  })
}

// ─── Regime ────────────────────────────────────────────────────────────

export async function getCurrentRegime(asset: string): Promise<RegimeResult> {
  return request(`${API_BASE}/regime/current/${asset}`)
}

export async function trainRegimeModel(
  asset: string,
  lookbackDays: number = 90
): Promise<any> {
  return request(`${API_BASE}/regime/train`, {
    method: 'POST',
    body: JSON.stringify({ asset, lookback_days: lookbackDays }),
  })
}
