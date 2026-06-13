import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import DashboardPage from '@/pages/Dashboard'
import StrategyBuilderPage from '@/pages/StrategyBuilder'
import BacktestPage from '@/pages/Backtest'
import PaperTradingPage from '@/pages/PaperTrading'
import MarketDataPage from '@/pages/MarketData'
import AnalyticsPage from '@/pages/Analytics'

export default function App() {
  const { activeTab, setActiveTab } = useAppStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleNavigate = (path: string) => {
    navigate(path)
    setActiveTab(path === '/' ? 'dashboard' : path.slice(1))
  }

  // Set active tab from URL on mount
  const tabMap: Record<string, string> = { '/': 'dashboard', '/strategy': 'strategy', '/backtest': 'backtest', '/paper': 'paper', '/market': 'market', '/analytics': 'analytics' }
  if (tabMap[location.pathname] && tabMap[location.pathname] !== activeTab) {
    setActiveTab(tabMap[location.pathname])
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 min-w-[14rem] bg-card border-r border-border flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">
              ◈
            </div>
            <div>
              <h1 className="font-bold text-sm">Quant Black Box</h1>
              <p className="text-[10px] text-muted-foreground">Strategy Platform v0.1</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-3 space-y-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '⬡' },
            { id: 'strategy', label: 'Strategy Builder', icon: '⟁' },
            { id: 'backtest', label: 'Backtest', icon: '◷' },
            { id: 'paper', label: 'Paper Trading', icon: '◈' },
            { id: 'market', label: 'Market Data', icon: '◉' },
            { id: 'analytics', label: 'Analytics', icon: '◧' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(`/${item.id === 'dashboard' ? '' : item.id}`)}
              className={`sidebar-item w-full text-left justify-start ${activeTab === item.id ? 'sidebar-item-active' : ''}`}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer status */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="status-dot status-active" />
            <span>System Online</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/strategy" element={<StrategyBuilderPage />} />
          <Route path="/backtest" element={<BacktestPage />} />
          <Route path="/paper" element={<PaperTradingPage />} />
          <Route path="/market" element={<MarketDataPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Routes>
      </main>
    </div>
  )
}
