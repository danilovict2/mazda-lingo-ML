"""Cadence demo API. Replace analyze_speech with a Python scoring pipeline."""

import io
import json
import os
import wave
from pathlib import Path
from typing import Literal

import httpx
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import speech_features as sf
from speech_scoring import NoSpeech, score

ROOT = Path(__file__).resolve().parent
# Reference clips made by scripts/generate_audio.py.
REFERENCE_FILE = ROOT / "frontend" / "src" / "generated" / "audio.json"
REFERENCES = json.loads(REFERENCE_FILE.read_text()) if REFERENCE_FILE.exists() else {}
MAX_UPLOAD = 10 * 1024 * 1024

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


def elevenlabs_key() -> str | None:
    if key := os.environ.get("ELEVENLABS_API_KEY"):
        return key
    env = ROOT / ".env"
    if env.exists():
        for line in env.read_text().splitlines():
            if line.startswith("ELEVENLABS_API_KEY="):
                return line.split("=", 1)[1].strip().strip("\"'")
    return None


@app.post("/api/analyze-recording")
async def analyze_recording(clip: str = Form(), audio: UploadFile = File()):
    """Score a real microphone recording (16-bit mono WAV) against a studio clip."""
    ref = REFERENCES.get(clip)
    if not clip.startswith("studio-") or not ref:
        raise HTTPException(422, "Unknown practice text")
    data = await audio.read(MAX_UPLOAD + 1)
    if len(data) > MAX_UPLOAD:
        raise HTTPException(413, "Recording is too long")
    try:
        with wave.open(io.BytesIO(data)) as f:
            if f.getsampwidth() != 2 or f.getnchannels() != 1:
                raise HTTPException(422, "Expected 16-bit mono WAV audio")
            rate = f.getframerate()
            x = sf.to_float(f.readframes(f.getnframes()))
    except (wave.Error, EOFError):
        raise HTTPException(422, "Could not read the recording")
    if x.size < rate * 0.3:
        raise HTTPException(422, "That recording is too short. Try again.")
    key = elevenlabs_key()
    if not key:
        raise HTTPException(503, "ELEVENLABS_API_KEY is not configured on the server")
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            res = await client.post(
                "https://api.elevenlabs.io/v1/speech-to-text",
                headers={"xi-api-key": key},
                data={
                    "model_id": "scribe_v2",
                    "language_code": "en",
                    "timestamps_granularity": "word",
                    "tag_audio_events": "false",
                },
                files={"file": ("recording.wav", data, "audio/wav")},
            )
    except httpx.HTTPError:
        raise HTTPException(502, "Speech-to-text service is unreachable")
    if res.status_code != 200:
        raise HTTPException(502, "Speech-to-text failed")
    heard = [w for w in res.json().get("words", []) if w.get("type") == "word"]
    try:
        return score(ref, x, rate, heard)
    except NoSpeech as e:
        raise HTTPException(422, str(e))
