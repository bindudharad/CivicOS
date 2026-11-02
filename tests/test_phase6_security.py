"""Phase 6 authentication, RBAC, CORS, and session invalidation regression tests."""
from fastapi.testclient import TestClient
from main import app, auth_service

client = TestClient(app)

def _login(username, password):
    response = client.post("/api/auth/login", json={"username": username, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": "Bearer " + response.json()["access_token"]}

def test_authentication_rbac_and_logout():
    users = [("phase6_admin", "administrator"), ("phase6_viewer", "viewer"), ("phase6_operator", "department_operator")]
    for username, role in users:
        try: auth_service.create_user(username, "Phase6-secure-password-42", role)
        except Exception: pass
    assert client.get("/api/incidents").status_code == 401
    viewer = _login("phase6_viewer", "Phase6-secure-password-42")
    assert client.get("/api/incidents", headers=viewer).status_code == 200
    intake = {"title":"Blocked drain", "description":"Heavy rain has blocked a storm drain near road phase six isolated site", "latitude":12.8616,"longitude":77.4646,"severity_score":8,"affected_population":100}
    assert client.post("/api/incidents", json=intake, headers=viewer).status_code == 403
    operator = _login("phase6_operator", "Phase6-secure-password-42")
    created = client.post("/api/incidents", json=intake, headers=operator)
    assert created.status_code == 201
    order_id = created.json()["data"]["work_order"]["id"]
    assert client.patch(f"/api/work-orders/{order_id}/assign", json={"assignee":"Crew"}, headers=operator).status_code == 403
    admin = _login("phase6_admin", "Phase6-secure-password-42")
    assert client.patch(f"/api/work-orders/{order_id}/assign", json={"assignee":"Crew"}, headers=admin).status_code == 200
    assert client.post("/api/auth/logout", headers=operator).status_code == 200
    assert client.get("/api/incidents", headers=operator).status_code == 401

def test_cors_restricts_unknown_origins_and_login_rate_limit():
    allowed = client.options("/api/incidents", headers={"Origin":"http://localhost:8501", "Access-Control-Request-Method":"GET"})
    assert allowed.headers.get("access-control-allow-origin") == "http://localhost:8501"
    denied = client.options("/api/incidents", headers={"Origin":"https://evil.example", "Access-Control-Request-Method":"GET"})
    assert denied.status_code == 400
    for _ in range(5): assert client.post("/api/auth/login", json={"username":"nobody","password":"wrong-password-123"}).status_code == 401
    assert client.post("/api/auth/login", json={"username":"nobody","password":"wrong-password-123"}).status_code == 429
