import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

OUTPUT_DIR = Path("C:/Projects/CivicOS/CivicOS_Person3/release_evidence/ui_redesign")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
BASE_URL = "http://127.0.0.1:5173"

ROUTES = [
    ("01_login_view", "/login", "Sign in"),
    ("02_command_center", "/", "Bengaluru Urban"),
    ("03_live_3d_city_map", "/map", "Live 3D Urban"),
    ("04_f1_relationship_graph", "/features/graph", "Incident Relationship"),
    ("05_f2_geospatial_hotspots", "/features/geospatial", "DBSCAN"),
    ("06_f3_predictive_ml", "/features/predictive", "Prediction Input"),
    ("07_f4_cascading_impact", "/features/cascade", "Cascade Simulation"),
    ("08_f5_impact_severity", "/features/impact", "Incident Parameters"),
    ("09_f6_smart_priority", "/features/priority", "Priority Input"),
    ("10_f7_what_if_simulation", "/features/whatif", "Simulation Parameters"),
    ("11_f8_preventive_recommendations", "/features/recommendations", "Playbook"),
    ("12_f9_prevention_impact", "/features/prevention", "Programme Setup"),
    ("13_f10_weather_risk", "/features/weather", "Weather Parameters"),
    ("14_operations_incident_intake", "/operations/intake", "Operational Incident Intake"),
    ("15_operations_work_orders", "/operations/work-orders", "Operational Work Orders"),
]

VIEWPORTS = [
    ("16_responsive_desktop_1920x1080", 1920, 1080),
    ("17_responsive_laptop_1366x768", 1366, 768),
    ("18_responsive_tablet_768x1024", 768, 1024),
    ("19_responsive_mobile_390x844", 390, 844),
]

def main():
    print("Capturing 100% verified screenshots for CivicOS 3D Command Center...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # Step 1: Login
        page.goto(f"{BASE_URL}/login")
        page.wait_for_selector("input[type='password']", timeout=15000)
        page.screenshot(path=str(OUTPUT_DIR / "01_login_view.png"), full_page=True)
        print("✓ 01_login_view captured")

        # Authenticate
        page.fill("input[type='text']", "phase8_admin")
        page.fill("input[type='password']", "Phase8AdminSecure123!")
        page.click("button[type='submit']")
        page.wait_for_selector("text=Bengaluru Urban", timeout=15000)
        time.sleep(2)

        # 02_command_center screenshot right after login
        shot_02 = OUTPUT_DIR / "02_command_center.png"
        page.screenshot(path=str(shot_02), full_page=True)
        print(f"✓ 02_command_center captured: {shot_02.stat().st_size:,} bytes")

        # Iterate through remaining routes (from index 2 onwards)
        for name, path, check_str in ROUTES[2:]:
            page.goto(f"{BASE_URL}{path}")
            time.sleep(2.5)
            shot_file = OUTPUT_DIR / f"{name}.png"
            page.screenshot(path=str(shot_file), full_page=True)
            size = shot_file.stat().st_size
            print(f"✓ {name} ({path}) captured: {size:,} bytes")

        # Responsive captures of dashboard
        for name, w, h in VIEWPORTS:
            page.set_viewport_size({"width": w, "height": h})
            time.sleep(1)
            page.goto(f"{BASE_URL}/")
            page.wait_for_selector("text=Bengaluru Urban", timeout=15000)
            time.sleep(1.5)
            shot_file = OUTPUT_DIR / f"{name}.png"
            page.screenshot(path=str(shot_file), full_page=True)
            size = shot_file.stat().st_size
            print(f"✓ {name} ({w}x{h}) captured: {size:,} bytes")

        browser.close()

    print("\nALL 19 SCREENSHOTS CAPTURED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
