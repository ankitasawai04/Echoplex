# Echoplex Video Processing Service

Real-time video processing pipeline for Lost & Found person detection and matching.

## Features

- **Person Detection**: YOLOv8-based real-time person detection
- **Pose Estimation**: YOLOv8-Pose for body part segmentation
- **Color Extraction**: K-Means clustering for dominant color detection (top/bottom clothing)
- **Text Matching**: CLIP-based semantic matching for complex descriptions
- **Real-time Processing**: WebSocket support for live video streams
- **REST API**: Frame-by-frame processing endpoint

## Installation

### Prerequisites

- Python 3.8+
- CUDA-capable GPU (optional, but recommended for better performance)

### Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Models will be downloaded automatically on first run
```

### Optional: CLIP Installation

For advanced text-image matching (e.g., "person wearing a backpack"):

```bash
pip install git+https://github.com/openai/CLIP.git
```

## Usage

### Start the Service

```bash
python main.py
```

The service will start on `http://localhost:8000`

### API Endpoints

#### Health Check
```bash
GET /health
```

#### Process Single Frame
```bash
POST /api/process-frame
Content-Type: application/json

{
  "image": "base64_encoded_image_data",
  "missingPersons": [
    {
      "id": "MP-001",
      "name": "Emma Thompson",
      "age": 8,
      "description": "Wearing pink t-shirt and blue jeans",
      "topColor": "Pink",
      "bottomColor": "Blue"
    }
  ]
}
```

#### WebSocket Stream
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/video-stream');

// Send configuration
ws.send(JSON.stringify({
  streamId: "camera-1",
  missingPersons: [...]
}));

// Send frames
ws.send(JSON.stringify({
  type: "frame",
  image: "base64_encoded_frame"
}));
```

## Architecture

### Processing Pipeline

1. **Detection**: YOLOv8 detects all persons in frame
2. **Tracking**: Each person gets a unique ID (can integrate ByteTrack/DeepSORT)
3. **Pose Estimation**: Extract keypoints (shoulders, hips, ankles)
4. **Segmentation**: Crop torso (top) and legs (bottom) regions
5. **Color Analysis**: K-Means clustering to find dominant colors
6. **Matching**: Compare against missing person profiles
7. **Alerting**: Return matches above confidence threshold

### Color Detection

Uses K-Means clustering to find dominant colors in cropped regions:
- **Top Color**: Region between shoulders and hips
- **Bottom Color**: Region between hips and ankles

### CLIP Integration

For complex descriptions like "wearing a hat" or "carrying a backpack", CLIP provides semantic understanding without training custom models.

## Configuration

### Model Selection

- **YOLOv8n**: Nano model (fastest, lower accuracy)
- **YOLOv8s**: Small model (balanced)
- **YOLOv8m**: Medium model (higher accuracy, slower)

Change in `main.py`:
```python
detector_model = YOLO('yolov8s.pt')  # Use 's' or 'm' for better accuracy
```

### Confidence Thresholds

Adjust in `main.py`:
- Person detection: `confidence < 0.5` (line ~200)
- Match threshold: `match_confidence > 0.7` (line ~250)

## Performance

- **Processing Speed**: ~30-60 FPS on GPU, ~10-20 FPS on CPU
- **Latency**: <100ms per frame (GPU)
- **Memory**: ~2GB RAM, ~1GB VRAM (GPU)

## Troubleshooting

### Models not downloading
- Check internet connection
- Models download automatically on first run
- Manual download: `python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"`

### CUDA errors
- Install CUDA toolkit if using GPU
- Service will fall back to CPU automatically

### CLIP not working
- Install: `pip install git+https://github.com/openai/CLIP.git`
- Requires PyTorch with CUDA for best performance

## Next Steps

- [ ] Integrate ByteTrack for person tracking
- [ ] Add face recognition for photo-based matching
- [ ] Implement vector database for appearance embeddings
- [ ] Add camera calibration and location metadata
- [ ] Export matches to Google Sheets


