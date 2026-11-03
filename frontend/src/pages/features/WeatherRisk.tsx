import { useState } from 'react'
import { weatherAPI } from '../../lib/api'
import { Card, LoadingState, ErrorState, SectionHeader, KPICard, Badge } from '../../components/ui'

const INCIDENT_TYPES = ['Road Damage', 'Flooding / Waterlogging', 'Streetlight Failure', 'Garbage Overflow', 'Water Supply Disruption', 'Gas Leak', 'Fire Hazard', 'Flyover / Bridge Defect', 'Sewer Overflow', 'Traffic Signal Failure']

export default function WeatherRisk() {
  const [form, setForm] = useState({
    incident_type: INCIDENT_TYPES[0],
    zone: 'Zone A',
    temperature_c: '28',
    rainfall_mm: '50',
    humidity_pct: '80',
    wind_speed_kmh: '20',
    weather_condition: 'rain',
    season: 'monsoon',
  })
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const run = async () => {
    setLoading(true); setError(''); setResult(null)
    try {
      const payload = {
        ...form,
        temperature_c: parseFloat(form.temperature_c),
        rainfall_mm: parseFloat(form.rainfall_mm),
        humidity_pct: parseFloat(form.humidity_pct),
        wind_speed_kmh: parseFloat(form.wind_speed_kmh),
      }
      const r = await weatherAPI.analyze(payload)
      setResult(r.data)
    } catch (e: any) { setError(e?.response?.data?.detail ?? e.message) }
    finally { setLoading(false) }
  }

  const riskColor = (level: string) =>
    ({ critical: '#FF5364', high: '#FF9955', medium: '#F3C767', low: '#46C99A', extreme: '#FF5364' }[level?.toLowerCase()] ?? '#73889D')

  const weatherIcon: Record<string, string> = {
    rain: '🌧', heavy_rain: '⛈', storm: '🌪', clear: '☀️', fog: '🌫', monsoon: '🌊',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Config */}
        <Card>
          <SectionHeader title="Weather Parameters" subtitle="Climate-correlated risk analysis" />
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
                <label className="block text-xs font-medium text-text-muted uppercase mb-1">Season</label>
                <select value={form.season} onChange={e => setForm(p => ({ ...p, season: e.target.value }))}
                  className="w-full bg-surface-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus">
                  {['monsoon', 'summer', 'winter', 'pre_monsoon', 'post_monsoon'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Temperature (°C)', key: 'temperature_c' },
                { label: 'Rainfall (mm)', key: 'rainfall_mm' },
                { label: 'Humidity (%)', key: 'humidity_pct' },
                { label: 'Wind Speed (km/h)', key: 'wind_speed_kmh' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-text-muted uppercase mb-1">{label}</label>
                  <input type="number" value={form[key as keyof typeof form]} step="0.1"
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    className="w-full bg-surface-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus" />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase mb-1">Weather Condition</label>
              <select value={form.weather_condition} onChange={e => setForm(p => ({ ...p, weather_condition: e.target.value }))}
                className="w-full bg-surface-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus">
                {['clear', 'rain', 'heavy_rain', 'storm', 'fog'].map(w => <option key={w}>{w}</option>)}
              </select>
            </div>
            <button onClick={run} disabled={loading}
              className="w-full py-2.5 bg-accent-cyan text-bg-main font-semibold rounded-lg hover:bg-accent-deep-cyan transition-colors disabled:opacity-50">
              {loading ? 'Analysing...' : 'Analyse Weather Risk →'}
            </button>
          </div>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {/* Current conditions panel */}
          <Card>
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Current Conditions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Temperature', val: `${form.temperature_c}°C` },
                { label: 'Rainfall', val: `${form.rainfall_mm} mm` },
                { label: 'Humidity', val: `${form.humidity_pct}%` },
                { label: 'Wind', val: `${form.wind_speed_kmh} km/h` },
              ].map(({ label, val }) => (
                <div key={label} className="p-3 rounded-lg bg-surface-elevated text-center">
                  <div className="text-lg font-bold text-accent-cyan">{val}</div>
                  <div className="text-xs text-text-muted">{label}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-center text-3xl">{weatherIcon[form.weather_condition] ?? '🌡'}</div>
          </Card>

          {loading && <LoadingState message="Running weather-risk correlation engine..." />}
          {error && <ErrorState message={error} onRetry={run} />}

          {result && !loading && (
            <>
              <Card>
                <div className="text-center py-6">
                  <div className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">Weather Risk Level</div>
                  <div className="text-5xl font-black mb-2" style={{ color: riskColor(result.weather_risk_level ?? result.risk_level) }}>
                    {(result.weather_risk_level ?? result.risk_level ?? '?').toUpperCase()}
                  </div>
                  <div className="text-text-muted text-sm">Risk Score: <span className="text-text-primary font-bold">{result.weather_risk_score?.toFixed?.(1) ?? result.risk_score?.toFixed?.(1) ?? '—'}</span> / 10</div>
                </div>
              </Card>

              {result.contributing_factors && (
                <Card>
                  <h3 className="text-sm font-semibold text-text-primary mb-3">Contributing Factors</h3>
                  <div className="space-y-2">
                    {Object.entries(result.contributing_factors as Record<string, number>).map(([factor, weight]) => (
                      <div key={factor}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-text-secondary capitalize">{factor.replace(/_/g, ' ')}</span>
                          <span className="text-text-muted font-mono">{(weight * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                          <div className="h-full bg-accent-blue rounded-full" style={{ width: `${weight * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {result.risk_alerts && (
                <Card>
                  <h3 className="text-sm font-semibold text-text-primary mb-3">Risk Alerts</h3>
                  <div className="space-y-2">
                    {(result.risk_alerts as string[]).map((alert, i) => (
                      <div key={i} className="flex gap-2 p-2.5 rounded-lg bg-status-high/5 border border-status-high/20">
                        <span className="text-status-high flex-shrink-0">⚠</span>
                        <span className="text-sm text-text-secondary">{alert}</span>
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
                <div className="text-4xl mb-3">⊛</div>
                <p className="text-sm">Configure weather conditions and run analysis</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
