import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { NormalizedIncident, NormalizedHotspot } from '../../lib/api'
import { Badge, SeverityBadge, Button } from '../ui'
import { Eye, RotateCcw, Maximize2, Layers, MapPin, Activity, ShieldAlert } from 'lucide-react'

export type HotspotData = NormalizedHotspot

interface CityScene3DProps {
  mode?: 'embedded' | 'full'
  incidents: NormalizedIncident[]
  hotspots?: NormalizedHotspot[]
  selectedIncident?: NormalizedIncident | null
  onIncidentSelect?: (incident: NormalizedIncident | null) => void
  onHotspotSelect?: (hotspot: NormalizedHotspot | null) => void
  selectedZoneFilter?: string
  height?: string | number
  className?: string
  showLayers?: {
    buildings?: boolean
    roads?: boolean
    hotspots?: boolean
    incidents?: boolean
    traffic?: boolean
    districts?: boolean
  }
}

export default function CityScene3D({
  mode = 'full',
  incidents,
  hotspots = [],
  selectedIncident,
  onIncidentSelect,
  onHotspotSelect,
  selectedZoneFilter = 'All',
  height,
  className = '',
  showLayers = {
    buildings: true,
    roads: true,
    hotspots: true,
    incidents: true,
    traffic: true,
    districts: true,
  },
}: CityScene3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const [cameraPreset, setCameraPreset] = useState<'perspective' | 'topdown' | 'isometric'>('perspective')
  const [hoveredEntity, setHoveredEntity] = useState<{ title: string; type: string; severity?: number; zone?: string } | null>(null)
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  // Active layer state
  const [activeLayers, setActiveLayers] = useState(showLayers)

  const toggleLayer = (layerKey: keyof typeof activeLayers) => {
    setActiveLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }))
  }

  // Three.js instances ref
  const threeRef = useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    reqId: number
    pinsGroup: THREE.Group
    beaconsGroup: THREE.Group
    roadsGroup: THREE.Group
    buildingsGroup: THREE.Group
    trafficGroup: THREE.Group
    trafficParticles: Float32Array
    trafficGeo: THREE.BufferGeometry
    districtsGroup: THREE.Group
    raycaster: THREE.Raycaster
    mouse: THREE.Vector2
    isDragging: boolean
    prevMousePos: { x: number; y: number }
  } | null>(null)

  // Filtered incidents based on zone
  const displayIncidents = incidents.filter((inc) => {
    if (selectedZoneFilter === 'All') return true
    return inc.zone.toLowerCase().includes(selectedZoneFilter.toLowerCase())
  })

  // Camera presets
  const applyCameraPreset = (preset: 'perspective' | 'topdown' | 'isometric') => {
    setCameraPreset(preset)
    if (!threeRef.current) return
    const { camera } = threeRef.current

    if (preset === 'perspective') {
      camera.position.set(50, 48, 65)
      camera.lookAt(0, 4, 0)
    } else if (preset === 'topdown') {
      camera.position.set(0, 115, 1)
      camera.lookAt(0, 0, 0)
    } else if (preset === 'isometric') {
      camera.position.set(70, 70, 70)
      camera.lookAt(0, 0, 0)
    }
  }

  const resetCamera = () => {
    applyCameraPreset('perspective')
  }

  // Setup Three.js Urban Environment
  useEffect(() => {
    if (!mountRef.current) return

    const container = mountRef.current
    const width = container.clientWidth
    const defaultH = mode === 'embedded' ? 420 : 660
    const containerH = height ? (typeof height === 'number' ? height : parseInt(String(height))) : defaultH

    // 1. Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x080d1b)
    scene.fog = new THREE.FogExp2(0x080d1b, mode === 'embedded' ? 0.014 : 0.010)

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / containerH, 1, 1500)
    if (mode === 'embedded') {
      camera.position.set(45, 42, 58)
    } else {
      camera.position.set(50, 48, 65)
    }
    camera.lookAt(0, 4, 0)

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, containerH)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.3

    container.innerHTML = ''
    container.appendChild(renderer.domElement)

    // 4. Volumetric Lighting
    const ambientLight = new THREE.AmbientLight(0x101a32, 2.0)
    scene.add(ambientLight)

    // Key directional light (cyan cyber aurora)
    const dirLight = new THREE.DirectionalLight(0x34d9e8, 2.2)
    dirLight.position.set(45, 85, 55)
    dirLight.castShadow = true
    scene.add(dirLight)

    // Violet rim fill from opposing azimuth
    const rimLight = new THREE.DirectionalLight(0x8b72ff, 1.6)
    rimLight.position.set(-55, 45, -45)
    scene.add(rimLight)

    // Core urban underglow point light
    const centerGlow = new THREE.PointLight(0x397bff, 3.2, 95)
    centerGlow.position.set(0, 16, 0)
    scene.add(centerGlow)

    // 5. Ground Plane
    const groundGeo = new THREE.PlaneGeometry(160, 160)
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x080e1f,
      roughness: 0.85,
      metalness: 0.3,
    })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.2
    ground.receiveShadow = true
    scene.add(ground)

    // 6. Glowing Neon Road Network
    const roadsGroup = new THREE.Group()
    const arterialMat = new THREE.LineBasicMaterial({ color: 0x34d9e8, transparent: true, opacity: 0.85 })
    const secondaryMat = new THREE.LineBasicMaterial({ color: 0x224a9e, transparent: true, opacity: 0.55 })

    for (let i = -70; i <= 70; i += 14) {
      const isMajor = i % 28 === 0
      const mat = isMajor ? arterialMat : secondaryMat

      // X Arterials
      const ptsX = [new THREE.Vector3(-70, 0.05, i), new THREE.Vector3(70, 0.05, i)]
      const geoX = new THREE.BufferGeometry().setFromPoints(ptsX)
      roadsGroup.add(new THREE.Line(geoX, mat))

      // Z Arterials
      const ptsZ = [new THREE.Vector3(i, 0.05, -70), new THREE.Vector3(i, 0.05, 70)]
      const geoZ = new THREE.BufferGeometry().setFromPoints(ptsZ)
      roadsGroup.add(new THREE.Line(geoZ, mat))
    }
    scene.add(roadsGroup)

    // 7. Dynamic Moving Traffic Pulse Data Particles
    const trafficGroup = new THREE.Group()
    const trafficCount = 120
    const trafficPositions = new Float32Array(trafficCount * 3)
    const trafficSpeeds = new Float32Array(trafficCount)
    const trafficAxes = new Uint8Array(trafficCount) // 0 = X, 1 = Z

    for (let t = 0; t < trafficCount; t++) {
      const isX = Math.random() > 0.5
      trafficAxes[t] = isX ? 0 : 1
      const lane = (Math.floor(Math.random() * 11) - 5) * 14
      trafficSpeeds[t] = (Math.random() * 0.4 + 0.2) * (Math.random() > 0.5 ? 1 : -1)

      if (isX) {
        trafficPositions[t * 3] = (Math.random() - 0.5) * 140
        trafficPositions[t * 3 + 1] = 0.25
        trafficPositions[t * 3 + 2] = lane
      } else {
        trafficPositions[t * 3] = lane
        trafficPositions[t * 3 + 1] = 0.25
        trafficPositions[t * 3 + 2] = (Math.random() - 0.5) * 140
      }
    }

    const trafficGeo = new THREE.BufferGeometry()
    trafficGeo.setAttribute('position', new THREE.BufferAttribute(trafficPositions, 3))
    const trafficMat = new THREE.PointsMaterial({
      color: 0x35e5c5,
      size: mode === 'embedded' ? 1.6 : 2.0,
      transparent: true,
      opacity: 0.9,
    })
    const trafficPoints = new THREE.Points(trafficGeo, trafficMat)
    trafficGroup.add(trafficPoints)
    scene.add(trafficGroup)

    // 8. Procedural Urban Architecture (Diverse Typologies)
    const buildingsGroup = new THREE.Group()
    const bldgMats = [
      new THREE.MeshStandardMaterial({ color: 0x111c38, roughness: 0.35, metalness: 0.65 }),
      new THREE.MeshStandardMaterial({ color: 0x162447, roughness: 0.3, metalness: 0.7 }),
      new THREE.MeshStandardMaterial({ color: 0x1b2d56, roughness: 0.25, metalness: 0.75 }),
      new THREE.MeshStandardMaterial({ color: 0x0c1429, roughness: 0.45, metalness: 0.5 }),
    ]
    const wireMat = new THREE.LineBasicMaterial({ color: 0x34d9e8, transparent: true, opacity: 0.32 })
    const windowMat = new THREE.MeshBasicMaterial({ color: 0x34d9e8, transparent: true, opacity: 0.85 })
    const spireMat = new THREE.MeshBasicMaterial({ color: 0x35e5c5 })

    // Generate diverse city blocks
    for (let bx = -56; bx <= 56; bx += 14) {
      for (let bz = -56; bz <= 56; bz += 14) {
        if (Math.abs(bx) < 10 && Math.abs(bz) < 10) continue // Open Civic Hub Center

        const distFromCenter = Math.sqrt(bx * bx + bz * bz)
        const blockType = (Math.abs(bx * 7 + bz * 13)) % 3 // 0 = Skyscraper, 1 = Terraced Commercial, 2 = Residential

        if (blockType === 0) {
          // Central Skyscraper Tower with Roof Spire
          const h = Math.max(14, 38 - distFromCenter * 0.32 + ((bx * 3) % 8))
          const w = 5
          const d = 5
          const bGeo = new THREE.BoxGeometry(w, h, d)
          const bMesh = new THREE.Mesh(bGeo, bldgMats[0])
          bMesh.position.set(bx, h / 2, bz)
          bMesh.castShadow = true
          bMesh.receiveShadow = true
          buildingsGroup.add(bMesh)

          // Glowing wireframe edges
          const edges = new THREE.EdgesGeometry(bGeo)
          const wire = new THREE.LineSegments(edges, wireMat)
          wire.position.copy(bMesh.position)
          buildingsGroup.add(wire)

          // Rooftop Spire Antenna
          const spireGeo = new THREE.CylinderGeometry(0.1, 0.4, 6, 8)
          const spireMesh = new THREE.Mesh(spireGeo, spireMat)
          spireMesh.position.set(bx, h + 3, bz)
          buildingsGroup.add(spireMesh)

          // Upper level illuminated window ribbon
          const winGeo = new THREE.PlaneGeometry(w * 0.85, 1.4)
          const winMesh = new THREE.Mesh(winGeo, windowMat)
          winMesh.position.set(bx, h * 0.8, bz + d / 2 + 0.04)
          buildingsGroup.add(winMesh)
        } else if (blockType === 1) {
          // Terraced Commercial Complex (Base + Stepped Tower)
          const baseH = 8
          const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(8, baseH, 8), bldgMats[1])
          baseMesh.position.set(bx, baseH / 2, bz)
          baseMesh.castShadow = true
          buildingsGroup.add(baseMesh)

          const towerH = 14
          const towerMesh = new THREE.Mesh(new THREE.BoxGeometry(5, towerH, 5), bldgMats[2])
          towerMesh.position.set(bx, baseH + towerH / 2, bz)
          towerMesh.castShadow = true
          buildingsGroup.add(towerMesh)

          const wire1 = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(8, baseH, 8)), wireMat)
          wire1.position.copy(baseMesh.position)
          buildingsGroup.add(wire1)

          const wire2 = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(5, towerH, 5)), wireMat)
          wire2.position.copy(towerMesh.position)
          buildingsGroup.add(wire2)
        } else {
          // Clustered Residential / Mixed Low-Rise Blocks
          for (let sub = 0; sub < 2; sub++) {
            const sx = bx + (sub === 0 ? -3 : 3)
            const sz = bz + (sub === 0 ? -3 : 3)
            const rh = 7 + (Math.abs(bx + sub * 5) % 8)
            const rMesh = new THREE.Mesh(new THREE.BoxGeometry(4, rh, 4), bldgMats[3])
            rMesh.position.set(sx, rh / 2, sz)
            rMesh.castShadow = true
            buildingsGroup.add(rMesh)

            const rWire = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(4, rh, 4)), wireMat)
            rWire.position.copy(rMesh.position)
            buildingsGroup.add(rWire)
          }
        }
      }
    }
    scene.add(buildingsGroup)

    // 9. District Demarcation Ribbons
    const districtsGroup = new THREE.Group()
    const districtMat = new THREE.LineDashedMaterial({
      color: 0x8b72ff,
      dashSize: 3,
      gapSize: 2,
      transparent: true,
      opacity: 0.45,
    })
    const dRings = [30, 55]
    dRings.forEach((r) => {
      const ringPts: THREE.Vector3[] = []
      for (let a = 0; a <= Math.PI * 2; a += 0.1) {
        ringPts.push(new THREE.Vector3(Math.cos(a) * r, 0.1, Math.sin(a) * r))
      }
      const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPts)
      const ringLine = new THREE.Line(ringGeo, districtMat)
      ringLine.computeLineDistances()
      districtsGroup.add(ringLine)
    })
    scene.add(districtsGroup)

    // 10. Groups for Pins & Beacons
    const pinsGroup = new THREE.Group()
    scene.add(pinsGroup)

    const beaconsGroup = new THREE.Group()
    scene.add(beaconsGroup)

    // 11. Raycaster & Mouse Dragging Setup
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    let isDragging = false
    let prevMousePos = { x: 0, y: 0 }

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true
      prevMousePos = { x: e.clientX, y: e.clientY }
    }

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      setMousePos({ x: e.clientX, y: e.clientY })

      if (isDragging) {
        const dx = e.clientX - prevMousePos.x
        const dy = e.clientY - prevMousePos.y

        // Orbit around center
        const radius = Math.sqrt(camera.position.x ** 2 + camera.position.z ** 2)
        let angle = Math.atan2(camera.position.z, camera.position.x)
        angle -= dx * 0.007

        camera.position.x = radius * Math.cos(angle)
        camera.position.z = radius * Math.sin(angle)
        camera.position.y = Math.max(12, Math.min(140, camera.position.y - dy * 0.2))
        camera.lookAt(0, 4, 0)

        prevMousePos = { x: e.clientX, y: e.clientY }
      }
    }

    const onMouseUp = () => {
      isDragging = false
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const zoomFactor = e.deltaY * 0.05
      const dir = new THREE.Vector3().subVectors(camera.position, new THREE.Vector3(0, 4, 0)).normalize()
      const currentDist = camera.position.distanceTo(new THREE.Vector3(0, 4, 0))
      const newDist = Math.max(25, Math.min(160, currentDist + zoomFactor))
      camera.position.copy(new THREE.Vector3(0, 4, 0).add(dir.multiplyScalar(newDist)))
      camera.lookAt(0, 4, 0)
    }

    // Click selection Raycast
    const onClick = (e: MouseEvent) => {
      if (!isDragging) {
        const rect = container.getBoundingClientRect()
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

        raycaster.setFromCamera(mouse, camera)
        const pinIntersects = raycaster.intersectObjects(pinsGroup.children, true)
        if (pinIntersects.length > 0) {
          const hit = pinIntersects[0].object as any
          if (hit.userData?.incident && onIncidentSelect) {
            onIncidentSelect(hit.userData.incident)
            return
          }
        }

        const beaconIntersects = raycaster.intersectObjects(beaconsGroup.children, true)
        if (beaconIntersects.length > 0) {
          const hit = beaconIntersects[0].object as any
          if (hit.userData?.hotspot && onHotspotSelect) {
            onHotspotSelect(hit.userData.hotspot)
            return
          }
        }
      }
    }

    container.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    container.addEventListener('wheel', onWheel, { passive: false })
    container.addEventListener('click', onClick)

    // 12. Animation Loop
    let clock = new THREE.Clock()

    const animate = () => {
      const delta = clock.getDelta()
      const elapsedTime = clock.getElapsedTime()

      // Subtle slow auto-orbit if not dragging and in perspective mode
      if (!isDragging && cameraPreset === 'perspective') {
        const orbitRadius = Math.sqrt(camera.position.x ** 2 + camera.position.z ** 2)
        const curAngle = Math.atan2(camera.position.z, camera.position.x)
        const newAngle = curAngle + delta * 0.05
        camera.position.x = orbitRadius * Math.cos(newAngle)
        camera.position.z = orbitRadius * Math.sin(newAngle)
        camera.lookAt(0, 4, 0)
      }

      // Animate traffic pulse particles
      const posAttr = trafficGeo.attributes.position as THREE.BufferAttribute
      const positions = posAttr.array as Float32Array
      for (let t = 0; t < trafficCount; t++) {
        const idx = t * 3
        const isX = trafficAxes[t] === 0
        const speed = trafficSpeeds[t]

        if (isX) {
          positions[idx] += speed
          if (positions[idx] > 70) positions[idx] = -70
          if (positions[idx] < -70) positions[idx] = 70
        } else {
          positions[idx + 2] += speed
          if (positions[idx + 2] > 70) positions[idx + 2] = -70
          if (positions[idx + 2] < -70) positions[idx + 2] = 70
        }
      }
      posAttr.needsUpdate = true

      // Animate hotspot beacon pulses
      beaconsGroup.children.forEach((beaconMesh: any) => {
        if (beaconMesh.material && beaconMesh.userData?.pulseSpeed) {
          const scale = 1 + Math.sin(elapsedTime * beaconMesh.userData.pulseSpeed) * 0.35
          beaconMesh.scale.set(scale, 1, scale)
        }
      })

      // Hover Raycasting detection
      raycaster.setFromCamera(mouse, camera)
      const pinHits = raycaster.intersectObjects(pinsGroup.children, true)
      if (pinHits.length > 0) {
        const hit = pinHits[0].object as any
        if (hit.userData?.incident) {
          setHoveredEntity({
            title: hit.userData.incident.title,
            type: hit.userData.incident.incident_type,
            severity: hit.userData.incident.severity,
            zone: hit.userData.incident.zone,
          })
          container.style.cursor = 'pointer'
        }
      } else {
        const beaconHits = raycaster.intersectObjects(beaconsGroup.children, true)
        if (beaconHits.length > 0) {
          const hit = beaconHits[0].object as any
          if (hit.userData?.hotspot) {
            setHoveredEntity({
              title: `Hotspot: ${hit.userData.hotspot.dominant_type}`,
              type: `${hit.userData.hotspot.incident_count} reports`,
              severity: hit.userData.hotspot.avg_severity,
              zone: hit.userData.hotspot.zone,
            })
            container.style.cursor = 'pointer'
          }
        } else {
          setHoveredEntity(null)
          container.style.cursor = 'default'
        }
      }

      renderer.render(scene, camera)
      threeRef.current!.reqId = requestAnimationFrame(animate)
    }

    const reqId = requestAnimationFrame(animate)

    threeRef.current = {
      scene,
      camera,
      renderer,
      reqId,
      pinsGroup,
      beaconsGroup,
      roadsGroup,
      buildingsGroup,
      trafficGroup,
      trafficParticles: trafficPositions,
      trafficGeo,
      districtsGroup,
      raycaster,
      mouse,
      isDragging,
      prevMousePos,
    }

    // Resize listener
    const handleResize = () => {
      if (!container || !threeRef.current) return
      const w = container.clientWidth
      camera.aspect = w / containerH
      camera.updateProjectionMatrix()
      renderer.setSize(w, containerH)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      container.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      container.removeEventListener('wheel', onWheel)
      container.removeEventListener('click', onClick)

      cancelAnimationFrame(reqId)
      renderer.dispose()
    }
  }, [mode, height, cameraPreset])

  // Update Dynamic Incident Pins
  useEffect(() => {
    if (!threeRef.current) return
    const { pinsGroup } = threeRef.current

    // Clear existing pins
    while (pinsGroup.children.length > 0) {
      pinsGroup.remove(pinsGroup.children[0])
    }

    if (!activeLayers.incidents) return

    // Color mapper
    const getPinColor = (sev?: number | null) => {
      if (sev === undefined || sev === null) return 0x64748b
      if (sev >= 8.0) return 0xff5577 // Critical
      if (sev >= 6.0) return 0xff9b55 // High
      if (sev >= 4.0) return 0xf4c76a // Medium
      return 0x35e5c5 // Low
    }

    displayIncidents.slice(0, 75).forEach((inc, idx) => {
      const pinColor = getPinColor(inc.severity)
      const pinMat = new THREE.MeshStandardMaterial({
        color: pinColor,
        emissive: pinColor,
        emissiveIntensity: 0.65,
        roughness: 0.2,
      })

      // Inverted cone pin
      const coneGeo = new THREE.ConeGeometry(0.9, 2.4, 8)
      const coneMesh = new THREE.Mesh(coneGeo, pinMat)
      coneMesh.rotation.x = Math.PI // Inverted point down

      // Spherical top
      const sphereGeo = new THREE.SphereGeometry(0.7, 8, 8)
      const sphereMesh = new THREE.Mesh(sphereGeo, pinMat)
      sphereMesh.position.y = 1.4
      coneMesh.add(sphereMesh)

      // Map lat/lon onto [-60, 60]
      const px = ((inc.longitude - 77.59) * 220) + (Math.sin(idx * 3) * 4)
      const pz = -((inc.latitude - 12.97) * 220) + (Math.cos(idx * 3) * 4)
      const clampedX = Math.max(-62, Math.min(62, px))
      const clampedZ = Math.max(-62, Math.min(62, pz))

      coneMesh.position.set(clampedX, 2.8, clampedZ)
      coneMesh.castShadow = true
      coneMesh.userData = { incident: inc }

      // Selection indicator halo
      if (selectedIncident && selectedIncident.id === inc.id) {
        const ringGeo = new THREE.RingGeometry(1.6, 2.2, 16)
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x34d9e8, side: THREE.DoubleSide })
        const ring = new THREE.Mesh(ringGeo, ringMat)
        ring.rotation.x = -Math.PI / 2
        ring.position.set(clampedX, 0.1, clampedZ)
        pinsGroup.add(ring)
      }

      pinsGroup.add(coneMesh)
    })
  }, [displayIncidents, selectedIncident, activeLayers.incidents])

  // Update DBSCAN Hotspot Beacons
  useEffect(() => {
    if (!threeRef.current) return
    const { beaconsGroup } = threeRef.current

    while (beaconsGroup.children.length > 0) {
      beaconsGroup.remove(beaconsGroup.children[0])
    }

    if (!activeLayers.hotspots) return

    hotspots.forEach((hs, idx) => {
      const isCritical = hs.avg_severity >= 7.5
      const color = isCritical ? 0xff5577 : 0xff9b55

      // Pulsing Ring Beacon
      const ringGeo = new THREE.RingGeometry(3.5, 5.0, 24)
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65,
      })
      const ringMesh = new THREE.Mesh(ringGeo, ringMat)
      ringMesh.rotation.x = -Math.PI / 2

      const hx = ((hs.center_lon - 77.59) * 220) + (Math.sin(idx * 7) * 5)
      const hz = -((hs.center_lat - 12.97) * 220) + (Math.cos(idx * 7) * 5)
      const clampedX = Math.max(-58, Math.min(58, hx))
      const clampedZ = Math.max(-58, Math.min(58, hz))

      ringMesh.position.set(clampedX, 0.15, clampedZ)
      ringMesh.userData = { hotspot: hs, pulseSpeed: 2.2 + idx * 0.3 }

      // Core glow cylinder
      const coreGeo = new THREE.CylinderGeometry(0.8, 0.8, 3, 12)
      const coreMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.85,
      })
      const coreMesh = new THREE.Mesh(coreGeo, coreMat)
      coreMesh.position.set(clampedX, 1.5, clampedZ)
      coreMesh.userData = { hotspot: hs }

      beaconsGroup.add(ringMesh)
      beaconsGroup.add(coreMesh)
    })
  }, [hotspots, activeLayers.hotspots])

  // Toggle Visibility of Groups
  useEffect(() => {
    if (!threeRef.current) return
    const { buildingsGroup, roadsGroup, trafficGroup, districtsGroup } = threeRef.current
    if (buildingsGroup) buildingsGroup.visible = !!activeLayers.buildings
    if (roadsGroup) roadsGroup.visible = !!activeLayers.roads
    if (trafficGroup) trafficGroup.visible = !!activeLayers.traffic
    if (districtsGroup) districtsGroup.visible = !!activeLayers.districts
  }, [activeLayers])

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-border-standard bg-bg-midnight ${className}`}>
      {/* Three.js canvas container */}
      <div ref={mountRef} className="w-full h-full min-h-[380px]" />

      {/* Floating Interactive Controls Overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-bg-midnight/80 backdrop-blur-md border border-border-subtle shadow-lg">
          <button
            onClick={() => applyCameraPreset('perspective')}
            className={`px-2.5 py-1 text-[11px] font-mono rounded-lg transition-colors ${
              cameraPreset === 'perspective'
                ? 'bg-accent-cyan text-bg-midnight font-bold shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            3D Orbit
          </button>
          <button
            onClick={() => applyCameraPreset('topdown')}
            className={`px-2.5 py-1 text-[11px] font-mono rounded-lg transition-colors ${
              cameraPreset === 'topdown'
                ? 'bg-accent-cyan text-bg-midnight font-bold shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Top-Down GIS
          </button>
          <button
            onClick={() => applyCameraPreset('isometric')}
            className={`px-2.5 py-1 text-[11px] font-mono rounded-lg transition-colors ${
              cameraPreset === 'isometric'
                ? 'bg-accent-cyan text-bg-midnight font-bold shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            45° Isometric
          </button>
          <button
            onClick={resetCamera}
            title="Reset View"
            className="p-1 text-text-muted hover:text-accent-cyan transition-colors"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* Layer Toggles (Visible in Full Mode or Toggleable) */}
      {mode === 'full' && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 p-1 rounded-xl bg-bg-midnight/80 backdrop-blur-md border border-border-subtle shadow-lg text-[11px] font-mono">
          <button
            onClick={() => toggleLayer('buildings')}
            className={`px-2 py-0.8 rounded-md transition-colors ${
              activeLayers.buildings ? 'text-accent-cyan font-bold bg-accent-cyan/15' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            Buildings
          </button>
          <button
            onClick={() => toggleLayer('roads')}
            className={`px-2 py-0.8 rounded-md transition-colors ${
              activeLayers.roads ? 'text-accent-cyan font-bold bg-accent-cyan/15' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            Roads
          </button>
          <button
            onClick={() => toggleLayer('traffic')}
            className={`px-2 py-0.8 rounded-md transition-colors ${
              activeLayers.traffic ? 'text-accent-turquoise font-bold bg-accent-turquoise/15' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            Traffic
          </button>
          <button
            onClick={() => toggleLayer('hotspots')}
            className={`px-2 py-0.8 rounded-md transition-colors ${
              activeLayers.hotspots ? 'text-severity-critical font-bold bg-severity-critical/15' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            Hotspots
          </button>
          <button
            onClick={() => toggleLayer('incidents')}
            className={`px-2 py-0.8 rounded-md transition-colors ${
              activeLayers.incidents ? 'text-accent-blue font-bold bg-accent-blue/15' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            Pins
          </button>
        </div>
      )}

      {/* Floating Raycast Tooltip */}
      {hoveredEntity && (
        <div
          className="fixed z-50 pointer-events-none p-2.5 rounded-xl bg-bg-midnight/95 backdrop-blur-md border border-accent-cyan/40 shadow-glow-cyan text-xs"
          style={{
            left: `${mousePos.x + 14}px`,
            top: `${mousePos.y + 14}px`,
          }}
        >
          <p className="font-bold text-text-primary text-xs">{hoveredEntity.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-accent-cyan font-mono">{hoveredEntity.type}</span>
            {hoveredEntity.zone && <span className="text-[10px] text-text-muted">• {hoveredEntity.zone}</span>}
            {hoveredEntity.severity !== undefined && (
              <span className="text-[10px] font-mono font-bold text-severity-critical">
                Sev: {hoveredEntity.severity?.toFixed(1) ?? 'N/A'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Bottom Telemetry Legend Pill */}
      <div className="absolute bottom-3 left-4 z-10 flex items-center gap-3 px-3 py-1.5 rounded-xl bg-bg-midnight/85 backdrop-blur-md border border-border-subtle text-[11px] font-mono text-text-secondary shadow-md">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-severity-critical" /> Critical
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-severity-high" /> High
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-severity-medium" /> Medium
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-accent-turquoise" /> Low
        </span>
      </div>
    </div>
  )
}
