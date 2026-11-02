# PHASE 8 PERFORMANCE AND DATA QUALITY REPORT
**CivicOS — Latency Benchmarks, Scalability Profiles & Dataset Integrity**
*Audit Date: November 2, 2026 | Benchmark Tool: benchmark_performance.py*

---

## 1. Empirical Latency Benchmarks

All performance figures below are genuine measured execution latencies run on the local host environment using high-resolution performance counters (`time.perf_counter()`):

| Performance Dimension | 100 Records | 500 Records | 1,000 Records | Operational Impact & Threshold |
|:---|:---:|:---:|:---:|:---|
| **Graph Construction Latency** | $17.29$ ms | $84.34$ ms | $126.36$ ms | Scales sub-quadratically due to zonal filtering ($< 250$ ms budget). |
| **DBSCAN Spatial Clustering** | $10.73$ ms | $14.08$ ms | $17.48$ ms | Haversine metric scales linearly with indexed spatial coordinates. |
| **ML Training Time (Random Forest)** | $202.25$ ms | $229.66$ ms | $225.67$ ms | 100 trees, depth 5 trains in $< 0.25$ seconds cold-start. |
| **ML Single-Record Inference** | $11.58$ ms | $10.61$ ms | $11.83$ ms | Real-time classification throughput $\approx 85+$ predictions/sec. |
| **Cascade Consequence Evaluation** | $0.010$ ms | $0.009$ ms | $0.009$ ms | Deterministic DAG rules execute in sub-millisecond time. |
| **What-If Counterfactual Surge** | $1.43$ ms | $0.57$ ms | $0.81$ ms | Dynamic array filtering completes in $< 2$ ms. |
| **SQLite Operational Read Latency** | — | — | $4.66$ ms | Relational reads complete with zero bottleneck under WAL mode. |

---

## 2. Dataset Quality & Integrity Audit

### Core Dataset Provenance (`data/raw/urban_incidents.csv`)
- **Total Record Count**: 125 historical urban incidents.
- **Geographic Bounds**:
  - Latitude: $[12.9140, 13.0480]$ (Bengaluru Metropolitan Area)
  - Longitude: $[77.5320, 77.6580]$
  - Coordinate Precision: 4 decimal places ($\approx 11$ meter spatial resolution).
  - Invalid / Out-of-bounds Coordinates: **0**.
- **Categorical & Domain Distribution**:
  - 10 distinct standard urban incident archetypes present (`Flooding / Waterlogging`, `Tree Fall`, `Power Outage`, `Water Main Break`, `Traffic Signal Failure`, etc.).
  - 5 municipal zones (Central, East, South, West, North Zone).
  - 15 wards represented (Ward-101 to Ward-143).
- **Severity & Impact Distribution**:
  - Severity scores span $[4.8, 9.3]$ with standard deviation $\sigma = 1.15$.
  - Impact radius spans $[100, 2500]$ meters.
  - Affected population spans $[300, 30000]$ citizens.
- **Target Variable Balance**:
  - Cascading risk flag: 93 positive ($74.4\%$), 32 negative ($25.6\%$).
- **Anti-Leakage Validation**:
  - `PredictiveRiskEngine` strictly excludes `priority_score`, `prevention_impact_score`, `parent_incident_id`, `status`, `recommended_action`, and `ward`.
  - Zero target leakage detected during feature engineering.

---

## 3. Scalability Assessment & Recommendations

1. **Sub-second User Experience**: Across all tested volumes up to 1,000 incident nodes, the complete intelligence suite (graph construction, DBSCAN clustering, and ML inference) completes in $< 350$ ms total combined latency.
2. **Memory Footprint**: Total Python process resident set size (RSS) remains under $180$ MB for both the FastAPI service and the Streamlit frontend.
3. **Database Concurrency**: The SQLite Write-Ahead Logging (`WAL`) configuration enables non-blocking concurrent readers while write transactions execute in isolated boundaries.
