import { useState } from 'react'
import { recommendationsAPI } from '../../lib/api'
import { Card, LoadingState, ErrorState, SectionHeader, Badge } from '../../components/ui'

const INCIDENT_TYPES = ['Road Damage', 'Flooding / Waterlogging', 'Streetlight Failure', 'Garbage Overflow', 'Water Supply Disruption', 'Gas Leak', 'Fire Hazard', 'Flyover / Bridge Defect', 'Sewer Overflow', 'Traffic Signal Failure']

export default function PreventiveRecommendations() {
  const [incident_type, setType] = useState(INCIDENT_TYPES[0])
  const [severity, setSeverity] = useState('7')
  const [zone, setZone] = useState('Zone A')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const run = async () => {
    setLoading(true); setError(''); setResult(null)
    try {
      const r = await recommendationsAPI.get({ incident_type, severity: parseInt(severity), zone })
      setResult(r.data)
    } catch (e: any) { setError(e?.response?.data?.detail ?? e.message) }
    finally { setLoading(false) }
  }

  const priorityColor: Record<string, string> = {
    critical: 'critical', high: 'high', medium: 'medium', low: 'low', immediate: 'critical',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="bg-surface-elevated">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase mb-1">Incident Type</label>
            <select value={incident_type} onChange={e => setType(e.target.value)}
              className="w-56 bg-bg-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus">
              {INCIDENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase mb-1">Severity</label>
            <input type="number" value={severity} onChange={e => setSeverity(e.target.value)} min={1} max={10}
              className="w-24 bg-bg-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus" />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase mb-1">Zone</label>
            <select value={zone} onChange={e => setZone(e.target.value)}
              className="w-32 bg-bg-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus">
              {['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E'].map(z => <option key={z}>{z}</option>)}
            </select>
          </div>
          <button onClick={run} disabled={loading}
            className="px-5 py-2 bg-accent-cyan text-bg-main font-semibold rounded-lg hover:bg-accent-deep-cyan transition-colors disabled:opacity-50">
            {loading ? 'Generating...' : 'Get Recommendations →'}
          </button>
        </div>
      </Card>

      {loading && <LoadingState message="Generating AI action playbook..." />}
      {error && <ErrorState message={error} onRetry={run} />}

      {result && !loading && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-accent-cyan">
                {result.recommendations?.length ?? result.actions?.length ?? Object.keys(result).length}
              </div>
              <div className="text-xs text-text-muted mt-1">Actions Generated</div>
            </Card>
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-status-medium">{result.prevention_score?.toFixed?.(1) ?? '—'}</div>
              <div className="text-xs text-text-muted mt-1">Prevention Score</div>
            </Card>
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-status-low">{result.estimated_cost_reduction !== undefined ? `${result.estimated_cost_reduction}%` : '—'}</div>
              <div className="text-xs text-text-muted mt-1">Cost Reduction Est.</div>
            </Card>
          </div>

          <Card>
            <SectionHeader title="Action Playbook" subtitle={`AI-generated preventive recommendations for ${incident_type}`} />
            <div className="space-y-3">
              {(result.recommendations ?? result.actions ?? []).map((action: any, i: number) => {
                const isStr = typeof action === 'string'
                return (
                  <div key={i} className="flex gap-4 p-4 rounded-xl bg-surface-elevated border border-border-subtle hover:border-border-standard transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan text-sm font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      {isStr ? (
                        <p className="text-sm text-text-secondary">{action}</p>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-text-primary">{action.title ?? action.action ?? action.name ?? 'Action'}</h4>
                            {action.priority && (
                              <Badge variant={(priorityColor[action.priority?.toLowerCase()] ?? 'neutral') as any} size="sm">
                                {action.priority}
                              </Badge>
                            )}
                          </div>
                          {action.description && <p className="text-sm text-text-secondary">{action.description}</p>}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {action.timeline && <span className="text-xs text-text-muted">⏱ {action.timeline}</span>}
                            {action.cost_estimate && <span className="text-xs text-text-muted">₹ {action.cost_estimate}</span>}
                            {action.department && <Badge variant="neutral" size="sm">{action.department}</Badge>}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </>
      )}
      {!result && !loading && !error && (
        <Card>
          <div className="text-center py-12 text-text-muted">
            <div className="text-4xl mb-3">⬙</div>
            <p className="text-sm">Select incident type and generate the AI action playbook</p>
          </div>
        </Card>
      )}
    </div>
  )
}
