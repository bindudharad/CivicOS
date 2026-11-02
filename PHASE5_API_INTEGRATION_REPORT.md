# Phase 5 dashboard/API integration report

| UI action | Endpoint | Verified result |
|---|---|---|
| Submit & analyze incident | `POST /api/incidents` | Tested through FastAPI TestClient; creates analysis and work order. |
| Load work-order queue | `GET /api/work-orders` | Tested through service/API regression. |
| Assign team | `PATCH /api/work-orders/{id}/assign` | Tested; only open/assigned records accept it. |
| Start field work | `PATCH /api/work-orders/{id}/start` | Tested; requires assigned state. |
| Record resolution | `PATCH /api/work-orders/{id}/resolve` | Tested; persists evidence and closes linked incident. |
| Existing risk/map/cascade views | Existing in-process engines | Existing Phase 2/3 endpoint tests passed. |

The Streamlit controls use HTTP requests with a timeout, spinner, success feedback, and request-error feedback. There are no decorative lifecycle buttons: each invokes the listed API. Browser-surface rendering prevented direct click-through verification; see `PHASE5_UI_AUDIT.md`.
