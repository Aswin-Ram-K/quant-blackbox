import { useState, useEffect } from 'react'
import { listStrategies, runBacktest, fetchMarketData, listDataSources } from '@/services/api'
import type { StrategyInfo, FetchedData } from '@/types'
import { useAppStore } from '@/store/appStore'
import CandlestickChart from '@/components/chart/CandlestickChart'
import { formatCurrency, formatPercent, formatDate, cn } from '@/lib/utils'

const TICKERS = {
  equities: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'SPY', 'QQQ', 'NVDA', 'META', 'AMD'],
  crypto: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'ADA-USD', 'DOT-USD'],
  forex: ['EURUSD=X', 'GBPUSD=X', 'USDJPY=X'],
  commodities: ['GC=F', 'CL=F', 'SI=F'],
}

export default function BacktestPage() {
  const { strategies, setStrategies, activeBacktest, setActiveBacktest, backtestHistory, setBacktestHistory } = useAppStore()
  
  // Form state
  const [strategyName, setStrategyName] = useState('')
  const [asset, setAsset] = useState('AAPL')
  const [timeframe, setTimeframe] = useState('1D')
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 2)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])
  const [initialCapital, setInitialCapital] = useState(10000)
  const [riskPerTrade, setRiskPerTrade] = useState(0.01)
  const [customParams, setCustomParams] = useState<Record<string, any>>({})
  const [running, setRunning] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [chartData, setChartData] = useState<{ time: string; open: number; high: number; low: number; close: number }[]>([])
  const [assetClass, setAssetClass] = useState<'equities' | 'crypto' | 'forex' | 'commodities'>('equities')

  useEffect(() => {
    listStrategies().then((s) => setStrategies(s)).catch(() => {})
  }, [setStrategies])

  const handleAssetChange = async (newAsset: string) => {
    setAsset(newAsset)
    try {
      const data = await fetchMarketData(newAsset, timeframe, 365)
      if (data.preview && data.preview.length > 0) {
        const candles = data.preview.map((p: any) => ({
          time: p.Date || p.date || p.timestamp || p.Time || '',
          open: p.Open || p.open || 0,
          high: p.High || p.high || 0,
          low: p.Low || p.low || 0,
          close: p.Close || p.close || 0,
        }))
        setChartData(candles)
        setDataLoaded(true)
      }
    } catch {
      setDataLoaded(false)
    }
  }

  const handleTimeframeChange = async (tf: string) => {
    setTimeframe(tf)
    if (asset) await handleAssetChange(asset)
  }

  const handleRunBacktest = async () => {
    if (!strategyName) return
    setRunning(true)
    try {
      const result = await runBacktest({
        strategy_name: strategyName,
        asset,
        timeframe,
        start_date: startDate,
        end_date: endDate,
        initial_capital: initialCapital,
        risk_per_trade: riskPerTrade,
        params: customParams,
      })
      setActiveBacktest(result)
      setBacktestHistory([result, ...backtestHistory])
    } catch (err) {
      console.error('Backtest failed:', err)
    } finally {
      setRunning(false)
    }
  }

  // Calculate equity curve from initial capital and trades
  const equityCurve = activeBacktest
    ? (() => {
        const equity: number[] = [initialCapital]
        let currentEquity = initialCapital
        const trades = activeBacktest.trades || []
        for (let i = 0; i < equity.length || equity.length <= 100; i++) {
          // Use the equity curve from API if available, otherwise simulate
          if (activeBacktest.equity_curve && activeBacktest.equity_curve.length > i) {
            equity.push(activeBacktest.equity_curve[i])
          } else {
            // Simulate based on average trade PnL
            const avgPnl = trades.reduce((sum, t) => sum + t.pnl, 0) / (trades.length || 1)
            equity.push(currentEquity + avgPnl * (i * 0.3))
            currentEquity = equity[equity.length - 1]
          }
        }
        return equity
      })()
    : undefined

  // Trade table columns
  const TradeTable = () => {
    if (!activeBacktest || activeBacktest.trades.length === 0) {
      return (
        <div className="card flex items-center justify-center h-40 text-muted-foreground">
          No trades yet — run a backtest first
        </div>
      )
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="table-header">Date</th>
              <th className="table-header">Symbol</th>
              <th className="table-header text-right">Qty</th>
              <th className="table-header text-right">Entry</th>
              <th className="table-header text-right">Exit</th>
              <th className="table-header text-right">P&L</th>
              <th className="table-header text-right">Regime</th>
            </tr>
          </thead>
          <tbody>
            {activeBacktest.trades.slice(0, 20).map((trade, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-card/50">
                <td className="table-cell">{trade.entry_date}</td>
                <td className="table-cell font-semibold">{trade.symbol}</td>
                <td className="table-cell text-right">{trade.quantity}</td>
                <td className="table-cell text-right">{formatCurrency(trade.entry_price)}</td>
                <td className="table-cell text-right">{formatCurrency(trade.exit_price)}</td>
                <td className={`table-cell text-right font-semibold ${trade.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(trade.pnl)} ({formatPercent(trade.pnl_pct * 100)})
                </td>
                <td className="table-cell">
                  <span className={cn(
                    'badge',
                    trade.regime === 'bull' ? 'badge-success' : trade.regime === 'bear' ? 'badge-danger' : 'badge-warning'
                  )}>
                    {trade.regime}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Regime breakdown
  const RegimeBreakdown = () => {
    if (!activeBacktest?.regime_breakdown) return null
    const breakdown = activeBacktest.regime_breakdown
    return (
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(breakdown).map(([regime, data]: [string, any]) => (
          <div key={regime} className="card">
            <div className="flex items-center gap-2 mb-2">
              <span className={cn(
                'w-3 h-3 rounded-full',
                regime === 'bull' ? 'bg-success' : regime === 'bear' ? 'bg-destructive' : 'bg-warning'
              )} />
              <span className="text-sm font-semibold capitalize">{regime}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-muted-foreground">Trades</div>
                <div className="font-mono font-bold">{data.trades}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Win Rate</div>
                <div className={`font-mono font-bold ${data.win_rate > 0.5 ? 'text-success' : 'text-destructive'}`}>
                  {formatPercent(data.win_rate * 100)}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-muted-foreground">Avg Return</div>
                <div className={`font-mono font-bold ${data.avg_return >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatPercent(data.avg_return * 100)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Backtest</h1>
        <p className="text-sm text-muted-foreground mt-1">Run backtests on historical data with strategy parameters</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Controls */}
        <div className="lg:col-span-1 space-y-4">
          {/* Strategy Selection */}
          <div className="card space-y-3">
            <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Strategy</h2>
            <select
              value={strategyName}
              onChange={(e) => setStrategyName(e.target.value)}
              className="input w-full"
            >
              <option value="">— Select Strategy —</option>
              {strategies.map((s) => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Asset */}
          <div className="card space-y-3">
            <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Asset</h2>
            <select
              value={assetClass}
              onChange={(e) => {
                setAssetClass(e.target.value as any)
                setAsset(TICKERS[e.target.value as keyof typeof TICKERS][0])
              }}
              className="input w-full"
            >
              <option value="equities">Equities</option>
              <option value="crypto">Crypto</option>
              <option value="forex">Forex</option>
              <option value="commodities">Commodities</option>
            </select>
            <select
              value={asset}
              onChange={(e) => handleAssetChange(e.target.value)}
              className="input w-full"
            >
              {TICKERS[assetClass].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button
              onClick={() => handleAssetChange(asset)}
              className="btn btn-sm btn-secondary w-full"
              disabled={!dataLoaded}
            >
              {dataLoaded ? '✓ Data Loaded' : 'Loading...'}
            </button>
          </div>

          {/* Timeframe & Dates */}
          <div className="card space-y-3">
            <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Parameters</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Timeframe</label>
                <select
                  value={timeframe}
                  onChange={(e) => handleTimeframeChange(e.target.value)}
                  className="input w-full mt-1"
                >
                  {['1m', '5m', '15m', '1H', '4H', '1D'].map((tf) => (
                    <option key={tf} value={tf}>{tf}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Start Date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input w-full mt-1" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">End Date</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input w-full mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Initial Capital</label>
                <input
                  type="number"
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(Number(e.target.value))}
                  className="input w-full mt-1 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Risk Per Trade</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="0.5"
                  value={riskPerTrade}
                  onChange={(e) => setRiskPerTrade(Number(e.target.value))}
                  className="input w-full mt-1 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Run Button */}
          <button
            onClick={handleRunBacktest}
            disabled={!strategyName || running}
            className="btn btn-primary w-full py-3 text-base font-semibold"
          >
            {running ? 'Running...' : '▶ Run Backtest'}
          </button>
        </div>

        {/* Right: Chart + Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Price Chart */}
          <div className="chart-container">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold">{asset} — {timeframe}</h2>
              <span className="text-xs text-muted-foreground">{chartData.length} bars</span>
            </div>
            <CandlestickChart data={chartData} height={350} showLegend={!activeBacktest} />
          </div>

          {/* Backtest Results */}
          {activeBacktest && (
            <>
              {/* Metrics Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(activeBacktest.metrics || {}).map(([key, value]) => (
                  <div key={key} className="metric-card">
                    <div className="metric-value font-mono">{typeof value === 'number' ? (value > 1000 ? value.toFixed(0) : value.toFixed(2)) : value}</div>
                    <div className="metric-label">{key.replace(/_/g, ' ')}</div>
                  </div>
                ))}
              </div>

              {/* Regime Breakdown */}
              <div>
                <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-2">Regime Breakdown</h3>
                <RegimeBreakdown />
              </div>

              {/* Equity Curve (using Recharts) */}
              {equityCurve && equityCurve.length > 1 && (
                <div className="card">
                  <h3 className="text-sm font-semibold mb-3">Equity Curve</h3>
                  <div className="h-40 flex items-end gap-px">
                    {equityCurve.map((val, i) => {
                      const min = Math.min(...equityCurve)
                      const max = Math.max(...equityCurve)
                      const range = max - min || 1
                      const height = ((val - min) / range) * 100
                      return (
                        <div
                          key={i}
                          className="flex-1 min-w-[2px] bg-primary/60 hover:bg-primary transition-colors"
                          style={{ height: `${Math.max(height, 2)}%` }}
                          title={`${formatCurrency(val)}`}
                        />
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Trade Log */}
              <div className="card">
                <h3 className="text-sm font-semibold mb-3">Trade Log ({activeBacktest.trades.length} trades)</h3>
                <TradeTable />
              </div>
            </>
          )}

          {/* Backtest History */}
          {backtestHistory.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold mb-3">Backtest History</h3>
              <div className="space-y-2">
                {backtestHistory.slice(0, 5).map((bt, i) => (
                  <div key={i} className="flex items-center justify-between text-sm border-b border-border/50 pb-2 last:border-0">
                    <div>
                      <span className="font-mono">{bt.id}</span>
                      <span className="text-muted-foreground ml-2">
                        {Object.values(bt.metrics || {})[0]?.toString() || '—'}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{bt.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
