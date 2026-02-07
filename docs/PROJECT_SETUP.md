# Sorcerer Troop — Project Setup

Three services, one repo.

```
/client          → Vite + React + TypeScript (frontend)
/server          → Node.js + Express + TypeScript (API)
/ml              → Python + FastAPI (preference engine)
docker-compose.yml
```

---

## 1) Client — Vite + React + TypeScript

```bash
npm create vite@latest client -- --template react-ts
cd client
npm install
npm install react-router-dom lucide-react date-fns react-hook-form zod @hookform/resolvers
npm install -D tailwindcss @tailwindcss/vite
```

Then add Tailwind to `vite.config.ts`:
```ts
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
})
```

Add to top of `src/index.css`:
```css
@import "tailwindcss";
```

shadcn/ui (optional, after init):
```bash
npx shadcn@latest init
```

---

## 2) Server — Express + TypeScript

```bash
mkdir server && cd server
npm init -y
npm install express cors dotenv @supabase/supabase-js @googlemaps/google-maps-services-js
npm install -D typescript ts-node nodemon @types/express @types/cors @types/node
npx tsc --init
```

Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true
  }
}
```

Create `server/src/index.ts`:
```ts
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
```

Add to `server/package.json` scripts:
```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

Server folder structure:
```
/server/src
  /routes
    suggest.ts        ← POST /api/suggest
    feedback.ts       ← POST /api/feedback
  /services
    places.ts         ← Google Places API wrapper
    routes.ts         ← Google Routes API wrapper
    weather.ts        ← OpenWeather wrapper
    scoring.ts        ← Matching engine
    vibes.ts          ← Vibe → place type mapping
    fit.ts            ← Time fit calculation
  /middleware
    auth.ts           ← Supabase auth middleware
  /lib
    supabase.ts       ← Supabase client
  /types
    index.ts          ← Shared types
  index.ts            ← App entry
```

---

## 3) ML Service — Python + FastAPI

```bash
mkdir ml && cd ml
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install fastapi uvicorn scikit-learn pandas numpy pydantic
pip freeze > requirements.txt
```

Create `ml/main.py`:
```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

ML folder structure:
```
/ml
  main.py               ← FastAPI entry
  /models
    preference.py       ← User preference predictor
    scoring.py          ← ML-enhanced scoring model
  /data
    training.py         ← Training pipeline
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

## 4) Environment Variables

Create `.env` in `/server`:
```bash
PORT=3001

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Google Cloud
GOOGLE_MAPS_API_KEY=AIzaxxx...

# OpenWeather
OPENWEATHER_API_KEY=xxx...

# ML Service
ML_SERVICE_URL=http://localhost:8000
```

Create `.env` in `/client`:
```bash
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
VITE_GOOGLE_MAPS_API_KEY=AIzaxxx...
```

Add `.env` to `.gitignore`.

---

## 5) Docker Compose (When Ready)

```yaml
# docker-compose.yml
services:
  client:
    build: ./client
    ports:
      - "5173:5173"
    develop:
      watch:
        - action: sync
          path: ./client/src
          target: /app/src

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

## 6) How the Services Talk

```
Client (5173)  →  Server (3001)  →  Google APIs
                                 →  OpenWeather
                                 →  Supabase
                                 →  ML Service (8000)
```

- **Client → Server**: All requests go through `/api/*`, proxied by Vite in dev
- **Server → ML**: Server calls ML service for preference predictions when needed
- **Server → External APIs**: All third-party calls stay server-side (keys protected)
- **Client → Supabase**: Direct connection for auth only (anon key is safe for this)

---

## 7) Quick Start (No Docker)

Three terminals:

```bash
# Terminal 1 — Client
cd client && npm run dev

# Terminal 2 — Server
cd server && npm run dev

# Terminal 3 — ML
cd ml && source venv/bin/activate && uvicorn main:app --reload --port 8000
```

---

## 8) API Keys to Get

| Service | URL | What You Need |
|---|---|---|
| Supabase | supabase.com | Project URL + anon key + service role key |
| Google Cloud | console.cloud.google.com | Enable Places, Routes, Maps JS APIs → get API key |
| OpenWeather | openweathermap.org/api | Sign up → API key |

Total cost: $0 (all free tier).
