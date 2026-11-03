import { useEffect, useState } from 'react'
import { geoAPI } from '../../lib/api'
import { Card, LoadingState, ErrorState, SectionHeader, KPICard, Badge } from '../../components/ui'

interface Hotspot {
  cluster_id: number
  center_lat: number
  center_lon: number
  incident_count: number
  avg_severity: number
  dominant_type: string
  zone: string
  incidents: number[]
}

interface HotspotData {
  hotspots: Hotspot[]
  algorithm: string
  parameters: { eps_km: number; min_samples: number }
  total_clustered: number
  noise_points: number
}

export default function GeospatialIntelligence() {
  const [data, setData] = useState<HotspotData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [eps, setEps] = useState('0.5')
  const [minSamples, setMinSamples] = useState('3')

  const run = async () => {
    setLoading(true)
    setError('')
    try {
      const r = await geoAPI.hotspots({ eps_km: eps, min_samples: minSamples })
      const raw = r.data?.hotspots || []
      const normHotspots = raw.map((h: any, i: number) => ({
        cluster_id: h.cluster_id ?? i,
        center_lat: Number(h.center_latitude ?? h.center_lat ?? 12.9716),
        center_lon: Number(h.center_longitude ?? h.center_lon ?? 77.5946),
        incident_count: Number(h.incident_count ?? (h.incident_ids ? h.incident_ids.length : 1)),
        avg_severity: Number(h.average_severity ?? h.avg_severity ?? 6.0),
        dominant_type: String(h.dominant_incident_type ?? h.dominant_type ?? 'Urban Incident'),
        zone: Array.isArray(h.zones_covered) ? h.zones_covered.join(', ') : String(h.zone ?? 'Central Zone'),
        incidents: h.incident_ids ?? h.incidents ?? [],
      }))
      setData({
        hotspots: normHotspots,
        algorithm: r.data?.clustering_algorithm ?? r.data?.algorithm ?? 'DBSCAN',
        parameters: r.data?.parameters ?? { eps_km: Number(eps), min_samples: Number(minSamples) },
        total_clustered: r.data?.total_incidents_analyzed ?? normHotspots.length,
        noise_points: r.data?.noise_points ?? 0,
      })
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { run() }, [])

  // Map Bengaluru bounding box: lat 12.85–13.05, lon 77.48–77.70
  const LAT_MIN = 12.85, LAT_MAX = 13.05, LON_MIN = 77.48, LON_MAX = 77.70
  const mapW = 600, mapH = 320
  const toX = (lon: number) => ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * mapW
  const toY = (lat: number) => ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * mapH
  const radius = (count: number) => Math.max(8, Math.min(30, 6 + count * 1.5))
  const severityColor = (s: number) => s >= 7 ? '#FF5364' : s >= 5 ? '#FF9955' : '#F3C767'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Controls */}
      <Card className="bg-surface-elevated">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase mb-1">DBSCAN Radius (km)</label>
            <input type="number" value={eps} onChange={e => setEps(e.target.value)} step={0.1} min={0.1} max={5}
              className="w-32 bg-bg-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus" />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase mb-1">Min Samples</label>
            <input type="number" value={minSamples} onChange={e => setMinSamples(e.target.value)} min={2} max={20}
              className="w-28 bg-bg-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus" />
          </div>
          <button onClick={run} disabled={loading} className="px-5 py-2 bg-accent-cyan text-bg-main font-semibold rounded-lg hover:bg-accent-deep-cyan transition-colors disabled:opacity-50">
            {loading ? 'Clustering...' : 'Detect Hotspots →'}
          </button>
        </div>
      </Card>

      {loading && <LoadingState message="Running DBSCAN geospatial clustering..." />}
      {error && <ErrorState message={error} onRetry={run} />}

      {data && !loading && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title="Hotspots" value={data.hotspots.length} icon={<span>⊕</span>} color="critical" />
            <KPICard title="Clustered Incidents" value={data.total_clustered} icon={<span>◉</span>} color="high" />
            <KPICard title="Noise Points" value={data.noise_points} icon={<span>◈</span>} color="neutral" />
            <KPICard title="Algorithm" value={data.algorithm} icon={<span>⬡</span>} color="cyan" />
          </div>

          {/* Map */}
          <Card>
            <SectionHeader title="Incident Hotspot Map" subtitle="Bengaluru urban area — DBSCAN spatial clusters" />
            <div className="relative rounded-xl overflow-hidden bg-bg-elevated border border-border-subtle">
              <svg viewBox={`0 0 ${mapW} ${mapH}`} className="w-full" style={{ height: '360px' }}>
                {/* Grid */}
                {[...Array(6)].map((_, i) => (
                  <g key={i}>
                    <line x1={i * mapW / 5} y1={0} x2={i * mapW / 5} y2={mapH} stroke="rgba(54,214,204,0.05)" strokeWidth={1} />
                    <line x1={0} y1={i * mapH / 5} x2={mapW} y2={i * mapH / 5} stroke="rgba(54,214,204,0.05)" strokeWidth={1} />
                  </g>
                ))}
                {/* Axis labels */}
                <text x={4} y={12} fill="#73889D" fontSize="9">N 13.05°</text>
                <text x={4} y={mapH - 4} fill="#73889D" fontSize="9">N 12.85°</text>
                <text x={4} y={mapH - 4} fill="#73889D" fontSize="9" textAnchor="start">E 77.48°</text>
                <text x={mapW - 4} y={mapH - 4} fill="#73889D" fontSize="9" textAnchor="end">E 77.70°</text>

                {/* Hotspot circles */}
                {data.hotspots.map((hs) => {
                  const cx = toX(hs.center_lon)
                  const cy = toY(hs.center_lat)
                  const r = radius(hs.incident_count)
                  const color = severityColor(hs.avg_severity)
                  return (
                    <g key={hs.cluster_id}>
                      {/* Outer pulse ring */}
                      <circle cx={cx} cy={cy} r={r + 8} fill={color} fillOpacity={0.08} />
                      <circle cx={cx} cy={cy} r={r} fill={color} fillOpacity={0.2} stroke={color} strokeWidth={1.5} />
                      {/* Count */}
                      <text x={cx} y={cy + 4} textAnchor="middle" fill={color} fontSize="10" fontWeight="bold">
                        {hs.incident_count}
                      </text>
                    </g>
                  )
                })}
              </svg>

              {/* Legend */}
              <div className="absolute top-3 right-3 glass rounded-lg p-3 text-xs space-y-1.5">
                <div className="text-text-muted font-semibold mb-2">Severity</div>
                {[['Critical (≥7)', '#FF5364'], ['High (≥5)', '#FF9955'], ['Medium', '#F3C767']].map(([l, c]) => (
                  <div key={l} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c as string }} />
                    <span className="text-text-muted">{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Hotspot table */}
          <Card>
            <SectionHeader title="Hotspot Details" subtitle={`${data.hotspots.length} clusters detected`} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle">
                    {['Cluster', 'Zone', 'Incidents', 'Avg Severity', 'Dominant Type', 'Coordinates'].map(h => (
                      <th key={h} className="py-2 px-3 text-left text-xs text-text-muted uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {data.hotspots.sort((a, b) => b.avg_severity - a.avg_severity).map(hs => (
                    <tr key={hs.cluster_id} className="hover:bg-surface-interactive/20">
                      <td className="py-2 px-3 font-mono text-xs text-accent-cyan">C{hs.cluster_id}</td>
                      <td className="py-2 px-3 text-text-secondary">{hs.zone}</td>
                      <td className="py-2 px-3 font-bold text-text-primary">{hs.incident_count}</td>
                      <td className="py-2 px-3">
                        <span style={{ color: severityColor(hs.avg_severity) }} className="font-mono font-bold">
                          {hs.avg_severity?.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-2 px-3"><Badge variant="neutral">{hs.dominant_type}</Badge></td>
                      <td className="py-2 px-3 font-mono text-xs text-text-muted">
                        {hs.center_lat?.toFixed(4)}°N, {hs.center_lon?.toFixed(4)}°E
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
