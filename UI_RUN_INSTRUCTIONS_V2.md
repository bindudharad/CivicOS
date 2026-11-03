# CivicOS V2 "Urban Pulse" Run & Demonstration Instructions

**Application:** CivicOS AI-Powered Urban Intelligence Command Center  
**Branch:** `feat/ui-v2-urban-pulse`  
**Root Directory:** `C:\Projects\CivicOS\CivicOS_Person3`  
**Frontend Directory:** `C:\Projects\CivicOS\CivicOS_Person3\frontend`

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

### Terminal 2 — Start React 18 Frontend
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
| **Administrator** | `phase8_admin` | `Phase8AdminSecure123!` | Full access: View all telemetry, assign work orders, resolve work orders, run all simulations |
| **Department Operator** | `phase6_operator` | `Phase6-secure-password-42` | Operational access: Incident intake, resolve assigned work orders |
| **Municipal Viewer** | `phase8_viewer` | `Phase8ViewerSecure123!` | Read-only access: View dashboards, 3D city map, and intelligence features |

---

## 3. Key Navigation & Shortcuts

* **Global Command Palette:** Press `Ctrl + K` (or `Cmd + K` on macOS) anywhere in the application to open the quick navigation launcher to instantly jump to any feature or operation.
* **Navigation Structure:**
  * **OVERVIEW:**
    * Command Center (`/`) — High-level telemetry, 6 KPIs, spatial preview, live incident registry.
    * 3D City Map (`/map`) — Interactive Three.js digital twin, raycasting, inspector drawer, camera presets.
  * **INTELLIGENCE FEATURES (F1–F10):**
    * F1: Relationship Graph (`/features/graph`)
    * F2: Geospatial Hotspots (`/features/geospatial`)
    * F3: Predictive ML (`/features/predictive`)
    * F4: Cascading Impact (`/features/cascade`)
    * F5: Impact & Severity (`/features/impact`)
    * F6: Smart Priority (`/features/priority`)
    * F7: What-If Simulation (`/features/whatif`)
    * F8: Recommendations (`/features/recommendations`)
    * F9: Prevention Impact (`/features/prevention`)
    * F10: Weather Risk (`/features/weather`)
  * **OPERATIONS:**
    * Incident Intake (`/operations/intake`) — Register new incidents with one-click presets.
    * Work Orders (`/operations/work-orders`) — Manage, filter, assign, and resolve municipal work orders.

---

## 4. Automated Verification & Screenshot Capture

To re-run the automated 20-screenshot browser acceptance suite:
```powershell
cd C:\Projects\CivicOS\CivicOS_Person3
.\venv_phase8\Scripts\activate
python capture_v2_evidence.py
```
Screenshots will be captured and validated in `release_evidence/ui_redesign_v2/`.

---

## 5. Legacy Streamlit Command Center Fallback

The original Streamlit command center remains intact as an operational fallback:
```powershell
cd C:\Projects\CivicOS\CivicOS_Person3
.\venv_phase8\Scripts\activate
streamlit run dashboard/app.py --server.port 8501
```
* Streamlit Fallback URL: `http://localhost:8501`
