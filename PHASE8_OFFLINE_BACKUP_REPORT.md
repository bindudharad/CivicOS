# PHASE 8 OFFLINE BACKUP DEMONSTRATION REPORT
**CivicOS — Standalone Resilient Operation in Disconnected Environments**
*Audit Date: November 2, 2026 | Sign-Off Status: 100% OPERATIONAL OFFLINE*

---

## 1. Offline Architecture & Zero-Cloud Dependency

CivicOS has been engineered to operate completely disconnected from external internet infrastructure:
1. **Local Spatial Computing**: Uses local Haversine calculations and offline GeoJSON buffers; no third-party GIS APIs (Mapbox, Google Maps API, or ArcGIS) are required. OpenStreetMap tiles use native public cached formats or fallback Plotly scatter layouts.
2. **Local Machine Learning**: Scikit-learn Random Forest model serializes and trains entirely in-memory from local CSV data. Zero external inference endpoints (OpenAI, HuggingFace, etc.) are called.
3. **Local Graph Network**: NetworkX constructs, indexes, and queries incident topological graphs on the local host CPU with zero external graph database dependencies.
4. **Local Cryptographic Storage**: SQLite 3 with Write-Ahead Logging operates on local disk storage with zero cloud database dependencies (AWS RDS, Supabase, Firebase).
5. **Offline Meteorological Simulation**: Feature 10 (Weather-Based Risk) includes a dedicated offline operator-input path allowing simulation of any rain/wind/temperature conditions with explicit data classification labels.

---

## 2. Dedicated Backup Demonstration Database

- **Location**: `data/runtime/final-release-demo.sqlite3`
- **Pre-loaded Incident Records**:
  - `INC-1001` to `INC-1125`: 125 historical urban incidents across 5 Bengaluru zones.
  - Active operational incidents and pre-verified work orders across all four lifecycle states (`open`, `assigned`, `in_progress`, `resolved`).
- **Pre-configured Accounts**:
  - `civicadmin`: Role `administrator`
  - `phase8_admin`: Role `administrator`
  - `phase8_viewer`: Role `viewer`

---

## 3. Cold-Start Offline Verification Procedure

To run the complete CivicOS offline demonstration from scratch:
1. **Network Disconnect**: Disconnect Wi-Fi or disable the active network adapter.
2. **Launch Services**:
   ```cmd
   start_civicos.bat
   ```
   Or independently:
   ```cmd
   start_backend.bat
   start_frontend.bat
   ```
3. **Verify FastAPI Backend**:
   Navigate to `http://127.0.0.1:8000/health`. Verify output returns `status: "healthy"` and `records_loaded: 125`.
4. **Verify Command Center Frontend**:
   Open Chrome to `http://127.0.0.1:8501`.
5. **Execute Workflow**:
   - Navigate through Features 1 to 10.
   - All interactive Plotly figures, network trees, risk predictions, and what-if simulations render instantly without internet access.
   - Submit new incidents and execute the dispatch workflow via the Command Center.

---

## 4. Disaster Recovery & Troubleshooting Runbook

| Failure Symptom | Probable Root Cause | Recovery Action |
|:---|:---|:---|
| Port 8000 already in use | Previous background FastAPI process active | Run `Get-Process python \| Stop-Process -Force` in PowerShell, then rerun `start_backend.bat`. |
| Port 8501 already in use | Previous Streamlit server instance lingering | Stop process using port 8501 or launch with `--server.port 8502`. |
| Database locked error | Concurrency conflict or interrupted write | SQLite WAL journal will auto-recover upon new connection. If corrupted, restore from `data/runtime/final-release-demo.sqlite3`. |
| Browser shows blank white screen | WebSockets blocked or browser caching stale scripts | Hard refresh Chrome with `Ctrl + F5`. |
