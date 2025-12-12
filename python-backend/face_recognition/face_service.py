"""
Face Recognition Service
Handles face detection, embedding extraction, and matching
"""

import os
import json
import logging
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import numpy as np
from PIL import Image
import cv2

# Try to import face_recognition, but make it optional
try:
    import face_recognition
    FACE_RECOGNITION_AVAILABLE = True
except ImportError:
    FACE_RECOGNITION_AVAILABLE = False
    logging.warning("face_recognition library not available. Install dlib and face-recognition for full functionality.")

logger = logging.getLogger(__name__)

class FaceRecognitionService:
    """Service for face recognition operations"""
    
    def __init__(self, embeddings_file: str = "data/face_embeddings.json", uploads_dir: str = "uploads/missing_persons"):
        self.embeddings_file = embeddings_file
        self.uploads_dir = uploads_dir
        self.embeddings_cache: Dict[str, Dict] = {}
        
        # Ensure directories exist
        os.makedirs(os.path.dirname(embeddings_file), exist_ok=True)
        os.makedirs(uploads_dir, exist_ok=True)
        
        # Load existing embeddings
        self.load_embeddings()
    
    def load_embeddings(self):
        """Load face embeddings from JSON file"""
        if os.path.exists(self.embeddings_file):
            try:
                with open(self.embeddings_file, 'r') as f:
                    data = json.load(f)
                    self.embeddings_cache = {item['personId']: item for item in data}
                logger.info(f"Loaded {len(self.embeddings_cache)} face embeddings")
            except Exception as e:
                logger.error(f"Error loading embeddings: {e}")
                self.embeddings_cache = {}
        else:
            logger.info("No existing embeddings file found, starting fresh")
            self.embeddings_cache = {}
    
    def save_embeddings(self):
        """Save face embeddings to JSON file"""
        try:
            embeddings_list = list(self.embeddings_cache.values())
            with open(self.embeddings_file, 'w') as f:
                json.dump(embeddings_list, f, indent=2)
            logger.info(f"Saved {len(embeddings_list)} embeddings to file")
        except Exception as e:
            logger.error(f"Error saving embeddings: {e}")
            raise
    
    def extract_face_embedding(self, image_path: str) -> Optional[np.ndarray]:
        """
        Extract face embedding from image
        Returns 128-dimensional face encoding or None if no face found
        """
        if not FACE_RECOGNITION_AVAILABLE:
            logger.error("face_recognition library not available. Please install dlib and face-recognition.")
            return None
            
        try:
            # Load image
            image = face_recognition.load_image_file(image_path)
            
            # Find face locations
            face_locations = face_recognition.face_locations(image)
            
            if not face_locations:
                logger.warning(f"No face detected in {image_path}")
                return None
            
            # Get face encodings (128-dimensional vector)
            face_encodings = face_recognition.face_encodings(image, face_locations)
            
            if not face_encodings:
                logger.warning(f"Could not extract encoding from {image_path}")
                return None
            
            # Return the first face encoding
            return face_encodings[0]
            
        except Exception as e:
            logger.error(f"Error extracting face embedding: {e}")
            return None
    
    def upload_missing_person(
        self,
        person_id: str,
        name: str,
        age: int,
        description: str,
        image_path: str,
        last_seen: Optional[str] = None,
        reported_by: Optional[str] = None
    ) -> Dict:
        """
        Upload missing person photo and extract face embedding
        Returns: {success, personId, embedding_created, photo_path}
        """
        try:
            # Extract face embedding
            embedding = self.extract_face_embedding(image_path)
            
            if embedding is None:
                return {
                    "success": False,
                    "personId": person_id,
                    "embedding_created": False,
                    "error": "No face detected in image"
                }
            
            # Convert numpy array to list for JSON storage
            embedding_list = embedding.tolist()
            
            # Store embedding
            self.embeddings_cache[person_id] = {
                "personId": person_id,
                "name": name,
                "age": age,
                "description": description,
                "embedding": embedding_list,
                "photo_path": image_path,
                "last_seen": last_seen,
                "reported_by": reported_by,
                "timestamp": datetime.now().isoformat(),
                "status": "searching"
            }
            
            # Save to file
            self.save_embeddings()
            
            logger.info(f"Successfully uploaded missing person: {person_id} ({name})")
            
            return {
                "success": True,
                "personId": person_id,
                "embedding_created": True,
                "photo_path": image_path
            }
            
        except Exception as e:
            logger.error(f"Error uploading missing person: {e}")
            return {
                "success": False,
                "personId": person_id,
                "embedding_created": False,
                "error": str(e)
            }
    
    def match_faces(self, image_path: str, tolerance: float = 0.6) -> List[Dict]:
        """
        Compare camera frame against all stored face embeddings
        Returns: List of matches with personId, confidence, and location
        """
        matches = []
        
        if not FACE_RECOGNITION_AVAILABLE:
            logger.error("face_recognition library not available. Please install dlib and face-recognition.")
            return matches
        
        try:
            # Load and detect faces in the image
            image = face_recognition.load_image_file(image_path)
            face_locations = face_recognition.face_locations(image)
            face_encodings = face_recognition.face_encodings(image, face_locations)
            
            if not face_encodings:
                return matches
            
            # Compare each detected face with stored embeddings
            for face_encoding in face_encodings:
                for person_id, person_data in self.embeddings_cache.items():
                    stored_embedding = np.array(person_data['embedding'])
                    
                    # Calculate face distance (lower = more similar)
                    face_distance = face_recognition.face_distance([stored_embedding], face_encoding)[0]
                    
                    # Convert distance to confidence (0-100%)
                    # face_distance ranges from 0 (identical) to ~1.0 (very different)
                    # We'll use tolerance to determine match
                    if face_distance <= tolerance:
                        confidence = max(0, min(100, (1 - face_distance) * 100))
                        
                        matches.append({
                            "personId": person_id,
                            "name": person_data.get("name", "Unknown"),
                            "confidence": round(confidence, 2),
                            "face_distance": round(float(face_distance), 4),
                            "location": "Camera Feed",  # Can be enhanced with camera metadata
                            "timestamp": datetime.now().isoformat()
                        })
            
            # Sort by confidence (highest first)
            matches.sort(key=lambda x: x['confidence'], reverse=True)
            
            logger.info(f"Found {len(matches)} matches in image")
            return matches
            
        except Exception as e:
            logger.error(f"Error matching faces: {e}")
            return matches
    
    def search_by_description(self, description: str) -> List[Dict]:
        """
        Search missing persons by text description
        Uses simple keyword matching (can be enhanced with CLIP)
        """
        description_lower = description.lower()
        matches = []
        
        for person_id, person_data in self.embeddings_cache.items():
            # Check if description matches
            person_desc = person_data.get("description", "").lower()
            person_name = person_data.get("name", "").lower()
            
            # Simple keyword matching
            keywords = description_lower.split()
            match_score = 0
            
            for keyword in keywords:
                if keyword in person_desc or keyword in person_name:
                    match_score += 1
            
            if match_score > 0:
                matches.append({
                    "personId": person_id,
                    "name": person_data.get("name"),
                    "age": person_data.get("age"),
                    "description": person_data.get("description"),
                    "last_seen": person_data.get("last_seen"),
                    "reported_by": person_data.get("reported_by"),
                    "status": person_data.get("status", "searching"),
                    "match_score": match_score,
                    "photo_path": person_data.get("photo_path")
                })
        
        # Sort by match score
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        
        return matches
    
    def get_live_stats(self) -> Dict:
        """
        Get live camera feed processing statistics
        Returns mock data for now (can be enhanced with real camera feeds)
        """
        total_persons = len(self.embeddings_cache)
        active_searches = len([p for p in self.embeddings_cache.values() if p.get("status") == "searching"])
        
        return {
            "totalScans": 0,  # Can be tracked with a counter
            "facesDetected": 0,  # Can be tracked from recent matches
            "activeMatches": active_searches,
            "totalMissingPersons": total_persons,
            "searchingCount": active_searches
        }
    
    def update_case_status(self, person_id: str, status: str):
        """Update the status of a missing person case"""
        if person_id in self.embeddings_cache:
            self.embeddings_cache[person_id]["status"] = status
            self.save_embeddings()
            logger.info(f"Updated status for {person_id} to {status}")
            return True
        return False

