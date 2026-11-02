# Run instructions

From `C:\Projects\CivicOS\CivicOS_Person3`:

```powershell
python -m pip install -r requirements.txt
python main.py
```

In a second terminal:

```powershell
streamlit run dashboard/app.py
```

Open `http://127.0.0.1:8000/docs` for the API and `http://localhost:8501` for the frontend. Select **Command Center: Incident Operations** in the sidebar to submit an incident through the live API.

For an isolated repeatable demo database, set `CIVICOS_OPERATIONS_DB` to a disposable SQLite file before starting `python main.py`. Do not use the development database for a public demo.

Verification:

```powershell
python tests/test_phase2.py
python tests/test_phase3.py
python -m pytest -p no:asyncio tests/test_unified_pipeline.py -q
python -m pytest -p no:asyncio tests/test_phase5_operations.py -q
```
