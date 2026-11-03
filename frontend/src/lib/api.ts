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

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/api/auth/login', { username, password }),
  logout: () => api.post('/api/auth/logout'),
  me: () => api.get('/api/auth/me'),
}

// ─── Health / Summary ────────────────────────────────────────────────────────
export const healthAPI = {
  health: () => api.get('/health'),
  summary: () => api.get('/api/incidents/summary'),
}

// ─── Incidents ───────────────────────────────────────────────────────────────
export const incidentsAPI = {
  list: (params?: Record<string, unknown>) => api.get('/api/incidents', { params }),
  get: (id: number) => api.get(`/api/incidents/${id}`),
  create: (data: Record<string, unknown>) => api.post('/api/incidents', data),
}

// ─── Work Orders ─────────────────────────────────────────────────────────────
export const workOrdersAPI = {
  list: (params?: Record<string, unknown>) => api.get('/api/work-orders', { params }),
  assign: (id: number, data: Record<string, unknown>) =>
    api.patch(`/api/work-orders/${id}/assign`, data),
  start: (id: number) => api.patch(`/api/work-orders/${id}/start`, {}),
  resolve: (id: number, data: Record<string, unknown>) =>
    api.patch(`/api/work-orders/${id}/resolve`, data),
}

// ─── Feature 1 — Relationship Graph ─────────────────────────────────────────
export const graphAPI = {
  relationships: (params?: Record<string, unknown>) =>
    api.get('/relationships', { params }),
}

// ─── Feature 2 — Geospatial ──────────────────────────────────────────────────
export const geoAPI = {
  hotspots: (params?: Record<string, unknown>) =>
    api.get('/api/geospatial/hotspots', { params }),
  mapLayers: (params?: Record<string, unknown>) =>
    api.get('/api/geospatial/map-layers', { params }),
}

// ─── Feature 3 — Predictive ML ───────────────────────────────────────────────
export const mlAPI = {
  predict: (data: Record<string, unknown>) => api.post('/api/predict/risk', data),
  metrics: () => api.get('/api/predict/model-metrics'),
}

// ─── Feature 4 — Cascade ─────────────────────────────────────────────────────
export const cascadeAPI = {
  simulate: (data: Record<string, unknown>) => api.post('/cascade', data),
}

// ─── Feature 5 — Scoring ─────────────────────────────────────────────────────
export const scoringAPI = {
  evaluate: (data: Record<string, unknown>) => api.post('/api/scoring/evaluate', data),
}

// ─── Feature 7 — What-If ─────────────────────────────────────────────────────
export const simulationAPI = {
  whatIf: (data: Record<string, unknown>) => api.post('/api/simulation/what-if', data),
}

// ─── Feature 8 — Recommendations ─────────────────────────────────────────────
export const recommendationsAPI = {
  get: (data: Record<string, unknown>) => api.post('/api/recommendations', data),
}

// ─── Feature 10 — Weather ────────────────────────────────────────────────────
export const weatherAPI = {
  analyze: (data: Record<string, unknown>) => api.post('/api/weather/analyze', data),
}

// ─── Location ────────────────────────────────────────────────────────────────
export const locationAPI = {
  options: () => api.get('/api/location/options'),
  zone: (params?: Record<string, unknown>) => api.get('/api/location/zone', { params }),
  zoneSummary: () => api.get('/api/location/summary/zone'),
}
