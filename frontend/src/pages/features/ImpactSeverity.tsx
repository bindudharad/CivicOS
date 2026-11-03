import { useEffect, useState } from 'react'
import { scoringAPI } from '../../lib/api'
import { Card, SectionHeader, Badge, Button, LoadingState, ErrorState, KPICard } from '../../components/ui'
import { Gauge, Sliders, AlertTriangle, ShieldCheck, CheckCircle2, TrendingUp } from 'lucide-react'

export default function ImpactSeverity() {
  const [form, setForm] = useState({
    severity_score: 8.0,
    impact_radius_meters: 1200,
    affected_population: 3500,
    cascading_risk_flag: 1,
  })

  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const computeScore = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await scoringAPI.evaluate({
        severity_score: Number(form.severity_score),
        impact_radius_meters: Number(form.impact_radius_meters),
        affected_population: Number(form.affected_population),
      })
      setResult(res.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Scoring evaluation failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    computeScore()
  }, [])

  return (
    <div className="space-y-6 animate-fade-in select-none">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <Card>
        <SectionHeader
          title="Multi-Criteria Impact & Severity Scoring Engine"
          subtitle="Non-linear composite evaluation balancing physical hazard, territorial radius, and citizen population exposure"
          badge="Scoring Engine"
        />
      </Card>

      {/* ─── Scoring Deck ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Controls */}
        <Card className="space-y-4">
          <SectionHeader
            title="Evaluation Parameters"
            subtitle="Configure physical and demographic exposure"
          />

          <div className="space-y-4">
            {/* Severity Score Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider text-text-muted">Raw Severity Score</span>
                <span className="font-mono text-accent-cyan font-bold">{form.severity_score.toFixed(1)} / 10.0</span>
              </div>
              <input
                type="range"
                min={1.0}
                max={10.0}
                step={0.5}
                value={form.severity_score}
                onChange={(e) => setForm((p) => ({ ...p, severity_score: parseFloat(e.target.value) }))}
                className="w-full accent-accent-cyan cursor-pointer"
              />
            </div>

            {/* Impact Radius Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider text-text-muted">Impact Radius (Meters)</span>
                <span className="font-mono text-accent-cyan font-bold">{form.impact_radius_meters} m</span>
              </div>
              <input
                type="range"
                min={100}
                max={5000}
                step={100}
                value={form.impact_radius_meters}
                onChange={(e) => setForm((p) => ({ ...p, impact_radius_meters: parseInt(e.target.value) }))}
                className="w-full accent-accent-cyan cursor-pointer"
              />
            </div>

            {/* Affected Population */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider text-text-muted">Exposed Population</span>
                <span className="font-mono text-accent-cyan font-bold">{form.affected_population.toLocaleString()} citizens</span>
              </div>
              <input
                type="range"
                min={100}
                max={25000}
                step={250}
                value={form.affected_population}
                onChange={(e) => setForm((p) => ({ ...p, affected_population: parseInt(e.target.value) }))}
                className="w-full accent-accent-cyan cursor-pointer"
              />
            </div>

            <Button
              variant="cyan"
              className="w-full"
              loading={loading}
              icon={<Gauge size={16} />}
              onClick={computeScore}
            >
              Calculate Composite Severity
            </Button>
          </div>
        </Card>

        {/* Results & Score Breakdown */}
        <Card className="space-y-5">
          <SectionHeader
            title="Composite Evaluation Outcome"
            subtitle="Engineered multi-factor index"
          />

          {loading ? (
            <LoadingState message="Computing non-linear composite score..." />
          ) : error ? (
            <ErrorState message={error} onRetry={computeScore} />
          ) : result ? (
            <div className="space-y-6">
              {/* Primary Gauge */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-bg-midnight to-surface-elevated border border-accent-cyan/30 text-center space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">
                  Composite Severity Index
                </span>
                <div className="text-5xl font-black font-mono text-gradient-cyan">
                  {typeof result.composite_severity === 'number' ? result.composite_severity.toFixed(2) : result.composite_severity}
                </div>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Badge variant={result.composite_severity >= 8 ? 'critical' : result.composite_severity >= 6 ? 'high' : 'medium'} dot>
                    {result.composite_severity >= 8 ? 'Critical Urban Hazard' : result.composite_severity >= 6 ? 'Elevated Severity' : 'Controlled Impact'}
                  </Badge>
                </div>
              </div>

              {/* Sub-Metric Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-subtle">
                  <span className="text-[10px] font-mono text-text-muted uppercase">Smart Priority Score</span>
                  <p className="text-2xl font-black font-mono text-accent-blue mt-1">
                    {typeof result.smart_priority_score === 'number' ? result.smart_priority_score.toFixed(1) : result.smart_priority_score}
                  </p>
                  <span className="text-[10px] text-text-secondary">Dispatch Ranking</span>
                </div>
                <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-subtle">
                  <span className="text-[10px] font-mono text-text-muted uppercase">Prevention Impact</span>
                  <p className="text-2xl font-black font-mono text-severity-low mt-1">
                    {typeof result.prevention_impact_score === 'number' ? result.prevention_impact_score.toFixed(1) : result.prevention_impact_score}
                  </p>
                  <span className="text-[10px] text-text-secondary">Mitigation Potential</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-text-muted">Configure input parameters to evaluate.</p>
          )}
        </Card>
      </div>
    </div>
  )
}
