import { useEffect, useRef, useState, useMemo } from 'react'
import * as THREE from 'three'
import { geoAPI, incidentsAPI, normalizeIncident, NormalizedIncident } from '../lib/api'
import { Card, SectionHeader, Badge, SeverityBadge, Button, LoadingState } from '../components/ui'
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
  X
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

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
  const navigate = useNavigate()

  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [incidents, setIncidents] = useState<NormalizedIncident[]>([])
  const [selectedIncident, setSelectedIncident] = useState<NormalizedIncident | null>(null)
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null)
  const [hoveredEntity, setHoveredEntity] = useState<{ type: string; title: string; severity?: number } | null>(null)
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  const [loading, setLoading] = useState(true)
  const [cameraPreset, setCameraPreset] = useState<'perspective' | 'topdown' | 'isometric'>('perspective')
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('All')

  // Layer Toggles
  const [layers, setLayers] = useState({
    buildings: true,
    roads: true,
    hotspots: true,
    incidents: true,
    particles: true,
    districts: true,
  })

  // Three.js instances ref
  const threeRef = useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    reqId?: number
    controls?: {
      target: THREE.Vector3
      spherical: THREE.Spherical
      isMouseDown: boolean
      previousMousePosition: { x: number; y: number }
    }
  } | null>(null)

  // 1. Fetch real geospatial data and incidents from backend
  useEffect(() => {
    Promise.all([
      geoAPI.hotspots({ eps_km: 0.8, min_samples: 2 }),
      incidentsAPI.list({ limit: 40 }),
    ])
      .then(([geoRes, incRes]) => {
        // Hotspots
        const rawHotspots = geoRes.data?.hotspots || []
        const normHotspots: Hotspot[] = rawHotspots.map((h: any, i: number) => ({
          cluster_id: h.cluster_id ?? i,
          center_lat: Number(h.center_latitude ?? h.center_lat ?? 12.9716),
          center_lon: Number(h.center_longitude ?? h.center_lon ?? 77.5946),
          incident_count: Number(h.incident_count ?? (h.incident_ids ? h.incident_ids.length : 1)),
          avg_severity: Number(h.average_severity ?? h.avg_severity ?? 6.0),
          dominant_type: String(h.dominant_incident_type ?? h.dominant_type ?? 'Urban Incident'),
          zone: Array.isArray(h.zones_covered) ? h.zones_covered.join(', ') : String(h.zone ?? 'Central Zone'),
        }))
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

  // 2. Setup Three.js Urban Scene
  useEffect(() => {
    if (!mountRef.current) return

    const container = mountRef.current
    const width = container.clientWidth
    const height = container.clientHeight || 620

    // Scene with atmospheric fog
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x080d1b)
    scene.fog = new THREE.FogExp2(0x080d1b, 0.012)

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1500)
    camera.position.set(50, 48, 65)
    camera.lookAt(0, 4, 0)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.25

    container.innerHTML = ''
    container.appendChild(renderer.domElement)

    // ─── Sophisticated Lighting Setup ──────────────────────────────────────────
    // Ambient light with midnight blue tint
    const ambientLight = new THREE.AmbientLight(0x1a294c, 2.4)
    scene.add(ambientLight)

    // Main urban directional light (moonlight/cyber aura)
    const dirLight = new THREE.DirectionalLight(0x34d9e8, 2.0)
    dirLight.position.set(40, 80, 50)
    dirLight.castShadow = true
    scene.add(dirLight)

    // Secondary fill light from opposite side (electric violet)
    const fillLight = new THREE.DirectionalLight(0x8b72ff, 1.4)
    fillLight.position.set(-50, 40, -40)
    scene.add(fillLight)

    // City center underglow point light
    const centerGlow = new THREE.PointLight(0x397bff, 3.5, 90)
    centerGlow.position.set(0, 15, 0)
    scene.add(centerGlow)

    // ─── Ground & Road Network ────────────────────────────────────────────────
    const groundGeo = new THREE.PlaneGeometry(160, 160)
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0a1226,
      roughness: 0.85,
      metalness: 0.2,
    })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.2
    ground.receiveShadow = true
    scene.add(ground)

    // Glowing Neon Road Arteries (Grid Lines)
    const roadGroup = new THREE.Group()
    const roadMat = new THREE.LineBasicMaterial({ color: 0x397bff, transparent: true, opacity: 0.55 })
    const mainAvenueMat = new THREE.LineBasicMaterial({ color: 0x34d9e8, transparent: true, opacity: 0.85 })

    // Avenue grid
    for (let i = -70; i <= 70; i += 14) {
      const isMajor = i % 28 === 0
      const mat = isMajor ? mainAvenueMat : roadMat

      // X lines
      const ptsX = [new THREE.Vector3(-70, 0.05, i), new THREE.Vector3(70, 0.05, i)]
      const geoX = new THREE.BufferGeometry().setFromPoints(ptsX)
      roadGroup.add(new THREE.Line(geoX, mat))

      // Z lines
      const ptsZ = [new THREE.Vector3(i, 0.05, -70), new THREE.Vector3(i, 0.05, 70)]
      const geoZ = new THREE.BufferGeometry().setFromPoints(ptsZ)
      roadGroup.add(new THREE.Line(geoZ, mat))
    }
    scene.add(roadGroup)

    // ─── Procedural City Architecture (Varied Blocks & Heights) ───────────────
    const cityGroup = new THREE.Group()
    const buildingMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x14203d, roughness: 0.4, metalness: 0.6 }),
      new THREE.MeshStandardMaterial({ color: 0x19284d, roughness: 0.35, metalness: 0.7 }),
      new THREE.MeshStandardMaterial({ color: 0x1e3360, roughness: 0.3, metalness: 0.75 }),
      new THREE.MeshStandardMaterial({ color: 0x0f1a33, roughness: 0.5, metalness: 0.5 }),
    ]
    const wireframeMat = new THREE.LineBasicMaterial({ color: 0x34d9e8, transparent: true, opacity: 0.35 })
    const windowMat = new THREE.MeshBasicMaterial({ color: 0x34d9e8, transparent: true, opacity: 0.75 })

    // Build city blocks
    for (let bx = -56; bx <= 56; bx += 14) {
      for (let bz = -56; bz <= 56; bz += 14) {
        if (Math.abs(bx) < 10 && Math.abs(bz) < 10) continue // Plaza/Center hub open

        // Cluster of 2-3 buildings per block
        const count = 2 + Math.floor(Math.sin(bx * 0.2 + bz * 0.3) * 1.5 + 1.5)
        for (let b = 0; b < count; b++) {
          const offsetX = (b === 0 ? -3 : b === 1 ? 3 : 0) + (Math.sin(bx + b) * 1.2)
          const offsetZ = (b === 0 ? -3 : b === 1 ? 3 : 1) + (Math.cos(bz + b) * 1.2)

          // Distance from center determines skyscraper height
          const distFromCenter = Math.sqrt(bx * bx + bz * bz)
          const baseHeight = Math.max(6, 28 - distFromCenter * 0.28)
          const h = baseHeight + ((bx * 13 + bz * 7) % 11)

          const widthB = 4 + (Math.abs(bx + b) % 3)
          const depthB = 4 + (Math.abs(bz + b) % 3)

          const bGeo = new THREE.BoxGeometry(widthB, h, depthB)
          const matIndex = Math.abs(bx + bz + b) % buildingMaterials.length
          const bMesh = new THREE.Mesh(bGeo, buildingMaterials[matIndex])
          bMesh.position.set(bx + offsetX, h / 2, bz + offsetZ)
          bMesh.castShadow = true
          bMesh.receiveShadow = true
          cityGroup.add(bMesh)

          // Glowing architectural edge wireframes
          const edges = new THREE.EdgesGeometry(bGeo)
          const line = new THREE.LineSegments(edges, wireframeMat)
          line.position.copy(bMesh.position)
          cityGroup.add(line)

          // Illuminated window accents on selected tall towers
          if (h > 16) {
            const windowGeo = new THREE.PlaneGeometry(widthB * 0.8, 1.2)
            const winMesh = new THREE.Mesh(windowGeo, windowMat)
            winMesh.position.set(bx + offsetX, h * 0.75, bz + offsetZ + depthB / 2 + 0.05)
            cityGroup.add(winMesh)
          }
        }
      }
    }
    scene.add(cityGroup)

    // ─── Atmospheric Floating Data Particles ──────────────────────────────────
    const particleCount = 180
    const particleGeo = new THREE.BufferGeometry()
    const particlePositions = new Float32Array(particleCount * 3)

    for (let p = 0; p < particleCount * 3; p += 3) {
      particlePositions[p] = (Math.random() - 0.5) * 120
      particlePositions[p + 1] = Math.random() * 45 + 2
      particlePositions[p + 2] = (Math.random() - 0.5) * 120
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    const particleMat = new THREE.PointsMaterial({
      color: 0x34d9e8,
      size: 1.2,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    })
    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)

    // ─── Dynamic Incident & Hotspot Markers ───────────────────────────────────
    const interactiveMarkersGroup = new THREE.Group()
    const interactiveObjects: THREE.Object3D[] = []

    const LAT_MIN = 12.85, LAT_MAX = 13.08, LON_MIN = 77.46, LON_MAX = 77.72

    // Plot DBSCAN Hotspots
    hotspots.forEach((hs) => {
      const nx = ((hs.center_lon - LON_MIN) / (LON_MAX - LON_MIN) - 0.5) * 110
      const nz = -((hs.center_lat - LAT_MIN) / (LAT_MAX - LAT_MIN) - 0.5) * 110

      const colorHex = hs.avg_severity >= 7.5 ? 0xff5577 : hs.avg_severity >= 5.5 ? 0xff9b55 : 0x34d9e8

      // Pulsing Column
      const colGeo = new THREE.CylinderGeometry(0.8, 0.8, 26, 16)
      const colMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.65 })
      const column = new THREE.Mesh(colGeo, colMat)
      column.position.set(nx, 13, nz)
      interactiveMarkersGroup.add(column)

      // Beacon Orb
      const orbGeo = new THREE.SphereGeometry(2.4, 24, 24)
      const orbMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.8,
        roughness: 0.2,
      })
      const orb = new THREE.Mesh(orbGeo, orbMat)
      orb.position.set(nx, 26, nz)
      orb.userData = { type: 'hotspot', data: hs }
      interactiveMarkersGroup.add(orb)
      interactiveObjects.push(orb)

      // Ground Ripple Ring
      const ringGeo = new THREE.RingGeometry(2, 6, 32)
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45,
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.rotation.x = Math.PI / 2
      ring.position.set(nx, 0.15, nz)
      interactiveMarkersGroup.add(ring)
    })

    // Plot Individual Incidents
    filteredIncidents.forEach((inc) => {
      const nx = ((inc.longitude - LON_MIN) / (LON_MAX - LON_MIN) - 0.5) * 110
      const nz = -((inc.latitude - LAT_MIN) / (LAT_MAX - LAT_MIN) - 0.5) * 110

      const sev = inc.severity ?? 5.0
      const colorHex = sev >= 8.0 ? 0xff5577 : sev >= 6.0 ? 0xff9b55 : sev >= 4.0 ? 0xf4c76a : 0x45d6a1

      const pinGeo = new THREE.ConeGeometry(1.2, 3.5, 12)
      const pinMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.6,
      })
      const pin = new THREE.Mesh(pinGeo, pinMat)
      pin.rotation.x = Math.PI // Point down
      pin.position.set(nx, 3.5, nz)
      pin.userData = { type: 'incident', data: inc }
      interactiveMarkersGroup.add(pin)
      interactiveObjects.push(pin)
    })

    scene.add(interactiveMarkersGroup)

    // ─── Interactive Mouse Controls (Pan / Orbit / Raycast) ──────────────────
    const controls = {
      target: new THREE.Vector3(0, 4, 0),
      spherical: new THREE.Spherical(80, Math.PI / 3.2, Math.PI / 4),
      isMouseDown: false,
      previousMousePosition: { x: 0, y: 0 },
    }

    const updateCameraFromSpherical = () => {
      camera.position.setFromSpherical(controls.spherical).add(controls.target)
      camera.lookAt(controls.target)
    }
    updateCameraFromSpherical()

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        controls.isMouseDown = true
        controls.previousMousePosition = { x: e.clientX, y: e.clientY }
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })

      if (controls.isMouseDown) {
        const deltaX = e.clientX - controls.previousMousePosition.x
        const deltaY = e.clientY - controls.previousMousePosition.y

        controls.spherical.theta -= deltaX * 0.007
        controls.spherical.phi = Math.max(0.2, Math.min(Math.PI / 2.1, controls.spherical.phi - deltaY * 0.007))

        updateCameraFromSpherical()
        controls.previousMousePosition = { x: e.clientX, y: e.clientY }
      } else {
        // Raycasting for hover tooltip
        const mouseNormX = ((e.clientX - rect.left) / width) * 2 - 1
        const mouseNormY = -((e.clientY - rect.top) / height) * 2 + 1

        const raycaster = new THREE.Raycaster()
        raycaster.setFromCamera(new THREE.Vector2(mouseNormX, mouseNormY), camera)
        const intersects = raycaster.intersectObjects(interactiveObjects)

        if (intersects.length > 0) {
          const hit = intersects[0].object.userData
          if (hit.type === 'incident') {
            setHoveredEntity({
              type: 'Incident',
              title: hit.data.title,
              severity: hit.data.severity,
            })
          } else if (hit.type === 'hotspot') {
            setHoveredEntity({
              type: 'Hotspot Cluster',
              title: `${hit.data.dominant_type} (${hit.data.incident_count} events)`,
              severity: hit.data.avg_severity,
            })
          }
          container.style.cursor = 'pointer'
        } else {
          setHoveredEntity(null)
          container.style.cursor = 'grab'
        }
      }
    }

    const onMouseUp = () => {
      controls.isMouseDown = false
      container.style.cursor = 'grab'
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      controls.spherical.radius = Math.max(25, Math.min(160, controls.spherical.radius + e.deltaY * 0.08))
      updateCameraFromSpherical()
    }

    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const mouseNormX = ((e.clientX - rect.left) / width) * 2 - 1
      const mouseNormY = -((e.clientY - rect.top) / height) * 2 + 1

      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(new THREE.Vector2(mouseNormX, mouseNormY), camera)
      const intersects = raycaster.intersectObjects(interactiveObjects)

      if (intersects.length > 0) {
        const hit = intersects[0].object.userData
        if (hit.type === 'incident') {
          setSelectedIncident(hit.data)
        } else if (hit.type === 'hotspot') {
          setSelectedHotspot(hit.data)
        }
      }
    }

    container.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    container.addEventListener('wheel', onWheel, { passive: false })
    container.addEventListener('click', onClick)

    // ─── Animation Loop ────────────────────────────────────────────────────────
    let reqId: number
    const clock = new THREE.Clock()

    const animate = () => {
      reqId = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()

      // Subtle atmospheric pulsing of orbs and beacons
      interactiveMarkersGroup.children.forEach((c, idx) => {
        if (c instanceof THREE.Mesh && c.geometry instanceof THREE.SphereGeometry) {
          c.position.y = 26 + Math.sin(t * 3 + idx) * 1.5
        }
      })

      // Drift data particles upwards
      const positions = particleGeo.attributes.position.array as Float32Array
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += 0.06
        if (positions[i] > 48) positions[i] = 2
      }
      particleGeo.attributes.position.needsUpdate = true

      renderer.render(scene, camera)
    }
    animate()

    // Store references
    threeRef.current = {
      scene,
      camera,
      renderer,
      reqId,
      controls,
    }

    const handleResize = () => {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight || 620
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(reqId)
      window.removeEventListener('resize', handleResize)
      container.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      container.removeEventListener('wheel', onWheel)
      container.removeEventListener('click', onClick)
      renderer.dispose()
    }
  }, [hotspots, filteredIncidents])

  // Camera Preset Switcher
  const applyCameraPreset = (preset: 'perspective' | 'topdown' | 'isometric') => {
    setCameraPreset(preset)
    if (!threeRef.current) return
    const { controls, camera } = threeRef.current
    if (!controls) return

    if (preset === 'perspective') {
      controls.spherical.set(80, Math.PI / 3.2, Math.PI / 4)
    } else if (preset === 'topdown') {
      controls.spherical.set(95, 0.01, 0)
    } else if (preset === 'isometric') {
      controls.spherical.set(90, Math.PI / 4, Math.PI / 4)
    }
    camera.position.setFromSpherical(controls.spherical).add(controls.target)
    camera.lookAt(controls.target)
  }

  return (
    <div className="space-y-6 animate-fade-in select-none">
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-bg-card border border-border-standard">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30">
            <Box size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              Urban Pulse 3D Digital Twin
              <Badge variant="cyan" dot>WebGL 2.0</Badge>
            </h2>
            <p className="text-xs text-text-muted">
              Live spatial projection of Bengaluru urban infrastructure and detected clusters
            </p>
          </div>
        </div>

        {/* Camera and Filter Presets */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Zone Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-elevated border border-border-standard text-xs">
            <Crosshair size={14} className="text-accent-cyan" />
            <select
              value={selectedZoneFilter}
              onChange={(e) => setSelectedZoneFilter(e.target.value)}
              className="bg-transparent text-text-primary focus:outline-none cursor-pointer font-medium"
            >
              <option value="All">All City Zones</option>
              <option value="Central">Central Zone</option>
              <option value="South">South Zone</option>
              <option value="North">North Zone</option>
              <option value="East">East Zone</option>
              <option value="West">West Zone</option>
            </select>
          </div>

          {/* Camera Buttons */}
          <div className="flex items-center p-1 rounded-xl bg-surface-elevated border border-border-standard">
            <button
              onClick={() => applyCameraPreset('perspective')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                cameraPreset === 'perspective' ? 'bg-accent-blue text-white shadow-glow-blue' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              3D Orbit
            </button>
            <button
              onClick={() => applyCameraPreset('isometric')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                cameraPreset === 'isometric' ? 'bg-accent-blue text-white shadow-glow-blue' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Isometric
            </button>
            <button
              onClick={() => applyCameraPreset('topdown')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                cameraPreset === 'topdown' ? 'bg-accent-blue text-white shadow-glow-blue' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Top-Down
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={<RotateCcw size={14} />}
            onClick={() => applyCameraPreset('perspective')}
          >
            Reset View
          </Button>
        </div>
      </div>

      {/* Main 3D Canvas Viewport */}
      <div className="relative rounded-3xl overflow-hidden border border-border-standard bg-bg-midnight shadow-card-elevated">
        {loading && (
          <div className="absolute inset-0 z-30 bg-bg-midnight/90 backdrop-blur-md flex items-center justify-center">
            <LoadingState message="Generating 3D city digital twin..." />
          </div>
        )}

        {/* 3D WebGL Canvas */}
        <div ref={mountRef} className="w-full h-[620px] cursor-grab active:cursor-grabbing" />

        {/* Floating Controls Overlay (Top Right) */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          {/* Layer toggles panel */}
          <div className="p-3 rounded-2xl bg-bg-card/85 backdrop-blur-md border border-border-standard space-y-2 text-xs shadow-card-elevated">
            <p className="font-semibold text-text-primary flex items-center gap-1.5 pb-1 border-b border-border-subtle font-mono text-[10px] uppercase tracking-wider">
              <Layers size={13} className="text-accent-cyan" />
              Active Layers
            </p>
            <label className="flex items-center gap-2 cursor-pointer text-text-secondary hover:text-text-primary">
              <input
                type="checkbox"
                checked={layers.buildings}
                onChange={(e) => setLayers((p) => ({ ...p, buildings: e.target.checked }))}
                className="rounded border-border-standard text-accent-cyan focus:ring-0"
              />
              City Blocks & Towers
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-text-secondary hover:text-text-primary">
              <input
                type="checkbox"
                checked={layers.roads}
                onChange={(e) => setLayers((p) => ({ ...p, roads: e.target.checked }))}
                className="rounded border-border-standard text-accent-cyan focus:ring-0"
              />
              Neon Road Network
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-text-secondary hover:text-text-primary">
              <input
                type="checkbox"
                checked={layers.hotspots}
                onChange={(e) => setLayers((p) => ({ ...p, hotspots: e.target.checked }))}
                className="rounded border-border-standard text-accent-cyan focus:ring-0"
              />
              DBSCAN Hotspots ({hotspots.length})
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-text-secondary hover:text-text-primary">
              <input
                type="checkbox"
                checked={layers.incidents}
                onChange={(e) => setLayers((p) => ({ ...p, incidents: e.target.checked }))}
                className="rounded border-border-standard text-accent-cyan focus:ring-0"
              />
              Active Incidents ({filteredIncidents.length})
            </label>
          </div>

          {/* Severity Legend */}
          <div className="p-3 rounded-2xl bg-bg-card/85 backdrop-blur-md border border-border-standard space-y-1.5 text-xs shadow-card-elevated">
            <p className="font-semibold text-text-primary font-mono text-[10px] uppercase tracking-wider pb-1 border-b border-border-subtle">
              Severity Key
            </p>
            <div className="flex items-center gap-2 text-text-secondary">
              <span className="w-2.5 h-2.5 rounded-full bg-severity-critical" />
              Critical (≥ 8.0)
            </div>
            <div className="flex items-center gap-2 text-text-secondary">
              <span className="w-2.5 h-2.5 rounded-full bg-severity-high" />
              High (6.0 - 7.9)
            </div>
            <div className="flex items-center gap-2 text-text-secondary">
              <span className="w-2.5 h-2.5 rounded-full bg-severity-medium" />
              Medium (4.0 - 5.9)
            </div>
            <div className="flex items-center gap-2 text-text-secondary">
              <span className="w-2.5 h-2.5 rounded-full bg-severity-low" />
              Low (&lt; 4.0)
            </div>
          </div>
        </div>

        {/* Hover Tooltip */}
        {hoveredEntity && (
          <div
            className="pointer-events-none absolute z-20 px-3 py-2 rounded-xl bg-bg-midnight/90 backdrop-blur-md border border-accent-cyan/40 text-xs shadow-glow-cyan"
            style={{
              left: `${mousePos.x + 16}px`,
              top: `${mousePos.y + 16}px`,
              transform: 'translate(0, 0)',
            }}
          >
            <p className="font-mono text-[10px] text-accent-cyan uppercase tracking-wider">{hoveredEntity.type}</p>
            <p className="font-bold text-text-primary max-w-xs">{hoveredEntity.title}</p>
            {hoveredEntity.severity !== undefined && (
              <p className="text-text-muted mt-0.5">Severity Score: {hoveredEntity.severity.toFixed(1)}</p>
            )}
          </div>
        )}

        {/* Selected Entity Inspector Drawer (Bottom Left Floating) */}
        {selectedIncident && (
          <div className="absolute bottom-4 left-4 z-10 w-96 rounded-2xl bg-bg-card/95 backdrop-blur-xl border border-accent-cyan/30 p-4 shadow-card-elevated">
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="font-mono text-[10px] text-accent-cyan uppercase tracking-wider">
                  Selected Incident • {selectedIncident.id}
                </span>
                <h3 className="text-sm font-bold text-text-primary leading-tight mt-0.5">
                  {selectedIncident.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="text-text-muted hover:text-text-primary p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 my-3 text-xs">
              <div className="p-2 rounded-xl bg-surface-elevated border border-border-subtle">
                <span className="text-text-muted block text-[10px] uppercase font-mono">Severity</span>
                <div className="mt-1">
                  <SeverityBadge severity={selectedIncident.severity} />
                </div>
              </div>
              <div className="p-2 rounded-xl bg-surface-elevated border border-border-subtle">
                <span className="text-text-muted block text-[10px] uppercase font-mono">Zone</span>
                <span className="text-text-primary font-semibold truncate block mt-1">{selectedIncident.zone}</span>
              </div>
              <div className="p-2 rounded-xl bg-surface-elevated border border-border-subtle">
                <span className="text-text-muted block text-[10px] uppercase font-mono">Type</span>
                <span className="text-text-secondary truncate block mt-1">{selectedIncident.incident_type}</span>
              </div>
              <div className="p-2 rounded-xl bg-surface-elevated border border-border-subtle">
                <span className="text-text-muted block text-[10px] uppercase font-mono">Status</span>
                <Badge variant={selectedIncident.status === 'resolved' ? 'low' : 'high'} dot className="mt-1">
                  {selectedIncident.status}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-border-subtle">
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                icon={<ExternalLink size={13} />}
                onClick={() => navigate(`/features/relationship-graph?incident_id=${selectedIncident.id}`)}
              >
                View Ego Graph
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                icon={<Activity size={13} />}
                onClick={() => navigate(`/features/cascading-impact?incident_id=${selectedIncident.id}`)}
              >
                Cascade Analysis
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 2D Fallback / Hotspot Cluster Intelligence Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <SectionHeader
            title="DBSCAN Geospatial Cluster Intelligence"
            subtitle="Autonomous density-based spatial clustering across urban grid"
            badge="Engine Active"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border-subtle text-text-muted font-mono uppercase">
                  <th className="py-2.5 px-3">Cluster ID</th>
                  <th className="py-2.5 px-3">Dominant Incident</th>
                  <th className="py-2.5 px-3">Incident Count</th>
                  <th className="py-2.5 px-3">Avg Severity</th>
                  <th className="py-2.5 px-3">Zone Covered</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {hotspots.map((hs) => (
                  <tr key={hs.cluster_id} className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-accent-cyan">#C-{hs.cluster_id}</td>
                    <td className="py-3 px-3 font-medium text-text-primary">{hs.dominant_type}</td>
                    <td className="py-3 px-3 font-mono text-text-secondary">{hs.incident_count} reports</td>
                    <td className="py-3 px-3">
                      <SeverityBadge severity={hs.avg_severity} />
                    </td>
                    <td className="py-3 px-3 text-text-secondary">{hs.zone}</td>
                    <td className="py-3 px-3 text-right">
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
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-surface-elevated border border-accent-cyan/20">
                <span className="text-[10px] font-mono text-accent-cyan uppercase">Active Cluster</span>
                <p className="text-base font-bold text-text-primary mt-0.5">{selectedHotspot.dominant_type}</p>
                <p className="text-xs text-text-muted">Located in {selectedHotspot.zone}</p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-border-subtle">
                  <span className="text-text-muted">Latitude / Longitude</span>
                  <span className="font-mono text-text-primary font-medium">
                    {selectedHotspot.center_lat.toFixed(4)}, {selectedHotspot.center_lon.toFixed(4)}
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
            <p className="text-xs text-text-muted">Click any hotspot in the 3D scene to inspect.</p>
          )}
        </Card>
      </div>
    </div>
  )
}
