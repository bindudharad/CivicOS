import { useState } from 'react'
import { scoringAPI } from '../../lib/api'
import { Card, LoadingState, ErrorState, SectionHeader, KPICard, Badge } from '../../components/ui'

const INCIDENT_TYPES = ['Road Damage', 'Flooding / Waterlogging', 'Streetlight Failure', 'Garbage Overflow', 'Water Supply Disruption', 'Gas Leak', 'Fire Hazard', 'Flyover / Bridge Defect', 'Sewer Overflow', 'Traffic Signal Failure']

export default function SmartPriority() {
  const [incident_type, setType] = useState(INCIDENT_TYPES[0])
  const [severity, setSeverity] = useState('7')
  const [population, setPopulation] = useState('1000')
  const [infrastructure, setInfra] = useState('7')
  const [zone, setZone] = useState('Zone A')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const run = async () => {
    setLoading(true); setError(''); setResult(null)
    try {
      const r = await scoringAPI.evaluate({
        incident_type, zone,
        reported_severity: parseInt(severity),
        affected_population: parseInt(population),
        infrastructure_criticality: parseInt(infrastructure),
        economic_impact_estimate: parseInt(population) * 100,
        environmental_impact: 5, social_disruption: 5, resolution_complexity: 5,
      })
      setResult(r.data)
    } catch (e: any) { setError(e?.response?.data?.detail ?? e.message) }
    finally { setLoading(false) }
  }

  const getPriorityColor = (p: string) => ({
    P1: '#FF5364', P2: '#FF9955', P3: '#F3C767', P4: '#46C99A'
  }[p?.toUpperCase()] ?? '#73889D')

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionHeader title="Priority Input" subtitle="AI-driven priority computation" />
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase mb-1">Incident Type</label>
              <select value={incident_type} onChange={e => setType(e.target.value)}
                className="w-full bg-surface-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus">
                {INCIDENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            {[
              { label: 'Severity (1-10)', val: severity, set: setSeverity },
              { label: 'Affected Population', val: population, set: setPopulation },
              { label: 'Infrastructure Criticality (1-10)', val: infrastructure, set: setInfra },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <label className="block text-xs font-medium text-text-muted uppercase mb-1">{label}</label>
                <input type="number" value={val} onChange={e => set(e.target.value)}
                  className="w-full bg-surface-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase mb-1">Zone</label>
              <select value={zone} onChange={e => setZone(e.target.value)}
                className="w-full bg-surface-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus">
                {['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E'].map(z => <option key={z}>{z}</option>)}
              </select>
            </div>
            <button onClick={run} disabled={loading}
              className="w-full py-2.5 bg-accent-cyan text-bg-main font-semibold rounded-lg hover:bg-accent-deep-cyan transition-colors disabled:opacity-50">
              {loading ? 'Computing...' : 'Compute Smart Priority →'}
            </button>
          </div>
        </Card>

        <div className="space-y-4">
          {loading && <LoadingState message="Running smart priority engine..." />}
          {error && <ErrorState message={error} onRetry={run} />}
          {result && !loading && (
            <>
              <Card>
                <div className="text-center py-8">
                  <div className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">Priority Level</div>
                  <div className="text-6xl font-black mb-3" style={{ color: getPriorityColor(result.priority_level ?? result.priority) }}>
                    {result.priority_level ?? result.priority ?? 'P?'}
                  </div>
                  <div className="text-text-muted text-sm">Smart Priority Score: <span className="text-text-primary font-bold">{result.composite_score?.toFixed?.(1) ?? result.priority_score?.toFixed?.(1) ?? '—'}</span></div>
                </div>
              </Card>
              {result.score_breakdown && (
                <Card>
                  <h3 className="text-sm font-semibold text-text-primary mb-4">Priority Dimensions</h3>
                  <div className="space-y-3">
                    {Object.entries(result.score_breakdown as Record<string, number>).map(([k, v]) => (
                      <div key={k} className="flex items-center gap-3">
                        <div className="text-xs text-text-secondary capitalize w-32 flex-shrink-0">{k.replace(/_/g, ' ')}</div>
                        <div className="flex-1 h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                          <div className="h-full bg-accent-cyan rounded-full" style={{ width: `${(v / 10) * 100}%` }} />
                        </div>
                        <div className="text-xs text-text-muted font-mono w-8 text-right">{v?.toFixed?.(1)}</div>
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
                <div className="text-4xl mb-3">▲</div>
                <p className="text-sm">Compute priority to see AI ranking</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
