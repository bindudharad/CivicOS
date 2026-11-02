# CivicOS Five-Minute Hackathon Demonstration Guide (Phase 8 Final)

### Rehearsed Presentation Timeline (Target: Exactly 5:00)

1. **00:00 – 00:35 | Urban Crisis Context & Platform Architecture**
   - Open Overview & Explorer (`http://127.0.0.1:8501`).
   - Highlight the 5 top KPIs, 125 historical incidents, and zone distribution across Bengaluru.
   - Explain how isolated municipal tickets cause multi-million dollar cascading failures during monsoons.

2. **00:35 – 01:10 | Incident Intake & Mathematical De-duplication**
   - Switch to **Command Center: Incident Operations** (Tab 1: Submit & Analyze).
   - Submit drainage incident (65mm rain, 8.0 severity).
   - Point out NLP classification and dual-threshold duplicate diagnostics (Haversine $\le 0.35$ km, Jaccard text similarity $\ge 0.25$).

3. **01:10 – 01:55 | Urban Relationship Graph, GIS Hotspots & Weather Risk**
   - Switch to **Feature 1: Relationship Graph**: Show ego-network highlighting and causal edge weights.
   - Switch to **Feature 2: Geospatial Intelligence**: Explore DBSCAN density clusters and 32-point geodesic circular impact buffers.
   - Switch to **Feature 10: Weather-Based Risk**: Demonstrate RED ALERT hazard multiplier (+1.75x) under 72mm rainfall.

4. **01:55 – 02:45 | ML Predictive Cascade Risk & Consequence Trees**
   - Switch to **Feature 3: Predictive ML Intelligence**: Point out the Random Forest model scorecard and probability gauge.
   - Switch to **Feature 4: Cascading Impact Prediction**: Explore the 3-level tree visual (Root $\to$ Secondary $\to$ Tertiary). Show cascade breaker actions.

5. **02:45 – 03:35 | Smart Priority Triage & What-If Stress Simulation**
   - Switch to **Feature 6: Smart Priority Engine**: Show priority score of 83/100 (Critical Dispatch Tier).
   - Switch to **Feature 7: What-If Simulation**: Slide the rainfall surge control to +50mm; observe real-time projected flood zones without altering live records.

6. **03:35 – 04:20 | Preventive Playbooks & Automated Work Orders**
   - Switch to **Feature 8 & 9: Preventive Action & Prevention Impact Score**: Show high risk-reduction ROI.
   - In **Command Center (Tab 2: Work Order Queue)**: Assign `Rapid Dewatering Crew A`, then click **Start field work**.

7. **04:20 – 05:00 | Verified Resolution & Offline Durability**
   - Enter resolution evidence note and click **Record resolution**.
   - Show closed status across both the work order and parent incident.
   - Conclude: 100% offline-resilient, transactional SQLite ledger, zero cloud dependencies.

---

### Clean Demo Launch Environment
For a clean demonstration using the pre-seeded demo database:
```powershell
$env:CIVICOS_OPERATIONS_DB = "C:\Projects\CivicOS\CivicOS_Person3\data\runtime\final-release-demo.sqlite3"
.\start_civicos.bat
```
Detailed speaking notes and recovery steps: see `PHASE8_FINAL_DEMO_SCRIPT.md`.
