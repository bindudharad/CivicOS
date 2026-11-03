"""
CivicOS V3.1.1 Telemetry Data Integrity Scenario Tests
Tests three critical telemetry conditions in Chromium:
  Scenario A: Populated live database (All real metrics rendered)
  Scenario B: Empty API Response Scenario (Frontend renders 0, ZERO fallback numbers)
  Scenario C: Disconnected backend (API: DISCONNECTED badge, N/A metrics, zero LIVE flags)

Security:
  - Uses CIVICOS_TEST_USERNAME and CIVICOS_TEST_PASSWORD environment variables if configured.
  - Otherwise provisions a disposable, isolated test administrator via AuthService.
  - Zero hardcoded credentials in source control.
"""
import os
import secrets
import pytest
import time
from playwright.sync_api import sync_playwright

from src.config import OPERATIONS_DB_PATH
from src.security.auth import AuthService

BASE_URL = "http://127.0.0.1:5173"


@pytest.fixture(scope="module")
def browser_context():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--enable-webgl",
                "--ignore-gpu-blocklist",
                "--use-gl=angle",
                "--use-angle=swiftshader-webgl"
            ]
        )
        context = browser.new_context(viewport={"width": 1920, "height": 1080})
        yield context
        browser.close()


@pytest.fixture(scope="module")
def test_admin_credentials():
    """
    Secure credential provider for telemetry scenario testing.
    1. Checks environment variables CIVICOS_TEST_USERNAME and CIVICOS_TEST_PASSWORD.
    2. If not set, provisions a disposable ephemeral test administrator account
       directly via AuthService with a cryptographically generated password,
       and disables/removes it during teardown.
    Never prints or hardcodes credentials.
    """
    env_user = os.getenv("CIVICOS_TEST_USERNAME")
    env_pass = os.getenv("CIVICOS_TEST_PASSWORD")
    if env_user and env_pass:
        yield {"username": env_user, "password": env_pass}
        return

    # Provision disposable ephemeral test administrator
    disposable_user = f"disposable_adm_{secrets.token_hex(4)}"
    disposable_pass = secrets.token_urlsafe(20) + "Aa1!"
    auth_service = AuthService(OPERATIONS_DB_PATH)
    auth_service.create_user(disposable_user, disposable_pass, "administrator")

    try:
        yield {"username": disposable_user, "password": disposable_pass}
    finally:
        # Secure cleanup: disable and revoke disposable test user
        try:
            with auth_service._connect() as conn:
                conn.execute("UPDATE users SET disabled = 1 WHERE username = ?", (disposable_user.casefold(),))
                conn.execute("DELETE FROM users WHERE username = ?", (disposable_user.casefold(),))
        except Exception:
            pass


def login_if_needed(page, creds):
    page.goto(f"{BASE_URL}/login")
    try:
        page.wait_for_selector("input[type='password']", timeout=3000)
        page.fill("input[type='text']", creds["username"])
        page.fill("input[type='password']", creds["password"])
        page.click("button[type='submit']")
        page.wait_for_url(f"{BASE_URL}/", timeout=10000)
    except Exception:
        # Already logged in
        pass


def test_scenario_a_populated_database(browser_context, test_admin_credentials):
    """Scenario A: Live populated backend - all real values rendered."""
    page = browser_context.new_page()
    login_if_needed(page, test_admin_credentials)

    page.goto(f"{BASE_URL}/")
    page.wait_for_load_state("networkidle", timeout=10000)
    time.sleep(2)

    # 1. API Health should be CONNECTED
    health_badge = page.get_by_text("API: Connected").first
    assert health_badge.is_visible(), "API Health must indicate 'API: Connected' on live backend"

    # 2. Total Incidents should be positive integer (125)
    total_val = page.get_by_test_id("kpi-total-incidents-value").inner_text().strip()
    assert "125" in total_val, f"Expected 125 total incidents in populated scenario, got: {total_val}"

    # 3. Active Incidents should be positive integer
    active_val = page.get_by_test_id("kpi-active-incidents-value").inner_text().strip()
    assert active_val not in ["N/A", "—"], f"Active incidents must be resolved, got: {active_val}"
    assert int(active_val) > 0, f"Expected active incidents > 0, got {active_val}"

    # 4. Critical Alerts should be real number (66)
    crit_val = page.get_by_test_id("kpi-critical-alerts-value").inner_text().strip()
    assert "66" in crit_val, f"Expected 66 critical alerts, got: {crit_val}"

    # 5. Active Work Orders should be real count (> 0)
    wo_val = page.get_by_test_id("kpi-active-work-orders-value").inner_text().strip()
    assert wo_val not in ["N/A", "—"], f"Work orders must be resolved, got: {wo_val}"
    assert int(wo_val) > 0, f"Expected active work orders > 0, got {wo_val}"

    # 6. High-Risk Zones should be DBSCAN clusters count
    hotspot_val = page.get_by_test_id("kpi-high-risk-zones-value").inner_text().strip()
    assert hotspot_val not in ["N/A", "—"], f"Hotspots must be resolved, got: {hotspot_val}"

    # 7. Cascading Events should be confirmed count (93)
    cascade_val = page.get_by_test_id("kpi-cascading-events-value").inner_text().strip()
    assert "93" in cascade_val, f"Expected 93 cascading events, got: {cascade_val}"

    page.close()


def test_scenario_b_empty_api_response(browser_context, test_admin_credentials):
    """
    Scenario B: Empty API Response Scenario
    Simulates empty municipal API responses to verify frontend displays 0 and
    ZERO fabricated fallback numbers (89, 8, 36, 93, 125).
    """
    page = browser_context.new_page()
    login_if_needed(page, test_admin_credentials)

    # Intercept API calls to simulate empty municipal API response payload
    page.route("**/health", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        json={"status": "healthy", "records_loaded": 0, "graph_nodes": 0, "graph_edges": 0, "ml_model_trained": True, "ml_test_accuracy": 0.0}
    ))
    page.route("**/api/incidents/summary", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        json={"total_records": 0, "critical_incidents_count": 0, "cascading_events_count": 0, "zones": {}, "categories": {}, "statuses": {}}
    ))
    page.route("**/api/incidents*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        json={"data": [], "meta": {"count": 0}}
    ))
    page.route("**/api/geospatial/hotspots*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        json={"hotspots": []}
    ))
    page.route("**/api/work-orders*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        json={"data": [], "meta": {"count": 0}}
    ))

    page.goto(f"{BASE_URL}/")
    time.sleep(2)

    # 1. API Health is still connected
    assert page.get_by_text("API: Connected").first.is_visible()

    # 2. Total Incidents must be strictly 0 (NOT 125)
    total_val = page.get_by_test_id("kpi-total-incidents-value").inner_text().strip()
    assert total_val == "0", f"Total Incidents must be '0', got '{total_val}'"
    assert "125" not in total_val, "Total Incidents must NOT fall back to 125!"

    # 3. Active Incidents must be strictly 0 (NOT 89)
    active_val = page.get_by_test_id("kpi-active-incidents-value").inner_text().strip()
    assert active_val == "0", f"Active Incidents must be '0', got '{active_val}'"
    assert "89" not in active_val, "Active Incidents must NOT fall back to 89!"

    # 4. Critical Alerts must be strictly 0 (NOT 66)
    crit_val = page.get_by_test_id("kpi-critical-alerts-value").inner_text().strip()
    assert crit_val == "0", f"Critical Alerts must be '0', got '{crit_val}'"
    assert "66" not in crit_val, "Critical Alerts must NOT fall back to 66!"

    # 5. High-Risk Zones must be strictly 0 (NOT 8)
    hotspot_val = page.get_by_test_id("kpi-high-risk-zones-value").inner_text().strip()
    assert hotspot_val == "0", f"High-Risk Zones must be '0', got '{hotspot_val}'"
    assert "8" not in hotspot_val, "High-Risk Zones must NOT fall back to 8!"

    # 6. Active Work Orders must be strictly 0 (NOT 36)
    wo_val = page.get_by_test_id("kpi-active-work-orders-value").inner_text().strip()
    assert wo_val == "0", f"Active Work Orders must be '0', got '{wo_val}'"
    assert "36" not in wo_val, "Active Work Orders must NOT fall back to 36!"

    # 7. Cascading Events must be strictly 0 (NOT 93)
    cascade_val = page.get_by_test_id("kpi-cascading-events-value").inner_text().strip()
    assert cascade_val == "0", f"Cascading Events must be '0', got '{cascade_val}'"
    assert "93" not in cascade_val, "Cascading Events must NOT fall back to 93!"

    page.close()


def test_scenario_c_backend_disconnected(browser_context, test_admin_credentials):
    """Scenario C: Backend disconnected - must show Disconnected badge and N/A metrics, NEVER LIVE."""
    page = browser_context.new_page()
    login_if_needed(page, test_admin_credentials)

    # Abort all backend network calls
    page.route("**/health", lambda route: route.abort())
    page.route("**/api/**", lambda route: route.abort())

    page.goto(f"{BASE_URL}/")
    time.sleep(2)

    # 1. API Health MUST show DISCONNECTED (Never LIVE, Never Connected)
    disconn_badge = page.get_by_text("API: Disconnected").first
    assert disconn_badge.is_visible(), "API status must clearly state 'API: Disconnected'"
    assert not page.locator("text=/API Health: LIVE/i").is_visible(), "Must NEVER show static 'LIVE' when disconnected!"

    # 2. Alert banner must be visible
    banner = page.locator("text=/Backend Disconnected/i")
    assert banner.is_visible(), "Disconnected warning banner must be displayed"

    # 3. KPIs should show N/A or —, NEVER fabricated metrics
    total_val = page.get_by_test_id("kpi-total-incidents-value").inner_text().strip()
    assert total_val in ["N/A", "—"], f"Total Incidents should be N/A or —, got: '{total_val}'"
    assert "125" not in total_val, "Total Incidents must NOT fabricate 125 when disconnected"

    page.close()
