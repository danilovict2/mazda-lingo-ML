# Cadence

**Good English. Great rhythm.** A demo-ready pronunciation coach for English word stress, sentence emphasis, and natural rhythm. Seven short games turn listening and speaking practice into a visual, rewarding learning path.

## Run locally

Requires Node.js 20.19+ (or 22.12+), Python 3.13+ Bun, and uv.

```sh
cd frontend
bun i
bun run dev
```

Open http://localhost:5173. The Python API is required for placement, lesson completion, and speech analysis. Auth0 configuration is required; follow [Auth0 setup](frontend/AUTH0.md) before starting.

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

The sidebar’s **Reset demo** clears progress. Practice routes require sign-in; login returns you to your requested route. Rhythm Match unlocks after completing a lesson or an Advanced placement result. The dashboard starts with an illustrative history, 360 XP, and a seven-day streak; new sessions, XP, accuracy, and profile improvements persist in localStorage separately for each Auth0 account. Completing a lesson adds 20 XP per question plus 10 per correct answer; saved studio practice adds 120 XP. Profile growth is intentionally simulated.

## Architecture

```text
frontend/
  src/main.tsx        Routes, reusable UI, learning flow, local state
  src/styles.css     Responsive design system and motion
  src/data.ts        Typed questions, game catalog, demo profile
  src/api/client.ts  Required HTTP requests and response types
main.py            Small FastAPI application; no database
```

React + TypeScript + Vite, React Router, Lucide icons, and plain CSS. The accessible radar is a small SVG component, avoiding a chart dependency. Fonts have system fallbacks. React context and localStorage are the only state/persistence layer. The demo backend lives in root `main.py`.

The six selection games contain 4–5 questions each. Five representative questions drive placement. Difficulty changes the question sequence; Soundprint also changes visual contrast. Speaking difficulty switches words, sentences, and paragraphs. Correct and incorrect answers both offer explanations and allow immediate continuation.

## Audio and future integrations

- Reference playback uses browser SpeechSynthesis; unsupported browsers show a text fallback. Native speech does not guarantee the displayed contrastive stress, so typography is the primary teaching cue.
- Studio simulation needs no permissions. **Use my microphone** optionally records through MediaRecorder and provides local playback. Permission/device failure falls back to simulation. Streams are stopped when recording finishes or the studio unmounts; audio is never uploaded.
- All scoring is explicitly mocked. `POST /api/analyze-speech` is the Python integration boundary: replace its response with a real analysis pipeline and add multipart audio upload in `src/api/client.ts` when needed.
- API routes: `GET /api/health`; `POST /api/placement-test`, `/api/session`, `/api/analyze-speech`. Lesson content remains local. API session results are stateless, with persistence owned by the browser.
- Auth0 authenticates accounts; FastAPI validates RS256 access tokens on practice endpoints. Progress remains local to each browser and account, without a database. See [Auth0 setup](frontend/AUTH0.md).

Responsive layouts, visible keyboard focus, semantic buttons, disabled answer states, live feedback, reduced-motion support, and labeled audio controls are included.
