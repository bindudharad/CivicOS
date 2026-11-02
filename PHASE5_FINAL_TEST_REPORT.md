# Phase 5 final test report

Executed 2026-11-02:

| Verification | Result |
|---|---|
| `python tests/test_phase2.py` | Pass, 8/8 |
| `python tests/test_phase3.py` | Pass, 9/9 |
| `python -m pytest -p no:asyncio tests/test_unified_pipeline.py -q` | Pass, 1/1 |
| `python -m pytest -p no:asyncio tests/test_phase5_operations.py tests/test_unified_pipeline.py -q` | Pass, 4/4 |
| `python -m py_compile main.py dashboard/app.py src/operations/service.py` | Pass |
| `GET /health` on running local API | Healthy; 125 synthetic records, 125 graph nodes, 863 edges |

Warnings: existing Pydantic class-config and Starlette TestClient deprecations remain; neither failed execution. Global pytest collection requires `-p no:asyncio` due an environment-installed `pytest-asyncio` collection defect.
