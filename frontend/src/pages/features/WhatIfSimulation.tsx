import { useEffect, useState } from 'react'
import { simulationAPI } from '../../lib/api'
import { Card, SectionHeader, Badge, Button, LoadingState, ErrorState, KPICard } from '../../components/ui'
import { Sliders, CloudRain, Zap, TrendingUp, AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react'

const ZONES = ['South Zone', 'Central Zone', 'East Zone', 'West Zone', 'North Zone']

export default function WhatIfSimulation() {
  const [additionalRain, setAdditionalRain] = useState<number>(50.0)
  const [targetZone, setTargetZone] = useState<string>('South Zone')

  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runSimulation = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await simulationAPI.whatIf({
        additional_rain_mm: Number(additionalRain),
        target_zone: targetZone,
      })
      setResult(res.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'What-If simulation failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runSimulation()
  }, [])

  return (
    <div className="space-y-6 animate-fade-in select-none">
      {/* ─── Control Header ─────────────────────────────────────────────────── */}
      <Card className="space-y-4">
        <SectionHeader
          title="What-If Counterfactual Stress Testing Engine"
          subtitle="Simulate hypothetical meteorological shock and power-grid outage scenarios to forecast infrastructure tipping points"
          badge="Counterfactual Engine"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          {/* Rainfall Surge Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold uppercase tracking-wider text-text-muted">Simulated Rainfall Surge</span>
              <span className="font-mono text-accent-cyan font-bold">+{additionalRain} mm</span>
            </div>
            <input
              type="range"
              min={0}
              max={150}
              step={5}
              value={additionalRain}
              onChange={(e) => setAdditionalRain(parseFloat(e.target.value))}
              className="w-full accent-accent-cyan cursor-pointer"
            />
          </div>

          {/* Target Outage Zone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
              Target Infrastructure Zone
            </label>
            <select
              value={targetZone}
              onChange={(e) => setTargetZone(e.target.value)}
              className="w-full bg-surface-elevated border border-border-standard rounded-xl px-3.5 py-2 text-sm text-text-primary input-focus cursor-pointer font-medium"
            >
              {ZONES.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="cyan"
            loading={loading}
            icon={<Sliders size={16} />}
            onClick={runSimulation}
          >
            Execute Stress Test
          </Button>
        </div>
      </Card>

      {/* ─── Baseline vs. Projected Shock Metrics ───────────────────────────── */}
      {result && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Baseline City Incidents"
            value={result.baseline_incident_count ?? 125}
            subtitle="Pre-shock steady state"
            color="blue"
          />
          <KPICard
            title="Projected Inundation Zones"
            value={`+${result.rainfall_surge_simulation?.projected_additional_flood_zones ?? 0}`}
            subtitle={`At +${additionalRain}mm precipitation`}
            color="critical"
          />
          <KPICard
            title="Cascade Multiplier"
            value={`${result.rainfall_surge_simulation?.simulated_cascading_risk_multiplier ?? 1.0}x`}
            subtitle="Risk amplification index"
            color="high"
          />
          <KPICard
            title="Gridlock Forecast"
            value={`${result.power_grid_outage_simulation?.projected_secondary_traffic_gridlocks ?? 0} Nodes`}
            subtitle={`In ${targetZone}`}
            color="purple"
          />
        </div>
      )}

      {/* ─── Two-Column Comparative Deck ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rainfall Surge Scenario Card */}
        <Card className="space-y-4">
          <div className="flex items-center gap-3 pb-2 border-b border-border-subtle">
            <div className="p-2.5 rounded-xl bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30">
              <CloudRain size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Hydrological Inundation Model</h3>
              <p className="text-xs text-text-muted">Impact of +{additionalRain}mm sudden storm surge</p>
            </div>
          </div>

          {loading ? (
            <LoadingState message="Modeling hydrological runoff and drainage capacity..." />
          ) : error ? (
            <ErrorState message={error} onRetry={runSimulation} />
          ) : result?.rainfall_surge_simulation ? (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-subtle">
                  <span className="text-[10px] font-mono text-text-muted uppercase">Baseline Flooding Events</span>
                  <p className="text-2xl font-black font-mono text-text-primary mt-1">
                    {result.rainfall_surge_simulation.baseline_flooding_incidents}
                  </p>
                  <span className="text-[10px] text-text-secondary">Current historical reports</span>
                </div>
                <div className="p-3.5 rounded-xl bg-surface-elevated border border-severity-critical/30">
                  <span className="text-[10px] font-mono text-severity-critical uppercase">Projected Inundation</span>
                  <p className="text-2xl font-black font-mono text-severity-critical mt-1">
                    +{result.rainfall_surge_simulation.projected_additional_flood_zones} Zones
                  </p>
                  <span className="text-[10px] text-text-secondary">Overloaded drain capacity</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-standard flex items-center justify-between">
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-mono">Systemic Risk Factor</span>
                  <span className="text-sm font-bold text-text-primary">
                    Cascading Vulnerability Escalation
                  </span>
                </div>
                <Badge variant="critical" dot>
                  {result.rainfall_surge_simulation.simulated_cascading_risk_multiplier}x Risk Factor
                </Badge>
              </div>
            </div>
          ) : null}
        </Card>

        {/* Power Grid Shock Scenario Card */}
        <Card className="space-y-4">
          <div className="flex items-center gap-3 pb-2 border-b border-border-subtle">
            <div className="p-2.5 rounded-xl bg-accent-violet/15 text-accent-violet border border-accent-violet/30">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Grid Outage Stress Model</h3>
              <p className="text-xs text-text-muted">Substation failure impact in {targetZone}</p>
            </div>
          </div>

          {loading ? (
            <LoadingState message="Modeling electrical dependency propagation..." />
          ) : error ? (
            <ErrorState message={error} onRetry={runSimulation} />
          ) : result?.power_grid_outage_simulation ? (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-subtle">
                  <span className="text-[10px] font-mono text-text-muted uppercase">Current Zone Incidents</span>
                  <p className="text-2xl font-black font-mono text-text-primary mt-1">
                    {result.power_grid_outage_simulation.current_zone_incidents}
                  </p>
                  <span className="text-[10px] text-text-secondary">In {targetZone}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-surface-elevated border border-accent-violet/30">
                  <span className="text-[10px] font-mono text-accent-violet uppercase">Signal Gridlocks</span>
                  <p className="text-2xl font-black font-mono text-accent-violet mt-1">
                    {result.power_grid_outage_simulation.projected_secondary_traffic_gridlocks} Junctions
                  </p>
                  <span className="text-[10px] text-text-secondary">Dark signal cascade</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-standard flex items-center justify-between">
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-mono">Emergency Generator Demand</span>
                  <span className="text-sm font-bold text-text-primary">
                    Auxiliary Power Requirements
                  </span>
                </div>
                <Badge variant="purple" dot>
                  {result.power_grid_outage_simulation.estimated_emergency_generator_demand_units} Units Needed
                </Badge>
              </div>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  )
}
