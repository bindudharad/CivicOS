import axios from 'axios'

const BASE_URL = 'http://localhost:8000'

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
})

// Attach auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('civicos_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.headers?.["X-Health-Probe"]) {
      localStorage.removeItem('civicos_token')
      localStorage.removeItem('civicos_user')
      window.dispatchEvent(new Event('civicos:logout'))
    }
    return Promise.reject(err)
  }
)

// ─── Data Normalization Utilities ─────────────────────────────────────────────

export function parseNullableNumber(val: any): number | null {
  if (val === null || val === undefined || val === '') return null
  const num = typeof val === 'number' ? val : Number(val)
  return isNaN(num) ? null : num
}

export function parseNullableString(val: any): string | null {
  if (val === null || val === undefined) return null
  const s = String(val).trim()
  return s === '' ? null : s
}

export function parseNullableIsoDate(val: any): string | null {
  if (val === null || val === undefined || val === '') return null
  const d = new Date(val)
  if (isNaN(d.getTime())) return null
  return d.toISOString()
}

export function isValidCoordinate(lat: any, lon: any): boolean {
  if (lat === null || lat === undefined || lon === null || lon === undefined) return false
  const nLat = typeof lat === 'number' ? lat : Number(lat)
  const nLon = typeof lon === 'number' ? lon : Number(lon)
  if (isNaN(nLat) || isNaN(nLon)) return false
  return nLat >= -90 && nLat <= 90 && nLon >= -180 && nLon <= 180
}

export function normalizeCoordinates(latRaw: any, lonRaw: any): {
  latitude: number | null
  longitude: number | null
  has_valid_location: boolean
} {
  if (latRaw === null || latRaw === undefined || lonRaw === null || lonRaw === undefined) {
    return { latitude: null, longitude: null, has_valid_location: false }
  }
  const lat = typeof latRaw === 'number' ? latRaw : Number(latRaw)
  const lon = typeof lonRaw === 'number' ? lonRaw : Number(lonRaw)
  if (isNaN(lat) || isNaN(lon)) {
    return { latitude: null, longitude: null, has_valid_location: false }
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return { latitude: null, longitude: null, has_valid_location: false }
  }
  return { latitude: lat, longitude: lon, has_valid_location: true }
}

// ─── Strict Incident Model & Normalizer ────────────────────────────────────────

export interface NormalizedIncident {
  id: string
  title: string
  description: string | null
  incident_type: string
  category: string
  zone: string | null
  ward: string | null
  severity: number | null
  status: string
  latitude: number | null
  longitude: number | null
  has_valid_location: boolean
  affected_population: number | null
  created_at: string | null
  raw: any
}

export function normalizeIncident(raw: any): NormalizedIncident {
  const id = String(raw?.id ?? raw?.incident_id ?? 'N/A')
  const title = parseNullableString(raw?.title) ?? parseNullableString(raw?.description?.slice(0, 45)) ?? 'Urban Incident'
  const description = parseNullableString(raw?.description) ?? parseNullableString(raw?.title) ?? null
  const incident_type = parseNullableString(raw?.incident_type ?? raw?.category) ?? 'Incident'
  const category = parseNullableString(raw?.category) ?? 'General'
  const zone = parseNullableString(raw?.zone ?? raw?.ward_zone)
  const ward = parseNullableString(raw?.ward)
  
  // Distinguish missing from numeric 0
  const sevVal = raw?.severity_score ?? raw?.severity ?? raw?.composite_severity
  const severity = parseNullableNumber(sevVal)
  
  const status = parseNullableString(raw?.status)?.toLowerCase() ?? 'reported'
  
  const coords = normalizeCoordinates(
    raw?.latitude ?? raw?.lat,
    raw?.longitude ?? raw?.lon ?? raw?.lng
  )
  
  // Distinguish missing from numeric 0
  const affected_population = parseNullableNumber(raw?.affected_population ?? raw?.population_affected)
  
  // Safe date normalization: strictly never fabricate current timestamp for missing/invalid date
  const rawDate = raw?.created_at ?? raw?.reported_at ?? raw?.timestamp
  const created_at = parseNullableIsoDate(rawDate)

  return {
    id,
    title,
    description,
    incident_type,
    category,
    zone,
    ward,
    severity,
    status,
    latitude: coords.latitude,
    longitude: coords.longitude,
    has_valid_location: coords.has_valid_location,
    affected_population,
    created_at,
    raw,
  }
}

// ─── Strict Work Order Model & Normalizer ──────────────────────────────────────

export interface NormalizedWorkOrder {
  id: string
  incident_id: string
  department: string | null
  status: string | null
  assignee: string | null
  instructions: string | null
  resolution_evidence: string | null
  created_at: string | null
  updated_at: string | null
}

export function normalizeWorkOrder(raw: any): NormalizedWorkOrder {
  return {
    id: String(raw?.id ?? 'WO-UNKNOWN'),
    incident_id: String(raw?.incident_id ?? ''),
    department: parseNullableString(raw?.department),
    status: parseNullableString(raw?.status)?.toLowerCase() ?? null,
    assignee: parseNullableString(raw?.assignee),
    instructions: parseNullableString(raw?.instructions),
    resolution_evidence: parseNullableString(raw?.resolution_evidence),
    created_at: parseNullableIsoDate(raw?.created_at),
    updated_at: parseNullableIsoDate(raw?.updated_at),
  }
}

// ─── Strict Hotspot Model & Normalizer ─────────────────────────────────────────

export interface NormalizedHotspot {
  cluster_id: number
  center_lat: number | null
  center_lon: number | null
  incident_count: number | null
  avg_severity: number | null
  dominant_type: string | null
  zone: string | null
  has_valid_location: boolean
  raw?: any
}

export function normalizeHotspot(raw: any): NormalizedHotspot {
  const coords = normalizeCoordinates(
    raw?.center_latitude ?? raw?.center_lat,
    raw?.center_longitude ?? raw?.center_lon
  )

  const countVal = raw?.incident_count ?? raw?.count
  const incident_count = parseNullableNumber(countVal)

  const sevVal = raw?.average_severity ?? raw?.avg_severity ?? raw?.severity
  const avg_severity = parseNullableNumber(sevVal)

  const dominant_type = parseNullableString(raw?.dominant_incident_type ?? raw?.dominant_type)

  let rawZone: any = null
  if (Array.isArray(raw?.zones_covered) && raw.zones_covered.length > 0) {
    rawZone = raw.zones_covered[0]
  } else if (raw?.zone) {
    rawZone = raw.zone
  }
  const zone = parseNullableString(rawZone)

  return {
    cluster_id: Number(raw?.cluster_id ?? 0),
    center_lat: coords.latitude,
    center_lon: coords.longitude,
    incident_count,
    avg_severity,
    dominant_type,
    zone,
    has_valid_location: coords.has_valid_location,
    raw,
  }
}

// ─── API Resource Clients ───────────────────────────────────────────────────

export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/api/auth/login', { username, password }),
  logout: () => api.post('/api/auth/logout'),
  me: () => api.get('/api/auth/me'),
}

export const healthAPI = {
  health: (config?: Record<string, unknown>) => api.get('/health', config),
  summary: (config?: Record<string, unknown>) => api.get('/api/incidents/summary', config),
}

export const incidentsAPI = {
  list: (params?: Record<string, unknown>, config?: Record<string, unknown>) => api.get('/api/incidents', { params, ...config }),
  get: (id: string | number, config?: Record<string, unknown>) => api.get(`/api/incidents/${id}`, config),
  create: (data: Record<string, unknown>, config?: Record<string, unknown>) => api.post('/api/incidents', data, config),
}

export const workOrdersAPI = {
  list: (config?: Record<string, unknown>) => api.get('/api/work-orders', config),
  assign: (id: string | number, assignee: string) =>
    api.patch(`/api/work-orders/${id}/assign`, { assignee }),
  start: (id: string | number) =>
    api.patch(`/api/work-orders/${id}/start`, {}),
  resolve: (id: string | number, evidence: string) =>
    api.patch(`/api/work-orders/${id}/resolve`, { evidence }),
}

export const graphAPI = {
  relationships: (params?: { incident_id?: string; max_distance_km?: number | string; min_weight?: number | string; limit?: number }) =>
    api.get('/relationships', { params }),
}

export const geoAPI = {
  hotspots: (params?: { eps_km?: number; min_samples?: number }) =>
    api.get('/api/geospatial/hotspots', { params }),
  mapLayers: (params?: Record<string, unknown>) =>
    api.get('/api/geospatial/map-layers', { params }),
}

export const mlAPI = {
  predict: (data: {
    severity_score: number
    impact_radius_meters: number
    affected_population: number
    temperature_c: number
    wind_speed_kmh: number
    incident_type: string
  }) => api.post('/api/predict/risk', data),
  metrics: () => api.get('/api/predict/model-metrics'),
}

export const cascadeAPI = {
  simulate: (data: {
    incident_id?: string
    incident_type?: string
    severity_score?: number
    rainfall_mm?: number
    wind_speed_kmh?: number
    cascading_risk_flag?: number
  }) => api.post('/cascade', data),
}

export const scoringAPI = {
  evaluate: (data: {
    severity_score: number
    affected_population: number
    impact_radius_meters: number
  }) => api.post('/api/scoring/evaluate', data),
}

export const simulationAPI = {
  whatIf: (data: {
    additional_rain_mm?: number
    target_zone?: string
  }) => api.post('/api/simulation/what-if', data),
}

export const recommendationsAPI = {
  get: (data: {
    incident_type: string
    severity: number
    zone: string
  }) => api.post('/api/recommendations', data),
}

export const weatherAPI = {
  analyze: (data: {
    rainfall_mm: number
    wind_speed_kmh: number
    temperature_c: number
    zone?: string
  }) => api.post('/api/weather/analyze', data),
}

export const locationAPI = {
  options: () => api.get('/api/location/options'),
  zone: (params?: Record<string, unknown>) => api.get('/api/location/zone', { params }),
  zoneSummary: () => api.get('/api/location/summary/zone'),
}
