# Echoplex Project Troubleshooting Guide

## Issues Fixed

### ✅ Fixed: `preprocess` Variable Scope Error
- **Problem**: The `preprocess` function from CLIP was not stored globally, causing a `NameError` when trying to use it.
- **Solution**: Added `clip_preprocess` as a global variable and properly initialized it in `load_models()`.

### ✅ Fixed: `clip_model` Global Assignment
- **Problem**: `clip_model` wasn't being properly stored as a global variable.
- **Solution**: Updated `load_models()` to properly declare and assign global variables.

## Getting Your Project Running

### Step 1: Activate Python Virtual Environment

**Windows (PowerShell):**
```powershell
cd video-processing-service
.\venv\Scripts\Activate.ps1
```

**Windows (Command Prompt):**
```cmd
cd video-processing-service
venv\Scripts\activate.bat
```

**macOS/Linux:**
```bash
cd video-processing-service
source venv/bin/activate
```

### Step 2: Verify Dependencies Are Installed

```bash
pip list | findstr "fastapi numpy opencv ultralytics"
```

If packages are missing, install them:
```bash
pip install -r requirements.txt
```

### Step 3: Start the Video Processing Service

```bash
python main.py
```

The service should start on `http://localhost:8000`

### Step 4: Test the Service

Open a new terminal and run:
```powershell
curl http://localhost:8000/health
```

You should see:
```json
{
  "status": "healthy",
  "detector_loaded": true,
  "pose_loaded": true,
  "clip_loaded": false
}
```

### Step 5: Start the Frontend

In a new terminal (keep the Python service running):

```bash
npm install  # If you haven't already
npm run dev
```

The frontend should start on `http://localhost:5173`

## Common Issues

### Issue: "ModuleNotFoundError: No module named 'numpy'"
**Solution**: Make sure you've activated the virtual environment before running Python scripts.

### Issue: "Port 8000 already in use"
**Solution**: 
1. Find what's using the port: `netstat -ano | findstr :8000`
2. Kill the process or change the port in `main.py` (line 497)

### Issue: "Models not downloading"
**Solution**: 
- Check your internet connection
- Models download automatically on first run
- Manual download: `python -c "from ultralytics import YOLO; YOLO('yolov8n.pt'); YOLO('yolov8n-pose.pt')"`

### Issue: Linter warnings about imports
**Solution**: These are just IDE warnings. The code will work fine if you:
1. Activate the virtual environment
2. Install dependencies with `pip install -r requirements.txt`

## Quick Start Scripts

### Windows PowerShell
```powershell
cd video-processing-service
.\start.ps1
```

This will:
- Check if venv exists
- Activate the virtual environment
- Install dependencies if needed
- Start the service

## Project Structure

- **Frontend**: React + TypeScript (runs on port 5173)
- **Video Processing Service**: Python FastAPI (runs on port 8000)
- **Backend**: Node.js Express (optional, runs on port 3000)

## Need More Help?

1. Check the service logs for error messages
2. Verify all environment variables are set (if using Supabase)
3. Make sure all services are running on their respective ports
4. Check firewall settings if services can't connect


