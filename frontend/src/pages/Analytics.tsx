import { useState } from 'react'
import { AnalyticsMetrics } from '@/types'
import { formatPercent } from '@/lib/utils'

// The 10 metrics as a complete analytics view
const METRIC_DEFINITIONS = [
  {
    key: 'win_rate',
    name: 'Win Rate',
    description: 'Percentage of trades that made money',
    target: '>55%',
    explanation: 'Out of 100 trades, how many actually made money. Above 55% is decent. Below 50% means the bot is gambling.',
    color: 'text-success',
    threshold: 0.55,
  },
  {
    key: 'profit_factor',
    name: 'Profit Factor',
    description: 'Gross profit divided by gross loss',
    target: '>1.5',
    explanation: 'For every $1 lost, how many dollars did we make? Target above 1.5. Below 1.0 means losing money.',
    color: 'text-success',
    threshold: 1.5,
  },
  {
    key: 'max_drawdown',
    name: 'Max Drawdown',
    description: 'Largest peak-to-trough decline',
    target: '<-15%',
    explanation: "What's the most money we ever lost, peak-to-trough? With $300, can't afford a 30% drawdown ($90 loss).",
    color: 'text-success',
    threshold: 0.15,
  },
  {
    key: 'sharpe_ratio',
    name: 'Sharpe Ratio',
    description: 'Risk-adjusted return',
    target: '>1.0',
    explanation: 'Are we making money the smart way, or just getting lucky with big swings? Above 1.0 is good.',
    color: 'text-success',
    threshold: 1.0,
  },
  {
    key: 'sortino_ratio',
    name: 'Sortino Ratio',
    description: 'Like Sharpe but only penalizes downside volatility',
    target: '>1.5',
    explanation: 'Higher is better. Optimizes for smooth equity curves, not jagged ones.',
    color: 'text-success',
    threshold: 1.5,
  },
  {
    key: 'recovery_time_days',
    name: 'Recovery Time',
    description: 'Days to get back to previous high after a loss',
    target: '<30 days',
    explanation: 'Shorter is better. Target under 30 days.',
    color: 'text-success',
    threshold: 30,
  },
  {
    key: 'avg_win_loss_ratio',
    name: 'Avg Win/Loss Ratio',
    description: 'Average winning trade vs losing trade',
    target: '>1.5',
    explanation: 'On average, are winning trades bigger than losing trades? Target: wins should be 1.5-2x bigger than losses.',
    color: 'text-success',
    threshold: 1.5,
  },
  {
    key: 'trade_frequency',
    name: 'Trade Frequency',
    description: 'How often we trade',
    target: 'balanced',
    explanation: 'Too many trades = fees eat profits. Too few = opportunity cost. Target: optimal golden zone.',
    color: 'text-success',
    threshold: 3,
  },
  {
    key: 'regime_fit',
    name: 'Regime Fit',
    description: 'Performance in different market states',
    target: '2/3 regimes',
    explanation: 'Is the bot making money in this type of market right now? Profitable in at least 2 out of 3.',
    color: 'text-success',
    threshold: 0.67,
  },
  {
    key: 'improvement_score',
    name: 'Improvement Score',
    description: 'Week-over-week performance growth',
    target: '>0',
    explanation: 'Is the bot better at the end of the week than the beginning? This is the self-improvement metric.',
    color: 'text-success',
    threshold: 0,
  },
]

// Simulated analytics data
const SAMPLE_METRICS: AnalyticsMetrics = {
  win_rate: 0.583,
  profit_factor: 2.34,
  max_drawdown: -0.052,
  sharpe_ratio: 1.82,
  sortino_ratio: 2.45,
  recovery_time_days: 3,
  avg_win_loss_ratio: 1.87,
  trade_frequency: 2.3,
  regime_fit: { bull: 0.82, bear: 0.45, chop: 0.67 },
  improvement_score: 0.15,
}

export default function AnalyticsPage() {
  const [metrics] = useState<AnalyticsMetrics>(SAMPLE_METRICS)

  const getMetricStatus = (def: typeof METRIC_DEFINITIONS[0], value: number): 'pass' | 'warn' | 'fail' => {
    if (def.key === 'max_drawdown' || def.key === 'recovery_time_days') {
      return Math.abs(value) < def.threshold ? 'pass' : 'warn'
    }
    if (def.key === 'improvement_score' || def.key === 'trade_frequency') {
      return value > 0 ? 'pass' : 'warn'
    }
    return value > def.threshold ? 'pass' : value > def.threshold * 0.7 ? 'warn' : 'fail'
  }

  const getStatusLabel = (status: 'pass' | 'warn' | 'fail') => {
    switch (status) {
      case 'pass': return 'PASS'
      case 'warn': return 'WARN'
      case 'fail': return 'FAIL'
    }
  }

  const getStatusBadge = (status: 'pass' | 'warn' | 'fail') => {
    switch (status) {
      case 'pass': return 'badge-success'
      case 'warn': return 'badge-warning'
      case 'fail': return 'badge-danger'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Deep dive into the 10 metrics that drive strategy improvement
        </p>
      </div>

      {/* Quick Score */}
      <div className="card">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-4">Performance Scorecard</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {METRIC_DEFINITIONS.map((def) => {
            const value = metrics[def.key as keyof AnalyticsMetrics]
            const numValue = typeof value === 'number' ? value : 0
            const status = getMetricStatus(def, numValue)
            return (
              <div key={def.key} className={`text-center p-3 rounded-lg border ${status === 'pass' ? 'border-success/30 bg-success/5' : status === 'warn' ? 'border-warning/30 bg-warning/5' : 'border-destructive/30 bg-destructive/5'}`}>
                <div className={`text-2xl font-bold font-mono ${status === 'pass' ? 'text-success' : status === 'warn' ? 'text-warning' : 'text-destructive'}`}>
                  {def.key === 'max_drawdown' ? `${(numValue * 100).toFixed(1)}%` : def.key === 'trade_frequency' ? numValue.toFixed(1) : def.key === 'improvement_score' ? `${(numValue * 100).toFixed(0)}%` : def.key === 'regime_fit' ? Object.values(metrics.regime_fit).reduce((a, b) => a + b, 0).toFixed(2) : numValue.toFixed(2)}
                </div>
                <div className="text-xs mt-1">{def.name}</div>
                <div className={`text-[10px] font-bold mt-0.5 ${getStatusBadge(status)}`}>
                  {getStatusLabel(status)}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pass/Fail Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(() => {
          const pass = METRIC_DEFINITIONS.filter((d) => {
            const v = metrics[d.key as keyof AnalyticsMetrics]
            const n = typeof v === 'number' ? v : 0
            return getMetricStatus(d, n) === 'pass'
          }).length
          const warn = METRIC_DEFINITIONS.filter((d) => {
            const v = metrics[d.key as keyof AnalyticsMetrics]
            const n = typeof v === 'number' ? v : 0
            return getMetricStatus(d, n) === 'warn'
          }).length
          const fail = 10 - pass - warn
          return (
            <>
              <div className="metric-card text-center">
                <div className="text-4xl font-bold text-success">{pass}</div>
                <div className="metric-label">Passing</div>
                <div className="metric-sublabel">All criteria met</div>
              </div>
              <div className="metric-card text-center">
                <div className="text-4xl font-bold text-warning">{warn}</div>
                <div className="metric-label">Warnings</div>
                <div className="metric-sublabel">Near threshold</div>
              </div>
              <div className="metric-card text-center">
                <div className="text-4xl font-bold text-destructive">{fail}</div>
                <div className="metric-label">Failing</div>
                <div className="metric-sublabel">Needs attention</div>
              </div>
            </>
          )
        })()}
      </div>

      {/* Detailed Metrics */}
      <div className="card space-y-6">
        <h2 className="text-lg font-semibold">Detailed Analysis</h2>

        {METRIC_DEFINITIONS.map((def, i) => {
          const value = metrics[def.key as keyof AnalyticsMetrics]
          const numValue = typeof value === 'number' ? value : 0
          const status = getMetricStatus(def, numValue)

          return (
            <div key={def.key} className="pb-4 border-b border-border last:border-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                    <span className="font-semibold">{def.name}</span>
                    <span className={`badge ${getStatusBadge(status)}`}>{getStatusLabel(status)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{def.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold font-mono">
                    {(() => {
                      if (def.key === 'max_drawdown') return `${(numValue * 100).toFixed(2)}%`
                      if (def.key === 'trade_frequency') return numValue.toFixed(1) + '/day'
                      if (def.key === 'improvement_score') return `${(numValue * 100).toFixed(1)}%`
                      if (def.key === 'recovery_time_days') return `${numValue}d`
                      if (def.key === 'regime_fit') {
                        const rf = metrics.regime_fit as Record<string, number>
                        return Object.entries(rf).map(([k, v]) => `${k}: ${(v * 100).toFixed(0)}%`).join(', ')
                      }
                      return numValue.toFixed(2)
                    })()}
                  </div>
                  <div className="text-xs text-muted-foreground">Target: {def.target}</div>
                </div>
              </div>

              {/* Value bar */}
              <div className="h-2 bg-secondary rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    status === 'pass' ? 'bg-success' : status === 'warn' ? 'bg-warning' : 'bg-destructive'
                  }`}
                  style={{
                    width: `${Math.min(
                      def.key === 'max_drawdown' ? Math.abs(numValue) * 100 :
                      def.key === 'trade_frequency' ? Math.min(numValue / 5 * 100, 100) :
                      def.key === 'improvement_score' ? Math.min(numValue * 100, 100) :
                      Math.min(numValue / def.threshold * 100, 100),
                      100
                    )}%`
                  }}
                />
              </div>

              <p className="text-xs text-muted-foreground mt-2 italic">
                {def.explanation}
              </p>
            </div>
          )
        })}
      </div>

      {/* Regime Fit Deep Dive */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Regime Fit — Performance by Market State</h2>
        <div className="grid grid-cols-3 gap-6">
          {Object.entries(metrics.regime_fit).map(([regime, fit]) => (
            <div key={regime} className="text-center">
              <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-3"
                style={{
                  background: `conic-gradient(
                    ${regime === 'bull' ? 'rgba(34,197,94,' : regime === 'bear' ? 'rgba(239,68,68,' : 'rgba(250,204,21,'}
                    ${fit}) 0deg,
                    hsla(215,20%,20%,1) ${fit * 360}deg
                  )`,
                }}
              >
                <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center">
                  <span className="text-lg font-bold font-mono">{(fit * 100).toFixed(0)}%</span>
                </div>
              </div>
              <div className="text-sm font-semibold capitalize">{regime}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {fit > 0.7 ? 'Strong performance' : fit > 0.5 ? 'Moderate' : 'Weak — consider disabling'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Improvement History */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Improvement Trend</h2>
        <div className="h-32 flex items-end gap-2">
          {[0.02, 0.05, 0.03, 0.08, 0.04, 0.06, 0.03, 0.09, 0.07, 0.12, 0.08, 0.15].map((val, i) => {
            const height = (val / 0.2) * 100
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-primary/70 hover:bg-primary transition-colors rounded-t"
                  style={{ height: `${Math.max(height, 4)}px` }}
                />
                <span className="text-[10px] text-muted-foreground">W{i + 1}</span>
              </div>
            )
          })}
        </div>
        <div className="text-xs text-muted-foreground mt-2 text-center">
          Last 12 weeks improvement score — Trending ↑
        </div>
      </div>
    </div>
  )
}
