# Echoplex Face Recognition Feature - Setup Guide

## Overview

This document describes the facial recognition system for the Lost & Found feature in Echoplex. The system consists of:

1. **Python Backend** (`python-backend/face_recognition/`) - FastAPI service for face detection and matching
2. **React Frontend** (`src/services/faceRecognitionService.ts` & `src/components/LostAndFound.tsx`) - UI integration

## Phase 1: Backend Setup ✅ COMPLETE

### Structure Created

```
python-backend/face_recognition/
├── main.py              # FastAPI application with all endpoints
├── face_service.py      # Face recognition logic (embeddings, matching)
├── requirements.txt     # Python dependencies
├── README.md            # Backend documentation
├── start.ps1           # Windows startup script
├── .gitignore          # Git ignore rules
├── data/
│   └── face_embeddings.json  # Stored face embeddings (auto-created)
├── uploads/
│   └── missing_persons/  # Uploaded photos (auto-created)
└── models/             # Model files (if needed)
```

### API Endpoints

1. **POST `/api/face/upload`** - Upload missing person photo and extract face embedding
2. **POST `/api/face/match`** - Compare camera frame against stored faces
3. **POST `/api/face/search-by-description`** - Search by text description
4. **GET `/api/face/cameras/live`** - Get live camera feed statistics
5. **PUT `/api/face/case/{person_id}/status`** - Update case status
6. **GET `/api/face/persons`** - Get all missing persons

### Installation

```bash
cd python-backend/face_recognition

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\Activate.ps1

# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Note**: Installing `dlib` (required by `face-recognition`) may require:
- Windows: Visual C++ Build Tools
- macOS: `brew install cmake`
- Linux: `sudo apt-get install cmake build-essential`

### Start Service

**Windows:**
```powershell
.\start.ps1
```

**Manual:**
```bash
python main.py
```

Service runs on `http://localhost:8001`

## Phase 2: Frontend Integration ✅ COMPLETE

### Files Created/Updated

1. **`src/services/faceRecognitionService.ts`** - New service for API communication
2. **`src/components/LostAndFound.tsx`** - Updated to use real API

### Features Added

- ✅ Photo upload with face embedding extraction
- ✅ Real-time polling for live matches (every 3 seconds)
- ✅ Loading states during photo processing
- ✅ Error handling and user feedback
- ✅ Integration with existing video processing service
- ✅ Automatic face matching from camera frames
- ✅ Load initial data from API (with mock data fallback)

### Environment Variable

Add to `.env` file (optional):
```env
VITE_FACE_RECOGNITION_URL=http://localhost:8001
```

Default is `http://localhost:8001` if not set.

## Usage Flow

1. **Report Missing Person:**
   - Fill out form with name, age, description
   - Upload photo (required)
   - Click "Submit Report & Start AI Search"
   - System extracts face embedding and starts searching

2. **Real-time Matching:**
   - System continuously scans camera feeds
   - When match found (confidence > 80%), status updates to "potential-match"
   - Match details shown in camera matches list

3. **Search by Description:**
   - Use search bar to find cases by name or description
   - Results filtered in real-time

## Testing

### Test Backend

```bash
# Health check
curl http://localhost:8001/health

# Get all persons
curl http://localhost:8001/api/face/persons

# Get live stats
curl http://localhost:8001/api/face/cameras/live
```

### Test Frontend

1. Start Python backend: `python main.py` (port 8001)
2. Start React frontend: `npm run dev`
3. Navigate to Lost & Found section
4. Upload a test photo and submit report
5. Check browser console for API calls

## Troubleshooting

### Backend Issues

**dlib installation fails:**
- Windows: Install Visual C++ Build Tools from Microsoft
- macOS: `brew install cmake`
- Linux: `sudo apt-get install cmake build-essential`

**Port 8001 already in use:**
- Change port in `main.py`: `uvicorn.run(app, host="0.0.0.0", port=8002)`
- Update frontend `.env`: `VITE_FACE_RECOGNITION_URL=http://localhost:8002`

**No face detected:**
- Ensure photo contains a clear, front-facing face
- Try different image angles
- Check image quality/resolution

### Frontend Issues

**Service not connecting:**
- Verify Python backend is running on port 8001
- Check browser console for CORS errors
- Verify `VITE_FACE_RECOGNITION_URL` in `.env` if set

**Photo upload fails:**
- Check file size (should be reasonable)
- Verify image format (JPEG, PNG)
- Check browser console for error details

## Next Steps (Future Phases)

### Phase 3: Check-In Integration
- Link missing persons to attendee records
- Show check-in status when person found
- Add notifications for high-confidence matches

### Phase 4: Camera Feed Simulation
- Create `CameraFeedSimulator.tsx` component
- Display multiple camera views
- Simulate detections for demo

### Phase 5: Production Features
- Add authentication to API
- Encrypt face embeddings
- Auto-delete data after case closed
- Performance optimizations
- Analytics dashboard

## Architecture

```
┌─────────────────┐
│  React Frontend │
│  LostAndFound   │
└────────┬────────┘
         │
         ├─── faceRecognitionService.ts
         │    └─── POST /api/face/upload
         │    └─── POST /api/face/match
         │    └─── GET /api/face/cameras/live
         │
         └─── lostAndFoundService.ts
              └─── WebSocket video stream
              └─── Color matching

┌─────────────────┐
│  Python Backend │
│  FastAPI        │
└────────┬────────┘
         │
         ├─── face_service.py
         │    └─── Face embedding extraction
         │    └─── Face matching
         │    └─── JSON storage
         │
         └─── main.py
              └─── API endpoints
              └─── File upload handling
```

## Security Notes

- Face embeddings stored in JSON file (consider database for production)
- Photos stored locally (consider cloud storage for production)
- No authentication currently (add for production)
- CORS enabled for all origins (restrict for production)

## Performance

- Face matching: ~100-200ms per frame
- Embedding extraction: ~200-500ms per photo
- Recommended: Process frames at 5 FPS for face recognition
- Can process multiple faces per frame

## Support

For issues or questions:
1. Check browser console for errors
2. Check Python backend logs
3. Verify both services are running
4. Check network connectivity


