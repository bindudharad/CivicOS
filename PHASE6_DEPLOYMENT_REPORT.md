# Phase 6 deployment report

Python 3.10+ with `requirements.txt`, SQLite storage, FastAPI, and Streamlit are required. Initialize a user once with `python init_admin.py`, then run `start_backend.bat` and `start_frontend.bat`. Configure `CIVICOS_ALLOWED_ORIGINS` for exact frontend origins and persist `CIVICOS_OPERATIONS_DB` outside the source tree in deployment. No external API is required for the core demo.

Deployment is **ready with limitations**: use HTTPS/reverse proxy, a production database backup plan, restricted network ingress, and a non-default database path. SQLite is appropriate for this local hackathon demonstration, not high-concurrency municipal deployment.
