"""End-to-end checks for the canonical operational workflow."""
from fastapi.testclient import TestClient

from main import app


def test_rainfall_to_verified_resolution_flow():
    client = TestClient(app)
    intake = {
        "title": "Blocked storm drain near underpass",
        "description": "Heavy rainfall is approaching Bengaluru and a blocked drain is causing waterlogging at the underpass.",
        "latitude": 12.9716, "longitude": 77.5946, "ward": "Ward 1", "zone": "Central Zone",
        "severity_score": 8.5, "affected_population": 2400, "rainfall_mm": 72.0,
        "wind_speed_kmh": 18.0, "temperature_c": 23.0, "source_type": "citizen",
    }
    created = client.post("/api/incidents", json=intake)
    assert created.status_code == 201, created.text
    record = created.json()["data"]
    assert record["analysis"]["classification"]["department"] == "Drainage & Stormwater"
    assert record["analysis"]["prediction"]["data_classification"].startswith("model_prediction")
    assert record["analysis"]["cascade_simulation"]["data_classification"].startswith("deterministic_simulation")
    order = record["work_order"]

    assigned = client.patch(f"/api/work-orders/{order['id']}/assign", json={"assignee": "Drainage Team Alpha"})
    assert assigned.status_code == 200
    assert assigned.json()["data"]["status"] == "assigned"

    resolved = client.patch(f"/api/work-orders/{order['id']}/resolve", json={"evidence": "Before/after inspection logged by supervisor"})
    assert resolved.status_code == 200
    assert resolved.json()["data"]["status"] == "resolved"
    incident = client.get(f"/api/incidents/{record['id']}")
    assert incident.status_code == 200
    assert incident.json()["data"]["status"] == "resolved"
