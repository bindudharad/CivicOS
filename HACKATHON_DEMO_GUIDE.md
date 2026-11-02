# Five-minute hackathon demo

1. Start the API and Streamlit dashboard from `RUN_INSTRUCTIONS.md`.
2. Select **Command Center: Incident Operations**.
3. Submit the prefilled simulated rainfall/drainage report and say it is a demonstration record.
4. Explain the classification, model estimate, weather context, labelled cascade simulation, priority, and preventive action.
5. In **Work Order Queue**, assign a drainage team, start work, then record a supervisor evidence note.
6. Show the resolved status and explain that the lifecycle history persists in SQLite.

For a clean demo, set a disposable database before starting the API:

```powershell
$env:CIVICOS_OPERATIONS_DB = "$env:TEMP\civicos-demo.sqlite3"
python main.py
```

The core demo is offline: no external feed is required. Fallback: use the existing synthetic Cascade Simulation page.
