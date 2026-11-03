import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, LogOut, Shield, ChevronDown, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useSystemHealth } from '../../contexts/HealthContext'

interface NavbarProps {
  onOpenCommandPalette?: () => void
  onMobileMenuOpen?: () => void
  sidebarCollapsed?: boolean
}

const ROUTE_TITLES: Record<string, { title: string; category: string }> = {
  '/': { title: 'Command Center', category: 'Overview' },
  '/map': { title: 'Live 3D City Digital Twin', category: 'Urban Pulse' },
  '/features/relationship-graph': { title: 'Incident Relationship Graph', category: 'Feature 1' },
  '/features/geospatial': { title: 'Geospatial Hotspots', category: 'Feature 2' },
  '/features/predictive-ml': { title: 'Predictive ML Intelligence', category: 'Feature 3' },
  '/features/cascading-impact': { title: 'Cascading Impact Prediction', category: 'Feature 4' },
  '/features/impact-severity': { title: 'Impact & Severity Scoring', category: 'Feature 5' },
  '/features/smart-priority': { title: 'Smart Priority Engine', category: 'Feature 6' },
  '/features/what-if': { title: 'What-If Simulation', category: 'Feature 7' },
  '/features/recommendations': { title: 'Preventive Recommendations', category: 'Feature 8' },
  '/features/prevention-impact': { title: 'Prevention Impact Score', category: 'Feature 9' },
  '/features/weather-risk': { title: 'Weather-Based Risk Analysis', category: 'Feature 10' },
  '/operations/incidents': { title: 'Incident Intake Pipeline', category: 'Operations' },
  '/operations/work-orders': { title: 'Work Order Management', category: 'Operations' },
}

const ZONES = ['All Bengaluru Zones', 'Central Zone', 'East Zone', 'West Zone', 'North Zone', 'South Zone']

export default function Navbar({ onOpenCommandPalette }: NavbarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { systemStatus, probeHealth } = useSystemHealth()
  const [selectedZone, setSelectedZone] = useState('All Bengaluru Zones')
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const currentRoute = ROUTE_TITLES[location.pathname] ?? {
    title: 'CivicOS Command Center',
    category: 'Intelligence',
  }

  // Probe health on navigation if outside dashboard
  useEffect(() => {
    if (location.pathname !== '/') {
      probeHealth()
    }
  }, [location.pathname, probeHealth])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 sm:px-6 border-b border-border-standard bg-bg-midnight/80 backdrop-blur-xl select-none">
      {/* Breadcrumb & Title */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-text-muted uppercase tracking-wider">
              {currentRoute.category}
            </span>
            <span className="text-text-muted text-xs">/</span>
            <h1 className="text-sm font-bold text-text-primary tracking-tight">
              {currentRoute.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* City Zone Selector */}
        <div className="relative hidden md:block">
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="appearance-none bg-surface-elevated border border-border-standard rounded-xl pl-3 pr-8 py-1.5 text-xs text-text-primary font-medium input-focus cursor-pointer"
          >
            {ZONES.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-2.5 text-text-muted pointer-events-none" />
        </div>

        {/* Global Command Palette Button */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-elevated border border-border-standard hover:border-accent-cyan/40 text-text-muted hover:text-text-primary text-xs transition-colors"
        >
          <Search size={14} />
          <span className="hidden sm:inline">Search (Ctrl+K)</span>
          <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-bg-midnight border border-border-subtle rounded text-text-muted">
            ⌘K
          </kbd>
        </button>

        {/* Unified Backend Status Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-surface-elevated border border-border-subtle text-xs font-mono">
          <span className={`w-2 h-2 rounded-full ${
            systemStatus === 'connected' ? 'bg-severity-low animate-pulse' :
            systemStatus === 'degraded' ? 'bg-severity-high animate-pulse' :
            systemStatus === 'disconnected' ? 'bg-severity-critical' : 'bg-accent-blue animate-pulse'
          }`} />
          <span className={
            systemStatus === 'connected' ? 'text-text-secondary' :
            systemStatus === 'degraded' ? 'text-severity-high font-medium' :
            systemStatus === 'disconnected' ? 'text-severity-critical font-medium' : 'text-accent-blue'
          }>
            {systemStatus === 'connected' ? 'API: Connected' :
             systemStatus === 'degraded' ? 'API: Degraded' :
             systemStatus === 'disconnected' ? 'API: Disconnected' : 'API: Checking...'}
          </span>
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((p) => !p)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-elevated transition-colors border border-transparent hover:border-border-subtle"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-accent-blue to-accent-violet flex items-center justify-center text-white text-xs font-bold shadow-glow-blue">
              {user?.username?.slice(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-semibold text-text-primary leading-tight">
                {user?.username || 'Administrator'}
              </span>
              <span className="text-[10px] text-accent-cyan uppercase tracking-wider font-mono">
                {user?.role || 'Admin'}
              </span>
            </div>
          </button>

          {/* User Dropdown */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-bg-card border border-border-standard p-2 shadow-card-elevated z-50">
              <div className="px-3 py-2 border-b border-border-subtle mb-1">
                <p className="text-xs font-semibold text-text-primary truncate">{user?.username}</p>
                <p className="text-[10px] text-text-muted capitalize">Role: {user?.role}</p>
              </div>
              <div className="px-3 py-1.5 text-[11px] text-text-muted flex items-center gap-1.5">
                <Shield size={12} className="text-accent-cyan" />
                RBAC Security Active
              </div>
              <div className="px-3 py-1.5 text-[11px] text-text-muted flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-severity-low" />
                Session Encrypted
              </div>
              <button
                onClick={handleLogout}
                className="w-full mt-2 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-severity-critical hover:bg-severity-critical/10 transition-colors"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
