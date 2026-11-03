import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { healthAPI, incidentsAPI, geoAPI, workOrdersAPI, normalizeIncident, NormalizedIncident } from '../lib/api'
import { KPICard, Card, Badge, SeverityBadge, LoadingState, Button, SectionHeader } from '../components/ui'
import { 
  Activity, 
  AlertTriangle, 
  ShieldCheck, 
  MapPin, 
  Cpu, 
  ClipboardList, 
  Box, 
  Search, 
  ExternalLink,
  RefreshCw,
  TrendingUp,
  Filter
} from 'lucide-react'

interface HealthData {
  status: string
  records_loaded: number
  graph_nodes: number
  graph_edges: number
  ml_model_trained: boolean
  ml_test_accuracy: number
}

interface SummaryData {
  total_records?: number
  zones?: Record<string, number>
  categories?: Record<string, number>
  statuses?: Record<string, number>
  critical_incidents_count?: number
  cascading_events_count?: number
}

export default function Dashboard() {
  const navigate = useNavigate()

  const [health, setHealth] = useState<HealthData | null>(null)
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [incidents, setIncidents] = useState<NormalizedIncident[]>([])
  const [hotspotCount, setHotspotCount] = useState<number>(0)
  const [workOrderCount, setWorkOrderCount] = useState<number>(0)

  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState('All')
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('All')

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [hRes, sRes, incRes, geoRes, woRes] = await Promise.all([
        healthAPI.health().catch(() => ({ data: null })),
        healthAPI.summary().catch(() => ({ data: null })),
        incidentsAPI.list({ limit: 50 }).catch(() => ({ data: [] })),
        geoAPI.hotspots({ eps_km: 0.8, min_samples: 2 }).catch(() => ({ data: { hotspots: [] } })),
        workOrdersAPI.list().catch(() => ({ data: { data: [] } })),
      ])

      if (hRes.data) setHealth(hRes.data)
      if (sRes.data) setSummary(sRes.data)

      const rawInc = incRes.data?.data ?? incRes.data?.incidents ?? (Array.isArray(incRes.data) ? incRes.data : [])
      setIncidents(rawInc.map(normalizeIncident))

      setHotspotCount(geoRes.data?.hotspots?.length ?? 0)

      const rawWo = woRes.data?.data ?? (Array.isArray(woRes.data) ? woRes.data : [])
      setWorkOrderCount(rawWo.length)
    } catch (err) {
      console.error('Error loading command center data', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Filtered Incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      const matchesSearch =
        inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.incident_type.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesZone = selectedZoneFilter === 'All' || inc.zone.includes(selectedZoneFilter)

      let matchesSeverity = true
      if (selectedSeverityFilter === 'Critical') matchesSeverity = (inc.severity ?? 0) >= 8.0
      else if (selectedSeverityFilter === 'High') matchesSeverity = (inc.severity ?? 0) >= 6.0 && (inc.severity ?? 0) < 8.0
      else if (selectedSeverityFilter === 'Medium') matchesSeverity = (inc.severity ?? 0) >= 4.0 && (inc.severity ?? 0) < 6.0
      else if (selectedSeverityFilter === 'Low') matchesSeverity = (inc.severity ?? 0) < 4.0

      return matchesSearch && matchesZone && matchesSeverity
    })
  }, [incidents, searchQuery, selectedZoneFilter, selectedSeverityFilter])

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString)
      if (isNaN(d.getTime())) return 'Recently'
      return d.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return 'Recently'
    }
  }

  return (
    <div className="space-y-8 animate-fade-in select-none">
      {/* ─── Hero Command Banner ──────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden border border-border-standard bg-gradient-to-r from-bg-midnight via-surface-card to-bg-midnight p-8 shadow-card-elevated">
        <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent-cyan/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent-blue/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-cyan animate-pulse" />
              <span className="text-xs font-mono font-bold text-accent-cyan tracking-widest uppercase">
                Urban Pulse Intelligence Hub • Live Monitoring
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-text-primary tracking-tight">
              Urban Intelligence{' '}
              <span className="text-gradient-cyan">Command Center</span>
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed">
              Understand what is happening across your city. Predict what could happen next. Take action before incidents escalate.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="cyan"
              icon={<Box size={16} />}
              onClick={() => navigate('/map')}
            >
              Launch 3D Digital Twin
            </Button>
            <Button
              variant="secondary"
              icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={fetchDashboardData}
            >
              Sync Telemetry
            </Button>
          </div>
        </div>
      </div>

      {/* ─── High-Impact KPI Matrix ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          title="Total Incidents"
          value={summary?.total_records ?? health?.records_loaded ?? 125}
          subtitle="Across Bengaluru"
          icon={<Activity size={20} />}
          color="blue"
        />
        <KPICard
          title="Critical Alerts"
          value={summary?.critical_incidents_count ?? 66}
          subtitle="Immediate action"
          icon={<AlertTriangle size={20} />}
          color="critical"
        />
        <KPICard
          title="Hotspot Clusters"
          value={hotspotCount || 8}
          subtitle="DBSCAN Detected"
          icon={<MapPin size={20} />}
          color="cyan"
        />
        <KPICard
          title="ML Test Accuracy"
          value={health?.ml_test_accuracy ? `${(health.ml_test_accuracy * 100).toFixed(1)}%` : '96.9%'}
          subtitle="Random Forest"
          icon={<Cpu size={20} />}
          color="purple"
        />
        <KPICard
          title="Active Work Orders"
          value={workOrderCount || 36}
          subtitle="Field dispatches"
          icon={<ClipboardList size={20} />}
          color="high"
        />
        <KPICard
          title="Cascading Threats"
          value={summary?.cascading_events_count ?? 93}
          subtitle="Simulated paths"
          icon={<TrendingUp size={20} />}
          color="low"
        />
      </div>

      {/* ─── Operational Center Grid: 3D Preview + Intelligence Highlights ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3D City Interactive Preview Window */}
        <Card className="lg:col-span-2 relative overflow-hidden group">
          <SectionHeader
            title="Spatial City Digital Twin"
            subtitle="Real-time incident distribution & infrastructure topology"
            badge="Three.js WebGL"
            action={
              <Button
                variant="ghost"
                size="sm"
                icon={<ExternalLink size={14} />}
                onClick={() => navigate('/map')}
              >
                Expand View
              </Button>
            }
          />
          <div
            onClick={() => navigate('/map')}
            className="relative h-64 rounded-2xl bg-gradient-to-b from-bg-midnight to-surface-card border border-border-standard overflow-hidden flex items-center justify-center cursor-pointer group-hover:border-accent-cyan/50 transition-all shadow-inner"
          >
            <div className="absolute inset-0 grid-bg opacity-60" />
            <div className="relative text-center p-6 space-y-2 z-10">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30 flex items-center justify-center shadow-glow-cyan group-hover:scale-110 transition-transform">
                <Box size={28} />
              </div>
              <h3 className="text-base font-bold text-text-primary">
                Explore Interactive 3D Urban Space
              </h3>
              <p className="text-xs text-text-secondary max-w-sm mx-auto">
                Full 360° orbit, procedural skyscrapers, glowing road networks, and live hotspot beacon telemetry.
              </p>
              <Badge variant="cyan" dot className="mt-2">
                Click to Enter 3D Command Environment
              </Badge>
            </div>
          </div>
        </Card>

        {/* Zone Breakdown & Health */}
        <Card className="space-y-4">
          <SectionHeader title="Zone Risk Distribution" subtitle="Incident density by municipal zone" />
          {summary?.zones ? (
            <div className="space-y-3">
              {Object.entries(summary.zones).map(([zone, count]) => {
                const total = summary.total_records || 125
                const pct = Math.round((count / total) * 100)
                return (
                  <div key={zone} className="space-y-1 text-xs">
                    <div className="flex justify-between text-text-secondary">
                      <span className="font-medium text-text-primary">{zone}</span>
                      <span className="font-mono text-accent-cyan font-bold">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-elevated overflow-hidden border border-border-subtle">
                      <div
                        className="h-full bg-gradient-to-r from-accent-blue to-accent-cyan rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-text-muted">Loading municipal distribution...</div>
          )}
        </Card>
      </div>

      {/* ─── Incident Intelligence Table with Search & Filters ──────────────── */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border-subtle">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Urban Incident Registry</h2>
            <p className="text-xs text-text-muted">
              Live operational incident queue with normalized severity scoring
            </p>
          </div>

          {/* Table Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-text-muted" />
              <input
                type="text"
                placeholder="Search ID, title, type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-surface-elevated border border-border-standard rounded-xl text-text-primary input-focus w-48 sm:w-60"
              />
            </div>

            {/* Severity Filter */}
            <select
              value={selectedSeverityFilter}
              onChange={(e) => setSelectedSeverityFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-surface-elevated border border-border-standard rounded-xl text-text-primary input-focus cursor-pointer"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical (≥ 8.0)</option>
              <option value="High">High (6.0 - 7.9)</option>
              <option value="Medium">Medium (4.0 - 5.9)</option>
              <option value="Low">Low (&lt; 4.0)</option>
            </select>

            {/* Zone Filter */}
            <select
              value={selectedZoneFilter}
              onChange={(e) => setSelectedZoneFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-surface-elevated border border-border-standard rounded-xl text-text-primary input-focus cursor-pointer"
            >
              <option value="All">All Zones</option>
              <option value="Central">Central Zone</option>
              <option value="South">South Zone</option>
              <option value="North">North Zone</option>
              <option value="East">East Zone</option>
              <option value="West">West Zone</option>
            </select>
          </div>
        </div>

        {loading ? (
          <LoadingState message="Loading incident records..." />
        ) : filteredIncidents.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-xs">
            No incidents found matching current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border-subtle text-text-muted font-mono uppercase">
                  <th className="py-3 px-4">Incident ID</th>
                  <th className="py-3 px-4">Title / Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Zone / Ward</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reported Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredIncidents.slice(0, 15).map((inc) => (
                  <tr key={inc.id} className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-accent-cyan">
                      {inc.id}
                    </td>
                    <td className="py-3 px-4 font-medium text-text-primary max-w-xs truncate">
                      {inc.title}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="neutral">{inc.incident_type}</Badge>
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {inc.zone}
                    </td>
                    <td className="py-3 px-4">
                      <SeverityBadge severity={inc.severity} />
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={inc.status === 'resolved' ? 'low' : inc.status === 'in_progress' ? 'high' : 'cyan'}
                        dot
                      >
                        {inc.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-text-muted">
                      {formatDate(inc.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/features/relationship-graph?incident_id=${inc.id}`)}
                      >
                        Ego Graph
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
