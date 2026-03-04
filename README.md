# Sidequest

> **Stop overthinking. Start exploring.**

Sidequest is a spontaneous activity recommendation engine that turns "I'm bored" into a curated, time-fit list of nearby things to do — no endless scrolling, no decision fatigue. Tell it your vibe and how much time you have; it handles the rest.

Built for [Hacklahoma 2026](https://hacklahoma.org/).

---

## How It Works

1. **Pick your interests** — select hobby categories (food, outdoor, entertainment, culture)
2. **Set your constraints** — available time window, travel mode, price comfort, vibe filters
3. **Get curated picks** — ML-ranked suggestions with real travel times, weather context, and a reason for each recommendation

User feedback (likes, saves, navigating to a place) is looped back into the models in real time — the system learns your preferences without you doing anything extra.

---

## Architecture

Three independent services communicate over HTTP:

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   /web          │────▶│   /server            │────▶│   /ml           │
│   React + Vite  │     │   Express/TypeScript  │     │   Python/Flask  │
│   Port 3000     │     │   Port 3001           │     │   Port 8000     │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼               ▼
             Google Places   Google Routes   OpenWeather
```

The frontend only talks to the Express server. The server orchestrates all external APIs and ML inference. The ML service is stateful — it persists learned bandit arms and user profiles to disk.

---

## ML System

Sidequest uses a **multi-model recommendation pipeline** that blends supervised ranking with online reinforcement learning.

### 1. LightGBM Gradient Boosting Ranker (`ml/models/RFC.py`)

Predicts P(user engages with this place | context) using **20 engineered features** across five groups:

| Group | Features |
|---|---|
| Place Quality | Bayesian composite score, price match, trending bracket |
| Context | Exponential distance decay (mode-specific λ), time-of-day matrix, duration efficiency, weather × outdoor interaction, day of week, open status |
| Category | One-hot encoding (food / outdoor / entertainment / culture) |
| User Affinities | Per-category affinity scores, price sensitivity cross-feature |

**Key design decisions:**
- Composite quality uses a Bayesian average `(rating/5) × log(1+reviews) / log(1001)` — penalizes low-review-count places (IMDB Top 250 formula)
- Distance decay uses mode-specific lambdas: walking λ=0.8, driving λ=0.15, transit λ=0.25
- Shallow trees (`max_depth=3`, `num_leaves=7`) + column/row subsampling + L1/L2 regularization prevent overfitting on the 2,000-sample synthetic training set
- Output: `predict_proba()[1]` → `lgbm_score` ∈ [0, 1]

### 2. Beta-Bernoulli Thompson Sampling Bandit (`ml/models/thompson.py`)

An online contextual bandit layered on top of LightGBM for exploration-exploitation.

Each `(place_id, context_bucket)` pair maintains a **Beta(α, β)** distribution as a conjugate prior over click probability. Inference samples `np.random.beta(α, β)`; updates are exact Bayesian:
- Positive feedback (like / navigate): `α += 1`
- Negative feedback (dismiss): `β += 1`

Context is partitioned into **16 buckets** (4 time windows × 4 categories), so "coffee shop at 8am" and "coffee shop at 10pm" learn independently. State persists to `ml/data/thompson_state.json`.

### 3. Score Blending (`server/src/services/scoring.ts`)

```
final_score = 0.70 × lgbm_score + 0.30 × thompson_score
```

LightGBM provides stable feature-rich ranking; Thompson Sampling drives exploration of under-observed places and adapts online between sessions.

A **circuit breaker** (3 consecutive failures → 60s cooldown) falls back to a pure heuristic weighted sum if the ML service is unavailable.

### 4. Vibe Profiler (`ml/models/vibe_profiler.py`)

Extracts 6-dimensional vibe vectors from review text via keyword frequency:

`[chill, social, studious, trendy, date_spot, budget_friendly]`

Scores are blended: `0.4 × place_type_seed + 0.6 × review_analysis`

### 5. User Profile — EMA Online Learning (`ml/models/user_profile.py`)

Tracks per-user preference dimensions and updates them with **Exponential Moving Average** (α = 0.1):

```
profile[key] = profile[key] × (1 − α) + target × α
```

The slow learning rate ensures a single dismissal won't collapse a category preference. Profiles persist to `ml/data/user_profiles.json`.

### Feedback Loop

Every suggestion fires an impression event. User actions map to rewards:

| Action | Reward |
|---|---|
| navigate, like, save | 1 |
| impression | 0 (weak signal) |
| dismiss, dislike | 0 |

Each feedback event updates both the Thompson bandit and the EMA user profile — no batch retraining needed.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7, Tailwind CSS 4 |
| Backend | Express 5, TypeScript 5, Node.js |
| ML Service | Python 3.11, Flask, LightGBM 4.6, scikit-learn 1.8, NumPy, pandas, joblib |
| External APIs | Google Places API, Google Routes API, OpenWeather API |
| Dev Infra | Docker Compose (hot reload for all 3 services) |

---

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.11+
- Docker + Docker Compose (recommended)
- Google Maps API key (Places + Routes enabled)
- OpenWeather API key

### With Docker Compose (recommended)

```bash
# Add your API keys
cp server/.env.example server/.env
# Edit server/.env with your GOOGLE_API_KEY and OPENWEATHER_API_KEY

docker compose up
```

Services will be available at:
- Frontend: http://localhost:3000
- API server: http://localhost:3001
- ML service: http://localhost:8000

### Manual Setup

**Frontend**
```bash
cd web
npm install
npm run dev
```

**Server**
```bash
cd server
npm install
npm run dev
```

**ML Service**
```bash
cd ml
pip install -r requirements.txt
python train_model.py       # train and save LightGBM model
python app.py               # start Flask server
```

### Environment Variables

`server/.env`:
```
GOOGLE_API_KEY=your_key_here
OPENWEATHER_API_KEY=your_key_here
ML_SERVICE_URL=http://localhost:8000   # optional, defaults to this
```

---

## API Reference

### `POST /api/suggest`
Returns ML-ranked place recommendations.

**Body:**
```json
{
  "hobbies": ["food", "outdoor"],
  "location": "norman",
  "duration": 120,
  "travelMode": "walking",
  "priceLevel": 2,
  "vibes": ["chill", "budget_friendly"],
  "userId": "alex"
}
```

**Response includes:** ranked places with `ml_score`, `lgbm_score`, `thompson_score`, travel times, vibe matches, reason codes, and metadata (`scoreSource`, `mlLatencyMs`, `mlUp`).

### `POST /api/feedback`
Record user interaction to update bandit arms and user profile.

```json
{
  "placeId": "ChIJ...",
  "action": "navigate",
  "userId": "alex"
}
```

### `GET /api/health`
Returns service status including ML model load state and bandit arm count.

---

## Project Structure

```
/
├── web/                    # React frontend (Vite)
│   └── src/
│       ├── components/     # LandingPage, Onboarding, Questionnaire, Recommendations
│       └── App.jsx
├── server/                 # Express API
│   └── src/
│       ├── routes/         # suggest.ts, feedback.ts, health.ts
│       ├── services/       # scoring.ts, routes.ts, fit.ts
│       └── config/
├── ml/                     # Python ML service
│   ├── models/             # RFC.py, thompson.py, vibe_profiler.py, user_profile.py
│   ├── api/                # routes.py (Flask endpoints)
│   ├── utils/              # generate_training_data.py
│   ├── data/               # Persisted bandit state + user profiles
│   └── train_model.py
├── docs/                   # Architecture and planning docs
└── docker-compose.yml
```

---

## Demo Personas

The app ships with 5 seeded user profiles for demo purposes:

| ID | Name | Style | Location |
|---|---|---|---|
| `alex` | Alex | Chill coffee lover, walks everywhere | Norman, OK |
| `jordan` | Jordan | Active outdoorsy explorer, drives | Norman, OK |
| `sam` | Sam | Creative and cultured, museums/galleries | Norman, OK |
| `maya` | Maya | Foodie trying new spots, drives | Oklahoma City, OK |
| `chris` | Chris | Social butterfly, bars/live music | Dallas, TX |
