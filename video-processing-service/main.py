"""
Echoplex Video Processing Service
Real-time person detection, tracking, and attribute extraction for Lost & Found
"""

import asyncio
import base64
import io
import json
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime

import cv2
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ultralytics import YOLO
from PIL import Image

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Echoplex Video Processing Service")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global models (loaded once at startup)
detector_model: Optional[YOLO] = None
pose_model: Optional[YOLO] = None
clip_model = None  # Will be loaded if CLIP is available
clip_preprocess = None  # CLIP preprocessing function

# Track active video streams
active_streams: Dict[str, Dict] = {}


class MissingPersonProfile(BaseModel):
    """Missing person profile from frontend"""
    id: str
    name: str
    age: int
    description: str
    photoUrl: Optional[str] = None
    topColor: Optional[str] = None
    bottomColor: Optional[str] = None
    accessories: Optional[List[str]] = None


class MatchResult(BaseModel):
    """Match result for a detected person"""
    personId: str
    missingPersonId: str
    confidence: float
    attributes: Dict
    timestamp: datetime
    imageUrl: Optional[str] = None
    location: Optional[str] = None


def load_models():
    """Load YOLOv8 models for detection and pose estimation"""
    global detector_model, pose_model, clip_model, clip_preprocess
    
    try:
        logger.info("Loading YOLOv8 detection model...")
        detector_model = YOLO('yolov8n.pt')  # Nano model for speed
        logger.info("✓ Detection model loaded")
        
        logger.info("Loading YOLOv8 pose estimation model...")
        pose_model = YOLO('yolov8n-pose.pt')
        logger.info("✓ Pose model loaded")
        
        # Optional: Load CLIP model if available
        try:
            import clip
            import torch
            device = "cuda" if torch.cuda.is_available() else "cpu"
            clip_model, clip_preprocess = clip.load("ViT-B/32", device=device)
            logger.info(f"✓ CLIP model loaded on {device}")
        except ImportError:
            logger.warning("CLIP not available. Install with: pip install git+https://github.com/openai/CLIP.git")
            clip_model = None
            clip_preprocess = None
            
    except Exception as e:
        logger.error(f"Error loading models: {e}")
        raise


def get_dominant_color(image: np.ndarray, k: int = 3) -> str:
    """
    Extract dominant color from image using K-Means clustering
    Returns color name (e.g., "Red", "Blue", "Pink")
    """
    # Reshape image to be a list of pixels
    pixels = image.reshape(-1, 3)
    
    # Convert to float32
    pixels = np.float32(pixels)
    
    # Apply K-Means
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
    _, labels, centers = cv2.kmeans(pixels, k, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
    
    # Get the most common cluster
    unique, counts = np.unique(labels, return_counts=True)
    dominant_cluster = unique[np.argmax(counts)]
    dominant_color = centers[dominant_cluster].astype(int)
    
    # Map RGB to color name (simplified - can be enhanced)
    return rgb_to_color_name(dominant_color)


def rgb_to_color_name(rgb: np.ndarray) -> str:
    """Map RGB values to color names"""
    r, g, b = rgb[0], rgb[1], rgb[2]
    
    # Color name mapping (simplified - can use webcolors library for more accuracy)
    color_ranges = {
        "Red": ((200, 0, 0), (255, 100, 100)),
        "Pink": ((200, 100, 150), (255, 200, 220)),
        "Blue": ((0, 0, 150), (100, 100, 255)),
        "Green": ((0, 150, 0), (100, 255, 100)),
        "Yellow": ((200, 200, 0), (255, 255, 150)),
        "Orange": ((200, 100, 0), (255, 200, 100)),
        "Purple": ((100, 0, 150), (200, 100, 255)),
        "Black": ((0, 0, 0), (50, 50, 50)),
        "White": ((200, 200, 200), (255, 255, 255)),
        "Gray": ((100, 100, 100), (150, 150, 150)),
        "Brown": ((100, 50, 0), (150, 100, 50)),
        "Khaki": ((180, 180, 120), (220, 220, 160)),
    }
    
    for color_name, (lower, upper) in color_ranges.items():
        if (lower[0] <= r <= upper[0] and 
            lower[1] <= g <= upper[1] and 
            lower[2] <= b <= upper[2]):
            return color_name
    
    return "Unknown"


def crop_torso(image: np.ndarray, keypoints: np.ndarray) -> Optional[np.ndarray]:
    """
    Crop torso region (between shoulders and hips) from pose keypoints
    Keypoints format: [x1, y1, conf1, x2, y2, conf2, ...]
    Indices: 5,6 = left shoulder, 7,8 = right shoulder, 11,12 = left hip, 13,14 = right hip
    """
    if keypoints is None or len(keypoints) < 17 * 3:
        return None
    
    # Extract keypoint coordinates
    left_shoulder = (int(keypoints[5]), int(keypoints[6]))
    right_shoulder = (int(keypoints[7]), int(keypoints[8]))
    left_hip = (int(keypoints[11]), int(keypoints[12]))
    right_hip = (int(keypoints[13]), int(keypoints[14]))
    
    # Calculate bounding box
    min_x = min(left_shoulder[0], right_shoulder[0], left_hip[0], right_hip[0])
    max_x = max(left_shoulder[0], right_shoulder[0], left_hip[0], right_hip[0])
    min_y = min(left_shoulder[1], right_shoulder[1], left_hip[1], right_hip[1])
    max_y = max(left_shoulder[1], right_shoulder[1], left_hip[1], right_hip[1])
    
    # Add padding
    padding = 10
    min_x = max(0, min_x - padding)
    min_y = max(0, min_y - padding)
    max_x = min(image.shape[1], max_x + padding)
    max_y = min(image.shape[0], max_y + padding)
    
    if max_x > min_x and max_y > min_y:
        return image[min_y:max_y, min_x:max_x]
    return None


def crop_legs(image: np.ndarray, keypoints: np.ndarray) -> Optional[np.ndarray]:
    """
    Crop legs region (between hips and ankles) from pose keypoints
    """
    if keypoints is None or len(keypoints) < 17 * 3:
        return None
    
    # Extract keypoint coordinates
    left_hip = (int(keypoints[11]), int(keypoints[12]))
    right_hip = (int(keypoints[13]), int(keypoints[14]))
    left_ankle = (int(keypoints[15]), int(keypoints[16]))
    right_ankle = (int(keypoints[17]), int(keypoints[18]))
    
    # Calculate bounding box
    min_x = min(left_hip[0], right_hip[0], left_ankle[0], right_ankle[0])
    max_x = max(left_hip[0], right_hip[0], left_ankle[0], right_ankle[0])
    min_y = min(left_hip[1], right_hip[1], left_ankle[1], right_ankle[1])
    max_y = max(left_hip[1], right_hip[1], left_ankle[1], right_ankle[1])
    
    # Add padding
    padding = 10
    min_x = max(0, min_x - padding)
    min_y = max(0, min_y - padding)
    max_x = min(image.shape[1], max_x + padding)
    max_y = min(image.shape[0], max_y + padding)
    
    if max_x > min_x and max_y > min_y:
        return image[min_y:max_y, min_x:max_x]
    return None


def process_frame(frame: np.ndarray, missing_persons: List[MissingPersonProfile]) -> List[MatchResult]:
    """
    Process a single video frame:
    1. Detect persons
    2. Extract attributes (colors, accessories)
    3. Match against missing person profiles
    """
    matches = []
    
    if detector_model is None:
        return matches
    
    # Step 1: Detect persons
    results = detector_model(frame, classes=[0], verbose=False)  # class 0 = person
    
    for result in results:
        boxes = result.boxes
        if boxes is None:
            continue
            
        for box in boxes:
            # Extract bounding box
            x1, y1, x2, y2 = map(int, box.xyxy[0].cpu().numpy())
            confidence = float(box.conf[0].cpu().numpy())
            
            if confidence < 0.5:  # Confidence threshold
                continue
            
            # Crop person from frame
            person_img = frame[y1:y2, x1:x2]
            if person_img.size == 0:
                continue
            
            # Step 2: Pose estimation for attribute extraction
            pose_results = pose_model(person_img, verbose=False) if pose_model else None
            
            detected_attributes = {
                "topColor": None,
                "bottomColor": None,
                "accessories": []
            }
            
            if pose_results and len(pose_results) > 0:
                keypoints = pose_results[0].keypoints.data[0].cpu().numpy().flatten()
                
                # Extract top color (torso)
                torso_img = crop_torso(person_img, keypoints)
                if torso_img is not None and torso_img.size > 0:
                    detected_attributes["topColor"] = get_dominant_color(torso_img)
                
                # Extract bottom color (legs)
                legs_img = crop_legs(person_img, keypoints)
                if legs_img is not None and legs_img.size > 0:
                    detected_attributes["bottomColor"] = get_dominant_color(legs_img)
            
            # Step 3: Match against missing person profiles
            for missing_person in missing_persons:
                match_confidence = calculate_match_confidence(
                    detected_attributes, 
                    missing_person, 
                    person_img
                )
                
                if match_confidence > 0.7:  # Confidence threshold
                    match = MatchResult(
                        personId=f"person_{x1}_{y1}_{datetime.now().timestamp()}",
                        missingPersonId=missing_person.id,
                        confidence=match_confidence,
                        attributes=detected_attributes,
                        timestamp=datetime.now(),
                        location=None  # Can be set from camera metadata
                    )
                    matches.append(match)
    
    return matches


def calculate_match_confidence(
    detected_attributes: Dict, 
    missing_person: MissingPersonProfile,
    person_image: np.ndarray
) -> float:
    """
    Calculate match confidence score between detected person and missing person profile
    Combines color matching and CLIP-based description matching
    """
    score = 0.0
    factors = 0
    
    # Factor 1: Top color match
    if missing_person.topColor and detected_attributes.get("topColor"):
        if missing_person.topColor.lower() == detected_attributes["topColor"].lower():
            score += 0.4
        factors += 0.4
    
    # Factor 2: Bottom color match
    if missing_person.bottomColor and detected_attributes.get("bottomColor"):
        if missing_person.bottomColor.lower() == detected_attributes["bottomColor"].lower():
            score += 0.3
        factors += 0.3
    
    # Factor 3: CLIP-based description matching (if available)
    if clip_model and missing_person.description:
        try:
            clip_score = match_with_clip(person_image, missing_person.description)
            score += clip_score * 0.3
            factors += 0.3
        except Exception as e:
            logger.warning(f"CLIP matching failed: {e}")
    
    # Normalize score
    if factors > 0:
        return min(1.0, score / factors)
    return 0.0


def match_with_clip(image: np.ndarray, description: str) -> float:
    """
    Use CLIP to match image against text description
    Returns confidence score between 0 and 1
    """
    if clip_model is None or clip_preprocess is None:
        return 0.0
    
    try:
        import clip
        import torch
        
        device = "cuda" if torch.cuda.is_available() else "cpu"
        
        # Preprocess image
        pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        image_tensor = clip_preprocess(pil_image).unsqueeze(0).to(device)
        
        # Preprocess text
        text_tensor = clip.tokenize([f"A person {description}"]).to(device)
        
        # Get embeddings
        with torch.no_grad():
            image_features = clip_model.encode_image(image_tensor)
            text_features = clip_model.encode_text(text_tensor)
            
            # Calculate cosine similarity
            similarity = torch.cosine_similarity(image_features, text_features)
            return float(similarity.item())
            
    except Exception as e:
        logger.error(f"CLIP matching error: {e}")
        return 0.0


@app.on_event("startup")
async def startup_event():
    """Load models on startup"""
    load_models()


@app.get("/")
async def root():
    return {"status": "Echoplex Video Processing Service", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "detector_loaded": detector_model is not None,
        "pose_loaded": pose_model is not None,
        "clip_loaded": clip_model is not None
    }


@app.post("/api/process-frame")
async def process_frame_endpoint(data: dict):
    """
    Process a single frame (base64 encoded image)
    """
    try:
        # Decode base64 image
        image_data = data.get("image")
        if not image_data:
            raise HTTPException(status_code=400, detail="No image data provided")
        
        # Remove data URL prefix if present
        if "," in image_data:
            image_data = image_data.split(",")[1]
        
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid image data")
        
        # Parse missing persons
        missing_persons_data = data.get("missingPersons", [])
        missing_persons = [MissingPersonProfile(**mp) for mp in missing_persons_data]
        
        # Process frame
        matches = process_frame(frame, missing_persons)
        
        return {
            "matches": [match.dict() for match in matches],
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error processing frame: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws/video-stream")
async def websocket_video_stream(websocket: WebSocket):
    """
    WebSocket endpoint for real-time video stream processing
    """
    await websocket.accept()
    stream_id = None
    
    try:
        # Receive stream configuration
        config = await websocket.receive_json()
        stream_id = config.get("streamId", "default")
        missing_persons_data = config.get("missingPersons", [])
        missing_persons = [MissingPersonProfile(**mp) for mp in missing_persons_data]
        
        active_streams[stream_id] = {
            "missing_persons": missing_persons,
            "last_match_time": {}
        }
        
        logger.info(f"Video stream {stream_id} connected")
        
        while True:
            # Receive frame data
            data = await websocket.receive_json()
            
            if data.get("type") == "frame":
                # Decode image
                image_data = data.get("image")
                if "," in image_data:
                    image_data = image_data.split(",")[1]
                
                image_bytes = base64.b64decode(image_data)
                nparr = np.frombuffer(image_bytes, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                if frame is not None:
                    # Process frame
                    matches = process_frame(frame, missing_persons)
                    
                    # Send matches back (throttle to avoid spam)
                    for match in matches:
                        match_id = f"{match.missingPersonId}_{match.personId}"
                        last_time = active_streams[stream_id]["last_match_time"].get(match_id, 0)
                        
                        # Only send if not sent in last 5 seconds
                        if (datetime.now().timestamp() - last_time) > 5:
                            await websocket.send_json(match.dict())
                            active_streams[stream_id]["last_match_time"][match_id] = datetime.now().timestamp()
            
            elif data.get("type") == "update_profiles":
                # Update missing persons list
                missing_persons_data = data.get("missingPersons", [])
                missing_persons = [MissingPersonProfile(**mp) for mp in missing_persons_data]
                active_streams[stream_id]["missing_persons"] = missing_persons
            
            elif data.get("type") == "stop":
                break
                
    except WebSocketDisconnect:
        logger.info(f"Video stream {stream_id} disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        if stream_id and stream_id in active_streams:
            del active_streams[stream_id]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


