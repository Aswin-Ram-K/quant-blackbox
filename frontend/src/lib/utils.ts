export function cn(...inputs: any[]) {
  return [...new Set(inputs.filter(Boolean))].join(' ')
}

export function formatNumber(n: number, decimals = 2): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(decimals)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(decimals)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(decimals)}K`
  return n.toFixed(decimals)
}

export function formatPercent(pct: number): string {
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`
}

export function formatCurrency(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(2)}K`
  return `${sign}$${abs.toFixed(2)}`
}

export function formatDate(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// Generate mock data for UI testing when API is unavailable
export function mockTrades(count: number = 20): Trade[] {
  const strategies = ['Momentum', 'Mean Reversion', 'Carry', 'Volatility', 'Pairs Trading']
  const symbols = ['AAPL', 'BTC-USD', 'SPY', 'ETH-USD', 'TSLA', 'NVDA', 'SOL-USD', 'QQQ']
  const regimes = ['bull', 'bear', 'chop']
  const triggers = ['RSI oversold', 'SMA cross', 'Volume breakout', 'Bollinger band touch', 'Spread z-score']

  return Array.from({ length: count }, (_, i) => {
    const strategy = strategies[Math.floor(Math.random() * strategies.length)]
    const symbol = symbols[Math.floor(Math.random() * symbols.length)]
    const regime = regimes[Math.floor(Math.random() * regimes.length)]
    const pnl = (Math.random() - 0.4) * 500
    const entry = Math.random() * 200 + 50
    const exit = entry * (1 + pnl / (entry * 10))

    return {
      id: `trd-${Date.now()}-${i}`,
      date: new Date(Date.now() - Math.random() * 90 * 86400000).toISOString(),
      strategy,
      phase: Math.random() > 0.5 ? 'live' : 'backtest',
      symbol,
      side: Math.random() > 0.5 ? 'buy' : 'sell',
      quantity: Math.floor(Math.random() * 100) + 1,
      entry_price: parseFloat(entry.toFixed(2)),
      exit_price: parseFloat(exit.toFixed(2)),
      pnl: parseFloat(pnl.toFixed(2)),
      pnl_pct: parseFloat((pnl / (entry * 10) * 100).toFixed(2)),
      trigger: triggers[Math.floor(Math.random() * triggers.length)],
      reason: `Strategy ${strategy} signal on ${symbol}`,
      outcome: pnl > 50 ? 'good' : pnl < -50 ? 'bad' : 'mixed',
      notes: '',
      regime,
      metadata: {},
    }
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function mockChartData(days: number = 90) {
  const data: { time: string; open: number; high: number; low: number; close: number; volume?: number }[] = []
  let price = 150 + Math.random() * 50
  const now = new Date()
  for (let i = days; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const change = (Math.random() - 0.48) * 6
    const open = price
    const close = price + change
    const high = Math.max(open, close) + Math.random() * 3
    const low = Math.min(open, close) - Math.random() * 3
    data.push({
      time: d.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.floor(Math.random() * 50000000) + 10000000,
    })
    price = close
  }
  return data
}

export function mockEquityCurve(trades: Trade[], initial: number = 10000): number[] {
  return trades.reduce<number[]>((eq, t, i) => {
    if (i === 0) return [initial]
    return [...eq, eq[eq.length - 1] + t.pnl]
  }, [initial])
}
