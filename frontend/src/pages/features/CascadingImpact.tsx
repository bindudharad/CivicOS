import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { cascadeAPI } from '../../lib/api'
import { Card, SectionHeader, Badge, Button, LoadingState, ErrorState, KPICard } from '../../components/ui'
import { GitFork, AlertTriangle, Clock, Activity, CloudRain, Wind, Layers } from 'lucide-react'

const INCIDENT_TYPES = [
  'Flooding / Waterlogging',
  'Road Damage',
  'Sewer Overflow',
  'Water Supply Disruption',
  'Streetlight Failure',
  'Traffic Signal Failure',
  'Flyover / Bridge Defect',
  'Garbage Overflow',
  'Gas Leak',
  'Fire Hazard',
]

export default function CascadingImpact() {
  const [searchParams] = useSearchParams()
  const initialId = searchParams.get('incident_id') || 'INC-1001'

  const [mode, setMode] = useState<'id' | 'custom'>('id')
  const [incidentId, setIncidentId] = useState(initialId)

  const [customForm, setCustomForm] = useState({
    incident_type: 'Flooding / Waterlogging',
    severity_score: 8.5,
    rainfall_mm: 55.0,
    wind_speed_kmh: 22.0,
    cascading_risk_flag: 1,
  })

  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runSimulation = async () => {
    setLoading(true)
    setError(null)
    try {
      let payload: any = {}
      if (mode === 'id') {
        payload = {
          incident_id: incidentId,
          rainfall_mm: 50.0,
          cascading_risk_flag: 1,
        }
      } else {
        payload = {
          incident_type: customForm.incident_type,
          severity_score: Number(customForm.severity_score),
          rainfall_mm: Number(customForm.rainfall_mm),
          wind_speed_kmh: Number(customForm.wind_speed_kmh),
          cascading_risk_flag: Number(customForm.cascading_risk_flag),
        }
      }

      const res = await cascadeAPI.simulate(payload)
      setResult(res.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Cascade simulation failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runSimulation()
  }, [])

  return (
    <div className="space-y-6 animate-fade-in select-none">
      {/* ─── Control Header ─────────────────────────────────────────────────── */}
      <Card className="space-y-4">
        <SectionHeader
          title="Infrastructure Cascading Impact Simulation"
          subtitle="Deterministic graph traversal & weather-amplified failure propagation across interconnected urban subsystems"
          badge="Cascade Engine"
        />

        <div className="flex flex-wrap items-center gap-3 pb-2 border-b border-border-subtle">
          <button
            onClick={() => setMode('id')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              mode === 'id'
                ? 'bg-accent-blue text-white shadow-glow-blue'
                : 'bg-surface-elevated text-text-muted hover:text-text-primary'
            }`}
          >
            By Reference Incident ID
          </button>
          <button
            onClick={() => setMode('custom')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              mode === 'custom'
                ? 'bg-accent-blue text-white shadow-glow-blue'
                : 'bg-surface-elevated text-text-muted hover:text-text-primary'
            }`}
          >
            Custom Failure Scenario
          </button>
        </div>

        {mode === 'id' ? (
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
                Reference Incident ID
              </label>
              <input
                type="text"
                value={incidentId}
                onChange={(e) => setIncidentId(e.target.value)}
                placeholder="e.g. INC-1001"
                className="w-48 bg-surface-elevated border border-border-standard rounded-xl px-3 py-2 text-sm text-text-primary font-mono input-focus"
              />
            </div>
            <Button
              variant="cyan"
              loading={loading}
              icon={<GitFork size={16} />}
              onClick={runSimulation}
            >
              Simulate Cascade Chain
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
                Root Incident Type
              </label>
              <select
                value={customForm.incident_type}
                onChange={(e) => setCustomForm((p) => ({ ...p, incident_type: e.target.value }))}
                className="w-full bg-surface-elevated border border-border-standard rounded-xl px-3 py-2 text-sm text-text-primary input-focus cursor-pointer"
              >
                {INCIDENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider text-text-muted">Severity</span>
                <span className="font-mono text-accent-cyan font-bold">{customForm.severity_score.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={0.5}
                value={customForm.severity_score}
                onChange={(e) => setCustomForm((p) => ({ ...p, severity_score: parseFloat(e.target.value) }))}
                className="w-full accent-accent-cyan cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider text-text-muted">Rainfall (mm)</span>
                <span className="font-mono text-accent-cyan font-bold">{customForm.rainfall_mm} mm</span>
              </div>
              <input
                type="range"
                min={0}
                max={150}
                step={5}
                value={customForm.rainfall_mm}
                onChange={(e) => setCustomForm((p) => ({ ...p, rainfall_mm: parseFloat(e.target.value) }))}
                className="w-full accent-accent-cyan cursor-pointer"
              />
            </div>

            <Button
              variant="cyan"
              className="w-full"
              loading={loading}
              icon={<GitFork size={16} />}
              onClick={runSimulation}
            >
              Simulate Scenario
            </Button>
          </div>
        )}
      </Card>

      {/* ─── Simulation Diagnostics Header ──────────────────────────────────── */}
      {result && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Consequences"
            value={result.total_consequences_predicted ?? 0}
            subtitle="Downstream failures"
            color="cyan"
          />
          <KPICard
            title="Critical Hazards"
            value={result.critical_consequences_count ?? 0}
            subtitle="Tier 1 emergencies"
            color="critical"
          />
          <KPICard
            title="Weather Amplified"
            value={result.weather_amplified ? 'Active (Rain/Wind)' : 'None'}
            subtitle="Amplification vector"
            color={result.weather_amplified ? 'high' : 'blue'}
          />
          <KPICard
            title="Overall Threat Level"
            value={result.overall_threat_level || 'CRITICAL'}
            subtitle="Cascade severity"
            color="purple"
          />
        </div>
      )}

      {/* ─── Consequences Tree / Chain Visualization ────────────────────────── */}
      <Card className="space-y-4">
        <SectionHeader
          title="Multi-Stage Consequence Cascade Chain"
          subtitle="Sequential failure horizons across municipal infrastructure layers"
        />

        {loading ? (
          <LoadingState message="Modeling infrastructure propagation stages..." />
        ) : error ? (
          <ErrorState message={error} onRetry={runSimulation} />
        ) : result?.consequences && result.consequences.length > 0 ? (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-accent-cyan before:via-accent-blue before:to-severity-critical">
            {result.consequences.map((c: any, idx: number) => {
              const isCrit = c.risk_level === 'CRITICAL'
              return (
                <div key={idx} className="relative group">
                  {/* Timeline Node Orb */}
                  <div className={`absolute -left-[27px] top-4 w-4 h-4 rounded-full border-2 ${
                    isCrit ? 'bg-severity-critical border-white shadow-glow-critical' : 'bg-accent-cyan border-white shadow-glow-cyan'
                  }`} />

                  {/* Consequence Card */}
                  <div className={`p-5 rounded-2xl border transition-all ${
                    isCrit ? 'bg-severity-critical/10 border-severity-critical/30' : 'bg-surface-elevated border-border-standard'
                  }`}>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-accent-cyan bg-bg-midnight px-2 py-0.5 rounded border border-border-subtle">
                          Stage {c.stage || c.depth}
                        </span>
                        <h4 className="text-sm font-bold text-text-primary">
                          {c.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={isCrit ? 'critical' : 'high'} dot>
                          {c.risk_level}
                        </Badge>
                        <span className="font-mono text-xs text-text-muted flex items-center gap-1">
                          <Clock size={12} /> {c.time_horizon || 'Immediate'}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-text-secondary leading-relaxed">
                      {c.reason}
                    </p>

                    <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between text-xs text-text-muted font-mono">
                      <span>Subsystem: <strong className="text-text-primary">{c.subsystem}</strong></span>
                      <span>Parent Ref: {c.parent_id || 'ROOT'}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-xs text-text-muted py-8 text-center">
            No cascading consequences generated for this scenario.
          </p>
        )}
      </Card>
    </div>
  )
}
