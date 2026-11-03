import { useEffect, useState } from 'react'
import { geoAPI } from '../../lib/api'
import { Card, LoadingState, ErrorState, SectionHeader, KPICard, Badge, SeverityBadge, Button } from '../../components/ui'
import { MapPin, Sliders, Layers, Compass, CheckCircle2 } from 'lucide-react'

interface Hotspot {
  cluster_id: number
  center_lat: number | null
  center_lon: number | null
  incident_count: number | null
  avg_severity: number | null
  dominant_type: string | null
  zone: string | null
  incidents: string[]
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
  const [selectedCluster, setSelectedCluster] = useState<Hotspot | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [eps, setEps] = useState('0.8')
  const [minSamples, setMinSamples] = useState('2')

  const run = async () => {
    setLoading(true)
    setError('')
    try {
      const r = await geoAPI.hotspots({ eps_km: parseFloat(eps), min_samples: parseInt(minSamples) })
      const raw = r.data?.hotspots || []
      const parseCoord = (v: any, min: number, max: number): number | null => {
        if (v === null || v === undefined || v === '') return null
        const n = Number(v)
        return isNaN(n) || n < min || n > max ? null : n
      }
      const normHotspots: Hotspot[] = raw.map((h: any, i: number) => {
        const lat = parseCoord(h.center_latitude ?? h.center_lat, -90, 90)
        const lon = parseCoord(h.center_longitude ?? h.center_lon, -180, 180)
        const hasCoords = lat !== null && lon !== null
        const countRaw = h.incident_count ?? (h.incident_ids ? h.incident_ids.length : null)
        const count = countRaw !== null && countRaw !== undefined && !isNaN(Number(countRaw)) ? Number(countRaw) : null
        const sevRaw = h.average_severity ?? h.avg_severity ?? h.severity
        const avgSev = sevRaw !== null && sevRaw !== undefined && !isNaN(Number(sevRaw)) ? Number(sevRaw) : null
        const zoneStr = Array.isArray(h.zones_covered) && h.zones_covered.length > 0 
          ? h.zones_covered.join(', ') 
          : (h.zone ? String(h.zone) : null)
        return {
          cluster_id: h.cluster_id ?? i,
          center_lat: hasCoords ? lat : null,
          center_lon: hasCoords ? lon : null,
          incident_count: count,
          avg_severity: avgSev,
          dominant_type: h.dominant_incident_type ?? h.dominant_type ?? null,
          zone: zoneStr,
          incidents: h.incident_ids ?? h.incidents ?? [],
        }
      })
      setData({
        hotspots: normHotspots,
        algorithm: r.data?.clustering_algorithm ?? r.data?.algorithm ?? 'DBSCAN',
        parameters: r.data?.parameters ?? { eps_km: Number(eps), min_samples: Number(minSamples) },
        total_clustered: r.data?.total_incidents_analyzed ?? normHotspots.length,
        noise_points: r.data?.noise_points ?? 0,
      })
      if (normHotspots.length > 0) {
        setSelectedCluster(normHotspots[0])
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    run()
  }, [])

  // Bounding box: lat 12.85–13.08, lon 77.46–77.72
  const LAT_MIN = 12.85, LAT_MAX = 13.08, LON_MIN = 77.46, LON_MAX = 77.72
  const mapW = 600, mapH = 360
  const toX = (lon: number) => ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * mapW
  const toY = (lat: number) => ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * mapH

  return (
    <div className="space-y-6 animate-fade-in select-none">
      {/* ─── Control Deck ───────────────────────────────────────────────────── */}
      <Card className="space-y-4">
        <SectionHeader
          title="Geospatial Intelligence & DBSCAN Hotspot Detection"
          subtitle="Autonomous density-based spatial clustering of urban incidents without arbitrary grid distortion"
          badge="Scikit-Learn DBSCAN"
        />

        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
              Cluster Epsilon (km)
            </label>
            <input
              type="number"
              step="0.1"
              min="0.2"
              max="5.0"
              value={eps}
              onChange={(e) => setEps(e.target.value)}
              className="w-32 bg-surface-elevated border border-border-standard rounded-xl px-3 py-2 text-sm text-text-primary input-focus font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
              Min Incident Samples
            </label>
            <input
              type="number"
              min="1"
              max="15"
              value={minSamples}
              onChange={(e) => setMinSamples(e.target.value)}
              className="w-32 bg-surface-elevated border border-border-standard rounded-xl px-3 py-2 text-sm text-text-primary input-focus font-mono"
            />
          </div>

          <Button
            variant="cyan"
            icon={<MapPin size={16} />}
            loading={loading}
            onClick={run}
          >
            Compute Spatial Hotspots
          </Button>
        </div>
      </Card>

      {/* ─── Cluster KPI Summary ────────────────────────────────────────────── */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Hotspot Clusters"
            value={data.hotspots.length}
            subtitle="Dense spatial cores"
            color="cyan"
          />
          <KPICard
            title="Algorithm"
            value={data.algorithm}
            subtitle={`Eps: ${eps}km, Min: ${minSamples}`}
            color="blue"
          />
          <KPICard
            title="Incidents Clustered"
            value={data.total_clustered}
            subtitle="Analyzed points"
            color="purple"
          />
          <KPICard
            title="Noise Residuals"
            value={data.noise_points}
            subtitle="Isolated outlier events"
            color="low"
          />
        </div>
      )}

      {/* ─── Visual Hotspot Scattermap & Diagnostics Deck ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 relative overflow-hidden flex flex-col justify-between">
          <SectionHeader
            title="Urban Spatial Scattermap"
            subtitle="Bengaluru metropolitan geographical cluster projection"
            badge="DBSCAN Coordinates"
          />

          {loading ? (
            <LoadingState message="Recalculating spatial density clusters..." />
          ) : error ? (
            <ErrorState message={error} onRetry={run} />
          ) : (
            <div className="relative flex-1 flex items-center justify-center p-2">
              <svg className="w-full h-[360px] bg-bg-midnight/70 rounded-2xl border border-border-subtle" viewBox={`0 0 ${mapW} ${mapH}`}>
                {/* Lat/Lon Grid Lines */}
                {[0.25, 0.5, 0.75].map((pct, idx) => (
                  <line
                    key={`h-${idx}`}
                    x1="0"
                    y1={mapH * pct}
                    x2={mapW}
                    y2={mapH * pct}
                    stroke="rgba(57, 123, 255, 0.1)"
                    strokeDasharray="4 4"
                  />
                ))}
                {[0.25, 0.5, 0.75].map((pct, idx) => (
                  <line
                    key={`v-${idx}`}
                    x1={mapW * pct}
                    y1="0"
                    x2={mapW * pct}
                    y2={mapH}
                    stroke="rgba(57, 123, 255, 0.1)"
                    strokeDasharray="4 4"
                  />
                ))}

                {/* Hotspot Circles */}
                {data?.hotspots.filter(hs => hs.center_lat !== null && hs.center_lon !== null).map((hs) => {
                  const cx = toX(hs.center_lon!)
                  const cy = toY(hs.center_lat!)
                  const isSelected = selectedCluster?.cluster_id === hs.cluster_id
                  const col = (hs.avg_severity ?? 0) >= 7.5 ? '#FF5577' : (hs.avg_severity ?? 0) >= 5.5 ? '#FF9B55' : '#34D9E8'

                  return (
                    <g
                      key={hs.cluster_id}
                      className="cursor-pointer group"
                      onClick={() => setSelectedCluster(hs)}
                    >
                      {/* Density Buffer Halo */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={Math.max(16, (hs.incident_count ?? 1) * 2.8)}
                        fill={col}
                        fillOpacity={isSelected ? 0.35 : 0.15}
                        stroke={col}
                        strokeWidth={isSelected ? 2.5 : 1}
                      />
                      {/* Center Point */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isSelected ? 7 : 4.5}
                        fill={col}
                        stroke="#080D1B"
                        strokeWidth="1.5"
                      />
                      {/* Cluster Text Tag */}
                      <text
                        x={cx}
                        y={cy - 12}
                        fill="#F8FAFC"
                        fontSize="9"
                        fontFamily="JetBrains Mono, monospace"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        #{hs.cluster_id} ({hs.incident_count ?? 'N/A'})
                      </text>
                    </g>
                  )
                })}
              </svg>

              <div className="absolute bottom-4 right-4 text-[10px] font-mono text-text-muted bg-bg-midnight/90 px-2 py-1 rounded border border-border-subtle">
                Halo Radius: Spatial Incident Density
              </div>
            </div>
          )}
        </Card>

        {/* Selected Cluster Detail Deck */}
        <Card className="space-y-4">
          <SectionHeader title="Cluster Deep-Dive" subtitle="Density analytics & zone attributes" />

          {selectedCluster ? (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-surface-elevated border border-accent-cyan/30 space-y-2">
                <span className="text-[10px] font-mono text-accent-cyan uppercase">
                  Cluster #{selectedCluster.cluster_id} Focus
                </span>
                <p className="text-base font-bold text-text-primary leading-tight">
                  {selectedCluster.dominant_type}
                </p>
                <Badge variant="cyan">Zone: {selectedCluster.zone || 'Unassigned'}</Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1.5 border-b border-border-subtle">
                  <span className="text-text-muted">Centroid Latitude</span>
                  <span className="font-mono text-text-primary font-bold">{selectedCluster.center_lat !== null ? selectedCluster.center_lat.toFixed(4) : 'Unavailable'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border-subtle">
                  <span className="text-text-muted">Centroid Longitude</span>
                  <span className="font-mono text-text-primary font-bold">{selectedCluster.center_lon !== null ? selectedCluster.center_lon.toFixed(4) : 'Unavailable'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border-subtle">
                  <span className="text-text-muted">Incidents in Core</span>
                  <span className="font-mono text-accent-cyan font-bold">{selectedCluster.incident_count !== null ? `${selectedCluster.incident_count} events` : 'Count N/A'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border-subtle">
                  <span className="text-text-muted">Average Severity</span>
                  <SeverityBadge severity={selectedCluster.avg_severity} />
                </div>
              </div>

              {selectedCluster.incidents && selectedCluster.incidents.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-text-muted uppercase">Linked Incident IDs</span>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {selectedCluster.incidents.map((id, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-surface-elevated text-text-secondary font-mono text-[10px]">
                        {id}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-text-muted">Click a cluster marker on the scattermap to inspect.</p>
          )}
        </Card>
      </div>
    </div>
  )
}
