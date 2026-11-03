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
    if (err.response?.status === 401) {
      localStorage.removeItem('civicos_token')
      localStorage.removeItem('civicos_user')
      window.dispatchEvent(new Event('civicos:logout'))
    }
    return Promise.reject(err)
  }
)

// ─── Data Normalization Helpers ───────────────────────────────────────────────

export interface NormalizedIncident {
  id: string
  title: string
  description?: string
  incident_type: string
  category: string
  zone: string
  ward: string
  severity: number | null
  status: string
  latitude: number
  longitude: number
  affected_population: number
  created_at: string
  raw: any
}

export function normalizeIncident(raw: any): NormalizedIncident {
  const id = String(raw?.id ?? raw?.incident_id ?? 'N/A')
  const title = String(raw?.title ?? raw?.description?.slice(0, 45) ?? 'Urban Incident')
  const description = String(raw?.description ?? raw?.title ?? 'No detailed description recorded.')
  const incident_type = String(raw?.incident_type ?? raw?.category ?? 'Incident')
  const category = String(raw?.category ?? 'General')
  const zone = String(raw?.zone ?? raw?.ward ?? 'Central Zone')
  const ward = String(raw?.ward ?? 'Ward 1')
  
  // Distinguish missing from 0
  const sevVal = raw?.severity_score ?? raw?.severity ?? raw?.composite_severity
  const severity = typeof sevVal === 'number' && !isNaN(sevVal) ? sevVal : null
  
  const status = String(raw?.status ?? 'reported').toLowerCase()
  const latitude = Number(raw?.latitude ?? 12.9716)
  const longitude = Number(raw?.longitude ?? 77.5946)
  const affected_population = Number(raw?.affected_population ?? 100)
  
  // Safe date normalization
  let created_at = new Date().toISOString()
  const rawDate = raw?.created_at ?? raw?.reported_at ?? raw?.timestamp
  if (rawDate) {
    const d = new Date(rawDate)
    if (!isNaN(d.getTime())) {
      created_at = d.toISOString()
    }
  }

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
    latitude,
    longitude,
    affected_population,
    created_at,
    raw,
  }
}

export interface NormalizedWorkOrder {
  id: string
  incident_id: string
  department: string
  status: string
  assignee: string | null
  instructions: string | null
  resolution_evidence: string | null
  created_at: string
  updated_at: string
}

export function normalizeWorkOrder(raw: any): NormalizedWorkOrder {
  return {
    id: String(raw?.id ?? 'WO-UNKNOWN'),
    incident_id: String(raw?.incident_id ?? ''),
    department: String(raw?.department ?? 'Municipal Operations'),
    status: String(raw?.status ?? 'open').toLowerCase(),
    assignee: raw?.assignee ? String(raw.assignee) : null,
    instructions: raw?.instructions ? String(raw.instructions) : null,
    resolution_evidence: raw?.resolution_evidence ? String(raw.resolution_evidence) : null,
    created_at: raw?.created_at ?? new Date().toISOString(),
    updated_at: raw?.updated_at ?? new Date().toISOString(),
  }
}

export interface NormalizedHotspot {
  cluster_id: number
  center_lat: number
  center_lon: number
  incident_count: number
  avg_severity: number
  dominant_type: string
  zone: string
  raw?: any
}

export function normalizeHotspot(raw: any): NormalizedHotspot {
  return {
    cluster_id: Number(raw?.cluster_id ?? 0),
    center_lat: Number(raw?.center_latitude ?? raw?.center_lat ?? 12.9716),
    center_lon: Number(raw?.center_longitude ?? raw?.center_lon ?? 77.5946),
    incident_count: Number(raw?.incident_count ?? 1),
    avg_severity: Number(raw?.average_severity ?? raw?.avg_severity ?? 6.0),
    dominant_type: String(raw?.dominant_incident_type ?? raw?.dominant_type ?? 'Urban Hazard'),
    zone: String(Array.isArray(raw?.zones_covered) && raw.zones_covered.length > 0 ? raw.zones_covered[0] : (raw?.zone ?? 'Central Zone')),
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
  health: () => api.get('/health'),
  summary: () => api.get('/api/incidents/summary'),
}

export const incidentsAPI = {
  list: (params?: Record<string, unknown>) => api.get('/api/incidents', { params }),
  get: (id: string | number) => api.get(`/api/incidents/${id}`),
  create: (data: Record<string, unknown>) => api.post('/api/incidents', data),
}

export const workOrdersAPI = {
  list: (params?: Record<string, unknown>) => api.get('/api/work-orders', { params }),
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
