@echo off
setlocal
cd /d "%~dp0"
title IT bez paniki - localhost
echo.
echo IT bez paniki - local website
echo Your browser will open automatically.
echo Keep this window open. Close it to stop the server.
echo.
where node >nul 2>nul
if not errorlevel 1 (
  node server.cjs --open
  goto :finished
)
where py >nul 2>nul
if not errorlevel 1 (
  py -3 -c "import sys" >nul 2>nul
  if not errorlevel 1 (
    py -3 server.py --open
    goto :finished
  )
)
where python >nul 2>nul
if not errorlevel 1 (
  python -c "import sys" >nul 2>nul
  if not errorlevel 1 (
    python server.py --open
    goto :finished
  )
)
echo Node.js or Python 3 was not found.
echo Install either one, then open START.bat again.
echo Node.js: https://nodejs.org/
echo Python:  https://www.python.org/downloads/
pause
exit /b 1
:finished
if errorlevel 1 pause
endlocal
