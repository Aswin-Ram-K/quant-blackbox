import { useState, useEffect } from 'react'
import { startPaperTrading, placePaperOrder, getPortfolio } from '@/services/api'
import type { PaperTradeRequest, PortfolioState } from '@/types'
import { useAppStore } from '@/store/appStore'
import { formatCurrency, formatPercent, cn } from '@/lib/utils'

const TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'BTC-USD', 'ETH-USD', 'SPY', 'NVDA', 'META']

export default function PaperTradingPage() {
  const { portfolio, setPortfolio, setPaperTradingActive, paperTradingActive } = useAppStore()
  const [orderForm, setOrderForm] = useState<PaperTradeRequest>({
    symbol: 'AAPL',
    quantity: 10,
    side: 'buy',
    order_type: 'market',
  })
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [portfolioLoading, setPortfolioLoading] = useState(false)

  const fetchPortfolio = async () => {
    setPortfolioLoading(true)
    try {
      const data = await getPortfolio()
      setPortfolio(data)
    } catch {
      // Use fallback data
      setPortfolio({
        cash: 100000,
        positions: [],
        total_value: 100000,
        unrealized_pnl: 0,
        realized_pnl: 0,
      })
    } finally {
      setPortfolioLoading(false)
    }
  }

  useEffect(() => {
    fetchPortfolio()
    const interval = setInterval(fetchPortfolio, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const handlePlaceOrder = async () => {
    setLoading(true)
    try {
      const order = await placePaperOrder(orderForm)
      setOrders((prev) => [order, ...prev])
      fetchPortfolio()
    } catch (err) {
      console.error('Order failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStartPaperTrading = async () => {
    try {
      await startPaperTrading()
      setPaperTradingActive(true)
      fetchPortfolio()
    } catch (err) {
      console.error('Start paper trading failed:', err)
    }
  }

  const p = portfolio || { cash: 100000, positions: [], total_value: 100000, unrealized_pnl: 0, realized_pnl: 0 }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Paper Trading</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Test strategies with simulated real-money execution
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!paperTradingActive && (
            <button onClick={handleStartPaperTrading} className="btn btn-primary">
              Start Paper Trading
            </button>
          )}
          <span className={cn(
            'badge',
            paperTradingActive ? 'badge-success' : 'badge-danger'
          )}>
            {paperTradingActive ? '● Active' : '○ Inactive'}
          </span>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="metric-card">
          <div className="metric-label">Total Value</div>
          <div className="metric-value font-mono">{formatCurrency(p.total_value)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Cash</div>
          <div className="metric-value font-mono">{formatCurrency(p.cash)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Unrealized P&L</div>
          <div className={`metric-value font-mono ${p.unrealized_pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
            {formatCurrency(p.unrealized_pnl)}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Realized P&L</div>
          <div className={`metric-value font-mono ${p.realized_pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
            {formatCurrency(p.realized_pnl)}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Open Positions</div>
          <div className="metric-value font-mono">{p.positions.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Form */}
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Place Order</h2>

          <div className="flex gap-2">
            <button
              onClick={() => setOrderForm((f) => ({ ...f, side: 'buy' }))}
              className={cn('btn flex-1', orderForm.side === 'buy' ? 'bg-success' : 'bg-secondary')}
            >
              Buy
            </button>
            <button
              onClick={() => setOrderForm((f) => ({ ...f, side: 'sell' }))}
              className={cn('btn flex-1', orderForm.side === 'sell' ? 'bg-destructive' : 'bg-secondary')}
            >
              Sell
            </button>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Symbol</label>
            <select
              value={orderForm.symbol}
              onChange={(e) => setOrderForm((f) => ({ ...f, symbol: e.target.value }))}
              className="input w-full mt-1"
            >
              {TICKERS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Quantity</label>
              <input
                type="number"
                min="1"
                value={orderForm.quantity}
                onChange={(e) => setOrderForm((f) => ({ ...f, quantity: parseInt(e.target.value) || 0 }))}
                className="input w-full mt-1 font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Order Type</label>
              <select
                value={orderForm.order_type}
                onChange={(e) => setOrderForm((f) => ({ ...f, order_type: e.target.value as any }))}
                className="input w-full mt-1"
              >
                <option value="market">Market</option>
                <option value="limit">Limit</option>
                <option value="stop">Stop</option>
              </select>
            </div>
          </div>

          {orderForm.order_type === 'limit' && (
            <div>
              <label className="text-xs text-muted-foreground">Limit Price</label>
              <input
                type="number"
                step="0.01"
                className="input w-full mt-1 font-mono"
                placeholder="0.00"
              />
            </div>
          )}

          {orderForm.order_type === 'stop' && (
            <div>
              <label className="text-xs text-muted-foreground">Stop Price</label>
              <input
                type="number"
                step="0.01"
                className="input w-full mt-1 font-mono"
                placeholder="0.00"
              />
            </div>
          )}

          <button
            onClick={handlePlaceOrder}
            disabled={loading || !paperTradingActive}
            className={cn(
              'btn w-full py-3 font-semibold',
              orderForm.side === 'buy' ? 'bg-success' : 'bg-destructive',
              loading && 'opacity-50'
            )}
          >
            {loading ? 'Submitting...' : `${orderForm.side.toUpperCase()} ${orderForm.quantity} ${orderForm.symbol}`}
          </button>
        </div>

        {/* Positions */}
        <div className="lg:col-span-2 card space-y-3">
          <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">
            Open Positions ({p.positions.length})
          </h2>
          {p.positions.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              No open positions
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="table-header">Symbol</th>
                    <th className="table-header">Qty</th>
                    <th className="table-header text-right">Avg Price</th>
                    <th className="table-header text-right">Current</th>
                    <th className="table-header text-right">P&L</th>
                    <th className="table-header text-right">P&L %</th>
                  </tr>
                </thead>
                <tbody>
                  {p.positions.map((pos, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="table-cell font-semibold">{pos.symbol}</td>
                      <td className="table-cell">{pos.quantity}</td>
                      <td className="table-cell text-right">{formatCurrency(pos.avg_price)}</td>
                      <td className="table-cell text-right">{formatCurrency(pos.current_price)}</td>
                      <td className={`table-cell text-right font-semibold ${pos.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(pos.pnl)}
                      </td>
                      <td className={`table-cell text-right font-semibold ${pos.pnl_pct >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatPercent(pos.pnl_pct * 100)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Order History */}
      {orders.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold mb-3">Recent Orders</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="table-header">Time</th>
                  <th className="table-header">Symbol</th>
                  <th className="table-header">Side</th>
                  <th className="table-header text-right">Qty</th>
                  <th className="table-header text-right">Type</th>
                  <th className="table-header text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="table-cell text-xs">{new Date().toLocaleTimeString()}</td>
                    <td className="table-cell font-semibold">{order.symbol}</td>
                    <td className={`table-cell font-semibold ${order.side === 'buy' ? 'text-success' : 'text-destructive'}`}>
                      {order.side.toUpperCase()}
                    </td>
                    <td className="table-cell text-right">{order.quantity}</td>
                    <td className="table-cell">{order.order_type}</td>
                    <td className="table-cell">
                      <span className="badge badge-success">{order.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
