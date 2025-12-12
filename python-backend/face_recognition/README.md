# Echoplex Face Recognition Backend

FastAPI backend service for facial recognition in the Lost & Found feature.

## Features

- Upload missing person photos and extract face embeddings
- Match camera frames against stored face embeddings
- Search missing persons by text description
- Live camera feed statistics
- Case status management

## Setup

### Prerequisites

- Python 3.8+
- pip

### Installation

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Note**: Installing `dlib` (required by `face-recognition`) may require additional system dependencies:
- Windows: May need Visual C++ Build Tools
- macOS: `brew install cmake`
- Linux: `sudo apt-get install cmake`

### Start the Service

```bash
python main.py
```

The service will start on `http://localhost:8001`

## API Endpoints

### POST `/api/face/upload`
Upload missing person photo and extract face embedding.

**Request:**
- `photo`: Image file (multipart/form-data)
- `name`: Person's name (form field)
- `age`: Person's age (form field)
- `description`: Text description (form field)
- `last_seen`: Optional location (form field)
- `reported_by`: Optional reporter name (form field)

**Response:**
```json
{
  "success": true,
  "personId": "MP-ABC12345",
  "embedding_created": true,
  "photo_path": "uploads/missing_persons/MP-ABC12345.jpg"
}
```

### POST `/api/face/match`
Compare camera frame against stored faces.

**Request:**
- `photo`: Camera frame image (multipart/form-data)
- `tolerance`: Face distance tolerance, default 0.6 (form field)

**Response:**
```json
[
  {
    "personId": "MP-ABC12345",
    "name": "John Doe",
    "confidence": 87.5,
    "face_distance": 0.35,
    "location": "Camera Feed",
    "timestamp": "2024-12-12T00:00:00"
  }
]
```

### POST `/api/face/search-by-description`
Search missing persons by text description.

**Request:**
- `description`: Text description (form field)

**Response:**
```json
{
  "potential_matches": [...],
  "count": 2
}
```

### GET `/api/face/cameras/live`
Get live camera feed processing statistics.

**Response:**
```json
{
  "totalScans": 0,
  "facesDetected": 0,
  "activeMatches": 3,
  "totalMissingPersons": 5,
  "searchingCount": 3
}
```

### PUT `/api/face/case/{person_id}/status`
Update missing person case status.

**Request:**
- `status`: New status (form field)

**Response:**
```json
{
  "success": true,
  "personId": "MP-ABC12345",
  "status": "found"
}
```

## File Structure

```
python-backend/face_recognition/
├── main.py              # FastAPI application
├── face_service.py      # Face recognition logic
├── requirements.txt     # Python dependencies
├── README.md            # This file
├── data/
│   └── face_embeddings.json  # Stored face embeddings
├── uploads/
│   └── missing_persons/  # Uploaded photos
└── models/              # Model files (if needed)
```

## Configuration

The service uses JSON file storage by default. For production, consider:
- PostgreSQL database for embeddings
- Redis for caching
- S3/cloud storage for photos
- Authentication middleware

## Troubleshooting

### dlib installation fails
- Windows: Install Visual C++ Build Tools
- macOS: `brew install cmake`
- Linux: `sudo apt-get install cmake build-essential`

### No face detected in image
- Ensure image contains a clear face
- Try different image angles
- Check image quality/resolution

### Port already in use
Change port in `main.py`:
```python
uvicorn.run(app, host="0.0.0.0", port=8002)
```


