# Deployment signoff

Use `start_backend.bat`, `start_frontend.bat`, or `start_civicos.bat` from the project root. Create users with `python init_admin.py`. Configure exact `CIVICOS_ALLOWED_ORIGINS` and a persistent `CIVICOS_OPERATIONS_DB`. The project is suitable for a local secured demo, not public deployment without HTTPS, backups, and operational rate limiting.
