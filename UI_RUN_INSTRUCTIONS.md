# CivicOS — UI Run Instructions
## Next-Generation 3D Urban Intelligence Command Center

**Frontend stack:** React 19.3.1 · TypeScript · Vite 8 · Three.js · Tailwind CSS · Framer Motion  
**Backend stack:** FastAPI · SQLite · Python 3.10 · scikit-learn · NetworkX  

---

## Prerequisites

| Requirement | Version | Check |
|---|---|---|
| Python | 3.10+ | `python --version` |
| Node.js | 18+ (tested: v24.20.0) | `node --version` |
| npm | 7+ (tested: 11.19.0) | `npm --version` |
| Python venv | pre-created as `venv_phase8/` | `ls venv_phase8/` |

All commands below assume the working directory is:
```
C:\Projects\CivicOS\CivicOS_Person3\
```

---

## Quick Start (Two Terminals)

### Terminal 1 — FastAPI Backend

```powershell
cd C:\Projects\CivicOS\CivicOS_Person3

# Activate the virtual environment
.\venv_phase8\Scripts\Activate.ps1

# Start the backend API server
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The backend will be available at: **http://localhost:8000**  
API documentation (Swagger UI): **http://localhost:8000/docs**  
Health check: **http://localhost:8000/health**

### Terminal 2 — React Frontend (Development Mode)

```powershell
cd C:\Projects\CivicOS\CivicOS_Person3\frontend

# Install dependencies (first time only)
npm install

# Start the development server
npm run dev
```

The frontend will be available at: **http://localhost:5173**

> **Note:** The dev server hot-reloads on file changes. Use this mode during development.

---

## Production Mode

```powershell
# Build for production
cd C:\Projects\CivicOS\CivicOS_Person3\frontend
npm run build

# Serve the production build
npx vite preview --port 5173 --host 127.0.0.1
```

The production build is at `frontend/dist/`. It can also be served by any static file server (nginx, Apache, `serve`, etc.).

---

## Demo Login Credentials

| Role | Username | Password |
|---|---|---|
| Administrator | `phase8_admin` | `Phase8AdminSecure123!` |
| Viewer (read-only) | `phase8_viewer` | `Phase8ViewerSecure123!` |

> Administrators can submit incidents, manage work orders, and access all features.  
> Viewers have read-only access to all 10 intelligence features.

---

## Navigation Guide

After logging in, use the left sidebar to navigate:

### Command Center
| View | Sidebar Label | URL |
|---|---|---|
| Dashboard | Home | `http://localhost:5173/` |
| Live 3D City Map | Live Map | `http://localhost:5173/map` |

### Intelligence Features
| # | Feature | Sidebar Label | URL |
|---|---|---|---|
| F1 | Urban Incident Relationship Graph | Relationship Graph | `/features/relationship-graph` |
| F2 | Geospatial Intelligence & Hotspot Detection | Geospatial | `/features/geospatial` |
| F3 | Predictive ML Intelligence | Predictive ML | `/features/predictive-ml` |
| F4 | Cascading Impact Prediction | Cascading Impact | `/features/cascading-impact` |
| F5 | Impact & Severity Scoring | Impact & Severity | `/features/impact-severity` |
| F6 | Smart Priority Engine | Smart Priority | `/features/smart-priority` |
| F7 | What-If Simulation | What-If | `/features/what-if` |
| F8 | Preventive Action Recommendations | Recommendations | `/features/recommendations` |
| F9 | Prevention Impact Score | Prevention Impact | `/features/prevention-impact` |
| F10 | Weather-Based Risk Analysis | Weather Risk | `/features/weather-risk` |

### Operations
| Page | Sidebar Label | URL |
|---|---|---|
| Incident Intake | New Incident | `/operations/incidents` |
| Work Orders | Work Orders | `/operations/work-orders` |

### Keyboard Shortcut
Press **`Ctrl+K`** anywhere to open the Command Palette for instant navigation to any page.

---

## Optional: Streamlit Dashboard (Legacy)

The original Streamlit dashboard remains fully functional as a fallback:

```powershell
cd C:\Projects\CivicOS\CivicOS_Person3
.\venv_phase8\Scripts\python.exe -m streamlit run dashboard/app.py --server.port 8501
```

Access at: **http://localhost:8501**

---

## Running the Test Suite

```powershell
cd C:\Projects\CivicOS\CivicOS_Person3

# Run all 31 backend tests
.\venv_phase8\Scripts\pytest.exe -v

# TypeScript type check (frontend)
cd frontend
npx tsc --noEmit

# Frontend production build check
npm run build
```

Expected results:
- Backend: **31/31 PASSED**
- TypeScript: **0 errors**
- Build: **SUCCESS** (979.67 kB JS, 261 kB gzip)

---

## Environment Configuration

The backend reads configuration from environment variables (with defaults):

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./civicos.db` | Database path |
| `ALLOWED_ORIGINS` | includes `localhost:5173`, `localhost:8501` | CORS allowed origins |
| `SECRET_KEY` | (auto-generated) | JWT signing key |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Session duration |

To override, create a `.env` file in `C:\Projects\CivicOS\CivicOS_Person3\`:
```env
DATABASE_URL=sqlite:///./civicos_prod.db
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8501
```

---

## Troubleshooting

### Port 8000 already in use
```powershell
# Find and kill the process on port 8000
netstat -ano | findstr :8000
# Note the PID, then:
taskkill /PID <PID> /F
```

### Port 5173 already in use
```powershell
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Frontend shows "Network Error" or CORS error
1. Ensure the backend is running on port 8000: `curl http://localhost:8000/health`
2. Ensure you started uvicorn with `--host 0.0.0.0` (not `127.0.0.1`)
3. Clear browser localStorage: F12 → Application → Local Storage → Clear

### Login fails with 401
- Use the verified credentials: `phase8_admin` / `Phase8AdminSecure123!`
- Do **not** use `civicadmin` — that account's password is different

### 3D city map shows nothing
- Ensure your browser supports WebGL: visit `https://get.webgl.org/`
- Try Chrome or Edge (Firefox also works)
- Ensure the backend is running — the map fetches from `/api/geospatial/hotspots`

---

## Architecture Overview

```
Browser (http://localhost:5173)
    │
    ├── React 19.3.1 + React Router v7
    ├── Three.js (WebGL 3D City Visualization)
    ├── Framer Motion (UI Animations)
    ├── Tailwind CSS (Dark Design System)
    └── Axios → Bearer token → FastAPI (http://localhost:8000)
                                    │
                                    ├── Intelligence Engines (10 features)
                                    ├── Auth + RBAC (JWT Bearer)
                                    ├── Work Order Operations
                                    └── SQLite Database (WAL mode)
```

---

*For full architecture details, see [UI_ARCHITECTURE.md](UI_ARCHITECTURE.md).*  
*For design tokens and component library, see [UI_DESIGN_SYSTEM.md](UI_DESIGN_SYSTEM.md).*  
*For test results, see [UI_TEST_REPORT.md](UI_TEST_REPORT.md).*  
*For browser acceptance evidence, see [UI_BROWSER_ACCEPTANCE_REPORT.md](UI_BROWSER_ACCEPTANCE_REPORT.md).*
