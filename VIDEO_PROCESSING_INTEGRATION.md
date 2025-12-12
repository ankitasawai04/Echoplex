# Echoplex Video Processing Integration Guide

This guide explains how to integrate the real-time video processing pipeline for the Lost & Found feature.

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   React Frontend│         │  Python Service  │         │   YOLOv8 Models │
│  LostAndFound.tsx│◄───────►│   main.py        │◄────────►│  + CLIP (opt)   │
│                 │ WebSocket│                  │         │                 │
│  - Camera Feed  │         │  - Person Detect │         │  - Detection    │
│  - Match Display│         │  - Pose Est.     │         │  - Tracking     │
│  - Alerts       │         │  - Color Extract │         │  - Matching     │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

## Components

### 1. Python Video Processing Service
**Location**: `video-processing-service/main.py`

**Features**:
- YOLOv8 person detection
- YOLOv8-Pose for body part segmentation
- K-Means color extraction (top/bottom clothing)
- CLIP-based semantic matching (optional)
- WebSocket support for real-time streams
- REST API for frame-by-frame processing

### 2. TypeScript Service Layer
**Location**: `src/services/lostAndFoundService.ts`

**Features**:
- WebSocket connection management
- Frame capture from video elements
- Color extraction from descriptions
- Match result handling
- Automatic reconnection

### 3. React Component
**Location**: `src/components/LostAndFound.tsx`

**Features**:
- Camera access and video display
- Real-time match notifications
- Status updates for missing persons
- Connection status indicators

## Setup Instructions

### Step 1: Install Python Service

```bash
cd video-processing-service
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### Step 2: Start Python Service

```bash
python main.py
```

Service will start on `http://localhost:8000`

### Step 3: Configure Frontend

Create or update `.env` in project root:

```env
VITE_VIDEO_PROCESSING_URL=http://localhost:8000
```

### Step 4: Start Frontend

```bash
npm run dev
```

## Usage Flow

### 1. Report Missing Person

1. Fill out the "Report Missing Person" form
2. Include description with clothing colors (e.g., "Wearing pink t-shirt and blue jeans")
3. Optionally upload a photo
4. Click "Submit Report & Start AI Search"

### 2. Start Video Processing

1. Click "Start Processing" button
2. Grant camera permissions when prompted
3. Video feed will appear in the interface
4. System automatically processes frames at ~10 FPS

### 3. Receive Matches

When a match is detected:
- Missing person status changes to "potential-match"
- Confidence score displayed
- Camera match details added
- Alert notification shown

### 4. Review Matches

- View match confidence scores
- See detected attributes (colors, accessories)
- Review camera match history
- Confirm or reject matches

## Processing Pipeline

### Phase 1: Person Detection
- YOLOv8 detects all persons in frame
- Filters by confidence threshold (>0.5)
- Extracts bounding boxes

### Phase 2: Pose Estimation
- YOLOv8-Pose extracts keypoints
- Identifies shoulders, hips, ankles
- Segments body into regions

### Phase 3: Attribute Extraction
- **Top Color**: K-Means clustering on torso region
- **Bottom Color**: K-Means clustering on legs region
- **Accessories**: CLIP-based semantic matching (if enabled)

### Phase 4: Matching
- Compares detected attributes with missing person profiles
- Calculates confidence score:
  - Top color match: 40% weight
  - Bottom color match: 30% weight
  - CLIP description match: 30% weight
- Triggers alert if confidence > 70%

## Configuration

### Processing Rate
Adjust in `LostAndFound.tsx`:
```typescript
}, 1000 / 10); // Change 10 to desired FPS
```

### Confidence Thresholds
In `video-processing-service/main.py`:
```python
if confidence < 0.5:  # Person detection threshold
if match_confidence > 0.7:  # Match threshold
```

### Model Selection
For better accuracy (slower):
```python
detector_model = YOLO('yolov8s.pt')  # or 'yolov8m.pt'
pose_model = YOLO('yolov8s-pose.pt')
```

## Color Detection

The system extracts colors from descriptions using simple heuristics:

**Supported Colors**:
- Red, Pink, Blue, Green, Yellow, Orange, Purple
- Black, White, Gray, Brown, Khaki, Navy

**Pattern Matching**:
- "pink t-shirt" → topColor: "Pink"
- "blue jeans" → bottomColor: "Blue"
- "red shirt and black pants" → both colors extracted

## CLIP Integration (Optional)

For complex descriptions like "wearing a hat" or "carrying a backpack":

1. Install CLIP:
```bash
pip install git+https://github.com/openai/CLIP.git
```

2. Service automatically detects and uses CLIP if available

3. CLIP provides semantic understanding without training custom models

## API Reference

### REST Endpoints

#### `GET /health`
Check service health and model status.

**Response**:
```json
{
  "status": "healthy",
  "detector_loaded": true,
  "pose_loaded": true,
  "clip_loaded": false
}
```

#### `POST /api/process-frame`
Process a single frame.

**Request**:
```json
{
  "image": "data:image/jpeg;base64,...",
  "missingPersons": [...]
}
```

**Response**:
```json
{
  "matches": [...],
  "timestamp": "2024-01-01T12:00:00"
}
```

### WebSocket

#### Connection
```
ws://localhost:8000/ws/video-stream
```

#### Send Configuration
```json
{
  "streamId": "camera-1",
  "missingPersons": [...]
}
```

#### Send Frame
```json
{
  "type": "frame",
  "image": "data:image/jpeg;base64,..."
}
```

#### Receive Match
```json
{
  "personId": "person_123",
  "missingPersonId": "MP-001",
  "confidence": 0.85,
  "attributes": {
    "topColor": "Red",
    "bottomColor": "Blue"
  },
  "timestamp": "2024-01-01T12:00:00"
}
```

## Troubleshooting

### Service Not Connecting
- Check Python service is running: `curl http://localhost:8000/health`
- Verify `.env` has correct URL
- Check browser console for errors

### Camera Not Working
- Grant camera permissions in browser
- Check no other app is using camera
- Try different browser (Chrome recommended)

### No Matches Detected
- Verify missing person descriptions include colors
- Check confidence thresholds aren't too high
- Ensure good lighting in video feed
- Try adjusting model to larger variant (yolov8s.pt)

### Performance Issues
- Reduce processing FPS (change 10 to 5)
- Use smaller model (yolov8n.pt)
- Enable GPU acceleration (CUDA)
- Process every Nth frame instead of all frames

## Next Steps

### Enhancements
- [ ] Integrate ByteTrack for person tracking across frames
- [ ] Add face recognition for photo-based matching
- [ ] Implement vector database for appearance embeddings
- [ ] Add camera calibration and location metadata
- [ ] Export matches to Google Sheets
- [ ] Add batch processing for recorded videos
- [ ] Implement multi-camera support

### Production Considerations
- [ ] Add authentication/authorization
- [ ] Implement rate limiting
- [ ] Add logging and monitoring
- [ ] Set up health checks and alerts
- [ ] Configure CORS properly
- [ ] Add input validation and sanitization
- [ ] Implement error recovery mechanisms

## Performance Benchmarks

### Hardware: CPU Only
- Processing: ~10-15 FPS
- Latency: ~200-300ms per frame
- Memory: ~2GB RAM

### Hardware: GPU (CUDA)
- Processing: ~30-60 FPS
- Latency: ~50-100ms per frame
- Memory: ~2GB RAM, ~1GB VRAM

## Support

For issues or questions:
1. Check `video-processing-service/README.md`
2. Review `video-processing-service/SETUP.md`
3. Check browser console and Python service logs
4. Verify all dependencies are installed correctly


