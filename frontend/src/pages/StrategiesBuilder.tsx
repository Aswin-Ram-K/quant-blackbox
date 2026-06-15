import { useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { listStrategies } from '@/services/api'

const PRESETS = [
  { id: 'momentum', name: 'Momentum Breakout', desc: 'Trend following with volume confirmation', params: [{ key: 'lookback', label: 'Lookback', type: 'slider', min: 5, max: 50, default: 20 }, { key: 'volumeMult', label: 'Volume Multiplier', type: 'slider', min: 1, max: 5, default: 2 }] },
  { id: 'mean-reversion', name: 'Mean Reversion', desc: 'RSI + Bollinger Bands contrarian approach', params: [{ key: 'rsiPeriod', label: 'RSI Period', type: 'slider', min: 5, max: 30, default: 14 }, { key: 'bbPeriod', label: 'BB Period', type: 'slider', min: 10, max: 50, default: 20 }] },
  { id: 'carry', name: 'Carry / SMA Cross', desc: 'Golden cross and death cross strategy', params: [{ key: 'shortPeriod', label: 'Short SMA', type: 'slider', min: 5, max: 50, default: 20 }, { key: 'longPeriod', label: 'Long SMA', type: 'slider', min: 50, max: 200, default: 50 }] },
  { id: 'volatility', name: 'Volatility Breakout', desc: 'Breakout on volume spike', params: [{ key: 'atrPeriod', label: 'ATR Period', type: 'slider', min: 5, max: 30, default: 14 }, { key: 'breakMult', label: 'Breakout Multiplier', type: 'slider', min: 1, max: 3, default: 2 }] },
  { id: 'pairs', name: 'Pairs Trading', desc: 'Statistical arbitrage z-score', params: [{ key: 'lookback', label: 'Lookback', type: 'slider', min: 20, max: 200, default: 60 }, { key: 'zScore', label: 'Z-Score Entry', type: 'slider', min: 1, max: 4, default: 2 }] },
]

export default function StrategiesBuilder() {
  const { strategies, setStrategies } = useAppStore()
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [params, setParams] = useState<Record<string, number>>({})
  const [customCode, setCustomCode] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const preset = PRESETS.find((p) => p.id === selectedPreset)

  const loadPreset = async (presetId: string) => {
    setSelectedPreset(presetId)
    // Load default params
    const p = PRESETS.find((x) => x.id === presetId)
    if (p) {
      const defaults: Record<string, number> = {}
      p.params.forEach((param) => {
        defaults[param.key] = param.default
      })
      setParams(defaults)
    }
  }

  const handleSave = async () => {
    if (!selectedPreset) return
    setSaving(true)
    try {
      // For now, save to local state (backend integration later)
      const existingIdx = strategies.findIndex((s) => s.name === preset?.name)
      const newStrategy = {
        id: selectedPreset,
        name: preset?.name || '',
        description: preset?.desc || '',
        tier: preset ? 'standard' : 'custom',
        markets: ['equities'],
      }
      if (existingIdx >= 0) {
        strategies[existingIdx] = newStrategy
      } else {
        strategies.push(newStrategy)
      }
      setStrategies([...strategies])
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Strategy Builder</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and configure trading strategies</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={!selectedPreset || saving}
        >
          {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Strategy'}
        </button>
      </div>

      {/* Preset Library */}
      <div className="card">
        <div className="px-4 py-3 border-b border-border/40">
          <h3 className="text-sm font-semibold">Preset Strategies</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => loadPreset(p.id)}
                className={`card p-4 text-left transition-all duration-150 hover:border-primary/30 ${
                  selectedPreset === p.id ? 'border-primary/50 bg-primary/5' : ''
                }`}
              >
                <h4 className="text-sm font-semibold">{p.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
                <div className="flex gap-1.5 mt-2">
                  {p.params.map((param) => (
                    <span key={param.key} className="badge badge-info text-[10px] px-1.5 py-0.5">
                      {param.key}={param.default}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Param Controls */}
      {preset && (
        <div className="card">
          <div className="px-4 py-3 border-b border-border/40">
            <h3 className="text-sm font-semibold">Parameters — {preset.name}</h3>
          </div>
          <div className="p-4 space-y-4">
            {preset.params.map((param) => (
              <div key={param.key}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">{param.label}</label>
                  <span className="text-sm text-primary font-mono">{params[param.key] ?? param.default}</span>
                </div>
                <input
                  type="range"
                  min={param.min}
                  max={param.max}
                  step={param.type === 'slider' ? 1 : undefined}
                  value={params[param.key] ?? param.default}
                  onChange={(e) =>
                    setParams((prev) => ({ ...prev, [param.key]: Number(e.target.value) }))
                  }
                  className="w-full accent-primary"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Code Editor */}
      <div className="card">
        <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Custom Strategy Code</h3>
          <span className="text-xs text-muted-foreground">Python — must export analyze(data, params) → Signal</span>
        </div>
        <textarea
          value={customCode}
          onChange={(e) => setCustomCode(e.target.value)}
          className="textarea font-mono text-xs p-4 min-h-[200px] bg-[#0a0a0f] text-gray-300"
          placeholder={`# Custom Strategy — edit this code\n# Must export: analyze(data: pd.DataFrame, params: dict) -> Signal\n#\n# Signal: {"direction": 1|0|-1, "strength": 0.0-1.0}\n# direction: 1=buy, 0=hold, -1=sell\n\nimport pandas as pd\nimport numpy as np\n\nclass CustomStrategy:\n    name = "Custom"\n\n    def analyze(self, data, params):\n        close = data["Close"]\n        volume = data["Volume"]\n        \n        if len(close) < 20:\n            return {"direction": 0}\n            \n        momentum = close.pct_change().rolling(20).mean().iloc[-1]\n        \n        if momentum > 0.02:\n            return {"direction": 1, "strength": min(momentum * 50, 1.0)}\n        elif momentum < -0.02:\n            return {"direction": -1, "strength": min(abs(momentum) * 50, 1.0)}\n            \n        return {"direction": 0}`}
        />
      </div>
    </div>
  )
}
