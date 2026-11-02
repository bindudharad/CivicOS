@echo off
setlocal
cd /d "%~dp0"
echo Starting CivicOS backend and Command Center in separate windows.
start "CivicOS Backend" cmd /k "call start_backend.bat"
start "CivicOS Command Center" cmd /k "call start_frontend.bat"
