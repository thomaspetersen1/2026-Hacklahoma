# Sidequest — Presentation Script (5–7 min)

---

## [OPENING — ~45 seconds]

"We've all been there. It's Saturday afternoon, you've got a few hours to kill, and you open Google Maps and just... stare at it. You search 'things to do near me,' get 200 results, read four of them, and end up sitting on your couch again.

That's the problem Sidequest solves. Not 'what exists near me' — that's solved. The problem is: **given who I am, how much time I have right now, and what I'm in the mood for — what should I actually do?**

Sidequest turns that into a 30-second interaction and a ranked shortlist. Let me show you how."

---

## [USER FLOW DEMO — ~90 seconds]

*[Walk through the app live or show screenshots]*

"You land on the app and hit **Get Started**.

Step one is **Onboarding** — you select your interest categories. Art, food, music, nature, cafés. This is how the system builds a cold-start interest vector before it has any interaction history on you.

Step two is **Constraints** — you set a time window on a slider, anywhere from 30 minutes to 4 hours. You pick your travel mode: car, bike, or walking. That's it. No forms, no accounts.

Step three is **Recommendations** — the app returns a ranked card list of places near you. Each card shows a rating, how long it'll actually take to get there using real routing data, whether it's open, a price indicator, and a plain-English reason line like 'Good fit for your available time' or 'Matches your outdoor vibe.'

You can then filter by vibe — chill, social, active, creative, late night — or by price tier. Hit refresh and you get a new set. Tap a card to open details. Hit 'navigate' and that action feeds directly back into the model.

That's the product. Now let me explain what's happening under the hood."

---

## [ARCHITECTURE — ~30 seconds]

"The system is three independent services. A **React/Vite** frontend, an **Express/TypeScript** API server that orchestrates everything, and a **Python/Flask** ML microservice. The server calls Google Places for nearby candidates, Google Routes for real travel times, and OpenWeather for conditions — all in parallel. The ML service scores those candidates and returns a ranked list. The whole round trip, including ML inference, completes in under a second in steady state."

---

## [BACKEND — ~2.5 minutes]

"Everything flows through a single endpoint: `POST /api/suggest`. Let me walk you through what actually happens inside that request.

---

**Step one: Vibe translation.**

The user selects vibes — 'chill', 'social', 'active', and so on. The backend has a static mapping table that converts those vibes into Google Places API `includedTypes`. 'Chill' becomes cafes, bookstores, libraries, bakeries. 'Active' becomes gyms, parks, sports complexes. This mapping is the semantic bridge between how a person feels and what Google knows about. It's a lookup table, not a model — fast, deterministic, and easy to tune.

If no vibes are selected, the system defaults to 'surprise', which opens up all activity types and lets the scoring engine do the filtering.

---

**Step two: two-pass candidate filtering.**

We don't call the Routes API for every place — that would be expensive and slow. Instead we run two passes.

First pass: we use the **Haversine formula** to compute straight-line distance from the user to every candidate. This is free, runs in-process, and lets us sort by proximity in microseconds. We also compute a heuristic travel estimate using fixed speed constants — 70 meters per minute for walking, 400 for driving in a city. This immediately cuts down the candidate pool.

Second pass: we call the **Google Routes API** in parallel for the remaining candidates to get real travel times — actual routing through streets, factoring in road type, not just straight-line distance. We request only `routes.duration` in the field mask, which is the cheapest call structure. Results are cached by origin-destination-mode tuple with a configurable TTL, so repeated requests for the same route don't cost anything.

---

**Step three: time budget math.**

For each candidate, we calculate a full `TimeBudget`: travel there, plus estimated dwell time at that type of place, plus travel back, plus a 5-minute buffer. If `travelTo + dwell + travelBack + 5 > windowMinutes`, the place is a hard no. We don't bend this constraint.

Dwell estimates are per-place-type. A café is 15–20 minutes. A museum is 30–60. A bar is 30–60. Within each range, we scale based on the user's time window — if you have 90 minutes, we assume you'll linger; if you have 30, we assume a quick visit. These are ML-informed starting points; the model will learn better estimates over time from actual usage.

---

**Step four: heuristic scoring.**

Every candidate that passes the time filter gets a heuristic score — a weighted sum of five components, clamped to 0.0–1.0.

Vibe match is 30% of the score. Time efficiency is 25% — specifically, how well the total time fills the user's window. The sweet spot is 70–90% usage; too short wastes time, too close to 100% is stressful. Distance is 20%. Novelty is 15% — currently a neutral constant, but the structure is in place to penalize places the user has been to before. Rating is 10%, and it's intentionally the smallest weight — we're not Yelp.

On top of that, we add weather bonuses for outdoor spots when conditions are favorable, and time-of-day bonuses: cafes and bakeries score higher in the morning, parks in the afternoon, bars in the evening.

---

**Step five: diversity enforcement and impression logging.**

Before returning results, a post-processing pass enforces category diversity. No more than three places from the same Google type can appear in the top five. This prevents 'all coffee shops' when the user picks 'chill.'

Finally — and this is important — before the response goes out, we fire-and-forget impression events to the ML service for every suggestion returned. Each event records the place ID, category, hour, and rank position. This is the data flywheel. The user never waits on it — we use `AbortSignal.timeout(1000)` and swallow any errors — but every impression feeds the Thompson Sampling bandit that the ML section will cover.

The response includes a `meta` block that tells you how many candidates were considered, how many passed the fit filter, total processing time, and whether scoring came from ML or the heuristic fallback."

---

## [ML SYSTEM — ~3 minutes]

"There are four ML components working together. Let me go through each one.

---

**Component one: the LightGBM ranker.**

This is the primary scoring model. It's a gradient boosted decision tree — specifically an `LGBMClassifier` — trained to predict the probability that a user engages with a given place given their current context. The output is a float between 0 and 1 which we call the `lgbm_score`.

We have 20 engineered features across five groups. Let me highlight the interesting ones.

For **place quality**, rather than using raw star rating, we compute a Bayesian composite score: `(rating/5) × log(1 + reviews) / log(1001)`. This is the same formula IMDB uses for their Top 250 list. A 4.8-star place with 3 reviews gets penalized; a 4.3-star place with 2,000 reviews ranks higher. This matters a lot for avoiding recommendation of brand-new places with no signal.

For **distance**, we don't use a linear penalty — we use exponential decay with mode-specific lambdas. Walking gets λ=0.8, so a 2km walk already puts you at 0.20 of the base score. Driving gets λ=0.15, so a 10km drive only costs you 0.22. This naturally reflects how people actually feel about distance across different modes.

For **time appropriateness**, we have a category × hour-of-day scoring matrix. A gym scores high in the morning and low at 11pm. A bar scores low at 9am and high in the evening. This is a hand-crafted lookup table, but it captures intuitions that would be very hard to learn from a small dataset.

The model itself is deliberately **shallow**: `max_depth=3`, `num_leaves=7`, with row and column subsampling and both L1 and L2 regularization. We're training on 2,000 synthetic samples, so we wanted to bias hard toward stability and generalization over expressivity.

---

**Component two: Thompson Sampling contextual bandit.**

LightGBM gives us a strong prior, but it can't adapt between sessions without retraining. That's where the bandit comes in.

Each `(place_id, context_bucket)` pair maintains a **Beta distribution** — Beta(α, β) — as a conjugate prior over click-through probability. At inference time we sample from that distribution rather than taking the mean. This is the key insight of Thompson Sampling: **sampling naturally trades off exploration and exploitation**. Arms with high uncertainty (low α + β) get sampled high sometimes; arms with high observed success (high α) get sampled high consistently.

Context is partitioned into 16 buckets — 4 time windows crossed with 4 categories. Morning coffee shop and evening coffee shop have completely independent belief distributions.

Updates are exact Bayesian: a positive event increments α by 1, a negative event increments β by 1. No gradient descent, no learning rate to tune. The conjugate prior makes this analytically tractable.

Bandit state persists to a JSON file between sessions, so it's warm on restart.

---

**Component three: score blending and the circuit breaker.**

The final score is: `0.70 × lgbm_score + 0.30 × thompson_score`. LightGBM dominates because it's feature-rich and stable; Thompson provides the adaptive exploration signal.

The server wraps the ML call in a **circuit breaker** — after 3 consecutive failures it stops calling the ML service and falls back to a purely heuristic weighted sum for 60 seconds before retrying. This keeps the user experience fast even if the ML service is cold-starting.

---

**Component four: online user profile learning.**

Every user has a preference profile — a 6-dimensional vector of category affinities, price sensitivity, and adventure level. This is updated after every interaction using an **Exponential Moving Average** with α = 0.1:

`profile[key] = profile[key] × (1 − α) + target × α`

The learning rate of 0.1 is intentionally slow — it means a single dismissal moves the needle by 10%, not 100%. It takes roughly 7 consistent negative signals to halve a preference. This gives you stable, noise-resistant personalization that improves with every session."

---

## [CLOSING — ~30 seconds]

"The result is a system that's **cold-start capable** — it can make reasonable recommendations with zero user history using the LightGBM features. It's **self-improving** — the bandit and user profiles update live from every interaction with no retraining pipeline. And it **degrades gracefully** — if the ML service is down, you still get scored results from the heuristic fallback.

That's Sidequest. Stop overthinking. Start exploring. Thank you."

---

*Total estimated read time: ~6 minutes at a comfortable presentation pace. Cut the bandit or EMA sections if you need to run closer to 5.*
