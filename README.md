# 🌊 LingoWave

**Speak the music of English.** A gamified, Duolingo-inspired trainer for English
prosody — syllable stress, sentence rhythm, heteronyms, waveform reading,
contextual subtext, audio cadence, and articulation — built for a hackathon pitch.

Real web SPA frontend + lightweight Python (FastAPI) backend. Zero database,
zero external media assets: all audio is synthesized in the browser with the
**Web Audio API** and all waveforms are drawn on an HTML5 **`<canvas>`**.

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend | HTML5, Tailwind CSS (CDN), vanilla JS |
| Audio | Web Audio API (`OscillatorNode`), MediaDevices (`getUserMedia`) |
| Visuals | Canvas API (waveforms), Chart.js (radar / spider chart) |
| Backend | FastAPI + Uvicorn |
| Persistence | in-memory + `session.json` (no DB) |

## Run it

```bash
# with uv
uv sync
uv run python main.py

# or with pip
pip install fastapi uvicorn
python main.py            # → http://127.0.0.1:8000
# or:  uvicorn main:app --reload
```

Open **http://127.0.0.1:8000**. Set `PORT` to change the port.

## The 7 mini-games

1. **🎯 StressMatrix** — pick the primary stressed syllable (`● ○ ○`).
2. **🥁 CadencePulse** — tap the content words that carry the beat.
3. **🔀 ShiftShift** — spot the heteronym decoy that *doesn't* shift meaning.
4. **📈 WaveReader** — read an animated canvas waveform, find the loudest syllable.
5. **💬 SubtextDecode** — same words, different stress → pick the implied meaning.
6. **🎵 ToneSync** — hear a synthesized rhythm, match the meter (`da-DA-da`).
7. **🪞 VocalMirror** — capstone with live mic waveform + webcam, simulated
   Pitch / Stress / Rhythm scorecard and actionable tips.

Plus a **Placement Test** that unlocks games by level, a gamified HUD (XP, streak,
fluency badge), a **⚡ Skip to Demo Mode** button, and a **🕸️ Mastery Web** radar
chart comparing your profile against an 80% target with a personalized recommendation.

## Project layout

```
main.py             FastAPI server: static serving + REST API + scoring + persistence
static/index.html   SPA shell — Tailwind + Chart.js, sticky HUD navbar
static/app.js       Game logic, Web Audio, canvas drawing, API fetch calls
static/styles.css   Custom game styles & animations
```

## API surface

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/state` | current stats (xp, streak, scores, unlocks, fluency) |
| GET | `/api/meta` | game registry + competencies |
| GET/POST | `/api/placement` | diagnostic questions / submit answers |
| GET | `/api/questions/{game}` | question set (answers stripped) |
| POST | `/api/answer` | submit an answer, server-side scoring |
| POST | `/api/vocal` | simulated prosody analysis |
| POST | `/api/demo` | unlock all games |
| POST | `/api/reset` | reset progress |
