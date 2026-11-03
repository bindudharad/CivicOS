# CivicOS V3 "Urban Pulse" Run & Demonstration Instructions

**Application:** CivicOS AI-Powered Urban Intelligence Command Center  
**Version:** 3.0.0 (Urban Pulse V3)  
**Target Repository:** `C:\Projects\CivicOS\CivicOS_Person3`  
**Frontend Path:** `C:\Projects\CivicOS\CivicOS_Person3\frontend`

---

## 1. Quick Start Commands

To run CivicOS locally, open two PowerShell terminals:

### Terminal 1 — Start FastAPI Backend
```powershell
cd C:\Projects\CivicOS\CivicOS_Person3
.\venv_phase8\Scripts\activate
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
* Backend URL: `http://127.0.0.1:8000`
* Interactive API Docs: `http://127.0.0.1:8000/docs`
* Health Check: `http://127.0.0.1:8000/health`

### Terminal 2 — Start React 19 Frontend
```powershell
cd C:\Projects\CivicOS\CivicOS_Person3\frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
* Command Center URL: `http://127.0.0.1:5173`

---

## 2. Authentication & Demonstration Credentials

CivicOS enforces role-based access control (RBAC). Use the pre-configured municipal accounts below:

| Role | Username | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `phase8_admin` | [Configured via CIVICOS_TEST_PASSWORD / init_admin.py] | Full access: View all telemetry, assign work orders, resolve work orders, run all simulations |
| **Department Operator** | `phase6_operator` | `Phase6-secure-password-42` | Operational access: Incident intake, resolve assigned work orders |
| **Municipal Viewer** | `phase8_viewer` | `Phase8ViewerSecure123!` | Read-only access: View dashboards, 3D city map, and intelligence features |

---

## 3. Key Navigation & Shortcuts

* **Global Command Palette:** Press `Ctrl + K` (or `Cmd + K` on macOS) anywhere in the application to open the quick navigation launcher to instantly jump to any feature or operation.
* **Navigation Structure:**
  * **OVERVIEW:**
    * Command Center (`/`) — Central embedded 3D urban digital twin, 6 KPIs, live triage feed, incident registry.
    * Live 3D City (`/map`) — Full-screen Three.js digital twin, camera presets (3D Orbit, Top-Down, Isometric), layer toggles, incident inspector drawer.
  * **INTELLIGENCE (F1–F10):**
    * F1: Incident Graph (`/features/graph`) — Dynamic ID selector (`INC-1001`), SVG topology network, node pivot.
    * F2: Geospatial Hotspots (`/features/geospatial`) — DBSCAN density clustering & scattermap.
    * F3: Predictive ML (`/features/predictive`) — 96.9% test accuracy, inference form, confidence dial.
    * F4: Cascade Impact (`/features/cascade`) — Multi-stage infrastructure consequence chain.
    * F5: Impact & Severity (`/features/impact`) — Composite severity scoring gauge & exposure sub-metrics.
    * F6: Smart Priority (`/features/priority`) — Operational dispatch triage queue & urgency ranking.
    * F7: What-If Simulation (`/features/whatif`) — Counterfactual precipitation stress testing & inundation risk.
    * F8: Recommendations (`/features/recommendations`) — Concrete action playbooks & crew directives.
    * F9: Prevention Impact (`/features/prevention`) — Net risk reduction percentage & ROI valuation.
    * F10: Weather Risk (`/features/weather`) — Weather risk multiplier & active meteorological alert cards.
  * **OPERATIONS:**
    * Incident Intake (`/operations/intake`) — Register new incidents with 1-click DEMO presets.
    * Work Orders (`/operations/work-orders`) — Manage, filter, assign, and resolve municipal work orders.

---

## 4. Automated Verification & Screenshot Capture

To re-run the automated 21-screenshot browser acceptance suite:
```powershell
cd C:\Projects\CivicOS\CivicOS_Person3
.\venv_phase8\Scripts\activate
python capture_v3_evidence.py
```
Screenshots will be captured and validated in `release_evidence/ui_redesign_v3/`.

---

## 5. Legacy Streamlit Command Center Fallback

The original Streamlit command center remains intact as an operational fallback:
```powershell
cd C:\Projects\CivicOS\CivicOS_Person3
.\venv_phase8\Scripts\activate
streamlit run dashboard/app.py --server.port 8501
```
* Streamlit Fallback URL: `http://localhost:8501`
