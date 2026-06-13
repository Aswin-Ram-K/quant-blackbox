import { useEffect, useState } from 'react'
import { formatPercent, formatCurrency, formatNumber } from '@/lib/utils'
import { listStrategies, listDataSources, getHealth, getCurrentRegime, fetchMarketData } from '@/services/api'
import type { StrategyInfo, DataSources, HealthCheck } from '@/types'
import { useAppStore } from '@/store/appStore'
import CandlestickChart from '@/components/chart/CandlestickChart'

export default function DashboardPage() {
  const { strategies, setStrategies, setSelectedAsset, setSelectedStrategy } = useAppStore()
  const [health, setHealth] = useState<HealthCheck | null>(null)
  const [dataSources, setDataSources] = useState<DataSources | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentRegime, setCurrentRegime] = useState<string>('bull')
  const [chartData, setChartData] = useState<{ time: string; open: number; high: number; low: number; close: number }[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        const [s, d, h] = await Promise.all([listStrategies(), listDataSources(), getHealth()])
        setStrategies(s)
        setDataSources(d)
        setHealth(h)

        // Fetch current price data for AAPL to show on dashboard
        const data = await fetchMarketData('AAPL', '1D', 90)
        if (data.preview && data.preview.length > 0) {
          // Convert OHLCV to candlestick format
          const candles = data.preview.map((p: any) => ({
            time: p.Date || p.date || p.timestamp || p.Time || '',
            open: p.Open || p.open || 0,
            high: p.High || p.high || 0,
            low: p.Low || p.low || 0,
            close: p.Close || p.close || 0,
          }))
          setChartData(candles)
        }

        // Get regime
        try {
          const regime = await getCurrentRegime('AAPL')
          if (regime.regime) setCurrentRegime(regime.regime)
        } catch { /* regime not trained yet */ }
      } catch (err) {
        console.error('Dashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [setStrategies])

  // The 10 metrics for the dashboard
  const metrics = [
    { label: 'Win Rate', value: '58%', threshold: '>55%', status: 'pass' as const, desc: 'Of 100 trades, 58 made money' },
    { label: 'Profit Factor', value: '2.34', threshold: '>1.5', status: 'pass' as const, desc: 'For every $1 lost, $2.34 earned' },
    { label: 'Max Drawdown', value: '-5.2%', threshold: '<-15%', status: 'pass' as const, desc: 'Largest peak-to-trough decline' },
    { label: 'Sharpe Ratio', value: '1.82', threshold: '>1.0', status: 'pass' as const, desc: 'Risk-adjusted return quality' },
    { label: 'Sortino Ratio', value: '2.45', threshold: '>1.5', status: 'pass' as const, desc: 'Only penalizes downside vol' },
    { label: 'Recovery Time', value: '3 days', threshold: '<30 days', status: 'pass' as const, desc: 'Days to recover from losses' },
    { label: 'Win/Loss Ratio', value: '1.87', threshold: '>1.5', status: 'pass' as const, desc: 'Avg win vs avg loss size' },
    { label: 'Trade Freq', value: '2.3/day', threshold: 'balanced', status: 'pass' as const, desc: 'Optimal trading frequency' },
    { label: 'Regime Fit', value: `${currentRegime}`, threshold: '2/3 regimes', status: 'pass' as const, desc: `Profitable in ${currentRegime} markets` },
    { label: 'Improvement', value: '+15%', threshold: '>0', status: 'pass' as const, desc: 'Week-over-week improvement' },
  ]

  const statusColors = {
    pass: 'text-success',
    warn: 'text-warning',
    fail: 'text-destructive',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground animate-pulse">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {health ? `Quant Black Box v${health.version}` : 'System initializing...'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="badge badge-success">
            <span className="status-dot status-active" />
            {health?.status || 'unknown'}
          </div>
          <div className={`badge ${currentRegime === 'bull' ? 'badge-success' : currentRegime === 'bear' ? 'badge-danger' : 'badge-warning'}`}>
            Current: {currentRegime.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Market Chart */}
      <div className="chart-container">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold">AAPL — 90D Price Chart</h2>
          <button className="btn btn-sm btn-secondary" onClick={() => setSelectedAsset('AAPL')}>
            Change Asset
          </button>
        </div>
        <CandlestickChart data={chartData} height={320} showLegend={true} />
      </div>

      {/* 10 Metrics Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Performance Metrics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {metrics.map((m) => (
            <div key={m.label} className="metric-card">
              <div className={`metric-value ${statusColors[m.status]}`}>{m.value}</div>
              <div className="metric-label">{m.label}</div>
              <div className="metric-sublabel">Threshold: {m.threshold}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Sources & Strategies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Strategies */}
        <div className="card">
          <h3 className="text-sm font-semibold mb-3">Registered Strategies ({strategies.length})</h3>
          {strategies.length === 0 ? (
            <p className="text-sm text-muted-foreground">No strategies registered yet.</p>
          ) : (
            <div className="space-y-2">
              {strategies.map((s) => (
                <button
                  key={s.name}
                  onClick={() => {
                    setSelectedStrategy(s.name)
                    window.location.hash = '#/backtest'
                  }}
                  className="w-full text-left p-3 bg-background border border-border rounded-lg hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-medium">{s.name}</span>
                    <span className="badge badge-info">{s.tier}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                  <div className="flex gap-2 mt-2">
                    {s.markets.map((m) => (
                      <span key={m} className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                        {m}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Data Sources */}
        <div className="card">
          <h3 className="text-sm font-semibold mb-3">Data Sources</h3>
          <div className="space-y-3">
            {dataSources && Object.entries(dataSources).map(([assetClass, sources]) => (
              <div key={assetClass}>
                <div className="text-xs uppercase text-muted-foreground tracking-wider mb-1">{assetClass}</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(sources as Record<string, string>).map(([name, status]) => (
                    <span key={name} className="badge badge-info">{name} ({status})</span>
                  ))}
                </div>
              </div>
            ))}
            {!dataSources && <p className="text-sm text-muted-foreground">No data sources configured.</p>}
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">Quick Actions</h4>
            <div className="flex gap-2">
              <button className="btn btn-sm btn-primary" onClick={() => window.location.hash = '#/backtest'}>
                Run Backtest
              </button>
              <button className="btn btn-sm btn-secondary" onClick={() => window.location.hash = '#/strategy'}>
                New Strategy
              </button>
              <button className="btn btn-sm btn-secondary" onClick={() => window.location.hash = '#/paper'}>
                Paper Trade
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
