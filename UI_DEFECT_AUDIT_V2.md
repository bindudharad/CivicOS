# CivicOS V2 Urban Pulse — UI Defect Audit Report

**Date:** November 3, 2026  
**System:** CivicOS AI-Powered Urban Intelligence Command Center  
**Branch:** `feat/ui-v2-urban-pulse`  
**Checkpoint:** `3beb0af`  
**Audit Scope:** Video recording visual defect analysis, root cause diagnosis, and structural remediation across frontend services and visualization components.

---

## Executive Summary

A comprehensive forensic audit of the previous React UI implementation was conducted based on screen recording evidence (1918×1078 viewport). Seven critical visual and functional defects were identified that severely impaired operational usability, data integrity, and visual fidelity.

All seven defects have been systematically investigated, remediated at the root cause, and verified through automated end-to-end browser testing.

---

## Defect Breakdown and Remediation Matrix

### Issue 1 — 3D City Map Darkness & Usability Failure
* **Observed Defect:**
  * Procedural city buildings were rendered in near-black `#102235` wireframe/cube meshes against a dark background, resulting in almost complete invisibility.
  * Incident beacon markers were dim red points with zero volumetric glow or pulse animation.
  * Scene lighting was inadequate (weak ambient light at 0.4 intensity and single directional light at 0.6).
  * Missing road networks, district demarcations, and environmental grid.
  * No user orbit or zoom controls; camera was trapped in rigid auto-rotation.
  * Lacked interactive raycasting, hover highlights, and incident detail inspector drawer.
* **Root Cause:**
  * Minimalist Three.js setup in `LiveMap.tsx` using untextured standard materials with roughness 0.9 and specular reflections disabled.
  * OrbitControls were unconfigured, relying on a naive `requestAnimationFrame` rotation delta.
* **Remediation & Fix:**
  * Re-engineered `frontend/src/pages/LiveMap.tsx` with a dual-layer architectural digital twin:
    * Elevated buildings with gradient emissive edges, lit windows, and roof accent illumination.
    * Glowing multi-lane neon road network with cross-district arterial conduits.
    * Multi-stage pulsating DBSCAN hotspot beacon clusters and 3D cone pins.
    * Interactive raycasting with floating pointer tooltip and slide-over Incident Inspector Drawer.
    * 3 Camera presets: 3D Orbit, Top-Down Ortho-equivalent, and 45° Isometric view.
    * Dynamic district boundary glow ribbons and interactive layer toggles.

---

### Issue 2 — Incident Relationship Graph Broken Default & Schema Mapping
* **Observed Defect:**
  * Graph view defaulted to numeric ID `1`, which does not exist in the municipal dataset (valid IDs are `INC-1001` through `INC-1125`).
  * Manual ID input was restricted to numeric `type="number"`, blocking valid alphanumeric IDs like `INC-1001`.
  * Response parsing failed completely because the backend returns `{ "connected_incidents": [...], "incident_details": {...}, "graph_summary": {...} }`, whereas the frontend expected a flat array.
  * Screen displayed blank canvas or infinite loading state.
* **Root Cause:**
  * Hardcoded default `incidentId: 1` in component state; schema disconnect in `RelationshipGraph.tsx`.
* **Remediation & Fix:**
  * Updated `frontend/src/pages/features/RelationshipGraph.tsx`:
    * Replaced numeric input with an intelligent searchable/dropdown selector dynamically seeded with active incidents (`INC-1001` to `INC-1125`).
    * Implemented full response normalizer handling `connected_incidents`, `incident_details`, and ego graph metrics.
    * Built an interactive SVG radial topology visualizer with animated edge links, relationship weight indicators, and neighbor inspector panel.
    * Added one-click pivot to re-center the ego network on any connected neighbor node.

---

### Issue 3 — Predictive ML Accuracy Zero & Prediction Payload Mismatch
* **Observed Defect:**
  * Model evaluation cards displayed `0.0%` Test Accuracy, `0.0%` Train Accuracy, and `0.0` F1 Score.
  * Estimators and Input Features displayed `0` or `NaN`.
  * Prediction form submission resulted in `UNKNOWN` outcome.
* **Root Cause:**
  * Backend endpoint `GET /api/predict/model-metrics` returns `{ "metrics": { "accuracy": 0.9688, "f1_score": 0.9796, "train_accuracy": 0.982 }, "model_parameters": { "n_estimators": 100 }, "input_features_count": 26 }`.
  * Frontend was querying non-existent top-level keys `res.data.test_accuracy` and `res.data.train_accuracy`.
  * Prediction form was submitting geospatial coordinates (`latitude`, `longitude`) rather than required ML inference features (`severity_score`, `impact_radius_meters`, `affected_population`, `temperature_c`, `wind_speed_kmh`).
* **Remediation & Fix:**
  * Updated `frontend/src/pages/features/PredictiveML.tsx`:
    * Corrected metric parser to read `metrics.metrics.accuracy` (96.9%), `f1_score` (98.0%), `train_accuracy` (98.2%), and `input_features_count` (26).
    * Aligned inference form payload to backend Random Forest schema: `severity_score`, `impact_radius_meters`, `affected_population`, `temperature_c`, `wind_speed_kmh`, and `incident_type`.
    * Rendered model outcome with confidence gauge, priority tier badge, and top-5 feature contribution bars.

---

### Issue 4 — Command Center Incident Table Formatting Corruptions
* **Observed Defect:**
  * Incident Registry table rendered `Invalid Date` for every single row in the "Reported" column.
  * Severity column rendered `Low (0)` for all incidents regardless of real severity.
* **Root Cause:**
  * Frontend attempted to parse `incident.reported_at`, while SQLite backend schema and API return `created_at` or `timestamp`.
  * Severity badge evaluated `incident.severity` without fallback to `incident.severity_score`, and default numeric coercion evaluated `null`/`undefined` as `0`, which mapped to `Low (0)`.
* **Remediation & Fix:**
  * Implemented universal normalizer `normalizeIncident()` in `frontend/src/lib/api.ts`:
    * Resolves timestamp across `created_at`, `timestamp`, `reported_at`, or falls back gracefully to formatted ISO date.
    * Strictly distinguishes between zero severity and unassessed incidents: returns `"Unassessed"` with neutral slate badge when severity score is null or unassessed.
  * Updated `SeverityBadge` component in `frontend/src/components/ui/index.tsx` to handle numeric scores (0.0 - 10.0) and unassessed states cleanly.

---

### Issue 5 — Functional Submissions Producing Empty State Panels
* **Observed Defect:**
  * Submissions on Impact & Severity, What-If Simulation, and Weather Risk resulted in empty panels without errors or output.
* **Root Cause:**
  * Schema divergence between frontend request parameters and FastAPI Pydantic models:
    * What-If expected `{ "additional_rain_mm": float, "target_zone": string }`, but frontend sent `{ "rain_mm": ... }`.
    * Weather Risk expected `{ "rainfall_mm": float, "wind_speed_kmh": float, "temperature_c": float }`, but frontend sent `{ "rain": ... }`.
    * Scoring expected `{ "severity_score": float, "impact_radius_meters": float, "affected_population": int }`.
* **Remediation & Fix:**
  * Normalized all API client methods in `frontend/src/lib/api.ts` to strictly mirror FastAPI Pydantic contracts.
  * Added instant default simulation results on page load so operators are never presented with barren screens.
  * Verified all form submissions re-compute and update UI with real-time response data.

---

### Issue 6 — Incident Intake Validation & Confirmation Gaps
* **Observed Defect:**
  * Forms relied on crude browser native popup tooltips ("Please fill out this field").
  * No sample scenario buttons for rapid operational testing.
  * On submission, user was left on the form with no clear indication of the generated incident ID or work order.
* **Root Cause:**
  * Missing operational UX design in `IncidentIntake.tsx`.
* **Remediation & Fix:**
  * Built complete operational intake workspace in `frontend/src/pages/operations/IncidentIntake.tsx`:
    * Real-time inline field validation with error messages under inputs.
    * 3 One-click Pre-populated Incident Presets: "Silk Board Flooding", "Hebbal Road Collapse", "Indiranagar Pipeline Burst".
    * Live Severity and Population Impact calculators.
    * Submission confirmation banner displaying both the generated Incident ID (`CIV-XXXXXX`) and automatically dispatched Work Order ID (`WO-XXXXXX`), with direct links to view them.

---

### Issue 7 — Work Orders Table Displaying Empty State
* **Observed Defect:**
  * Work Orders page reported "No active work orders found" despite 36 valid work orders existing in SQLite storage.
  * Assign and Resolve modals failed with HTTP 422 errors.
* **Root Cause:**
  * Backend returns `{ "data": [...], "meta": { "count": 36 } }`. The frontend code read `res.data.work_orders`, which evaluated to `undefined`.
  * Assignment endpoint expects `PATCH /api/work-orders/{id}/assign` with body `{ "assignee": string }`. The frontend sent `{ "assigned_to": string }`.
  * Resolve endpoint expects `PATCH /api/work-orders/{id}/resolve` with body `{ "evidence": string }`. The frontend sent `{ "resolution_notes": string }`.
* **Remediation & Fix:**
  * Updated `workOrdersAPI.getAll()` in `frontend/src/lib/api.ts` to parse `res.data.data || res.data`.
  * Corrected payload contracts for `assign(id, assignee)` and `resolve(id, evidence)`.
  * Implemented responsive operational work orders table in `frontend/src/pages/operations/WorkOrders.tsx` with status tabs (All, Open, In Progress, Resolved), crew assignment modal, progress transition, and resolution evidence submission modal.
  * Verified table displays all 36 active municipal orders upon loading.

---

## Conclusion

All 7 defects have been permanently resolved in the `feat/ui-v2-urban-pulse` branch. Automated browser test execution confirms 100% pass rate across all operational pathways.
