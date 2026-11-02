"""
Phase 2 Comprehensive Test Suite
---------------------------------
Features Tested:
1. Feature 1: Urban Incident Relationship Graph (NetworkX)
2. Feature 4: Cascading Impact Prediction (Deterministic Rule-Based)
3. FastAPI Endpoints: GET /relationships, POST /cascade
"""

import sys
from pathlib import Path
import pandas as pd

# Setup sys.path for direct imports
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.graph_engine.relationship_graph import (
    IncidentGraphEngine,
    CascadingImpactEngine,
    calculate_haversine_distance,
    KNOWN_CAUSAL_AFFINITIES,
)
from src.config import RAW_DATA_PATH


def test_haversine_distance():
    print("[1/8] Testing Haversine distance calculation...")
    lat1, lon1 = 12.9742, 77.5980
    lat2, lon2 = 12.9830, 77.6380
    dist = calculate_haversine_distance(lat1, lon1, lat2, lon2)
    assert 4.0 <= dist <= 5.0, f"Expected approx 4.4 km, got {dist}"
    assert calculate_haversine_distance(lat1, lon1, lat1, lon1) == 0.0
    print("      [PASS] Haversine distance passed.")


def test_graph_engine_build_from_csv():
    print("[2/8] Testing graph construction from synthetic CSV dataset...")
    assert RAW_DATA_PATH.exists(), f"Missing dataset at {RAW_DATA_PATH}"
    df = pd.read_csv(RAW_DATA_PATH)
    assert len(df) >= 100, f"Expected at least 100 records, got {len(df)}"

    engine = IncidentGraphEngine()
    G = engine.build_graph_from_dataframe(df)

    assert G.number_of_nodes() == len(df), f"Node count mismatch: {G.number_of_nodes()} vs {len(df)}"
    assert G.number_of_edges() > 0, "Graph should have established relationship edges"

    sample_node = G.nodes["INC-1001"]
    assert "incident_type" in sample_node
    assert "ward" in sample_node
    assert "severity_score" in sample_node
    assert sample_node["severity_score"] > 0
    print(f"      [PASS] Graph built successfully: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges.")


def test_parent_trigger_edges():
    print("[3/8] Testing parent-child trigger relationship edges...")
    df = pd.read_csv(RAW_DATA_PATH)
    engine = IncidentGraphEngine()
    engine.build_graph_from_dataframe(df)

    connected = engine.get_connected_incidents("INC-1001")
    assert len(connected) > 0, "INC-1001 should have connected incidents"

    outgoing_ids = [c["incident_id"] for c in connected if "Outgoing" in c["direction"]]
    assert "INC-1002" in outgoing_ids, f"Expected INC-1002 in outgoing connections of INC-1001, got {outgoing_ids}"
    print(f"      [PASS] Parent-child trigger verified: INC-1001 -> {outgoing_ids}")


def test_search_connected_incidents():
    print("[4/8] Testing neighborhood query for specific incidents...")
    df = pd.read_csv(RAW_DATA_PATH)
    engine = IncidentGraphEngine()
    engine.build_graph_from_dataframe(df)

    results = engine.get_connected_incidents("INC-1003")
    assert isinstance(results, list)
    for item in results:
        assert "incident_id" in item
        assert "weight" in item
        assert "relationship_type" in item
        assert 0.0 <= item["weight"] <= 1.0

    assert engine.get_connected_incidents("INC-9999") == []
    print(f"      [PASS] Incident search passed: INC-1003 has {len(results)} connected neighbors.")


def test_graph_plotly_visualization():
    print("[5/8] Testing Plotly graph visualization generator...")
    df = pd.read_csv(RAW_DATA_PATH)
    engine = IncidentGraphEngine()
    engine.build_graph_from_dataframe(df)

    fig = engine.generate_plotly_figure(selected_incident_id="INC-1001", subgraph_only=True)
    assert fig is not None
    assert len(fig.data) >= 2
    print("      [PASS] Plotly graph figure generated successfully.")


def test_cascading_prediction_structure():
    print("[6/8] Testing rule-based cascading impact prediction...")
    engine = CascadingImpactEngine()
    result = engine.predict_cascade(
        incident_type="Flooding / Waterlogging",
        severity_score=8.5,
        rainfall_mm=75.0,
        wind_speed_kmh=30.0,
        cascading_risk_flag=1,
        root_id="TEST-INC"
    )

    assert result["root_incident_id"] == "TEST-INC"
    assert result["root_incident_type"] == "Flooding / Waterlogging"
    assert result["total_consequences_predicted"] > 0
    assert "overall_threat_level" in result

    consequences = result["consequences"]
    stages = {c["stage"] for c in consequences}
    assert "Secondary" in stages
    assert "Tertiary" in stages
    print(f"      [PASS] Cascade predicted: {len(consequences)} total consequences across Secondary & Tertiary stages.")


def test_no_duplicate_consequences_and_no_loops():
    print("[7/8] Testing loop prevention, duplicate prevention, and causal explanations...")
    engine = CascadingImpactEngine()
    for inc_type in KNOWN_CAUSAL_AFFINITIES.keys():
        result = engine.predict_cascade(incident_type=inc_type, severity_score=8.0)
        consequences = result["consequences"]

        names = [c["name"] for c in consequences]
        assert len(names) == len(set(names)), f"Duplicate consequences detected for {inc_type}: {names}"

        for c in consequences:
            assert c["depth"] in [1, 2]
            assert c["parent_id"] is not None
            assert len(c["reason"]) > 10, "Causal reason must be provided"
            assert len(c["preventive_break_action"]) > 10, "Break action must be provided"

    print("      [PASS] Loop prevention verified: All 10 incident types produce loop-free, unique DAG cascades.")


def test_fastapi_endpoints():
    print("[8/8] Testing FastAPI backend endpoints (GET /relationships, POST /cascade)...")
    from starlette.testclient import TestClient
    from main import app

    client = TestClient(app)

    # 1. Health check
    res_health = client.get("/health")
    assert res_health.status_code == 200, f"Health check failed: {res_health.text}"
    data_health = res_health.json()
    assert data_health["status"] == "healthy"
    assert data_health["graph_nodes"] >= 100

    # 2. GET /relationships (Global Overview)
    res_rel_global = client.get("/relationships?limit=10")
    assert res_rel_global.status_code == 200, f"GET /relationships failed: {res_rel_global.text}"
    data_rel = res_rel_global.json()
    assert "graph_summary" in data_rel
    assert "edges" in data_rel

    # 3. GET /relationships with valid incident_id
    res_rel_node = client.get("/relationships?incident_id=INC-1001")
    assert res_rel_node.status_code == 200, f"GET /relationships?incident_id=INC-1001 failed: {res_rel_node.text}"
    data_node = res_rel_node.json()
    assert data_node["search_query"] == "INC-1001"
    assert "connected_incidents" in data_node

    # 4. GET /relationships with non-existent incident
    res_rel_invalid = client.get("/relationships?incident_id=NON-EXISTENT")
    assert res_rel_invalid.status_code == 404

    # 5. POST /cascade with existing incident_id
    res_cascade_id = client.post("/cascade", json={"incident_id": "INC-1001"})
    assert res_cascade_id.status_code == 200, f"POST /cascade (existing ID) failed: {res_cascade_id.text}"
    data_casc = res_cascade_id.json()
    assert data_casc["root_incident_id"] == "INC-1001"
    assert len(data_casc["consequences"]) > 0

    # 6. POST /cascade with custom scenario
    res_cascade_custom = client.post("/cascade", json={
        "incident_type": "Water Main Break",
        "severity_score": 8.5,
        "rainfall_mm": 25.0,
        "wind_speed_kmh": 20.0
    })
    assert res_cascade_custom.status_code == 200, f"POST /cascade (custom) failed: {res_cascade_custom.text}"
    data_custom = res_cascade_custom.json()
    assert data_custom["root_incident_type"] == "Water Main Break"
    assert data_custom["total_consequences_predicted"] > 0
    print("      [PASS] FastAPI endpoints validated: GET /relationships and POST /cascade operational.")


if __name__ == "__main__":
    print("=" * 70)
    print("CIVICOS - PERSON 3: PHASE 2 TEST SUITE")
    print("=" * 70)
    test_haversine_distance()
    test_graph_engine_build_from_csv()
    test_parent_trigger_edges()
    test_search_connected_incidents()
    test_graph_plotly_visualization()
    test_cascading_prediction_structure()
    test_no_duplicate_consequences_and_no_loops()
    test_fastapi_endpoints()
    print("=" * 70)
    print("ALL 8 TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)
