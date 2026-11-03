import { useEffect, useState } from 'react'
import { scoringAPI, recommendationsAPI } from '../../lib/api'
import { Card, SectionHeader, Badge, Button, LoadingState, ErrorState, KPICard } from '../../components/ui'
import { TrendingDown, ShieldCheck, ArrowDownRight, DollarSign, CheckCircle2, Sliders } from 'lucide-react'

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

export default function PreventionImpact() {
  const [incidentType, setIncidentType] = useState(INCIDENT_TYPES[0])
  const [zone, setZone] = useState(ZONES[0])
  const [baselineSeverity, setBaselineSeverity] = useState<number>(8.0)
  const [population, setPopulation] = useState<number>(5000)

  const [scoringData, setScoringData] = useState<any>(null)
  const [playbookData, setPlaybookData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runEvaluation = async () => {
    setLoading(true)
    setError(null)
    try {
      const [scoreRes, playRes] = await Promise.all([
        scoringAPI.evaluate({
          severity_score: Number(baselineSeverity),
          impact_radius_meters: 1500,
          affected_population: Number(population),
        }),
        recommendationsAPI.get({
          incident_type: incidentType,
          severity: Number(baselineSeverity),
          zone,
        }),
      ])

      setScoringData(scoreRes.data)
      setPlaybookData(playRes.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Evaluation failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runEvaluation()
  }, [])

  const preventionScore = scoringData?.prevention_impact_score ?? 78.5
  const compositeSeverity = scoringData?.composite_severity ?? 8.2
  const residualRisk = Math.max(1.5, compositeSeverity * (1 - preventionScore / 100))
  const riskReductionPct = Math.round(((compositeSeverity - residualRisk) / compositeSeverity) * 100)

  return (
    <div className="space-y-6 animate-fade-in select-none">
      {/* ─── Header & Controls ──────────────────────────────────────────────── */}
      <Card className="space-y-4">
        <SectionHeader
          title="Prevention Impact & ROI Analytics"
          subtitle="Quantify systemic risk reduction and municipal cost avoidance achieved through preemptive field interventions"
          badge="ROI Valuation Model"
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
              Target Zone
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
              <span className="font-semibold uppercase tracking-wider text-text-muted">Baseline Severity</span>
              <span className="font-mono text-accent-cyan font-bold">{baselineSeverity.toFixed(1)} / 10.0</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={0.5}
              value={baselineSeverity}
              onChange={(e) => setBaselineSeverity(parseFloat(e.target.value))}
              className="w-full accent-accent-cyan cursor-pointer"
            />
          </div>

          <Button
            variant="cyan"
            loading={loading}
            icon={<TrendingDown size={16} />}
            onClick={runEvaluation}
          >
            Calculate ROI & Impact
          </Button>
        </div>
      </Card>

      {/* ─── Metric Matrix ──────────────────────────────────────────────────── */}
      {scoringData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Baseline Risk Severity"
            value={typeof compositeSeverity === 'number' ? compositeSeverity.toFixed(2) : compositeSeverity}
            subtitle="Pre-intervention level"
            color="critical"
          />
          <KPICard
            title="Prevention Score"
            value={typeof preventionScore === 'number' ? preventionScore.toFixed(1) : preventionScore}
            subtitle="Mitigation effectiveness"
            color="cyan"
          />
          <KPICard
            title="Residual Severity"
            value={residualRisk.toFixed(2)}
            subtitle="Post-action containment"
            color="low"
          />
          <KPICard
            title="Risk Reduction"
            value={`-${riskReductionPct}%`}
            subtitle="Net hazard attenuation"
            color="purple"
          />
        </div>
      )}

      {/* ─── Comparative Before/After Visual Deck ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Before vs After Impact Comparison */}
        <Card className="space-y-4">
          <SectionHeader
            title="Intervention Differential Model"
            subtitle="Comparative trajectory of reactive vs. proactive management"
          />

          {loading ? (
            <LoadingState message="Modeling preventive attenuation curves..." />
          ) : error ? (
            <ErrorState message={error} onRetry={runEvaluation} />
          ) : scoringData ? (
            <div className="space-y-4 text-xs">
              {/* Baseline Bar */}
              <div className="p-4 rounded-xl bg-surface-elevated border border-severity-critical/30 space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-severity-critical uppercase font-mono">Reactive Baseline (Unmitigated)</span>
                  <span className="font-mono text-severity-critical">{compositeSeverity.toFixed(2)} / 10</span>
                </div>
                <div className="h-2 rounded-full bg-bg-midnight overflow-hidden">
                  <div
                    className="h-full bg-severity-critical rounded-full"
                    style={{ width: `${Math.min(100, (compositeSeverity / 10) * 100)}%` }}
                  />
                </div>
                <span className="text-text-muted text-[11px] block mt-1">
                  High probability of cascading transit and stormwater infrastructure paralysis.
                </span>
              </div>

              {/* Post Prevention Bar */}
              <div className="p-4 rounded-xl bg-surface-elevated border border-severity-low/30 space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-severity-low uppercase font-mono">Proactive Intervention (Post-Action)</span>
                  <span className="font-mono text-severity-low">{residualRisk.toFixed(2)} / 10</span>
                </div>
                <div className="h-2 rounded-full bg-bg-midnight overflow-hidden">
                  <div
                    className="h-full bg-severity-low rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (residualRisk / 10) * 100)}%` }}
                  />
                </div>
                <span className="text-text-muted text-[11px] block mt-1">
                  Controlled local disturbance with zero secondary subsystem propagation.
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-gradient-to-r from-bg-midnight to-surface-card border border-accent-cyan/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-text-muted uppercase">Net Prevention Efficiency</span>
                  <p className="text-sm font-bold text-text-primary">Hazard Mitigated Prior to Escalation</p>
                </div>
                <Badge variant="cyan" dot className="font-mono font-bold text-sm">
                  {riskReductionPct}% Avoided
                </Badge>
              </div>
            </div>
          ) : null}
        </Card>

        {/* Assigned Prevention Protocol */}
        <Card className="space-y-4">
          <SectionHeader
            title="Prescribed Mitigation Strategy"
            subtitle={`Deployed for ${incidentType} in ${zone}`}
          />

          {playbookData?.recommended_actions ? (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-surface-elevated border border-border-standard flex items-center justify-between">
                <span className="text-text-secondary">Assigned Crew:</span>
                <span className="font-bold text-accent-cyan">{playbookData.suggested_crew}</span>
              </div>

              <div className="space-y-2">
                {playbookData.recommended_actions.map((act: string, i: number) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-elevated/60 border border-border-subtle">
                    <CheckCircle2 size={14} className="text-severity-low flex-shrink-0 mt-0.5" />
                    <span className="text-text-primary font-medium">{act}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-text-muted">Loading protocol actions...</p>
          )}
        </Card>
      </div>
    </div>
  )
}
