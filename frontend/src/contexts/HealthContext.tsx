import { createContext, useContext, useState, useCallback, useMemo, useRef, ReactNode } from 'react'
import { api } from '../lib/api'
import { getToken } from '../lib/auth'

export type ServiceStatus = 'idle' | 'loading' | 'success' | 'error' | 'unauthorized'

export interface ServiceStates {
  health: ServiceStatus
  summary: ServiceStatus
  incidents: ServiceStatus
  hotspots: ServiceStatus
  workOrders: ServiceStatus
}

export type OverallSystemStatus = 'connected' | 'degraded' | 'disconnected' | 'checking'

interface HealthContextType {
  systemStatus: OverallSystemStatus
  services: ServiceStates
  failedServices: string[]
  lastSyncTime: string | null
  lastAttemptTime: string
  setTelemetryReport: (services: ServiceStates, syncTime: string | null, attemptTime: string) => void
  probeHealth: (force?: boolean) => Promise<OverallSystemStatus>
}

const HealthContext = createContext<HealthContextType | null>(null)

export function HealthProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<ServiceStates>({
    health: 'idle',
    summary: 'idle',
    incidents: 'idle',
    hotspots: 'idle',
    workOrders: 'idle',
  })
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
  const [lastAttemptTime, setLastAttemptTime] = useState<string>('Not yet checked')

  const lastProbeRef = useRef<number>(0)
  const inFlightRef = useRef<Promise<OverallSystemStatus> | null>(null)

  // Calculate Overall System Health Status
  const systemStatus: OverallSystemStatus = useMemo(() => {
    if (services.health === 'loading') return 'checking'
    if (services.health === 'error') return 'disconnected'

    const hasSubserviceFailure = [services.summary, services.incidents, services.hotspots, services.workOrders].some(
      (s) => s === 'error' || s === 'unauthorized'
    )

    if (hasSubserviceFailure) return 'degraded'
    if (services.health === 'success') {
      const allChecked = [services.summary, services.incidents, services.hotspots, services.workOrders].every(
        (s) => s === 'success'
      )
      if (allChecked) return 'connected'
      const anyLoading = [services.summary, services.incidents, services.hotspots, services.workOrders].some(
        (s) => s === 'loading'
      )
      if (anyLoading) return 'checking'
      return 'connected'
    }
    return 'checking'
  }, [services])

  // Failed service names distinguishing server outages from authentication requirements
  const failedServices = useMemo(() => {
    const list: string[] = []
    if (services.health === 'error') list.push('Health API (Backend Offline)')
    if (services.summary === 'error') list.push('Summary API (Data Pipeline)')
    if (services.hotspots === 'error') list.push('DBSCAN Hotspots')
    if (services.incidents === 'error') list.push('Incidents Registry (Endpoint Error)')
    if (services.incidents === 'unauthorized') list.push('Incidents Registry (Session Expired / Auth Required)')
    if (services.workOrders === 'error') list.push('Work Orders Pipeline (Endpoint Error)')
    if (services.workOrders === 'unauthorized') list.push('Work Orders Pipeline (Session Expired / Auth Required)')
    return list
  }, [services])

  const setTelemetryReport = useCallback((newServices: ServiceStates, syncTime: string | null, attemptTime: string) => {
    setServices(newServices)
    if (syncTime) setLastSyncTime(syncTime)
    setLastAttemptTime(attemptTime)
  }, [])

  // Comprehensive multi-endpoint health probe verifying contracts & auth
  const probeHealth = useCallback(async (force = false): Promise<OverallSystemStatus> => {
    const now = Date.now()
    // Avoid repeated polling: throttle to once per 8 seconds unless forced
    if (!force && now - lastProbeRef.current < 8000) {
      return systemStatus
    }
    if (inFlightRef.current) {
      return inFlightRef.current
    }

    const runProbe = async (): Promise<OverallSystemStatus> => {
      lastProbeRef.current = Date.now()
      const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      setLastAttemptTime(nowStr)
      setServices((prev) => ({
        health: 'loading',
        summary: 'loading',
        incidents: 'loading',
        hotspots: 'loading',
        workOrders: 'loading',
      }))

      const probeHeaders = { headers: { 'X-Health-Probe': '1' } }

      // 1. Root /health (unauthenticated)
      try {
        await api.get('/health', probeHeaders)
      } catch (err: any) {
        console.warn('[HealthCheck] /health unreachable:', err.message)
        const downStates: ServiceStates = {
          health: 'error',
          summary: 'error',
          incidents: 'error',
          hotspots: 'error',
          workOrders: 'error',
        }
        setServices(downStates)
        return 'disconnected'
      }

      // Root is alive; probe remaining sub-services concurrently
      const subStates: ServiceStates = {
        health: 'success',
        summary: 'loading',
        incidents: 'loading',
        hotspots: 'loading',
        workOrders: 'loading',
      }

      const pSummary = api.get('/api/incidents/summary', probeHeaders)
        .then(() => { subStates.summary = 'success' })
        .catch((err: any) => {
          subStates.summary = 'error'
          console.warn('[HealthCheck] summary error:', err.message)
        })

      const pHotspots = api.get('/api/geospatial/hotspots?eps_km=0.8&min_samples=2', probeHeaders)
        .then(() => { subStates.hotspots = 'success' })
        .catch((err: any) => {
          subStates.hotspots = 'error'
          console.warn('[HealthCheck] hotspots error:', err.message)
        })

      const token = getToken()

      const pIncidents = (token 
        ? api.get('/api/incidents?limit=1', probeHeaders)
        : Promise.reject({ response: { status: 401 } })
      )
        .then(() => { subStates.incidents = 'success' })
        .catch((err: any) => {
          if (err.response?.status === 401 || err.response?.status === 403) {
            subStates.incidents = 'unauthorized'
          } else {
            subStates.incidents = 'error'
          }
        })

      const pWorkOrders = (token 
        ? api.get('/api/work-orders', probeHeaders)
        : Promise.reject({ response: { status: 401 } })
      )
        .then(() => { subStates.workOrders = 'success' })
        .catch((err: any) => {
          if (err.response?.status === 401 || err.response?.status === 403) {
            subStates.workOrders = 'unauthorized'
          } else {
            subStates.workOrders = 'error'
          }
        })

      await Promise.allSettled([pSummary, pHotspots, pIncidents, pWorkOrders])

      setServices({ ...subStates })
      setLastSyncTime(nowStr)

      const hasFailure = [subStates.summary, subStates.incidents, subStates.hotspots, subStates.workOrders].some(
        (s) => s === 'error' || s === 'unauthorized'
      )
      return hasFailure ? 'degraded' : 'connected'
    }

    inFlightRef.current = runProbe().finally(() => {
      inFlightRef.current = null
    })

    return inFlightRef.current
  }, [systemStatus])

  return (
    <HealthContext.Provider
      value={{
        systemStatus,
        services,
        failedServices,
        lastSyncTime,
        lastAttemptTime,
        setTelemetryReport,
        probeHealth,
      }}
    >
      {children}
    </HealthContext.Provider>
  )
}

export function useSystemHealth() {
  const ctx = useContext(HealthContext)
  if (!ctx) {
    throw new Error('useSystemHealth must be used within a HealthProvider')
  }
  return ctx
}
