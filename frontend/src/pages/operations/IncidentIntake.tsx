import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { incidentsAPI } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { Card, SectionHeader, Button, Badge } from '../../components/ui'

const INCIDENT_TYPES = [
  'Road Damage',
  'Flooding / Waterlogging',
  'Streetlight Failure',
  'Garbage Overflow',
  'Water Supply Disruption',
  'Gas Leak',
  'Fire Hazard',
  'Flyover / Bridge Defect',
  'Sewer Overflow',
  'Traffic Signal Failure',
]

const CATEGORIES = ['Infrastructure', 'Utilities', 'Safety', 'Sanitation', 'Transport', 'Environment']
const ZONES = ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E']

export default function IncidentIntake() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [incidentType, setIncidentType] = useState(INCIDENT_TYPES[0])
  const [category, setCategory] = useState(CATEGORIES[0])
  const [zone, setZone] = useState(ZONES[0])
  const [severity, setSeverity] = useState(5)
  const [latitude, setLatitude] = useState(12.9716)
  const [longitude, setLongitude] = useState(77.5946)
  const [populationImpact, setPopulationImpact] = useState(100)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successResult, setSuccessResult] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessResult(null)

    const payload = {
      title,
      description,
      incident_type: incidentType,
      category,
      zone,
      severity: Number(severity),
      latitude: Number(latitude),
      longitude: Number(longitude),
      population_impact: Number(populationImpact),
    }

    try {
      const res = await incidentsAPI.create(payload)
      setSuccessResult(res.data)
      // reset form
      setTitle('')
      setDescription('')
    } catch (err: any) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail || 'Failed to submit incident intake'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Operational Incident Intake</h2>
          <p className="text-sm text-text-muted">Direct intake pipeline with duplicate detection & work-order routing</p>
        </div>
        <Badge variant={user ? 'cyan' : 'neutral'} size="md">
          Role: {user?.role || 'Guest'}
        </Badge>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-status-critical/10 border border-status-critical/30 text-status-critical text-sm">
          <strong>Intake Error:</strong> {error}
        </div>
      )}

      {successResult && (
        <Card className="border-accent-cyan/40 bg-surface-elevated glow-cyan">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-accent-cyan/20 border border-accent-cyan flex items-center justify-center text-accent-cyan font-bold text-lg">
              ✓
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="text-base font-bold text-text-primary">Incident Registered Successfully</h3>
              <p className="text-sm text-text-secondary">
                {successResult.message || 'Incident successfully evaluated and dispatched through the intelligence pipeline.'}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 text-xs">
                <div className="bg-bg-main p-2 rounded border border-border-subtle">
                  <span className="text-text-muted block">Incident ID</span>
                  <span className="font-mono text-accent-cyan font-bold">#{successResult.incident?.id || successResult.id || 'N/A'}</span>
                </div>
                <div className="bg-bg-main p-2 rounded border border-border-subtle">
                  <span className="text-text-muted block">Status</span>
                  <span className="font-semibold text-text-primary">{successResult.incident?.status || successResult.status || 'Active'}</span>
                </div>
                <div className="bg-bg-main p-2 rounded border border-border-subtle">
                  <span className="text-text-muted block">Work Order</span>
                  <span className="font-mono text-status-medium font-bold">
                    {successResult.work_order ? `#WO-${successResult.work_order.id || successResult.work_order_id}` : 'Pending Assignment'}
                  </span>
                </div>
                <div className="bg-bg-main p-2 rounded border border-border-subtle">
                  <span className="text-text-muted block">Duplicate Check</span>
                  <span className="text-status-low font-semibold">{successResult.duplicate_detected ? 'Duplicate Flagged' : 'Unique Intake'}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Incident Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Major Water Pipe Burst on Indiranagar 100ft Rd"
                className="w-full bg-surface-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Incident Type *
              </label>
              <select
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value)}
                className="w-full bg-surface-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus"
              >
                {INCIDENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Detailed Description *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact field observations, physical markers, and risk factors..."
              className="w-full bg-surface-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-surface-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Zone Area
              </label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full bg-surface-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus"
              >
                {ZONES.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Severity Score (1 - 10): <span className="font-mono text-accent-cyan">{severity}</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={severity}
                onChange={(e) => setSeverity(Number(e.target.value))}
                className="w-full accent-accent-cyan cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Latitude (Bengaluru Grid)
              </label>
              <input
                type="number"
                step="0.0001"
                value={latitude}
                onChange={(e) => setLatitude(Number(e.target.value))}
                className="w-full bg-surface-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Longitude (Bengaluru Grid)
              </label>
              <input
                type="number"
                step="0.0001"
                value={longitude}
                onChange={(e) => setLongitude(Number(e.target.value))}
                className="w-full bg-surface-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Estimated People Impacted
              </label>
              <input
                type="number"
                min="0"
                value={populationImpact}
                onChange={(e) => setPopulationImpact(Number(e.target.value))}
                className="w-full bg-surface-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setTitle('Waterlogging near Silk Board Junction')
                setDescription('Severe flash flood blocking lower 2 lanes towards Outer Ring Road.')
                setIncidentType('Flooding / Waterlogging')
                setCategory('Infrastructure')
                setZone('Zone B')
                setSeverity(8)
                setLatitude(12.9172)
                setLongitude(77.6228)
                setPopulationImpact(5000)
              }}
            >
              Fill Sample Data
            </Button>
            <Button variant="primary" type="submit" loading={loading}>
              Submit Incident Intake →
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
