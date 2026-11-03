import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { incidentsAPI } from '../../lib/api'
import { Card, SectionHeader, Button, Badge, LoadingState } from '../../components/ui'
import { 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  ClipboardCheck, 
  ExternalLink,
  Box,
  Copy,
  Info
} from 'lucide-react'

const SAMPLE_INCIDENTS = [
  {
    label: 'Flooding at Silk Board Junction',
    title: 'Severe Stormwater Backflow under Silk Board Flyover',
    description: 'Heavy precipitation is causing storm drain overflow, submerging two inner lanes with 2.5 feet of water and stalling low-clearance traffic.',
    incident_type: 'Flooding / Waterlogging',
    latitude: 12.9176,
    longitude: 77.6233,
    ward: 'Ward 174',
    zone: 'South Zone',
    severity_score: 8.5,
    affected_population: 3200,
    rainfall_mm: 68.0,
    wind_speed_kmh: 18.0,
    temperature_c: 22.5,
  },
  {
    label: 'Major Road Collapse near Hebbal',
    title: 'Pavement Cave-in and Structural Asphalt Subsidence',
    description: 'Deep circular sinkhole and structural road collapse reported near outer ring road service ramp, endangering vehicles.',
    incident_type: 'Road Damage',
    latitude: 13.0358,
    longitude: 77.5970,
    ward: 'Ward 7',
    zone: 'North Zone',
    severity_score: 7.8,
    affected_population: 1800,
    rainfall_mm: 12.0,
    wind_speed_kmh: 10.0,
    temperature_c: 26.0,
  },
  {
    label: 'Water Main Rupture in Indiranagar',
    title: 'High-Pressure Potable Trunk Pipeline Burst',
    description: '300mm arterial water supply main fractured under 100ft road, washing away sub-base ballast and flooding nearby basements.',
    incident_type: 'Water Supply Disruption',
    latitude: 12.9784,
    longitude: 77.6408,
    ward: 'Ward 82',
    zone: 'East Zone',
    severity_score: 6.9,
    affected_population: 4500,
    rainfall_mm: 0.0,
    wind_speed_kmh: 8.0,
    temperature_c: 27.5,
  },
]

const INCIDENT_TYPES = [
  'Flooding / Waterlogging',
  'Road Damage',
  'Sewer Overflow',
  'Water Supply Disruption',
  'Streetlight Failure',
  'Traffic Signal Failure',
  'Flyover / Bridge Defect',
  'Garbage Overflow',
  'Gas Leak',
  'Fire Hazard',
]

const ZONES = ['Central Zone', 'South Zone', 'North Zone', 'East Zone', 'West Zone']

export default function IncidentIntake() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: '',
    description: '',
    incident_type: INCIDENT_TYPES[0],
    latitude: '12.9716',
    longitude: '77.5946',
    ward: 'Ward 1',
    zone: ZONES[0],
    severity_score: 7.0,
    affected_population: 1000,
    rainfall_mm: 25.0,
    wind_speed_kmh: 12.0,
    temperature_c: 25.0,
    source_type: 'citizen',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submittedData, setSubmittedData] = useState<any>(null)
  const [copiedId, setCopiedId] = useState(false)

  // Load sample dataset template
  const loadSample = (sample: typeof SAMPLE_INCIDENTS[0]) => {
    setForm({
      ...form,
      title: sample.title,
      description: sample.description,
      incident_type: sample.incident_type,
      latitude: sample.latitude.toString(),
      longitude: sample.longitude.toString(),
      ward: sample.ward,
      zone: sample.zone,
      severity_score: sample.severity_score,
      affected_population: sample.affected_population,
      rainfall_mm: sample.rainfall_mm,
      wind_speed_kmh: sample.wind_speed_kmh,
      temperature_c: sample.temperature_c,
    })
    setErrors({})
    setSubmittedData(null)
  }

  // Inline Validation
  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!form.title.trim()) {
      newErrors.title = 'Incident title is mandatory (min 5 chars).'
    } else if (form.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters.'
    }

    if (!form.description.trim()) {
      newErrors.description = 'Detailed description is required (min 10 chars).'
    } else if (form.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters.'
    }

    const lat = parseFloat(form.latitude)
    if (isNaN(lat) || lat < 12.5 || lat > 13.5) {
      newErrors.latitude = 'Valid Bengaluru latitude required (approx 12.8 to 13.2).'
    }

    const lon = parseFloat(form.longitude)
    if (isNaN(lon) || lon < 77.2 || lon > 77.9) {
      newErrors.longitude = 'Valid Bengaluru longitude required (approx 77.4 to 77.8).'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setSubmittedData(null)

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        incident_type: form.incident_type,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        ward: form.ward,
        zone: form.zone,
        severity_score: Number(form.severity_score),
        affected_population: Number(form.affected_population),
        rainfall_mm: Number(form.rainfall_mm),
        wind_speed_kmh: Number(form.wind_speed_kmh),
        temperature_c: Number(form.temperature_c),
        source_type: form.source_type,
      }

      const res = await incidentsAPI.create(payload)
      setSubmittedData(res.data)
    } catch (err: any) {
      const detail = err.response?.data?.detail
      const msg = typeof detail === 'string' ? detail : err.message || 'Incident ingestion failed'
      setErrors({ form: msg })
    } finally {
      setSubmitting(false)
    }
  }

  const copyIncidentId = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  return (
    <div className="space-y-6 animate-fade-in select-none max-w-5xl mx-auto">
      {/* ─── Header & Sample Loader ─────────────────────────────────────────── */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SectionHeader
            title="Urban Incident Intake Pipeline"
            subtitle="Type-validated intake with automatic de-duplication, enrichment, and work-order generation"
            badge="FastAPI Intake Pipeline"
          />
        </div>

        {/* Quick Sample Selector */}
        <div className="p-3 rounded-2xl bg-surface-elevated/70 border border-border-standard space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
            <Sparkles size={14} className="text-accent-cyan" />
            <span>Load Verified Test Scenario (DEMO DATA)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_INCIDENTS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => loadSample(sample)}
                className="px-3 py-1.5 rounded-xl bg-bg-midnight/80 hover:bg-surface-elevated border border-border-standard hover:border-accent-cyan/50 text-xs text-text-secondary hover:text-text-primary font-medium transition-all"
              >
                [DEMO] {sample.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* ─── Success Confirmation Banner ────────────────────────────────────── */}
      {submittedData && submittedData.data && (
        <Card glow="cyan" className="space-y-4 animate-fade-in border-accent-cyan/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30 flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  Incident Ingested & Persisted
                </h3>
                <p className="text-xs text-text-muted">
                  Stored in SQLite operational store with foreign-key durability & WAL mode
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-accent-cyan bg-surface-elevated px-3 py-1.5 rounded-xl border border-border-standard flex items-center gap-2">
                ID: {submittedData.data.id}
                <button
                  onClick={() => copyIncidentId(submittedData.data.id)}
                  title="Copy Incident ID"
                  className="text-text-muted hover:text-text-primary"
                >
                  <Copy size={13} />
                </button>
              </span>
              {copiedId && <span className="text-[10px] text-severity-low font-mono">Copied!</span>}
            </div>
          </div>

          {/* Key Ingestion Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-surface-elevated border border-border-subtle">
              <span className="text-text-muted block text-[10px] uppercase font-mono">Status</span>
              <Badge variant="cyan" dot className="mt-1">
                {submittedData.data.status}
              </Badge>
            </div>
            <div className="p-3 rounded-xl bg-surface-elevated border border-border-subtle">
              <span className="text-text-muted block text-[10px] uppercase font-mono">Auto Work Order</span>
              <span className="font-mono text-accent-blue font-bold block mt-1">
                {submittedData.data.work_order?.id || 'WO-GENERATED'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-surface-elevated border border-border-subtle">
              <span className="text-text-muted block text-[10px] uppercase font-mono">Assigned Dept</span>
              <span className="text-text-primary font-medium block truncate mt-1">
                {submittedData.data.department || 'Municipal Operations'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-surface-elevated border border-border-subtle">
              <span className="text-text-muted block text-[10px] uppercase font-mono">Cascade Threat</span>
              <span className="text-severity-critical font-bold block mt-1">
                {submittedData.data.analysis?.prediction?.risk_tier || 'ASSESSED'}
              </span>
            </div>
          </div>

          {/* Quick Pivot Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border-subtle">
            <Button
              variant="cyan"
              size="sm"
              icon={<Box size={14} />}
              onClick={() => navigate('/map')}
            >
              Locate in 3D City
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<ClipboardCheck size={14} />}
              onClick={() => navigate('/operations/work-orders')}
            >
              Inspect Work Orders
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<ExternalLink size={14} />}
              onClick={() => navigate(`/features/relationship-graph?incident_id=${submittedData.data.id}`)}
            >
              View Ego Graph
            </Button>
          </div>
        </Card>
      )}

      {/* ─── Main Intake Form ───────────────────────────────────────────────── */}
      <Card className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {errors.form && (
            <div className="p-3 rounded-xl bg-severity-critical/15 border border-severity-critical/30 text-xs text-severity-critical flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{errors.form}</span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
              Incident Headline <span className="text-severity-critical">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Blocked storm drain causing carriageway inundation"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className={`w-full bg-surface-elevated border ${
                errors.title ? 'border-severity-critical' : 'border-border-standard'
              } rounded-xl px-3.5 py-2.5 text-sm text-text-primary input-focus`}
            />
            {errors.title && <p className="text-xs text-severity-critical">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
              Operational Description <span className="text-severity-critical">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Detailed physical observation of infrastructure failure, immediate impact, and environmental context..."
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className={`w-full bg-surface-elevated border ${
                errors.description ? 'border-severity-critical' : 'border-border-standard'
              } rounded-xl px-3.5 py-2.5 text-sm text-text-primary input-focus`}
            />
            {errors.description && <p className="text-xs text-severity-critical">{errors.description}</p>}
          </div>

          {/* Type & Zone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
                Incident Category
              </label>
              <select
                value={form.incident_type}
                onChange={(e) => setForm((p) => ({ ...p, incident_type: e.target.value }))}
                className="w-full bg-surface-elevated border border-border-standard rounded-xl px-3.5 py-2.5 text-sm text-text-primary input-focus cursor-pointer"
              >
                {INCIDENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
                City Municipal Zone
              </label>
              <select
                value={form.zone}
                onChange={(e) => setForm((p) => ({ ...p, zone: e.target.value }))}
                className="w-full bg-surface-elevated border border-border-standard rounded-xl px-3.5 py-2.5 text-sm text-text-primary input-focus cursor-pointer"
              >
                {ZONES.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Geospatial Coordinates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
                Latitude <span className="text-severity-critical">*</span>
              </label>
              <input
                type="number"
                step="0.0001"
                value={form.latitude}
                onChange={(e) => setForm((p) => ({ ...p, latitude: e.target.value }))}
                className={`w-full bg-surface-elevated border ${
                  errors.latitude ? 'border-severity-critical' : 'border-border-standard'
                } rounded-xl px-3 py-2 text-sm text-text-primary input-focus font-mono`}
              />
              {errors.latitude && <p className="text-xs text-severity-critical">{errors.latitude}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
                Longitude <span className="text-severity-critical">*</span>
              </label>
              <input
                type="number"
                step="0.0001"
                value={form.longitude}
                onChange={(e) => setForm((p) => ({ ...p, longitude: e.target.value }))}
                className={`w-full bg-surface-elevated border ${
                  errors.longitude ? 'border-severity-critical' : 'border-border-standard'
                } rounded-xl px-3 py-2 text-sm text-text-primary input-focus font-mono`}
              />
              {errors.longitude && <p className="text-xs text-severity-critical">{errors.longitude}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
                Ward / Sector
              </label>
              <input
                type="text"
                value={form.ward}
                onChange={(e) => setForm((p) => ({ ...p, ward: e.target.value }))}
                className="w-full bg-surface-elevated border border-border-standard rounded-xl px-3 py-2 text-sm text-text-primary input-focus font-mono"
              />
            </div>
          </div>

          {/* Severity & Population Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border-subtle">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider text-text-muted">Reported Severity</span>
                <span className="font-mono text-accent-cyan font-bold">{form.severity_score.toFixed(1)} / 10.0</span>
              </div>
              <input
                type="range"
                min={1.0}
                max={10.0}
                step={0.5}
                value={form.severity_score}
                onChange={(e) => setForm((p) => ({ ...p, severity_score: parseFloat(e.target.value) }))}
                className="w-full accent-accent-cyan cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider text-text-muted">Affected Population</span>
                <span className="font-mono text-accent-cyan font-bold">{form.affected_population.toLocaleString()} citizens</span>
              </div>
              <input
                type="range"
                min={50}
                max={10000}
                step={100}
                value={form.affected_population}
                onChange={(e) => setForm((p) => ({ ...p, affected_population: parseInt(e.target.value) }))}
                className="w-full accent-accent-cyan cursor-pointer"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="cyan"
              size="lg"
              className="w-full font-bold shadow-glow-cyan"
              loading={submitting}
              icon={<Send size={16} />}
            >
              Submit Validated Incident Intake
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
