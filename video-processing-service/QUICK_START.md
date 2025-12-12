# Video Processing Service - Quick Start Guide

## Starting the Service

### Option 1: Using the Start Script (Easiest)

```powershell
cd D:\Echoplex\video-processing-service
.\start.ps1
```

### Option 2: Manual Start

```powershell
# Navigate to directory
cd D:\Echoplex\video-processing-service

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Start the service
python main.py
```

## Service Details

- **URL**: `http://localhost:8000`
- **Health Check**: `http://localhost:8000/health`
- **API Docs**: `http://localhost:8000/docs` (FastAPI auto-generated)

## First Run

On first run, YOLOv8 models will be automatically downloaded:
- `yolov8n.pt` (~6MB) - Person detection
- `yolov8n-pose.pt` (~6MB) - Pose estimation

These are cached in your home directory under `.ultralytics/`.

## Troubleshooting

### Port 8000 Already in Use

If port 8000 is already in use:

1. Find what's using the port:
   ```powershell
   netstat -ano | findstr :8000
   ```

2. Kill the process or change the port in `main.py` (line 498):
   ```python
   uvicorn.run(app, host="0.0.0.0", port=8001)  # Change to 8001
   ```

3. Update frontend `.env`:
   ```env
   VITE_VIDEO_PROCESSING_URL=http://localhost:8001
   ```

### Models Not Downloading

- Check internet connection
- Models download automatically on first run
- Manual download:
  ```python
  python -c "from ultralytics import YOLO; YOLO('yolov8n.pt'); YOLO('yolov8n-pose.pt')"
  ```

### Service Won't Start

1. Check if virtual environment is activated
2. Verify dependencies are installed:
   ```powershell
   pip list | Select-String "fastapi|ultralytics|opencv"
   ```

3. Install missing dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

## Verifying Service is Running

```powershell
# Health check
curl http://localhost:8000/health

# Should return:
# {"status":"healthy","detector_loaded":true,"pose_loaded":true,"clip_loaded":false}
```

## Stopping the Service

Press `Ctrl+C` in the terminal where the service is running.


