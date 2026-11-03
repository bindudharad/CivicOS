import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { geoAPI, incidentsAPI, normalizeIncident, normalizeHotspot, NormalizedIncident, NormalizedHotspot } from '../lib/api'
import { Card, SectionHeader, Badge, SeverityBadge, Button, LoadingState } from '../components/ui'
import CityScene3D from '../components/city/CityScene3D'
import { 
  Box, 
  Layers, 
  Maximize2, 
  RotateCcw, 
  Eye, 
  MapPin, 
  Crosshair, 
  Sliders, 
  Activity, 
  Info,
  ExternalLink,
  X,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react'

export default function LiveMap() {
  const navigate = useNavigate()

  const [hotspots, setHotspots] = useState<NormalizedHotspot[]>([])
  const [incidents, setIncidents] = useState<NormalizedIncident[]>([])
  const [selectedIncident, setSelectedIncident] = useState<NormalizedIncident | null>(null)
  const [selectedHotspot, setSelectedHotspot] = useState<NormalizedHotspot | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('All')

  // Layer Toggles
  const [layers, setLayers] = useState({
    buildings: true,
    roads: true,
    hotspots: true,
    incidents: true,
    traffic: true,
    districts: true,
  })

  // 1. Fetch Spatial Data
  useEffect(() => {
    setLoading(true)
    Promise.all([
      geoAPI.hotspots({ eps_km: 0.8, min_samples: 2 }).catch(() => ({ data: { hotspots: [] } })),
      incidentsAPI.list({ limit: 125 }).catch(() => ({ data: [] })),
    ])
      .then(([geoRes, incRes]) => {
        // Hotspots
        const rawHotspots = geoRes.data?.hotspots ?? []
        const normHotspots = rawHotspots.map(normalizeHotspot)
        setHotspots(normHotspots)
        if (normHotspots.length > 0) setSelectedHotspot(normHotspots[0])

        // Incidents
        const rawIncidents = incRes.data?.data ?? incRes.data?.incidents ?? (Array.isArray(incRes.data) ? incRes.data : [])
        const normIncidents = rawIncidents.map(normalizeIncident)
        setIncidents(normIncidents)
        if (normIncidents.length > 0) setSelectedIncident(normIncidents[0])
      })
      .catch((err) => {
        console.error('Failed to load spatial data for 3D city', err)
      })
      .finally(() => setLoading(false))
  }, [])

  // Filtered incidents by zone
  const filteredIncidents = useMemo(() => {
    if (selectedZoneFilter === 'All') return incidents
    return incidents.filter((i) => i.zone.toLowerCase().includes(selectedZoneFilter.toLowerCase()))
  }, [incidents, selectedZoneFilter])

  return (
    <div className="space-y-6 animate-fade-in select-none">
      {/* ─── Top Control Bar ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-surface-card border border-border-standard">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-cyan/15 text-accent-cyan flex items-center justify-center border border-accent-cyan/30 shadow-glow-cyan">
            <Box size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-text-primary tracking-tight">
                Live 3D Urban Digital Twin
              </h1>
              <Badge variant="cyan" dot>
                WebGL Active
              </Badge>
            </div>
            <p className="text-xs text-text-secondary">
              High-resolution spatial model of Bengaluru infrastructure & real-time incidents
            </p>
          </div>
        </div>

        {/* Zone Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-text-muted font-mono">Zone Filter:</span>
            <select
              value={selectedZoneFilter}
              onChange={(e) => setSelectedZoneFilter(e.target.value)}
              className="bg-surface-elevated border border-border-standard rounded-xl px-3 py-1.5 text-xs text-text-primary input-focus cursor-pointer"
            >
              <option value="All">All Municipal Zones</option>
              <option value="Central">Central Zone</option>
              <option value="East">East Zone</option>
              <option value="West">West Zone</option>
              <option value="North">North Zone</option>
              <option value="South">South Zone</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── Main 3D Viewport with Floating Inspector Drawer ─────────────────── */}
      <div className="relative rounded-2xl overflow-hidden border border-border-standard bg-bg-midnight">
        {loading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-bg-midnight/90 backdrop-blur-sm">
            <LoadingState message="Initializing 3D Urban Digital Twin & Meshes..." />
          </div>
        )}

        {/* 3D WebGL Canvas */}
        <CityScene3D
          mode="full"
          height={640}
          incidents={filteredIncidents}
          hotspots={hotspots}
          selectedIncident={selectedIncident}
          onIncidentSelect={(inc) => setSelectedIncident(inc)}
          onHotspotSelect={(hs) => setSelectedHotspot(hs)}
          selectedZoneFilter={selectedZoneFilter}
          showLayers={layers}
        />

        {/* Floating Incident Inspector Drawer (Right Side) */}
        {selectedIncident && (
          <div className="absolute top-4 right-4 z-20 w-80 max-w-[calc(100%-2rem)] p-4 rounded-2xl bg-bg-midnight/95 backdrop-blur-xl border border-accent-cyan/30 shadow-card-elevated space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-accent-cyan tracking-wider uppercase">
                  Selected Incident • {selectedIncident.id}
                </span>
                <h3 className="text-sm font-bold text-text-primary mt-0.5 line-clamp-1">
                  {selectedIncident.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                aria-label="Close inspector drawer"
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <p className="text-xs text-text-secondary line-clamp-2">
              {selectedIncident.description}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs py-1 font-mono">
              <div className="p-2 rounded-lg bg-surface-elevated/70 border border-border-subtle">
                <span className="text-[10px] text-text-muted block">Severity</span>
                <SeverityBadge severity={selectedIncident.severity} className="mt-1" />
              </div>
              <div className="p-2 rounded-lg bg-surface-elevated/70 border border-border-subtle">
                <span className="text-[10px] text-text-muted block">Status</span>
                <Badge variant={selectedIncident.status === 'resolved' ? 'low' : 'high'} dot className="mt-1">
                  {selectedIncident.status}
                </Badge>
              </div>
              <div className="p-2 rounded-lg bg-surface-elevated/70 border border-border-subtle">
                <span className="text-[10px] text-text-muted block">Zone</span>
                <span className="text-text-primary font-semibold truncate block mt-1">{selectedIncident.zone}</span>
              </div>
              <div className="p-2 rounded-lg bg-surface-elevated/70 border border-border-subtle">
                <span className="text-[10px] text-text-muted block">Type</span>
                <span className="text-text-secondary truncate block mt-1">{selectedIncident.incident_type}</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <Button
                variant="cyan"
                size="sm"
                className="w-full"
                icon={<ArrowUpRight size={13} />}
                onClick={() => navigate(`/features/graph?incident_id=${selectedIncident.id}`)}
              >
                Analyze Topology Graph
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                icon={<ShieldAlert size={13} />}
                onClick={() => navigate(`/features/cascading-impact?incident_id=${selectedIncident.id}`)}
              >
                Simulate Cascade Impact
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Bottom Hotspot Diagnostics & Analytics Table ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <SectionHeader
            title="DBSCAN Hotspot Clusters"
            subtitle="High-density anomaly zones detected by spatial clustering algorithms"
            badge={`${hotspots.length} Clusters Active`}
          />

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-elevated/60 text-text-muted uppercase font-mono text-[10px] tracking-wider border-b border-border-standard">
                <tr>
                  <th className="py-2.5 px-3">Cluster</th>
                  <th className="py-2.5 px-3">Dominant Hazard</th>
                  <th className="py-2.5 px-3">Density</th>
                  <th className="py-2.5 px-3">Avg Severity</th>
                  <th className="py-2.5 px-3">Zone</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {hotspots.map((hs) => (
                  <tr
                    key={hs.cluster_id}
                    className={`hover:bg-surface-elevated/40 transition-colors ${
                      selectedHotspot?.cluster_id === hs.cluster_id ? 'bg-surface-elevated/60' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-accent-cyan">
                      Cluster #{hs.cluster_id}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-text-primary">
                      {hs.dominant_type}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-text-secondary">
                      {hs.incident_count} reports
                    </td>
                    <td className="py-2.5 px-3">
                      <SeverityBadge severity={hs.avg_severity} />
                    </td>
                    <td className="py-2.5 px-3 text-text-secondary">
                      {hs.zone}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedHotspot(hs)}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Selected Cluster Summary */}
        <Card>
          <SectionHeader title="Cluster Diagnostics" subtitle="Spatial density and risk breakdown" />
          {selectedHotspot ? (
            <div className="space-y-4 mt-2">
              <div className="p-3 rounded-xl bg-surface-elevated border border-accent-cyan/20">
                <span className="text-[10px] font-mono text-accent-cyan uppercase">Active Cluster</span>
                <p className="text-base font-bold text-text-primary mt-0.5">{selectedHotspot.dominant_type}</p>
                <p className="text-xs text-text-muted">Located in {selectedHotspot.zone}</p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-border-subtle">
                  <span className="text-text-muted">Centroid (Lat/Lon)</span>
                  <span className="font-mono text-text-primary font-medium">
                    {(selectedHotspot.center_lat ?? 12.9716).toFixed(4)}, {(selectedHotspot.center_lon ?? 77.5946).toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border-subtle">
                  <span className="text-text-muted">Total Events</span>
                  <span className="font-mono text-accent-cyan font-bold">{selectedHotspot.incident_count}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border-subtle">
                  <span className="text-text-muted">Average Severity</span>
                  <SeverityBadge severity={selectedHotspot.avg_severity} />
                </div>
              </div>

              <Button
                variant="cyan"
                className="w-full"
                icon={<MapPin size={14} />}
                onClick={() => navigate('/features/geospatial')}
              >
                Open Full GIS Workspace
              </Button>
            </div>
          ) : (
            <p className="text-xs text-text-muted mt-2">Click any hotspot in the 3D scene to inspect.</p>
          )}
        </Card>
      </div>
    </div>
  )
}
