import { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const NAV_ITEMS = [
  { label: 'Command Center', path: '/', icon: '⌂', section: 'overview' },
  { label: 'Live Map', path: '/map', icon: '◎', section: 'overview' },
  // Intelligence Features
  { label: 'Incident Graph', path: '/features/graph', icon: '◈', feature: 1, section: 'intelligence' },
  { label: 'Geospatial Intel', path: '/features/geospatial', icon: '⊕', feature: 2, section: 'intelligence' },
  { label: 'Predictive ML', path: '/features/predictive', icon: '⬡', feature: 3, section: 'intelligence' },
  { label: 'Cascade Impact', path: '/features/cascade', icon: '⟁', feature: 4, section: 'intelligence' },
  { label: 'Impact & Severity', path: '/features/impact', icon: '◉', feature: 5, section: 'intelligence' },
  { label: 'Smart Priority', path: '/features/priority', icon: '▲', feature: 6, section: 'intelligence' },
  { label: 'What-If Sim', path: '/features/whatif', icon: '⟳', feature: 7, section: 'intelligence' },
  { label: 'Recommendations', path: '/features/recommendations', icon: '⬙', feature: 8, section: 'intelligence' },
  { label: 'Prevention Impact', path: '/features/prevention', icon: '◈', feature: 9, section: 'intelligence' },
  { label: 'Weather Risk', path: '/features/weather', icon: '⊛', feature: 10, section: 'intelligence' },
  // Operations
  { label: 'Incident Intake', path: '/operations/intake', icon: '✎', section: 'operations' },
  { label: 'Work Orders', path: '/operations/work-orders', icon: '≡', section: 'operations' },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [hoveredSection, setHoveredSection] = useState<string | null>(null)

  const sections = [
    { key: 'overview', label: 'Overview' },
    { key: 'intelligence', label: 'Intelligence Features' },
    { key: 'operations', label: 'Operations' },
  ]

  const getRoleBadgeColor = (role: string) => {
    const map: Record<string, string> = {
      administrator: 'text-accent-cyan bg-accent-cyan/10 border-accent-cyan/30',
      municipal_officer: 'text-accent-blue bg-accent-blue/10 border-accent-blue/30',
      department_operator: 'text-status-medium bg-status-medium/10 border-status-medium/30',
      viewer: 'text-text-muted bg-surface-elevated border-border-standard',
    }
    return map[role] ?? map.viewer
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-border-subtle ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center flex-shrink-0 glow-cyan">
          <span className="text-accent-cyan text-sm font-bold">C</span>
        </div>
        {!collapsed && (
          <div>
            <div className="text-text-primary font-bold text-sm tracking-wider">CIVIC<span className="text-accent-cyan">OS</span></div>
            <div className="text-text-muted text-xs">Urban Intelligence</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {sections.map(section => {
          const items = NAV_ITEMS.filter(i => i.section === section.key)
          return (
            <div key={section.key} className="mb-4">
              {!collapsed && (
                <div className="px-2 py-1 mb-1">
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-widest">
                    {section.label}
                  </span>
                </div>
              )}
              {items.map(item => {
                const isActive = location.pathname === item.path
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onMobileClose}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group relative
                      ${isActive
                        ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-interactive border border-transparent'
                      }
                      ${collapsed ? 'justify-center' : ''}
                    `}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className={`text-base flex-shrink-0 ${isActive ? 'text-accent-cyan' : 'text-text-muted group-hover:text-text-secondary'}`}>
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span className="flex-1 truncate">{item.label}</span>
                    )}
                    {!collapsed && item.feature && (
                      <span className="text-xs text-text-muted font-mono">F{item.feature}</span>
                    )}
                    {/* Active indicator */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-accent-cyan rounded-r" />
                    )}
                  </NavLink>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* User section */}
      <div className={`border-t border-border-subtle p-3 ${collapsed ? 'flex justify-center' : ''}`}>
        {!collapsed && user ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan text-xs font-bold flex-shrink-0">
                {user.username[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-text-primary truncate">{user.username}</div>
                <div className={`text-xs px-1.5 py-0.5 rounded border inline-block mt-0.5 capitalize ${getRoleBadgeColor(user.role)}`}>
                  {user.role.replace('_', ' ')}
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full text-xs text-text-muted hover:text-status-critical transition-colors py-1 px-2 rounded hover:bg-status-critical/5 text-left"
            >
              → Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={() => !collapsed && logout()}
            className="w-7 h-7 rounded-full bg-surface-elevated border border-border-standard flex items-center justify-center text-text-muted hover:text-status-critical transition-colors"
            title="Sign out"
          >
            ⏻
          </button>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col flex-shrink-0 bg-bg-secondary border-r border-border-subtle sidebar-transition h-screen sticky top-0 ${collapsed ? 'w-16' : 'w-60'}`}>
        {sidebarContent}
        {/* Toggle button */}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-surface-card border border-border-standard flex items-center justify-center text-text-muted hover:text-text-primary transition-colors z-10"
        >
          {collapsed ? '›' : '‹'}
        </button>
      </aside>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onMobileClose} />
          <aside className="relative w-64 bg-bg-secondary border-r border-border-subtle h-full flex flex-col">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
