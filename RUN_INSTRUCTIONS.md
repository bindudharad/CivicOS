# CivicOS Run Instructions (Phase 8 Final Release)

From `C:\Projects\CivicOS\CivicOS_Person3`:

### 1. One-Click Dual Launch (Windows)
Double-click or run:
```powershell
.\start_civicos.bat
```
This launches the FastAPI gateway at `http://127.0.0.1:8000` and the Streamlit Command Center at `http://127.0.0.1:8501` in separate terminal windows.

### 2. Manual Independent Launch

**Terminal 1 — FastAPI Backend**:
```powershell
python main.py
```
API Documentation & OpenAPI specs: `http://127.0.0.1:8000/docs`
Health Status: `http://127.0.0.1:8000/health`

**Terminal 2 — Streamlit Frontend**:
```powershell
streamlit run dashboard/app.py
```
Command Center Console: `http://127.0.0.1:8501`

### 3. Authentication & User Provisioning
To create an administrative user securely without credentials in source code:
```powershell
python init_admin.py
```
Default pre-provisioned demo accounts:
- `civicadmin` (Administrator)
- `phase8_admin` (Administrator)
- `phase8_viewer` (Viewer)

### 4. Automated Regression & Acceptance Verification

**Run Complete 31-Test Pytest Suite**:
```powershell
pytest -v
```

**Run End-to-End Lifecycle & Security Verification**:
```powershell
python run_phase8_lifecycle_security_e2e.py
```

**Run Performance & Data Quality Benchmarking**:
```powershell
python benchmark_performance.py
```

**Run Playwright Chromium Real Browser Acceptance**:
```powershell
python release_browser_phase8.py
```
