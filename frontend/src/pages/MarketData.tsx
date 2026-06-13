import { useState, useEffect } from 'react'
import { listDataSources, fetchMarketData, getCurrentRegime } from '@/services/api'
import type { FetchedData } from '@/types'
import type { DataSources } from '@/types'
import CandlestickChart from '@/components/chart/CandlestickChart'
import { formatCurrency, formatDate, cn } from '@/lib/utils'

const ALL_ASSETS = {
  equities: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'SPY', 'QQQ', 'NVDA', 'META', 'AMD', 'NFLX', 'DIS', 'BA', 'INTC', 'KO'],
  crypto: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'ADA-USD', 'DOT-USD', 'MATIC-USD', 'AVAX-USD', 'LINK-USD', 'UNI-USD', 'DOGE-USD'],
  forex: ['EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'AUDUSD=X', 'USDCAD=X', 'USDCHF=X'],
  commodities: ['GC=F', 'CL=F', 'SI=F', 'HG=F', 'ZC=F', 'ZW=F', 'ZB=F', 'PL=F'],
}

export default function MarketDataPage() {
  const [activeCategory, setActiveCategory] = useState<'equities' | 'crypto' | 'forex' | 'commodities'>('equities')
  const [selectedAsset, setSelectedAsset] = useState('AAPL')
  const [dataSources, setDataSources] = useState<DataSources | null>(null)
  const [fetchedData, setFetchedData] = useState<FetchedData | null>(null)
  const [loading, setLoading] = useState(false)
  const [chartData, setChartData] = useState<{ time: string; open: number; high: number; low: number; close: number }[]>([])
  const [days, setDays] = useState(90)
  const [regime, setRegime] = useState<any>(null)
  const [regimeLoading, setRegimeLoading] = useState(false)

  useEffect(() => {
    listDataSources().then(setDataSources).catch(() => {})
  }, [])

  const handleFetchData = async (asset: string) => {
    setSelectedAsset(asset)
    setLoading(true)
    try {
      const data = await fetchMarketData(asset, '1D', days)
      setFetchedData(data)
      if (data.preview && data.preview.length > 0) {
        const candles = data.preview.map((p: any) => ({
          time: p.Date || p.date || p.timestamp || p.Time || '',
          open: p.Open || p.open || 0,
          high: p.High || p.high || 0,
          low: p.Low || p.low || 0,
          close: p.Close || p.close || 0,
        }))
        setChartData(candles)
      }

      // Also fetch regime
      try {
        const regimeData = await getCurrentRegime(asset)
        setRegime(regimeData)
      } catch {
        setRegime(null)
      }
    } catch (err) {
      console.error('Fetch data error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    handleFetchData(selectedAsset)
  }, [activeCategory, days])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Market Data</h1>
        <p className="text-sm text-muted-foreground mt-1">Browse and fetch market data across asset classes</p>
      </div>

      {/* Data Sources */}
      {dataSources && (
        <div className="card">
          <h2 className="text-sm font-semibold mb-3">Data Sources</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(dataSources).map(([assetClass, sources]) => (
              <div key={assetClass} className="text-center">
                <div className="text-xs uppercase text-muted-foreground tracking-wider mb-1">{assetClass}</div>
                {Object.entries(sources).map(([name, status]) => (
                  <div key={name} className="inline-flex items-center gap-1.5 mt-1">
                    <span className="status-dot status-active" />
                    <span className="text-xs font-mono">{name}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Asset Browser */}
        <div className="lg:col-span-1 space-y-4">
          {/* Category tabs */}
          <div className="flex gap-1 bg-card border border-border rounded-lg p-1">
            {(['equities', 'crypto', 'forex', 'commodities'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors capitalize',
                  activeCategory === cat ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Asset list */}
          <div className="card space-y-1 max-h-[500px] overflow-y-auto">
            <div className="text-xs uppercase text-muted-foreground tracking-wider mb-2">{activeCategory}</div>
            {ALL_ASSETS[activeCategory].map((asset) => (
              <button
                key={asset}
                onClick={() => handleFetchData(asset)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded transition-colors font-mono text-sm',
                  selectedAsset === asset
                    ? 'bg-primary/20 text-primary'
                    : 'hover:bg-secondary text-foreground'
                )}
              >
                {asset}
              </button>
            ))}
          </div>

          {/* Lookback */}
          <div>
            <label className="text-xs text-muted-foreground">Lookback Period</label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="input w-full mt-1"
            >
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="180">180 days</option>
              <option value="365">1 year</option>
              <option value="730">2 years</option>
            </select>
          </div>
        </div>

        {/* Chart & Data */}
        <div className="lg:col-span-3 space-y-4">
          {/* Regime indicator */}
          {regime && (
            <div className="flex items-center gap-4 card">
              <div className="flex-1">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Regime Detection</div>
                <div className="text-lg font-bold mt-1">
                  {regime.regime?.toUpperCase()}{' '}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({regime.asset})
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Confidence</div>
                <div className={`text-lg font-bold font-mono ${regime.confidence > 0.7 ? 'text-success' : 'text-warning'}`}>
                  {(regime.confidence * 100).toFixed(0)}%
                </div>
              </div>
              <button
                onClick={async () => {
                  setRegimeLoading(true)
                  try {
                    const res = await fetch(`/api/v1/regime/train?asset=${selectedAsset}&lookback_days=${days}`)
                    if (res.ok) {
                      const data = await res.json()
                      console.log('Regime retrained:', data)
                    }
                  } catch (err) {
                    console.error('Retrain failed:', err)
                  }
                  setRegimeLoading(false)
                }}
                className={cn('btn btn-sm btn-secondary', regimeLoading && 'opacity-50')}
              >
                {regimeLoading ? 'Training...' : 'Retrain HMM'}
              </button>
            </div>
          )}

          {/* Chart */}
          <div className="chart-container">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                {selectedAsset} — {days}D Chart
              </h2>
              {fetchedData && (
                <div className="text-xs text-muted-foreground">
                  {fetchedData.data_points} data points · {fetchedData.columns.join(', ')}
                </div>
              )}
            </div>
            <CandlestickChart data={chartData} height={400} showLegend={true} />
          </div>

          {/* Data Preview Table */}
          {fetchedData && fetchedData.preview && fetchedData.preview.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold mb-3">Data Preview (Last 5 rows)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {fetchedData.columns.slice(0, 6).map((col) => (
                        <th key={col} className="table-header">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fetchedData.preview.slice(-5).map((row: any, i: number) => (
                      <tr key={i} className="border-b border-border/50">
                        {fetchedData.columns.slice(0, 6).map((col) => (
                          <td key={col} className="table-cell">
                            {row[col] !== undefined
                              ? typeof row[col] === 'number'
                                ? row[col].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
                                : row[col]
                              : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
