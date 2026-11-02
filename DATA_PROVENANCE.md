# Data provenance

| Data | Source/provenance | Coverage | Classification |
|---|---|---|---|
| `data/raw/urban_incidents.csv` | CivicOS reproducible generator (`data/generate_dataset.py`) | 125 Bengaluru-area-style records | Synthetic reference data |
| `data/runtime/civicos_operations.sqlite3` | User/API-created operational incidents | Starts empty, local deployment only | Operator-created records |
| Predictive output | Existing Random Forest trained from the synthetic reference CSV with hold-out metrics | Request-specific | Model prediction, not measured observation |
| Cascade output | Existing deterministic rules | Request-specific | Simulation, not measured observation |
| Recommendations | Existing deterministic playbooks | Request-specific | Recommendation requiring operator approval |

No real sensor, weather, citizen identity, GIS boundary, image, or voice dataset was imported. No external feed is represented as live.
