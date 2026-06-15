const API = '/api/v1'

async function fetchJson<T>(endpoint: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  if (res.status === 204) return {} as T
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`)
  return res.json()
}

export async function listStrategies() {
  try { return await fetchJson<any[]>(`${API}/strategies/`) }
  catch { return [] }
}

export async function runBacktest(payload: any) {
  try { return await fetchJson<any>(`${API}/backtest/run`, { method: 'POST', body: JSON.stringify(payload) }) }
  catch { return null }
}

export async function fetchMarketData(asset: string, days: number = 90) {
  try { return await fetchJson<any>(`${API}/data/fetch?asset=${asset}&days=${days}`, { method: 'POST', body: JSON.stringify({ asset, days }) }) }
  catch { return null }
}

export async function getHealth() {
  try { return await fetchJson<any>(`${API}/health`) }
  catch { return null }
}

export async function getCurrentRegime(asset: string) {
  try { return await fetchJson<any>(`${API}/regime/current/${asset}`) }
  catch { return null }
}

export async function listDataSources() {
  try { return await fetchJson<any>(`${API}/data/sources`) }
  catch { return null }
}

export async function placeOrder(payload: any) {
  try { return await fetchJson<any>(`${API}/live/order`, { method: 'POST', body: JSON.stringify(payload) }) }
  catch { return null }
}

export async function getPortfolio() {
  try { return await fetchJson<any>(`${API}/live/portfolio`) }
  catch { return null }
}
