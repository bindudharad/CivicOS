# Test report

Executed on 2026-11-02:

| Command | Result |
|---|---|
| `python tests/test_phase2.py` | Passed: 8/8. |
| `python tests/test_phase3.py` | Passed: 9/9. |
| `python -m pytest -p no:asyncio tests/test_unified_pipeline.py -q` | Passed: 1/1. |
| `python -m py_compile main.py dashboard/app.py src/operations/service.py` | Passed. |

The end-to-end test submits the specified Bengaluru rainfall/drain-blockage scenario, checks classification, risk and simulation labels, creates a work order, assigns it, resolves it with evidence, and verifies the incident status. The system-wide `pytest` command is currently blocked by an installed `pytest-asyncio` plugin collection defect; disabling only that plugin permits the new test to run.
