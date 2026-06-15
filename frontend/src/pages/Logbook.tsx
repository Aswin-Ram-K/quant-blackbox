import { useState } from 'react'
import { formatPercent, formatCurrency, formatNumber } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'
import CandlestickChart from '@/components/chart/CandlestickChart'

const MOCK_TRADES = [
  { id: 1, strategy: 'Momentum Breakout', asset: 'AAPL', type: 'BUY', entry: 178.50, exit: 185.20, pnl: 6.70, pnlPct: 3.75, date: '2026-06-10', regime: 'bull' },
  { id: 2, strategy: 'Mean Reversion', asset: 'TSLA', type: 'SELL', entry: 245.00, exit: 238.30, pnl: 6.70, pnlPct: 2.73, date: '2026-06-09', regime: 'bear' },
  { id: 3, strategy: 'Carry / SMA Cross', asset: 'SPY', type: 'BUY', entry: 520.00, exit: 515.50, pnl: -4.50, pnlPct: -0.87, date: '2026-06-08', regime: 'chop' },
  { id: 4, strategy: 'Volatility Breakout', asset: 'NVDA', type: 'BUY', entry: 890.00, exit: 912.50, pnl: 22.50, pnlPct: 2.53, date: '2026-06-07', regime: 'bull' },
  { id: 5, strategy: 'Pairs Trading', asset: 'XLF', type: 'SELL', entry: 42.80, exit: 41.50, pnl: 1.30, pnlPct: 3.04, date: '2026-06-06', regime: 'bear' },
  { id: 6, strategy: 'Momentum Breakout', asset: 'META', type: 'SELL', entry: 510.00, exit: 520.00, pnl: -10.00, pnlPct: -1.96, date: '2026-06-05', regime: 'bull' },
  { id: 7, strategy: 'Mean Reversion', asset: 'AMD', type: 'BUY', entry: 165.00, exit: 172.30, pnl: 7.30, pnlPct: 4.42, date: '2026-06-04', regime: 'chop' },
  { id: 8, strategy: 'Carry / SMA Cross', asset: 'AAPL', type: 'BUY', entry: 172.00, exit: 178.50, pnl: 6.50, pnlPct: 3.78, date: '2026-06-03', regime: 'bull' },
]

const MOCK_EQUIITY = [100, 101, 103, 102, 104, 106, 105, 108, 107, 110, 109, 112, 111, 114, 116]

const MOCK_CHART = [
  { time: '2026-05-15', open: 170, high: 173, low: 169, close: 172 },
  { time: '2026-05-22', open: 172, high: 176, low: 170, close: 175 },
  { time: '2026-05-29', open: 175, high: 179, low: 173, close: 178 },
  { time: '2026-06-05', open: 178, high: 182, low: 176, close: 180 },
  { time: '2026-06-12', open: 180, high: 185, low: 178, close: 183 },
]

export default function Logbook() {
  const { trades, logEntries } = useAppStore()
  const [selectedStrategy, setSelectedStrategy] = useState<string>('all')
  const [dateRange, setDateRange] = useState('90d')

  const strategies = ['all', ...new Set(trades.map((t) => t.strategy))]
  const filtered = selectedStrategy === 'all' ? trades : trades.filter((t) => t.strategy === selectedStrategy)

  const totalPnl = filtered.reduce((sum, t) => sum + t.pnl, 0)
  const winRate = filtered.filter((t) => t.pnl > 0).length / (filtered.length || 1)
  const avgPnl = totalPnl / (filtered.length || 1)

  return (
    <div className="p-6 space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Logbook</h1>
          <p className="text-sm text-muted-foreground mt-1">Trade history &amp; backtest results</p>
        </div>
        <div className="flex gap-2">
          <select
            className="input w-32"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
            <option value="90d">90 days</option>
            <option value="1y">1 year</option>
          </select>
          <select
            className="input w-48"
            value={selectedStrategy}
            onChange={(e) => setSelectedStrategy(e.target.value)}
          >
            {strategies.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All Strategies' : s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total P&amp;L</div>
          <div className={`text-xl font-bold ${totalPnl >= 0 ? 'text-success' : 'text-destructive'}`}>
            {formatCurrency(totalPnl)}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Win Rate</div>
          <div className="text-xl font-bold">{formatPercent(winRate)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Avg Trade</div>
          <div className={`text-xl font-bold ${avgPnl >= 0 ? 'text-success' : 'text-destructive'}`}>
            {formatCurrency(avgPnl)}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Trades</div>
          <div className="text-xl font-bold">{filtered.length}</div>
        </div>
      </div>

      {/* Equity Curve */}
      <div className="chart-container">
        <div className="px-4 py-3 border-b border-border/40">
          <h2 className="text-sm font-semibold">Equity Curve</h2>
        </div>
        <CandlestickChart data={MOCK_CHART} equityCurve={MOCK_EQUIITY} equityCurveLabel="Portfolio Value" height={280} />
      </div>

      {/* Trade Log Table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/40">
          <h3 className="text-sm font-semibold">Trade Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Strategy</th>
                <th>Asset</th>
                <th>Type</th>
                <th>Entry</th>
                <th>Exit</th>
                <th>P&amp;L</th>
                <th>P&amp;L %</th>
                <th>Regime</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((trade) => (
                <tr key={trade.id}>
                  <td className="text-muted-foreground">{trade.date.split('T')[0]}</td>
                  <td className="font-medium">{trade.strategy}</td>
                  <td>{trade.symbol}</td>
                  <td>
                    <span className={`badge ${trade.side === 'buy' ? 'badge-success' : 'badge-danger'}`}>
                      {trade.side.toUpperCase()}
                    </span>
                  </td>
                  <td className="font-mono">{formatCurrency(trade.entry_price)}</td>
                  <td className="font-mono">{formatCurrency(trade.exit_price)}</td>
                  <td className={trade.pnl >= 0 ? 'text-success' : 'text-destructive'}>
                    {formatCurrency(trade.pnl)}
                  </td>
                  <td className={trade.pnl_pct >= 0 ? 'text-success' : 'text-destructive'}>
                    {formatPercent(trade.pnl_pct)}
                  </td>
                  <td>
                    <span className={`badge ${trade.regime === 'bull' ? 'badge-success' : trade.regime === 'bear' ? 'badge-danger' : 'badge-warning'}`}>
                      {trade.regime}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
