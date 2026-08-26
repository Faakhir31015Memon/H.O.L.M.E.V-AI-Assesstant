from fastapi import FastAPI
from pydantic import BaseModel

from language import understand

app = FastAPI(title="H.O.L.M.E.V AI Engine", version="0.1.0")


class TextIn(BaseModel):
    text: str


@app.get("/health")
def health():
    return {"ok": True, "service": "holmev-ai-engine", "phase": 1}


@app.post("/api/v1/language/understand")
def language_understand(body: TextIn):
    return understand(body.text)


@app.post("/api/v1/ai/chat")
def chat(body: TextIn):
    result = understand(body.text)
    return {"reply": result["command"].get("spokenReply"), "understand": result}


@app.post("/api/v1/emotion/analyze")
def emotion_stub():
    return {
        "emotion_estimates": {"happy": 0.12, "sad": 0.08, "angry": 0.05, "neutral": 0.75},
        "dominant": "neutral",
        "confidence": 0.4,
        "note": "Estimate only. Not a diagnosis.",
    }


@app.post("/api/v1/vision/gesture/detect")
def gesture_stub():
    return {"gesture": "NONE", "confidence": 0.0, "note": "MediaPipe not wired in Phase 1."}


@app.post("/api/v1/voice/transcribe")
def transcribe_stub():
    return {"text": "", "note": "STT model not loaded in Phase 1. Use typed commands."}
