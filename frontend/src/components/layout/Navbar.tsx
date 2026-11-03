import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Command Center', subtitle: 'Live urban intelligence overview' },
  '/map': { title: 'Live City Map', subtitle: 'Real-time geospatial incident view' },
  '/features/graph': { title: 'Incident Relationship Graph', subtitle: 'Feature 1 — Urban incident network analysis' },
  '/features/geospatial': { title: 'Geospatial Intelligence', subtitle: 'Feature 2 — Hotspot detection and clustering' },
  '/features/predictive': { title: 'Predictive ML Intelligence', subtitle: 'Feature 3 — Machine learning risk prediction' },
  '/features/cascade': { title: 'Cascading Impact', subtitle: 'Feature 4 — Infrastructure failure propagation' },
  '/features/impact': { title: 'Impact & Severity', subtitle: 'Feature 5 — Composite scoring engine' },
  '/features/priority': { title: 'Smart Priority Engine', subtitle: 'Feature 6 — AI-driven task prioritisation' },
  '/features/whatif': { title: 'What-If Simulation', subtitle: 'Feature 7 — Scenario planning and analysis' },
  '/features/recommendations': { title: 'Preventive Recommendations', subtitle: 'Feature 8 — AI action playbooks' },
  '/features/prevention': { title: 'Prevention Impact Score', subtitle: 'Feature 9 — Preventive programme ROI' },
  '/features/weather': { title: 'Weather Risk Analysis', subtitle: 'Feature 10 — Climate-correlated risk assessment' },
  '/operations/intake': { title: 'Incident Intake', subtitle: 'Submit and validate new urban incidents' },
  '/operations/work-orders': { title: 'Work Orders', subtitle: 'Track and manage field operations' },
}

interface NavbarProps {
  onMobileMenuOpen: () => void
  sidebarCollapsed: boolean
}

export default function Navbar({ onMobileMenuOpen, sidebarCollapsed }: NavbarProps) {
  const location = useLocation()
  const { user } = useAuth()
  const [systemTime] = useState(() => new Date().toLocaleTimeString('en-IN', { hour12: false }))
  const page = PAGE_TITLES[location.pathname] ?? { title: 'CivicOS', subtitle: '' }

  return (
    <header className="sticky top-0 z-30 bg-bg-secondary/80 backdrop-blur-md border-b border-border-subtle">
      <div className="flex items-center gap-4 px-4 lg:px-6 h-14">
        {/* Mobile hamburger */}
        <button
          onClick={onMobileMenuOpen}
          className="lg:hidden p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-interactive transition-colors"
        >
          ☰
        </button>

        {/* Page title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-text-primary truncate">{page.title}</h1>
          </div>
          <p className="text-xs text-text-muted hidden sm:block">{page.subtitle}</p>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* System status */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-card border border-border-subtle">
            <span className="status-dot active w-1.5 h-1.5 rounded-full bg-accent-cyan" />
            <span className="text-xs text-text-muted font-mono">{systemTime}</span>
          </div>

          {/* Backend status */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-status-low/10 border border-status-low/20">
            <span className="w-1.5 h-1.5 rounded-full bg-status-low animate-pulse" />
            <span className="text-xs text-status-low font-medium">API Online</span>
          </div>

          {/* User avatar */}
          {user && (
            <div className="w-7 h-7 rounded-full bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan text-xs font-bold">
              {user.username[0].toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
