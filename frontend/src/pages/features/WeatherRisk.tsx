import { useEffect, useState } from 'react'
import { weatherAPI } from '../../lib/api'
import { Card, SectionHeader, Badge, Button, LoadingState, ErrorState, KPICard } from '../../components/ui'
import { CloudRain, Wind, Thermometer, AlertTriangle, ShieldCheck, Sun, CloudLightning } from 'lucide-react'

export default function WeatherRisk() {
  const [rainfallMm, setRainfallMm] = useState<number>(65.0)
  const [windSpeedKmh, setWindSpeedKmh] = useState<number>(35.0)
  const [temperatureC, setTemperatureC] = useState<number>(23.0)

  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyzeWeather = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await weatherAPI.analyze({
        rainfall_mm: Number(rainfallMm),
        wind_speed_kmh: Number(windSpeedKmh),
        temperature_c: Number(temperatureC),
      })
      setResult(res.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Weather analysis failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    analyzeWeather()
  }, [])

  return (
    <div className="space-y-6 animate-fade-in select-none">
      {/* ─── Control Header ─────────────────────────────────────────────────── */}
      <Card className="space-y-4">
        <SectionHeader
          title="Meteorological Risk & Weather Amplification Engine"
          subtitle="Non-linear hazard escalation index correlated with precipitation intensity, squall gusts, and localized urban drainage saturation"
          badge="Meteorological Intelligence"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
          {/* Rainfall Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <CloudRain size={14} className="text-accent-cyan" /> Precipitation Rate
              </span>
              <span className="font-mono text-accent-cyan font-bold">{rainfallMm} mm/h</span>
            </div>
            <input
              type="range"
              min={0}
              max={150}
              step={5}
              value={rainfallMm}
              onChange={(e) => setRainfallMm(parseFloat(e.target.value))}
              className="w-full accent-accent-cyan cursor-pointer"
            />
          </div>

          {/* Wind Speed Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <Wind size={14} className="text-accent-blue" /> Wind Velocity
              </span>
              <span className="font-mono text-accent-blue font-bold">{windSpeedKmh} km/h</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={2}
              value={windSpeedKmh}
              onChange={(e) => setWindSpeedKmh(parseFloat(e.target.value))}
              className="w-full accent-accent-blue cursor-pointer"
            />
          </div>

          {/* Temperature Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <Thermometer size={14} className="text-severity-high" /> Ambient Temp
              </span>
              <span className="font-mono text-severity-high font-bold">{temperatureC}°C</span>
            </div>
            <input
              type="range"
              min={10}
              max={45}
              step={1}
              value={temperatureC}
              onChange={(e) => setTemperatureC(parseFloat(e.target.value))}
              className="w-full accent-severity-high cursor-pointer"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            variant="cyan"
            loading={loading}
            icon={<CloudLightning size={16} />}
            onClick={analyzeWeather}
          >
            Compute Environmental Risk Multiplier
          </Button>
        </div>
      </Card>

      {/* ─── Risk Multiplier & Threat Hero ──────────────────────────────────── */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Threat Level Hero Card */}
          <Card className="lg:col-span-2 space-y-4">
            <SectionHeader
              title="Environmental Hazard Assessment"
              subtitle="Meteorological threat classification and system-wide multiplier"
            />

            {loading ? (
              <LoadingState message="Calculating storm runoff and amplification factors..." />
            ) : error ? (
              <ErrorState message={error} onRetry={analyzeWeather} />
            ) : (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-gradient-to-r from-bg-midnight to-surface-elevated border border-accent-cyan/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono text-text-muted uppercase">Threat Tier</span>
                    <h3 className="text-2xl font-black text-text-primary tracking-tight mt-1 flex items-center gap-2">
                      {result.threat_level || 'ELEVATED RISK'}
                    </h3>
                    <p className="text-xs text-text-secondary mt-1">
                      Hydrological amplification multiplier applied to all municipal drainage corridors.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-text-muted uppercase">Risk Multiplier</span>
                    <div className="text-4xl font-extrabold font-mono text-gradient-cyan">
                      {result.risk_multiplier}x
                    </div>
                  </div>
                </div>

                {/* Active Alerts */}
                {result.active_alerts && result.active_alerts.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-text-primary uppercase tracking-wider font-mono">
                      Active Meteorological Alerts
                    </p>
                    {result.active_alerts.map((alt: string, i: number) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl bg-severity-critical/15 border border-severity-critical/30 text-xs text-severity-critical font-medium flex items-center gap-2.5"
                      >
                        <AlertTriangle size={16} className="flex-shrink-0" />
                        <span>{alt}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Meteorological Vector Diagnostics */}
          <Card className="space-y-4">
            <SectionHeader title="Telemetry Metrics" subtitle="Atmospheric boundary conditions" />
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-subtle flex items-center justify-between">
                <span className="text-text-muted">Rainfall Rate</span>
                <span className="font-mono font-bold text-accent-cyan">{rainfallMm} mm/h</span>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-subtle flex items-center justify-between">
                <span className="text-text-muted">Wind Velocity</span>
                <span className="font-mono font-bold text-accent-blue">{windSpeedKmh} km/h</span>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-subtle flex items-center justify-between">
                <span className="text-text-muted">Ambient Temp</span>
                <span className="font-mono font-bold text-severity-high">{temperatureC}°C</span>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-subtle flex items-center justify-between">
                <span className="text-text-muted">Urban Saturation</span>
                <span className="font-mono font-bold text-severity-low">
                  {rainfallMm > 50 ? 'Saturated Soil' : 'Nominal Absorption'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
