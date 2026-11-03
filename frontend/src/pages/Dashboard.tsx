import { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  healthAPI, 
  incidentsAPI, 
  geoAPI, 
  workOrdersAPI, 
  normalizeIncident, 
  normalizeHotspot,
  normalizeWorkOrder,
  NormalizedIncident, 
  NormalizedHotspot,
  NormalizedWorkOrder 
} from '../lib/api'
import { KPICard, Card, Badge, SeverityBadge, LoadingState, Button, SectionHeader } from '../components/ui'
import { useSystemHealth } from '../contexts/HealthContext'
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
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle
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

type ServiceStatus = 'idle' | 'loading' | 'success' | 'error' | 'unauthorized'

interface ServiceStates {
  health: ServiceStatus
  summary: ServiceStatus
  incidents: ServiceStatus
  hotspots: ServiceStatus
  workOrders: ServiceStatus
}

export type OverallSystemStatus = 'connected' | 'degraded' | 'disconnected' | 'checking'

export default function Dashboard() {
  const navigate = useNavigate()
  const { setTelemetryReport } = useSystemHealth()

  // Telemetry & Data States
  const [health, setHealth] = useState<HealthData | null>(null)
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [incidents, setIncidents] = useState<NormalizedIncident[]>([])
  const [hotspots, setHotspots] = useState<NormalizedHotspot[]>([])
  const [workOrders, setWorkOrders] = useState<NormalizedWorkOrder[]>([])
  const [selectedIncident, setSelectedIncident] = useState<NormalizedIncident | null>(null)

  // Per-Endpoint Status Tracking (No silent failures)
  const [services, setServices] = useState<ServiceStates>({
    health: 'idle',
    summary: 'idle',
    incidents: 'idle',
    hotspots: 'idle',
    workOrders: 'idle',
  })

  // Synchronization Timestamps
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
  const [lastAttemptTime, setLastAttemptTime] = useState<string>('Not yet checked')

  // UI Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState('All')
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('All')

  // Calculate Overall System Health Status
  const systemStatus: OverallSystemStatus = useMemo(() => {
    if (services.health === 'loading') return 'checking'
    if (services.health === 'error') return 'disconnected'

    const hasSubserviceFailure = [services.summary, services.incidents, services.hotspots, services.workOrders].some(
      (s) => s === 'error' || s === 'unauthorized'
    )

    if (hasSubserviceFailure) return 'degraded'
    if (services.health === 'success') {
      const allChecked = [services.summary, services.incidents, services.hotspots, services.workOrders].every(
        (s) => s === 'success'
      )
      if (allChecked) return 'connected'
      return 'checking'
    }
    return 'checking'
  }, [services])

  // Is any service currently loading
  const isRefreshing = useMemo(() => {
    return Object.values(services).some((s) => s === 'loading')
  }, [services])

  // Failed service names for degraded warning
  const failedServices = useMemo(() => {
    const list: string[] = []
    if (services.health === 'error') list.push('Health API (Offline)')
    if (services.summary === 'error') list.push('Summary API')
    if (services.hotspots === 'error') list.push('DBSCAN Hotspots')
    if (services.incidents === 'error') list.push('Incidents Registry (Error)')
    if (services.incidents === 'unauthorized') list.push('Incidents Registry (Session Expired / Auth Required)')
    if (services.workOrders === 'error') list.push('Work Orders Pipeline (Error)')
    if (services.workOrders === 'unauthorized') list.push('Work Orders Pipeline (Session Expired / Auth Required)')
    return list
  }, [services])

  // Fetch all endpoints with individual lifecycle tracking
  const fetchDashboardData = useCallback(async () => {
    const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLastAttemptTime(nowStr)

    const loadingStates: ServiceStates = {
      health: 'loading',
      summary: 'loading',
      incidents: 'loading',
      hotspots: 'loading',
      workOrders: 'loading',
    }
    setServices(loadingStates)
    setTelemetryReport(loadingStates, lastSyncTime, nowStr)

    let anySuccess = false
    const finalStates: ServiceStates = {
      health: 'idle',
      summary: 'idle',
      incidents: 'idle',
      hotspots: 'idle',
      workOrders: 'idle',
    }

    const probeConfig = { headers: { 'X-Health-Probe': '1' } }

    // 1. Health API
    const pHealth = healthAPI.health(probeConfig)
      .then((res) => {
        setHealth(res.data)
        setServices((prev) => ({ ...prev, health: 'success' })); finalStates.health = 'success'
        anySuccess = true
      })
      .catch((err) => {
        console.warn('[Telemetry] /health error:', err.message)
        setHealth(null)
        setServices((prev) => ({ ...prev, health: 'error' })); finalStates.health = 'error'
      })

    // 2. Incidents Summary API
    const pSummary = healthAPI.summary(probeConfig)
      .then((res) => {
        setSummary(res.data)
        setServices((prev) => ({ ...prev, summary: 'success' })); finalStates.summary = 'success'
        anySuccess = true
      })
      .catch((err) => {
        console.warn('[Telemetry] /api/incidents/summary error:', err.message)
        setSummary(null)
        setServices((prev) => ({ ...prev, summary: 'error' })); finalStates.summary = 'error'
      })

    // 3. Incidents List API
    const pIncidents = incidentsAPI.list({ limit: 150 }, probeConfig)
      .then((res) => {
        const raw = res.data?.data ?? res.data?.incidents ?? (Array.isArray(res.data) ? res.data : [])
        const norm = raw.map(normalizeIncident)
        setIncidents(norm)
        if (norm.length > 0 && !selectedIncident) {
          setSelectedIncident(norm[0])
        }
        setServices((prev) => ({ ...prev, incidents: 'success' })); finalStates.incidents = 'success'
        anySuccess = true
      })
      .catch((err) => {
        console.warn('[Telemetry] /api/incidents error:', err.message)
        const isAuth = err.response?.status === 401 || err.response?.status === 403
        setIncidents([])
        setServices((prev) => ({ ...prev, incidents: isAuth ? 'unauthorized' : 'error' }))
        finalStates.incidents = isAuth ? 'unauthorized' : 'error'
      })

    // 4. Geospatial Hotspots API
    const pHotspots = geoAPI.hotspots({ eps_km: 0.8, min_samples: 2 })
      .then((res) => {
        const raw = res.data?.hotspots ?? []
        setHotspots(raw.map(normalizeHotspot))
        setServices((prev) => ({ ...prev, hotspots: 'success' })); finalStates.hotspots = 'success'
        anySuccess = true
      })
      .catch((err) => {
        console.warn('[Telemetry] /api/geospatial/hotspots error:', err.message)
        setHotspots([])
        setServices((prev) => ({ ...prev, hotspots: 'error' })); finalStates.hotspots = 'error'
      })

    // 5. Work Orders API
    const pWorkOrders = workOrdersAPI.list(probeConfig)
      .then((res) => {
        const raw = res.data?.data ?? (Array.isArray(res.data) ? res.data : [])
        setWorkOrders(raw.map(normalizeWorkOrder))
        setServices((prev) => ({ ...prev, workOrders: 'success' })); finalStates.workOrders = 'success'
        anySuccess = true
      })
      .catch((err) => {
        console.warn('[Telemetry] /api/work-orders error:', err.message)
        const isAuth = err.response?.status === 401 || err.response?.status === 403
        setWorkOrders([])
        setServices((prev) => ({ ...prev, workOrders: isAuth ? 'unauthorized' : 'error' }))
        finalStates.workOrders = isAuth ? 'unauthorized' : 'error'
      })

    await Promise.allSettled([pHealth, pSummary, pIncidents, pHotspots, pWorkOrders])

    if (anySuccess) {
      setLastSyncTime(nowStr)
    }
    setTelemetryReport(finalStates, anySuccess ? nowStr : lastSyncTime, nowStr)
  }, [selectedIncident])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Filtered Incidents based on search, zone, severity
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

  // Top Critical / High Priority Feed from live incidents
  const priorityFeed = useMemo(() => {
    return incidents
      .filter((i) => (i.severity ?? 0) >= 6.0)
      .slice(0, 6)
  }, [incidents])

  // ─── STRICT VERIFIED KPI VALUE COMPUTATIONS ────────────────────────────────
  // Rule: Show 0 only when confirmed zero. Show "—" or "N/A" when unavailable. Never fallback to hardcoded numbers!

  // 1. Total Incidents
  const kpiTotalIncidents: string | number = useMemo(() => {
    if (services.summary === 'success' && summary?.total_records !== undefined) {
      return summary.total_records
    }
    if (services.health === 'success' && health?.records_loaded !== undefined) {
      return health.records_loaded
    }
    if (services.incidents === 'success') {
      return incidents.length
    }
    if (services.summary === 'loading' || services.health === 'loading' || services.incidents === 'loading') {
      return '—'
    }
    return 'N/A'
  }, [services, summary, health, incidents])

  // 2. Active Incidents
  const kpiActiveIncidents: string | number = useMemo(() => {
    if (services.incidents === 'success') {
      return incidents.filter((i) => i.status !== 'resolved' && i.status !== 'mitigated').length
    }
    if (services.summary === 'success' && summary?.statuses) {
      const nonResolved = Object.entries(summary.statuses)
        .filter(([status]) => status.toLowerCase() !== 'resolved' && status.toLowerCase() !== 'mitigated')
        .reduce((sum, [, count]) => sum + count, 0)
      return nonResolved
    }
    if (services.incidents === 'loading' || services.summary === 'loading') {
      return '—'
    }
    return 'N/A'
  }, [services, incidents, summary])

  // 3. Critical Alerts
  const kpiCriticalAlerts: string | number = useMemo(() => {
    if (services.summary === 'success' && summary?.critical_incidents_count !== undefined) {
      return summary.critical_incidents_count
    }
    if (services.incidents === 'success') {
      return incidents.filter((i) => (i.severity ?? 0) >= 8.0).length
    }
    if (services.summary === 'loading' || services.incidents === 'loading') {
      return '—'
    }
    return 'N/A'
  }, [services, summary, incidents])

  // 4. High-Risk Zones (Hotspots)
  const kpiHighRiskZones: string | number = useMemo(() => {
    if (services.hotspots === 'success') {
      return hotspots.length
    }
    if (services.hotspots === 'loading') {
      return '—'
    }
    return 'N/A'
  }, [services.hotspots, hotspots])

  // 5. Active Work Orders
  const kpiActiveWorkOrders: string | number = useMemo(() => {
    if (services.workOrders === 'success') {
      return workOrders.filter((w) => w.status !== 'resolved').length
    }
    if (services.workOrders === 'loading') {
      return '—'
    }
    return 'N/A'
  }, [services.workOrders, workOrders])

  // 6. Cascading Risk Events (Incidents with cascading_risk_flag == 1)
  const kpiCascadingEvents: string | number = useMemo(() => {
    if (services.summary === 'success' && summary?.cascading_events_count !== undefined) {
      return summary.cascading_events_count
    }
    if (services.summary === 'loading') {
      return '—'
    }
    return 'N/A'
  }, [services.summary, summary])

  // ─── DYNAMIC CATEGORY BREAKDOWN ───────────────────────────────────────────
  const dynamicCategories = useMemo(() => {
    if (services.summary === 'success' && summary?.categories) {
      const entries = Object.entries(summary.categories)
      const total = entries.reduce((sum, [, count]) => sum + count, 0)
      if (total === 0) return []
      return entries.map(([label, count]) => ({
        label,
        count,
        pct: `${Math.round((count / total) * 100)}%`,
      }))
    }
    if (services.incidents === 'success' && incidents.length > 0) {
      const counts: Record<string, number> = {}
      incidents.forEach((inc) => {
        const cat = inc.category || inc.incident_type || 'General'
        counts[cat] = (counts[cat] || 0) + 1
      })
      const total = incidents.length
      return Object.entries(counts).map(([label, count]) => ({
        label,
        count,
        pct: `${Math.round((count / total) * 100)}%`,
      }))
    }
    return []
  }, [services, summary, incidents])

  // ─── DYNAMIC ZONE RISK DISTRIBUTION ───────────────────────────────────────
  const dynamicZones = useMemo(() => {
    if (services.summary === 'success' && summary?.zones) {
      const entries = Object.entries(summary.zones)
      const maxCount = Math.max(...entries.map(([, c]) => c), 1)
      return entries.map(([zone, count]) => {
        const pct = `${Math.round((count / maxCount) * 100)}%`
        let risk = 'Low'
        let color = 'text-accent-turquoise'
        let bar = 'bg-accent-turquoise'
        if (count >= 25) {
          risk = 'Critical'
          color = 'text-severity-critical'
          bar = 'bg-severity-critical'
        } else if (count >= 20) {
          risk = 'High'
          color = 'text-severity-high'
          bar = 'bg-severity-high'
        } else if (count >= 10) {
          risk = 'Moderate'
          color = 'text-severity-medium'
          bar = 'bg-severity-medium'
        }
        return { zone, count, risk, color, bar, pct }
      })
    }
    if (services.incidents === 'success' && incidents.length > 0) {
      const counts: Record<string, number> = {}
      incidents.forEach((inc) => {
        counts[inc.zone] = (counts[inc.zone] || 0) + 1
      })
      const entries = Object.entries(counts)
      const maxCount = Math.max(...entries.map(([, c]) => c), 1)
      return entries.map(([zone, count]) => {
        const pct = `${Math.round((count / maxCount) * 100)}%`
        return {
          zone,
          count,
          risk: count > 20 ? 'Critical' : count > 10 ? 'High' : 'Moderate',
          color: count > 20 ? 'text-severity-critical' : 'text-severity-high',
          bar: count > 20 ? 'bg-severity-critical' : 'bg-severity-high',
          pct,
        }
      })
    }
    return []
  }, [services, summary, incidents])

  // ─── DYNAMIC WORK ORDER PIPELINE METRICS ──────────────────────────────────
  const dynamicWorkOrderStats = useMemo(() => {
    if (services.workOrders !== 'success') {
      return { total: '—', inProgress: '—', open: '—', resolved: '—' }
    }
    const total = workOrders.length
    const inProgress = workOrders.filter((w) => w.status === 'in_progress' || w.status === 'assigned').length
    const open = workOrders.filter((w) => w.status === 'open').length
    const resolved = workOrders.filter((w) => w.status === 'resolved').length
    return { total, inProgress, open, resolved }
  }, [services.workOrders, workOrders])

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—'
    try {
      const d = new Date(isoString)
      if (isNaN(d.getTime())) return '—'
      return d.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return '—'
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
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${
                systemStatus === 'connected' ? 'bg-accent-turquoise animate-pulse' :
                systemStatus === 'degraded' ? 'bg-severity-high animate-pulse' :
                systemStatus === 'disconnected' ? 'bg-severity-critical' : 'bg-accent-blue animate-pulse'
              }`} />
              <span className="text-xs font-mono font-bold text-accent-cyan tracking-widest uppercase">
                CIVICOS • URBAN INTELLIGENCE OPERATING SYSTEM
              </span>
              <span className="text-border-standard text-xs">|</span>
              <span className="text-[11px] font-mono text-text-muted flex items-center gap-1">
                <Clock size={12} /> Sync: {lastSyncTime ? `${lastSyncTime}` : 'Pending'} (Checked: {lastAttemptTime})
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
            {/* Dynamic API Health Status Badge */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-colors ${
              systemStatus === 'connected'
                ? 'bg-bg-midnight/70 border-accent-turquoise/40 text-accent-turquoise'
                : systemStatus === 'degraded'
                ? 'bg-severity-high/15 border-severity-high/40 text-severity-high'
                : systemStatus === 'disconnected'
                ? 'bg-severity-critical/15 border-severity-critical/40 text-severity-critical'
                : 'bg-bg-midnight/70 border-border-standard text-text-muted'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                systemStatus === 'connected' ? 'bg-accent-turquoise animate-ping' :
                systemStatus === 'degraded' ? 'bg-severity-high animate-ping' :
                systemStatus === 'disconnected' ? 'bg-severity-critical' : 'bg-accent-blue animate-pulse'
              }`} />
              <span className="font-semibold uppercase tracking-wider">
                API: {systemStatus === 'connected' ? 'Connected' : systemStatus === 'degraded' ? 'Degraded' : systemStatus === 'disconnected' ? 'Disconnected' : 'Checking'}
              </span>
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
              icon={<RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />}
              onClick={fetchDashboardData}
              disabled={isRefreshing}
            >
              Sync Telemetry
            </Button>
          </div>
        </div>

        {/* Partial Outage Alert Banner (Only shown if Degraded or Disconnected) */}
        {systemStatus === 'degraded' && (
          <div className="mt-4 p-3 rounded-xl bg-severity-high/15 border border-severity-high/30 flex items-center gap-2 text-xs text-severity-high">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>
              <strong>Partial Telemetry Outage:</strong> Unable to reach {failedServices.join(', ')}. Displaying confirmed data from active endpoints.
            </span>
          </div>
        )}
        {systemStatus === 'disconnected' && (
          <div className="mt-4 p-3 rounded-xl bg-severity-critical/15 border border-severity-critical/30 flex items-center gap-2 text-xs text-severity-critical">
            <XCircle size={15} className="flex-shrink-0" />
            <span>
              <strong>Backend Disconnected:</strong> Cannot reach municipal server at {healthAPI ? 'http://127.0.0.1:8000' : 'API host'}. Telemetry values unavailable.
            </span>
          </div>
        )}
      </div>

      {/* ─── 5.2 Six Verified KPI Widgets (No Fabricated Fallbacks) ─────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          title="Total Incidents"
          value={kpiTotalIncidents}
          subtitle={services.summary === 'success' || services.health === 'success' ? 'Across Bengaluru' : 'Awaiting sync'}
          icon={<Activity size={20} />}
          color="blue"
        />
        <KPICard
          title="Active Incidents"
          value={kpiActiveIncidents}
          subtitle={services.incidents === 'success' ? 'Pending / in-progress' : 'Awaiting sync'}
          icon={<Activity size={20} />}
          color="cyan"
        />
        <KPICard
          title="Critical Alerts"
          value={kpiCriticalAlerts}
          subtitle={services.summary === 'success' || services.incidents === 'success' ? 'Severity ≥ 8.0' : 'Awaiting sync'}
          icon={<AlertTriangle size={20} />}
          color="critical"
        />
        <KPICard
          title="High-Risk Zones"
          value={kpiHighRiskZones}
          subtitle={services.hotspots === 'success' ? 'DBSCAN Clusters' : 'Awaiting sync'}
          icon={<MapPin size={20} />}
          color="high"
        />
        <KPICard
          title="Active Work Orders"
          value={kpiActiveWorkOrders}
          subtitle={services.workOrders === 'success' ? 'Assigned crews' : 'Awaiting sync'}
          icon={<ClipboardList size={20} />}
          color="purple"
        />
        <KPICard
          title="Cascading Events"
          value={kpiCascadingEvents}
          subtitle={services.summary === 'success' ? 'Cross-infrastructure' : 'Awaiting sync'}
          icon={<TrendingUp size={20} />}
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
                Procedural Digital Twin (Illustrative Urban Topology)
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
              {services.incidents === 'success' ? `P1/P2 Alerts (${priorityFeed.length})` : 'Awaiting data'}
            </span>
          </div>

          <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
            {services.incidents === 'loading' && (
              <div className="p-8 text-center text-text-muted text-xs">
                <LoadingState message="Loading live operational alerts..." />
              </div>
            )}
            {services.incidents === 'error' && (
              <div className="p-6 rounded-xl bg-surface-card border border-severity-critical/30 text-center space-y-2">
                <p className="text-xs text-severity-critical font-medium">Unable to load incident feed</p>
                <Button variant="ghost" size="sm" onClick={fetchDashboardData}>Retry</Button>
              </div>
            )}
            {services.incidents === 'success' && priorityFeed.length === 0 && (
              <div className="p-8 rounded-xl bg-surface-card border border-border-standard text-center text-xs text-text-muted">
                No high-priority critical incidents currently active.
              </div>
            )}
            {services.incidents === 'success' && priorityFeed.map((item) => (
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
        {/* Metric 1: Incident Categories (Dynamic from Backend) */}
        <Card className="space-y-3">
          <SectionHeader title="Category Breakdown" subtitle="Distribution by event type (Real Data)" />
          <div className="space-y-2 text-xs">
            {dynamicCategories.length === 0 ? (
              <p className="text-text-muted text-xs py-4 text-center">
                {services.summary === 'loading' || services.incidents === 'loading' ? 'Loading categories...' : 'No incident category data available.'}
              </p>
            ) : (
              dynamicCategories.slice(0, 5).map((cat) => (
                <div key={cat.label} className="space-y-1">
                  <div className="flex justify-between text-text-secondary text-[11px]">
                    <span className="truncate max-w-[130px]">{cat.label}</span>
                    <span className="font-mono text-text-primary">{cat.count} ({cat.pct})</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-elevated rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent-blue to-accent-cyan rounded-full transition-all duration-500"
                      style={{ width: cat.pct }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Metric 2: Risk Distribution by Zone (Dynamic from Backend) */}
        <Card className="space-y-3">
          <SectionHeader title="Zone Risk Distribution" subtitle="Active municipal sectors (Real Data)" />
          <div className="space-y-2 text-xs">
            {dynamicZones.length === 0 ? (
              <p className="text-text-muted text-xs py-4 text-center">
                {services.summary === 'loading' || services.incidents === 'loading' ? 'Loading zone telemetry...' : 'No zone telemetry available.'}
              </p>
            ) : (
              dynamicZones.slice(0, 5).map((z) => (
                <div key={z.zone} className="space-y-1">
                  <div className="flex justify-between text-text-secondary text-[11px]">
                    <span className="truncate max-w-[130px]">{z.zone}</span>
                    <span className={`font-mono font-bold ${z.color}`}>{z.risk} ({z.count})</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-elevated rounded-full overflow-hidden">
                    <div className={`h-full ${z.bar} rounded-full transition-all duration-500`} style={{ width: z.pct }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Metric 3: Work Order Operations (Dynamic from Backend) */}
        <Card className="space-y-3">
          <SectionHeader title="Work Order Pipeline" subtitle="Departmental dispatch status (Real Data)" />
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-border-subtle">
              <span className="text-text-muted">Total Dispatched</span>
              <span className="font-mono font-bold text-text-primary">{dynamicWorkOrderStats.total}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-subtle">
              <span className="text-text-muted">In Progress / Assigned</span>
              <span className="font-mono font-bold text-accent-cyan">{dynamicWorkOrderStats.inProgress}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-subtle">
              <span className="text-text-muted">Pending Assignment</span>
              <span className="font-mono font-bold text-severity-high">{dynamicWorkOrderStats.open}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-text-muted">Resolved (Verified)</span>
              <span className="font-mono font-bold text-accent-turquoise">{dynamicWorkOrderStats.resolved}</span>
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

        {/* Metric 4: Preventive Intelligence Insights (Honest Demo/Model Indicator) */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
              Preventive Insights
            </h3>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-accent-violet/20 text-accent-violet border border-accent-violet/30">
              SIMULATED SCENARIO
            </span>
          </div>
          <p className="text-[11px] text-text-muted">
            Derived from hydraulic & infrastructure cascade simulations
          </p>
          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-surface-elevated border border-accent-cyan/20">
              <p className="text-[11px] text-accent-cyan font-bold flex items-center gap-1">
                <Sparkles size={12} /> Proactive Drainage Mitigation
              </p>
              <p className="text-[11px] text-text-secondary mt-0.5">
                Simulated pre-clearing of culverts reduces anticipated inundation footprint by up to 38% across adjacent arterial zones.
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
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-text-primary">Urban Incident Registry</h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-elevated text-text-secondary border border-border-subtle">
                {services.incidents === 'success' ? `${filteredIncidents.length} Records Verified` : 'Syncing...'}
              </span>
            </div>
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
          {services.incidents === 'loading' ? (
            <div className="p-8 text-center text-text-muted text-xs">
              <LoadingState message="Loading verified incidents from operational database..." />
            </div>
          ) : services.incidents === 'error' ? (
            <div className="p-8 text-center text-severity-critical text-xs space-y-2">
              <p>Failed to retrieve incidents from municipal backend.</p>
              <Button variant="ghost" size="sm" onClick={fetchDashboardData}>Retry Connection</Button>
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div className="p-8 text-center text-text-muted text-xs">
              No incidents matching the selected criteria.
            </div>
          ) : (
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
          )}
        </div>
      </Card>
    </div>
  )
}
