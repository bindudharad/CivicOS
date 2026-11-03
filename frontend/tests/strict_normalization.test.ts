import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  normalizeIncident,
  normalizeHotspot,
  normalizeWorkOrder,
  isValidCoordinate,
  parseNullableNumber,
  parseNullableIsoDate,
} from '../src/lib/api.ts'

describe('CivicOS V3.1.3 Strict Normalization & Geospatial Integrity', () => {
  // Case 1: Complete valid incident
  it('Case 1: Complete valid incident parses all fields correctly', () => {
    const raw = {
      id: 'INC-2001',
      title: 'Water Main Rupture',
      description: 'Major leak on MG Road',
      incident_type: 'Infrastructure',
      category: 'Water',
      zone: 'East Zone',
      ward: 'Ward 82',
      severity_score: 7.8,
      status: 'IN_PROGRESS',
      latitude: 12.9750,
      longitude: 77.6010,
      affected_population: 450,
      created_at: '2026-11-03T08:30:00.000Z',
    }
    const norm = normalizeIncident(raw)
    assert.strictEqual(norm.id, 'INC-2001')
    assert.strictEqual(norm.title, 'Water Main Rupture')
    assert.strictEqual(norm.zone, 'East Zone')
    assert.strictEqual(norm.ward, 'Ward 82')
    assert.strictEqual(norm.severity, 7.8)
    assert.strictEqual(norm.status, 'in_progress')
    assert.strictEqual(norm.latitude, 12.9750)
    assert.strictEqual(norm.longitude, 77.6010)
    assert.strictEqual(norm.has_valid_location, true)
    assert.strictEqual(norm.affected_population, 450)
    assert.strictEqual(norm.created_at, '2026-11-03T08:30:00.000Z')
  })

  // Case 2: Missing latitude
  it('Case 2: Missing latitude results in null coordinates (never fabricates defaults)', () => {
    const raw = {
      id: 'INC-2002',
      title: 'Missing Latitude',
      latitude: null,
      longitude: 77.5946,
    }
    const norm = normalizeIncident(raw)
    assert.strictEqual(norm.latitude, null)
    assert.strictEqual(norm.longitude, null)
    assert.strictEqual(norm.has_valid_location, false)
  })

  // Case 3: Missing longitude
  it('Case 3: Missing longitude results in null coordinates', () => {
    const raw = {
      id: 'INC-2003',
      title: 'Missing Longitude',
      latitude: 12.9716,
      longitude: null,
    }
    const norm = normalizeIncident(raw)
    assert.strictEqual(norm.latitude, null)
    assert.strictEqual(norm.longitude, null)
    assert.strictEqual(norm.has_valid_location, false)
  })

  // Case 4: Invalid coordinates (out-of-bounds, NaN)
  it('Case 4: Out-of-bounds or NaN coordinates result in null', () => {
    const outOfBounds = normalizeIncident({
      id: 'INC-2004A',
      latitude: 195.4, // invalid lat > 90
      longitude: 77.5946,
    })
    assert.strictEqual(outOfBounds.latitude, null)
    assert.strictEqual(outOfBounds.longitude, null)
    assert.strictEqual(outOfBounds.has_valid_location, false)

    const nanCoords = normalizeIncident({
      id: 'INC-2004B',
      latitude: 'not-a-number',
      longitude: 77.5946,
    })
    assert.strictEqual(nanCoords.latitude, null)
    assert.strictEqual(nanCoords.longitude, null)
    assert.strictEqual(nanCoords.has_valid_location, false)
  })

  // Case 5: Missing timestamp
  it('Case 5: Missing timestamp results in null (never substitutes current time)', () => {
    const raw = {
      id: 'INC-2005',
      title: 'No timestamp',
      created_at: null,
    }
    const norm = normalizeIncident(raw)
    assert.strictEqual(norm.created_at, null)
  })

  // Case 6: Invalid timestamp
  it('Case 6: Invalid timestamp string returns null', () => {
    const raw = {
      id: 'INC-2006',
      title: 'Invalid timestamp',
      created_at: 'garbage-date-format',
    }
    const norm = normalizeIncident(raw)
    assert.strictEqual(norm.created_at, null)
  })

  // Case 7: Missing severity (null)
  it('Case 7: Missing severity returns null (never converted to 0 or 6.0)', () => {
    const raw = {
      id: 'INC-2007',
      title: 'Unassessed Hazard',
      severity_score: null,
    }
    const norm = normalizeIncident(raw)
    assert.strictEqual(norm.severity, null)
  })

  // Case 8: Severity exactly zero
  it('Case 8: Legitimate severity 0 is preserved as 0 (not converted to null)', () => {
    const raw = {
      id: 'INC-2008',
      title: 'Benign Informational Notice',
      severity_score: 0,
    }
    const norm = normalizeIncident(raw)
    assert.strictEqual(norm.severity, 0)
    assert.notStrictEqual(norm.severity, null)
  })

  // Case 9: Missing population
  it('Case 9: Missing population returns null; population 0 is preserved as 0', () => {
    const missingPop = normalizeIncident({
      id: 'INC-2009A',
      affected_population: null,
    })
    assert.strictEqual(missingPop.affected_population, null)

    const zeroPop = normalizeIncident({
      id: 'INC-2009B',
      affected_population: 0,
    })
    assert.strictEqual(zeroPop.affected_population, 0)
    assert.notStrictEqual(zeroPop.affected_population, null)
  })

  // Case 10: Missing hotspot metrics
  it('Case 10: Hotspot with missing fields has null properties and has_valid_location=false', () => {
    const raw = {
      cluster_id: 42,
    }
    const norm = normalizeHotspot(raw)
    assert.strictEqual(norm.cluster_id, 42)
    assert.strictEqual(norm.center_lat, null)
    assert.strictEqual(norm.center_lon, null)
    assert.strictEqual(norm.incident_count, null)
    assert.strictEqual(norm.avg_severity, null)
    assert.strictEqual(norm.dominant_type, null)
    assert.strictEqual(norm.zone, null)
    assert.strictEqual(norm.has_valid_location, false)
  })

  // Case 11: Missing work-order metadata
  it('Case 11: Work order with missing metadata has explicit null fields', () => {
    const raw = {
      id: 'WO-999',
      incident_id: 'INC-2001',
    }
    const norm = normalizeWorkOrder(raw)
    assert.strictEqual(norm.id, 'WO-999')
    assert.strictEqual(norm.incident_id, 'INC-2001')
    assert.strictEqual(norm.department, null)
    assert.strictEqual(norm.status, null)
    assert.strictEqual(norm.assignee, null)
    assert.strictEqual(norm.instructions, null)
    assert.strictEqual(norm.resolution_evidence, null)
    assert.strictEqual(norm.created_at, null)
    assert.strictEqual(norm.updated_at, null)
  })

  // Case 12: Empty API response
  it('Case 12: Completely empty raw object returns safe models without throwing or fabricating', () => {
    const normInc = normalizeIncident({})
    assert.strictEqual(normInc.latitude, null)
    assert.strictEqual(normInc.longitude, null)
    assert.strictEqual(normInc.zone, null)
    assert.strictEqual(normInc.ward, null)
    assert.strictEqual(normInc.severity, null)
    assert.strictEqual(normInc.affected_population, null)
    assert.strictEqual(normInc.created_at, null)
    assert.strictEqual(normInc.has_valid_location, false)

    const normHs = normalizeHotspot({})
    assert.strictEqual(normHs.center_lat, null)
    assert.strictEqual(normHs.center_lon, null)
    assert.strictEqual(normHs.incident_count, null)
    assert.strictEqual(normHs.avg_severity, null)
    assert.strictEqual(normHs.dominant_type, null)
    assert.strictEqual(normHs.zone, null)
    assert.strictEqual(normHs.has_valid_location, false)

    const normWo = normalizeWorkOrder({})
    assert.strictEqual(normWo.department, null)
    assert.strictEqual(normWo.status, null)
    assert.strictEqual(normWo.assignee, null)
    assert.strictEqual(normWo.created_at, null)
    assert.strictEqual(normWo.updated_at, null)
  })
})
