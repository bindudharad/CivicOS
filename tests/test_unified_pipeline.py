"""End-to-end checks for the canonical operational workflow."""
from uuid import uuid4
from random import uniform
from fastapi.testclient import TestClient

from main import app, auth_service


def test_rainfall_to_verified_resolution_flow():
    client = TestClient(app)
    username = "integration_officer"
    try:
        auth_service.create_user(username, "Integration-test-password-42", "municipal_officer")
    except Exception:
        pass
    login = client.post("/api/auth/login", json={"username": username, "password": "Integration-test-password-42"})
    assert login.status_code == 200
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    run_id = uuid4().hex[:6]
    intake = {
        "title": f"Blocked storm drain {run_id}",
        "description": f"Heavy rainfall is approaching Bengaluru and a blocked drain is causing waterlogging at sector {run_id}.",
        "latitude": 12.9716 + uniform(-0.05, 0.05),
        "longitude": 77.5946 + uniform(-0.05, 0.05),
        "ward": "Ward 1",
        "zone": "Central Zone",
        "severity_score": 8.5,
        "affected_population": 2400,
        "rainfall_mm": 72.0,
        "wind_speed_kmh": 18.0,
        "temperature_c": 23.0,
        "source_type": "citizen",
    }
    created = client.post("/api/incidents", json=intake, headers=headers)
    assert created.status_code == 201, created.text
    record = created.json()["data"]
    assert record["analysis"]["classification"]["department"] == "Drainage & Stormwater"
    assert record["analysis"]["prediction"]["data_classification"].startswith("model_prediction")
    assert record["analysis"]["cascade_simulation"]["data_classification"].startswith("deterministic_simulation")
    order = record["work_order"]

    assigned = client.patch(f"/api/work-orders/{order['id']}/assign", json={"assignee": "Drainage Team Alpha"}, headers=headers)
    assert assigned.status_code == 200
    assert assigned.json()["data"]["status"] == "assigned"

    started = client.patch(f"/api/work-orders/{order['id']}/start", headers=headers)
    assert started.status_code == 200
    resolved = client.patch(f"/api/work-orders/{order['id']}/resolve", json={"evidence": "Before/after inspection logged by supervisor"}, headers=headers)
    assert resolved.status_code == 200
    assert resolved.json()["data"]["status"] == "resolved"
    incident = client.get(f"/api/incidents/{record['id']}", headers=headers)
    assert incident.status_code == 200
    assert incident.json()["data"]["status"] == "resolved"
