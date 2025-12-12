# Quick start script for Windows
# Activates virtual environment and starts the face recognition service

Write-Host "Starting Echoplex Face Recognition Service..." -ForegroundColor Cyan
Write-Host ""

# Check if virtual environment exists
if (-not (Test-Path "venv\Scripts\Activate.ps1")) {
    Write-Host "ERROR: Virtual environment not found!" -ForegroundColor Red
    Write-Host "Please run setup first:" -ForegroundColor Yellow
    Write-Host "  python -m venv venv" -ForegroundColor Yellow
    Write-Host "  .\venv\Scripts\Activate.ps1" -ForegroundColor Yellow
    Write-Host "  pip install -r requirements.txt" -ForegroundColor Yellow
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
Write-Host "Starting service on http://localhost:8001" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

# Start the service
python main.py


