import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/appStore'
import { listDataSources, fetchMarketData } from '@/services/api'
import CandlestickChart from '@/components/chart/CandlestickChart'
import type { DataSources } from '@/types'

const ASSET_PRESETS = [
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'equity' },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'equity' },
  { symbol: 'SPY', name: 'S&P 500 ETF', type: 'equity' },
  { symbol: 'BTC-USD', name: 'Bitcoin', type: 'crypto' },
  { symbol: 'ETH-USD', name: 'Ethereum', type: 'crypto' },
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', type: 'forex' },
  { symbol: 'XAU/USD', name: 'Gold', type: 'commodity' },
  { symbol: 'NVDA', name: 'NVIDIA Corp', type: 'equity' },
]

export default function MarketData() {
  const { selectedMarketAsset, setSelectedMarketAsset } = useAppStore()
  const [dataSources, setDataSources] = useState<DataSources | null>(null)
  const [chartData, setChartData] = useState<
    { time: string; open: number; high: number; low: number; close: number }[]
  >([])
  const [loading, setLoading] = useState(false)
  const [timeframe, setTimeframe] = useState('1D')
  const [lookback, setLookback] = useState(90)

  useEffect(() => {
    listDataSources().then(setDataSources).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedMarketAsset) return
    setLoading(true)
    // Generate mock data
    const data: typeof chartData = []
    let price = 150 + Math.random() * 200
    const now = new Date()
    for (let i = lookback; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const volatility = 2 + Math.random() * 3
      const change = (Math.random() - 0.48) * volatility
      price += change
      const open = price
      const close = price + (Math.random() - 0.48) * volatility
      const high = Math.max(open, close) + Math.random() * volatility * 0.5
      const low = Math.min(open, close) - Math.random() * volatility * 0.5
      data.push({
        time: date.toISOString().split('T')[0],
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
      })
    }
    setChartData(data)
    setLoading(false)
  }, [selectedMarketAsset, lookback])

  return (
    <div className="p-6 space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Market Data</h1>
          <p className="text-sm text-muted-foreground mt-1">Browse, fetch, and analyze market data</p>
        </div>
        <div className="flex gap-2">
          <select
            className="input w-28"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
          >
            <option value="1m">1m</option>
            <option value="5m">5m</option>
            <option value="15m">15m</option>
            <option value="1H">1H</option>
            <option value="4H">4H</option>
            <option value="1D">1D</option>
            <option value="1W">1W</option>
          </select>
          <select
            className="input w-28"
            value={lookback}
            onChange={(e) => setLookback(Number(e.target.value))}
          >
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
            <option value={180}>180 days</option>
            <option value={365}>1 year</option>
          </select>
        </div>
      </div>

      {/* Data Sources */}
      {dataSources && (
        <div className="card">
          <div className="px-4 py-3 border-b border-border/40">
            <h3 className="text-sm font-semibold">Connected Data Sources</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {Object.entries(dataSources as Record<string, Record<string, string>>).map(([assetClass, sources]) =>
                Object.entries(sources).map(([name, status]) => (
                  <div key={`${assetClass}-${name}`} className="card p-3">
                    <div className="text-xs uppercase text-muted-foreground tracking-wider mb-2">{assetClass}</div>
                    <div className="text-sm font-medium mb-1">{String(name)}</div>
                    <span className={`badge ${status === 'connected' ? 'badge-success' : 'badge-neutral'}`}>
                      {String(status)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Asset Selector */}
      <div className="card">
        <div className="px-4 py-3 border-b border-border/40">
          <h3 className="text-sm font-semibold">Asset Selector</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ASSET_PRESETS.map((asset) => (
              <button
                key={asset.symbol}
                onClick={() => setSelectedMarketAsset(asset.symbol)}
                className={`card p-3 text-left transition-all duration-150 ${
                  selectedMarketAsset === asset.symbol
                    ? 'border-primary/50 bg-primary/5'
                    : 'hover:border-primary/30'
                }`}
              >
                <div className="text-sm font-semibold">{asset.symbol}</div>
                <div className="text-xs text-muted-foreground">{asset.name}</div>
                <span className="badge badge-info text-[10px] px-1.5 py-0.5 mt-2">{asset.type}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="chart-container">
        <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            {ASSET_PRESETS.find((a) => a.symbol === selectedMarketAsset)?.name || selectedMarketAsset} — {timeframe} — {lookback}D
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Last: {chartData.length > 0 ? chartData[chartData.length - 1].close.toFixed(2) : '—'}
            </span>
          </div>
        </div>
        {loading ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-muted-foreground animate-pulse">Loading data...</div>
          </div>
        ) : (
          <CandlestickChart data={chartData} height={400} showLegend={false} />
        )}
      </div>

      {/* Data Preview Table */}
      {chartData.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/40">
            <h3 className="text-sm font-semibold">Data Preview (Last 10)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Open</th>
                  <th>High</th>
                  <th>Low</th>
                  <th>Close</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                {chartData.slice(-10).map((candle, i) => {
                  const prevClose = i === 0 ? candle.close : chartData[chartData.length - 10 + i - 1]?.close
                  const change = prevClose ? ((candle.close - prevClose) / prevClose) * 100 : 0
                  return (
                    <tr key={i}>
                      <td className="text-muted-foreground">{candle.time}</td>
                      <td className="font-mono">{candle.open.toFixed(2)}</td>
                      <td className="font-mono">{candle.high.toFixed(2)}</td>
                      <td className="font-mono">{candle.low.toFixed(2)}</td>
                      <td className="font-mono">{candle.close.toFixed(2)}</td>
                      <td className={change >= 0 ? 'text-success' : 'text-destructive'}>
                        {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
