import { create } from 'zustand'
import type {
  StrategyInfo,
  ChatMessage,
  LogEntry,
  Trade,
  NavItem,
} from '@/types'
import { mockTrades, mockChartData, mockEquityCurve } from '@/lib/utils'

// ── Nav config ──────────────────────────────────────────────────────────
export const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Dashboard', icon: '◈', shortLabel: 'Home', color: 'text-primary' },
  { id: 'strategies', label: 'Strategy Builder', icon: '⟁', shortLabel: 'Builder', color: 'text-success' },
  { id: 'logbook', label: 'Logbook', icon: '◧', shortLabel: 'Logbook', color: 'text-warning' },
  { id: 'markets', label: 'Market Data', icon: '◉', shortLabel: 'Markets', color: 'text-accent' },
]

// ── State ───────────────────────────────────────────────────────────────
interface AppState {
  // Navigation
  activePage: string
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  setActivePage: (page: string) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (c: boolean) => void

  // Strategies
  strategies: StrategyInfo[]
  setStrategies: (s: StrategyInfo[]) => void

  // AI Chat (Strategy Builder)
  chatMessages: ChatMessage[]
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  clearChat: () => void
  chatContext: {
    selectedStrategy: string
    selectedAsset: string
    chartData: any[]
    metrics: Record<string, any>
  }
  setChatContext: (ctx: Partial<AppState['chatContext']>) => void

  // Trade Log
  trades: Trade[]
  logEntries: LogEntry[]
  setTrades: (t: Trade[]) => void
  addLogEntry: (entry: LogEntry) => void
  selectedLogStrategy: string

  // Market Data
  selectedMarketAsset: string
  setSelectedMarketAsset: (a: string) => void
  marketData: any[]

  // UI helpers
  showMobileMenu: boolean
  setShowMobileMenu: (s: boolean) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  activePage: 'home',
  setActivePage: (page) => set({ activePage: page }),

  sidebarOpen: true,
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (c) => set({ sidebarCollapsed: c }),

  strategies: [],
  setStrategies: (s) => set({ strategies: s }),

  chatMessages: [
    {
      id: 'ai-welcome',
      role: 'ai',
      content: "Hey — I'm your trading co-pilot. I can see exactly what's on this screen. Tell me what you want to build:\n\n• **Build a strategy** from scratch\n• **Analyze current performance** and suggest tweaks  \n• **Create a new strategy profile** for a specific market\n• **Review your trade log** and find patterns\n• **Optimize parameters** for existing strategies\n\nI have full context of your strategies, chart data, and trade history. Go ahead.",
      timestamp: Date.now(),
    },
  ],
  addChatMessage: (msg) =>
    set((s) => ({
      chatMessages: [
        ...s.chatMessages,
        { ...msg, id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: Date.now() },
      ],
    })),
  clearChat: () => set({ chatMessages: [] }),
  chatContext: { selectedStrategy: '', selectedAsset: '', chartData: [], metrics: {} },
  setChatContext: (ctx) => set((s) => ({ chatContext: { ...s.chatContext, ...ctx } })),

  trades: mockTrades(25),
  logEntries: [
    {
      id: 'log-1',
      strategy: 'Momentum',
      period_start: '2025-11-01',
      period_end: '2026-01-15',
      trades: mockTrades(8).filter((_, i) => i < 8),
      total_pnl: 1247.32,
      win_rate: 0.625,
      description: 'Momentum breakout strategy applied to equity indices and large-cap tech stocks.',
      triggers: ['Volume breakout > 1.2x average', 'Price above 20-day high', 'SMA 50 > SMA 200'],
      analysis: 'Strong performance in bull regime. Failed during January chop. Overall profitable.',
      grade: 'B',
    },
    {
      id: 'log-2',
      strategy: 'Mean Reversion',
      period_start: '2026-02-01',
      period_end: '2026-04-15',
      trades: mockTrades(12).filter((_, i) => i < 12),
      total_pnl: 534.18,
      win_rate: 0.58,
      description: 'RSI + Bollinger Band mean reversion applied to crypto assets.',
      triggers: ['RSI < 30 + price at lower BB', 'RSI > 70 + price at upper BB'],
      analysis: 'Good in volatile crypto markets. Loses in strong trending periods. Consider regime filter.',
      grade: 'B-',
    },
    {
      id: 'log-3',
      strategy: 'Carry',
      period_start: '2026-05-01',
      period_end: '2026-06-12',
      trades: mockTrades(3).filter((_, i) => i < 3),
      total_pnl: -123.45,
      win_rate: 0.33,
      description: 'SMA 50/200 golden cross carry strategy on commodities.',
      triggers: ['Golden cross with momentum', 'Death cross'],
      analysis: 'Late entry on golden cross. Strategy works but timing was off. Need faster signal detection.',
      grade: 'C+',
    },
  ],
  setTrades: (t) => set({ trades: t }),
  addLogEntry: (entry) => set((s) => ({ logEntries: [...s.logEntries, entry] })),
  selectedLogStrategy: 'all',

  selectedMarketAsset: 'AAPL',
  setSelectedMarketAsset: (a) => set({ selectedMarketAsset: a }),
  marketData: [],

  showMobileMenu: false,
  setShowMobileMenu: (s) => set({ showMobileMenu: s }),
}))
