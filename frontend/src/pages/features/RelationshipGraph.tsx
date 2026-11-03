import { useEffect, useState } from 'react'
import { graphAPI } from '../../lib/api'
import { Card, LoadingState, ErrorState, SectionHeader, Badge, KPICard } from '../../components/ui'

interface GraphData {
  incident_id: number
  related_incidents: Array<{
    id: number
    title: string
    type: string
    weight: number
    distance_km: number
    shared_factors: string[]
  }>
  graph_summary: {
    total_nodes: number
    total_edges: number
    density: number
    avg_weight: number
  }
  centrality?: Record<string, number>
}

export default function RelationshipGraph() {
  const [data, setData] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [incidentId, setIncidentId] = useState('1')
  const [maxDist, setMaxDist] = useState('2.0')
  const [minWeight, setMinWeight] = useState('0.1')

  const run = async () => {
    setLoading(true)
    setError('')
    try {
      const r = await graphAPI.relationships({
        incident_id: incidentId,
        max_distance_km: maxDist,
        min_weight: minWeight,
        limit: 20,
      })
      setData(r.data)
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { run() }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="bg-surface-elevated">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase mb-1">Incident ID</label>
            <input
              type="number" value={incidentId} onChange={e => setIncidentId(e.target.value)} min={1}
              className="w-28 bg-bg-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase mb-1">Max Distance (km)</label>
            <input
              type="number" value={maxDist} onChange={e => setMaxDist(e.target.value)} step={0.5} min={0.1} max={50}
              className="w-32 bg-bg-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase mb-1">Min Weight</label>
            <input
              type="number" value={minWeight} onChange={e => setMinWeight(e.target.value)} step={0.05} min={0} max={1}
              className="w-28 bg-bg-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus"
            />
          </div>
          <button onClick={run} disabled={loading} className="px-5 py-2 bg-accent-cyan text-bg-main font-semibold rounded-lg hover:bg-accent-deep-cyan transition-colors disabled:opacity-50">
            {loading ? 'Analysing...' : 'Analyse Relationships →'}
          </button>
        </div>
      </Card>

      {loading && <LoadingState message="Building incident relationship graph..." />}
      {error && <ErrorState message={error} onRetry={run} />}

      {data && !loading && (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title="Graph Nodes" value={data.graph_summary.total_nodes} icon={<span>◈</span>} color="cyan" />
            <KPICard title="Graph Edges" value={data.graph_summary.total_edges} icon={<span>—</span>} color="blue" />
            <KPICard title="Density" value={data.graph_summary.density?.toFixed(3) ?? '—'} icon={<span>◉</span>} color="purple" />
            <KPICard title="Related Found" value={data.related_incidents.length} icon={<span>⊕</span>} color="low" />
          </div>

          {/* Relationship network visual */}
          <Card>
            <SectionHeader title={`Relationships for Incident #${incidentId}`} subtitle="Incidents connected by location, type, and environmental factors" />
            {data.related_incidents.length === 0 ? (
              <p className="text-text-muted text-sm">No related incidents found with current parameters.</p>
            ) : (
              <>
                {/* Visual graph (SVG based) */}
                <div className="relative overflow-hidden rounded-xl bg-bg-elevated border border-border-subtle p-4 mb-4" style={{ height: 280 }}>
                  <svg width="100%" height="100%" viewBox="0 0 800 260" className="overflow-visible">
                    {/* Center node */}
                    <g>
                      <circle cx={400} cy={130} r={24} fill="rgba(54,214,204,0.2)" stroke="#36D6CC" strokeWidth={2} />
                      <text x={400} y={134} textAnchor="middle" fill="#36D6CC" fontSize="11" fontWeight="bold">#{incidentId}</text>
                    </g>
                    {/* Satellite nodes */}
                    {data.related_incidents.slice(0, 12).map((rel, i) => {
                      const count = Math.min(data.related_incidents.length, 12)
                      const angle = (i / count) * 2 * Math.PI - Math.PI / 2
                      const r = 100
                      const cx = 400 + r * Math.cos(angle)
                      const cy = 130 + r * Math.sin(angle)
                      const w = rel.weight
                      const opacity = 0.3 + w * 0.7
                      const color = w > 0.7 ? '#FF5364' : w > 0.4 ? '#FF9955' : '#36D6CC'
                      return (
                        <g key={rel.id}>
                          <line x1={400} y1={130} x2={cx} y2={cy} stroke={color} strokeWidth={1 + w * 2} strokeOpacity={opacity * 0.6} />
                          <circle cx={cx} cy={cy} r={14} fill={`${color}22`} stroke={color} strokeWidth={1.5} strokeOpacity={opacity} />
                          <text x={cx} y={cy + 4} textAnchor="middle" fill={color} fontSize="9" fillOpacity={opacity}>#{rel.id}</text>
                        </g>
                      )
                    })}
                  </svg>
                  <div className="absolute bottom-3 right-3 flex gap-4 text-xs text-text-muted">
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-status-critical inline-block" /> High (≥0.7)</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-status-high inline-block" /> Medium (≥0.4)</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-accent-cyan inline-block" /> Low</span>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-subtle">
                        {['ID', 'Title', 'Type', 'Weight', 'Distance', 'Shared Factors'].map(h => (
                          <th key={h} className="py-2 px-3 text-left text-xs text-text-muted uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {data.related_incidents.map(rel => (
                        <tr key={rel.id} className="hover:bg-surface-interactive/20">
                          <td className="py-2 px-3 font-mono text-xs text-text-muted">#{rel.id}</td>
                          <td className="py-2 px-3 text-text-secondary max-w-xs truncate">{rel.title}</td>
                          <td className="py-2 px-3"><Badge variant="neutral">{rel.type}</Badge></td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <div className="h-1 w-16 bg-surface-elevated rounded-full overflow-hidden">
                                <div className="h-full bg-accent-cyan rounded-full" style={{ width: `${rel.weight * 100}%` }} />
                              </div>
                              <span className="text-xs text-text-muted font-mono">{rel.weight?.toFixed(2)}</span>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-xs text-text-muted font-mono">{rel.distance_km?.toFixed(2)} km</td>
                          <td className="py-2 px-3">
                            <div className="flex flex-wrap gap-1">
                              {rel.shared_factors?.slice(0, 3).map(f => <Badge key={f} variant="neutral" size="sm">{f}</Badge>)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
