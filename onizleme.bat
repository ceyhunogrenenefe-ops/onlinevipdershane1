@echo off
cd /d "%~dp0"
echo Online VIP Dershane - Yerel Onizleme
echo.
echo Sunucu baslatiliyor: http://127.0.0.1:8765
start "" "http://127.0.0.1:8765/index.html#programlar"
python -m http.server 8765
