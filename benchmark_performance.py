"""
CivicOS Phase 8 Performance Benchmark & Data Quality Validator
--------------------------------------------------------------
Measures:
- Dashboard load & data prep time
- Graph construction latency (100, 500, 1000 nodes)
- Spatial DBSCAN clustering latency
- ML Training & single-record prediction latency
- Cascade simulation latency
- Database query & transaction latency
- Data quality scan across raw urban incidents CSV
"""
import time
import pandas as pd
import numpy as np
from pathlib import Path
import json

from src.config import RAW_DATA_PATH, OPERATIONS_DB_PATH
from src.graph_engine.relationship_graph import IncidentGraphEngine, CascadingImpactEngine
from src.geospatial.spatial_intelligence import SpatialIntelligenceEngine
from src.predictive.risk_predictor import PredictiveRiskEngine
from src.simulation.what_if_engine import WhatIfSimulationEngine
from src.scoring.priority_scoring import PriorityScoringEngine
from src.operations.service import OperationsService

def benchmark():
    print("=" * 60)
    print("CIVICOS PHASE 8 PERFORMANCE & DATA QUALITY BENCHMARKS")
    print("=" * 60)
    
    # 1. Load Raw Dataset & Data Quality Scan
    df_raw = pd.read_csv(RAW_DATA_PATH)
    print(f"\n1. Data Quality Audit ({len(df_raw)} records loaded from CSV):")
    print(f"  Missing values in any column: {df_raw.isnull().sum().sum()}")
    print(f"  Unique Incident Types: {df_raw['incident_type'].nunique()} ({list(df_raw['incident_type'].unique())[:3]}...)")
    print(f"  Latitude range: [{df_raw['latitude'].min():.4f}, {df_raw['latitude'].max():.4f}]")
    print(f"  Longitude range: [{df_raw['longitude'].min():.4f}, {df_raw['longitude'].max():.4f}]")
    print(f"  Severity range: [{df_raw['severity_score'].min():.1f}, {df_raw['severity_score'].max():.1f}]")
    print(f"  Cascading risk balance: {dict(df_raw['cascading_risk_flag'].value_counts())}")

    # Generate synthetic scaling datasets (100, 500, 1000 records)
    dfs = {
        "100_records": df_raw.sample(100, replace=True, random_state=42).reset_index(drop=True),
        "500_records": df_raw.sample(500, replace=True, random_state=42).reset_index(drop=True),
        "1000_records": df_raw.sample(1000, replace=True, random_state=42).reset_index(drop=True),
    }

    results = {}

    for size_name, test_df in dfs.items():
        n = len(test_df)
        print(f"\n2. Benchmarking with {n} records ({size_name}):")
        
        # Graph Construction
        graph_eng = IncidentGraphEngine()
        t0 = time.perf_counter()
        g = graph_eng.build_graph_from_dataframe(test_df)
        t_graph = (time.perf_counter() - t0) * 1000
        print(f"  Graph Construction: {t_graph:.2f} ms ({g.number_of_nodes()} nodes, {g.number_of_edges()} edges)")

        # DBSCAN Hotspots
        spatial_eng = SpatialIntelligenceEngine()
        t0 = time.perf_counter()
        clustered, hotspots = spatial_eng.detect_spatial_hotspots(test_df, eps_km=1.5, min_samples=3)
        t_dbscan = (time.perf_counter() - t0) * 1000
        print(f"  DBSCAN Spatial Clustering: {t_dbscan:.2f} ms ({len(hotspots)} hotspots detected)")

        # ML Training
        ml_eng = PredictiveRiskEngine()
        t0 = time.perf_counter()
        ml_eng.train(test_df)
        t_ml_train = (time.perf_counter() - t0) * 1000

        # ML Single-Record Inference
        sample_row = test_df.iloc[0].to_dict()
        t0 = time.perf_counter()
        for _ in range(50):
            ml_eng.predict(sample_row)
        t_ml_infer = ((time.perf_counter() - t0) / 50) * 1000
        print(f"  ML Model Training: {t_ml_train:.2f} ms | Single Inference: {t_ml_infer:.3f} ms")

        # Cascade Prediction
        cascade_eng = CascadingImpactEngine()
        t0 = time.perf_counter()
        for _ in range(50):
            cascade_eng.predict_cascade("Flooding / Waterlogging", 8.5, 60.0, 30.0)
        t_cascade = ((time.perf_counter() - t0) / 50) * 1000
        print(f"  Cascade Tree Evaluation: {t_cascade:.3f} ms")

        # What-If Simulation
        whatif_eng = WhatIfSimulationEngine()
        t0 = time.perf_counter()
        whatif_eng.simulate_rainfall_surge(test_df, 50.0)
        t_whatif = (time.perf_counter() - t0) * 1000
        print(f"  What-If Surge Simulation: {t_whatif:.3f} ms")

        results[size_name] = {
            "records": n,
            "graph_build_ms": round(t_graph, 2),
            "dbscan_ms": round(t_dbscan, 2),
            "ml_train_ms": round(t_ml_train, 2),
            "ml_infer_ms": round(t_ml_infer, 3),
            "cascade_eval_ms": round(t_cascade, 3),
            "whatif_ms": round(t_whatif, 3)
        }

    # DB Query & Insert Latency
    ops = OperationsService(OPERATIONS_DB_PATH)
    t0 = time.perf_counter()
    incidents = ops.list_incidents()
    t_db_read = (time.perf_counter() - t0) * 1000
    print(f"\n3. SQLite Operational Read Latency: {t_db_read:.2f} ms ({len(incidents)} operational records read)")

    print("\nBenchmark Summary JSON:")
    print(json.dumps(results, indent=2))
    return results

if __name__ == "__main__":
    benchmark()
