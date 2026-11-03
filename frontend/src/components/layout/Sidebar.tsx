import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Box,
  Network,
  MapPin,
  Cpu,
  GitFork,
  Gauge,
  Flame,
  Sliders,
  ShieldCheck,
  TrendingDown,
  CloudRain,
  PlusCircle,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}

interface NavItem {
  name: string
  path: string
  icon: any
  badge?: string
  color?: string
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'OVERVIEW',
    items: [
      { name: 'Command Center', path: '/', icon: LayoutDashboard },
      { name: 'Live 3D City', path: '/map', icon: Box, badge: 'WebGL', color: 'cyan' },
    ],
  },
  {
    label: 'INTELLIGENCE',
    items: [
      { name: 'Incident Graph', path: '/features/relationship-graph', icon: Network, badge: 'F1' },
      { name: 'Geospatial Hotspots', path: '/features/geospatial', icon: MapPin, badge: 'F2' },
      { name: 'Predictive ML', path: '/features/predictive-ml', icon: Cpu, badge: 'F3' },
      { name: 'Cascade Impact', path: '/features/cascading-impact', icon: GitFork, badge: 'F4' },
      { name: 'Impact & Severity', path: '/features/impact-severity', icon: Gauge, badge: 'F5' },
      { name: 'Smart Priority', path: '/features/smart-priority', icon: Flame, badge: 'F6' },
      { name: 'What-If Simulation', path: '/features/what-if', icon: Sliders, badge: 'F7' },
      { name: 'Recommendations', path: '/features/recommendations', icon: ShieldCheck, badge: 'F8' },
      { name: 'Prevention Impact', path: '/features/prevention-impact', icon: TrendingDown, badge: 'F9' },
      { name: 'Weather Risk', path: '/features/weather-risk', icon: CloudRain, badge: 'F10' },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { name: 'Incident Intake', path: '/operations/incidents', icon: PlusCircle, badge: 'NEW' },
      { name: 'Work Orders', path: '/operations/work-orders', icon: ClipboardList },
    ],
  },
]

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={`relative z-20 flex flex-col border-r border-border-standard bg-bg-midnight/95 backdrop-blur-xl transition-all duration-300 ease-in-out select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-border-subtle h-16">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="relative flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-tr from-accent-blue via-accent-cyan to-accent-turquoise flex items-center justify-center shadow-glow-cyan">
            <span className="font-mono text-sm font-black text-bg-midnight tracking-tighter">CO</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-wider text-text-primary text-gradient-cyan">
                CivicOS
              </span>
              <span className="text-[10px] tracking-widest text-text-muted uppercase font-mono">
                Urban Pulse v2.0
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            {!collapsed && (
              <p className="px-3 pb-1 text-[10px] font-bold tracking-widest text-text-dim uppercase font-mono">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  title={collapsed ? item.name : undefined}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-accent-blue/20 to-accent-cyan/10 text-accent-cyan border border-accent-cyan/30 shadow-glow-cyan font-semibold'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated/70'
                    } ${collapsed ? 'justify-center' : ''}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={18}
                        className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                          isActive ? 'text-accent-cyan' : 'text-text-muted group-hover:text-text-primary'
                        }`}
                      />
                      {!collapsed && (
                        <span className="flex-1 truncate tracking-tight">{item.name}</span>
                      )}
                      {!collapsed && item.badge && (
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-bold font-mono rounded-md ${
                            item.color === 'cyan'
                              ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30'
                              : 'bg-surface-elevated text-text-muted border border-border-subtle'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {/* Active indicator bar */}
                      {isActive && (
                        <span className="absolute left-0 top-2 bottom-2 w-1 bg-accent-cyan rounded-r-full shadow-glow-cyan" />
                      )}
                    </>
                  )}
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Bottom Status Indicator */}
      <div className="p-3 border-t border-border-subtle bg-bg-midnight/50">
        <div
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface-base/80 border border-border-subtle ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-severity-low animate-pulse" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-text-primary font-mono leading-tight">
                AI Engine Online
              </span>
              <span className="text-[9px] text-text-muted">10 Features Active</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
