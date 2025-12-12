# Windows Setup Guide for Video Processing Service

## Step 1: Install Python

### Option A: Install from Python.org (Recommended)

1. Download Python 3.10 or later from: https://www.python.org/downloads/
2. **IMPORTANT**: During installation, check "Add Python to PATH"
3. Run the installer and complete the installation

### Option B: Install from Microsoft Store

1. Open Microsoft Store
2. Search for "Python 3.11" or "Python 3.12"
3. Click "Install"
4. This automatically adds Python to PATH

### Verify Installation

Open PowerShell and run:
```powershell
python --version
```

You should see something like: `Python 3.11.x`

## Step 2: Navigate to Project Directory

```powershell
cd D:\Echoplex\video-processing-service
```

## Step 3: Create Virtual Environment

```powershell
python -m venv venv
```

## Step 4: Activate Virtual Environment

**Windows PowerShell:**
```powershell
.\venv\Scripts\Activate.ps1
```

If you get an execution policy error, run this first:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Windows Command Prompt (cmd):**
```cmd
venv\Scripts\activate.bat
```

## Step 5: Install Dependencies

```powershell
pip install -r requirements.txt
```

This will install:
- FastAPI
- OpenCV
- YOLOv8 (Ultralytics)
- PyTorch
- And other dependencies

**Note**: First-time installation may take 5-10 minutes as it downloads models and dependencies.

## Step 6: Start the Service

```powershell
python main.py
```

You should see:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## Troubleshooting

### "Python was not found"
- Make sure Python is installed
- Check if Python is in PATH: `where python`
- Restart PowerShell after installing Python
- Try using full path: `C:\Python311\python.exe`

### "pip is not recognized"
- Make sure Python was installed with pip (it's included by default)
- Try: `python -m pip install -r requirements.txt`

### Execution Policy Error
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Models Not Downloading
Models download automatically on first run. If they fail:
- Check internet connection
- Models are saved to: `%USERPROFILE%\.ultralytics\`

### Port 8000 Already in Use
Change the port in `main.py`:
```python
uvicorn.run(app, host="0.0.0.0", port=8001)  # Change 8000 to 8001
```

## Quick Setup Script

Save this as `setup.ps1` in the `video-processing-service` folder:

```powershell
# Check if Python is installed
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "Python is not installed. Please install Python 3.10+ from python.org" -ForegroundColor Red
    Write-Host "Make sure to check 'Add Python to PATH' during installation" -ForegroundColor Yellow
    exit 1
}

Write-Host "Python found: $(python --version)" -ForegroundColor Green

# Create virtual environment
Write-Host "Creating virtual environment..." -ForegroundColor Yellow
python -m venv venv

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Upgrade pip
Write-Host "Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip

# Install dependencies
Write-Host "Installing dependencies (this may take a few minutes)..." -ForegroundColor Yellow
pip install -r requirements.txt

Write-Host "Setup complete! To start the service, run:" -ForegroundColor Green
Write-Host "  .\venv\Scripts\Activate.ps1" -ForegroundColor Cyan
Write-Host "  python main.py" -ForegroundColor Cyan
```

Run it with:
```powershell
.\setup.ps1
```

## Next Steps

Once the service is running:

1. **Configure Frontend**: Add to `.env` in project root:
   ```
   VITE_VIDEO_PROCESSING_URL=http://localhost:8000
   ```

2. **Start Frontend**:
   ```powershell
   cd D:\Echoplex
   npm run dev
   ```

3. **Test the Service**:
   - Open browser to: http://localhost:8000/health
   - Should see: `{"status":"healthy",...}`

## Common Issues

### CUDA/GPU Support (Optional)
For better performance with GPU:
1. Install CUDA Toolkit: https://developer.nvidia.com/cuda-downloads
2. Reinstall PyTorch with CUDA:
   ```powershell
   pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
   ```

### Memory Issues
If you get out of memory errors:
- Use smaller model: Change `yolov8n.pt` to `yolov8n.pt` (already using nano)
- Reduce processing FPS in frontend
- Close other applications

### Slow Performance
- Install CUDA for GPU acceleration
- Reduce processing FPS
- Use smaller YOLOv8 model (already using nano - smallest)

