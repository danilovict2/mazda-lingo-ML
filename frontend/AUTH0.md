# Auth0 setup

React uses Auth0 Universal Login with Authorization Code + PKCE. FastAPI independently verifies every practice request using Auth0's public signing keys, RS256, issuer, audience, and expiry. Tokens remain in SDK memory. No client secret belongs in the frontend.

1. In Auth0, create a **Single Page Application**. Set Allowed Callback URLs, Allowed Logout URLs, and Allowed Web Origins to `http://localhost:5173`. Add `http://localhost:4173` for Vite preview if needed; add your HTTPS application origin for deployment.
2. Create an Auth0 **API**, with identifier `https://ml-api` (or your chosen identifier) and signing algorithm **RS256**.
3. Copy `frontend/.env.example` to `frontend/.env.local`. Fill in the tenant hostname, SPA client ID, and API identifier. The domain is a hostname such as `dev-example.us.auth0.com`, without `https://`.
4. Copy the root `.env.example` to root `.env`. Use the same domain and audience. From the repository root run `uv sync`, then `uv run uvicorn main:app --reload --env-file .env`.
5. From `frontend`, run `bun install` and `bun run dev`. Open the landing page and log in. Selecting a practice link while signed out prompts login and returns you to that route.

Production must route `/api` to FastAPI or set `VITE_API_URL` at build time. For a separate API origin, set backend `CORS_ORIGINS` to a comma-separated list of exact frontend origins. Frontend configuration is public; never add a client secret. Restart servers after changing environment files.

`GET /api/health` is public. `GET /api/me` returns the verified Auth0 subject. All three practice POST endpoints require a bearer access token; missing/invalid/expired tokens return 401. Missing backend configuration or unavailable signing keys return 503. The frontend displays a setup message when required configuration is absent.

Progress still lives in browser localStorage, now keyed by Auth0 subject. Old shared demo progress is not imported into accounts. Authentication does not add a database or cross-device synchronization, and scoring remains simulated.

Verification: `bun run build` in frontend; `uv run --with httpx python -m unittest discover -s tests` at repository root. Live login requires your Auth0 tenant configuration.

References: [React integration](https://auth0.com/docs/quickstart/spa/react), [API token validation](https://auth0.com/docs/quickstart/backend/django).
