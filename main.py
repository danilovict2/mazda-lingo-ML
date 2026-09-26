"""
LingoWave — gamified English prosody trainer.

A minimal FastAPI backend that:
  * serves the single-page web frontend from ./static
  * exposes REST endpoints for placement diagnostics, question sets,
    scoring logic, and user-stat persistence
  * persists a single demo session to ./session.json (no external DB)

Launch with either:
    python main.py
    uvicorn main:app --reload
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

BASE_DIR = Path(__file__).parent
STATIC_DIR = BASE_DIR / "static"
SESSION_FILE = BASE_DIR / "session.json"

# --------------------------------------------------------------------------- #
#  Game registry
# --------------------------------------------------------------------------- #
# key, emoji, title, subtitle, competency, xp-per-correct, difficulty
GAMES = [
    ("stress_matrix", "🎯", "StressMatrix", "Stress Pattern", "Syllable Stress", 12, "Easy"),
    ("cadence_pulse", "🥁", "CadencePulse", "Copy the Rhythm", "Sentence Rhythm", 12, "Easy"),
    ("shift_shift", "🔀", "ShiftShift", "Heteronym & Semantic Stress", "Heteronym Shift", 14, "Medium"),
    ("wave_reader", "📈", "WaveReader", "Read the Sound", "Waveform Recognition", 14, "Medium"),
    ("subtext_decode", "💬", "SubtextDecode", "Conversation Context Stress", "Contextual Subtext", 16, "Hard"),
    ("tone_sync", "🎵", "ToneSync", "Match the Rhythm", "Audio Cadence", 14, "Medium"),
    ("vocal_mirror", "🪞", "VocalMirror", "Shape the Sound", "Articulation & Flow", 20, "Hard"),
]
GAME_KEYS = [g[0] for g in GAMES]
COMPETENCIES = [g[4] for g in GAMES]
XP_BY_KEY = {g[0]: g[5] for g in GAMES}
COMP_BY_KEY = {g[0]: g[4] for g in GAMES}

FLUENCY_BANDS = [
    (0, "A1", "Breakthrough"),
    (25, "A2", "Waystage"),
    (45, "B1", "Threshold"),
    (60, "B2", "Vantage"),
    (78, "C1", "Advanced"),
    (92, "C2", "Mastery"),
]

# --------------------------------------------------------------------------- #
#  Placement diagnostic
# --------------------------------------------------------------------------- #
PLACEMENT = [
    {
        "id": "p1",
        "prompt": "Where is the primary stress in “banana”?",
        "syllables": ["ba", "na", "na"],
        "options": ["ba-NA-na (2nd)", "BA-na-na (1st)", "ba-na-NA (3rd)", "Equal stress"],
        "answer": 0,
        "weight": 1,
    },
    {
        "id": "p2",
        "prompt": "Which stresses the contrast in “I said the RED car, not the blue one”?",
        "options": [
            "I SAID the red car…",
            "I said the RED car…",
            "I said the red CAR…",
            "I said THE red car…",
        ],
        "answer": 1,
        "weight": 2,
    },
    {
        "id": "p3",
        "prompt": "As a verb, how is “record” stressed?  (“Please ___ the meeting.”)",
        "options": ["RE-cord (1st)", "re-CORD (2nd)", "Both are fine", "Neither"],
        "answer": 1,
        "weight": 3,
    },
]

# --------------------------------------------------------------------------- #
#  Question bank  (answers live server-side, stripped before sending)
# --------------------------------------------------------------------------- #
QUESTIONS: dict[str, list[dict[str, Any]]] = {
    "stress_matrix": [
        {"id": "sm1", "word": "PHOTOGRAPH", "syllables": ["PHO", "to", "graph"],
         "stress": 0, "options": ["● ○ ○  (1st)", "○ ● ○  (2nd)", "○ ○ ●  (3rd)", "● ● ○"],
         "answer": 0, "explanation": "PHOTOGRAPH → PHO-to-graph, stress on the 1st syllable."},
        {"id": "sm2", "word": "photography", "syllables": ["pho", "TOG", "ra", "phy"],
         "stress": 1, "options": ["● ○ ○ ○", "○ ● ○ ○  (2nd)", "○ ○ ● ○", "○ ○ ○ ●"],
         "answer": 1, "explanation": "photography → pho-TOG-ra-phy, stress shifts to the 2nd syllable."},
        {"id": "sm3", "word": "understand", "syllables": ["un", "der", "stand"],
         "stress": 2, "options": ["● ○ ○", "○ ● ○", "○ ○ ●  (3rd)", "Equal"],
         "answer": 2, "explanation": "understand → un-der-STAND, stress on the final syllable."},
        {"id": "sm4", "word": "computer", "syllables": ["com", "pu", "ter"],
         "stress": 1, "options": ["● ○ ○", "○ ● ○  (2nd)", "○ ○ ●", "● ● ●"],
         "answer": 1, "explanation": "computer → com-PU-ter, stress on the 2nd syllable."},
    ],
    "cadence_pulse": [
        {"id": "cp1", "sentence": "I bought a red car yesterday",
         "words": ["I", "bought", "a", "red", "car", "yesterday"],
         "answer": [1, 3, 4], "multi": True,
         "explanation": "Beats fall on the content words: bought, red, car."},
        {"id": "cp2", "sentence": "She quickly ran to the station",
         "words": ["She", "quickly", "ran", "to", "the", "station"],
         "answer": [1, 2, 5], "multi": True,
         "explanation": "Beats fall on: quickly, ran, station."},
        {"id": "cp3", "sentence": "We should finish the project tonight",
         "words": ["We", "should", "finish", "the", "project", "tonight"],
         "answer": [2, 4, 5], "multi": True,
         "explanation": "Beats fall on: finish, project, tonight."},
    ],
    "shift_shift": [
        {"id": "ss1",
         "prompt": "Three of these change meaning when stress moves. Which one does NOT?",
         "items": [
             {"pair": "RE-cord / re-CORD", "note": "noun ↔ verb — shifts"},
             {"pair": "CON-duct / con-DUCT", "note": "noun ↔ verb — shifts"},
             {"pair": "PRE-sent / pre-SENT", "note": "gift ↔ to give — shifts"},
             {"pair": "HAP-py / hap-PY", "note": "adjective — no shift"},
         ],
         "options": ["RE-cord / re-CORD", "CON-duct / con-DUCT", "PRE-sent / pre-SENT", "HAP-py / hap-PY"],
         "answer": 3,
         "explanation": "“happy” is the decoy — moving the stress doesn't change its meaning."},
        {"id": "ss2",
         "prompt": "Pick the odd one out — the word whose meaning does NOT shift with stress.",
         "items": [
             {"pair": "OB-ject / ob-JECT", "note": "noun ↔ verb"},
             {"pair": "TA-ble / ta-BLE", "note": "noun — no shift"},
             {"pair": "PER-mit / per-MIT", "note": "noun ↔ verb"},
             {"pair": "CON-tract / con-TRACT", "note": "noun ↔ verb"},
         ],
         "options": ["OB-ject / ob-JECT", "TA-ble / ta-BLE", "PER-mit / per-MIT", "CON-tract / con-TRACT"],
         "answer": 1,
         "explanation": "“table” is the decoy — its meaning is unchanged by stress."},
    ],
    "wave_reader": [
        {"id": "wr1", "n": 2, "peak": 1, "seed": 11, "tier": "Easy",
         "answer": 1, "explanation": "The tallest amplitude/pitch peak is at σ2 — the stressed syllable."},
        {"id": "wr2", "n": 3, "peak": 0, "seed": 27, "tier": "Easy",
         "answer": 0, "explanation": "The tallest peak is at σ1 — the stressed syllable."},
        {"id": "wr3", "n": 4, "peak": 2, "seed": 42, "tier": "Hard",
         "answer": 2, "explanation": "The tallest peak is at σ3 — the stressed syllable."},
        {"id": "wr4", "n": 5, "peak": 3, "seed": 63, "tier": "Hard",
         "answer": 3, "explanation": "The tallest peak is at σ4 — the stressed syllable."},
    ],
    "subtext_decode": [
        {"id": "sd1", "sentence": "Why am <b>I</b> the only one copying my cousin?",
         "options": ["Why me and not someone else?", "Nobody else is doing this.",
                     "Anyone else would be fine, but specifically him?", "Is 'copying' even the right word?"],
         "answer": 0, "explanation": "Stressing “I” contrasts the speaker against other people."},
        {"id": "sd2", "sentence": "Why am I the <b>ONLY</b> one copying my cousin?",
         "options": ["Why me specifically?", "Nobody else is doing this — just me.",
                     "Why my cousin and not someone else?", "Should I be copying at all?"],
         "answer": 1, "explanation": "Stressing “ONLY” means no one else is doing it."},
        {"id": "sd3", "sentence": "Why am I copying <b>MY COUSIN</b>?",
         "options": ["Why me and not others?", "Am I the only one?",
                     "Anyone else would be fine, but specifically him?", "Why not be original?"],
         "answer": 2, "explanation": "Stressing “MY COUSIN” singles out that specific person."},
    ],
    "tone_sync": [
        {"id": "ts1", "phrase": "a CUP of TEA", "pattern": [0, 1, 0, 1],
         "options": ["da-DA-da-DA", "DA-da-DA-da", "da-da-DA-DA", "DA-DA-da-da"],
         "answer": 0, "explanation": "“a CUP of TEA” → da-DA-da-DA."},
        {"id": "ts2", "phrase": "TELL me MORE", "pattern": [1, 0, 1],
         "options": ["da-DA-da", "DA-da-DA", "da-da-DA", "DA-DA-da"],
         "answer": 1, "explanation": "“TELL me MORE” → DA-da-DA."},
        {"id": "ts3", "phrase": "I will GO", "pattern": [0, 0, 1],
         "options": ["DA-da-da", "da-DA-da", "da-da-DA", "DA-da-DA"],
         "answer": 2, "explanation": "“I will GO” → da-da-DA."},
    ],
    "vocal_mirror": [
        {"id": "vm_easy", "tier": "Easy", "label": "Single word", "target": "photography"},
        {"id": "vm_medium", "tier": "Medium", "label": "Sentence", "target": "I bought a red car yesterday."},
        {"id": "vm_hard", "tier": "Hard", "label": "Paragraph",
         "target": ("The committee will present the record tomorrow, and we should "
                    "conduct the review before we object.")},
    ],
}

# --------------------------------------------------------------------------- #
#  Session state (single demo user) with JSON persistence
# --------------------------------------------------------------------------- #
def default_state() -> dict[str, Any]:
    return {
        "placed": False,
        "level": None,
        "xp": 0,
        "streak": 0,
        "best_streak": 0,
        "scores": {c: 0 for c in COMPETENCIES},
        "unlocked": [],
        "rounds": {k: 0 for k in GAME_KEYS},
    }


def load_state() -> dict[str, Any]:
    if SESSION_FILE.exists():
        try:
            data = json.loads(SESSION_FILE.read_text(encoding="utf-8"))
            base = default_state()
            base.update(data)
            # heal any missing competency/round keys across versions
            for c in COMPETENCIES:
                base["scores"].setdefault(c, 0)
            for k in GAME_KEYS:
                base["rounds"].setdefault(k, 0)
            return base
        except (json.JSONDecodeError, OSError):
            pass
    return default_state()


def save_state(state: dict[str, Any]) -> None:
    SESSION_FILE.write_text(json.dumps(state, indent=2), encoding="utf-8")


STATE = load_state()


def fluency(state: dict[str, Any]) -> dict[str, Any]:
    vals = list(state["scores"].values())
    avg = sum(vals) / len(vals) if vals else 0
    band = FLUENCY_BANDS[0]
    for threshold, code, name in FLUENCY_BANDS:
        if avg >= threshold:
            band = (threshold, code, name)
    return {"code": band[1], "name": band[2], "avg": round(avg, 1)}


def public_state() -> dict[str, Any]:
    return {**STATE, "fluency": fluency(STATE), "meta": public_meta()}


def public_meta() -> dict[str, Any]:
    return {
        "games": [
            {"key": k, "emoji": e, "title": t, "subtitle": s,
             "competency": c, "xp": xp, "difficulty": d}
            for (k, e, t, s, c, xp, d) in GAMES
        ],
        "competencies": COMPETENCIES,
    }


def unlock_for_level(level: str) -> list[str]:
    if level == "Beginner":
        return GAME_KEYS[:2]
    if level == "Intermediate":
        return GAME_KEYS[:4]
    return GAME_KEYS[:6]  # Advanced


def strip_answers(game: str) -> list[dict[str, Any]]:
    """Return question set without answer keys / explanations."""
    out = []
    for q in QUESTIONS.get(game, []):
        pub = {k: v for k, v in q.items() if k not in ("answer", "explanation")}
        out.append(pub)
    return out


# --------------------------------------------------------------------------- #
#  FastAPI app
# --------------------------------------------------------------------------- #
app = FastAPI(title="LingoWave", version="1.0.0")


@app.get("/")
def index():
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/api/state")
def get_state():
    return public_state()


@app.get("/api/meta")
def get_meta():
    return public_meta()


@app.get("/api/placement")
def get_placement():
    return [{k: v for k, v in q.items() if k not in ("answer", "weight")} for q in PLACEMENT]


class PlacementSubmit(BaseModel):
    answers: dict[str, int]  # {question_id: chosen_index}


@app.post("/api/placement")
def submit_placement(body: PlacementSubmit):
    earned = 0
    total = sum(q["weight"] for q in PLACEMENT)
    for q in PLACEMENT:
        if body.answers.get(q["id"]) == q["answer"]:
            earned += q["weight"]
    pct = earned / total if total else 0
    if pct <= 0.34:
        level = "Beginner"
    elif pct <= 0.75:
        level = "Intermediate"
    else:
        level = "Advanced"

    STATE["placed"] = True
    STATE["level"] = level
    unlocked = set(STATE["unlocked"]) | set(unlock_for_level(level))
    STATE["unlocked"] = [k for k in GAME_KEYS if k in unlocked]
    # seed a little starting mastery so the radar isn't empty
    seed = int(pct * 30)
    for c in COMPETENCIES:
        STATE["scores"][c] = max(STATE["scores"][c], seed)
    save_state(STATE)
    return {"level": level, "score": earned, "total": total, "state": public_state()}


@app.get("/api/questions/{game}")
def get_questions(game: str):
    if game not in QUESTIONS:
        raise HTTPException(404, f"Unknown game '{game}'")
    return {"game": game, "questions": strip_answers(game)}


class AnswerSubmit(BaseModel):
    game: str
    qid: str
    choice: Any  # int for multiple-choice, list[int] for multi-select


def _award(correct: bool, key: str):
    comp = COMP_BY_KEY[key]
    if correct:
        STATE["xp"] += XP_BY_KEY[key]
        STATE["streak"] += 1
        STATE["best_streak"] = max(STATE["best_streak"], STATE["streak"])
        STATE["scores"][comp] = min(100, STATE["scores"][comp] + 20)
    else:
        STATE["streak"] = 0
        STATE["scores"][comp] = max(0, STATE["scores"][comp] - 5)


@app.post("/api/answer")
def submit_answer(body: AnswerSubmit):
    if body.game not in QUESTIONS:
        raise HTTPException(404, f"Unknown game '{body.game}'")
    question = next((q for q in QUESTIONS[body.game] if q["id"] == body.qid), None)
    if question is None:
        raise HTTPException(404, f"Unknown question '{body.qid}'")

    if question.get("multi"):
        try:
            chosen = set(int(i) for i in body.choice)
        except (TypeError, ValueError):
            raise HTTPException(400, "choice must be a list of indices")
        correct = chosen == set(question["answer"])
    else:
        correct = body.choice == question["answer"]

    _award(correct, body.game)
    STATE["rounds"][body.game] = STATE["rounds"].get(body.game, 0) + 1
    save_state(STATE)
    return {
        "correct": correct,
        "answer": question["answer"],
        "explanation": question.get("explanation", ""),
        "state": public_state(),
    }


class VocalSubmit(BaseModel):
    tier: str = "Easy"
    qid: str | None = None


@app.post("/api/vocal")
def submit_vocal(body: VocalSubmit):
    """Simulated prosody analysis for the VocalMirror capstone."""
    key = "vocal_mirror"
    # deterministic-but-varied scores keyed to attempt count + tier
    n = STATE["rounds"].get(key, 0)
    tier = (body.tier or "Easy").lower()
    base = 62 + (20 if tier.startswith("easy") else 12 if tier.startswith("medium") else 0)

    def pseudo(offset: int, lo: int, hi: int) -> int:
        # simple deterministic hash → range [lo, hi]
        h = (n * 1103515245 + offset * 12345 + 7) % 100
        return lo + int(h / 99 * (hi - lo))

    pitch = max(40, min(99, base + pseudo(1, -8, 15)))
    stress = max(40, min(99, base + pseudo(2, -10, 18)))
    rhythm = max(40, min(99, base + pseudo(3, -12, 16)))
    overall = round((pitch + stress + rhythm) / 3)

    tips: list[str] = []
    if stress < 75:
        tips.append("Lengthen the vowel in stressed syllables — make them ~1.5× longer.")
    if pitch < 75:
        tips.append("Add a clear pitch rise on the stressed syllable, then let it fall.")
    if rhythm < 75:
        tips.append("Compress function words (a, the, to) so content words land on the beat.")
    if not tips:
        tips.append("Excellent control — try the next difficulty tier!")
    tips.append("Record again and try to beat your last overall score.")

    _award(overall >= 65, key)
    STATE["scores"]["Articulation & Flow"] = min(
        100, max(STATE["scores"]["Articulation & Flow"], overall)
    )
    STATE["rounds"][key] = STATE["rounds"].get(key, 0) + 1
    save_state(STATE)
    return {
        "pitch": pitch, "stress": stress, "rhythm": rhythm, "overall": overall,
        "tips": tips, "passed": overall >= 65, "state": public_state(),
    }


@app.post("/api/demo")
def demo_unlock():
    STATE["unlocked"] = list(GAME_KEYS)
    STATE["placed"] = True
    if not STATE["level"]:
        STATE["level"] = "Advanced"
    save_state(STATE)
    return public_state()


@app.post("/api/reset")
def reset():
    global STATE
    STATE = default_state()
    save_state(STATE)
    return public_state()


# static assets (js/css) — mounted last so it doesn't shadow /api routes
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", "8000"))
    banner = f"\n  ~ LingoWave running at  http://127.0.0.1:{port}\n"
    try:
        print(banner)
    except UnicodeEncodeError:  # narrow Windows consoles (cp1252)
        print(banner.encode("ascii", "replace").decode())
    uvicorn.run(app, host="127.0.0.1", port=port)
