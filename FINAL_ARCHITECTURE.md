# Final architecture

```text
Citizen / sensor / authorized open data
  -> POST /api/incidents (Pydantic validation)
  -> deterministic classification + duplicate check
  -> GIS context -> existing risk predictor + weather evaluator
  -> deterministic cascade simulation -> priority scoring
  -> recommendation -> SQLite incident + work order
  -> assignment -> operator-attested resolution evidence
```

The FastAPI app in `main.py` is the single API contract. `dashboard/app.py` is the single frontend and calls the operational endpoints over HTTP. `data/runtime/civicos_operations.sqlite3` is the canonical operational database; it is created on startup and excluded from Git. `data/raw/urban_incidents.csv` remains a versioned synthetic model-training/reference input.

Boundaries: `src/operations` owns persistence and lifecycle; existing `src/predictive`, `geospatial`, `graph_engine`, `weather`, `scoring`, and `recommendation` own intelligence functions. No live data feed, RAG corpus, image/voice inference service, or external authentication provider is configured.
