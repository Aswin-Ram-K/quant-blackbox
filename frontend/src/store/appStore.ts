import { create } from 'zustand'
import type { StrategyInfo, NavItem, BacktestResponse, PortfolioState, RegimeResult } from '@/types'

interface AppState {
  // Navigation
  activeTab: string
  setActiveTab: (tab: string) => void

  // Strategies
  strategies: StrategyInfo[]
  setStrategies: (s: StrategyInfo[]) => void
  addStrategy: (s: StrategyInfo) => void
  selectedStrategy: string | null
  setSelectedStrategy: (name: string | null) => void

  // Backtests
  activeBacktest: BacktestResponse | null
  setActiveBacktest: (b: BacktestResponse | null) => void
  backtestHistory: BacktestResponse[]
  setBacktestHistory: (b: BacktestResponse[]) => void

  // Paper Trading
  paperTradingActive: boolean
  setPaperTradingActive: (active: boolean) => void
  portfolio: PortfolioState | null
  setPortfolio: (p: PortfolioState | null) => void

  // Regime
  regimes: Record<string, RegimeResult>
  setRegime: (asset: string, regime: RegimeResult) => void

  // Assets
  selectedAsset: string
  setSelectedAsset: (asset: string) => void
  customStrategyCode: string
  setCustomStrategyCode: (code: string) => void
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '⬡', path: '/' },
  { id: 'strategy', label: 'Strategy Builder', icon: '⟁', path: '/strategy' },
  { id: 'backtest', label: 'Backtest', icon: '◷', path: '/backtest' },
  { id: 'paper', label: 'Paper Trading', icon: '◈', path: '/paper' },
  { id: 'market', label: 'Market Data', icon: '◉', path: '/market' },
  { id: 'analytics', label: 'Analytics', icon: '◧', path: '/analytics' },
]

export const useAppStore = create<AppState>((set) => ({
  // Navigation
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Strategies
  strategies: [],
  setStrategies: (strategies) => set({ strategies }),
  addStrategy: (strategy) => set((state) => ({ strategies: [...state.strategies, strategy] })),
  selectedStrategy: null,
  setSelectedStrategy: (name) => set({ selectedStrategy: name }),

  // Backtests
  activeBacktest: null,
  setActiveBacktest: (backtest) => set({ activeBacktest: backtest }),
  backtestHistory: [],
  setBacktestHistory: (history) => set({ backtestHistory: history }),

  // Paper Trading
  paperTradingActive: false,
  setPaperTradingActive: (active) => set({ paperTradingActive: active }),
  portfolio: null,
  setPortfolio: (portfolio) => set({ portfolio }),

  // Regime
  regimes: {},
  setRegime: (asset, regime) => set((state) => ({ regimes: { ...state.regimes, [asset]: regime } })),

  // Assets
  selectedAsset: 'AAPL',
  setSelectedAsset: (asset) => set({ selectedAsset: asset }),

  // Custom Strategy
  customStrategyCode: `# Custom Strategy — edit this code
# Must export: analyze(data: pd.DataFrame, params: dict) -> Signal
#
# Signal: {"direction": 1|0|-1, "strength": 0.0-1.0, "metadata": {}}
# direction: 1=buy, 0=hold, -1=sell
#
import pandas as pd
import numpy as np

class CustomStrategy:
    name = "Custom"
    
    def analyze(self, data: pd.DataFrame, params: dict):
        """Your custom strategy logic here."""
        close = data["Close"]
        volume = data["Volume"]
        
        # Example: Simple momentum
        if len(close) < 20:
            return {"direction": 0}
            
        momentum = close.pct_change().rolling(20).mean().iloc[-1]
        
        if momentum > 0.02:
            return {"direction": 1, "strength": min(momentum * 50, 1.0)}
        elif momentum < -0.02:
            return {"direction": -1, "strength": min(abs(momentum) * 50, 1.0)}
        
        return {"direction": 0}`,
  setCustomStrategyCode: (code) => set({ customStrategyCode: code }),
}))
