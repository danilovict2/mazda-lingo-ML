"""Cadence API and production frontend server."""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal
from uuid import UUID, uuid4

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from auth import current_user
from database import db


GAMES = {
    "stress-steps": "Stress Steps",
    "rhythm-echo": "Rhythm Echo",
    "stress-twins": "Stress Twins",
    "soundprint": "Soundprint",
    "stress-detective": "Stress Detective",
    "rhythm-match": "Rhythm Match",
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
    if data.correct > data.total or data.game not in GAMES or data.game == "shape-your-sound":
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
