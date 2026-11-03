import { useState } from 'react'
import { cascadeAPI } from '../../lib/api'
import { Card, LoadingState, ErrorState, SectionHeader, KPICard, Badge } from '../../components/ui'

const INCIDENT_TYPES = ['Road Damage', 'Flooding / Waterlogging', 'Streetlight Failure', 'Garbage Overflow', 'Water Supply Disruption', 'Gas Leak', 'Fire Hazard', 'Flyover / Bridge Defect', 'Sewer Overflow', 'Traffic Signal Failure']

export default function CascadingImpact() {
  const [form, setForm] = useState({
    incident_type: INCIDENT_TYPES[0],
    severity: '7',
    zone: 'Zone A',
    infrastructure_age_years: '15',
    population_density: '5000',
  })
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const run = async () => {
    setLoading(true); setError(''); setResult(null)
    try {
      const r = await cascadeAPI.simulate({
        ...form,
        severity: parseInt(form.severity),
        infrastructure_age_years: parseInt(form.infrastructure_age_years),
        population_density: parseInt(form.population_density),
      })
      setResult(r.data)
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Controls */}
      <Card className="bg-surface-elevated">
        <SectionHeader title="Cascade Simulation" subtitle="Model infrastructure failure propagation" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase mb-1">Incident Type</label>
            <select value={form.incident_type} onChange={e => setForm(p => ({ ...p, incident_type: e.target.value }))}
              className="w-full bg-bg-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus">
              {INCIDENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase mb-1">Severity (1-10)</label>
            <input type="number" value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))} min={1} max={10}
              className="w-full bg-bg-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus" />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase mb-1">Zone</label>
            <select value={form.zone} onChange={e => setForm(p => ({ ...p, zone: e.target.value }))}
              className="w-full bg-bg-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus">
              {['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E'].map(z => <option key={z}>{z}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase mb-1">Infrastructure Age (years)</label>
            <input type="number" value={form.infrastructure_age_years} onChange={e => setForm(p => ({ ...p, infrastructure_age_years: e.target.value }))} min={0} max={100}
              className="w-full bg-bg-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus" />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase mb-1">Population Density (/km²)</label>
            <input type="number" value={form.population_density} onChange={e => setForm(p => ({ ...p, population_density: e.target.value }))} min={100}
              className="w-full bg-bg-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus" />
          </div>
          <div className="flex items-end">
            <button onClick={run} disabled={loading}
              className="w-full py-2.5 bg-accent-cyan text-bg-main font-semibold rounded-lg hover:bg-accent-deep-cyan transition-colors disabled:opacity-50">
              {loading ? 'Simulating...' : 'Run Cascade →'}
            </button>
          </div>
        </div>
      </Card>

      {loading && <LoadingState message="Simulating infrastructure cascade propagation..." />}
      {error && <ErrorState message={error} onRetry={run} />}

      {result && !loading && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title="Cascade Depth" value={result.cascade_depth ?? '—'} icon={<span>⟁</span>} color="critical" />
            <KPICard title="Affected Systems" value={result.affected_systems?.length ?? result.total_affected ?? '—'} icon={<span>◉</span>} color="high" />
            <KPICard title="Est. Repair Days" value={result.estimated_repair_days ?? '—'} icon={<span>⟳</span>} color="medium" />
            <KPICard title="Impact Score" value={result.total_impact_score ?? result.cascade_score ?? '—'} icon={<span>▲</span>} color="cyan" />
          </div>

          {/* Cascade tree visualization */}
          <Card>
            <SectionHeader title="Cascade Impact Tree" subtitle="Propagation pathways from primary incident" />
            {result.cascade_chain || result.affected_systems ? (
              <div className="space-y-2">
                {/* Root */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-status-critical/10 border border-status-critical/30">
                  <span className="text-status-critical text-lg">⊗</span>
                  <div>
                    <div className="text-sm font-semibold text-text-primary">PRIMARY: {form.incident_type}</div>
                    <div className="text-xs text-text-muted">Severity {form.severity} · {form.zone}</div>
                  </div>
                </div>
                {/* Cascade levels */}
                {(result.cascade_chain ?? result.affected_systems ?? []).map((item: any, i: number) => {
                  const depth = item.depth ?? (i + 1)
                  const colors = ['border-status-high/50 bg-status-high/5', 'border-status-medium/50 bg-status-medium/5', 'border-accent-blue/50 bg-accent-blue/5']
                  return (
                    <div key={i} style={{ marginLeft: `${depth * 24}px` }}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${colors[Math.min(depth - 1, 2)]}`}>
                      <span className="text-text-muted mt-0.5">{'└─'}</span>
                      <div>
                        <div className="text-sm text-text-primary">{item.system ?? item.name ?? item.type ?? JSON.stringify(item).slice(0, 60)}</div>
                        {item.probability !== undefined && (
                          <div className="text-xs text-text-muted">Probability: {(item.probability * 100).toFixed(0)}%</div>
                        )}
                        {item.impact && <div className="text-xs text-text-muted">{item.impact}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <pre className="text-xs text-text-muted font-mono overflow-auto p-3 bg-bg-elevated rounded-lg">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </Card>

          {/* Summary */}
          {result.summary && (
            <Card>
              <h3 className="text-sm font-semibold text-text-primary mb-3">Analysis Summary</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{result.summary}</p>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
