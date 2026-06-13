import { useState, useEffect } from 'react'
import { listStrategies, registerStrategy } from '@/services/api'
import type { StrategyInfo } from '@/types'
import { useAppStore } from '@/store/appStore'
import { cn } from '@/lib/utils'

const PRESET_STRATEGIES = [
  {
    name: 'Momentum',
    description: 'Buys on breakout above N-day high with volume confirmation. Sells on breakdown.',
    markets: ['equities'] as string[],
    timeframes: ['1D', '4H', '1H'] as string[],
    tier: 'swing' as const,
    parameters: {
      lookback: { type: 'int', default: 20, min: 5, max: 100, step: 1 },
      volume_mult: { type: 'float', default: 1.2, min: 0.5, max: 5.0, step: 0.1 },
    },
  },
  {
    name: 'Mean Reversion',
    description: 'Buys when RSI is oversold and price hits lower Bollinger Band. Exits on RSI return.',
    markets: ['crypto', 'equities'] as string[],
    timeframes: ['1D', '4H', '1H', '15m', '5m'] as string[],
    tier: 'swing' as const,
    parameters: {
      rsi_period: { type: 'int', default: 14, min: 5, max: 50, step: 1 },
      bb_std: { type: 'int', default: 2, min: 1, max: 4, step: 1 },
      rsi_oversold: { type: 'float', default: 30, min: 10, max: 40, step: 1 },
      rsi_overbought: { type: 'float', default: 70, min: 60, max: 90, step: 1 },
    },
  },
  {
    name: 'Carry',
    description: 'Golden cross / death cross using SMA 50 / SMA 200 with momentum filter.',
    markets: ['commodities', 'equities', 'crypto'] as string[],
    timeframes: ['1D', '4H'] as string[],
    tier: 'long-term' as const,
    parameters: {
      sma_fast: { type: 'int', default: 50, min: 10, max: 100, step: 1 },
      sma_slow: { type: 'int', default: 200, min: 50, max: 500, step: 1 },
      momentum_filter: { type: 'bool', default: true, choices: [true, false] },
    },
  },
  {
    name: 'Volatility',
    description: 'Buys on breakout above N-day high with volume spike. Sells on fade below SMA.',
    markets: ['equities', 'crypto', 'commodities'] as string[],
    timeframes: ['1D', '4H', '1H', '15m', '5m', '1m'] as string[],
    tier: 'intraday' as const,
    parameters: {
      lookback: { type: 'int', default: 10, min: 3, max: 50, step: 1 },
      volume_mult: { type: 'float', default: 2.0, min: 1.0, max: 10.0, step: 0.1 },
    },
  },
  {
    name: 'Pairs Trading',
    description: 'Stat arb on correlated assets. Opens long/short on spread z-score deviation.',
    markets: ['equities', 'crypto'] as string[],
    timeframes: ['1D', '4H', '1H'] as string[],
    tier: 'swing' as const,
    parameters: {
      lookback: { type: 'int', default: 20, min: 10, max: 100, step: 1 },
      entry_zscore: { type: 'float', default: 2.0, min: 1.0, max: 5.0, step: 0.1 },
      exit_zscore: { type: 'float', default: 0.5, min: 0.0, max: 2.0, step: 0.1 },
    },
  },
] as const

export default function StrategyBuilderPage() {
  const { strategies, setStrategies, customStrategyCode, setCustomStrategyCode } = useAppStore()
  const [availableStrategies, setAvailableStrategies] = useState<typeof PRESET_STRATEGIES>(PRESET_STRATEGIES)
  const [mode, setMode] = useState<'preset' | 'custom'>('preset')
  const [selectedPreset, setSelectedPreset] = useState<(typeof PRESET_STRATEGIES)[0] | null>(null)
  const [params, setParams] = useState<Record<string, any>>({})
  const [registering, setRegistering] = useState(false)
  const [registered, setRegistered] = useState(false)

  useEffect(() => {
    listStrategies().then((s) => setStrategies(s)).catch(() => {})
  }, [setStrategies])

  const handlePresetSelect = (preset: (typeof PRESET_STRATEGIES)[0]) => {
    setSelectedPreset(preset)
    const defaults: Record<string, any> = {}
    Object.entries(preset.parameters).forEach(([key, p]) => {
      defaults[key] = p.default
    })
    setParams(defaults)
    setRegistered(false)
  }

  const handleParamChange = (key: string, value: any) => {
    setParams((prev) => ({ ...prev, [key]: value }))
  }

  const handleRegister = async () => {
    if (!selectedPreset) return
    setRegistering(true)
    try {
      await registerStrategy({
        name: selectedPreset.name,
        description: selectedPreset.description,
        markets: selectedPreset.markets,
        timeframes: selectedPreset.timeframes,
        tier: selectedPreset.tier,
        parameters: params,
      })
      setRegistered(true)
      setStrategies([...strategies, { ...selectedPreset, parameters: params } as StrategyInfo])
    } catch (err) {
      console.error('Register strategy failed:', err)
    } finally {
      setRegistering(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Strategy Builder</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create, configure, and register trading strategies
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('preset')}
            className={cn('btn btn-sm px-4', mode === 'preset' ? 'bg-primary text-primary-foreground' : 'bg-secondary')}
          >
            Presets
          </button>
          <button
            onClick={() => setMode('custom')}
            className={cn('btn btn-sm px-4', mode === 'custom' ? 'bg-primary text-primary-foreground' : 'bg-secondary')}
          >
            Custom Code
          </button>
        </div>
      </div>

      {/* Preset Mode */}
      {mode === 'preset' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Strategy List */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">
              Available Strategies ({availableStrategies.length})
            </h2>
            {availableStrategies.map((s) => {
              const isRegistered = strategies.some((st) => st.name === s.name)
              return (
                <button
                  key={s.name}
                  onClick={() => handlePresetSelect(s)}
                  className={cn(
                    'w-full text-left p-4 rounded-lg border transition-all',
                    selectedPreset?.name === s.name
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:border-primary/30'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{s.name}</span>
                    <span className="badge badge-info">{s.tier}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>
                  <div className="flex gap-1.5 mt-2">
                    {s.markets.map((m) => (
                      <span key={m} className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                        {m}
                      </span>
                    ))}
                  </div>
                  {isRegistered && <span className="badge badge-success mt-2 block text-center">Registered</span>}
                </button>
              )
            })}
          </div>

          {/* Parameter Editor */}
          <div className="lg:col-span-2">
            {selectedPreset ? (
              <div className="card space-y-6">
                <div>
                  <h2 className="text-lg font-semibold">{selectedPreset.name}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{selectedPreset.description}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="badge badge-info">{selectedPreset.tier}</span>
                    {selectedPreset.timeframes.map((tf) => (
                      <span key={tf} className="badge badge-info">{tf}</span>
                    ))}
                  </div>
                </div>

                {/* Parameters */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Parameters</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(selectedPreset.parameters).map(([key, param]) => (
                      <div key={key} className="space-y-2">
                        <label className="text-sm text-muted-foreground font-mono">{key}</label>
                        {param.type === 'bool' ? (
                          <select
                            value={String(params[key] ?? param.default)}
                            onChange={(e) => handleParamChange(key, e.target.value === 'true')}
                            className="input"
                          >
                            <option value="true">True</option>
                            <option value="false">False</option>
                          </select>
                        ) : param.type === 'int' ? (
                          <input
                            type="range"
                            min={param.min}
                            max={param.max}
                            step={param.step}
                            value={params[key] ?? param.default}
                            onChange={(e) => handleParamChange(key, parseInt(e.target.value))}
                            className="w-full accent-primary"
                          />
                        ) : (
                          <input
                            type="number"
                            step={param.step}
                            min={param.min}
                            max={param.max}
                            value={params[key] ?? param.default}
                            onChange={(e) => handleParamChange(key, parseFloat(e.target.value))}
                            className="input font-mono"
                          />
                        )}
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{param.min}</span>
                          <span className="font-mono font-semibold text-primary">{params[key] ?? param.default}</span>
                          <span>{param.max}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setSelectedPreset(null)
                      setParams({})
                    }}
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleRegister}
                    disabled={registering || strategies.some((s) => s.name === selectedPreset.name)}
                    className={cn(
                      'btn btn-primary',
                      registered && 'bg-success'
                    )}
                  >
                    {registered ? '✓ Registered' : registering ? 'Registering...' : 'Register Strategy'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="card flex items-center justify-center h-64 text-muted-foreground">
                Select a strategy preset to configure parameters
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Code Mode */}
      {mode === 'custom' && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-lg font-semibold mb-2">Custom Python Strategy</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Write your own strategy in Python. The engine expects a class with an <code className="bg-secondary px-1 py-0.5 rounded text-xs">analyze()</code> method.
            </p>
            <textarea
              className="code-editor font-mono text-sm w-full min-h-[400px]"
              value={customStrategyCode}
              onChange={(e) => setCustomStrategyCode(e.target.value)}
              spellCheck={false}
            />
          </div>

          <div className="flex justify-end">
            <button className="btn btn-primary" onClick={() => alert('Custom strategy submitted for evaluation')}>
              Compile & Register
            </button>
          </div>

          {/* Code Reference */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-3">Strategy Interface Reference</h3>
            <pre className="text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre">
{`class StrategyBase:
    name: str          # Display name
    description: str   # What the strategy does
    markets: list[str]   # ["equities", "crypto", "commodities", "forex"]
    timeframes: list[str]  # ["1D", "4H", "1H", "15m", "5m", "1m"]
    tier: str         # "long-term", "swing", "intraday"
    parameters: dict  # Schema: {key: {type, default, min, max, step}}

    def analyze(self, data: pd.DataFrame, params: dict) -> Signal:
        """
        Analyze OHLCV data and return a trading signal.
        
        Args:
            data: DataFrame with columns [Open, High, Low, Close, Volume]
            params: Strategy parameters (merged with defaults)
        
        Returns:
            Signal: {
                "direction": 1|0|-1,  # 1=buy, 0=hold, -1=sell
                "strength": 0.0-1.0,  # Confidence level
                "metadata": {          # Arbitrary info
                    "type": "str",
                    "signal": "str", 
                    "reason": "str",
                    "stop_loss": float,
                    "take_profit": float,
                }
            }
        """
        raise NotImplementedError

    def validate_params(self, params: dict) -> bool:
        """Validate parameters before execution."""
        return True
`}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
