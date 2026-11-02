"""
CivicOS - Person 3: Predictive Intelligence & Urban Risk Engine
FastAPI Gateway & Core Application Entry Point
---------------------------------------------------------------
This application powers the predictive and intelligence microservice for CivicOS.
Features implemented:
- Feature 1: Urban Incident Relationship Graph (GET /relationships)
- Feature 2: Geospatial Intelligence (GET /api/geospatial/hotspots, GET /api/geospatial/map-layers)
- Feature 3: Predictive Intelligence (POST /api/predict/risk, GET /api/predict/model-metrics)
- Feature 4: Cascading Impact Prediction (POST /cascade)
- Feature 5, 6, 9: Impact, Severity & Priority Scoring (POST /api/scoring/evaluate)
- Feature 10: Weather-Based Risk Analysis (POST /api/weather/analyze)
"""

import sys
from pathlib import Path
from typing import Dict, Any, List, Optional

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure project root is in Python sys.path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from src.config import RAW_DATA_PATH, HIGH_SEVERITY_THRESHOLD, CRITICAL_PRIORITY_THRESHOLD, OPERATIONS_DB_PATH
from src.graph_engine.relationship_graph import IncidentGraphEngine, CascadingImpactEngine
from src.geospatial.spatial_intelligence import SpatialIntelligenceEngine
from src.predictive.risk_predictor import PredictiveRiskEngine
from src.weather.weather_risk_engine import WeatherRiskEngine
from src.scoring.priority_scoring import PriorityScoringEngine
from src.recommendation.action_recommender import ActionRecommendationEngine
from src.operations.service import OperationsService

# Initialize FastAPI application
app = FastAPI(
    title="CivicOS - Predictive Intelligence & Urban Risk Engine",
    description=(
        "Person 3 Urban Risk Microservice: Graph-based incident relationships, "
        "DBSCAN geospatial hotspots, Scikit-learn predictive cascading models, "
        "deterministic cascading consequence trees, and weather hazard analysis."
    ),
    version="1.2.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable Cross-Origin Resource Sharing (CORS) for frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory service engine singletons
graph_engine = IncidentGraphEngine()
cascade_engine = CascadingImpactEngine()
spatial_engine = SpatialIntelligenceEngine()
predictive_engine = PredictiveRiskEngine()
weather_engine = WeatherRiskEngine()
scoring_engine = PriorityScoringEngine()
recommendation_engine = ActionRecommendationEngine()
operations_service = OperationsService(OPERATIONS_DB_PATH)


# ---------------------------------------------------------------------------
# Helper: Dataset Loader & Engine Initializer
# ---------------------------------------------------------------------------
def get_incidents_df() -> pd.DataFrame:
    """Helper function to safely load the synthetic incidents CSV."""
    if not RAW_DATA_PATH.exists():
        raise HTTPException(
            status_code=500,
            detail=f"Incidents dataset not found at expected path: {RAW_DATA_PATH}"
        )
    return pd.read_csv(RAW_DATA_PATH)


def ensure_engines_initialized():
    """Ensure all core engines (Graph, ML, Spatial) are initialized on dataset."""
    df = get_incidents_df()
    if graph_engine.graph.number_of_nodes() == 0:
        graph_engine.build_graph_from_dataframe(df)
    if not predictive_engine.is_trained:
        predictive_engine.train(df)


# ---------------------------------------------------------------------------
# Pydantic Schemas for Request Validation
# ---------------------------------------------------------------------------
class WeatherRiskRequest(BaseModel):
    rainfall_mm: float = Field(..., ge=0, description="Precipitation in mm (e.g., 65.5)")
    wind_speed_kmh: float = Field(..., ge=0, description="Wind speed in km/h (e.g., 45.0)")
    temperature_c: float = Field(..., description="Ambient temperature in Celsius (e.g., 28.5)")

    class Config:
        json_schema_extra = {
            "example": {
                "rainfall_mm": 72.0,
                "wind_speed_kmh": 48.0,
                "temperature_c": 22.5
            }
        }


class IncidentScoringRequest(BaseModel):
    severity_score: float = Field(..., ge=1.0, le=10.0, description="Raw incident severity (1 to 10)")
    impact_radius_meters: float = Field(..., ge=1, description="Estimated impact radius in meters")
    affected_population: int = Field(..., ge=1, description="Estimated count of affected citizens")
    cascading_risk_flag: int = Field(0, ge=0, le=1, description="1 if incident can trigger secondary issues, else 0")

    class Config:
        json_schema_extra = {
            "example": {
                "severity_score": 8.5,
                "impact_radius_meters": 1200,
                "affected_population": 9500,
                "cascading_risk_flag": 1
            }
        }


class CascadePredictionRequest(BaseModel):
    incident_id: Optional[str] = Field(None, description="Existing Incident ID from dataset (e.g. 'INC-1001')")
    incident_type: Optional[str] = Field(None, description="Incident type (e.g. 'Flooding / Waterlogging', 'Tree Fall', 'Power Outage')")
    severity_score: Optional[float] = Field(None, ge=1.0, le=10.0, description="Incident severity score (1.0 to 10.0)")
    rainfall_mm: Optional[float] = Field(0.0, ge=0.0, description="Current or forecasted rainfall in mm")
    wind_speed_kmh: Optional[float] = Field(0.0, ge=0.0, description="Current or forecasted wind speed in km/h")
    cascading_risk_flag: Optional[int] = Field(1, ge=0, le=1, description="1 if cascading risk is enabled, else 0")

    class Config:
        json_schema_extra = {
            "example": {
                "incident_id": "INC-1001",
                "incident_type": "Flooding / Waterlogging",
                "severity_score": 8.4,
                "rainfall_mm": 68.5,
                "wind_speed_kmh": 32.0,
                "cascading_risk_flag": 1
            }
        }


class PredictiveRiskRequest(BaseModel):
    incident_type: str = Field("Flooding / Waterlogging", description="Type of urban incident")
    category: str = Field("Environmental", description="Municipal infrastructure category")
    zone: str = Field("South Zone", description="Target municipal zone")
    severity_score: float = Field(8.0, ge=1.0, le=10.0, description="Assessed incident severity (1 to 10)")
    impact_radius_meters: float = Field(1000.0, ge=10.0, description="Disruption radius in meters")
    affected_population: int = Field(5000, ge=1, description="Estimated count of citizens affected")
    rainfall_mm: float = Field(60.0, ge=0.0, description="Precipitation in mm")
    wind_speed_kmh: float = Field(35.0, ge=0.0, description="Wind speed in km/h")
    temperature_c: float = Field(24.0, description="Temperature in Celsius")

    class Config:
        json_schema_extra = {
            "example": {
                "incident_type": "Flooding / Waterlogging",
                "category": "Environmental",
                "zone": "South Zone",
                "severity_score": 8.4,
                "impact_radius_meters": 1200.0,
                "affected_population": 9500,
                "rainfall_mm": 68.5,
                "wind_speed_kmh": 32.0,
                "temperature_c": 22.4
            }
        }


class IncidentIntakeRequest(BaseModel):
    """Validated citizen, sensor, or authorized open-data incident intake."""
    title: str = Field(..., min_length=5, max_length=120)
    description: str = Field(..., min_length=10, max_length=2000)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    ward: Optional[str] = Field(None, max_length=120)
    zone: Optional[str] = Field(None, max_length=120)
    category: Optional[str] = Field(None, max_length=80)
    severity_score: float = Field(5.0, ge=1.0, le=10.0)
    affected_population: int = Field(100, ge=1, le=10_000_000)
    rainfall_mm: float = Field(0.0, ge=0.0)
    wind_speed_kmh: float = Field(0.0, ge=0.0)
    temperature_c: float = Field(25.0, ge=-30.0, le=60.0)
    source_type: str = Field("citizen", pattern="^(citizen|sensor|open_data)$")


class WorkOrderAssignmentRequest(BaseModel):
    assignee: str = Field(..., min_length=2, max_length=120)


class ResolutionEvidenceRequest(BaseModel):
    evidence: str = Field(..., min_length=5, max_length=2000, description="Operator evidence reference or resolution note; no binary uploads are stored by this service.")


# ---------------------------------------------------------------------------
# Core System Endpoints
# ---------------------------------------------------------------------------

@app.get("/", tags=["System Information"])
def root_endpoint() -> Dict[str, Any]:
    """
    Project root greeting and manifest of all 10 engine features.
    """
    ensure_engines_initialized()
    return {
        "project": "CivicOS – Person 3: Predictive Intelligence & Urban Risk Engine",
        "phase": "Phase 3 - Geospatial & Predictive Intelligence Active",
        "status": "Operational",
        "active_features": [
            {"id": 1, "name": "Urban Incident Relationship Graph", "status": "Implemented & Active (GET /relationships)"},
            {"id": 2, "name": "Geospatial Intelligence", "status": "Implemented & Active (GET /api/geospatial/hotspots, GET /api/geospatial/map-layers)"},
            {"id": 3, "name": "Predictive Intelligence", "status": "Implemented & Active (POST /api/predict/risk)"},
            {"id": 4, "name": "Cascading Impact Prediction", "status": "Implemented & Active (POST /cascade)"},
            {"id": 5, "name": "Impact and Severity Scoring", "status": "Implemented & Active"},
            {"id": 6, "name": "Smart Priority Engine", "status": "Implemented & Active"},
            {"id": 7, "name": "What-If Simulation", "status": "Scaffold Ready"},
            {"id": 8, "name": "Preventive Action Recommendation", "status": "Scaffold Ready"},
            {"id": 9, "name": "Prevention Impact Score", "status": "Implemented & Active"},
            {"id": 10, "name": "Weather-Based Risk Analysis", "status": "Implemented & Active"},
        ],
        "api_documentation": "/docs"
    }


@app.get("/health", tags=["System Information"])
def health_check() -> Dict[str, Any]:
    """
    Health check endpoint verifying dataset availability and basic service status.
    """
    dataset_exists = RAW_DATA_PATH.exists()
    row_count = len(pd.read_csv(RAW_DATA_PATH)) if dataset_exists else 0
    ensure_engines_initialized()
    
    return {
        "status": "healthy" if dataset_exists else "degraded",
        "dataset_available": dataset_exists,
        "records_loaded": row_count,
        "graph_nodes": graph_engine.graph.number_of_nodes(),
        "graph_edges": graph_engine.graph.number_of_edges(),
        "ml_model_trained": predictive_engine.is_trained,
        "ml_test_accuracy": predictive_engine.metrics.get("accuracy"),
        "dataset_path": str(RAW_DATA_PATH)
    }


# ---------------------------------------------------------------------------
# FEATURE 1: Urban Incident Relationship Graph Endpoints
# ---------------------------------------------------------------------------

@app.get("/relationships", tags=["Feature 1: Relationship Graph"])
def get_incident_relationships(
    incident_id: Optional[str] = Query(None, description="Optional incident ID to search connected neighborhood (e.g. 'INC-1001')"),
    max_distance_km: float = Query(2.0, ge=0.1, le=10.0, description="Max distance threshold for proximity links"),
    min_weight: float = Query(0.35, ge=0.0, le=1.0, description="Minimum relationship weight to include"),
    limit: int = Query(50, ge=1, le=200, description="Maximum number of edges to return")
) -> Dict[str, Any]:
    """
    Feature 1: Get urban incident relationship graph nodes, edges, and neighborhood connections.
    """
    ensure_engines_initialized()
    summary = graph_engine.get_graph_summary()

    if incident_id:
        incident_id = incident_id.strip()
        if incident_id not in graph_engine.graph:
            raise HTTPException(
                status_code=404,
                detail=f"Incident '{incident_id}' not found in the relationship graph. Available incidents: INC-1001 to INC-1125."
            )
        
        target_node = graph_engine.graph.nodes[incident_id]
        connected = graph_engine.get_connected_incidents(incident_id)

        return {
            "search_query": incident_id,
            "incident_details": {
                "incident_id": incident_id,
                "incident_type": target_node.get("incident_type"),
                "category": target_node.get("category"),
                "zone": target_node.get("zone"),
                "ward": target_node.get("ward"),
                "severity_score": target_node.get("severity_score"),
                "priority_score": target_node.get("priority_score"),
                "status": target_node.get("status"),
                "weather_condition": target_node.get("weather_condition"),
                "rainfall_mm": target_node.get("rainfall_mm"),
            },
            "connected_incidents_count": len(connected),
            "connected_incidents": connected,
            "graph_summary": summary,
        }

    edges_list = []
    for u, v, data in graph_engine.graph.edges(data=True):
        if data.get("weight", 0) >= min_weight and data.get("distance_km", 0) <= max_distance_km:
            edges_list.append({
                "source": u,
                "target": v,
                "relationship_type": data.get("relationship_type"),
                "label": data.get("label"),
                "weight": data.get("weight"),
                "distance_km": data.get("distance_km"),
                "description": data.get("description"),
            })
            if len(edges_list) >= limit:
                break

    return {
        "graph_summary": summary,
        "sample_edges_returned": len(edges_list),
        "edges": edges_list,
        "hint": "Provide ?incident_id=INC-1001 to retrieve an individual incident's connected network."
    }


# ---------------------------------------------------------------------------
# FEATURE 2: Geospatial Intelligence Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/geospatial/hotspots", tags=["Feature 2: Geospatial Intelligence"])
def get_spatial_hotspots(
    eps_km: float = Query(1.5, ge=0.2, le=10.0, description="DBSCAN maximum neighborhood radius in km"),
    min_samples: int = Query(3, ge=2, le=20, description="Minimum incidents to qualify as a spatial hotspot")
) -> Dict[str, Any]:
    """
    Feature 2: Detect high-risk urban hotspots using DBSCAN spatial clustering with haversine distance.
    """
    ensure_engines_initialized()
    df = get_incidents_df()
    df_clustered, hotspots = spatial_engine.detect_spatial_hotspots(df, eps_km=eps_km, min_samples=min_samples)
    zone_density = spatial_engine.get_zone_density_summary(df)

    return {
        "total_incidents_analyzed": len(df),
        "clustering_algorithm": "DBSCAN (Haversine Metric)",
        "parameters": {"eps_km": eps_km, "min_samples": min_samples},
        "hotspots_detected_count": len(hotspots),
        "hotspots": hotspots,
        "zonal_density": zone_density
    }


@app.get("/api/geospatial/map-layers", tags=["Feature 2: Geospatial Intelligence"])
def get_geospatial_map_layers(
    category: Optional[str] = Query(None, description="Optional category filter (e.g. 'Environmental', 'Utilities')"),
    zone: Optional[str] = Query(None, description="Optional municipal zone filter"),
    min_severity: float = Query(1.0, ge=1.0, le=10.0, description="Minimum severity threshold")
) -> Dict[str, Any]:
    """
    Feature 2: Returns standard GeoJSON FeatureCollection of all incident point features with impact buffers.
    """
    ensure_engines_initialized()
    df = get_incidents_df()

    if category:
        df = df[df["category"] == category]
    if zone:
        df = df[df["zone"] == zone]
    if min_severity > 1.0:
        df = df[df["severity_score"] >= min_severity]

    geojson = spatial_engine.generate_map_layers_geojson(df)
    return geojson


# ---------------------------------------------------------------------------
# FEATURE 3: Predictive Intelligence Endpoints
# ---------------------------------------------------------------------------

@app.post("/api/predict/risk", tags=["Feature 3: Predictive Intelligence"])
def predict_incident_risk(request: PredictiveRiskRequest) -> Dict[str, Any]:
    """
    Feature 3: Predict cascading failure probability using trained Scikit-learn Random Forest classifier.
    """
    ensure_engines_initialized()
    data = request.model_dump()
    result = predictive_engine.predict(data)
    return result


@app.get("/api/predict/model-metrics", tags=["Feature 3: Predictive Intelligence"])
def get_model_metrics() -> Dict[str, Any]:
    """
    Feature 3: Retrieve genuine training metrics, confusion matrix, and feature importances.
    """
    ensure_engines_initialized()
    return predictive_engine.training_summary


# ---------------------------------------------------------------------------
# FEATURE 4: Cascading Impact Prediction Endpoints
# ---------------------------------------------------------------------------

@app.post("/cascade", tags=["Feature 4: Cascading Impact Prediction"])
def predict_cascading_impact(request: CascadePredictionRequest) -> Dict[str, Any]:
    """
    Feature 4: Predict multi-stage cascading consequences (Secondary & Tertiary).
    """
    ensure_engines_initialized()
    df = get_incidents_df()

    inc_id = request.incident_id or "CUSTOM-SCENARIO"
    inc_type = request.incident_type
    severity = request.severity_score
    rainfall = request.rainfall_mm or 0.0
    wind = request.wind_speed_kmh or 0.0
    cascading_flag = request.cascading_risk_flag if request.cascading_risk_flag is not None else 1

    if request.incident_id:
        matching = df[df["incident_id"] == request.incident_id.strip()]
        if not matching.empty:
            row = matching.iloc[0]
            if inc_type is None:
                inc_type = str(row["incident_type"])
            if severity is None:
                severity = float(row["severity_score"])
            if request.rainfall_mm == 0.0:
                rainfall = float(row.get("rainfall_mm", 0.0))
            if request.wind_speed_kmh == 0.0:
                wind = float(row.get("wind_speed_kmh", 0.0))
        elif inc_type is None:
            raise HTTPException(
                status_code=404,
                detail=f"Incident ID '{request.incident_id}' not found. Please provide an 'incident_type' explicitly."
            )

    inc_type = inc_type or "Flooding / Waterlogging"
    severity = severity if severity is not None else 7.0

    cascade_result = cascade_engine.predict_cascade(
        incident_type=inc_type,
        severity_score=severity,
        rainfall_mm=rainfall,
        wind_speed_kmh=wind,
        cascading_risk_flag=cascading_flag,
        root_id=inc_id
    )

    return cascade_result


# ---------------------------------------------------------------------------
# Additional Active Endpoints (Scoring, Weather, Dataset Explorer)
# ---------------------------------------------------------------------------

@app.get("/api/incidents/summary", tags=["Dataset Exploration"])
def get_incidents_summary() -> Dict[str, Any]:
    """
    Returns statistical distribution of the raw synthetic urban incidents dataset.
    """
    df = get_incidents_df()
    return {
        "total_records": len(df),
        "zones": df["zone"].value_counts().to_dict(),
        "categories": df["category"].value_counts().to_dict(),
        "statuses": df["status"].value_counts().to_dict(),
        "critical_incidents_count": int((df["priority_score"] >= CRITICAL_PRIORITY_THRESHOLD).sum()),
        "cascading_events_count": int((df["cascading_risk_flag"] == 1).sum()),
    }


@app.post("/api/weather/analyze", tags=["Feature 10: Weather-Based Risk Analysis"])
def analyze_weather_risk(request: WeatherRiskRequest) -> Dict[str, Any]:
    """
    Evaluates weather risk given precipitation, wind speed, and ambient temperature.
    """
    return weather_engine.evaluate_weather_risk(
        rainfall_mm=request.rainfall_mm,
        wind_speed_kmh=request.wind_speed_kmh,
        temperature_c=request.temperature_c
    )


@app.post("/api/scoring/evaluate", tags=["Feature 5, 6, 9: Scoring & Priority"])
def evaluate_incident_scores(request: IncidentScoringRequest) -> Dict[str, Any]:
    """
    Calculates composite severity, smart priority, and prevention impact scores.
    """
    data = request.model_dump()
    return {
        "composite_severity": scoring_engine.compute_composite_severity(data),
        "smart_priority_score": scoring_engine.compute_smart_priority(data),
        "prevention_impact_score": scoring_engine.compute_prevention_impact(data),
    }


# ============================================================
# UNIVERSAL LOCATION INTELLIGENCE APIs
# ============================================================

from src.location_intelligence.location_engine import LocationIntelligenceEngine


def get_location_engine():
    """Load the existing CivicOS incident dataset."""
    df = get_incidents_df()

    if df is None or df.empty:
        raise HTTPException(
            status_code=404,
            detail="No incident data available."
        )

    return LocationIntelligenceEngine(df)


def location_result(filtered_df):
    """Convert filtered incidents into JSON-safe output."""
    return {
        "total_incidents": len(filtered_df),
        "incidents": __import__("json").loads(
            filtered_df.to_json(orient="records")
        )
    }


@app.get("/api/location/options", tags=["Universal Location Intelligence"])
def get_location_options():
    engine = get_location_engine()
    return engine.get_location_options()


@app.get("/api/location/zone", tags=["Universal Location Intelligence"])
def get_incidents_by_zone(zone: str = Query(...)):
    engine = get_location_engine()
    result = engine.filter_by_zone(zone)

    return {
        "selected_zone": zone,
        **location_result(result)
    }


@app.get("/api/location/ward", tags=["Universal Location Intelligence"])
def get_incidents_by_ward(ward: str = Query(...)):
    engine = get_location_engine()
    result = engine.filter_by_ward(ward)

    return {
        "selected_ward": ward,
        **location_result(result)
    }


@app.get("/api/location/radius", tags=["Universal Location Intelligence"])
def get_incidents_by_radius(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(..., gt=0, le=500)
):
    engine = get_location_engine()
    result = engine.filter_by_radius(latitude, longitude, radius_km)

    return {
        "selected_location": {
            "latitude": latitude,
            "longitude": longitude,
            "radius_km": radius_km
        },
        **location_result(result)
    }


@app.get("/api/location/bounding-box", tags=["Universal Location Intelligence"])
def get_incidents_by_bounding_box(
    min_lat: float = Query(..., ge=-90, le=90),
    min_lon: float = Query(..., ge=-180, le=180),
    max_lat: float = Query(..., ge=-90, le=90),
    max_lon: float = Query(..., ge=-180, le=180)
):
    if min_lat > max_lat or min_lon > max_lon:
        raise HTTPException(
            status_code=400,
            detail="Minimum coordinates must not exceed maximum coordinates."
        )

    engine = get_location_engine()
    result = engine.filter_by_bounding_box(
        min_lat, min_lon, max_lat, max_lon
    )

    return {
        "selected_area": {
            "min_lat": min_lat,
            "min_lon": min_lon,
            "max_lat": max_lat,
            "max_lon": max_lon
        },
        **location_result(result)
    }


@app.get("/api/location/summary/zone", tags=["Universal Location Intelligence"])
def get_zone_intelligence_summary(zone: str = Query(...)):
    engine = get_location_engine()
    result = engine.filter_by_zone(zone)

    return {
        "selected_zone": zone,
        "analytics": engine.get_location_summary(result)
    }


@app.get("/api/location/summary/ward", tags=["Universal Location Intelligence"])
def get_ward_intelligence_summary(ward: str = Query(...)):
    engine = get_location_engine()
    result = engine.filter_by_ward(ward)

    return {
        "selected_ward": ward,
        "analytics": engine.get_location_summary(result)
    }

# ============================================================
# END OF UNIVERSAL LOCATION INTELLIGENCE APIs
# ============================================================

# ============================================================
# UNIFIED INCIDENT-TO-RESOLUTION PIPELINE
# ============================================================
def analyze_operational_intake(incident: Dict[str, Any]) -> Dict[str, Any]:
    """Run the existing intelligence engines as one auditable intake pipeline."""
    ensure_engines_initialized()
    impact_radius = max(50.0, float(incident["severity_score"]) * 120.0)
    prediction_input = {
        "incident_type": incident["incident_type"], "category": incident["category"],
        "zone": incident.get("zone") or "Central Zone", "severity_score": incident["severity_score"],
        "impact_radius_meters": impact_radius, "affected_population": incident["affected_population"],
        "rainfall_mm": incident["rainfall_mm"], "wind_speed_kmh": incident["wind_speed_kmh"],
        "temperature_c": incident["temperature_c"],
    }
    prediction = predictive_engine.predict(prediction_input)
    cascading_flag = int(prediction["cascading_risk_prediction"])
    scores = {
        "composite_severity": scoring_engine.compute_composite_severity(prediction_input),
        "smart_priority_score": scoring_engine.compute_smart_priority({**prediction_input, "cascading_risk_flag": cascading_flag}),
        "prevention_impact_score": scoring_engine.compute_prevention_impact({**prediction_input, "cascading_risk_flag": cascading_flag}),
    }
    cascade = cascade_engine.predict_cascade(
        incident_type=incident["incident_type"], severity_score=incident["severity_score"],
        rainfall_mm=incident["rainfall_mm"], wind_speed_kmh=incident["wind_speed_kmh"],
        cascading_risk_flag=cascading_flag, root_id="OPERATIONAL-INTAKE",
    )
    return {
        "classification": {key: incident[key] for key in ("incident_type", "category", "department")},
        "geospatial_enrichment": {"latitude": incident["latitude"], "longitude": incident["longitude"], "ward": incident.get("ward"), "zone": incident.get("zone"), "impact_radius_meters": impact_radius},
        "prediction": {**prediction, "data_classification": "model_prediction_from_synthetic_reference_training_data"},
        "weather": weather_engine.evaluate_weather_risk(incident["rainfall_mm"], incident["wind_speed_kmh"], incident["temperature_c"]),
        "cascade_simulation": {**cascade, "data_classification": "deterministic_simulation_not_observed_event"},
        "scores": scores,
        "recommendation": {**recommendation_engine.get_recommendation(incident), "data_classification": "deterministic_recommendation_requires_operator_approval"},
    }


@app.post("/api/incidents", status_code=201, tags=["Unified Operational Pipeline"])
def submit_incident(request: IncidentIntakeRequest) -> Dict[str, Any]:
    """Validate, classify, de-duplicate, analyze, route, and persist an incident."""
    record = operations_service.create_incident(request.model_dump(), analyze_operational_intake)
    return {"data": record, "meta": {"pipeline": "classification→duplicate_detection→geospatial_enrichment→risk→cascade_simulation→priority→recommendation→work_order", "source_type": request.source_type}}


@app.get("/api/incidents", tags=["Unified Operational Pipeline"])
def list_operational_incidents() -> Dict[str, Any]:
    records = operations_service.list_incidents()
    return {"data": records, "meta": {"count": len(records), "record_classification": "operator_created_operational_records"}}


@app.get("/api/incidents/{incident_id}", tags=["Unified Operational Pipeline"])
def get_operational_incident(incident_id: str) -> Dict[str, Any]:
    record = operations_service.get_incident(incident_id)
    if not record:
        raise HTTPException(status_code=404, detail="Operational incident not found.")
    return {"data": record}


@app.get("/api/work-orders", tags=["Unified Operational Pipeline"])
def list_work_orders() -> Dict[str, Any]:
    records = operations_service.list_work_orders()
    return {"data": records, "meta": {"count": len(records)}}


@app.patch("/api/work-orders/{work_order_id}/assign", tags=["Unified Operational Pipeline"])
def assign_work_order(work_order_id: str, request: WorkOrderAssignmentRequest) -> Dict[str, Any]:
    record = operations_service.assign_work_order(work_order_id, request.assignee)
    if not record:
        raise HTTPException(status_code=404, detail="Work order not found.")
    return {"data": record}


@app.patch("/api/work-orders/{work_order_id}/resolve", tags=["Unified Operational Pipeline"])
def resolve_work_order(work_order_id: str, request: ResolutionEvidenceRequest) -> Dict[str, Any]:
    record = operations_service.resolve_work_order(work_order_id, request.evidence)
    if not record:
        raise HTTPException(status_code=404, detail="Work order not found.")
    return {"data": record, "meta": {"resolution_verification": "operator_attested evidence recorded; automated image verification is not configured"}}

if __name__ == "__main__":
    import uvicorn
    # To start manually: uvicorn main:app --reload --port 8000
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
