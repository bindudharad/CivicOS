@echo off
setlocal
cd /d "%~dp0"
echo Starting CivicOS FastAPI at http://127.0.0.1:8000
python main.py
