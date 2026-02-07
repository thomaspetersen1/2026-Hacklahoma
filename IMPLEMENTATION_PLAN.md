# Sorcerer Troop — Implementation Plan

Rough roadmap with TODOs for hackathon build.

---

## Phase 1: Project Setup & Infrastructure

### [ ] 1.1 Initialize Services
- [ ] Create `/client` with Vite + React + TypeScript
- [ ] Create `/server` with Express + TypeScript
- [ ] Create `/ml` with Python + FastAPI
- [ ] Install all dependencies per `PROJECT_SETUP.md`

### [ ] 1.2 Docker Setup
- [ ] Write Dockerfile for each service
- [ ] Test `docker compose up`
- [ ] Verify hot reload with `docker compose watch`

### [ ] 1.3 Environment Variables
- [ ] Get Supabase keys (project URL, anon key, service role key)
- [ ] Get Google Cloud API key (enable Places, Routes, Maps JS APIs)
- [ ] Get OpenWeather API key
- [ ] Create `.env` files for server and client
- [ ] Add `.env` to `.gitignore`

---

## Phase 2: Backend Core (Server)

### [ ] 2.1 Google Places Integration
- [ ] `/server/src/services/places.ts` — wrapper for Places API `searchNearby`
- [ ] Test: fetch cafes near a location
- [ ] Handle errors, rate limits

### [ ] 2.2 Google Routes Integration
- [ ] `/server/src/services/routes.ts` — wrapper for Routes API
- [ ] Calculate walking/driving/transit time between two points
- [ ] Fallback: distance heuristic if API quota is tight

### [ ] 2.3 Vibe Mapping
- [ ] `/server/src/services/vibes.ts` — map vibe tags to Google place types
  - `chill` → `cafe, book_store, library`
  - `social` → `bar, restaurant, bowling_alley`
  - `active` → `gym, park, sports_complex`
  - `creative` → `art_gallery, museum, art_supply_store`
  - `outdoors` → `park, nature_reserve, viewpoint`

### [ ] 2.4 Time Fit Calculation
- [ ] `/server/src/services/fit.ts` — calculate if a place fits in the time window
  - Travel time (to place)
  - Dwell time estimate (by place type — lookup table)
  - Travel time (back)
  - Buffer (5 min)
  - Filter: `total_time <= windowMinutes`

### [ ] 2.5 Scoring Engine
- [ ] `/server/src/services/scoring.ts` — score and rank places
  - Vibe match (30%)
  - Time efficiency (25%)
  - Distance (20%)
  - Novelty (15%)
  - Rating (10%)
- [ ] Return top 5, sorted by score

### [ ] 2.6 Suggest Endpoint
- [ ] `/server/src/routes/suggest.ts` — `POST /api/suggest`
  - Request: `{ windowMinutes, origin, travelMode, vibes }`
  - Response: ranked suggestions with time breakdown
- [ ] Wire into Express app
- [ ] Test with Postman/Thunder Client

### [ ] 2.7 Weather Integration
- [ ] `/server/src/services/weather.ts` — OpenWeather API wrapper
- [ ] Boost outdoor suggestions if sunny/warm
- [ ] Filter outdoor suggestions if raining/cold
- [ ] Add weather context to suggestion cards

### [ ] 2.8 Feedback Endpoint
- [ ] `/server/src/routes/feedback.ts` — `POST /api/feedback`
- [ ] Save like/dislike to database
- [ ] Update user preference weights (future: call ML service)

---

## Phase 3: Frontend Core (Client)

### [ ] 3.1 Project Setup
- [ ] Vite + React + TypeScript scaffold
- [ ] Tailwind CSS setup
- [ ] shadcn/ui init (optional but nice)
- [ ] React Router setup

### [ ] 3.2 Home Screen
- [ ] Big "I'm Free Now" button
- [ ] Clean, bold design

### [ ] 3.3 Time + Vibe Selector
- [ ] Time picker: 15/30/45/60/90 min + custom input
- [ ] Vibe selector: multi-select tiles (Chill, Social, Active, Creative, Outdoors)
- [ ] Transport mode: Walk / Drive / Transit
- [ ] "Get Suggestions" button

### [ ] 3.4 Suggestion Cards
- [ ] Card component: photo, name, category, travel time, "fits in X min"
- [ ] Scrollable list (3-5 cards)
- [ ] Tap card → detail view

### [ ] 3.5 Place Detail View
- [ ] Show full photo, address, open hours
- [ ] Time breakdown: "6 min walk + 20 min there + 6 min back = 32 min"
- [ ] Why it matched: "Chill vibe, fits perfectly"
- [ ] "Navigate" button → open Google Maps with directions

### [ ] 3.6 Loading States
- [ ] Spinner while fetching suggestions
- [ ] Skeleton cards before results load

### [ ] 3.7 Error States
- [ ] No suggestions found → show helpful message
- [ ] Location permission denied → prompt user
- [ ] API error → retry button

---

## Phase 4: ML Service (Python)

### [ ] 4.1 FastAPI Setup
- [ ] Basic FastAPI app with `/health` endpoint
- [ ] Test locally: `uvicorn main:app --reload`

### [ ] 4.2 Preference Model (Simple)
- [ ] `/ml/models/preference.py` — predict user preferences based on feedback
- [ ] For MVP: just adjust weights based on like/dislike
- [ ] Future: train a real model on activity history

### [ ] 4.3 Scoring Enhancement (Optional)
- [ ] `/ml/models/scoring.py` — ML-enhanced scoring
- [ ] Use user history to personalize ranking
- [ ] Server calls this endpoint for logged-in users

---

## Phase 5: Database (Supabase)

### [ ] 5.1 Schema Design
- [ ] `users` table (id, email, created_at)
- [ ] `preferences` table (user_id, category, weight)
- [ ] `activity_history` table (user_id, place_id, gap_duration, feedback, timestamp)
- [ ] `saved_places` table (user_id, place_id, note)

### [ ] 5.2 Supabase Client Setup
- [ ] `/server/src/lib/supabase.ts` — initialize client
- [ ] Test connection

### [ ] 5.3 Auth (Optional for MVP)
- [ ] Google OAuth setup in Supabase
- [ ] Auth middleware in Express
- [ ] Protected routes for feedback, saved places

---

## Phase 6: Polish & Demo Prep

### [ ] 6.1 Safety Mode
- [ ] Night toggle: filter isolated parks/trails after dark
- [ ] Prefer well-rated, public places at night
- [ ] Safety badge on cards

### [ ] 6.2 Stats Screen (Optional)
- [ ] "You've reclaimed 3.5 hours this week"
- [ ] "6 new places visited"
- [ ] "4 errands knocked out"

### [ ] 6.3 Onboarding Flow
- [ ] Welcome screen: "Turn dead time into micro-adventures"
- [ ] Location permission request
- [ ] Quick preference picker (vibes, transport mode)
- [ ] Skip to first suggestions immediately

### [ ] 6.4 Mobile Responsive
- [ ] Test on mobile viewport
- [ ] Touch-friendly buttons, tap targets
- [ ] Bottom sheet for suggestion cards (mobile pattern)

### [ ] 6.5 Demo Script
- [ ] Write 60-second pitch
- [ ] Test the full loop end-to-end
- [ ] Prepare backup data if APIs fail during demo
- [ ] Screenshot key screens for slides

### [ ] 6.6 Edge Cases
- [ ] No suggestions found → helpful message
- [ ] Sparse area (nothing nearby) → expand radius
- [ ] All places filtered out (nothing fits) → suggest shorter window
- [ ] API rate limit hit → graceful fallback

---

## Phase 7: Deployment

### [ ] 7.1 Client Deploy
- [ ] Vercel or Netlify
- [ ] Set env vars
- [ ] Test production build

### [ ] 7.2 Server Deploy
- [ ] Railway, Render, or Fly.io
- [ ] Set env vars
- [ ] Test endpoints

### [ ] 7.3 ML Deploy (Optional)
- [ ] Modal, Fly.io, or keep local for MVP

---

## Phase 8: Testing

### [ ] 8.1 Manual Testing
- [ ] Test "I'm Free Now" flow end-to-end
- [ ] Test each vibe filter
- [ ] Test each transport mode
- [ ] Test time windows (15 min, 90 min)
- [ ] Test feedback loop

### [ ] 8.2 API Testing
- [ ] Test `/api/suggest` with different inputs
- [ ] Test error handling
- [ ] Test rate limiting

---

## TODO Priority (What to Build First)

**Critical Path (Must Have for Demo):**
1. Server: `/api/suggest` endpoint (Places + Routes + Scoring)
2. Client: "I'm Free Now" button → time/vibe selector → suggestion cards
3. Client: Suggestion card → detail view → Navigate button
4. Weather integration (nice visual boost)
5. Demo prep (script, backup data)

**Nice to Have (If Time Allows):**
6. Stats screen ("3.5 hrs reclaimed")
7. Safety mode toggle
8. Onboarding flow
9. Feedback endpoint + preference updates
10. ML service (basic preference model)

**Post-Hackathon:**
11. Calendar sync + gap detection
12. Errands layer
13. Group scheduling
14. Business dashboard

---

## Team Split (Suggested)

| Person | Focus |
|---|---|
| Backend Lead | Server setup, `/api/suggest`, Google APIs, scoring |
| Frontend Lead | Client setup, UI components, suggestion cards, detail view |
| Full-Stack | Supabase, auth, database schema, feedback endpoint |
| ML/Data | Python service, preference model, scoring enhancements |

---

## Blockers to Resolve Early

- [ ] Do we need user accounts for MVP or can we ship accountless?
- [ ] Do we show a map view or just cards?
- [ ] Do we deploy all 3 services or just client + server for demo?
- [ ] What's our backup plan if Google APIs fail during demo?
- [ ] Which city/location do we demo? (seed data for that area?)

---

## Success Criteria

**Demo works if:**
- ✅ User taps "I'm Free Now"
- ✅ Selects 45 min + Chill vibe
- ✅ Gets 3-5 relevant suggestions in <2 seconds
- ✅ Every suggestion actually fits in 45 minutes
- ✅ Tap a card → see details → tap Navigate → Google Maps opens

**Judges are impressed if:**
- ✅ Live location works (not hardcoded)
- ✅ Vibe filtering is smart (chill ≠ gym)
- ✅ Weather context shows up ("72° and sunny")
- ✅ UI is clean and fast
- ✅ Demo runs smoothly without bugs

---

## Git Workflow

- [ ] Create feature branches for each major component
- [ ] PR to `main` when ready
- [ ] Keep `main` deployable at all times
- [ ] Tag releases: `v0.1-mvp`, `v0.2-demo`

---

## Notes

- Keep it simple. Hackathon is about proving the concept, not production-ready code.
- Prioritize the demo loop. Everything else is secondary.
- Test on real locations early (your city, campus area).
- Have backup hardcoded data in case APIs fail during demo.
- Document what you build as you go (future you will thank you).
