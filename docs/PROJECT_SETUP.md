# Sorcerer Troop — Project Setup

Three services, one repo.

```
/web             → Next.js 16 + React 19 + Tailwind 4 (frontend only, no API routes)
/server          → Node.js + Express + TypeScript (API + all backend logic)
/ml              → Python + FastAPI (preference scoring engine)
docker-compose.yml
```

---

## 1) Frontend — /web (Next.js)

Already set up. No backend logic here — just pages and components.
Calls the Express server at `http://localhost:3001` for all API requests.

```
/web
  /app
    page.tsx              ← Landing page
    layout.tsx            ← Root layout (fonts, metadata)
    globals.css           ← Styles
    /free
      page.tsx            ← "I'm Free Now" flow (core UI)
  /components
    SuggestionCard.tsx    ← Suggestion card component
  /lib
    types.ts              ← Frontend-only type definitions
```

Env var in `/web`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 2) Backend — /server (Express + TypeScript)

Already scaffolded. All backend logic lives here.

```bash
cd server && npm run dev
# Runs on http://localhost:3001
```

```
/server/src
  /config
    index.ts              ← Centralized env config
  /types
    index.ts              ← All TypeScript types
  /services
    vibes.ts              ← Vibe → place type mapping
    fit.ts                ← Time fit calculator
    scoring.ts            ← Ranking (local heuristic + ML call)
    places.ts             ← Google Places API wrapper
    routes.ts             ← Google Routes API wrapper
    weather.ts            ← OpenWeather wrapper
  /routes
    health.ts             ← GET /api/health
    suggest.ts            ← POST /api/suggest (core product)
    feedback.ts           ← POST /api/feedback
  index.ts                ← Express app entry
```

Server `.env`:
```bash
PORT=3001
GOOGLE_MAPS_API_KEY=your_key
OPENWEATHER_API_KEY=your_key
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key
ML_SERVICE_URL=http://localhost:8000
CORS_ORIGIN=http://localhost:3000
```

---

## 3) ML Service — /ml (Python + FastAPI)

Tommy's preference scoring model.

```bash
mkdir ml && cd ml
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install fastapi uvicorn scikit-learn pandas numpy pydantic
pip freeze > requirements.txt
```

```
/ml
  main.py               ← FastAPI entry
  /models
    preference.py       ← User preference predictor
    scoring.py          ← ML-enhanced scoring
  /schemas
    types.py            ← Pydantic models
  requirements.txt
  Dockerfile
```

Run locally:
```bash
uvicorn main:app --reload --port 8000
```

---

## 4) How the Services Talk

```
Web (3000)  →  Server (3001)  →  Google Places API
                               →  Google Routes API
                               →  OpenWeather API
                               →  Supabase
                               →  ML Service (8000)
```

- **Web → Server**: Frontend fetches from `http://localhost:3001/api/*`
- **Server → ML**: Server calls ML service for preference-based scoring
- **Server → External APIs**: All API keys stay server-side (protected)
- **Web has NO backend logic**: No API routes, no direct API calls to Google/OpenWeather

---

## 5) Docker Compose

```yaml
services:
  web:
    build: ./web
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3001
    develop:
      watch:
        - action: sync
          path: ./web/app
          target: /app/app

  server:
    build: ./server
    ports:
      - "3001:3001"
    env_file: ./server/.env
    develop:
      watch:
        - action: sync+restart
          path: ./server/src
          target: /app/src

  ml:
    build: ./ml
    ports:
      - "8000:8000"
    develop:
      watch:
        - action: sync+restart
          path: ./ml
          target: /app
```

Run with: `docker compose watch`

---

## 6) Quick Start (No Docker)

Three terminals:

```bash
# Terminal 1 — Frontend
cd web && npm run dev

# Terminal 2 — Backend
cd server && npm run dev

# Terminal 3 — ML
cd ml && source venv/bin/activate && uvicorn main:app --reload --port 8000
```

---

## 7) API Keys to Get

| Service | URL | What You Need |
|---|---|---|
| Google Cloud | console.cloud.google.com | Enable Places + Routes APIs → get API key |
| OpenWeather | openweathermap.org/api | Sign up → API key |
| Supabase | supabase.com | Project URL + anon key + service role key |

Total cost: $0 (all free tier).
