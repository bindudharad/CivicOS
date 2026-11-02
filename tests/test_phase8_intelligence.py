"""
Comprehensive Phase 8 Intelligence & Operational Verification Suite
------------------------------------------------------------------
Validates:
- Feature 7: What-If Simulation Engine & API
- Feature 8: Preventive Recommendations Engine (all 10 playbooks) & API
- Feature 3: ML one-hot feature prefix alignment fix
- Operational classification coverage for all 10 incident types
- Scoring engine boundaries and weather impact
"""
import pytest
from fastapi.testclient import TestClient
import pandas as pd
import numpy as np

from main import app
from src.config import RAW_DATA_PATH, INCIDENT_TYPES
from src.simulation.what_if_engine import WhatIfSimulationEngine
from src.recommendation.action_recommender import ActionRecommendationEngine
from src.predictive.risk_predictor import PredictiveRiskEngine
from src.operations.service import OperationsService
from src.scoring.priority_scoring import PriorityScoringEngine
from src.weather.weather_risk_engine import WeatherRiskEngine


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def sample_df():
    return pd.read_csv(RAW_DATA_PATH)


def test_what_if_engine_and_api(client, sample_df):
    """Verify Feature 7: What-If simulation engine and API endpoint."""
    engine = WhatIfSimulationEngine()
    
    # Engine direct tests
    surge = engine.simulate_rainfall_surge(sample_df, additional_rain_mm=50.0)
    assert surge["additional_rain_mm"] == 50.0
    assert surge["simulated_cascading_risk_multiplier"] > 1.0
    assert surge["projected_additional_flood_zones"] >= 0

    outage = engine.simulate_power_grid_outage(sample_df, target_zone="South Zone")
    assert outage["target_zone"] == "South Zone"
    assert outage["projected_secondary_traffic_gridlocks"] >= 3
    assert outage["estimated_emergency_generator_demand_units"] >= 2

    # API endpoint test
    res = client.post("/api/simulation/what-if", json={
        "additional_rain_mm": 60.0,
        "target_zone": "East Zone"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["simulation_type"] == "Counterfactual Stress Test (What-If)"
    assert data["rainfall_surge_simulation"]["additional_rain_mm"] == 60.0
    assert data["power_grid_outage_simulation"]["target_zone"] == "East Zone"


def test_action_recommendation_all_ten_types(client):
    """Verify Feature 8: Action recommender provides playbooks for all 10 incident types."""
    engine = ActionRecommendationEngine()
    assert len(engine.playbooks) == 10

    for inc_type in INCIDENT_TYPES:
        rec = engine.get_recommendation({"incident_type": inc_type, "severity_score": 8.2})
        assert rec["incident_type"] == inc_type
        assert len(rec["recommended_actions"]) >= 3
        assert rec["dispatch_urgency"] == "URGENT - Immediate Dispatch (< 15 mins)"
        assert rec["suggested_crew"] == "Emergency Rapid Action Unit"

    # Test standard urgency for low severity
    rec_low = engine.get_recommendation({"incident_type": "Flooding / Waterlogging", "severity_score": 5.0})
    assert rec_low["dispatch_urgency"] == "Standard Priority (< 60 mins)"
    assert rec_low["suggested_crew"] == "Zonal Maintenance Team"

    # API endpoint test
    res = client.post("/api/recommendations", json={
        "incident_type": "Tree Fall",
        "severity_score": 9.0,
        "wind_speed_kmh": 45.0
    })
    assert res.status_code == 200
    data = res.json()
    assert data["incident_type"] == "Tree Fall"
    assert len(data["recommended_actions"]) >= 3


def test_ml_prefix_alignment_fix(sample_df):
    """Verify Feature 3: ML model one-hot encodes incident_type correctly."""
    engine = PredictiveRiskEngine()
    engine.train(sample_df)
    assert engine.is_trained

    # Test prediction with an incident_type containing spaces and slashes
    test_incident = {
        "incident_type": "Flooding / Waterlogging",
        "category": "Environmental",
        "zone": "South Zone",
        "severity_score": 9.0,
        "impact_radius_meters": 1500.0,
        "affected_population": 8000,
        "rainfall_mm": 75.0,
        "wind_speed_kmh": 35.0,
        "temperature_c": 22.0
    }
    result = engine.predict(test_incident)
    assert "cascading_risk_prediction" in result
    assert 0.0 <= result["cascading_probability"] <= 1.0
    assert result["risk_tier"] in [
        "CRITICAL CASCADE RISK", "HIGH CASCADE RISK",
        "MODERATE PROPAGATION RISK", "LOW PROPAGATION RISK"
    ]


def test_operations_classify_all_types():
    """Verify Operational Intake classifies all standard incident descriptions."""
    descriptions = {
        "Heavy rain causing waterlog in the street": "Flooding / Waterlogging",
        "Huge tree and branch fell blocking lane": "Tree Fall",
        "Main pipeline burst and water leaking heavily": "Water Main Break",
        "Substation transformer blackout and electrical failure": "Power Outage",
        "Traffic light failure at junction and signal down": "Traffic Signal Failure",
        "Severe road crater and asphalt damage on highway": "Pothole / Road Damage",
        "Manhole overflow and blackwater sewage spill": "Sewer Overflow",
        "Strong smell of gas and lpg pipe leak near store": "Gas Leak Report",
        "Blaze and heavy smoke with building flames": "Fire Hazard",
        "Flyover deck crack and expansion joint structural defect": "Flyover / Bridge Defect"
    }

    for desc, expected_type in descriptions.items():
        res = OperationsService.classify(desc, None)
        assert res["incident_type"] == expected_type, f"Failed for {desc}"
        assert res["department"] != "Municipal Control Room"


def test_scoring_and_weather_boundaries(client):
    """Verify scoring calculations and weather risk thresholds."""
    scoring = PriorityScoringEngine()
    weather = WeatherRiskEngine()

    # Composite severity bounds [1.0, 10.0]
    sev_max = scoring.compute_composite_severity({"severity_score": 10.0, "impact_radius_meters": 5000})
    assert sev_max <= 10.0
    sev_min = scoring.compute_composite_severity({"severity_score": 1.0, "impact_radius_meters": 10})
    assert sev_min >= 0.85

    # Smart priority bounds [1.0, 100.0]
    prio_max = scoring.compute_smart_priority({
        "severity_score": 10.0, "affected_population": 50000, "cascading_risk_flag": 1
    })
    assert prio_max == 100.0

    # Weather multipliers and alert tiers
    w_red = weather.evaluate_weather_risk(rainfall_mm=85.0, wind_speed_kmh=55.0, temperature_c=25.0)
    assert w_red["threat_level"] == "RED ALERT"
    assert w_red["risk_multiplier"] >= 1.70
    assert len(w_red["active_alerts"]) >= 2

    w_green = weather.evaluate_weather_risk(rainfall_mm=10.0, wind_speed_kmh=15.0, temperature_c=25.0)
    assert w_green["threat_level"] == "GREEN / NORMAL"
    assert w_green["risk_multiplier"] == 1.0


def test_root_manifest_all_ten_features(client):
    """Verify root endpoint manifests all 10 features as Implemented & Active."""
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert len(data["active_features"]) == 10
    for feat in data["active_features"]:
        assert "Scaffold Ready" not in feat["status"], f"Feature {feat['name']} is still scaffolded"
        assert "Implemented & Active" in feat["status"]
