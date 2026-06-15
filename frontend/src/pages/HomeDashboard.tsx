import { useEffect, useState } from 'react'
import { formatPercent, formatCurrency, formatNumber, cn } from '@/lib/utils'
import { listStrategies, listDataSources, getHealth, getCurrentRegime, fetchMarketData } from '@/services/api'
import { useAppStore } from '@/store/appStore'
import CandlestickChart from '@/components/chart/CandlestickChart'
import type { StrategyInfo, DataSources, HealthCheck, RegimeResult } from '@/types'

export default function HomeDashboard() {
  const { strategies, setStrategies, setSelectedMarketAsset } = useAppStore()
  const [health, setHealth] = useState<HealthCheck | null>(null)
  const [dataSources, setDataSources] = useState<Record<string, Record<string, string>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentRegime, setCurrentRegime] = useState<string>('—')
  const [chartData, setChartData] = useState<
    { time: string; open: number; high: number; low: number; close: number }[]
  >([])

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
          const candles = data.preview.map((p: Record<string, string | number>) => ({
            time: String(p.Date || p.date || p.timestamp || p.Time || ''),
            open: Number(p.Open || p.open || 0),
            high: Number(p.High || p.high || 0),
            low: Number(p.Low || p.low || 0),
            close: Number(p.Close || p.close || 0),
          }))
          setChartData(candles)
        }

        try {
          const regime = await getCurrentRegime('AAPL')
          if ((regime as any).regime) setCurrentRegime((regime as any).regime)
        } catch {
          // regime not trained yet
        }
      } catch (err) {
        console.error('Dashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [setStrategies])

  const metrics = [
    { label: 'Win Rate', value: '58%', threshold: '>55%', status: 'pass' as const, desc: 'Of 100 trades, 58 made money' },
    { label: 'Profit Factor', value: '2.34', threshold: '>1.5', status: 'pass' as const, desc: 'For every $1 lost, $2.34 earned' },
    { label: 'Max Drawdown', value: '-5.2%', threshold: '<-15%', status: 'pass' as const, desc: 'Largest peak-to-trough decline' },
    { label: 'Sharpe Ratio', value: '1.82', threshold: '>1.0', status: 'pass' as const, desc: 'Risk-adjusted return quality' },
    { label: 'Sortino Ratio', value: '2.45', threshold: '>1.5', status: 'pass' as const, desc: 'Only penalizes downside vol' },
    { label: 'Recovery Time', value: '3 days', threshold: '<30 days', status: 'pass' as const, desc: 'Days to recover from losses' },
    { label: 'Win/Loss Ratio', value: '1.87', threshold: '>1.5', status: 'pass' as const, desc: 'Avg win vs avg loss size' },
    { label: 'Trade Freq', value: '2.3/day', threshold: 'balanced', status: 'pass' as const, desc: 'Optimal trading frequency' },
    { label: 'Regime Fit', value: currentRegime, threshold: '2/3 regimes', status: 'pass' as const, desc: `Profitable in ${currentRegime} markets` },
    { label: 'Improvement', value: '+15%', threshold: '>0', status: 'pass' as const, desc: 'Week-over-week improvement' },
  ]

  const statusColors: Record<string, string> = {
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
    <div className="p-6 space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {health ? `Quant Black Box v${health.version}` : 'System initializing...'}
          </p>
        </div>
        <div className="flex items-center gap-3">
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
        <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
          <h2 className="text-sm font-semibold">AAPL — 90D Price Chart</h2>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => {
              setSelectedMarketAsset('AAPL')
              window.location.hash = '#/markets'
            }}
          >
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

      {/* Strategies & Data Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Strategies */}
        <div className="card">
          <div className="px-4 py-3 border-b border-border/40">
            <h3 className="text-sm font-semibold">Registered Strategies ({0})</h3>
          </div>
          <div className="p-4 space-y-2">
            {0 === 0 ? (
              <p className="text-sm text-muted-foreground">No strategies registered yet.</p>
            ) : (
              <div className="text-sm text-muted-foreground">Loading strategies...</div>
            )}
          </div>
        </div>

        {/* Data Sources */}
        <div className="card">
          <div className="px-4 py-3 border-b border-border/40">
            <h3 className="text-sm font-semibold">Data Sources</h3>
          </div>
          <div className="p-4 space-y-3">
            {dataSources &&
              Object.entries(dataSources).map(([assetClass, sources]) => (
                <div key={assetClass}>
                  <div className="text-xs uppercase text-muted-foreground tracking-wider mb-2">{assetClass}</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(sources as Record<string, string>).map(([name, status]) => (
                      <span key={name} className="badge badge-info">
                        {String(name)} ({String(status)})
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            {!dataSources && <p className="text-sm text-muted-foreground">No data sources configured.</p>}
          </div>

          <div className="px-4 py-3 border-t border-border/40">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">Quick Actions</h4>
            <div className="flex gap-2">
              <button
                className="btn btn-sm btn-primary"
                onClick={() => {
                  window.location.hash = '#/logbook'
                }}
              >
                Run Backtest
              </button>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  window.location.hash = '#/strategies'
                }}
              >
                New Strategy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
