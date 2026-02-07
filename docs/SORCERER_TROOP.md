# Sorcerer Troop (Hackathon Spec)

## 0) One-liner
Sorcerer Troop is a **time + location action router** for newly graduated young adults: when you have a small window of free time in a new city, it instantly routes you to a **third place** or **micro-activity** that fits your schedule and vibe.

Not a calendar app. Not a trip planner. Not a social network feed.

---

## 1) Problem (human)
New grads (22-28) lose the default community they had in college. In a new city they face:
- Lots of **fragmented time** (15-90 minute gaps) between obligations.
- High friction to **discover third places** (cafes, parks, bookstores, gyms, community spaces) that match their vibe right now.
- Analysis paralysis: "Where should I go?" becomes "I'll just scroll."

Core tension: time is constrained, discovery is unstructured, and motivation decays fast.

---

## 2) Product thesis
People do not need "the best place in the city." They need the **best next action** that fits:
- their **time window** (hard constraint),
- their **current location** (hard constraint),
- their **transport mode + travel tolerance** (constraints),
- their **vibe** (preference),
- and **novelty** (do not repeat the same 2-3 places).

Sorcerer Troop wins by making "do something" the default and "scroll" the exception.

**Important principle (anti-wrapper):** map/place data providers are inputs, not the product. We treat Places/Maps APIs as replaceable supply and build our own durable layer on top: a third-place taxonomy, time-fit heuristics, safety rules, and (eventually) an outcome dataset of what people actually choose with 15-90 minutes.

---

## 3) Who it's for (persona)
Primary persona: newly graduated young adult, new-ish to a city.
- Works 9-5 (or shift work), wants a life outside work.
- Often alone during gaps, sometimes wants to bring a friend.
- High sensitivity to "another social app."

Anti-persona (for MVP):
- Tourists planning a full-day itinerary.
- Users who want deep reviews and long-form content.

---

## 4) What we are / aren't
### We are
- An **action routing platform**: given a time window and a location, return a ranked list of options that fit.
- A **utility**: designed to be used briefly, then hand off to navigation.
- A **lightweight discovery layer**: quick decisions, not endless browsing.
- A **provider-agnostic routing layer**: Google/Apple/etc are data sources we can swap; the routing logic and “third place graph” are what we own.

### We are not
- A "chat with your calendar" assistant.
- A reviews platform (we are not trying to beat Yelp/Google reviews).
- A social feed (no followers, no infinite scroll, no posting as the core loop).
- A real-time capacity product (no "seats open" or "not busy" promises in MVP).

---

## 5) The magic moment
In under 60 seconds from install:
1) user enables location (or enters a neighborhood),
2) chooses a time window ("I have 45 minutes"),
3) gets 3-5 options that all fit,
4) taps one, and the app opens directions.

If the output feels "obviously tailored" and "low effort," they come back.

---

## 6) MVP scope (hackathon)
### Must-have (demoable loop)
1) **I'm Free Now** entry point
2) choose a **time window** (15/30/45/60/90 minutes + custom)
3) choose **vibe** (optional): Chill / Social / Active / Creative / Outdoors / Surprise
4) choose **transport**: Walk / Drive / Transit
5) see **ranked suggestions** (3-5 cards)
6) tap a suggestion -> details -> **Navigate**

### Should-have (polish that sells)
- "Fits your window" breakdown (travel + suggested dwell + buffer)
- "New to you" vs "Classic" tags
- Save/skip feedback ("more like this / less like this")
- Night-time "Safety mode" (see Safety)

### Explicitly out of scope for MVP
- Calendar sync (nice, but not required to prove the loop)
- Group scheduling and friend matching
- Business dashboards / paid placement
- Full events ingestion (Ticketmaster/Eventbrite/Meetup)
- Real-time wait/capacity claims

---

## 7) Explore Layer (the core)
Explore is not "browse places." It's **route-to-a-micro-experience**.

### 7.1 Experience categories (initial)
We focus on third places and low-commitment activities that work inside 15-90 minutes:
- Coffee / tea / dessert
- Bookstores and reading nooks
- Parks / short walks / viewpoints
- Museums / galleries (if nearby + open)
- Thrift / local shops / record stores
- Study-friendly spaces (libraries, quiet cafes)
- Micro-culture (indie theaters, art supply stores)

### 7.2 Vibe tags (internal + user-facing)
We do not need perfect ML; we need strong heuristics:
- Chill, Social, Active, Creative, Outdoors, Food, Late-night

Hackathon implementation:
- Map Google Places `types` -> vibe tags.
- Apply time-of-day boosts (coffee mornings, parks afternoons, etc.).

### 7.3 Fit is a hard constraint
If it does not fit in the time window, it does not ship as a suggestion.

We calculate:
- travel time (origin -> place)
- dwell time estimate (by type + time window)
- buffer time (e.g., 5 minutes)

If `travel + dwell + buffer > window`, filter it out.

### 7.4 Diversity + novelty (avoid "same 3 places")
Even in MVP:
- Deduplicate near-identical options (same category cluster).
- Add a novelty boost to places the user has not picked recently.
- Ensure at least 2 different categories in the top 5.

---

## 8) User flows
### 8.1 Onboarding (30-60 seconds)
1) Welcome: "Turn dead time into micro-adventures."
2) Permissions:
   - Location (foreground; background optional later)
3) Quick preferences:
   - vibe tiles (multi-select)
   - transport default (walk/drive/transit)
   - max travel (5/10/15 minutes)
4) First suggestions immediately (no empty state).

### 8.2 Core loop: I'm Free Now (THE DEMO FLOW)
1) Open the app → big "I'm Free Now" button
2) Select time: "45 minutes"
3) Select vibe (optional): tap "Chill"
4) Hit go → instant results (3-5 cards)
5) Show the cards:
   - "Blue Bottle Coffee — 6 min walk — fits in 45 min"
   - "Riverside Park — 8 min walk — sunny today"
   - "Left Bank Books — 5 min drive — open now"
6) Tap one → detail view shows:
   - Why it matched: "Chill vibe, 6 min walk, fits perfectly in your window"
   - Travel + dwell breakdown: "6 min walk + 20 min there + 6 min back = 32 min"
   - Photo, address, "Navigate" button
7) Tap Navigate → hands off to Google Maps

**Card format:**
- Title, category, travel time
- "Fits in 45 min" badge
- Open now status
- Price level (if available)
- Photo

### 8.3 Feedback loop (keep it minimal)
After returning (or manually):
- "Was this a good pick?" Like / Dislike
- "More like this / less like this" updates preference weights.

No posting. No comments. No follower graph.

---

## 9) Safety and trust (non-negotiable)
Young adults exploring alone need trust signals. MVP guardrails:
- Safety mode toggle for night:
  - prefer well-rated, public, open-now places
  - avoid isolated parks/trails late at night
- Always show:
  - address
  - open hours (if available)
  - "public place" framing (no private residences)
- Privacy-first defaults:
  - store minimal location history (or none) by default
  - do not sell personal data
  - clear explanation of what location is used for

---

## 10) The infrastructure angle (how this becomes a shovel)
The consumer app is a reference client. The real product can become a primitive.

### 10.1 Action Routing API (future)
`POST /route-action`
- Inputs:
  - `window_minutes`
  - `origin_latlng`
  - `travel_mode`
  - `vibe_tags[]`
  - `max_travel_minutes`
  - optional `constraints` (budget, indoors/outdoors, accessibility)
- Output:
  - ranked `actions[]` with time budget breakdown, reason codes, and deeplinks

### 10.2 Data network (future)
What compounds (aggregated, anonymized):
- what people choose with X minutes (by city/area/time)
- which options lead to repeats (retention proxy)
- micro-activity demand heatmaps

This becomes valuable to:
- venues/organizers (what people want when)
- city/neighborhood planners (macro signals)
- partner apps (maps, calendars, travel, campus apps) via API

### 10.3 The owned layer: the Third Place Graph
To avoid being “just a Places wrapper,” we create an internal representation of third places that is richer than raw provider data:
- vibe taxonomy (chill/social/creative/outdoors/etc)
- micro-duration suitability (15/30/45/60 min)
- “new-to-you” and repeat-rate signals
- safety heuristics (night mode, public-ness, open-late bias)
- lightweight curation packs (starter sets for neighborhoods or cohorts)

### 10.4 Provider-agnostic adapters (anti “Google kills you”)
Design the system so any places source can plug in:
- internal `place_ref` (our stable ID) + provider IDs as attributes
- adapters for Google Places now; later options: Foursquare/OSM/custom venue partners
- caching + normalization so switching providers is a backend change, not a product rewrite

### 10.5 Outcome dataset (what compounds)
The durable dataset is not “places,” it’s behavior:
- what we suggested (inputs: window, vibe, mode)
- what they clicked, saved, and repeated
- what they skipped (negative preference signal)

Over time, we learn “what works in 45 minutes” for a persona and area. That’s the compounding asset.

### 10.6 Distribution wedges (avoid pure consumer inertia)
If behavior change is the risk, distribution is the mitigation:
- “New city mode” partnerships (employers onboarding, relocation packages)
- apartments/coworking/community orgs (welcome flows with starter packs)
- campus-adjacent launches (where third places are dense and shared)

### 10.7 Shovel checklist (what we gather/build/guardrail)
This is the “sell the shovels” work: the durable primitive + the compounding dataset.

#### A) Build the primitive (routing engine you can embed)
- **Single contract:** `window + origin + mode + vibe + constraints -> ranked actions[] + reason codes + time budget breakdown`.
- **Provider adapters:** `PlacesProvider` interface (Google now) + normalized internal shape so we can swap data sources later.
- **Normalization:** canonicalize place fields (name, lat/lng, hours/openNow, types, price, rating) and attach our own metadata.
- **Time-fit core:** dwell-time priors by category + buffer policy + hard filter that never suggests something that can’t fit.
- **Explainability:** reason codes (“chill vibe”, “7 min walk”, “fits in 45 min”) so users trust it and we can debug it.
- **Caching + limits:** cache provider responses per area/time bucket; cap travel-time computations; degrade gracefully to heuristics.

#### B) Gather what makes this defensible (the Third Place Graph)
Own a layer that is not in Google’s raw data:
- **Vibe taxonomy:** chill/social/creative/outdoors/active/late-night (and how each maps to categories + times of day).
- **Micro-duration suitability:** which place-types are good for 15/30/45/60/90 minutes.
- **Starter packs:** curated “first week in this city” sets (neighborhood packs; after-work packs; rainy-day packs).
- **Safety heuristics:** night mode rules, public-ness signals, “open late” bias, avoid isolated options in late hours.
- **Novelty + diversity controls:** avoid same-category spam; rotate categories; new-to-you boost.

#### C) Gather the compounding dataset (outcomes, not places)
Instrument the loop so you learn what works:
- **Inputs:** window length, time-of-day, day-of-week, vibe, mode, max travel, coarse geo bucket.
- **Outputs:** the ranked list returned (place IDs + scores + reasons).
- **Outcomes:** clicks (navigate), saves, dismissals, repeats; optional “good pick?” feedback.
- **Negative signals:** “not my vibe,” “too far,” “not open,” “not safe,” “already been.”
- **Quality metrics:** time-to-pick, suggestion acceptance rate, repeat rate, “return next week” retention proxy.

#### D) Keep in mind (don’t ship yourselves into a corner)
- **Privacy:** location + behavior is sensitive. Default to minimal retention, coarse bucketing, and clear controls.
- **Trust:** separate “promoted” from organic routing if/when you monetize; do not let ads break the “fit” guarantee.
- **Cold start:** starter packs + simple vibe onboarding + tight heuristics beat “ML” early.
- **Provider constraints:** treat external APIs as replaceable and avoid designing around any one provider’s quirks/limits.
- **Safety:** don’t nudge people into sketchy situations; offer a safety mode and conservative defaults at night.

---

## 11) Technical architecture (hackathon-friendly)
### 11.1 Fast stack
- Frontend: Next.js (PWA) + React
- UI: Tailwind + shadcn/ui (or equivalent)
- Backend: Next.js route handlers (API routes)
- Auth + DB: Supabase (optional for MVP; can ship without accounts)
- Places: Google Places API (New) for hackathon speed (but implement via an adapter so we can swap providers later)
- Travel time: Google Routes API (or use a simple distance heuristic in MVP)
- Hosting: Vercel

### 11.2 Minimal backend endpoints
- `POST /api/suggest`
  - body: window, origin, travel mode, vibe
  - returns: ranked places with time budget breakdown + reason codes
- `POST /api/feedback`
  - body: place_id, action (like/dislike/save)

### 11.3 Suggestion pipeline (MVP)
1) `searchNearby` for candidate places (by included types + radius)
2) filter:
   - open now (if available)
   - businessStatus operational
3) compute travel time:
   - Routes API for top N candidates (e.g., 10-20), or
   - distance heuristic if time is tight
4) assign dwell time estimate by place type
5) filter by fit
6) score + rank
7) return top 5 with reason codes

### 11.4 Scoring (simple, explainable)
Score components (weights tunable):
- vibe match
- time efficiency (uses the window well without cutting it too close)
- travel minutes (closer wins)
- light rating signal (do not frame as "best place")
- novelty/diversity boost

---

## 12) Demo script (judges)
1) "I moved here after graduating. I have no default third places."
2) Open app -> I'm Free Now -> choose 45 minutes + Chill.
3) It returns 5 options that all fit: coffee, bookstore, park, gallery.
4) Tap one -> see time breakdown -> navigate.
5) Close: "We are building the action routing layer for real life: time + location -> the next best micro-experience."

---

## 13) Branding notes (placeholder)
Working title: **Sorcerer Troop**
- vibe: vibrant, modern, playful ("summon an adventure")
- avoid "AI assistant" language; focus on "route", "summon", "spark", "micro-adventure"

---

## 14) Detailed scoring engine

### 14.1 Score formula (MVP)
Each candidate place gets a composite score:

```
score = (
    vibe_match        × 0.30   // how well place type maps to selected vibe
  + time_efficiency   × 0.25   // total_time / window (closer to 0.7-0.9 = ideal)
  + distance_score    × 0.20   // closer = higher
  + novelty           × 0.15   // haven't been here / haven't suggested recently
  + rating_signal     × 0.10   // Google rating normalized, light weight
)
```

### 14.2 Vibe → Place type mapping
| Vibe tag | Google Places types |
|---|---|
| Chill | cafe, book_store, library, bakery |
| Social | bar, restaurant, bowling_alley, cafe |
| Active | gym, park, hiking_area, sports_complex |
| Creative | art_gallery, museum, art_supply_store, music_store |
| Outdoors | park, nature_reserve, campground, viewpoint |
| Food | restaurant, bakery, ice_cream_shop, food_market |
| Late-night | bar, late_night_restaurant, 24hr_cafe |

### 14.3 Time-of-day boosts
- Morning (6am-11am): coffee +0.1, parks +0.05
- Afternoon (11am-5pm): parks +0.1, shops +0.05, galleries +0.05
- Evening (5pm-9pm): restaurants +0.1, social spots +0.1
- Night (9pm+): late-night tagged +0.15, activate safety mode boosts

### 14.4 Dwell time estimates (lookup table)
| Place type | Estimated dwell |
|---|---|
| Coffee / tea | 15-20 min |
| Quick food | 20-25 min |
| Bookstore / shop | 15-25 min |
| Park / walk | 15-30 min (flexible to fill window) |
| Gym (express) | 25-30 min |
| Gallery / museum | 25-45 min |
| Library | 20-45 min (flexible) |
| Bar / social | 30-60 min |

### 14.5 Radius logic by transport
- Walking: 800m (~10 min walk)
- Driving: 5000m (~10 min drive)
- Transit: 3000m (~15 min transit)
- Scale radius up for longer time windows (60+ min → 1.5x radius)

---

## 15) Weather integration

### 15.1 Implementation
- API: OpenWeather (free tier, 1000 calls/day)
- Fetch current conditions + hourly forecast on each suggestion request
- Cache aggressively (weather doesn't change every minute)

### 15.2 Logic
- Sunny + warm → boost outdoor suggestions (parks, walks, viewpoints)
- Raining / cold → filter out outdoor-only options, boost indoor (cafes, bookstores, libraries)
- Extreme heat/cold → reduce walking radius
- "About to rain" → warn on outdoor picks, suggest indoor alternatives
- Show weather context on suggestion cards: "72° and sunny" next to park suggestion

---

## 16) Post-MVP features (future roadmap)

These are explicitly OUT of the hackathon scope but documented so the vision isn't lost.

### 16.1 Calendar sync + gap detection
Connect Google/Apple/Outlook calendar. Auto-detect free gaps throughout the day. Show a **timeline view** of the user's day with gaps highlighted:

```
┌─────────────────────────────────┐
│  Thursday, Feb 7                │
│                                 │
│  9:00  ██ Team standup          │
│ 11:00  ██ Class                 │
│ 12:00  ░░ 45 min free ░░░░░░░  │ ← tap to expand
│         3 suggestions ready     │
│ 12:45  ██ Lunch w/ Alex         │
│  4:00  ░░ 30 min free ░░░░░░░  │ ← tap to expand
│  4:30  ██ Study group           │
│  6:00  ░░ Evening free ░░░░░░  │
└─────────────────────────────────┘
         [ I'm Free Now ]
```

The gaps ARE the product. Everything else is context.

### 16.2 Errands layer (location-aware tasks)
Users add tasks with physical locations:
- "Pick up prescription" → CVS
- "Return Amazon package" → UPS Store
- "Grab groceries" → Trader Joe's

The app geocodes each errand. When a gap appears near an errand location, it proactively surfaces it:

> "You have 30 min free at 3pm. CVS is 4 min from where you'll be. Pick up your prescription?"

This is the bridge between calendar and to-do list that nobody has built. Errands become **location-aware and time-aware.**

Errands get a scoring bonus (+0.20) when they match a gap, because completing a real task always beats a suggestion.

### 16.3 Route-aware suggestions
Learn the user's common routes (home → work → gym → home). Suggest things ALONG the route, not just near current location:

> "You pass a FedEx on your drive home. Drop off that return? Adds 3 min to your commute."

> "Trader Joe's is a 2-min detour from your normal route. You added groceries to your list yesterday."

### 16.4 Group gaps
Connect with friends (contact sync or share link). Find overlapping free time:

```
You + Maya + Jordan
All free: Sat 2:00 - 3:15 · Near West Campus

  Pho spot · seats available
  Bowling · $5/game
  Study hang · quiet cafe

  [ Share with group ]
```

Solves "when are we all free?" AND "what should we do?" in one screen.

### 16.5 Smart notifications
Not spammy. Contextual. Max 3x per day.

| Type | When | Example |
|---|---|---|
| Gap detected | Calendar changes / meeting ends early | "You just got 40 min free. 3 options nearby." |
| Errand match | Near a task location with time | "CVS is 4 min away and you have 25 min." |
| Time-sensitive | Something expiring/closing | "Your return window ends tomorrow. UPS is nearby." |
| Weather-triggered | Nice weather + outdoor option + gap | "72° and sunny. Park is 5 min walk." |
| Route-aware | Errand along commute | "You'll pass FedEx on your way home." |
| Group | Friends have overlapping free time | "You and Maya are both free at 3." |

Never notify: during busy blocks, more than 3x/day, for stuff they've dismissed, generic "open the app" nudges.

### 16.6 Personalization engine (learns over time)
- **Week 1:** stated preferences + basics (distance, time, category)
- **Week 4:** pattern recognition ("you pick coffee in morning gaps," "you prefer <8 min walks," "you never pick fitness")
- **Month 3:** predictive ("Tomorrow's 2pm gap — last 3 times you got coffee. Reserve a spot?", "You usually have a Wednesday gap. Make it your errand window?")

### 16.7 Stats / reclaimed time (retention hook)
```
This week:
  3.5 hrs reclaimed
  6 new places visited
  4 errands knocked out
  2 week streak

"You've turned 14 hrs of dead time into time well spent this month."
```

Emotional payoff. Makes people feel the app is giving them their life back.

---

## 17) Revenue model (future, not hackathon)

| Stream | Who pays | How |
|---|---|---|
| New City Pass (B2C) | Consumers | 1-3 month subscription optimized for “just moved here”: starter packs, safety mode, higher-quality routing, saved lists |
| Partner distribution (B2B2C) | Employers/apartments/coworking | Bundle as a “welcome to the city” perk; private packs; cohort prompts |
| Venue tools (B2B) | Venues/organizers | Publish micro-experiences and “walk-in friendly” windows; claim their place; lightweight offers (avoid ad-auctions early) |
| Action Routing API/SDK (B2B) | Calendar/map/partner apps | Per-call or licensing to embed the routing engine in other surfaces |
| Aggregated insights (B2B) | Planners/franchises/venues | Anonymized “micro-activity demand” trends (only after scale and with strict privacy) |

Note: for the hackathon we do not need a business model. For a real company, avoid starting as “ads for foot traffic” because it creates trust issues; lead with consumer value and partner distribution first.

---

## 18) Database schema (detailed)

```sql
-- Core user record
users (
  id            uuid PRIMARY KEY,
  email         text,
  display_name  text,
  transport_mode text DEFAULT 'walking',   -- walking / driving / transit
  max_travel_min int DEFAULT 10,
  budget_pref    text DEFAULT 'mixed',     -- free_only / budget / mixed / no_limit
  created_at     timestamp
)

-- What vibes they prefer (seeded from onboarding, updated by feedback)
preferences (
  id       uuid PRIMARY KEY,
  user_id  uuid REFERENCES users,
  category text,          -- 'chill', 'social', 'active', etc.
  weight   float DEFAULT 1.0   -- adjusted by like/dislike feedback
)

-- Location-aware tasks (post-MVP)
errands (
  id            uuid PRIMARY KEY,
  user_id       uuid REFERENCES users,
  title         text,
  location_name text,
  lat           float,
  lng           float,
  deadline      timestamp,       -- optional
  completed     boolean DEFAULT false,
  created_at    timestamp
)

-- THE FLYWHEEL: what people actually do
activity_history (
  id            uuid PRIMARY KEY,
  user_id       uuid REFERENCES users,
  place_id      text,            -- Google Place ID
  place_type    text,
  place_name    text,
  vibe_selected text,            -- what vibe was active
  gap_duration  int,             -- minutes available
  time_of_day   text,            -- morning / afternoon / evening / night
  weather       text,            -- sunny / rainy / cold / hot
  was_suggested boolean,         -- did we suggest it or did they find it
  was_completed boolean,         -- did they actually go
  feedback      text,            -- like / dislike / null
  created_at    timestamp
)

-- Saved / bookmarked places
saved_places (
  id        uuid PRIMARY KEY,
  user_id   uuid REFERENCES users,
  place_id  text,
  place_name text,
  note      text,
  created_at timestamp
)
```

The `activity_history` table is the data flywheel. Over time it answers: "What do people actually do with X minutes at Y time of day in Z weather near W location?" Nobody else has that dataset.

---

## 19) API stack details

### 19.1 Google Cloud (one project covers all)
Get at: console.cloud.google.com. Enable each API. $200/month free credit.

**Google Places API (New)**
```
POST https://places.googleapis.com/v1/places:searchNearby
Body:
{
  "locationRestriction": {
    "circle": {
      "center": { "latitude": lat, "longitude": lng },
      "radius": 1500
    }
  },
  "includedTypes": ["cafe", "gym", "park", "library", "book_store"],
  "maxResultCount": 20
}
Returns: name, types, location, rating, photos, currentOpeningHours
```

Adapter note (important): wrap Places calls behind an interface (e.g., `PlacesProvider.searchNearby(...)`) and store results in our normalized `third_places` shape. That keeps us provider-agnostic (Google today, Foursquare/OSM/venue partners tomorrow) and reduces “Google kills you” risk.

**Google Routes API**
```
POST https://routes.googleapis.com/directions/v2:computeRoutes
Body:
{
  "origin": { "location": { "latLng": { "latitude": x, "longitude": y } } },
  "destination": { "location": { "latLng": { "latitude": x, "longitude": y } } },
  "travelMode": "WALK"
}
Returns: duration (e.g., "480s"), distanceMeters
```

### 19.2 OpenWeather
```
GET https://api.openweathermap.org/data/3.0/onecall?lat={lat}&lon={lon}&appid={key}
Returns: current temp, conditions, hourly forecast
Free tier: 1,000 calls/day
```

### 19.3 Supabase
- Auth: Google OAuth (get calendar access token for free)
- Database: Postgres (schema above)
- Free tier: 50K auth users, 500MB database

### 19.4 Vercel
- Hosting + edge functions
- Free for hobby tier
- Auto-deploy from GitHub

**Total hackathon cost: $0.** Everything has a free tier.

---

## 20) Project structure

```
/app
  /page.tsx                  ← home screen (I'm Free Now button + quick actions)
  /onboarding/page.tsx       ← first-time setup flow
  /results/page.tsx          ← suggestion cards after "I'm Free Now"
  /place/[id]/page.tsx       ← place detail + navigate
  /saved/page.tsx            ← bookmarked places
  /api
    /suggest/route.ts        ← POST: location + window + vibe → ranked suggestions
    /feedback/route.ts       ← POST: place_id + like/dislike
    /auth/callback/route.ts  ← Google OAuth callback
/lib
  /places.ts                 ← Google Places API helpers
  /routes.ts                 ← Google Routes API helpers
  /weather.ts                ← OpenWeather helpers
  /scoring.ts                ← matching engine + ranking algorithm
  /vibes.ts                  ← vibe → place type mapping + time-of-day boosts
  /fit.ts                    ← time fit calculation (travel + dwell + buffer)
  /supabase.ts               ← Supabase client
/components
  /FreeNowButton.tsx         ← the big CTA
  /TimeSelector.tsx          ← duration picker (15/30/45/60/90/custom)
  /VibeSelector.tsx          ← vibe tile picker
  /SuggestionCard.tsx        ← single suggestion with photo, time breakdown, category
  /SuggestionList.tsx        ← scrollable card stack
  /PlaceDetail.tsx           ← expanded view with navigate button
  /OnboardingFlow.tsx        ← preference setup screens
  /SafetyBadge.tsx           ← "public place" / "well-lit" indicators
```

---

## 21) Hackathon build order

| Phase | What | Est. time | Owner |
|---|---|---|---|
Order this to get the end-to-end demo loop working early, then progressively replace mocks with real data.

| Phase | What | Est. time | Owner |
|---|---|---|---|
| 1 | App scaffold: Next.js + Tailwind + routing (`/` + `/free`) | 0.5 hr | — |
| 2 | Core UI: I'm Free Now (window + vibe + mode) | 1.5 hr | — |
| 3 | API contract: `POST /api/suggest` returning mock suggestions + reason codes + time budgets | 1 hr | — |
| 4 | Suggestion cards + navigate handoff (full demo loop) | 1.5 hr | — |
| 5 | Places adapter: Google Places integration behind a provider interface + normalization | 2 hr | — |
| 6 | Fit filter + simple scoring + diversity constraints | 1.5 hr | — |
| 7 | Safety mode (night filter rules + conservative defaults) | 1 hr | — |
| 8 | Feedback + instrumentation (click/save/dismiss; local-first) | 1 hr | — |
| 9 | Onboarding (30–60 seconds; preferences + first run) | 1 hr | — |
| 10 | Polish + edge cases + demo script | 1.5 hr | — |

Stretch goals (only if time remains):
- Routes API (better travel times) and/or weather boosts
- Auth + DB (Supabase) for persistence across devices
- Curated starter pack for the demo city

**Total (core): ~12 hrs.** Split frontend/backend across team members to parallelize.

---

## 22) The pitch (refined)

### One-liner for judges
"We're building the action routing layer for real life: time + location → the next best micro-experience."

### The story (60 seconds)
"You just graduated. You moved to a new city. You don't know anyone, you don't know where anything is, and every day you have these gaps — 30 minutes here, an hour there — that you burn scrolling your phone. Sorcerer Troop fixes that. Tell it how much time you have, and it instantly routes you to a place that fits — a quiet coffee shop, a bookstore, a park you didn't know existed. Every suggestion fits your window, your vibe, and how you're getting around. No reviews to read. No planning. Just go."

### The infrastructure pitch (for business-minded judges)
"The consumer app is day one. The real play is the action routing API: any calendar app, any map app, any campus app can embed our engine. And the data network — what people actually do with 30 minutes in a city at 2pm on a Tuesday — that dataset doesn't exist anywhere. We build it with every tap."

Add-on (if asked “what do you own?”): “Places data is a commodity. We own the Third Place Graph (vibe taxonomy + time-fit + safety heuristics) and the outcome dataset of what people actually choose with 15-90 minutes.”

### New Heights angle
"We're not inventing a new category. We're taking fragmented free time — something everyone has and nobody optimizes — and turning it into micro-adventure momentum. For people, we reclaim hours of dead time every week and help new grads build a life in a new city. The shovel is the routing layer underneath: time + location + vibe -> the next best third place."

---

## 23) Risks and honest assessment

### Why this is strong
- Crystal clear problem (loneliness + wasted time for new grads)
- Demo is powerful and emotionally resonant
- Technically feasible in hackathon timeframe
- The "reclaimed time" stat is a great retention hook
- The infrastructure/API story gives it legs beyond a consumer app

### Real concerns (be honest with yourselves)
- **Google/Apple could ship something similar.** They own major surfaces (Maps/Calendar). Mitigation: do not compete on generic “best places” ranking; compete on a sharp persona + constraints (new grads, third places, micro-time windows, no-feed utility) and on an owned routing layer + third place graph.
- **Behavior change is hard.** People with 25 free minutes default to scrolling. Mitigation: minimize friction (one button, 3-5 picks that all fit), optimize for “new city / new routine” moments, and avoid spam (the product is pull-first for MVP).
- **Thin wrapper risk.** Places data is commoditized. Mitigation: build provider-agnostic adapters, own the Third Place Graph (vibe taxonomy + time-fit + safety heuristics + starter packs), and compound an outcome dataset (what was suggested vs clicked/saved/repeated).
- **Two-sided marketplace is hard.** “Sell to local businesses” requires density and creates trust issues. Mitigation: start with B2C (New City Pass) or B2B2C distribution (employers/apartments/coworking); add venue tooling later as a value-add, not ads.
- **"Feature not a company" risk.** Others can copy UI. Mitigation: treat the app as a reference client and build the routing engine + data layer as primitives (API/SDK), with distribution moats (partner packs, onboarding flows, embedded surfaces).

---

## 24) Open questions (decide as a team)
1. MVP requires accounts or not? (Supabase auth is fast, but accountless = zero friction)
2. Default: walk-only, or choose transport on every run?
3. City-specific (seed curated starter pack for hackathon demo city) or generic?
4. How do we show "social" without becoming social media?
   - option: "bring a friend" share link (no profiles, no feed)
5. Do we show a map view or just cards? (Map is more impressive but takes build time)
6. How to handle "no good suggestions" gracefully? (Sparse areas, late night, nothing open)
7. PWA install prompt — push for it during onboarding or let it happen naturally?
8. Team role split for the build — who takes frontend, backend, APIs, design?
