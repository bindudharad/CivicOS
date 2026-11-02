# Phase 6 backup demo guide

Use a disposable offline database: set `CIVICOS_OPERATIONS_DB` to a new local path, run `python init_admin.py`, then start the backend and frontend. Submit the prefilled rainfall/drainage scenario. The supplied CSV, graph, risk model, and deterministic cascade are local synthetic artifacts, so the flow works without network access. If a browser cannot render Streamlit WebSockets, demonstrate the authenticated API via `/docs` and clearly state the UI fallback limitation.
