import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react'
import { healthAPI } from '../lib/api'

export type ServiceStatus = 'idle' | 'loading' | 'success' | 'error'

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
  probeHealth: () => Promise<OverallSystemStatus>
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

  // Calculate Overall System Health Status
  const systemStatus: OverallSystemStatus = useMemo(() => {
    if (services.health === 'loading') return 'checking'
    if (services.health === 'error') return 'disconnected'

    const failedSubservices = [services.summary, services.incidents, services.hotspots, services.workOrders].filter(
      (s) => s === 'error'
    )

    if (failedSubservices.length > 0) return 'degraded'
    if (services.health === 'success') return 'connected'
    return 'checking'
  }, [services])

  // Failed service names for degraded warning
  const failedServices = useMemo(() => {
    const list: string[] = []
    if (services.health === 'error') list.push('Health API')
    if (services.summary === 'error') list.push('Summary API')
    if (services.incidents === 'error') list.push('Incidents Registry')
    if (services.hotspots === 'error') list.push('DBSCAN Hotspots')
    if (services.workOrders === 'error') list.push('Work Orders Pipeline')
    return list
  }, [services])

  const setTelemetryReport = useCallback((newServices: ServiceStates, syncTime: string | null, attemptTime: string) => {
    setServices(newServices)
    if (syncTime) setLastSyncTime(syncTime)
    setLastAttemptTime(attemptTime)
  }, [])

  // Multi-endpoint probe used across routes outside dashboard
  const probeHealth = useCallback(async (): Promise<OverallSystemStatus> => {
    const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLastAttemptTime(nowStr)
    setServices((prev) => ({ ...prev, health: 'loading' }))

    try {
      await healthAPI.health()
      // Probe summary to verify sub-service operational readiness
      try {
        await healthAPI.summary()
        setServices((prev) => ({ ...prev, health: 'success', summary: 'success' }))
        setLastSyncTime(nowStr)
        return 'connected'
      } catch {
        setServices((prev) => ({ ...prev, health: 'success', summary: 'error' }))
        setLastSyncTime(nowStr)
        return 'degraded'
      }
    } catch {
      setServices((prev) => ({ ...prev, health: 'error' }))
      return 'disconnected'
    }
  }, [])

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
