# Backend Build Plan

Step-by-step plan to build the Express + TypeScript server with Google Maps integration.

---

## Step 1: Scaffold the Server

Create the Express + TypeScript project from scratch.

```
/server
  /src
    index.ts                ← Express app entry
    /routes
      suggest.ts            ← POST /api/suggest
      feedback.ts           ← POST /api/feedback
      health.ts             ← GET /api/health
    /services
      places.ts             ← Google Places API wrapper
      routes.ts             ← Google Routes API wrapper
      weather.ts            ← OpenWeather wrapper
      scoring.ts            ← Ranking algorithm
      vibes.ts              ← Vibe → place type mapping
      fit.ts                ← Time fit calculation
    /types
      index.ts              ← All TypeScript types
    /lib
      supabase.ts           ← Supabase client (later)
  .env
  package.json
  tsconfig.json
  Dockerfile
```

**Install:**
```bash
mkdir server && cd server
npm init -y
npm install express cors dotenv @googlemaps/google-maps-services-js
npm install -D typescript ts-node nodemon @types/express @types/cors @types/node
npx tsc --init
```

---

## Step 2: Define Types

`/server/src/types/index.ts` — shared types everything uses.

```typescript
// Request from client
interface SuggestRequest {
  windowMinutes: number
  origin: { lat: number; lng: number }
  travelMode: 'walking' | 'driving' | 'transit'
  vibes?: string[]
  maxTravelMinutes?: number
}

// A raw place from Google
interface RawPlace {
  id: string
  name: string
  types: string[]
  location: { lat: number; lng: number }
  rating?: number
  priceLevel?: number
  photoUri?: string
  openNow?: boolean
  address?: string
}

// A scored suggestion returned to client
interface Suggestion {
  id: string
  name: string
  types: string[]
  location: { lat: number; lng: number }
  rating?: number
  priceLevel?: number
  photoUrl?: string
  openNow?: boolean
  address?: string
  travelMinutes: number
  dwellMinutes: number
  totalMinutes: number
  vibeMatch: string[]
  reasonCodes: string[]
  fitScore: number
}

// Response to client
interface SuggestResponse {
  suggestions: Suggestion[]
  weather?: { temp: number; condition: string; icon: string }
}
```

---

## Step 3: Build Vibe Mapping

`/server/src/services/vibes.ts` — maps vibe tags to Google place types.

This is a pure lookup with no external calls. Build first because everything depends on it.

```
chill     → cafe, book_store, library, bakery
social    → bar, restaurant, bowling_alley, cafe
active    → gym, park, hiking_area, sports_complex
creative  → art_gallery, museum, art_supply_store
outdoors  → park, nature_reserve, campground
food      → restaurant, bakery, ice_cream_shop
late-night → bar, night_club, restaurant
```

Also includes time-of-day boosts:
- Morning: coffee spots +boost
- Afternoon: parks, shops +boost
- Evening: restaurants, social +boost
- Night: late-night tagged +boost, activate safety filter

**No API calls. Pure logic. Test immediately.**

---

## Step 4: Build Places Service

`/server/src/services/places.ts` — Google Places API wrapper.

**What it does:**
1. Takes: origin (lat/lng), radius (meters), place types (from vibes)
2. Calls: `POST https://places.googleapis.com/v1/places:searchNearby`
3. Returns: array of RawPlace objects (normalized)

**Key details:**
- Use the NEW Places API (not legacy)
- Auth: API key in `X-Goog-Api-Key` header
- Field mask: only request fields you need (saves quota)
- `includedTypes` from vibe mapping
- Filter `businessStatus: OPERATIONAL` and `openNow: true`
- Max 20 results per request

**Test:** Call with a real lat/lng, verify you get cafes back.

---

## Step 5: Build Routes Service

`/server/src/services/routes.ts` — Google Routes API wrapper.

**What it does:**
1. Takes: origin (lat/lng), destination (lat/lng), travel mode
2. Calls: `POST https://routes.googleapis.com/directions/v2:computeRoutes`
3. Returns: travel time in minutes

**Key details:**
- Auth: API key in `X-Goog-Api-Key` header
- Field mask: `routes.duration` (minimal, saves quota)
- Travel modes: `WALK`, `DRIVE`, `TRANSIT`
- Parse duration string ("480s") → number (8 minutes)

**Optimization:**
- Don't call Routes for every place (expensive)
- First pass: use straight-line distance heuristic to filter obvious misses
- Second pass: call Routes API only for top ~10 candidates
- Cache results for same origin/destination pairs

**Fallback heuristic (saves API calls):**
```
walking:  ~80 meters per minute
driving:  ~500 meters per minute
transit:  ~250 meters per minute
```

Use heuristic for initial filter, Routes API for final ranking.

---

## Step 6: Build Fit Calculator

`/server/src/services/fit.ts` — determines if a place fits in the time window.

**What it does:**
1. Takes: travel time (minutes), place type, window minutes
2. Looks up dwell time by place type
3. Calculates: `travel_to + dwell + travel_back + buffer`
4. Returns: { fits: boolean, totalMinutes, breakdown }

**Dwell time lookup:**
```
cafe/bakery:       15-20 min
restaurant:        25-35 min
bookstore/shop:    15-25 min
park/outdoors:     15-30 min (flexible, fills window)
gym:               25-30 min
gallery/museum:    25-45 min
library:           20-45 min (flexible)
bar:               30-60 min
```

**Buffer:** always add 5 minutes.

**Hard rule:** if `totalMinutes > windowMinutes`, filter it out. Never suggest something that doesn't fit.

**No API calls. Pure math. Test immediately.**

---

## Step 7: Build Scoring Engine

`/server/src/services/scoring.ts` — ranks places by quality of match.

**Score formula:**
```
score = (
    vibe_match        × 0.30
  + time_efficiency   × 0.25
  + distance_score    × 0.20
  + novelty           × 0.15
  + rating_signal     × 0.10
)
```

**Vibe match:** 1.0 if place type matches selected vibe, 0.5 for partial, 0.0 for none.

**Time efficiency:** how well totalMinutes fills the window.
- Ideal: 70-90% of window used → score 1.0
- Too short (<50%) → score 0.5 (wasted time)
- Too tight (>95%) → score 0.6 (cutting it close)

**Distance score:** closer = higher. Normalize by max travel tolerance.

**Novelty:** for MVP, just ensure category diversity (at least 2 different categories in top 5).

**Rating signal:** Google rating normalized to 0-1. Light weight — we're not Yelp.

**Generate reason codes:**
- "Chill vibe"
- "6 min walk"
- "Fits in 45 min"
- "Open now"
- "Sunny today" (if weather integrated)

**No API calls. Pure math. Test immediately.**

---

## Step 8: Build Weather Service

`/server/src/services/weather.ts` — OpenWeather API wrapper.

**What it does:**
1. Takes: origin (lat/lng)
2. Calls: `GET https://api.openweathermap.org/data/2.5/weather`
3. Returns: { temp, condition, icon, isOutdoorFriendly }

**Logic:**
- `isOutdoorFriendly`: true if sunny/clear/cloudy AND temp 50-95°F
- Used by scoring engine to boost/filter outdoor suggestions

**Cache:** 10 minutes per location grid (weather doesn't change fast).

---

## Step 9: Wire Up the Suggest Endpoint

`/server/src/routes/suggest.ts` — the main endpoint. Glues everything together.

**`POST /api/suggest` flow:**

```
1. Validate request body (windowMinutes, origin, travelMode, vibes)
2. Get weather for origin (cached)
3. Map vibes → place types (vibes.ts)
4. Calculate search radius from travelMode + windowMinutes
5. Fetch nearby places from Google (places.ts)
6. For each place:
   a. Estimate travel time (heuristic first)
   b. Calculate fit (fit.ts)
   c. Filter out places that don't fit
7. For top ~10 candidates: get real travel time (routes.ts)
8. Recalculate fit with real travel times
9. Score remaining places (scoring.ts)
10. Apply diversity filter (at least 2 categories in top 5)
11. Return top 5 with reason codes + weather context
```

**Response shape:**
```json
{
  "suggestions": [
    {
      "id": "ChIJ...",
      "name": "Blue Bottle Coffee",
      "types": ["cafe"],
      "location": { "lat": 35.225, "lng": -97.440 },
      "travelMinutes": 6,
      "dwellMinutes": 20,
      "totalMinutes": 32,
      "vibeMatch": ["chill"],
      "reasonCodes": ["Chill vibe", "6 min walk", "Fits in 45 min"],
      "fitScore": 0.82,
      "photoUrl": "...",
      "openNow": true
    }
  ],
  "weather": {
    "temp": 72,
    "condition": "Sunny",
    "icon": "01d"
  }
}
```

---

## Step 10: Build Feedback Endpoint

`/server/src/routes/feedback.ts` — `POST /api/feedback`

**What it does:**
1. Takes: `{ placeId, action: 'like' | 'dislike' | 'save', userId? }`
2. Stores in Supabase (or in-memory for MVP)
3. Future: updates preference weights, feeds ML service

**For MVP:** just log it and store in memory. Database can come later.

---

## Step 11: Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["node", "dist/index.js"]
```

---

## Build Order (What to Code First)

```
1. types/index.ts          ← define all shapes first
2. services/vibes.ts       ← pure logic, no API, testable
3. services/fit.ts         ← pure math, no API, testable
4. services/scoring.ts     ← pure math, no API, testable
5. services/places.ts      ← first API call (Google Places)
6. services/routes.ts      ← second API call (Google Routes)
7. services/weather.ts     ← third API call (OpenWeather)
8. routes/suggest.ts       ← glue everything together
9. routes/feedback.ts      ← simple storage
10. index.ts               ← Express app, wire routes
```

**Why this order:**
- Steps 1-4 are pure logic with zero dependencies. Build and test them without any API keys.
- Steps 5-7 each add one external API. Test each in isolation.
- Step 8 composes everything. By now each piece is proven.
- Step 9-10 are simple wiring.

---

## Testing Strategy

**For each service, test with a hardcoded input:**

```bash
# After building places.ts
curl -X POST http://localhost:3001/api/health

# After building suggest endpoint
curl -X POST http://localhost:3001/api/suggest \
  -H "Content-Type: application/json" \
  -d '{
    "windowMinutes": 45,
    "origin": { "lat": 35.2226, "lng": -97.4395 },
    "travelMode": "walking",
    "vibes": ["chill"]
  }'
```

**Expected result:** 3-5 cafes/bookstores/parks near that location, each fitting within 45 minutes, ranked by score.

---

## Caching Strategy (Save API Quota)

| Data | Cache Duration | Key |
|---|---|---|
| Weather | 10 min | lat/lng grid (round to 2 decimals) |
| Places nearby | 5 min | lat/lng grid + radius + types |
| Route travel time | 30 min | origin + destination + mode |

Use simple in-memory Map for hackathon. No Redis needed.

---

## Error Handling

- Google API fails → return error with message, don't crash
- No places found → return empty array with helpful message
- Rate limit hit → fall back to distance heuristic for travel times
- Invalid request → 400 with clear validation error
- Weather API fails → skip weather, still return suggestions
