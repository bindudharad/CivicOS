import { useEffect, useState } from 'react'
import { scoringAPI, incidentsAPI, normalizeIncident, NormalizedIncident } from '../../lib/api'
import { Card, SectionHeader, Badge, Button, LoadingState, ErrorState, KPICard, SeverityBadge } from '../../components/ui'
import { Flame, ShieldAlert, ArrowUpRight, Zap, CheckCircle2 } from 'lucide-react'

export default function SmartPriority() {
  const [incidents, setIncidents] = useState<NormalizedIncident[]>([])
  const [selectedIncident, setSelectedIncident] = useState<NormalizedIncident | null>(null)
  const [evaluatedScore, setEvaluatedScore] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [evaluating, setEvaluating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    incidentsAPI.list({ limit: 15, sort: 'severity_desc' })
      .then((res) => {
        const raw = res.data?.data ?? res.data?.incidents ?? (Array.isArray(res.data) ? res.data : [])
        const norm = raw.map(normalizeIncident)
        setIncidents(norm)
        if (norm.length > 0) {
          setSelectedIncident(norm[0])
          evaluateIncidentPriority(norm[0])
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const evaluateIncidentPriority = async (inc: NormalizedIncident) => {
    setEvaluating(true)
    try {
      const res = await scoringAPI.evaluate({
        severity_score: inc.severity ?? 7.0,
        impact_radius_meters: 1000,
        affected_population: inc.affected_population ?? 100,
      })
      setEvaluatedScore(res.data)
    } catch (err: any) {
      console.error('Failed to compute priority', err)
    } finally {
      setEvaluating(false)
    }
  }

  const handleSelect = (inc: NormalizedIncident) => {
    setSelectedIncident(inc)
    evaluateIncidentPriority(inc)
  }

  return (
    <div className="space-y-6 animate-fade-in select-none">
      <Card>
        <SectionHeader
          title="Smart Priority Engine"
          subtitle="Dynamic priority scoring combining composite hazard, population radius, and dispatch urgency"
          badge="Priority Rank Algorithm"
        />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ranked Incident Queue */}
        <Card className="lg:col-span-2 space-y-4">
          <SectionHeader
            title="Operational Triage Queue"
            subtitle="Select an incident to evaluate its dynamic dispatch priority"
          />

          {loading ? (
            <LoadingState message="Loading operational incidents..." />
          ) : error ? (
            <ErrorState message={error} />
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {incidents.map((inc, i) => {
                const isSelected = selectedIncident?.id === inc.id
                return (
                  <div
                    key={inc.id}
                    onClick={() => handleSelect(inc)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-accent-blue/15 border-accent-cyan shadow-glow-cyan'
                        : 'bg-surface-elevated border-border-subtle hover:border-border-standard hover:bg-surface-hover'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-accent-cyan">
                          #{i + 1} {inc.id}
                        </span>
                        <Badge variant="cyan">{inc.incident_type}</Badge>
                      </div>
                      <p className="text-sm font-semibold text-text-primary max-w-md truncate">
                        {inc.title}
                      </p>
                      <p className="text-xs text-text-muted">
                        Zone: {inc.zone || 'Unassigned'} • {inc.affected_population !== null ? `${inc.affected_population.toLocaleString()} citizens` : 'Population unrecorded'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <SeverityBadge severity={inc.severity} />
                      <ArrowUpRight size={16} className={isSelected ? 'text-accent-cyan' : 'text-text-muted'} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Priority Evaluation Deck */}
        <Card className="space-y-4">
          <SectionHeader title="Priority Assessment" subtitle="Automated dispatch ranking" />

          {selectedIncident ? (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-surface-elevated border border-accent-cyan/30 space-y-2">
                <span className="text-[10px] font-mono text-accent-cyan uppercase">
                  Active Triage • {selectedIncident.id}
                </span>
                <p className="text-sm font-bold text-text-primary">{selectedIncident.title}</p>
                <div className="flex gap-2">
                  <Badge variant="cyan">{selectedIncident.zone || 'Zone unassigned'}</Badge>
                  <SeverityBadge severity={selectedIncident.severity} />
                </div>
              </div>

              {evaluating ? (
                <LoadingState message="Recalculating priority tier..." />
              ) : evaluatedScore ? (
                <div className="space-y-4">
                  {/* Priority Tier Display */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-bg-midnight to-surface-card border border-border-standard text-center space-y-1">
                    <span className="text-[10px] font-mono uppercase text-text-muted">Priority Score</span>
                    <div className="text-4xl font-black font-mono text-accent-blue">
                      {typeof evaluatedScore.smart_priority_score === 'number'
                        ? evaluatedScore.smart_priority_score.toFixed(1)
                        : evaluatedScore.smart_priority_score}
                    </div>
                    <Badge variant={evaluatedScore.smart_priority_score >= 80 ? 'critical' : 'high'} dot className="mt-1">
                      {evaluatedScore.smart_priority_score >= 80 ? 'P1 — Immediate Emergency Response' : 'P2 — Priority Dispatch'}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between py-1.5 border-b border-border-subtle">
                      <span className="text-text-muted">Composite Severity</span>
                      <span className="font-mono text-text-primary font-bold">
                        {typeof evaluatedScore.composite_severity === 'number'
                          ? evaluatedScore.composite_severity.toFixed(2)
                          : evaluatedScore.composite_severity}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-border-subtle">
                      <span className="text-text-muted">Prevention Potential</span>
                      <span className="font-mono text-severity-low font-bold">
                        {typeof evaluatedScore.prevention_impact_score === 'number'
                          ? evaluatedScore.prevention_impact_score.toFixed(1)
                          : evaluatedScore.prevention_impact_score}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-text-muted">Select an incident to triage.</p>
          )}
        </Card>
      </div>
    </div>
  )
}
