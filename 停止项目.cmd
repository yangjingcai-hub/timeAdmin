@echo off
chcp 65001 >nul
setlocal
set "PSModulePath="
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-project.ps1" -Stop
if errorlevel 1 (
  echo.
  pause
  exit /b 1
)
exit /b 0
