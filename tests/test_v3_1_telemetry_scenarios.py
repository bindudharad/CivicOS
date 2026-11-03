"""
CivicOS V3.1.2 Telemetry Data Integrity and Health-Check Hardening Tests
Tests all five critical health-check and telemetry conditions in Chromium:
  1. Every service operational (Status: Connected, live telemetry rendered)
  2. One sub-service unavailable (Status: Degraded, partial outage disclosed)
  3. Root backend unavailable (Status: Disconnected, N/A metrics, zero LIVE flags)
  4. Expired authentication (Status: Degraded / Auth Required, NOT Disconnected)
  5. Empty but healthy database (Status: Connected, metrics strictly 0, ZERO fallbacks)

Security Guarantee:
  - Requires explicit CIVICOS_TEST_USERNAME and CIVICOS_TEST_PASSWORD for live backend authentication.
  - Zero modifications to canonical project runtime database (OPERATIONS_DB_PATH).
  - Zero hardcoded passwords in source code.
"""
import os
import pytest
import time
from playwright.sync_api import sync_playwright

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
    Secure credential provider for live telemetry testing.
    Requires explicitly configured credentials via CIVICOS_TEST_USERNAME and CIVICOS_TEST_PASSWORD.

    To ensure test isolation and protect municipal data integrity, this fixture
    does NOT write to or modify the canonical project runtime database.
    If credentials are not configured, live integration tests are safely skipped.
    """
    env_user = os.getenv("CIVICOS_TEST_USERNAME")
    env_pass = os.getenv("CIVICOS_TEST_PASSWORD")
    if env_user and env_pass:
        return {"username": env_user, "password": env_pass}

    pytest.skip(
        "CIVICOS_TEST_USERNAME and CIVICOS_TEST_PASSWORD environment variables are not configured. "
        "Skipping live browser integration tests to prevent modification of canonical project database."
    )


def login_with_env_credentials(page, creds):
    """Authenticate via UI using explicit environment credentials."""
    page.goto(f"{BASE_URL}/login")
    try:
        page.wait_for_selector("input[type='password']", timeout=3000)
        page.fill("input[type='text']", creds["username"])
        page.fill("input[type='password']", creds["password"])
        page.click("button[type='submit']")
        page.wait_for_url(f"{BASE_URL}/", timeout=10000)
    except Exception:
        # Session already established
        pass


# ─── 1. Every Service Operational ─────────────────────────────────────────────
def test_scenario_1_every_service_operational(browser_context, test_admin_credentials):
    """Condition 1: Every service operational -> Status: Connected, verified KPIs rendered."""
    page = browser_context.new_page()
    login_with_env_credentials(page, test_admin_credentials)

    page.goto(f"{BASE_URL}/")
    page.wait_for_load_state("networkidle", timeout=10000)
    time.sleep(2)

    # 1. API Health must show Connected on both Navbar and Dashboard
    health_badge = page.get_by_text("API: Connected").first
    assert health_badge.is_visible(), "Navbar and Dashboard must indicate 'API: Connected' when all services are healthy"

    # 2. Total Incidents should be positive integer (125)
    total_val = page.get_by_test_id("kpi-total-incidents-value").inner_text().strip()
    assert "125" in total_val, f"Expected 125 total incidents in populated scenario, got: {total_val}"

    # 3. Active Incidents should be positive integer
    active_val = page.get_by_test_id("kpi-active-incidents-value").inner_text().strip()
    assert active_val not in ["N/A", "—"], f"Active incidents must be resolved, got: {active_val}"
    assert int(active_val) > 0, f"Expected active incidents > 0, got {active_val}"

    # 4. Critical Alerts should be confirmed number (66)
    crit_val = page.get_by_test_id("kpi-critical-alerts-value").inner_text().strip()
    assert "66" in crit_val, f"Expected 66 critical alerts, got: {crit_val}"

    # 5. Cascading Events should be confirmed number (93)
    cascade_val = page.get_by_test_id("kpi-cascading-events-value").inner_text().strip()
    assert "93" in cascade_val, f"Expected 93 cascading events, got: {cascade_val}"

    page.close()


# ─── 2. One Sub-Service Unavailable ───────────────────────────────────────────
def test_scenario_2_one_subservice_unavailable(browser_context, test_admin_credentials):
    """Condition 2: One sub-service unavailable -> Status: Degraded, partial outage banner visible."""
    page = browser_context.new_page()
    login_with_env_credentials(page, test_admin_credentials)

    # Sub-service failure on work-orders endpoint
    page.route("**/api/work-orders*", lambda route: route.fulfill(
        status=503,
        content_type="application/json",
        json={"detail": "Work orders service unavailable"}
    ))

    page.goto(f"{BASE_URL}/")
    time.sleep(2)

    # 1. API Health must show Degraded (NOT Connected, NOT Disconnected)
    degraded_badge = page.get_by_text("API: Degraded").first
    assert degraded_badge.is_visible(), "Must indicate 'API: Degraded' when a sub-service fails"
    assert not page.get_by_text("API: Connected").first.is_visible(), "Must NOT display 'API: Connected' during partial outage"

    # 2. Partial outage banner must be visible identifying failed service
    banner = page.locator("text=/Unable to reach/i")
    assert banner.is_visible(), "Partial outage alert banner must be displayed"
    assert "Work Orders" in banner.inner_text(), "Banner must identify Work Orders service"

    # 3. Successful endpoints still render confirmed telemetry
    total_val = page.get_by_test_id("kpi-total-incidents-value").inner_text().strip()
    assert "125" in total_val, "Confirmed telemetry from active endpoints must remain visible"

    page.close()


# ─── 3. Root Backend Unavailable ──────────────────────────────────────────────
def test_scenario_3_root_backend_unavailable(browser_context, test_admin_credentials):
    """Condition 3: Root backend unavailable -> Status: Disconnected, N/A metrics, zero LIVE flags."""
    page = browser_context.new_page()
    login_with_env_credentials(page, test_admin_credentials)

    # Abort all network traffic to simulate server down
    page.route("**/health", lambda route: route.abort())
    page.route("**/api/**", lambda route: route.abort())

    page.goto(f"{BASE_URL}/")
    time.sleep(2)

    # 1. API Health MUST show DISCONNECTED (Never LIVE, Never Connected)
    disconn_badge = page.get_by_text("API: Disconnected").first
    assert disconn_badge.is_visible(), "API status must clearly state 'API: Disconnected'"
    assert not page.locator("text=/API Health: LIVE/i").is_visible(), "Must NEVER show static 'LIVE' when disconnected!"

    # 2. Disconnected alert banner must be visible
    banner = page.locator("text=/Backend Disconnected/i")
    assert banner.is_visible(), "Disconnected warning banner must be displayed"

    # 3. KPIs should show N/A or —, NEVER fabricated metrics
    total_val = page.get_by_test_id("kpi-total-incidents-value").inner_text().strip()
    assert total_val in ["N/A", "—"], f"Total Incidents should be N/A or —, got: '{total_val}'"
    assert "125" not in total_val, "Total Incidents must NOT fabricate 125 when disconnected"

    page.close()


# ─── 4. Expired Authentication ────────────────────────────────────────────────
def test_scenario_4_expired_authentication(browser_context, test_admin_credentials):
    """Condition 4: Expired authentication (HTTP 401) -> Status: Degraded / Auth Required, NOT Disconnected."""
    page = browser_context.new_page()
    login_with_env_credentials(page, test_admin_credentials)

    # Authenticated endpoints return 401 while root health remains healthy
    page.route("**/api/incidents*", lambda route: route.fulfill(
        status=401,
        content_type="application/json",
        json={"detail": "Valid session required."}
    ))
    page.route("**/api/work-orders*", lambda route: route.fulfill(
        status=401,
        content_type="application/json",
        json={"detail": "Valid session required."}
    ))

    page.goto(f"{BASE_URL}/")
    time.sleep(2)

    # 1. API Health must show Degraded, NEVER Disconnected (the server is online!)
    assert page.get_by_text("API: Degraded").first.is_visible(), "Must indicate Degraded when session is expired"
    assert not page.get_by_text("API: Disconnected").first.is_visible(), "Must NOT claim Disconnected for authentication expiration!"

    # 2. Degraded banner must note auth required / session expired
    banner = page.locator("text=/Unable to reach/i")
    assert banner.is_visible(), "Degraded banner must be displayed"
    assert "Auth Required" in banner.inner_text() or "Session Expired" in banner.inner_text(), "Banner must distinguish auth from backend outage"

    page.close()


# ─── 5. Empty but Healthy Database ───────────────────────────────────────────
def test_scenario_5_empty_healthy_database(browser_context, test_admin_credentials):
    """Condition 5: Empty but healthy database -> Status: Connected, values strictly 0, ZERO fallback constants."""
    page = browser_context.new_page()
    login_with_env_credentials(page, test_admin_credentials)

    # Intercept API calls to simulate confirmed empty database
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

    # 1. API Health is Connected
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
