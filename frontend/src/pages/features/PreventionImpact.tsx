import { useState } from 'react'
import { recommendationsAPI, scoringAPI } from '../../lib/api'
import { Card, LoadingState, ErrorState, SectionHeader, KPICard } from '../../components/ui'

const INCIDENT_TYPES = ['Road Damage', 'Flooding / Waterlogging', 'Streetlight Failure', 'Garbage Overflow', 'Water Supply Disruption', 'Gas Leak', 'Fire Hazard', 'Flyover / Bridge Defect', 'Sewer Overflow', 'Traffic Signal Failure']

export default function PreventionImpact() {
  const [form, setForm] = useState({
    incident_type: INCIDENT_TYPES[0],
    zone: 'Zone A',
    baseline_severity: '7',
    prevention_budget: '500000',
    programme_duration_months: '12',
  })
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const run = async () => {
    setLoading(true); setError(''); setResult(null)
    try {
      // Use recommendations API with budget context
      const r = await recommendationsAPI.get({
        incident_type: form.incident_type,
        severity: parseInt(form.baseline_severity),
        zone: form.zone,
        prevention_budget: parseInt(form.prevention_budget),
        programme_duration_months: parseInt(form.programme_duration_months),
      })
      setResult(r.data)
    } catch (e: any) { setError(e?.response?.data?.detail ?? e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="bg-surface-elevated">
        <SectionHeader title="Prevention Programme Setup" subtitle="Evaluate ROI for preventive city maintenance" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase mb-1">Incident Type</label>
            <select value={form.incident_type} onChange={e => setForm(p => ({ ...p, incident_type: e.target.value }))}
              className="w-full bg-bg-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus">
              {INCIDENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase mb-1">Zone</label>
            <select value={form.zone} onChange={e => setForm(p => ({ ...p, zone: e.target.value }))}
              className="w-full bg-bg-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus">
              {['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E'].map(z => <option key={z}>{z}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase mb-1">Baseline Severity</label>
            <input type="number" value={form.baseline_severity} onChange={e => setForm(p => ({ ...p, baseline_severity: e.target.value }))} min={1} max={10}
              className="w-full bg-bg-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus" />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase mb-1">Prevention Budget (₹)</label>
            <input type="number" value={form.prevention_budget} onChange={e => setForm(p => ({ ...p, prevention_budget: e.target.value }))} min={10000}
              className="w-full bg-bg-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus" />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase mb-1">Programme Duration (months)</label>
            <input type="number" value={form.programme_duration_months} onChange={e => setForm(p => ({ ...p, programme_duration_months: e.target.value }))} min={1} max={60}
              className="w-full bg-bg-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus" />
          </div>
          <div className="flex items-end">
            <button onClick={run} disabled={loading}
              className="w-full py-2.5 bg-accent-cyan text-bg-main font-semibold rounded-lg hover:bg-accent-deep-cyan transition-colors disabled:opacity-50">
              {loading ? 'Computing...' : 'Calculate Impact →'}
            </button>
          </div>
        </div>
      </Card>

      {loading && <LoadingState message="Computing prevention impact score..." />}
      {error && <ErrorState message={error} onRetry={run} />}

      {result && !loading && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title="Prevention Score" value={result.prevention_score?.toFixed?.(1) ?? '—'} icon={<span>◈</span>} color="low" />
            <KPICard title="Cost Reduction" value={result.estimated_cost_reduction !== undefined ? `${result.estimated_cost_reduction}%` : '—'} icon={<span>▲</span>} color="cyan" />
            <KPICard title="Actions Available" value={result.recommendations?.length ?? result.actions?.length ?? '—'} icon={<span>⬙</span>} color="blue" />
            <KPICard title="ROI Estimate" value={result.roi_estimate !== undefined ? `${result.roi_estimate}x` : '—'} icon={<span>◉</span>} color="purple" />
          </div>

          {/* ROI Chart */}
          <Card>
            <SectionHeader title="Prevention Programme ROI" subtitle={`Budget: ₹${Number(form.prevention_budget).toLocaleString()} over ${form.programme_duration_months} months`} />
            <div className="relative h-48 bg-bg-elevated rounded-xl border border-border-subtle overflow-hidden p-4">
              <svg viewBox="0 0 500 160" className="w-full h-full">
                {/* X axis */}
                <line x1={40} y1={130} x2={480} y2={130} stroke="#243B50" strokeWidth={1} />
                <line x1={40} y1={10} x2={40} y2={130} stroke="#243B50" strokeWidth={1} />
                {/* Labels */}
                <text x={260} y={150} textAnchor="middle" fill="#73889D" fontSize="10">Months</text>
                {/* Cost curve (reactive) */}
                <polyline
                  points={Array.from({ length: 13 }, (_, i) => {
                    const x = 40 + i * ((480 - 40) / 12)
                    const decayFactor = Math.exp(-0.1 * i)
                    const y = 130 - (100 * (1 - decayFactor) * 0.7)
                    return `${x},${y}`
                  }).join(' ')}
                  fill="none" stroke="#46C99A" strokeWidth={2}
                />
                {/* Flat cost line (prevention) */}
                <line x1={40} y1={90} x2={480} y2={90} stroke="#36D6CC" strokeWidth={1.5} strokeDasharray="4,3" />
                {/* Legend */}
                <line x1={300} y1={20} x2={320} y2={20} stroke="#46C99A" strokeWidth={2} />
                <text x={325} y={24} fill="#A4B5C7" fontSize="9">Reactive cost</text>
                <line x1={300} y1={35} x2={320} y2={35} stroke="#36D6CC" strokeWidth={1.5} strokeDasharray="4,3" />
                <text x={325} y={39} fill="#A4B5C7" fontSize="9">Prevention cost</text>
              </svg>
            </div>
          </Card>

          {/* Recommended actions with cost */}
          {(result.recommendations ?? result.actions ?? []).length > 0 && (
            <Card>
              <SectionHeader title="Preventive Actions" subtitle="Ranked by impact-to-cost ratio" />
              <div className="space-y-2">
                {(result.recommendations ?? result.actions ?? []).slice(0, 6).map((action: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-surface-elevated border border-border-subtle">
                    <span className="text-accent-cyan font-mono text-xs w-6 flex-shrink-0 mt-0.5">#{i + 1}</span>
                    <div className="flex-1 text-sm text-text-secondary">
                      {typeof action === 'string' ? action : (action.title ?? action.action ?? JSON.stringify(action))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
      {!result && !loading && !error && (
        <Card>
          <div className="text-center py-12 text-text-muted">
            <div className="text-4xl mb-3">◈</div>
            <p className="text-sm">Configure and evaluate your prevention programme ROI</p>
          </div>
        </Card>
      )}
    </div>
  )
}
