import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { graphAPI, incidentsAPI } from '../../lib/api'
import { Card, SectionHeader, Badge, SeverityBadge, Button, LoadingState, ErrorState, KPICard } from '../../components/ui'
import { Network, Search, Filter, Share2, Info, ArrowUpRight, CheckCircle2 } from 'lucide-react'

interface ConnectedIncident {
  incident_id: string
  type: string
  zone: string
  severity?: number
  weight: number
  distance_km: number
  shared_factors?: string[]
}

interface IncidentDetails {
  incident_id: string
  type: string
  zone: string
  severity: number
  description?: string
  latitude?: number
  longitude?: number
}

interface GraphSummary {
  total_nodes: number
  total_edges: number
  density: number
  average_degree?: number
}

export default function RelationshipGraph() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialIdFromUrl = searchParams.get('incident_id') || 'INC-1001'

  const [availableIncidents, setAvailableIncidents] = useState<string[]>([])
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(initialIdFromUrl)
  const [maxDistance, setMaxDistance] = useState<number>(3.0)
  const [minWeight, setMinWeight] = useState<number>(0.1)

  const [incidentDetails, setIncidentDetails] = useState<IncidentDetails | null>(null)
  const [connectedNodes, setConnectedNodes] = useState<ConnectedIncident[]>([])
  const [graphSummary, setGraphSummary] = useState<GraphSummary | null>(null)
  const [selectedConnectedNode, setSelectedConnectedNode] = useState<ConnectedIncident | null>(null)

  const [loading, setLoading] = useState(false)
  const [loadingList, setLoadingList] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 1. Populate dynamic incident selector with valid IDs
  useEffect(() => {
    // Generate valid reference IDs (INC-1001 through INC-1125) and supplement from API
    const defaultIds = Array.from({ length: 125 }, (_, i) => `INC-${1001 + i}`)
    incidentsAPI.list({ limit: 125 })
      .then((res) => {
        const raw = res.data?.data ?? res.data?.incidents ?? []
        const apiIds = raw.map((r: any) => String(r.id || r.incident_id)).filter(Boolean)
        const combined = Array.from(new Set([...defaultIds, ...apiIds]))
        setAvailableIncidents(combined)
      })
      .catch(() => {
        setAvailableIncidents(defaultIds)
      })
      .finally(() => setLoadingList(false))
  }, [])

  // 2. Fetch Ego Graph for selected incident
  const fetchGraph = async (id: string) => {
    if (!id || id.trim() === '') return
    setLoading(true)
    setError(null)
    setSelectedConnectedNode(null)

    try {
      const res = await graphAPI.relationships({
        incident_id: id,
        max_distance_km: maxDistance,
        min_weight: minWeight,
        limit: 30,
      })

      const data = res.data
      setGraphSummary(data.graph_summary ?? null)
      setIncidentDetails(data.incident_details ?? null)
      setConnectedNodes(data.connected_incidents ?? [])
      if (data.connected_incidents && data.connected_incidents.length > 0) {
        setSelectedConnectedNode(data.connected_incidents[0])
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || 'Failed to analyze incident relationships'
      setError(detail)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedIncidentId) {
      fetchGraph(selectedIncidentId)
    }
  }, [selectedIncidentId, maxDistance, minWeight])

  const handleSelectIncident = (id: string) => {
    setSelectedIncidentId(id)
    setSearchParams({ incident_id: id })
  }

  return (
    <div className="space-y-6 animate-fade-in select-none">
      {/* ─── Top Diagnostics & Filter Panel ─────────────────────────────────── */}
      <Card className="space-y-4">
        <SectionHeader
          title="Urban Incident Relationship Graph"
          subtitle="Topological ego-network analysis, geospatial proximity, and shared failure vectors"
          badge="NetworkX Engine"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Dynamic Incident Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
              Select Incident ID
            </label>
            <select
              value={selectedIncidentId}
              onChange={(e) => handleSelectIncident(e.target.value)}
              disabled={loadingList}
              className="w-full bg-surface-elevated border border-border-standard rounded-xl px-3.5 py-2.5 text-sm text-text-primary font-mono input-focus cursor-pointer"
            >
              {availableIncidents.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </div>

          {/* Max Distance Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold uppercase tracking-wider text-text-muted">Max Radius</span>
              <span className="font-mono text-accent-cyan font-bold">{maxDistance} km</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={8.0}
              step={0.5}
              value={maxDistance}
              onChange={(e) => setMaxDistance(parseFloat(e.target.value))}
              className="w-full accent-accent-cyan cursor-pointer"
            />
          </div>

          {/* Min Weight Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold uppercase tracking-wider text-text-muted">Min Edge Weight</span>
              <span className="font-mono text-accent-cyan font-bold">{minWeight.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.05}
              max={0.9}
              step={0.05}
              value={minWeight}
              onChange={(e) => setMinWeight(parseFloat(e.target.value))}
              className="w-full accent-accent-cyan cursor-pointer"
            />
          </div>

          {/* Refresh Action */}
          <div>
            <Button
              variant="cyan"
              className="w-full"
              loading={loading}
              icon={<Network size={16} />}
              onClick={() => fetchGraph(selectedIncidentId)}
            >
              Analyze Relationships
            </Button>
          </div>
        </div>
      </Card>

      {/* ─── Graph Metrics ──────────────────────────────────────────────────── */}
      {graphSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard
            title="City Graph Nodes"
            value={graphSummary.total_nodes}
            subtitle="Incident vertices"
            color="blue"
          />
          <KPICard
            title="Total Edge Links"
            value={graphSummary.total_edges}
            subtitle="Cross-infrastructure relations"
            color="cyan"
          />
          <KPICard
            title="Connected Degree"
            value={connectedNodes.length}
            subtitle={`Ego neighbors for ${selectedIncidentId}`}
            color="purple"
          />
          <KPICard
            title="Network Density"
            value={(graphSummary.density * 100).toFixed(1) + '%'}
            subtitle="Relational interconnectivity"
            color="low"
          />
        </div>
      )}

      {/* ─── Main Graph Workspace: Interactive Ego Topology + Details Deck ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Ego Topology Visualizer */}
        <Card className="lg:col-span-2 relative min-h-[460px] flex flex-col justify-between overflow-hidden">
          <SectionHeader
            title={`Ego Topology: ${selectedIncidentId}`}
            subtitle="Central root node connected to localized dependent incidents"
            badge={`${connectedNodes.length} Linked Nodes`}
          />

          {loading ? (
            <LoadingState message="Constructing topological relationship graph..." />
          ) : error ? (
            <ErrorState message={error} onRetry={() => fetchGraph(selectedIncidentId)} />
          ) : (
            <div className="relative flex-1 flex items-center justify-center p-4">
              {/* Interactive SVG Ego Graph */}
              <svg className="w-full h-[400px]" viewBox="0 0 600 400">
                {/* Background grid circles */}
                <circle cx="300" cy="200" r="80" fill="none" stroke="rgba(57, 123, 255, 0.15)" strokeDasharray="4 4" />
                <circle cx="300" cy="200" r="140" fill="none" stroke="rgba(57, 123, 255, 0.1)" strokeDasharray="4 4" />

                {/* Edges from center to neighbors */}
                {connectedNodes.map((node, i) => {
                  const angle = (i / connectedNodes.length) * 2 * Math.PI
                  const dist = 90 + (node.distance_km / maxDistance) * 60
                  const nx = 300 + Math.cos(angle) * dist
                  const ny = 200 + Math.sin(angle) * dist
                  const isSelected = selectedConnectedNode?.incident_id === node.incident_id

                  return (
                    <g key={node.incident_id} className="cursor-pointer" onClick={() => setSelectedConnectedNode(node)}>
                      <line
                        x1="300"
                        y1="200"
                        x2={nx}
                        y2={ny}
                        stroke={isSelected ? '#34D9E8' : 'rgba(57, 123, 255, 0.4)'}
                        strokeWidth={Math.max(1, node.weight * 4)}
                        strokeOpacity={isSelected ? 1 : 0.6}
                      />
                      {/* Neighbor Circle */}
                      <circle
                        cx={nx}
                        cy={ny}
                        r={isSelected ? 14 : 10}
                        fill={isSelected ? '#34D9E8' : '#172443'}
                        stroke={node.severity && node.severity >= 8 ? '#FF5577' : '#397BFF'}
                        strokeWidth="2.5"
                        className="transition-all hover:scale-125"
                      />
                      {/* Node Label */}
                      <text
                        x={nx}
                        y={ny + (ny > 200 ? 18 : -14)}
                        fill="#F8FAFC"
                        fontSize="9"
                        fontFamily="JetBrains Mono, monospace"
                        textAnchor="middle"
                        className="pointer-events-none font-bold"
                      >
                        {node.incident_id}
                      </text>
                    </g>
                  )
                })}

                {/* Central Root Node */}
                <circle
                  cx="300"
                  cy="200"
                  r="20"
                  fill="#121D38"
                  stroke="#34D9E8"
                  strokeWidth="3.5"
                  className="animate-pulse-slow shadow-glow-cyan"
                />
                <circle cx="300" cy="200" r="8" fill="#34D9E8" />
                <text
                  x="300"
                  y="235"
                  fill="#34D9E8"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {selectedIncidentId} (Root)
                </text>
              </svg>

              <div className="absolute bottom-2 right-2 text-[10px] font-mono text-text-muted bg-bg-midnight/70 px-2 py-1 rounded border border-border-subtle">
                Radius: Proximity • Line Width: Relational Weight
              </div>
            </div>
          )}
        </Card>

        {/* Node Detail & Relationship Inspector */}
        <Card className="space-y-4">
          <SectionHeader title="Connection Diagnostics" subtitle="Shared vectors and correlation metrics" />

          {selectedConnectedNode ? (
            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-surface-elevated border border-accent-cyan/30">
                <span className="text-[10px] font-mono text-accent-cyan uppercase">Linked Neighbor</span>
                <p className="text-base font-bold text-text-primary mt-0.5">
                  {selectedConnectedNode.incident_id}
                </p>
                <p className="text-text-secondary">{selectedConnectedNode.type}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="cyan">Zone: {selectedConnectedNode.zone}</Badge>
                  {selectedConnectedNode.severity && (
                    <SeverityBadge severity={selectedConnectedNode.severity} />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1.5 border-b border-border-subtle">
                  <span className="text-text-muted">Proximity Distance</span>
                  <span className="font-mono text-text-primary font-bold">
                    {selectedConnectedNode.distance_km.toFixed(2)} km
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border-subtle">
                  <span className="text-text-muted">Edge Coupling Weight</span>
                  <span className="font-mono text-accent-cyan font-bold">
                    {(selectedConnectedNode.weight * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {selectedConnectedNode.shared_factors && selectedConnectedNode.shared_factors.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-text-muted uppercase">Shared Failure Factors</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedConnectedNode.shared_factors.map((f, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded bg-accent-blue/15 text-accent-blue border border-accent-blue/20 text-[11px]"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                icon={<ArrowUpRight size={14} />}
                onClick={() => handleSelectIncident(selectedConnectedNode.incident_id)}
              >
                Pivot Ego Center to {selectedConnectedNode.incident_id}
              </Button>
            </div>
          ) : incidentDetails ? (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-surface-elevated border border-border-standard">
                <span className="text-[10px] font-mono text-accent-cyan uppercase">Root Incident</span>
                <p className="text-sm font-bold text-text-primary mt-1">{incidentDetails.type}</p>
                <p className="text-text-muted">Zone: {incidentDetails.zone}</p>
                <div className="mt-2">
                  <SeverityBadge severity={incidentDetails.severity} />
                </div>
              </div>
              <p className="text-text-muted">Click any connected node circle to inspect coupling metrics.</p>
            </div>
          ) : (
            <p className="text-xs text-text-muted">No node selected.</p>
          )}
        </Card>
      </div>
    </div>
  )
}
