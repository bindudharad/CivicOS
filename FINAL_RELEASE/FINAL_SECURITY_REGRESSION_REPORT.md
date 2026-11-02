# Security regression

Executed: `python -m pytest -p no:asyncio tests/test_phase6_security.py tests/test_unified_pipeline.py tests/test_phase5_operations.py -q` — 6 passed. Coverage includes scrypt login, Bearer authentication, backend RBAC, session logout invalidation, throttling, CORS, foreign keys, and lifecycle transitions.
