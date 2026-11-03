import { useEffect, useState } from 'react'
import { mlAPI } from '../../lib/api'
import { Card, LoadingState, ErrorState, SectionHeader, KPICard, Badge } from '../../components/ui'

const INCIDENT_TYPES = ['Road Damage', 'Flooding / Waterlogging', 'Streetlight Failure', 'Garbage Overflow', 'Water Supply Disruption', 'Gas Leak', 'Fire Hazard', 'Flyover / Bridge Defect', 'Sewer Overflow', 'Traffic Signal Failure']
const CATEGORIES = ['Infrastructure', 'Utilities', 'Safety', 'Sanitation', 'Environment', 'Transport']
const ZONES = ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E']

export default function PredictiveML() {
  const [form, setForm] = useState({
    incident_type: INCIDENT_TYPES[0],
    category: CATEGORIES[0],
    zone: ZONES[0],
    latitude: '12.97',
    longitude: '77.59',
    reported_hour: '10',
    day_of_week: '1',
    month: '6',
    temperature_c: '28',
    rainfall_mm: '5',
    historical_incident_count: '10',
  })
  const [result, setResult] = useState<any>(null)
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMetrics, setLoadingMetrics] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    mlAPI.metrics()
      .then(r => setMetrics(r.data))
      .catch(() => {})
      .finally(() => setLoadingMetrics(false))
  }, [])

  const f = (k: string) => ({
    value: form[k as keyof typeof form],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }))
  })

  const run = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const payload = {
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        reported_hour: parseInt(form.reported_hour),
        day_of_week: parseInt(form.day_of_week),
        month: parseInt(form.month),
        temperature_c: parseFloat(form.temperature_c),
        rainfall_mm: parseFloat(form.rainfall_mm),
        historical_incident_count: parseInt(form.historical_incident_count),
      }
      const r = await mlAPI.predict(payload)
      setResult(r.data)
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e.message)
    } finally {
      setLoading(false)
    }
  }

  const riskColor = (level: string) =>
    ({ critical: '#FF5364', high: '#FF9955', medium: '#F3C767', low: '#46C99A' }[level?.toLowerCase()] ?? '#73889D')

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Model metrics */}
      {!loadingMetrics && metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Test Accuracy" value={`${((metrics.test_accuracy ?? 0) * 100).toFixed(1)}%`} icon={<span>⬡</span>} color="cyan" />
          <KPICard title="Train Accuracy" value={`${((metrics.train_accuracy ?? 0) * 100).toFixed(1)}%`} icon={<span>◉</span>} color="blue" />
          <KPICard title="Estimators" value={metrics.n_estimators ?? '—'} icon={<span>◈</span>} color="purple" />
          <KPICard title="Features" value={metrics.n_features ?? '—'} icon={<span>▲</span>} color="low" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input form */}
        <Card>
          <SectionHeader title="Prediction Input" subtitle="Configure incident parameters" />
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
                <label className="block text-xs font-medium text-text-muted uppercase mb-1">Category</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full bg-surface-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus">
                  {CATEGORIES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase mb-1">Zone</label>
                <select value={form.zone} onChange={e => setForm(p => ({ ...p, zone: e.target.value }))}
                  className="w-full bg-surface-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus">
                  {ZONES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Latitude', key: 'latitude', step: '0.001' },
                { label: 'Longitude', key: 'longitude', step: '0.001' },
              ].map(({ label, key, step }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-text-muted uppercase mb-1">{label}</label>
                  <input type="number" step={step} {...f(key)}
                    className="w-full bg-surface-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Hour (0-23)', key: 'reported_hour' },
                { label: 'Day (0=Mon)', key: 'day_of_week' },
                { label: 'Month', key: 'month' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-text-muted uppercase mb-1">{label}</label>
                  <input type="number" {...f(key)}
                    className="w-full bg-surface-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Temp (°C)', key: 'temperature_c' },
                { label: 'Rainfall (mm)', key: 'rainfall_mm' },
                { label: 'Historical Count', key: 'historical_incident_count' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-text-muted uppercase mb-1">{label}</label>
                  <input type="number" step="0.1" {...f(key)}
                    className="w-full bg-surface-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus" />
                </div>
              ))}
            </div>
            <button onClick={run} disabled={loading}
              className="w-full py-2.5 bg-accent-cyan text-bg-main font-semibold rounded-lg hover:bg-accent-deep-cyan transition-colors disabled:opacity-50">
              {loading ? 'Running Prediction...' : 'Predict Risk Level →'}
            </button>
          </div>
        </Card>

        {/* Result */}
        <div className="space-y-4">
          {loading && <LoadingState message="Running RandomForest classifier..." />}
          {error && <ErrorState message={error} onRetry={run} />}
          {result && !loading && (
            <>
              <Card>
                <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Prediction Result</h3>
                <div className="text-center py-6">
                  <div className="text-5xl font-black mb-2" style={{ color: riskColor(result.risk_level) }}>
                    {result.risk_level?.toUpperCase() ?? 'UNKNOWN'}
                  </div>
                  <div className="text-text-muted text-sm mb-4">Predicted Risk Level</div>
                  {result.confidence !== undefined && (
                    <div>
                      <div className="text-xs text-text-muted mb-2">Model Confidence: {(result.confidence * 100).toFixed(1)}%</div>
                      <div className="w-full h-2 bg-surface-elevated rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{
                          width: `${result.confidence * 100}%`,
                          background: riskColor(result.risk_level),
                        }} />
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {result.class_probabilities && (
                <Card>
                  <h3 className="text-sm font-semibold text-text-primary mb-4">Class Probabilities</h3>
                  <div className="space-y-3">
                    {Object.entries(result.class_probabilities as Record<string, number>).map(([cls, prob]) => (
                      <div key={cls}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="capitalize text-text-secondary">{cls}</span>
                          <span className="font-mono text-text-muted">{(prob * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${prob * 100}%`, background: riskColor(cls) }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {result.feature_importance && (
                <Card>
                  <h3 className="text-sm font-semibold text-text-primary mb-4">Top Feature Importance</h3>
                  <div className="space-y-2">
                    {Object.entries(result.feature_importance as Record<string, number>)
                      .sort((a, b) => b[1] - a[1]).slice(0, 8).map(([feat, imp]) => (
                        <div key={feat}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-text-secondary font-mono">{feat}</span>
                            <span className="text-text-muted">{(imp * 100).toFixed(1)}%</span>
                          </div>
                          <div className="h-1 bg-surface-elevated rounded-full overflow-hidden">
                            <div className="h-full bg-accent-blue rounded-full" style={{ width: `${imp * 100}%` }} />
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
                <div className="text-4xl mb-3">⬡</div>
                <p className="text-sm">Configure parameters and run prediction to see ML results</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
