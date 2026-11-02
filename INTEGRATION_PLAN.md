# CivicOS integration plan

## Decision

`CivicOS_Person3` is the canonical product: one FastAPI service, one Streamlit frontend, and one SQLite operational store. Its existing NetworkX, DBSCAN, Random Forest, weather, cascade, scoring, and recommendation engines are retained. The original CSV is a synthetic analytical reference dataset, not an operational database.

| Candidate | Useful capability inspected | Decision | Reason |
|---|---|---|---|
| CascadeX | typed infrastructure graph, cascade/intervention patterns | Adapt concepts; do not copy | FastAPI compatible but all city assets are synthetic and no root license notice was found. |
| CivicAI | intake, taxonomy, multilingual/model service | Exclude from core | Express + separate FastAPI/model stack; sample data is synthetic and README declares CC BY-SA 4.0. |
| Civic-Resolve | duplicate/grouping, priority, resolution verification, RBAC | Adapt operational workflow concepts | Strong TypeScript/Supabase design, but would introduce a competing app/database/auth system. |
| CivicSentinel AI | RAG, WebSocket, knowledge graph | Defer | MIT license exists; advanced services require configured knowledge sources and are not needed for the stable vertical slice. |
| digital-city | Bengaluru layers, weather/routing services | Defer external feeds; retain geospatial patterns | Separate SQLite/Next.js app; its README identifies a mixture of real and synthetic sources. |
| SmartCivic | complaint/work-order lifecycle and evidence concepts | Adapt concepts | Flask/MongoDB conflict; no root license notice found. |

## Integration registry

| Module | Source | Adaptation | API | Test |
|---|---|---|---|---|
| Operational lifecycle | Civic-Resolve / SmartCivic patterns | Clean-room SQLite service | `/api/incidents`, `/api/work-orders/*` | `test_unified_pipeline.py` |
| Risk, GIS, relationship graph, cascade | CivicOS_Person3 | Retained | existing `/api/*`, `/cascade`, `/relationships` | Phase 2 and 3 suites |
| Command-center workflow | CivicOS_Person3 dashboard | Added API-backed intake and queue | Streamlit command-center view | syntax checked |

No source file from a reference repository was copied. This avoids bringing a conflicting license, frontend, database, or authentication mechanism into the product.
