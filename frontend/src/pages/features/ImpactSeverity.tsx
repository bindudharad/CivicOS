import { useState } from 'react'
import { scoringAPI } from '../../lib/api'
import { Card, LoadingState, ErrorState, SectionHeader, KPICard, SeverityBadge } from '../../components/ui'

const INCIDENT_TYPES = ['Road Damage', 'Flooding / Waterlogging', 'Streetlight Failure', 'Garbage Overflow', 'Water Supply Disruption', 'Gas Leak', 'Fire Hazard', 'Flyover / Bridge Defect', 'Sewer Overflow', 'Traffic Signal Failure']

export default function ImpactSeverity() {
  const [form, setForm] = useState({
    incident_type: INCIDENT_TYPES[0],
    zone: 'Zone A',
    reported_severity: '7',
    affected_population: '500',
    infrastructure_criticality: '7',
    economic_impact_estimate: '50000',
    environmental_impact: '3',
    social_disruption: '5',
    resolution_complexity: '4',
  })
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const run = async () => {
    setLoading(true); setError(''); setResult(null)
    try {
      const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, isNaN(Number(v)) ? v : Number(v)]))
      const r = await scoringAPI.evaluate(payload)
      setResult(r.data)
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e.message)
    } finally { setLoading(false) }
  }

  const gauge = (value: number, max = 10) => {
    const pct = Math.min((value / max) * 100, 100)
    const color = pct >= 70 ? '#FF5364' : pct >= 50 ? '#FF9955' : pct >= 30 ? '#F3C767' : '#46C99A'
    return (
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-text-secondary font-mono">{value?.toFixed?.(1) ?? value}</span>
          <span className="text-text-muted">/ {max}</span>
        </div>
        <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <SectionHeader title="Incident Parameters" subtitle="Configure for composite scoring" />
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase mb-1">Incident Type</label>
              <select value={form.incident_type} onChange={e => setForm(p => ({ ...p, incident_type: e.target.value }))}
                className="w-full bg-surface-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus">
                {INCIDENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase mb-1">Zone</label>
                <select value={form.zone} onChange={e => setForm(p => ({ ...p, zone: e.target.value }))}
                  className="w-full bg-surface-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus">
                  {['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E'].map(z => <option key={z}>{z}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase mb-1">Reported Severity (1-10)</label>
                <input type="number" value={form.reported_severity} onChange={e => setForm(p => ({ ...p, reported_severity: e.target.value }))} min={1} max={10}
                  className="w-full bg-surface-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus" />
              </div>
            </div>
            {[
              { label: 'Affected Population', key: 'affected_population' },
              { label: 'Infrastructure Criticality (1-10)', key: 'infrastructure_criticality' },
              { label: 'Economic Impact (₹)', key: 'economic_impact_estimate' },
              { label: 'Environmental Impact (1-10)', key: 'environmental_impact' },
              { label: 'Social Disruption (1-10)', key: 'social_disruption' },
              { label: 'Resolution Complexity (1-10)', key: 'resolution_complexity' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-text-muted uppercase mb-1">{label}</label>
                <input type="number" value={form[key as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  className="w-full bg-surface-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus" />
              </div>
            ))}
            <button onClick={run} disabled={loading}
              className="w-full py-2.5 bg-accent-cyan text-bg-main font-semibold rounded-lg hover:bg-accent-deep-cyan transition-colors disabled:opacity-50">
              {loading ? 'Scoring...' : 'Calculate Impact Score →'}
            </button>
          </div>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {loading && <LoadingState message="Running composite impact scoring engine..." />}
          {error && <ErrorState message={error} onRetry={run} />}
          {result && !loading && (
            <>
              <Card>
                <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Composite Score</h3>
                <div className="text-center py-6">
                  <div className="text-5xl font-black text-accent-cyan mb-2">
                    {result.composite_score?.toFixed?.(1) ?? result.impact_score?.toFixed?.(1) ?? '—'}
                  </div>
                  <div className="text-text-muted text-sm mb-4">/ 10 Composite Impact Score</div>
                  <SeverityBadge severity={Math.round(result.composite_score ?? result.impact_score ?? 0)} />
                </div>
              </Card>

              {result.score_breakdown && (
                <Card>
                  <h3 className="text-sm font-semibold text-text-primary mb-4">Score Breakdown</h3>
                  <div className="space-y-4">
                    {Object.entries(result.score_breakdown as Record<string, number>).map(([dim, val]) => (
                      <div key={dim}>
                        <div className="text-xs font-medium text-text-secondary capitalize mb-1">{dim.replace(/_/g, ' ')}</div>
                        {gauge(val)}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {result.recommendations && (
                <Card>
                  <h3 className="text-sm font-semibold text-text-primary mb-3">Scoring Recommendations</h3>
                  <ul className="space-y-2">
                    {(result.recommendations as string[]).map((r, i) => (
                      <li key={i} className="flex gap-2 text-sm text-text-secondary">
                        <span className="text-accent-cyan mt-0.5 flex-shrink-0">›</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </>
          )}
          {!result && !loading && !error && (
            <Card>
              <div className="text-center py-12 text-text-muted">
                <div className="text-4xl mb-3">◉</div>
                <p className="text-sm">Fill in parameters and calculate the composite impact score</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
