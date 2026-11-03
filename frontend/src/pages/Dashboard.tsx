import { useEffect, useState } from 'react'
import { healthAPI, incidentsAPI } from '../lib/api'
import { KPICard, Card, Badge, SeverityBadge, LoadingState, ErrorState, SectionHeader } from '../components/ui'

interface HealthData {
  status: string
  records_loaded: number
  graph_nodes: number
  graph_edges: number
  ml_model_trained: boolean
  ml_test_accuracy: number
  dataset_available: boolean
}

interface SummaryData {
  total_incidents?: number
  total_records?: number
  by_category?: Record<string, number>
  by_zone?: Record<string, number>
  by_status?: Record<string, number>
  zones?: Record<string, number>
  categories?: Record<string, number>
  statuses?: Record<string, number>
  severity_avg?: number
}

interface Incident {
  id: number
  title: string
  incident_type: string
  zone: string
  severity: number
  status: string
  reported_at: string
}

export default function Dashboard() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loadingHealth, setLoadingHealth] = useState(true)
  const [loadingIncidents, setLoadingIncidents] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      healthAPI.health().then(r => setHealth(r.data)),
      healthAPI.summary().then(r => setSummary(r.data)),
    ])
      .catch(e => setError(e.message))
      .finally(() => setLoadingHealth(false))

    incidentsAPI.list({ limit: 10, sort: 'severity_desc' })
      .then(r => {
        const raw = r.data?.data ?? r.data?.incidents ?? r.data
        setIncidents(Array.isArray(raw) ? raw : [])
      })
      .catch(() => setIncidents([]))
      .finally(() => setLoadingIncidents(false))
  }, [])

  const refresh = () => {
    setLoadingHealth(true)
    setError('')
    Promise.all([
      healthAPI.health().then(r => setHealth(r.data)),
      healthAPI.summary().then(r => setSummary(r.data)),
    ])
      .catch(e => setError(e.message))
      .finally(() => setLoadingHealth(false))
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, 'cyan' | 'high' | 'low' | 'neutral'> = {
      open: 'cyan', in_progress: 'high', resolved: 'low', closed: 'neutral',
    }
    return <Badge variant={map[status] ?? 'neutral'} dot>{status?.replace('_', ' ')}</Badge>
  }

  const formatTime = (ts: string) => {
    try { return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) }
    catch { return ts }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-accent-cyan/20 bg-gradient-to-r from-bg-elevated via-surface-card to-bg-elevated p-8">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-cyan/5 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
            <span className="text-xs text-accent-cyan font-mono uppercase tracking-widest">Live Intelligence Feed</span>
          </div>
          <h1 className="text-3xl font-black text-text-primary mb-2">
            Bengaluru Urban<br />
            <span className="text-gradient-cyan">Command Center</span>
          </h1>
          <p className="text-text-secondary max-w-lg">
            Real-time AI-powered city intelligence — monitoring {health?.records_loaded ?? '...'} incidents across {health?.graph_nodes ?? '...'} network nodes with {((health?.ml_test_accuracy ?? 0) * 100).toFixed(1)}% ML accuracy.
          </p>
        </div>

        {/* System health indicators */}
        <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${health?.status === 'healthy' ? 'bg-status-low animate-pulse' : 'bg-status-critical'}`} />
            <span className="text-xs text-text-muted font-mono">{health?.status?.toUpperCase() ?? 'CHECKING'}</span>
          </div>
          <div className="text-xs text-text-muted font-mono">{health?.graph_edges ?? 0} graph edges</div>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={refresh} />}

      {/* KPI Grid */}
      <div>
        <SectionHeader title="System Metrics" subtitle="Live operational snapshot from backend APIs" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Incidents"
            value={summary?.total_records ?? summary?.total_incidents ?? health?.records_loaded ?? '—'}
            subtitle="In dataset"
            icon={<span>⊕</span>}
            color="cyan"
            loading={loadingHealth}
          />
          <KPICard
            title="Graph Nodes"
            value={health?.graph_nodes ?? '—'}
            subtitle={`${health?.graph_edges ?? '—'} edges`}
            icon={<span>◈</span>}
            color="blue"
            loading={loadingHealth}
          />
          <KPICard
            title="ML Accuracy"
            value={health ? `${((health.ml_test_accuracy) * 100).toFixed(1)}%` : '—'}
            subtitle="Test set performance"
            icon={<span>⬡</span>}
            color="low"
            loading={loadingHealth}
          />
          <KPICard
            title="Model Status"
            value={health?.ml_model_trained ? 'Trained' : 'Pending'}
            subtitle="RandomForest classifier"
            icon={<span>◉</span>}
            color={health?.ml_model_trained ? 'low' : 'critical'}
            loading={loadingHealth}
          />
        </div>
      </div>

      {/* Zone breakdown + By category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Zone */}
        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">Incidents by Zone</h3>
          {loadingHealth ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <div key={i} className="h-8 shimmer rounded" />)}
            </div>
          ) : (summary?.zones || summary?.by_zone) ? (
            <div className="space-y-3">
              {Object.entries((summary?.zones || summary?.by_zone) as Record<string, number>)
                .sort((a, b) => b[1] - a[1])
                .map(([zone, count]) => {
                  const zoneObj = (summary?.zones || summary?.by_zone) as Record<string, number>
                  const max = Math.max(...Object.values(zoneObj))
                  const pct = Math.round((count / max) * 100)
                  return (
                    <div key={zone}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-secondary">{zone}</span>
                        <span className="text-text-muted font-mono">{count}</span>
                      </div>
                      <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent-cyan rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          ) : (
            <p className="text-text-muted text-sm">No zone data available</p>
          )}
        </Card>

        {/* By Category */}
        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">Incidents by Category</h3>
          {loadingHealth ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <div key={i} className="h-8 shimmer rounded" />)}
            </div>
          ) : (summary?.categories || summary?.by_category) ? (
            <div className="flex flex-wrap gap-2">
              {Object.entries((summary?.categories || summary?.by_category) as Record<string, number>)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, count]) => (
                  <div key={cat} className="px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle flex items-center gap-2">
                    <span className="text-xs text-text-secondary">{cat}</span>
                    <span className="text-xs font-bold text-accent-cyan">{count}</span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-text-muted text-sm">No category data available</p>
          )}
        </Card>
      </div>

      {/* Recent Incidents Table */}
      <div>
        <SectionHeader
          title="Recent Incidents"
          subtitle="Latest reported urban incidents, sorted by severity"
        />
        <Card className="p-0 overflow-hidden">
          {loadingIncidents ? (
            <LoadingState message="Loading incidents..." />
          ) : incidents.length === 0 ? (
            <div className="p-8 text-center text-text-muted text-sm">No incidents loaded — submit one via Incident Intake.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-subtle">
                    {['ID', 'Title', 'Type', 'Zone', 'Severity', 'Status', 'Reported'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider first:pl-5 last:pr-5">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {incidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-surface-interactive/30 transition-colors group">
                      <td className="px-4 py-3 pl-5 font-mono text-xs text-text-muted">#{inc.id}</td>
                      <td className="px-4 py-3 text-sm text-text-primary max-w-xs truncate">{inc.title}</td>
                      <td className="px-4 py-3"><Badge variant="neutral">{inc.incident_type}</Badge></td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{inc.zone}</td>
                      <td className="px-4 py-3"><SeverityBadge severity={inc.severity} /></td>
                      <td className="px-4 py-3">{getStatusBadge(inc.status)}</td>
                      <td className="px-4 py-3 pr-5 text-xs text-text-muted font-mono">{formatTime(inc.reported_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Feature Quick Nav */}
      <div>
        <SectionHeader title="Intelligence Features" subtitle="All 10 active AI engines" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { n: 1, label: 'Incident Graph', path: '/features/graph', icon: '◈' },
            { n: 2, label: 'Geospatial', path: '/features/geospatial', icon: '⊕' },
            { n: 3, label: 'Predictive ML', path: '/features/predictive', icon: '⬡' },
            { n: 4, label: 'Cascade', path: '/features/cascade', icon: '⟁' },
            { n: 5, label: 'Impact Score', path: '/features/impact', icon: '◉' },
            { n: 6, label: 'Smart Priority', path: '/features/priority', icon: '▲' },
            { n: 7, label: 'What-If Sim', path: '/features/whatif', icon: '⟳' },
            { n: 8, label: 'Recommendations', path: '/features/recommendations', icon: '⬙' },
            { n: 9, label: 'Prevention', path: '/features/prevention', icon: '◈' },
            { n: 10, label: 'Weather Risk', path: '/features/weather', icon: '⊛' },
          ].map(f => (
            <a
              key={f.n}
              href={f.path}
              className="p-4 rounded-xl border border-border-subtle bg-surface-card hover:border-accent-cyan/30 hover:bg-surface-interactive transition-all duration-200 group text-center"
            >
              <div className="text-2xl mb-2 text-accent-cyan/60 group-hover:text-accent-cyan transition-colors">{f.icon}</div>
              <div className="text-xs text-text-muted group-hover:text-text-secondary">F{f.n}</div>
              <div className="text-xs font-medium text-text-secondary mt-0.5">{f.label}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
