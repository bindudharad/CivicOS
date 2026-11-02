# Phase 5 initial audit

Audited at commit `daf638d` on 2026-11-02 before Phase 5 modifications.

## Current product

The product is a FastAPI service plus a single Streamlit dashboard. It retains CivicOS Person 3 graph, GIS, prediction, weather, cascade, scoring, and recommendation engines, and adds a SQLite-backed operational workflow in `src/operations/service.py`.

## Findings

| Area | Status before Phase 5 | Risk / action |
|---|---|---|
| Existing engine tests | Previously reported 8/8 and 9/9 | Rerun independently. |
| Operational lifecycle | Intake, assignment, and resolve endpoints exist | Add status history, lifecycle validation, persistence/restart and failure tests. |
| SQLite | Parameterized SQL and local file store | Enable foreign keys, expose a health check, and make DB path configurable for safe temporary-database testing. |
| Duplicate handling | Type + 350m + token-overlap heuristic | Add diagnostic reasons and a scenario matrix; retain conservative matching. |
| UI | One Streamlit frontend and an API-backed intake form/queue | Visually inspect live app; add explicit loading/status/error feedback and usable lifecycle controls if gaps are observed. |
| Prediction honesty | New intake response labels prediction/simulation/recommendation | Avoid calling uncalibrated RF score a probability in demo language. |
| Auth/RBAC | Not configured | Must remain a documented deployment blocker; do not claim production authorization. |
| Reference projects | Reviewed as candidates | No new reference code adopted: incompatible stacks or unverified/missing root licenses outweigh benefits for Phase 5 scope. |

## Comparison conclusion

CascadeX offers additional synthetic asset/intervention examples; CivicAI adds separate Node/model services; Civic-Resolve offers Supabase/RBAC patterns; CivicSentinel offers optional RAG/WebSocket services; Digital City adds a separate geospatial application; SmartCivic adds Flask/Mongo operations. None can be added safely without creating a competing application, API, or database. Phase 5 will strengthen the existing vertical slice instead.
