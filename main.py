"""Cadence demo API. Replace analyze_speech with a Python scoring pipeline."""

from typing import Literal
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Cadence API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
GAMES = [
    "stress-steps",
    "rhythm-echo",
    "stress-twins",
    "soundprint",
    "stress-detective",
    "rhythm-match",
    "shape-your-sound",
]


class Placement(BaseModel):
    correct: int = Field(ge=0, le=5)
    total: Literal[5] = 5


class Session(BaseModel):
    game: str
    correct: int = Field(ge=0, le=6)
    total: int = Field(ge=1, le=6)


class Speech(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    difficulty: Literal["Easy", "Medium", "Hard"] = "Medium"


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/placement-test")
def placement(data: Placement):
    return {
        "level": "Advanced"
        if data.correct >= 4
        else "Intermediate"
        if data.correct >= 2
        else "Beginner"
    }


@app.post("/api/session")
def session(data: Session):
    from fastapi import HTTPException

    if data.correct > data.total or data.game not in GAMES:
        raise HTTPException(status_code=422, detail="Invalid lesson or answer count")
    return {"xp": data.total * 20 + data.correct * 10}


@app.post("/api/analyze-speech")
def analyze_speech(data: Speech):
    # Integration boundary: accept an audio upload and call your Python speech/AI
    # pipeline here. This endpoint intentionally scores no actual recording.
    if data.difficulty == "Easy":
        return {
            "overallScore": 82,
            "wordStress": 88,
            "rhythm": 76,
            "clarity": 91,
            "sentenceStress": 73,
            "feedback": [
                "Great clarity — your syllables are easy to follow.",
                "Give TOG a little more length: pho-TOG-ra-phy.",
                "Keep the other syllables light and relaxed.",
            ],
            "simulated": True,
        }
    return {
        "overallScore": 82,
        "wordStress": 88,
        "rhythm": 76,
        "clarity": 91,
        "sentenceStress": 73,
        "feedback": [
            "Great clarity — your words are easy to follow.",
            "Try stressing ‘actually’ more strongly.",
            "The final phrase became slightly rushed. Pause briefly before the contrast.",
        ],
        "simulated": True,
    }
