"""Cadence API and production frontend server."""

from __future__ import annotations

import io
import json
import os
import wave
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal
from uuid import UUID, uuid4

import httpx
import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile, Depends
from auth import current_user
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from auth import current_user
from database import db
import speech_features as sf
from speech_scoring import NoSpeech, score
import stress_check


ROOT = Path(__file__).resolve().parent
# Reference clips made by scripts/generate_audio.py.
REFERENCE_FILE = ROOT / "frontend" / "src" / "generated" / "audio.json"
REFERENCES = json.loads(REFERENCE_FILE.read_text()) if REFERENCE_FILE.exists() else {}
MAX_UPLOAD = 10 * 1024 * 1024


# Game id -> display name saved with each session. Must match frontend/src/data.ts.
GAMES = {
    "stress-sort": "Stress Sort",
    "stress-twins": "Stress Twins",
    "what-do-they-mean": "What do they mean?",
    "rhythm-match": "Rhythm Match",
    "say-it-right": "Say It Right",
    # Only recorded through /api/studio-session.
    "shape-your-sound": "Shape Your Sound",
}


@asynccontextmanager
async def lifespan(_: FastAPI):
    db.initialize()
    yield


app = FastAPI(title="Cadence API", version="2.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
        ).split(",")
        if origin.strip()
    ],
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)


class Placement(BaseModel):
    correct: int = Field(ge=0, le=5)
    total: Literal[5] = 5


class Session(BaseModel):
    game: str
    correct: int = Field(ge=0, le=6)
    total: int = Field(ge=1, le=6)
    attempt_id: UUID = Field(default_factory=uuid4, alias="attemptId")


class StudioSession(BaseModel):
    score: int = Field(ge=0, le=100)
    attempt_id: UUID = Field(default_factory=uuid4, alias="attemptId")


class Speech(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    difficulty: Literal["Easy", "Medium", "Hard"] = "Medium"


def subject(user: dict) -> str:
    return user["sub"]


@app.get("/api/health")
def health():
    try:
        db.check()
    except Exception as exc:
        raise HTTPException(503, "Database unavailable") from exc
    return {"status": "ok"}


@app.get("/api/progress")
def get_progress(user: dict = Depends(current_user)):
    return db.progress(subject(user))


@app.delete("/api/progress")
def reset_progress(user: dict = Depends(current_user)):
    return db.reset(subject(user))


@app.post("/api/placement-test")
def placement(data: Placement, user: dict = Depends(current_user)):
    level = (
        "Advanced"
        if data.correct >= 4
        else "Intermediate"
        if data.correct >= 2
        else "Beginner"
    )
    return {"level": level, "progress": db.save_placement(subject(user), level)}


@app.post("/api/session")
def session(data: Session, user: dict = Depends(current_user)):
    if (
        data.correct > data.total
        or data.game not in GAMES
        or data.game == "shape-your-sound"
    ):
        raise HTTPException(status_code=422, detail="Invalid lesson or answer count")
    xp = data.total * 20 + data.correct * 10
    progress, created = db.save_session(
        subject(user),
        attempt_id=str(data.attempt_id),
        game=data.game,
        name=GAMES[data.game],
        correct=data.correct,
        total=data.total,
        xp=xp,
    )
    return {"xp": xp, "progress": progress, "created": created}


@app.post("/api/studio-session")
def studio_session(data: StudioSession, user: dict = Depends(current_user)):
    progress, created = db.save_session(
        subject(user),
        attempt_id=str(data.attempt_id),
        game="shape-your-sound",
        name=GAMES["shape-your-sound"],
        correct=0,
        total=0,
        xp=120,
        accuracy=data.score,
    )
    return {"xp": 120, "progress": progress, "created": created}


@app.post("/api/analyze-speech")
def analyze_speech(data: Speech, user: dict = Depends(current_user)):
    del user
    if data.difficulty == "Easy":
        feedback = [
            "Great clarity — your syllables are easy to follow.",
            "Give TOG a little more length: pho-TOG-ra-phy.",
            "Keep the other syllables light and relaxed.",
        ]
    else:
        feedback = [
            "Great clarity — your words are easy to follow.",
            "Try stressing ‘actually’ more strongly.",
            "The final phrase became slightly rushed. Pause briefly before the contrast.",
        ]
    return {
        "overallScore": 82,
        "wordStress": 88,
        "rhythm": 76,
        "clarity": 91,
        "sentenceStress": 73,
        "feedback": feedback,
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


async def read_recording(audio: UploadFile) -> tuple[bytes, np.ndarray, int]:
    """Read an uploaded 16-bit mono WAV; returns (raw bytes, samples, sample rate)."""
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
    return data, x, rate


async def transcribe(data: bytes) -> list[dict]:
    """Words with start/end times from ElevenLabs speech-to-text."""
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
    return [w for w in res.json().get("words", []) if w.get("type") == "word"]


@app.post("/api/analyze-recording", dependencies=[Depends(current_user)])
async def analyze_recording(clip: str = Form(), audio: UploadFile = File()):
    """Score a real microphone recording (16-bit mono WAV) against a studio clip."""
    ref = REFERENCES.get(clip)
    if not clip.startswith("studio-") or not ref:
        raise HTTPException(422, "Unknown practice text")
    data, x, rate = await read_recording(audio)
    heard = await transcribe(data)
    try:
        return score(ref, x, rate, heard)
    except NoSpeech as e:
        raise HTTPException(422, str(e))


@app.post("/api/check-stress", dependencies=[Depends(current_user)])
async def check_stress(
    sentence: str = Form(max_length=200),
    targets: str = Form(max_length=100),
    audio: UploadFile = File(),
):
    """Say It Right: did the speaker stress the target word(s)? (comma-separated)"""
    words = [t.strip() for t in targets.split(",") if t.strip()]
    if not 1 <= len(words) <= 3:
        raise HTTPException(422, "Give one to three target words")
    data, x, rate = await read_recording(audio)
    heard = await transcribe(data)
    try:
        return stress_check.check_stress(x, rate, heard, sentence, words)
    except stress_check.NoSpeech as e:
        raise HTTPException(422, str(e))
    except ValueError as e:
        raise HTTPException(422, str(e))


@app.get("/api/me")
def me(user: dict = Depends(current_user)):
    return {"sub": subject(user)}


# The production image includes Vite's output. API routes are registered first so
# this SPA fallback only handles browser routes such as /dashboard.
frontend_dist = Path(__file__).parent / "frontend" / "dist"
if frontend_dist.is_dir():
    assets = frontend_dist / "assets"
    if assets.is_dir():
        app.mount("/assets", StaticFiles(directory=assets), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def frontend(path: str):
        requested = (frontend_dist / path).resolve()
        if requested.is_relative_to(frontend_dist.resolve()) and requested.is_file():
            return FileResponse(requested)
        return FileResponse(frontend_dist / "index.html")
