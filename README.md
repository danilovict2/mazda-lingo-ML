# Cadence

**Good English. Great rhythm.** A demo-ready pronunciation coach for English word stress, sentence emphasis, and natural rhythm. Seven short games turn listening and speaking practice into a visual, rewarding learning path.

## Run locally

Requires Node.js 20.19+ (or 22.12+), Python 3.13+ Bun, and uv.

```sh
cd frontend
bun i
bun run dev
```

Open http://localhost:5173. The Python API is required for placement, lesson completion, and speech analysis. Real microphone analysis in Shape Your Sound needs an ElevenLabs API key in `.env` at the repository root (`ELEVENLABS_API_KEY=...`); everything else works without one.

Required Python API, in a second terminal from the repository root:

```sh
uv run uvicorn main:app --reload --env-file .env
```

Vite development and preview proxy `/api` to `http://127.0.0.1:8000`. Optionally set `VITE_API_URL` in `frontend/.env.local` to use another host and restart Vite. Production must route `/api` to the backend or set `VITE_API_URL` at build time. Failed requests show errors instead of local fallback results. API docs: http://localhost:8000/docs.

```sh
cd frontend
bun run build
bun run preview
```

## A two-minute demo

1. Open the landing page → **Find my starting level**.
2. Answer a few placement questions, or **Skip to demo result**.
3. Enter the dashboard → **Stress Detective**. Select an interpretation and show the explanation.
4. Open **Soundprint** from the learning path for animated, syllable-aligned mock waveforms.
5. Open **Shape Your Sound** → **Try demo recording** → **Finish & analyze**. Save the practice.
6. Open **Speech profile** for the radar chart, skill breakdown, and recommendation.

The sidebar’s **Reset demo** clears progress. Practice routes require sign-in; login returns you to your requested route. Rhythm Match unlocks after completing a lesson or an Advanced placement result. The dashboard starts at 360 XP; new sessions, XP, accuracy, placement, and profile improvements persist in SQLite under the Auth0 account. Completing a lesson adds 20 XP per question plus 10 per correct answer; saved studio practice adds 120 XP. Profile growth is intentionally simulated.

## Architecture

```text
frontend/
  src/main.tsx               Entry point; routes live in src/App.tsx
  src/pages/, components/    Screens and reusable UI
  src/styles.css             Responsive design system and motion
  src/data.ts                Typed questions, game catalog, demo profile
  src/audio.ts               Access to the generated clip timings
  src/generated/audio.json   Generated: word/syllable timings, loudness, pitch
  src/api/client.ts          HTTP requests and response types
  public/audio/*.wav         Generated ElevenLabs reference clips
scripts/
  clips.json                 Every reference clip: text, stress markup, model
  generate_audio.py          Calls ElevenLabs and writes the clips + timings
main.py                      FastAPI API and production SPA hosting
database.py                  Transactional SQLite persistence
speech_features.py           Loudness, pitch and stress measurements (shared)
speech_scoring.py            Scores a recording against a reference clip
deploy/                      DigitalOcean Docker Compose and HTTPS proxy
```

React + TypeScript + Vite, React Router, Lucide icons, and plain CSS power the interface. FastAPI validates Auth0 access tokens and stores each account’s progress in SQLite. Session writes are transactional and idempotent, and the database uses WAL mode with a ten-second busy timeout for concurrent requests.

## Deploy to DigitalOcean

SQLite needs a persistent filesystem. DigitalOcean App Platform containers have ephemeral filesystems and do not support volumes, so deploy this configuration to a Droplet. The included Compose stack runs one application process, a persistent database volume, and Caddy for automatic HTTPS.

1. Create an Ubuntu Droplet, point the domain’s DNS A record to it, and install Docker Engine with the Compose plugin.
2. Clone the repository. Copy `deploy/.env.example` to `deploy/.env` and fill in the domain, Auth0 values, and ElevenLabs API key. The ElevenLabs key is optional if real microphone analysis is not needed.
3. Add `https://your-domain.example` to the Auth0 application’s allowed callback, logout, and web-origin URLs.
4. From the repository root, deploy with:

```sh
docker compose --env-file deploy/.env -f deploy/compose.yaml up -d --build
```

The SQLite database lives in the `deploy_cadence-data` Docker volume at `/data/cadence.db` inside the container. Keep the application at one replica because SQLite coordinates access to one local database file. For DigitalOcean Block Storage, mount the volume on the host, change the Compose mapping to `/mnt/cadence-data:/data`, and give UID 10001 write access to that directory. Include the data volume in the backup plan. Check the service with `https://your-domain.example/api/health`.

The six selection games contain 4–5 questions each. Five representative questions drive placement. Difficulty changes the question sequence; Soundprint also changes visual contrast. Speaking difficulty switches words, sentences, and paragraphs. Correct and incorrect answers both offer explanations and allow immediate continuation.

## Audio

Every Listen button plays a pre-generated ElevenLabs clip from `frontend/public/audio/`. The browser's SpeechSynthesis voice is only a fallback when a clip is missing. The app never calls ElevenLabs to play audio, so the API key never reaches the browser and the demo works offline.

- **Word stress** (Stress Steps, Soundprint, Stress Twins): exact pronunciations with stress marks, sent as SSML phoneme tags to `eleven_flash_v2` (the only model that supports them).
- **Sentence stress** (Stress Detective): `eleven_v3` with the stressed word in CAPS. The generator makes several takes and keeps the one where that word stands out most (loudness, length and pitch). Stress Detective hides the bold word until you answer, so you have to hear it.
- **Timings**: the generator stores word and syllable timings, which drive the word highlighting while a clip plays, the Rhythm Match beats, and the real Soundprint waveform (bars = loudness, line = pitch).
- **Shape Your Sound**: *Try demo recording* returns illustrative scores. *Use my microphone* converts the take to WAV in the browser and sends it to `POST /api/analyze-recording`, which transcribes it with ElevenLabs speech-to-text and compares word timing, loudness and pitch against the reference clip.

To add or change a clip, edit `scripts/clips.json` (its `notes` explain the markup) and run from the repository root:

```sh
uv run scripts/generate_audio.py              # only new or changed clips
uv run scripts/generate_audio.py detective-she  # regenerate one clip
```

Commit the generated `.wav` files and `frontend/src/generated/audio.json`.

API routes: public `GET /api/health`; authenticated `GET`/`DELETE /api/progress`; and authenticated `POST /api/placement-test`, `/api/session`, `/api/studio-session`, `/api/analyze-speech` (demo scores), and `/api/analyze-recording` (real scores). Lesson content remains bundled with the frontend, while user progress is persisted in SQLite. Auth0 access tokens are validated on every account and practice endpoint; see [Auth0 setup](frontend/AUTH0.md).

Responsive layouts, visible keyboard focus, semantic buttons, disabled answer states, live feedback, reduced-motion support, and labeled audio controls are included.
