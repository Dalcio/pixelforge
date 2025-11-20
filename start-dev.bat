@echo off
echo Starting PixelForge Development Servers...
echo.
echo Redis will start automatically with API and Worker!
echo.
echo Starting API on port 3000...
start cmd /k "cd /d %~dp0 && pnpm api:dev"
timeout /t 2 /nobreak >nul

echo Starting Worker...
start cmd /k "cd /d %~dp0 && pnpm worker:dev"
timeout /t 2 /nobreak >nul

echo Starting Web on port 5173...
start cmd /k "cd /d %~dp0 && pnpm web:dev"

echo.
echo All services starting...
echo API: http://localhost:3000
echo Web: http://localhost:5173
echo.
pause
