import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface CommandItem {
  id: string
  title: string
  category: 'Feature' | 'Navigation' | 'Operations'
  path: string
  shortcut?: string
}

const COMMANDS: CommandItem[] = [
  { id: 'dash', title: 'Command Center Overview', category: 'Navigation', path: '/' },
  { id: 'map', title: 'Live 3D City Map', category: 'Navigation', path: '/map' },
  { id: 'f1', title: 'F1: Incident Relationship Graph', category: 'Feature', path: '/features/graph' },
  { id: 'f2', title: 'F2: Geospatial Intelligence & Hotspots', category: 'Feature', path: '/features/geospatial' },
  { id: 'f3', title: 'F3: Predictive ML Risk Classification', category: 'Feature', path: '/features/predictive' },
  { id: 'f4', title: 'F4: Cascading Infrastructure Failure Simulation', category: 'Feature', path: '/features/cascade' },
  { id: 'f5', title: 'F5: Impact & Composite Severity Scoring', category: 'Feature', path: '/features/impact' },
  { id: 'f6', title: 'F6: Smart Priority Scoring Engine', category: 'Feature', path: '/features/priority' },
  { id: 'f7', title: 'F7: What-If Scenario Simulation', category: 'Feature', path: '/features/whatif' },
  { id: 'f8', title: 'F8: Preventive Action Recommendations', category: 'Feature', path: '/features/recommendations' },
  { id: 'f9', title: 'F9: Prevention Impact & ROI Score', category: 'Feature', path: '/features/prevention' },
  { id: 'f10', title: 'F10: Weather-Based Risk Analysis', category: 'Feature', path: '/features/weather' },
  { id: 'intake', title: 'Operational Incident Intake', category: 'Operations', path: '/operations/intake' },
  { id: 'wo', title: 'Operational Work Orders', category: 'Operations', path: '/operations/work-orders' },
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
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

  const filtered = COMMANDS.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) || cmd.category.toLowerCase().includes(query.toLowerCase())
  )

  const handleSelect = (cmd: CommandItem) => {
    navigate(cmd.path)
    setOpen(false)
    setQuery('')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-card border border-accent-cyan/40 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-border-standard flex items-center gap-3">
          <span className="text-accent-cyan text-lg">🔍</span>
          <input
            autoFocus
            type="text"
            placeholder="Type a command or jump to feature (e.g. Graph, ML, Work Orders)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            className="w-full bg-transparent text-text-primary text-sm placeholder-text-muted outline-none"
          />
          <span className="text-xs font-mono text-text-muted bg-surface-elevated px-2 py-0.5 rounded border border-border-subtle">
            ESC
          </span>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-text-muted text-sm">No command matching "{query}"</div>
          ) : (
            filtered.map((cmd, idx) => (
              <div
                key={cmd.id}
                onClick={() => handleSelect(cmd)}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer text-sm transition-colors ${
                  idx === selectedIndex ? 'bg-surface-interactive text-accent-cyan' : 'text-text-secondary hover:bg-surface-interactive/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-bg-main border border-border-subtle text-text-muted">
                    {cmd.category}
                  </span>
                  <span className="font-medium text-text-primary">{cmd.title}</span>
                </div>
                <span className="text-xs text-text-muted font-mono">{cmd.path}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
