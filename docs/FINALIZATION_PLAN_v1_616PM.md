# SideQuest — Project Finalization Plan v1.0 (6:16 PM, Feb 7)

## Context

Demo is tomorrow. Server pipeline works (tested with real Norman coords). Frontend exists. Tommy already built the ML service (Flask + Random Forest, trained model at `ml/models/trained/random_forest.pkl`). But nothing is wired together — the three services don't speak the same language yet. This plan fixes that and adds the Norman data layer.

---

## The 3 Problems

1. **Server output doesn't match frontend expectations** — frontend will crash rendering suggestions
2. **Server calls ML at wrong URL/format** — server calls `POST :8000/score`, ML exposes `POST :5000/api/recommend` with different request/response shapes
3. **No fallback data** — if Google API fails during demo, we get nothing

---

## Build Order (~2.5 hours)

### Step 1: Fix Server → Frontend Response Shape (20 min)

The SuggestionCard component (`web/components/SuggestionCard.tsx`) accesses fields the server doesn't send. Without this fix, the frontend renders blank/broken cards.

**Files to modify:**

**`server/src/types/index.ts`** — Add missing fields to `Suggestion` interface:
- `category: string` (frontend reads `suggestion.category` on line 17)
- `reason: string[]` (frontend reads `suggestion.reason` on line 44)
- `bufferMinutes: number` (frontend reads `suggestion.bufferMinutes` in `timeBreakdown()` on line 6)
- `mapsUrl: string` (frontend reads `suggestion.mapsUrl` on line 60)

**`server/src/routes/suggest.ts`** — In the suggestion-building block (~line 147), add:
- `category: place.types[0] || 'place'`
- `reason: reasonCodes` (alias)
- `bufferMinutes: timeBudget.buffer`
- `mapsUrl: https://www.google.com/maps/dir/?api=1&destination={lat},{lng}&travelmode={travelMode}`

**Verify:** `curl -X POST localhost:3001/api/suggest` — response should include `category`, `reason`, `bufferMinutes`, `mapsUrl`.

---

### Step 2: Wire ML Service to Server (30 min)

The ML service exists but speaks a different language than the server expects.

| | Server calls | ML exposes |
|---|---|---|
| URL | `http://localhost:8000/score` | `http://localhost:5000/api/recommend` |
| Input | `{candidates, vibes, windowMinutes}` | `{activities, userPreferences}` |
| Output | `{scores: {placeId: 0.85}}` | `{recommendations: [{...activity, ml_score: 0.85}]}` |

**Files to modify:**

**`ml/api/routes.py`** — Add a `/score` bridge endpoint that:
- Accepts the server's format: `{candidates: [{id, types, rating, priceLevel}], vibes, windowMinutes}`
- Maps `vibes` → `userPreferences.preferences` (chill→culture/food, active→outdoor, social→entertainment, etc.)
- Maps `candidate.types[0]` → activity `category` (cafe→food, park→outdoor, bar→entertainment, etc.)
- Calls `recommender.predict_scores()` internally
- Returns `{scores: {placeId: ml_score, ...}}`

**`ml/api/routes.py` line 12** — Fix model path from `'src/models/trained/random_forest.pkl'` to `'models/trained/random_forest.pkl'` (no `src/` prefix exists in the ml directory)

**`ml/app.py` line 16** — Change port from 5000 to 8000 to match docker-compose and server config

**`ml/app.py` line 9** — Register blueprint at root too: `app.register_blueprint(api_bp, url_prefix='/')` so server can call `/score` directly (not `/api/score`)

**Verify:** `curl -X POST localhost:8000/score -H "Content-Type: application/json" -d '{"candidates":[{"id":"test1","types":["cafe"],"rating":4.2,"priceLevel":2}],"vibes":["chill"],"windowMinutes":45}'` → should return `{"scores":{"test1": 0.xx}}`

---

### Step 3: Norman Fallback Data + Third Place Graph (45 min)

If Google API goes down during demo, we need backup data. This is also the seed of the "Third Place Graph" — our own categorization layer.

**New file: `server/src/data/norman-places.json`**
- ~20-30 real Norman places (research from Google Maps)
- Each place has standard Place fields PLUS our enrichment:
  - `vibe_tags: string[]` — our categorization (not Google's types)
  - `micro_duration_fit: number[]` — which time windows this works for [15, 30, 45]
  - `solo_friendly: boolean`
  - `budget_band: "free" | "cheap" | "moderate" | "expensive"`
  - `noise_level: "quiet" | "moderate" | "loud"`
  - `new_grad_energy: boolean`
  - `late_hours: boolean`
- Include: Gray Owl Coffee, Second Wind Coffee, Michelangelo's, The Mont, O'Connell's, Andrews Park, Reaves Park, OU campus spots, Crimson & Cream, The Diner, Bison Witches, etc.

**New file: `server/src/services/fallback.ts`**
- Load JSON at startup
- Export `getFallbackPlaces(types?: string[]): Place[]`

**Modify: `server/src/services/places.ts`**
- Wrap Google API call in try/catch
- On failure, return `getFallbackPlaces(includedTypes)`

**Modify: `server/src/index.ts`**
- Import and call `loadFallbackPlaces()` at startup

**Modify: `server/tsconfig.json`**
- Add `"resolveJsonModule": true` if not already set

**Verify:** Set `GOOGLE_MAPS_API_KEY=""` in .env, restart server, hit suggest endpoint — should return Norman fallback places.

---

### Step 4: End-to-End Test (30 min)

Start all three services:
- Terminal 1: `cd server && npm run dev` (port 3001)
- Terminal 2: `cd ml && python app.py` (port 8000)
- Terminal 3: `cd web && npm run dev` (port 3000)

Test sequence:
1. `localhost:3000` → landing page renders
2. Click "I'm Free Now" → `/free` page with selectors
3. Select 45 min + Chill + Walk
4. Click "Route me" → browser prompts for location (allow)
5. Suggestion cards render with: category badge, name, address, time breakdown, reason tags, Navigate button
6. Click Navigate → Google Maps opens with directions
7. Kill ML service → retry → should still work (local scoring fallback)
8. Kill Google API key → retry → should show Norman fallback places

**Note:** CORS_ORIGIN in server .env is set to `http://localhost:5173` but web runs on port 3000. Need to update to `http://localhost:3000`.

---

### Step 5: Demo Polish (15 min)

- Update the name from "Sorcerer Troop" to "SideQuest" in:
  - `web/app/free/page.tsx` line 117 (header text)
  - `web/app/page.tsx` (landing page)
- Verify fallback JSON has enough variety (at least 3 categories)
- Quick run-through of the full demo flow on a phone viewport

---

## Files Summary

| File | Action |
|---|---|
| `server/src/types/index.ts` | Add `category`, `reason`, `bufferMinutes`, `mapsUrl` to Suggestion |
| `server/src/routes/suggest.ts` | Add those fields to the response builder |
| `ml/api/routes.py` | Add `/score` bridge endpoint, fix model path |
| `ml/app.py` | Change port to 8000, register blueprint at root |
| `server/src/data/norman-places.json` | CREATE: Norman fallback places with enrichment |
| `server/src/services/fallback.ts` | CREATE: fallback place loader |
| `server/src/services/places.ts` | Add fallback on Google API failure |
| `server/src/index.ts` | Load fallback data at startup |
| `server/tsconfig.json` | Add `resolveJsonModule: true` |
| `server/.env` | Update CORS_ORIGIN to `http://localhost:3000` |

---

## Verification

After all steps, the demo loop works:
1. Open `localhost:3000` → click "I'm Free Now"
2. Pick 45 min + Chill + Walk → click "Route me"
3. See 3-5 suggestion cards with category, time breakdown, reason tags
4. Click Navigate → Google Maps opens
5. Works even if Google API or ML service is down (fallbacks)
