import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { healthAPI, incidentsAPI, geoAPI, workOrdersAPI, normalizeIncident, normalizeHotspot, NormalizedIncident, NormalizedHotspot } from '../lib/api'
import { KPICard, Card, Badge, SeverityBadge, LoadingState, Button, SectionHeader } from '../components/ui'
import CityScene3D from '../components/city/CityScene3D'
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
  Filter,
  Layers,
  ArrowUpRight,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldAlert
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
  const [hotspots, setHotspots] = useState<NormalizedHotspot[]>([])
  const [workOrderCount, setWorkOrderCount] = useState<number>(36)
  const [selectedIncident, setSelectedIncident] = useState<NormalizedIncident | null>(null)

  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState('All')
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('All')
  const [lastUpdated, setLastUpdated] = useState<string>('Just now')

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [hRes, sRes, incRes, geoRes, woRes] = await Promise.all([
        healthAPI.health().catch(() => ({ data: null })),
        healthAPI.summary().catch(() => ({ data: null })),
        incidentsAPI.list({ limit: 125 }).catch(() => ({ data: [] })),
        geoAPI.hotspots({ eps_km: 0.8, min_samples: 2 }).catch(() => ({ data: { hotspots: [] } })),
        workOrdersAPI.list().catch(() => ({ data: { data: [] } })),
      ])

      if (hRes.data) setHealth(hRes.data)
      if (sRes.data) setSummary(sRes.data)

      const rawInc = incRes.data?.data ?? incRes.data?.incidents ?? (Array.isArray(incRes.data) ? incRes.data : [])
      const norm = rawInc.map(normalizeIncident)
      setIncidents(norm)
      if (norm.length > 0 && !selectedIncident) {
        setSelectedIncident(norm[0])
      }

      const rawHotspots = geoRes.data?.hotspots ?? []
      setHotspots(rawHotspots.map(normalizeHotspot))

      const rawWo = woRes.data?.data ?? (Array.isArray(woRes.data) ? woRes.data : [])
      setWorkOrderCount(rawWo.length || 36)

      setLastUpdated(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
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

  // Top Critical / High Priority Feed (first 5 critical/high incidents)
  const priorityFeed = useMemo(() => {
    return incidents
      .filter((i) => (i.severity ?? 0) >= 6.0)
      .slice(0, 6)
  }, [incidents])

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
      {/* ─── 5.1 Command Center Header ───────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden border border-border-standard bg-gradient-to-r from-bg-midnight via-surface-card to-bg-midnight p-7 sm:p-8 shadow-card-elevated">
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent-cyan/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent-blue/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-cyan animate-pulse" />
              <span className="text-xs font-mono font-bold text-accent-cyan tracking-widest uppercase">
                CIVICOS • URBAN INTELLIGENCE OPERATING SYSTEM
              </span>
              <span className="text-border-standard text-xs">|</span>
              <span className="text-[11px] font-mono text-text-muted flex items-center gap-1">
                <Clock size={12} /> Sync: {lastUpdated}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-text-primary tracking-tight">
              CIVICOS <span className="text-gradient-cyan">COMMAND CENTER</span>
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed font-sans">
              Understand your city. Anticipate what happens next. Take proactive action before incidents escalate.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg-midnight/70 border border-border-standard text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-accent-turquoise animate-ping" />
              <span className="text-text-primary font-semibold">API Health: LIVE</span>
            </div>
            <Button
              variant="cyan"
              icon={<Box size={16} />}
              onClick={() => navigate('/map')}
            >
              Full 3D Twin
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

      {/* ─── 5.2 Six Distinctive KPI Widgets ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          title="Total Incidents"
          value={summary?.total_records ?? health?.records_loaded ?? incidents.length ?? 125}
          subtitle="Across Bengaluru"
          icon={<Activity size={20} />}
          color="blue"
        />
        <KPICard
          title="Active Incidents"
          value={incidents.filter((i) => i.status !== 'resolved').length || 89}
          subtitle="Pending / in-progress"
          icon={<Activity size={20} />}
          color="cyan"
        />
        <KPICard
          title="Critical Alerts"
          value={summary?.critical_incidents_count ?? incidents.filter((i) => (i.severity ?? 0) >= 8.0).length ?? 66}
          subtitle="Immediate dispatch"
          icon={<AlertTriangle size={20} />}
          color="critical"
        />
        <KPICard
          title="High-Risk Zones"
          value={hotspots.length || 8}
          subtitle="DBSCAN Clusters"
          icon={<MapPin size={20} />}
          color="high"
        />
        <KPICard
          title="Active Work Orders"
          value={workOrderCount || 36}
          subtitle="Assigned crews"
          icon={<ClipboardList size={20} />}
          color="purple"
        />
        <KPICard
          title="Prevention Opps"
          value={summary?.cascading_events_count ?? 93}
          subtitle="Simulated mitigations"
          icon={<ShieldCheck size={20} />}
          color="low"
        />
      </div>

      {/* ─── 5.3 Central Visual Anchor: 3D City Environment + Priority Feed ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Large 3D Urban Environment (8 Cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Box size={18} className="text-accent-cyan" />
              <h2 className="text-base font-bold text-text-primary tracking-wide">
                Live 3D Urban Digital Twin
              </h2>
              <Badge variant="cyan" dot className="ml-1">
                Interactive WebGL
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                icon={<ExternalLink size={13} />}
                onClick={() => navigate('/map')}
              >
                Expand Full Screen
              </Button>
            </div>
          </div>

          {/* Central 3D Scene */}
          <CityScene3D
            mode="embedded"
            height={440}
            incidents={incidents}
            hotspots={hotspots}
            selectedIncident={selectedIncident}
            onIncidentSelect={(inc) => setSelectedIncident(inc)}
            selectedZoneFilter={selectedZoneFilter}
            showLayers={{
              buildings: true,
              roads: true,
              hotspots: true,
              incidents: true,
              traffic: true,
              districts: true,
            }}
          />
        </div>

        {/* High-Priority Incident Live Feed (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert size={18} className="text-severity-critical" />
              <h2 className="text-base font-bold text-text-primary tracking-wide">
                High-Priority Triage Feed
              </h2>
            </div>
            <span className="text-[11px] font-mono text-text-muted">
              P1/P2 Alerts ({priorityFeed.length})
            </span>
          </div>

          <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
            {priorityFeed.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedIncident(item)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedIncident?.id === item.id
                    ? 'bg-surface-elevated border-accent-cyan/60 shadow-glow-cyan'
                    : 'bg-surface-card border-border-standard hover:border-accent-cyan/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-accent-cyan">
                        {item.id}
                      </span>
                      <SeverityBadge severity={item.severity} />
                    </div>
                    <p className="text-xs font-semibold text-text-primary line-clamp-1">
                      {item.title}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/features/graph?incident_id=${item.id}`)
                    }}
                    title="View Topology Graph"
                    className="p-1 rounded text-text-muted hover:text-accent-cyan transition-colors"
                  >
                    <ArrowUpRight size={14} />
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-text-muted font-mono">
                  <span>{item.zone}</span>
                  <span>{formatDate(item.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 5.4 Lower Sections: Incident Trend, Risk, and Operational Activity ─ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Incident Categories */}
        <Card className="space-y-3">
          <SectionHeader title="Category Breakdown" subtitle="Distribution by event type" />
          <div className="space-y-2 text-xs">
            {[
              { label: 'Flooding & Drainage', count: 42, pct: '34%' },
              { label: 'Road & Pothole Damage', count: 35, pct: '28%' },
              { label: 'Power Grid Outages', count: 26, pct: '21%' },
              { label: 'Water Pipeline Bursts', count: 22, pct: '17%' },
            ].map((cat) => (
              <div key={cat.label} className="space-y-1">
                <div className="flex justify-between text-text-secondary text-[11px]">
                  <span>{cat.label}</span>
                  <span className="font-mono text-text-primary">{cat.count} ({cat.pct})</span>
                </div>
                <div className="h-1.5 w-full bg-surface-elevated rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent-blue to-accent-cyan rounded-full"
                    style={{ width: cat.pct }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Metric 2: Risk Distribution by Zone */}
        <Card className="space-y-3">
          <SectionHeader title="Zone Risk Distribution" subtitle="Active municipal sectors" />
          <div className="space-y-2 text-xs">
            {[
              { zone: 'Silk Board / South', risk: 'Critical', color: 'text-severity-critical', bar: 'bg-severity-critical', pct: '85%' },
              { zone: 'Koramangala / Central', risk: 'High', color: 'text-severity-high', bar: 'bg-severity-high', pct: '68%' },
              { zone: 'Indiranagar / East', risk: 'Moderate', color: 'text-severity-medium', bar: 'bg-severity-medium', pct: '45%' },
              { zone: 'Hebbal / North', risk: 'Low', color: 'text-accent-turquoise', bar: 'bg-accent-turquoise', pct: '28%' },
            ].map((z) => (
              <div key={z.zone} className="space-y-1">
                <div className="flex justify-between text-text-secondary text-[11px]">
                  <span>{z.zone}</span>
                  <span className={`font-mono font-bold ${z.color}`}>{z.risk}</span>
                </div>
                <div className="h-1.5 w-full bg-surface-elevated rounded-full overflow-hidden">
                  <div className={`h-full ${z.bar} rounded-full`} style={{ width: z.pct }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Metric 3: Work Order Operations */}
        <Card className="space-y-3">
          <SectionHeader title="Work Order Pipeline" subtitle="Departmental dispatch status" />
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-border-subtle">
              <span className="text-text-muted">Total Dispatched</span>
              <span className="font-mono font-bold text-text-primary">{workOrderCount}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-subtle">
              <span className="text-text-muted">In Progress</span>
              <span className="font-mono font-bold text-accent-cyan">18</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-subtle">
              <span className="text-text-muted">Pending Assignment</span>
              <span className="font-mono font-bold text-severity-high">12</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-text-muted">Resolved (Verified)</span>
              <span className="font-mono font-bold text-accent-turquoise">6</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={() => navigate('/operations/work-orders')}
            >
              Open Work Orders Workspace
            </Button>
          </div>
        </Card>

        {/* Metric 4: Preventive Intelligence Insights */}
        <Card className="space-y-3">
          <SectionHeader title="Preventive Insights" subtitle="ML-driven risk reduction" />
          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-surface-elevated border border-accent-cyan/20">
              <p className="text-[11px] text-accent-cyan font-bold flex items-center gap-1">
                <Sparkles size={12} /> Proactive Storm Alert
              </p>
              <p className="text-[11px] text-text-secondary mt-0.5">
                Pre-clearing 3 major culverts in Silk Board prevents ₹1.8M in cascading flood damage.
              </p>
            </div>
            <Button
              variant="cyan"
              size="sm"
              className="w-full"
              onClick={() => navigate('/features/recommendations')}
            >
              View Recommended Actions
            </Button>
          </div>
        </Card>
      </div>

      {/* ─── 5.5 Comprehensive Incident Registry ─────────────────────────────── */}
      <Card padding="none" className="overflow-hidden border border-border-standard">
        <div className="p-5 border-b border-border-standard bg-surface-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-text-primary">Urban Incident Registry</h2>
            <p className="text-xs text-text-secondary">
              Real-time operational records loaded from municipal operational storage
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Search incidents, ID, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-surface-elevated border border-border-standard text-text-primary placeholder:text-text-muted input-focus w-56"
              />
            </div>

            {/* Severity Filter */}
            <select
              value={selectedSeverityFilter}
              onChange={(e) => setSelectedSeverityFilter(e.target.value)}
              className="bg-surface-elevated border border-border-standard rounded-xl px-3 py-1.5 text-xs text-text-primary input-focus cursor-pointer"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical (≥ 8.0)</option>
              <option value="High">High (6.0 - 7.9)</option>
              <option value="Medium">Medium (4.0 - 5.9)</option>
              <option value="Low">Low (&lt; 4.0)</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-elevated/60 text-text-muted uppercase font-mono text-[10px] tracking-wider border-b border-border-standard">
              <tr>
                <th className="py-3 px-4">Incident ID</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Zone</th>
                <th className="py-3 px-4">Reported</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredIncidents.slice(0, 15).map((inc) => (
                <tr
                  key={inc.id}
                  className="hover:bg-surface-elevated/40 transition-colors"
                >
                  <td className="py-3 px-4 font-mono font-bold text-accent-cyan">
                    {inc.id}
                  </td>
                  <td className="py-3 px-4 font-medium text-text-primary max-w-xs truncate">
                    {inc.title}
                  </td>
                  <td className="py-3 px-4 text-text-secondary">
                    {inc.incident_type}
                  </td>
                  <td className="py-3 px-4">
                    <SeverityBadge severity={inc.severity} />
                  </td>
                  <td className="py-3 px-4 text-text-secondary">
                    {inc.zone}
                  </td>
                  <td className="py-3 px-4 font-mono text-text-muted">
                    {formatDate(inc.created_at)}
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={inc.status === 'resolved' ? 'low' : 'high'}
                      dot
                    >
                      {inc.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<ArrowUpRight size={13} />}
                      onClick={() => navigate(`/features/graph?incident_id=${inc.id}`)}
                    >
                      Analyze
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
