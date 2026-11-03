import { useEffect, useState } from 'react'
import { recommendationsAPI } from '../../lib/api'
import { Card, SectionHeader, Badge, Button, LoadingState, ErrorState, KPICard } from '../../components/ui'
import { ShieldCheck, Truck, Clock, CheckCircle2, ArrowRight } from 'lucide-react'

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

const ZONES = ['Central Zone', 'South Zone', 'North Zone', 'East Zone', 'West Zone']

export default function PreventiveRecommendations() {
  const [incidentType, setIncidentType] = useState(INCIDENT_TYPES[0])
  const [severity, setSeverity] = useState<number>(8.0)
  const [zone, setZone] = useState(ZONES[0])

  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRecommendations = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await recommendationsAPI.get({
        incident_type: incidentType,
        severity: Number(severity),
        zone,
      })
      setResult(res.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to generate recommendations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecommendations()
  }, [])

  return (
    <div className="space-y-6 animate-fade-in select-none">
      {/* ─── Control Header ─────────────────────────────────────────────────── */}
      <Card className="space-y-4">
        <SectionHeader
          title="Preventive Action Recommendations & Playbooks"
          subtitle="Heuristic decision playbooks prescribing preemptive tactical actions, crew assignments, and dispatch urgencies"
          badge="Playbook Engine"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
              Incident Category
            </label>
            <select
              value={incidentType}
              onChange={(e) => setIncidentType(e.target.value)}
              className="w-full bg-surface-elevated border border-border-standard rounded-xl px-3.5 py-2.5 text-sm text-text-primary input-focus cursor-pointer"
            >
              {INCIDENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
              City Municipal Zone
            </label>
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="w-full bg-surface-elevated border border-border-standard rounded-xl px-3.5 py-2.5 text-sm text-text-primary input-focus cursor-pointer"
            >
              {ZONES.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold uppercase tracking-wider text-text-muted">Severity Threshold</span>
              <span className="font-mono text-accent-cyan font-bold">{severity.toFixed(1)} / 10.0</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={0.5}
              value={severity}
              onChange={(e) => setSeverity(parseFloat(e.target.value))}
              className="w-full accent-accent-cyan cursor-pointer"
            />
          </div>

          <Button
            variant="cyan"
            loading={loading}
            icon={<ShieldCheck size={16} />}
            onClick={fetchRecommendations}
          >
            Generate Playbook
          </Button>
        </div>
      </Card>

      {/* ─── Dispatch Diagnostics ───────────────────────────────────────────── */}
      {result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            title="Dispatch Urgency"
            value={result.dispatch_urgency || 'Standard Priority'}
            subtitle="Operational SLA response window"
            color="critical"
          />
          <KPICard
            title="Suggested Field Crew"
            value={result.suggested_crew || 'Zonal Response Team'}
            subtitle="Specialized municipal unit"
            color="cyan"
          />
          <KPICard
            title="Mitigation Playbooks"
            value={`${result.recommended_actions?.length ?? 0} Steps`}
            subtitle={`Targeted for ${zone}`}
            color="blue"
          />
        </div>
      )}

      {/* ─── Recommended Action Cards ───────────────────────────────────────── */}
      <Card className="space-y-4">
        <SectionHeader
          title={`Action Protocol: ${incidentType}`}
          subtitle="Tactical mitigation steps ordered by intervention effectiveness"
        />

        {loading ? (
          <LoadingState message="Synthesizing operational response protocol..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchRecommendations} />
        ) : result?.recommended_actions && result.recommended_actions.length > 0 ? (
          <div className="space-y-3">
            {result.recommended_actions.map((act: string, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-surface-elevated border border-border-standard flex items-start gap-3 hover:border-accent-cyan/40 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30 flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div className="flex-1 text-xs">
                  <p className="text-sm font-semibold text-text-primary leading-snug">
                    {act}
                  </p>
                  <p className="text-text-muted mt-1 font-mono text-[11px] flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-severity-low" />
                    Verified preventive mitigation action
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-muted py-8 text-center">
            No playbook actions found for this criteria.
          </p>
        )}
      </Card>
    </div>
  )
}
