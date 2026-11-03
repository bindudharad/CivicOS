import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Command, ArrowRight, X } from 'lucide-react'

interface CommandItem {
  id: string
  title: string
  category: 'Overview' | 'Intelligence Feature' | 'Operations'
  path: string
  badge?: string
}

const COMMANDS: CommandItem[] = [
  { id: 'dash', title: 'Urban Command Center Overview', category: 'Overview', path: '/' },
  { id: 'map', title: 'Live 3D City Digital Twin (WebGL)', category: 'Overview', path: '/map', badge: '3D' },
  { id: 'f1', title: 'F1: Incident Relationship Graph & Topology', category: 'Intelligence Feature', path: '/features/relationship-graph', badge: 'F1' },
  { id: 'f2', title: 'F2: Geospatial DBSCAN Hotspot Detection', category: 'Intelligence Feature', path: '/features/geospatial', badge: 'F2' },
  { id: 'f3', title: 'F3: Predictive ML Risk Classification', category: 'Intelligence Feature', path: '/features/predictive-ml', badge: 'F3' },
  { id: 'f4', title: 'F4: Cascading Infrastructure Failure Simulation', category: 'Intelligence Feature', path: '/features/cascading-impact', badge: 'F4' },
  { id: 'f5', title: 'F5: Multi-Criteria Impact & Severity Scoring', category: 'Intelligence Feature', path: '/features/impact-severity', badge: 'F5' },
  { id: 'f6', title: 'F6: Smart Priority Scoring & Triage Engine', category: 'Intelligence Feature', path: '/features/smart-priority', badge: 'F6' },
  { id: 'f7', title: 'F7: What-If Counterfactual Stress Simulation', category: 'Intelligence Feature', path: '/features/what-if', badge: 'F7' },
  { id: 'f8', title: 'F8: Preventive Action Recommendations & Playbooks', category: 'Intelligence Feature', path: '/features/recommendations', badge: 'F8' },
  { id: 'f9', title: 'F9: Prevention Impact Score & ROI Valuation', category: 'Intelligence Feature', path: '/features/prevention-impact', badge: 'F9' },
  { id: 'f10', title: 'F10: Weather-Based Risk & Climate Amplification', category: 'Intelligence Feature', path: '/features/weather-risk', badge: 'F10' },
  { id: 'intake', title: 'Operational Incident Intake Pipeline', category: 'Operations', path: '/operations/incidents', badge: 'NEW' },
  { id: 'wo', title: 'Field Work Orders & Lifecycle Resolution', category: 'Operations', path: '/operations/work-orders', badge: 'OPS' },
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const filtered = COMMANDS.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(query.toLowerCase()) ||
      cmd.category.toLowerCase().includes(query.toLowerCase()) ||
      (cmd.badge && cmd.badge.toLowerCase().includes(query.toLowerCase()))
  )

  const handleSelect = (cmd: CommandItem) => {
    navigate(cmd.path)
    setOpen(false)
    setQuery('')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-bg-midnight/80 backdrop-blur-md animate-fade-in">
      <div className="bg-bg-card border border-accent-cyan/40 rounded-3xl w-full max-w-xl shadow-card-elevated overflow-hidden">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-border-standard flex items-center gap-3 bg-surface-base/80">
          <Search size={18} className="text-accent-cyan" />
          <input
            autoFocus
            type="text"
            placeholder="Search commands, intelligence features, operations (e.g. Graph, ML, Orders)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary p-1">
            <X size={16} />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-text-muted">
              No matching command or feature found.
            </div>
          ) : (
            filtered.map((cmd) => (
              <button
                key={cmd.id}
                onClick={() => handleSelect(cmd)}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-surface-elevated text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  {cmd.badge && (
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30">
                      {cmd.badge}
                    </span>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-text-primary group-hover:text-accent-cyan transition-colors">
                      {cmd.title}
                    </p>
                    <p className="text-[10px] text-text-muted">{cmd.category}</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-text-muted group-hover:text-accent-cyan transition-transform group-hover:translate-x-1" />
              </button>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-surface-base/90 border-t border-border-subtle flex items-center justify-between text-[11px] font-mono text-text-muted">
          <span>Navigation Quick-Jump</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  )
}
