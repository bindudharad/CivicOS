@echo off
setlocal
cd /d "%~dp0"
echo Starting CivicOS Command Center at http://127.0.0.1:8501
streamlit run dashboard\app.py
