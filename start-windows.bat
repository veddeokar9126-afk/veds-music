@echo off
cd /d "%~dp0"
echo Starting Kafla at http://localhost:8000
echo Keep this window open. Close it to stop the site.
start "" http://localhost:8000
python -m http.server 8000 || py -m http.server 8000
pause
