"""
CivicOS Next-Generation 3D UI Acceptance & Browser Verification Script
Runs end-to-end Playwright automation across all 10 intelligence features,
operations center, 3D live map, responsive viewports, and interaction flows.
"""
import sys
import os
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

OUTPUT_DIR = Path("C:/Projects/CivicOS/CivicOS_Person3/release_evidence/ui_redesign")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

BASE_URL = "http://127.0.0.1:5173"

PAGES_TO_VERIFY = [
    ("01_login_view", "/login", "Sign in"),
    ("02_command_center", "/", "Bengaluru Urban"),
    ("03_live_3d_city_map", "/map", "Live 3D Urban"),
    ("04_f1_relationship_graph", "/features/graph", "Incident ID"),
    ("05_f2_geospatial_hotspots", "/features/geospatial", "DBSCAN"),
    ("06_f3_predictive_ml", "/features/predictive", "Prediction Input"),
    ("07_f4_cascading_impact", "/features/cascade", "Cascade Simulation"),
    ("08_f5_impact_severity", "/features/impact", "Incident Parameters"),
    ("09_f6_smart_priority", "/features/priority", "Priority Input"),
    ("10_f7_what_if_simulation", "/features/whatif", "Simulation Parameters"),
    ("11_f8_preventive_recommendations", "/features/recommendations", "Incident Type"),
    ("12_f9_prevention_impact", "/features/prevention", "Prevention Programme Setup"),
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
    print("=" * 60)
    print("CIVICOS 3D UI REDESIGN BROWSER VERIFICATION & ACCEPTANCE")
    print("=" * 60)

    results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # Step 1: Login Page
        print("\n[Step 1] Verifying Login Page...")
        page.goto(f"{BASE_URL}/login")
        page.wait_for_selector("input[type='password']", timeout=15000)
        time.sleep(1)
        login_shot = OUTPUT_DIR / "01_login_view.png"
        page.screenshot(path=str(login_shot), full_page=True)
        results.append(("01_login_view", True, "Rendered login with credentials"))
        print(f"  ✓ Login page rendered & captured -> {login_shot.name}")

        # Step 2: Perform Login
        print("\n[Step 2] Authenticating as phase8_admin...")
        page.fill("input[type='text']", "phase8_admin")
        page.fill("input[type='password']", "Phase8AdminSecure123!")
        page.click("button[type='submit']")
        
        # Wait for client-side navigation to Command Center
        page.wait_for_selector("text=Bengaluru Urban", timeout=15000)
        time.sleep(2)
        print("  ✓ Authenticated and redirected to Command Center.")

        # Step 3: Capture each feature & operation page
        print("\n[Step 3] Traversing all system views & intelligence features...")
        for name, path, expected_text in PAGES_TO_VERIFY[1:]:
            url = f"{BASE_URL}{path}"
            print(f"  Navigating to {path} ({name})...")
            page.goto(url)
            try:
                page.wait_for_load_state("networkidle", timeout=10000)
            except Exception:
                pass
            time.sleep(1.5)

            shot_path = OUTPUT_DIR / f"{name}.png"
            page.screenshot(path=str(shot_path), full_page=True)

            content = page.content()
            found = expected_text in content
            status_str = "PASS" if found else "WARN (content text not strictly matched)"
            print(f"    [{status_str}] Captured -> {shot_path.name}")
            results.append((name, found, f"Rendered at {path}"))

        # Step 4: Responsive Viewport captures
        print("\n[Step 4] Capturing responsive viewports...")
        for name, w, h in VIEWPORTS:
            page.set_viewport_size({"width": w, "height": h})
            page.goto(f"{BASE_URL}/")
            time.sleep(1.5)
            shot_path = OUTPUT_DIR / f"{name}.png"
            page.screenshot(path=str(shot_path), full_page=True)
            print(f"  ✓ Viewport {w}x{h} captured -> {shot_path.name}")
            results.append((name, True, f"Rendered at {w}x{h}"))

        browser.close()

    print("\n" + "=" * 60)
    print("SUMMARY OF UI ACCEPTANCE CHECKS")
    print("=" * 60)
    all_passed = True
    for name, passed, detail in results:
        mark = "✓" if passed else "✗"
        print(f" {mark} {name:38} : {detail}")
        if not passed:
            all_passed = False

    print("\nTotal screenshots captured:", len(list(OUTPUT_DIR.glob("*.png"))))
    print("All UI checks completed successfully!" if all_passed else "Some checks had warnings.")
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
