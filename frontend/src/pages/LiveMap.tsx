import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { geoAPI } from '../lib/api'
import { Card, SectionHeader, Badge, Button, LoadingState } from '../components/ui'

interface Hotspot {
  cluster_id: number
  center_lat: number
  center_lon: number
  incident_count: number
  avg_severity: number
  dominant_type: string
  zone: string
}

export default function LiveMap() {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d')

  // Fetch real geospatial clusters from backend API
  useEffect(() => {
    geoAPI.hotspots({ eps_km: 0.8, min_samples: 2 })
      .then((res) => {
        const raw = res.data?.hotspots || []
        const normalized: Hotspot[] = raw.map((h: any, i: number) => ({
          cluster_id: h.cluster_id ?? i,
          center_lat: Number(h.center_latitude ?? h.center_lat ?? 12.9716),
          center_lon: Number(h.center_longitude ?? h.center_lon ?? 77.5946),
          incident_count: Number(h.incident_count ?? (h.incident_ids ? h.incident_ids.length : 1)),
          avg_severity: Number(h.average_severity ?? h.avg_severity ?? 6.0),
          dominant_type: String(h.dominant_incident_type ?? h.dominant_type ?? 'Urban Incident'),
          zone: Array.isArray(h.zones_covered) ? h.zones_covered.join(', ') : String(h.zone ?? 'Central Zone'),
        }))
        setHotspots(normalized)
        if (normalized.length > 0) setSelectedHotspot(normalized[0])
      })
      .catch((err) => {
        console.error('Failed to load hotspots for 3D map', err)
      })
      .finally(() => setLoading(false))
  }, [])

  // Three.js 3D City Canvas Setup
  useEffect(() => {
    if (!mountRef.current) return

    const container = mountRef.current
    const width = container.clientWidth
    const height = container.clientHeight || 560

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x07111f)
    scene.fog = new THREE.FogExp2(0x07111f, 0.015)

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000)
    if (viewMode === '3d') {
      camera.position.set(0, 45, 65)
      camera.lookAt(0, 0, 0)
    } else {
      camera.position.set(0, 80, 0.1)
      camera.lookAt(0, 0, 0)
    }

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.innerHTML = ''
    container.appendChild(renderer.domElement)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x243b50, 1.8)
    scene.add(ambientLight)

    const dirLight = new THREE.DirectionalLight(0x36d6cc, 1.2)
    dirLight.position.set(20, 40, 20)
    scene.add(dirLight)

    const blueLight = new THREE.PointLight(0x5b9eff, 2, 80)
    blueLight.position.set(-20, 25, -15)
    scene.add(blueLight)

    // Ground Grid
    const gridHelper = new THREE.GridHelper(90, 45, 0x36d6cc, 0x1b3043)
    gridHelper.position.y = -0.1
    scene.add(gridHelper)

    // Procedural City Buildings (Blocks)
    const buildingGroup = new THREE.Group()
    const buildingMat = new THREE.MeshPhongMaterial({
      color: 0x102235,
      specular: 0x243b50,
      shininess: 30,
      flatShading: true,
      transparent: true,
      opacity: 0.85,
    })
    const buildingEdgeMat = new THREE.LineBasicMaterial({ color: 0x1b3043, transparent: true, opacity: 0.6 })

    // Seeded building generation around a grid
    for (let x = -35; x <= 35; x += 7) {
      for (let z = -35; z <= 35; z += 7) {
        if (Math.abs(x) < 4 && Math.abs(z) < 4) continue // Keep city center open for main beacon
        if (Math.random() > 0.3) {
          const h = 2 + Math.random() * 14
          const boxGeo = new THREE.BoxGeometry(4.5, h, 4.5)
          const building = new THREE.Mesh(boxGeo, buildingMat)
          building.position.set(x + (Math.random() - 0.5) * 1.5, h / 2, z + (Math.random() - 0.5) * 1.5)
          buildingGroup.add(building)

          const edges = new THREE.EdgesGeometry(boxGeo)
          const line = new THREE.LineSegments(edges, buildingEdgeMat)
          line.position.copy(building.position)
          buildingGroup.add(line)
        }
      }
    }
    scene.add(buildingGroup)

    // Incident Hotspot Markers in 3D
    const markerGroup = new THREE.Group()
    const LAT_MIN = 12.85, LAT_MAX = 13.05, LON_MIN = 77.48, LON_MAX = 77.70

    hotspots.forEach((hs, idx) => {
      // Map lat/lon to 3D plane (-30 to +30)
      const nx = ((hs.center_lon - LON_MIN) / (LON_MAX - LON_MIN) - 0.5) * 60
      const nz = -((hs.center_lat - LAT_MIN) / (LAT_MAX - LAT_MIN) - 0.5) * 60
      const colorHex = hs.avg_severity >= 7 ? 0xff5364 : hs.avg_severity >= 5 ? 0xff9955 : 0x36d6cc

      // Vertical Beacon Cylinder
      const beaconGeo = new THREE.CylinderGeometry(0.3, 0.3, 14, 16)
      const beaconMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.65,
      })
      const beacon = new THREE.Mesh(beaconGeo, beaconMat)
      beacon.position.set(nx, 7, nz)
      markerGroup.add(beacon)

      // Pulsing Sphere Top
      const sphereGeo = new THREE.SphereGeometry(1.2, 16, 16)
      const sphereMat = new THREE.MeshBasicMaterial({ color: colorHex })
      const sphere = new THREE.Mesh(sphereGeo, sphereMat)
      sphere.position.set(nx, 14, nz)
      markerGroup.add(sphere)

      // Ring on ground
      const ringGeo = new THREE.RingGeometry(1, 2.5, 24)
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4,
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.rotation.x = Math.PI / 2
      ring.position.set(nx, 0.1, nz)
      markerGroup.add(ring)
    })
    scene.add(markerGroup)

    // Animation Loop
    let reqId: number
    const startTime = Date.now()

    const animate = () => {
      reqId = requestAnimationFrame(animate)
      const elapsed = (Date.now() - startTime) / 1000

      if (viewMode === '3d') {
        // Slow rotation around city center
        camera.position.x = Math.sin(elapsed * 0.08) * 65
        camera.position.z = Math.cos(elapsed * 0.08) * 65
        camera.lookAt(0, 4, 0)
      }

      // Animate pulsing rings & spheres
      markerGroup.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh && child.geometry instanceof THREE.SphereGeometry) {
          child.position.y = 14 + Math.sin(elapsed * 3 + i) * 1.2
        }
      })

      renderer.render(scene, camera)
    }

    animate()

    const handleResize = () => {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight || 560
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(reqId)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      if (container) container.innerHTML = ''
    }
  }, [hotspots, viewMode])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Live 3D Urban Intelligence Map</h2>
          <p className="text-sm text-text-muted">
            Interactive Three.js WebGL digital twin displaying Bengaluru incident hotspots & spatial density
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-surface-elevated rounded-lg p-1 border border-border-standard flex gap-1">
            <button
              onClick={() => setViewMode('3d')}
              className={`px-3 py-1 text-xs font-semibold rounded ${
                viewMode === '3d' ? 'bg-accent-cyan text-bg-main shadow' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Orbit 3D
            </button>
            <button
              onClick={() => setViewMode('2d')}
              className={`px-3 py-1 text-xs font-semibold rounded ${
                viewMode === '2d' ? 'bg-accent-cyan text-bg-main shadow' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Top-Down
            </button>
          </div>
        </div>
      </div>

      {loading && <LoadingState message="Connecting to Bengaluru geospatial stream..." />}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 3D Canvas Viewport */}
        <div className="lg:col-span-3 rounded-2xl border border-accent-cyan/20 overflow-hidden relative bg-bg-main shadow-2xl min-h-[560px]">
          <div ref={mountRef} className="w-full h-full min-h-[560px]" />

          {/* HUD Overlay */}
          <div className="absolute top-4 left-4 pointer-events-none space-y-2">
            <div className="glass px-3 py-2 rounded-lg text-xs font-mono border border-accent-cyan/30 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
              <span>BENGALURU URBAN GRID · 12.9716° N, 77.5946° E</span>
            </div>
            <div className="glass px-3 py-1.5 rounded-lg text-xs text-text-muted border border-border-subtle inline-block">
              {hotspots.length} ACTIVE CLUSTERS DETECTED
            </div>
          </div>

          <div className="absolute bottom-4 right-4 glass p-3 rounded-xl border border-border-standard text-xs space-y-1.5">
            <div className="font-semibold text-text-primary mb-1">Severity Markers</div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-status-critical" />
              <span className="text-text-secondary">Critical (≥ 7.0)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-status-high" />
              <span className="text-text-secondary">High (≥ 5.0)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-accent-cyan" />
              <span className="text-text-secondary">Standard / Moderate</span>
            </div>
          </div>
        </div>

        {/* Selected Cluster Detail Panel */}
        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Cluster Explorer</h3>
            {hotspots.length === 0 ? (
              <p className="text-xs text-text-muted">No spatial clusters reported.</p>
            ) : (
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {hotspots.map((hs) => {
                  const isSel = selectedHotspot?.cluster_id === hs.cluster_id
                  return (
                    <div
                      key={hs.cluster_id}
                      onClick={() => setSelectedHotspot(hs)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSel
                          ? 'bg-surface-elevated border-accent-cyan shadow-lg'
                          : 'bg-surface-card border-border-subtle hover:border-border-standard'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs font-bold text-accent-cyan">Cluster #{hs.cluster_id}</span>
                        <Badge
                          variant={hs.avg_severity >= 7 ? 'critical' : hs.avg_severity >= 5 ? 'high' : 'cyan'}
                          size="sm"
                        >
                          Sev {hs.avg_severity.toFixed(1)}
                        </Badge>
                      </div>
                      <div className="text-sm font-medium text-text-primary truncate">{hs.dominant_type}</div>
                      <div className="text-xs text-text-muted flex justify-between mt-1">
                        <span>{hs.zone}</span>
                        <span>{hs.incident_count} incidents</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {selectedHotspot && (
            <Card className="bg-surface-elevated border-accent-cyan/30">
              <h4 className="text-xs font-bold text-accent-cyan uppercase tracking-wider mb-2">Focus Inspection</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-muted">Dominant Category:</span>
                  <span className="text-text-primary font-semibold">{selectedHotspot.dominant_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Zone Area:</span>
                  <span className="text-text-primary">{selectedHotspot.zone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Total Density:</span>
                  <span className="text-text-primary font-mono">{selectedHotspot.incident_count} incidents</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Coordinates:</span>
                  <span className="text-text-primary font-mono">
                    {selectedHotspot.center_lat.toFixed(4)}, {selectedHotspot.center_lon.toFixed(4)}
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
