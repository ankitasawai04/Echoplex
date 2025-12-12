"""
Echoplex Face Recognition API
FastAPI backend for missing person facial recognition
"""

import os
import uuid
import logging
from typing import Optional, List
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from face_service import FaceRecognitionService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Echoplex Face Recognition API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize face recognition service
face_service = FaceRecognitionService(
    embeddings_file="data/face_embeddings.json",
    uploads_dir="uploads/missing_persons"
)

# Request/Response models
class MatchResult(BaseModel):
    personId: str
    name: str
    confidence: float
    face_distance: float
    location: str
    timestamp: str

class UploadResponse(BaseModel):
    success: bool
    personId: str
    embedding_created: bool
    photo_path: Optional[str] = None
    error: Optional[str] = None

class LiveStatsResponse(BaseModel):
    totalScans: int
    facesDetected: int
    activeMatches: int
    totalMissingPersons: int
    searchingCount: int


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Echoplex Face Recognition API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "embeddings_loaded": len(face_service.embeddings_cache),
        "service": "face_recognition"
    }


@app.post("/api/face/upload", response_model=UploadResponse)
async def upload_missing_person(
    photo: UploadFile = File(...),
    name: str = Form(...),
    age: int = Form(...),
    description: str = Form(...),
    last_seen: Optional[str] = Form(None),
    reported_by: Optional[str] = Form(None)
):
    """
    Upload missing person photo and extract face embedding
    
    Accepts:
    - photo: Image file (JPEG, PNG)
    - name: Person's name
    - age: Person's age
    - description: Text description
    - last_seen: Optional location where last seen
    - reported_by: Optional reporter name
    
    Returns:
    - success: Whether upload was successful
    - personId: Unique ID for the person
    - embedding_created: Whether face embedding was extracted
    """
    try:
        # Generate unique person ID
        person_id = f"MP-{uuid.uuid4().hex[:8].upper()}"
        
        # Validate file type
        if not photo.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Save uploaded file
        file_extension = Path(photo.filename).suffix or '.jpg'
        filename = f"{person_id}{file_extension}"
        file_path = os.path.join(face_service.uploads_dir, filename)
        
        # Ensure uploads directory exists
        os.makedirs(face_service.uploads_dir, exist_ok=True)
        
        # Save file
        with open(file_path, "wb") as buffer:
            content = await photo.read()
            buffer.write(content)
        
        logger.info(f"Saved uploaded file: {file_path}")
        
        # Extract face embedding and store
        result = face_service.upload_missing_person(
            person_id=person_id,
            name=name,
            age=age,
            description=description,
            image_path=file_path,
            last_seen=last_seen,
            reported_by=reported_by
        )
        
        if not result["success"]:
            # Delete uploaded file if face extraction failed
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(status_code=400, detail=result.get("error", "Face extraction failed"))
        
        return UploadResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading missing person: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/face/match", response_model=List[MatchResult])
async def match_faces(
    photo: UploadFile = File(...),
    tolerance: float = Form(0.6)
):
    """
    Compare camera frame against stored face embeddings
    
    Accepts:
    - photo: Camera frame image
    - tolerance: Face distance tolerance (default 0.6, lower = stricter)
    
    Returns:
    - List of matches with personId, confidence, location
    """
    try:
        # Validate file type
        if not photo.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Save temporary file for processing
        temp_file = f"temp_{uuid.uuid4().hex}.jpg"
        temp_path = os.path.join(face_service.uploads_dir, temp_file)
        
        with open(temp_path, "wb") as buffer:
            content = await photo.read()
            buffer.write(content)
        
        try:
            # Match faces
            matches = face_service.match_faces(temp_path, tolerance=tolerance)
            
            # Convert to response format
            results = [
                MatchResult(**match) for match in matches
            ]
            
            return results
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error matching faces: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/face/search-by-description")
async def search_by_description(description: str = Form(...)):
    """
    Search missing persons by text description
    
    Accepts:
    - description: Text description (e.g., "pink shirt blue jeans")
    
    Returns:
    - List of potential matches
    """
    try:
        matches = face_service.search_by_description(description)
        return {
            "potential_matches": matches,
            "count": len(matches)
        }
    except Exception as e:
        logger.error(f"Error searching by description: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/face/cameras/live", response_model=LiveStatsResponse)
async def get_live_camera_stats():
    """
    Get live camera feed processing statistics
    
    Returns:
    - totalScans: Total number of frames processed
    - facesDetected: Number of faces detected
    - activeMatches: Number of active searches
    - totalMissingPersons: Total missing persons in database
    - searchingCount: Number of persons currently being searched for
    """
    try:
        stats = face_service.get_live_stats()
        return LiveStatsResponse(**stats)
    except Exception as e:
        logger.error(f"Error getting live stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/face/case/{person_id}/status")
async def update_case_status(person_id: str, status: str = Form(...)):
    """
    Update missing person case status
    
    Accepts:
    - person_id: Person ID
    - status: New status (e.g., "found", "searching", "potential-match")
    """
    try:
        success = face_service.update_case_status(person_id, status)
        if not success:
            raise HTTPException(status_code=404, detail="Person not found")
        return {"success": True, "personId": person_id, "status": status}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating case status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/face/persons")
async def get_all_persons():
    """Get all missing persons"""
    try:
        persons = list(face_service.embeddings_cache.values())
        return {
            "persons": persons,
            "count": len(persons)
        }
    except Exception as e:
        logger.error(f"Error getting persons: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)


