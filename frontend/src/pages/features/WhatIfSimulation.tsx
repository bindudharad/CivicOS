import { useState } from 'react'
import { simulationAPI } from '../../lib/api'
import { Card, LoadingState, ErrorState, SectionHeader, KPICard, Badge } from '../../components/ui'

const INCIDENT_TYPES = ['Road Damage', 'Flooding / Waterlogging', 'Streetlight Failure', 'Garbage Overflow', 'Water Supply Disruption', 'Gas Leak', 'Fire Hazard', 'Flyover / Bridge Defect', 'Sewer Overflow', 'Traffic Signal Failure']

export default function WhatIfSimulation() {
  const [form, setForm] = useState({
    incident_type: INCIDENT_TYPES[0],
    zone: 'Zone A',
    severity: '7',
    response_time_hours: '2',
    resource_allocation: '50',
    preventive_measures_active: false,
    weather_condition: 'clear',
  })
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const run = async () => {
    setLoading(true); setError(''); setResult(null)
    try {
      const r = await simulationAPI.whatIf({
        ...form,
        severity: parseInt(form.severity),
        response_time_hours: parseFloat(form.response_time_hours),
        resource_allocation: parseInt(form.resource_allocation),
      })
      setResult(r.data)
    } catch (e: any) { setError(e?.response?.data?.detail ?? e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Config */}
        <Card>
          <SectionHeader title="Simulation Parameters" subtitle="Define scenario variables" />
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
                <label className="block text-xs font-medium text-text-muted uppercase mb-1">Severity</label>
                <input type="number" value={form.severity} min={1} max={10} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))}
                  className="w-full bg-surface-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase mb-1">Response Time (hrs)</label>
                <input type="number" value={form.response_time_hours} step={0.5} min={0.5} onChange={e => setForm(p => ({ ...p, response_time_hours: e.target.value }))}
                  className="w-full bg-surface-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase mb-1">Resource Allocation (%)</label>
                <input type="number" value={form.resource_allocation} min={10} max={100} onChange={e => setForm(p => ({ ...p, resource_allocation: e.target.value }))}
                  className="w-full bg-surface-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase mb-1">Weather Condition</label>
              <select value={form.weather_condition} onChange={e => setForm(p => ({ ...p, weather_condition: e.target.value }))}
                className="w-full bg-surface-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus">
                {['clear', 'rain', 'heavy_rain', 'storm', 'fog'].map(w => <option key={w}>{w}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.preventive_measures_active}
                onChange={e => setForm(p => ({ ...p, preventive_measures_active: e.target.checked }))}
                className="w-4 h-4 rounded border-border-standard bg-surface-elevated accent-accent-cyan" />
              <span className="text-sm text-text-secondary">Preventive measures active</span>
            </label>
            <button onClick={run} disabled={loading}
              className="w-full py-2.5 bg-accent-cyan text-bg-main font-semibold rounded-lg hover:bg-accent-deep-cyan transition-colors disabled:opacity-50">
              {loading ? 'Simulating...' : 'Run What-If Simulation →'}
            </button>
          </div>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {loading && <LoadingState message="Running scenario simulation engine..." />}
          {error && <ErrorState message={error} onRetry={run} />}
          {result && !loading && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Outcome Score', val: result.outcome_score ?? result.simulation_score },
                  { label: 'Resolution Time', val: result.resolution_time_hrs !== undefined ? `${result.resolution_time_hrs}h` : (result.estimated_resolution_hours !== undefined ? `${result.estimated_resolution_hours}h` : '—') },
                  { label: 'Resource Efficiency', val: result.resource_efficiency !== undefined ? `${(result.resource_efficiency * 100).toFixed(0)}%` : '—' },
                  { label: 'Cost Estimate', val: result.cost_estimate !== undefined ? `₹${Number(result.cost_estimate).toLocaleString()}` : '—' },
                ].map(({ label, val }) => (
                  <Card key={label} className="text-center p-4">
                    <div className="text-lg font-bold text-accent-cyan">{val ?? '—'}</div>
                    <div className="text-xs text-text-muted mt-1">{label}</div>
                  </Card>
                ))}
              </div>

              {result.scenario_comparison && (
                <Card>
                  <h3 className="text-sm font-semibold text-text-primary mb-4">Scenario Comparison</h3>
                  <div className="space-y-3">
                    {Object.entries(result.scenario_comparison as Record<string, any>).map(([key, val]) => (
                      <div key={key} className="flex justify-between items-center py-2 border-b border-border-subtle last:border-0">
                        <span className="text-sm text-text-secondary capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="text-sm font-mono text-accent-cyan">{typeof val === 'number' ? val.toFixed(2) : String(val)}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {result.insights && (
                <Card>
                  <h3 className="text-sm font-semibold text-text-primary mb-3">Simulation Insights</h3>
                  <div className="space-y-2">
                    {(result.insights as string[]).map((ins, i) => (
                      <div key={i} className="flex gap-2 text-sm text-text-secondary">
                        <span className="text-accent-cyan flex-shrink-0">›</span>{ins}
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
                <div className="text-4xl mb-3">⟳</div>
                <p className="text-sm">Configure a scenario and run the what-if simulation</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
