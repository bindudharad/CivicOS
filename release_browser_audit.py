"""Capture real Chrome evidence from the local Streamlit application."""
from pathlib import Path
import secrets
from playwright.sync_api import sync_playwright
from src.config import OPERATIONS_DB_PATH
from src.operations.service import OperationsService
from src.security.auth import AuthService

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "release_evidence" / "screenshots"
OUT.mkdir(parents=True, exist_ok=True)
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
username = "release_browser_" + secrets.token_hex(4)
password = secrets.token_urlsafe(20)
OperationsService(OPERATIONS_DB_PATH)
AuthService(OPERATIONS_DB_PATH).create_user(username, password, "municipal_officer")

def capture(page, name: str):
    page.screenshot(path=str(OUT / name), full_page=True)

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(executable_path=CHROME, headless=True)
    page = browser.new_page(viewport={"width": 1366, "height": 768})
    errors = []
    page.on("console", lambda message: errors.append(f"{message.type}: {message.text}") if message.type == "error" else None)
    page.goto("http://127.0.0.1:8501", wait_until="domcontentloaded", timeout=30000)
    page.get_by_text("Total Incidents", exact=True).wait_for(timeout=30000)
    capture(page, "01-overview-1366x768.png")
    page.set_viewport_size({"width": 1920, "height": 1080}); capture(page, "02-overview-1920x1080.png")
    page.set_viewport_size({"width": 768, "height": 1024}); capture(page, "03-overview-768x1024.png")
    page.set_viewport_size({"width": 390, "height": 844}); capture(page, "04-overview-390x844.png")
    page.set_viewport_size({"width": 1366, "height": 768})
    # Streamlit's first selectbox owns the view selector.
    selector = page.locator('[role="combobox"]').first
    selector.click()
    selector.press("End")
    selector.press("Enter")
    page.get_by_text("Unified Incident-to-Resolution Command Center", exact=False).wait_for(timeout=15000)
    capture(page, "05-command-center.png")
    page.get_by_label("Username").fill(username)
    page.get_by_role("textbox", name="Password").fill(password)
    page.get_by_role("button", name="Log in").click()
    page.get_by_text("Logged in as municipal_officer.", exact=True).wait_for(timeout=15000)
    capture(page, "06-authenticated-command-center.png")
    page.get_by_role("button", name="Run pipeline and create work order").click()
    page.get_by_text("was triaged", exact=False).wait_for(timeout=30000)
    capture(page, "07-incident-intake-result.png")
    (OUT / "browser-console-errors.txt").write_text("\n".join(errors) or "No console errors captured.\n", encoding="utf-8")
    browser.close()
