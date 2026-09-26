# Lingo — Master Speech Emphasis

A tool for learning how speech emphasis disambiguates meaning. Players answer choice questions and record reading exercises to develop intuition for stress patterns in English.

## Project Structure

```
.
├── contracts/              # Shared contracts & fixtures
│   ├── puzzle.schema.json  # Question/content structure (P3, P4)
│   ├── api.examples.json   # API contract (P2, P4)
│   └── fixtures.json       # Fixture questions for dev (all)
├── main.py                 # Python backend entry point (P1, P2)
├── types/                  # TypeScript types (P4)
├── pages/                  # Nuxt pages (P4)
├── composables/            # Reusable logic (P4)
├── components/             # Vue components (P4)
├── assets/                 # CSS, images (P4)
└── package.json            # Frontend dependencies
```

## Setup

### Prerequisites
- Node 18+ (frontend)
- Python 3.13+ (backend)
- uv (Python package manager)

### Frontend Development

```bash
# Install dependencies
npm install

# Start dev server on http://localhost:3000
npm run dev

# Type check
npm run typecheck

# Build for production
npm run build
```

### Backend Setup

See `main.py` and `pyproject.toml` for Python service setup.

## Contracts

All development is against locked contracts:

- **`contracts/puzzle.schema.json`**: Schema for choice and speaking questions (P3 fills this with real content)
- **`contracts/api.examples.json`**: API contract between frontend and analyzer backend
  - `GET /api/health` — Service status and model availability
  - `POST /api/analyze` — Audio analysis endpoint
- **`contracts/fixtures.json`**: 10 fixture choice questions (2 per question type, 5 per track)

Use fixtures during development; P3 provides real content.

## Development Workflow

### Phase 1: Bootstrap (0:00–1:00)
- [x] Repo scaffold
- [x] Contracts (schema + API examples)
- [x] Fixture questions
- [x] Frontend shell + layout

### Phase 2: Parallel Build (1:00–3:00)
- **P1**: Audio analysis pipeline (prominence extraction, scoring rule calibration)
- **P2**: Mock API endpoint, health check, deploy to Render
- **P3**: Stress helper, question authoring, reference audio recording
- **P4**: Question display component, audio player, game loop scaffold

### Phase 3: Integration (3:00–6:00)
- P2 swaps mock analyzer for P1's real pipeline
- P4 loads P3's real content
- All four test together on fresh recordings

### Phase 4: Polish & Release (6:00–12:00)
- QA and edge case testing
- Results/progress tracking
- Documentation & demo

## API Examples

See `contracts/api.examples.json` for full request/response shapes.

### Health Check
```
GET /api/health
→ { status: "ready" | "loading", models_loaded: boolean, message: string }
```

### Analyze
```
POST /api/analyze
Content-Type: multipart/form-data
Fields: audio (WAV), puzzle_id

→ {
  status: "ok" | "uncertain" | "invalid",
  puzzle_id: string,
  confidence: number (0–1),
  message: string,
  per_word_scores: Array<{ word, position, prominence_score, expected_emphasis }> | null
}
```

## Key Decisions

- **Frontend**: Nuxt.js 3 with TypeScript for type safety across frontend/API
- **Styling**: Tailwind CSS for rapid iteration
- **State**: localStorage for progress tracking (first attempts preserved per track)
- **Deployment**: Vercel (frontend), Render (backend)
- **Fixtures**: Locked in contracts; real content swapped in at integration phase

## Limitations

- Audio analysis requires Python with WhisperX and Wavelet Prosody Toolkit
- Speaking challenges upload to backend; 5 MB / 10s limits enforced
- Mode (scored vs. practice) chosen after hour-6 verification on fresh recordings
