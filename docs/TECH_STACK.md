# Sorcerer Troop — Tech Stack

**Three services. TypeScript + Python. Fast to build, durable for production.**

---

## Architecture

```
/web     → Next.js 16 + React 19 + Tailwind 4 (frontend only)
/server  → Express + TypeScript (API + all backend logic)
/ml      → Python + FastAPI (preference scoring model)
```

The frontend (`/web`) calls the Express server (`/server`).
The server calls Google APIs, OpenWeather, and the ML service.

---

## /web — Frontend
- **Next.js 16** — App Router, pages, components
- **React 19** — UI rendering
- **TypeScript 5** — Type safety
- **Tailwind CSS 4** — Styling
- **Bebas Neue + IBM Plex Sans** — Fonts

No API routes in /web. No backend logic in /web. Frontend only.

---

## /server — Backend API
- **Express 5** — HTTP server + routing
- **TypeScript 5** — Type safety
- **dotenv** — Environment config
- **cors** — Cross-origin requests from /web
- **@googlemaps/google-maps-services-js** — Google APIs
- **@supabase/supabase-js** — Database (future)

Handles:
- `POST /api/suggest` — core product endpoint
- `POST /api/feedback` — user feedback collection
- `GET /api/health` — health check

---

## /ml — ML Service
- **Python 3.11+**
- **FastAPI** — HTTP server
- **scikit-learn** — Preference prediction model
- **pandas / numpy** — Data processing
- **uvicorn** — ASGI server

Handles:
- `POST /score` — score candidates based on user preferences

---

## External APIs (All Free Tier)
- **Google Places API (New)** — Nearby search, place details
- **Google Routes API** — Travel time (walk/drive/transit)
- **OpenWeather API** — Weather conditions
- **Supabase** — Database + auth (future)

---

## Hosting
- **Vercel** — /web frontend
- **Railway / Render** — /server backend
- **Docker Compose** — local dev (all 3 services)

---

## What We're NOT Using
- ❌ Next.js API routes (backend lives in /server)
- ❌ Prisma (Supabase client is simpler)
- ❌ Redux/Zustand (React hooks + URL state)
- ❌ Axios (native fetch)
