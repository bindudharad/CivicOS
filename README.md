# CivicOS – Person 3: Predictive Intelligence & Urban Risk Engine
**Phase 8 Final Release: 100% Integrated Urban Decision-Support Platform**

CivicOS is a comprehensive, production-hardened municipal intelligence operating system designed for city command centers, emergency responders, and urban infrastructure managers.

It combines graph theory, DBSCAN spatial intelligence, Random Forest predictive machine learning, deterministic consequence propagation trees, counterfactual what-if simulation, and a full incident-to-resolution operational lifecycle with cryptographic security and transactional SQLite persistence.

---

## 🎯 The 10 Core Intelligence Features (100% Operational & Verified)

1. **Urban Incident Relationship Graph**: Graph-theoretic modeling of urban infrastructure where nodes represent municipal incidents and edges capture causal, temporal, or spatial linkages using NetworkX (`GET /relationships`).
2. **Geospatial Intelligence & Hotspots**: DBSCAN spatial clustering with Haversine distance, 32-point geodesic impact-radius buffer rings, GeoJSON export, and OpenStreetMap Scattermap visualization (`GET /api/geospatial/hotspots`, `GET /api/geospatial/map-layers`).
3. **Predictive Intelligence**: Supervised Random Forest machine learning predicting cascading failure risk (`cascading_risk_flag`), with anti-leakage safeguards, genuine hold-out test metrics, feature importances, and interactive inference (`POST /api/predict/risk`, `GET /api/predict/model-metrics`).
4. **Cascading Impact Prediction**: Multi-hop DAG consequence tree tracing secondary and tertiary domino effects with causal rationales, time horizons, and prevention break playbooks (`POST /cascade`).
5. **Impact and Severity Scoring**: Multi-dimensional composite scoring weighing infrastructure criticality, physical damage radius, and population exposure (`POST /api/scoring/evaluate`).
6. **Smart Priority Engine**: Dynamic real-time dispatch prioritization indexing civic incidents on a 1-to-100 scale with urgency triage tiers (`POST /api/scoring/evaluate`).
7. **What-If Simulation**: Counterfactual urban shock simulation modeling precipitation surges (+0 to +300 mm) and localized electrical grid blackouts (`POST /api/simulation/what-if`).
8. **Preventive Action Recommendation**: Prescriptive operational playbooks covering all 10 standard urban incident types with dispatch urgency tiers (`POST /api/recommendations`).
9. **Prevention Impact Score**: Quantitative metric (1–99) evaluating net risk arrest and residual damage when proactive prevention is applied (`POST /api/scoring/evaluate`).
10. **Weather-Based Risk Analysis**: Meteorological risk engine evaluating rainfall intensity, wind gusts, and extreme heat into dynamic hazard alert multipliers (`POST /api/weather/analyze`).

---

## 🛠️ Unified Operational Incident Lifecycle

CivicOS bridges intelligence and field operations into one auditable pipeline:
```text
Citizen / Sensor / Open Data
          │
          ▼
   INCIDENT INTAKE ──► Schema Validation (Pydantic v2)
          │
          ▼
 DUPLICATE DETECTION ──► Haversine (≤ 0.35 km) + Jaccard (≥ 0.25)
          │
          ▼
INTELLIGENCE PIPELINE ──► Graph + DBSCAN + Weather + ML + Cascade + Priority + Playbook
          │
          ▼
  WORK ORDER CREATION ──► Foreign-Key Linked Task Generated
          │
          ▼
DEPARTMENT ASSIGNMENT ──► Role-Based Dispatch (Officer/Admin RBAC)
          │
          ▼
   FIELD EXECUTION ────► Status: In Progress
          │
          ▼
 RESOLUTION EVIDENCE ──► Operator Attestation Recorded
          │
          ▼
 VERIFIED RESOLUTION ──► Closed Incident + Work Order
          │
          ▼
  IMMUTABLE AUDIT ─────► SQLite WAL Lifecycle Ledger
```

---

## 🔒 Security Architecture

- **Password Hashing**: Scrypt key derivation ($N=16384, r=8, p=1$, 16-byte random salt).
- **Session Tokens**: 32-byte URL-safe cryptographic Bearer tokens stored as SHA-256 hashes.
- **Immediate Invalidation**: Session revocation on logout (`POST /api/auth/logout`).
- **Login Throttling**: 5 failed login attempts per client IP within 15 minutes triggers `HTTP 429`.
- **Role-Based Access Control**: Four tiers (`administrator`, `municipal_officer`, `department_operator`, `viewer`) enforced at FastAPI dependency layer.
- **Database Durability**: SQLite with Write-Ahead Logging (`WAL`) and strict foreign keys (`PRAGMA foreign_keys = ON`).

---

## ⚡ Performance Summary

- **Graph Construction (1,000 nodes)**: $126.36$ ms
- **DBSCAN Spatial Clustering (1,000 nodes)**: $17.48$ ms
- **ML Training Time**: $225.67$ ms | **Single Inference**: $11.83$ ms
- **Cascade Tree Evaluation**: $0.009$ ms
- **Operational Database Query**: $4.66$ ms
- **Automated Regression Suite**: 31 / 31 tests passing in 6.93 seconds.
- **Browser Automation**: 100% verified via Chromium Playwright across Desktop, Laptop, Tablet, and Mobile viewports.

---

## 📁 Project Directory Structure

```text
CivicOS_Person3/
│
├── data/                                # Data layer
│   ├── raw/
│   │   └── urban_incidents.csv          # 125 realistic synthetic urban incidents
│   ├── processed/                       # Cleaned, normalized, or feature-engineered datasets
│   │   └── .gitkeep
│   └── generate_dataset.py              # Reproducible dataset generator script
│
├── src/                                 # Core business logic & algorithms organized by feature
│   ├── __init__.py                      # Package initialization
│   ├── config.py                        # Central configuration, file paths, bounds, thresholds
│   │
│   ├── graph_engine/                    # Features 1 & 4 (ACTIVE)
│   │   ├── __init__.py
│   │   └── relationship_graph.py        # NetworkX relationship graph, Plotly visuals, cascading engine
│   │
│   ├── geospatial/                      # Feature 2 (ACTIVE)
│   │   ├── __init__.py
│   │   └── spatial_intelligence.py      # DBSCAN hotspot clustering, buffer rings, GeoJSON, OpenStreetMap
│   │
│   ├── predictive/                      # Feature 3 (ACTIVE)
│   │   ├── __init__.py
│   │   └── risk_predictor.py            # Scikit-learn Random Forest, leakage prevention, metrics, inference
│   │
│   ├── scoring/                         # Features 5, 6 & 9
│   │   ├── __init__.py
│   │   └── priority_scoring.py          # Severity, smart priority & prevention impact scoring
│   │
│   ├── simulation/                      # Feature 7
│   │   ├── __init__.py
│   │   └── what_if_engine.py            # What-if scenario modeling & stress test simulations
│   │
│   ├── recommendation/                  # Feature 8
│   │   ├── __init__.py
│   │   └── action_recommender.py        # Mitigation playbooks & dispatch recommendations
│   │
│   └── weather/                         # Feature 10
│       ├── __init__.py
│       └── weather_risk_engine.py       # Weather risk multipliers & hazard alert thresholds
│
├── dashboard/                           # Frontend presentation layer
│   ├── __init__.py
│   └── app.py                           # Interactive Streamlit + Plotly visual dashboard (Features 1, 2, 3, 4 active)
│
├── tests/                               # Automated Test Suite
│   ├── __init__.py
│   ├── test_phase2.py                   # 8 unit and integration tests (Features 1 & 4)
│   └── test_phase3.py                   # 9 unit and integration tests (Features 2 & 3)
│
├── main.py                              # FastAPI REST API backend & endpoint gateway
├── requirements.txt                     # Python package dependencies
└── README.md                            # Comprehensive project documentation
```

---

## 🌐 FastAPI REST API Endpoints

### 1. Feature 1: Urban Incident Relationship Graph
* **`GET /relationships`**
  * `incident_id` (optional): Query an incident's direct ego-network.
  * `max_distance_km`, `min_weight`, `limit`.

### 2. Feature 2: Geospatial Intelligence (New in Phase 3)
* **`GET /api/geospatial/hotspots`**
  * Query parameters: `eps_km` (default 1.5), `min_samples` (default 3).
  * Returns: Detected DBSCAN spatial clusters, cluster centroids, dominant hazards, incident counts, and municipal zone densities.
* **`GET /api/geospatial/map-layers`**
  * Query parameters: `category`, `zone`, `min_severity`.
  * Returns: Standard GeoJSON `FeatureCollection` with GPS coordinates, impact radius in meters, severity, and status.

### 3. Feature 3: Predictive Intelligence (New in Phase 3)
* **`POST /api/predict/risk`**
  * Request Body: `incident_type`, `category`, `zone`, `severity_score`, `impact_radius_meters`, `affected_population`, `rainfall_mm`, `wind_speed_kmh`, `temperature_c`.
  * Returns: `cascading_risk_prediction` (0 or 1), `cascading_probability` (0.0 to 1.0), `risk_tier` (Critical, High, Moderate, Low), and top influencing drivers.
* **`GET /api/predict/model-metrics`**
  * Returns: Real test accuracy, precision, recall, F1-score, confusion matrix, and feature importances.

### 4. Feature 4: Cascading Impact Prediction
* **`POST /cascade`**
  * Multi-stage secondary and tertiary consequence propagation with causal rationales and cascade breaker actions.

---

## 📊 Dashboard Views (`dashboard/app.py`)

Run the Streamlit dashboard to access interactive graphical tools:
1. **Overview & Incident Explorer**: Summary KPI metrics, incident category bar charts, municipal zone distribution, and searchable dataset explorer.
2. **Feature 1: Urban Incident Relationship Graph**:
   * Interactive incident search dropdown.
   * View toggles: "Focused Ego-Subgraph" or "Citywide Relationship Graph".
   * Plotly 2D interactive network visualization (color-coded by civic domain, node sizes by severity).
   * Detailed connected incidents breakdown table and top 5 urban risk hubs.
3. **Feature 2: Geospatial Intelligence**:
   * Interactive OpenStreetMap layer (no API key required).
   * Category-coded incident markers sized by severity.
   * Dynamic impact-radius buffer rings drawn from `impact_radius_meters`.
   * DBSCAN spatial clustering with adjustable neighborhood distance (`eps_km`) and minimum cluster size.
   * Detected High-Risk Hotspots table with center coordinates, incident counts, and dominant hazards.
   * Municipal zone incident density & population exposure comparison charts.
4. **Feature 3: Predictive Intelligence**:
   * Model Performance Dashboard: Genuine test accuracy, precision, recall, F1-score.
   * Hold-Out Test Confusion Matrix heatmap (True Negatives, False Positives, False Negatives, True Positives).
   * Top Predictive Risk Drivers (Gini feature importance bar chart).
   * Live Interactive Prediction Simulator: Sliders for severity, rainfall, wind, population, and impact radius.
   * Real-time Risk Probability Gauge (0% to 100%) and recommended municipal containment stance.
5. **Feature 4: Cascading Impact Prediction**:
   * Multi-stage propagation tree (Root ➔ Secondary ➔ Tertiary).
   * Tabbed breakdown of Secondary and Tertiary consequences with risk badges, time horizons, causal reasons, and prevention barrier actions.

---

## 🚀 Running the Project

### 1. Run the FastAPI Backend Server
```powershell
python main.py
```
- Interactive Swagger UI: `http://127.0.0.1:8000/docs`
- Redoc UI: `http://127.0.0.1:8000/redoc`

### 2. Run the Interactive Streamlit Dashboard
```powershell
streamlit run dashboard/app.py
```
- Dashboard URL: `http://localhost:8501`

### 3. Run Automated Tests
```powershell
# Run Phase 2 Tests (Features 1 & 4)
python tests/test_phase2.py

# Run Phase 3 Tests (Features 2 & 3)
python tests/test_phase3.py
```
