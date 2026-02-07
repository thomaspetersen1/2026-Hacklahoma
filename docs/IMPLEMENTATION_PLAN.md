# Sorcerer Troop — Implementation Plan

Hackathon build roadmap. Updated to reflect current state.

---

## Architecture (locked in)

Three services, one repo:

```
/web     → Next.js (frontend — teammate built in Cursor)
/server  → Express + TypeScript (all backend logic + API endpoints)
/ml      → Python + FastAPI (Tommy's preference scoring model)
```

Web calls Server. Server calls Google APIs + ML service.
No backend logic in /web. All API keys stay in /server.

---

## Current State

### What's Done
- [x] `/web` — Next.js frontend (landing page, "I'm Free Now" flow, SuggestionCard, mock data)
- [x] `/server` — Express + TypeScript fully scaffolded:
  - [x] `types/index.ts` — full type system
  - [x] `services/vibes.ts` — vibe → place type mapping + time-of-day boosts
  - [x] `services/fit.ts` — dwell estimates, time budgets, search radius
  - [x] `services/scoring.ts` — local heuristic + ML fallback + diversity + reason codes
  - [x] `services/places.ts` — Google Places searchNearby + caching + normalization
  - [x] `services/routes.ts` — Google Routes API wrapper + caching (no API key yet)
  - [x] `services/weather.ts` — OpenWeather wrapper + caching (no API key yet)
  - [x] `routes/suggest.ts` — full 10-step pipeline
  - [x] `routes/feedback.ts` — in-memory store
  - [x] `routes/health.ts` — service status
  - [x] `config/index.ts` — env vars, graceful degradation
- [x] `.env` with Google Maps API key set
- [ ] `/ml` — scaffold only (requirements.txt + venv)

### What's NOT Done
- [ ] Server has never been started / compiled
- [ ] `/web` still calls its own inline API routes, not `/server`
- [ ] No database (feedback is in-memory only)
- [ ] ML service has no scoring endpoint
- [ ] No Routes API key (falls back to distance heuristic)
- [ ] No OpenWeather key (skips weather gracefully)

---

## Phase 1: Boot the Server (NOW)

### [ ] 1.1 Compile and start `/server`
- [ ] Run `npm run dev` in `/server`
- [ ] Fix any TypeScript errors
- [ ] Confirm `GET /api/health` returns OK

### [ ] 1.2 Test the core pipeline with real data
- [ ] `POST /api/suggest` with real lat/lng + Google Places API key
- [ ] Verify: places come back, scoring works, time-fit filters correctly
- [ ] Verify: graceful fallback when Routes/Weather APIs unavailable

### [ ] 1.3 Add mock fallback in `/server`
- [ ] If Google Places API fails or key is missing, return mock suggestions
- [ ] Demo should never show an error screen

---

## Phase 2: Connect Frontend ↔ Server

### [ ] 2.1 Wire `/web` to call `/server`
- [ ] `/web` calls `http://localhost:3001/api/suggest` instead of its own API routes
- [ ] Configure CORS / proxy so requests work in dev
- [ ] Test end-to-end: UI → server → Google → cards

### [ ] 2.2 Align types
- [ ] Server's `SuggestResponse` shape matches what `/web` components expect
- [ ] Fix any mismatches between server types and frontend types

---

## Phase 3: Feedback + Instrumentation

### [ ] 3.1 Feedback loop
- [ ] `/web` sends like/dislike/save to `POST /api/feedback`
- [ ] Server stores feedback (in-memory for now)
- [ ] Log: what was suggested, what was clicked, what was dismissed

### [ ] 3.2 Outcome instrumentation
- [ ] Track: window length, vibe, travel mode, time-of-day, place IDs returned
- [ ] This is the data flywheel — what people do with X minutes

---

## Phase 4: ML Service (Tommy)

### [ ] 4.1 FastAPI setup
- [ ] Basic app with `/health` and `POST /score` endpoints
- [ ] `/score` takes candidates + vibes + windowMinutes, returns scores

### [ ] 4.2 Preference model
- [ ] Simple weight adjustment based on feedback history
- [ ] Server calls ML service, falls back to local heuristic if down

---

## Phase 5: Enhancements (as time allows)

### [ ] 5.1 Weather integration
- [ ] Get OpenWeather API key
- [ ] Outdoor boost/filter based on conditions
- [ ] Show weather context on cards ("72° and sunny")

### [ ] 5.2 Routes API
- [ ] Enable Routes API in Google Cloud Console
- [ ] Real travel times replace distance heuristic

### [ ] 5.3 Safety mode
- [ ] Night filter: avoid isolated parks/trails after dark
- [ ] Prefer well-rated, public, open-now places at night

### [ ] 5.4 Database (Supabase)
- [ ] Schema: users, preferences, activity_history, saved_places
- [ ] Persist feedback across sessions
- [ ] Optional: Google OAuth for accounts

---

## Phase 6: Polish & Demo Prep

### [ ] 6.1 Onboarding flow
- [ ] Welcome screen, location permission, quick preferences

### [ ] 6.2 Edge cases
- [ ] No suggestions found → helpful message
- [ ] Sparse area → expand radius
- [ ] API rate limit → graceful fallback with mock data

### [ ] 6.3 Demo script
- [ ] 60-second pitch rehearsed
- [ ] Backup hardcoded data if APIs fail during demo
- [ ] Test full loop end-to-end on real location

---

## Phase 7: Deployment

### [ ] 7.1 Frontend → Vercel
### [ ] 7.2 Server → Railway / Render / Fly.io
### [ ] 7.3 ML → Modal / Fly.io (optional, can run local for demo)

---

## Success Criteria

**Demo works if:**
- User taps "I'm Free Now"
- Selects 45 min + Chill vibe
- Gets 3-5 relevant suggestions in <2 seconds
- Every suggestion actually fits in 45 minutes
- Tap a card → see details → tap Navigate → Google Maps opens

**Judges are impressed if:**
- Live location works (not hardcoded)
- Vibe filtering is smart (chill ≠ gym)
- Weather context shows up
- UI is clean and fast
- "The shovel" pitch lands: routing engine + outcome dataset

---

## Notes

- Keep it simple. Hackathon = prove the concept.
- The app is the reference client. The routing engine is the product.
- Have backup data in case APIs fail during demo.
- Test on real locations early.
