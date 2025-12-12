# Echoplex Video Processing Service - Windows Setup Script
# Run this script to set up the Python environment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Echoplex Video Processing Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
Write-Host "Checking for Python..." -ForegroundColor Yellow

# Check if python command exists
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
    Write-Host "ERROR: Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Python 3.10 or later:" -ForegroundColor Yellow
    Write-Host "  1. Download from: https://www.python.org/downloads/" -ForegroundColor White
    Write-Host "  2. During installation, CHECK 'Add Python to PATH'" -ForegroundColor White
    Write-Host "  3. Restart PowerShell after installation" -ForegroundColor White
    Write-Host ""
    Write-Host "Or install from Microsoft Store: Search for 'Python 3.11'" -ForegroundColor White
    Write-Host ""
    Write-Host "See INSTALL_PYTHON.md for detailed instructions" -ForegroundColor Cyan
    exit 1
}

# Check if it's the Windows Store stub (which redirects to store)
$pythonPath = $pythonCmd.Source
if ($pythonPath -like "*WindowsApps*") {
    # Try to actually run python to see if it's installed
    $pythonVersion = python --version 2>&1
    if ($pythonVersion -match "was not found" -or $pythonVersion -match "Microsoft Store") {
        Write-Host "ERROR: Python is not actually installed" -ForegroundColor Red
        Write-Host ""
        Write-Host "The 'python' command is pointing to Windows Store, but Python is not installed." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Please install Python 3.10 or later:" -ForegroundColor Yellow
        Write-Host "  1. Download from: https://www.python.org/downloads/" -ForegroundColor White
        Write-Host "  2. During installation, CHECK 'Add Python to PATH'" -ForegroundColor White
        Write-Host "  3. Restart PowerShell after installation" -ForegroundColor White
        Write-Host ""
        Write-Host "Or install from Microsoft Store: Search for 'Python 3.11'" -ForegroundColor White
        Write-Host ""
        Write-Host "See INSTALL_PYTHON.md for detailed instructions" -ForegroundColor Cyan
        exit 1
    }
}

# Get Python version
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Could not get Python version" -ForegroundColor Red
    Write-Host "Python may not be properly installed" -ForegroundColor Yellow
    exit 1
}

Write-Host "Found: $pythonVersion" -ForegroundColor Green
Write-Host ""

# Check Python version (should be 3.10+)
$versionMatch = $pythonVersion -match "Python (\d+)\.(\d+)"
if (-not $versionMatch) {
    Write-Host "WARNING: Could not parse Python version" -ForegroundColor Yellow
} else {
    $major = [int]$matches[1]
    $minor = [int]$matches[2]
    if ($major -lt 3 -or ($major -eq 3 -and $minor -lt 10)) {
        Write-Host "WARNING: Python 3.10+ is recommended. You have Python $major.$minor" -ForegroundColor Yellow
    }
}

# Create virtual environment
Write-Host "Creating virtual environment..." -ForegroundColor Yellow
if (Test-Path "venv") {
    Write-Host "Virtual environment already exists. Skipping..." -ForegroundColor Gray
} else {
    python -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to create virtual environment" -ForegroundColor Red
        exit 1
    }
    Write-Host "Virtual environment created successfully" -ForegroundColor Green
}
Write-Host ""

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
if (Test-Path "venv\Scripts\Activate.ps1") {
    & .\venv\Scripts\Activate.ps1
    Write-Host "Virtual environment activated" -ForegroundColor Green
} else {
    Write-Host "ERROR: Could not find activation script" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Upgrade pip
Write-Host "Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip --quiet
Write-Host "pip upgraded" -ForegroundColor Green
Write-Host ""

# Install build tools (required for building packages from source)
Write-Host "Installing build tools..." -ForegroundColor Yellow
python -m pip install --upgrade setuptools wheel --quiet
Write-Host "Build tools installed" -ForegroundColor Green
Write-Host ""

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
Write-Host "This may take 5-10 minutes on first run (downloading models and packages)..." -ForegroundColor Gray
Write-Host ""

pip install -r requirements.txt

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
    Write-Host "Try running manually: pip install -r requirements.txt" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the service, run:" -ForegroundColor Yellow
Write-Host "  .\venv\Scripts\Activate.ps1" -ForegroundColor Cyan
Write-Host "  python main.py" -ForegroundColor Cyan
Write-Host ""
Write-Host "Or use the start script:" -ForegroundColor Yellow
Write-Host "  .\start.ps1" -ForegroundColor Cyan
Write-Host ""

