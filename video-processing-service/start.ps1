# Quick start script for Windows
# Activates virtual environment and starts the service

Write-Host "Starting Echoplex Video Processing Service..." -ForegroundColor Cyan
Write-Host ""

# Check if virtual environment exists
if (-not (Test-Path "venv\Scripts\Activate.ps1")) {
    Write-Host "ERROR: Virtual environment not found!" -ForegroundColor Red
    Write-Host "Please run setup.ps1 first" -ForegroundColor Yellow
    exit 1
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Check if dependencies are installed
Write-Host "Checking dependencies..." -ForegroundColor Yellow
$fastapiInstalled = pip show fastapi 2>&1 | Select-String "Name: fastapi" -Quiet
if (-not $fastapiInstalled) {
    Write-Host "Dependencies not installed. Installing..." -ForegroundColor Yellow
    pip install -r requirements.txt
}

Write-Host ""
Write-Host "Starting service on http://localhost:8000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

# Start the service
python main.py

