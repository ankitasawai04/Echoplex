# Echoplex Video Processing Service - Setup Guide

## Quick Start

### 1. Install Python Dependencies

```bash
cd video-processing-service
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Start the Service

```bash
python main.py
```

The service will start on `http://localhost:8000`

### 3. Configure Frontend

Add to your `.env` file in the project root:

```env
VITE_VIDEO_PROCESSING_URL=http://localhost:8000
```

### 4. Test the Service

```bash
# Health check
curl http://localhost:8000/health

# Should return:
# {
#   "status": "healthy",
#   "detector_loaded": true,
#   "pose_loaded": true,
#   "clip_loaded": false
# }
```

## First Run

On first run, YOLOv8 models will be automatically downloaded:
- `yolov8n.pt` (~6MB) - Person detection
- `yolov8n-pose.pt` (~6MB) - Pose estimation

These are cached in your home directory under `.ultralytics/`.

## Optional: CLIP Installation

For advanced text-image matching (e.g., "person wearing a backpack"):

```bash
pip install git+https://github.com/openai/CLIP.git
```

**Note**: CLIP requires PyTorch with CUDA for best performance. CPU-only mode is slower but works.

## Troubleshooting

### Models Not Downloading

If models fail to download automatically:

```bash
python -c "from ultralytics import YOLO; YOLO('yolov8n.pt'); YOLO('yolov8n-pose.pt')"
```

### Port Already in Use

Change the port in `main.py`:

```python
uvicorn.run(app, host="0.0.0.0", port=8001)  # Change 8000 to 8001
```

And update frontend `.env`:

```env
VITE_VIDEO_PROCESSING_URL=http://localhost:8001
```

### CUDA/GPU Issues

The service will automatically fall back to CPU if CUDA is not available. For better performance:

1. Install CUDA toolkit: https://developer.nvidia.com/cuda-downloads
2. Install PyTorch with CUDA: `pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118`

### Camera Access Issues

The frontend needs camera permissions. Make sure:
- Browser has camera access
- HTTPS is used (or localhost for development)
- No other application is using the camera

## Performance Tuning

### Model Selection

For better accuracy (slower):
```python
detector_model = YOLO('yolov8s.pt')  # or 'yolov8m.pt'
pose_model = YOLO('yolov8s-pose.pt')
```

### Processing Rate

Adjust frame processing rate in `LostAndFound.tsx`:

```typescript
}, 1000 / 10); // Change 10 to desired FPS (e.g., 5 for slower, 15 for faster)
```

### Confidence Thresholds

In `main.py`, adjust:
- Person detection: `confidence < 0.5` (line ~200)
- Match threshold: `match_confidence > 0.7` (line ~250)

## Production Deployment

### Using Docker

```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .
EXPOSE 8000

CMD ["python", "main.py"]
```

### Using Systemd (Linux)

Create `/etc/systemd/system/echoplex-video.service`:

```ini
[Unit]
Description=Echoplex Video Processing Service
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/video-processing-service
Environment="PATH=/path/to/venv/bin"
ExecStart=/path/to/venv/bin/python main.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable echoplex-video
sudo systemctl start echoplex-video
```

## API Documentation

### POST /api/process-frame

Process a single frame.

**Request:**
```json
{
  "image": "data:image/jpeg;base64,...",
  "missingPersons": [
    {
      "id": "MP-001",
      "name": "John Doe",
      "age": 25,
      "description": "Wearing red shirt and blue jeans",
      "topColor": "Red",
      "bottomColor": "Blue"
    }
  ]
}
```

**Response:**
```json
{
  "matches": [
    {
      "personId": "person_123_456_1234567890",
      "missingPersonId": "MP-001",
      "confidence": 0.85,
      "attributes": {
        "topColor": "Red",
        "bottomColor": "Blue"
      },
      "timestamp": "2024-01-01T12:00:00",
      "location": null
    }
  ],
  "timestamp": "2024-01-01T12:00:00"
}
```

### WebSocket /ws/video-stream

Real-time video stream processing.

**Connect:**
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/video-stream');
```

**Send configuration:**
```json
{
  "streamId": "camera-1",
  "missingPersons": [...]
}
```

**Send frames:**
```json
{
  "type": "frame",
  "image": "data:image/jpeg;base64,..."
}
```

**Receive matches:**
```json
{
  "personId": "person_123",
  "missingPersonId": "MP-001",
  "confidence": 0.85,
  "attributes": {...},
  "timestamp": "2024-01-01T12:00:00"
}
```

## Next Steps

- [ ] Integrate ByteTrack for person tracking
- [ ] Add face recognition for photo-based matching
- [ ] Implement vector database for appearance embeddings
- [ ] Add camera calibration and location metadata
- [ ] Export matches to Google Sheets


