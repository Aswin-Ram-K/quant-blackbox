import { Routes, Route } from 'react-router-dom'
import { useAppStore, NAV_ITEMS } from '@/store/appStore'
import HomeDashboard from '@/pages/HomeDashboard'
import StrategiesBuilder from '@/pages/StrategiesBuilder'
import Logbook from '@/pages/Logbook'
import MarketData from '@/pages/MarketData'

export default function App() {
  const { activePage, setActivePage } = useAppStore()

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 min-w-[14rem] bg-card border-r border-border flex flex-col transition-all duration-200">
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold">
              ◈
            </div>
            <div>
              <h1 className="font-bold text-sm">Quant Black Box</h1>
              <p className="text-[10px] text-muted-foreground">Strategy Platform v0.1</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-2 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`sidebar-item w-full text-left justify-start ${
                activePage === item.id ? 'sidebar-item-active' : ''
              }`}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer status */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="status-dot status-active pulse-slow" />
            <span>System Online</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<HomeDashboard />} />
          <Route path="/strategies" element={<StrategiesBuilder />} />
          <Route path="/logbook" element={<Logbook />} />
          <Route path="/markets" element={<MarketData />} />
          <Route path="*" element={<HomeDashboard />} />
        </Routes>
      </main>
    </div>
  )
}
