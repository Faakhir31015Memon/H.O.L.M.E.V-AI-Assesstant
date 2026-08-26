import base64
import numpy as np
import cv2
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from engines.gesture import HandGestureEngine
from engines.vision import FaceEmotionEngine
from engines.embedding import VectorMemoryEngine

app = FastAPI(
    title="H.O.L.M.E.V. AI & Vision Service",
    description="Python core vision and neural embeddings engine",
    version="1.0.0"
)

# Enable CORS for HUD clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instantiate engines
gesture_engine = HandGestureEngine()
face_engine = FaceEmotionEngine()
embedding_engine = VectorMemoryEngine()


# Schemas
class FramePayload(BaseModel):
    frame_bytes: str # Base64 encoded string

class TextPayload(BaseModel):
    text: str

class VoiceResponse(BaseModel):
    text: str
    audio_base64: str


@app.get("/api/v1/health")
async def health_check():
    return {"status": "ONLINE", "gpu_active": False}


@app.post("/api/v1/vision/analyze-frame")
async def analyze_frame(payload: FramePayload):
    """
    Decodes raw Base64 video frame.
    Runs Hand Gesture recognition & Face/Emotion classification in parallel.
    """
    try:
        # Decode base64 frame
        img_data = base64.b64decode(payload.frame_bytes)
        nparr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            raise HTTPException(status_code=400, detail="Corrupted image frame payload")

        # Convert to RGB for MediaPipe
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Run detection pipelines
        vision_results = face_engine.analyze_frame(frame)
        gesture_results = gesture_engine.analyze_frame(frame_rgb)

        return {
            "success": True,
            "vision": vision_results,
            "gesture": gesture_results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Frame processing pipeline exception: {str(e)}")


@app.post("/api/v1/voice/transcribe-speak", response_model=VoiceResponse)
async def voice_transcribe_speak(payload: TextPayload):
    """
    Simulates speech processing engine.
    Applies synthesized voice formatting.
    """
    if not payload.text:
        raise HTTPException(status_code=400, detail="Text input is required")
        
    # Mock return values for STT/TTS synthesis
    # In a full setup, this would load Coqui TTS or Whisper weights
    mock_audio_base64 = "UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA=="
    
    return VoiceResponse(
        text=f"[TTS RESPONSE SYNC]: {payload.text}",
        audio_base64=mock_audio_base64
    )


@app.post("/api/v1/vector/embed")
async def generate_vector_embedding(payload: TextPayload):
    """Generates a 768-dimensional float embedding vector."""
    if not payload.text:
        raise HTTPException(status_code=400, detail="Text context is required")

    embedding = embedding_engine.generate_embedding(payload.text)
    
    return {
        "text": payload.text,
        "embedding": embedding.tolist(),
        "dimension": len(embedding)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
