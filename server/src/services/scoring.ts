/**
 * ============================================================
 * services/scoring.ts — Suggestion Scoring & Ranking
 * ============================================================
 *
 * Scores and ranks places that passed the time-fit filter.
 *
 * Two scoring modes:
 *   1. LOCAL heuristic (default) — fast, no API calls, works offline
 *   2. ML-enhanced (when ML service is up) — Tommy's preference model
 *      scores candidates based on user history/preferences
 *
 * Flow:
 *   Google Places → fit filter → scoring → top 5 → client
 *                                  ↑
 *                          ML service (optional)
 *
 * NO external API calls in local mode. Pure math.
 */

import { Place, Suggestion, Vibe, WeatherInfo, TimeBudget, ScoreBreakdown, LatLng } from '../types'
import { getMatchingVibes, getTimeOfDayBoosts } from './vibes'
import { config } from '../config'

/** Context passed to ML service for richer feature engineering */
export interface MLContext {
  origin?: LatLng
  hour?: number
  dayOfWeek?: number
  weather?: string
  travelMinutesMap?: Record<string, number>
  userId?: string
}

/** Weights for each score component — must sum to 1.0 */
const WEIGHTS = {
  vibeMatch: 0.30,
  timeEfficiency: 0.25,
  distance: 0.20,
  novelty: 0.15,
  rating: 0.10,
}

/**
 * Score a single place. Returns a ScoreBreakdown with individual
 * components and a weighted total (0.0 - 1.0).
 */
export function scorePlace(
  place: Place,
  timeBudget: TimeBudget,
  windowMinutes: number,
  vibes: Vibe[],
  maxTravelMinutes: number,
  weather?: WeatherInfo
): ScoreBreakdown {
  // --- Vibe Match (0.0 - 1.0) ---
  // How many of the user's vibes does this place match?
  const primaryType = place.types[0] || ''
  const matchingVibes = getMatchingVibes(primaryType, vibes)
  const vibeMatch = vibes.length > 0
    ? Math.min(matchingVibes.length / vibes.length, 1.0)
    : 0.5 // no vibes selected = neutral

  // --- Time Efficiency (0.0 - 1.0) ---
  // How well does the total time fill the window?
  // Sweet spot: 70-90% of window used
  const usage = timeBudget.total / windowMinutes
  let timeEfficiency: number
  if (usage >= 0.70 && usage <= 0.90) {
    timeEfficiency = 1.0  // perfect fit
  } else if (usage < 0.50) {
    timeEfficiency = 0.5  // too short, wasted time
  } else if (usage > 0.95) {
    timeEfficiency = 0.6  // cutting it too close
  } else {
    timeEfficiency = 0.8  // decent but not ideal
  }

  // --- Distance Score (0.0 - 1.0) ---
  // Closer = higher score. Linear decay to max travel.
  const distance = maxTravelMinutes > 0
    ? Math.max(0, 1.0 - (timeBudget.travelTo / maxTravelMinutes))
    : 0.5

  // --- Novelty (0.0 - 1.0) ---
  // For MVP: just ensure category diversity.
  // Future: track user history and boost places they haven't been.
  const novelty = 0.7 // neutral for now, diversity handled in post-processing

  // --- Rating Signal (0.0 - 1.0) ---
  // Normalize Google's 1-5 scale to 0-1.
  // Light weight — we're not Yelp, don't over-index on ratings.
  const rating = place.rating ? (place.rating - 1) / 4 : 0.5

  // --- Weather Bonus (0.0 - 0.15) ---
  // Boost outdoor spots if nice out, penalize if raining.
  let weatherBonus = 0
  const outdoorTypes = ['park', 'campground', 'sports_complex']
  const isOutdoor = place.types.some(t => outdoorTypes.includes(t))
  if (weather && isOutdoor) {
    weatherBonus = weather.isOutdoorFriendly ? 0.15 : -0.10
  }

  // --- Time-of-Day Boost ---
  const todBoosts = getTimeOfDayBoosts()
  const todBonus = todBoosts[primaryType] || 0

  // --- Weighted Total ---
  const total = (
    vibeMatch * WEIGHTS.vibeMatch +
    timeEfficiency * WEIGHTS.timeEfficiency +
    distance * WEIGHTS.distance +
    novelty * WEIGHTS.novelty +
    rating * WEIGHTS.rating +
    weatherBonus +
    todBonus
  )

  return {
    vibeMatch,
    timeEfficiency,
    distance,
    novelty,
    rating,
    weatherBonus,
    total: Math.max(0, Math.min(1, total)), // clamp 0-1
  }
}

/**
 * Build human-readable reason codes for a suggestion.
 * Shown on the card: "Chill vibe · 6 min walk · Fits in 45 min"
 */
export function buildReasonCodes(
  place: Place,
  timeBudget: TimeBudget,
  vibes: Vibe[],
  travelMode: string,
  weather?: WeatherInfo
): string[] {
  const reasons: string[] = []

  // Vibe match
  const primaryType = place.types[0] || ''
  const matching = getMatchingVibes(primaryType, vibes)
  if (matching.length > 0) {
    reasons.push(`${matching[0].charAt(0).toUpperCase() + matching[0].slice(1)} vibe`)
  }

  // Travel time
  const modeLabel = travelMode === 'walking' ? 'walk' : travelMode === 'driving' ? 'drive' : 'transit'
  reasons.push(`${timeBudget.travelTo} min ${modeLabel}`)

  // Fits in window
  reasons.push(`Fits in ${timeBudget.total} min`)

  // Open now
  if (place.openNow) {
    reasons.push('Open now')
  }

  // Weather context for outdoor spots
  const outdoorTypes = ['park', 'campground', 'sports_complex']
  if (weather && place.types.some(t => outdoorTypes.includes(t))) {
    if (weather.isOutdoorFriendly) {
      reasons.push(`${Math.round(weather.temp)}° and ${weather.condition.toLowerCase()}`)
    }
  }

  return reasons
}

// =============================================================
// Circuit Breaker — stop calling ML after repeated failures
// =============================================================
const circuitBreaker = {
  failures: 0,
  maxFailures: 3,
  resetAfterMs: 60_000,
  openedAt: 0,

  /** Record a failure. Opens circuit after maxFailures. */
  recordFailure() {
    this.failures++
    if (this.failures >= this.maxFailures) {
      this.openedAt = Date.now()
      console.warn(`ML circuit breaker OPEN — skipping ML for ${this.resetAfterMs / 1000}s`)
    }
  },

  /** Record a success. Resets the counter. */
  recordSuccess() {
    this.failures = 0
    this.openedAt = 0
  },

  /** Is the circuit open (i.e., should we skip ML)? */
  isOpen(): boolean {
    if (this.failures < this.maxFailures) return false
    // Auto-reset after cooldown
    if (Date.now() - this.openedAt > this.resetAfterMs) {
      this.failures = 0
      this.openedAt = 0
      return false
    }
    return true
  },
}

/**
 * Map Google Place types to Tommy's 4 ML categories.
 * The model was trained on: food, outdoor, entertainment, culture.
 */
export function mapToMLCategory(placeTypes: string[]): string {
  const categoryMap: Record<string, string> = {
    // food
    cafe: 'food', restaurant: 'food', bakery: 'food', bar: 'food', coffee_shop: 'food',
    // outdoor
    park: 'outdoor', campground: 'outdoor', sports_complex: 'outdoor', gym: 'outdoor',
    // culture
    museum: 'culture', art_gallery: 'culture', library: 'culture',
    // entertainment
    bowling_alley: 'entertainment', book_store: 'entertainment',
  }
  for (const t of placeTypes) {
    if (categoryMap[t]) return categoryMap[t]
  }
  return 'entertainment'
}

/**
 * Midpoint dwell estimates in hours (mirrors fit.ts DWELL_ESTIMATES).
 * Used by ML model's duration_match feature.
 */
function getDwellHours(placeType: string): number {
  const midpoints: Record<string, number> = {
    cafe: 17, bakery: 12, book_store: 20, library: 32,
    bar: 45, restaurant: 30, bowling_alley: 37, gym: 27,
    park: 22, sports_complex: 32, art_gallery: 35, museum: 45,
    campground: 30, coffee_shop: 17,
  }
  return (midpoints[placeType] || 20) / 60
}

/**
 * Tracks which scoring source was used in the last getMLScores() call.
 * 'ml' = ML service returned valid scores
 * 'heuristic' = fell back to local scoring (ML down, circuit open, or bad response)
 */
let lastScoreSource: 'ml' | 'heuristic' = 'heuristic'

/** Get which scoring source was used in the most recent getMLScores() call. */
export function getLastScoreSource(): 'ml' | 'heuristic' {
  return lastScoreSource
}

/**
 * Get ML-enhanced scores from LightGBM model (14 features).
 * Translates server's Place data + context → ML service contract.
 * Returns scores for ALL candidates (ML scores the full list, server handles ranking).
 *
 * Circuit breaker: after 3 consecutive failures, skips ML for 60s.
 * Sets lastScoreSource so callers can include scoreSource in response meta.
 *
 * ML endpoint: POST /api/recommend
 * Input:  { activities, userPreferences, context }
 * Output: { success: true, recommendations: [{...activity, ml_score}] }
 */
export async function getMLScores(
  candidates: Place[],
  vibes: Vibe[],
  windowMinutes: number,
  mlContext?: MLContext
): Promise<Record<string, number> | null> {
  // Circuit breaker check
  if (circuitBreaker.isOpen()) {
    lastScoreSource = 'heuristic'
    return null
  }

  try {
    // Translate candidates to ML activity format
    const activities = candidates.map(p => ({
      id: p.id,
      rating: p.rating ?? 3.0,
      userRatingsTotal: p.userRatingsTotal ?? 100,
      priceLevel: p.priceLevel ?? 2,
      typicalDuration: getDwellHours(p.types[0] || 'cafe'),
      category: mapToMLCategory(p.types),
      isOpen: p.openNow ?? true,
      travelMinutes: mlContext?.travelMinutesMap?.[p.id],
    }))

    // Build user preferences (price not collected from user — default 2)
    const userPreferences = {
      preferences: [...new Set(activities.map(a => a.category))],
      priceLevel: 2,
      duration: windowMinutes / 60,
    }

    // Build context for ML feature engineering (time, weather, etc.)
    const context = {
      hour: mlContext?.hour ?? new Date().getHours(),
      dayOfWeek: mlContext?.dayOfWeek ?? new Date().getDay(),
      weather: mlContext?.weather ?? 'clear',
      travelMode: 'walking',
      travelMinutesMap: mlContext?.travelMinutesMap ?? {},
    }

    const response = await fetch(`${config.ml.url}/api/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activities, userPreferences, context, userId: mlContext?.userId }),
      // Timeout after 5s — ML model loading + inference can take 2-3s
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      circuitBreaker.recordFailure()
      lastScoreSource = 'heuristic'
      return null
    }

    const data = await response.json()
    if (!data.success || !Array.isArray(data.recommendations)) {
      circuitBreaker.recordFailure()
      lastScoreSource = 'heuristic'
      return null
    }

    // Map Tommy's recommendations back to {placeId: score}
    const scores: Record<string, number> = {}
    for (const rec of data.recommendations) {
      if (rec.id && typeof rec.ml_score === 'number') {
        scores[rec.id] = rec.ml_score
      }
    }

    if (Object.keys(scores).length === 0) {
      circuitBreaker.recordFailure()
      lastScoreSource = 'heuristic'
      return null
    }

    circuitBreaker.recordSuccess()
    lastScoreSource = 'ml'
    return scores
  } catch {
    // ML service is down or slow — fall back to local scoring
    console.warn('ML service unavailable, using local scoring')
    circuitBreaker.recordFailure()
    lastScoreSource = 'heuristic'
    return null
  }
}

/**
 * Enforce diversity in the final list.
 * Ensures at least 2 different categories in the top 5.
 * Prevents "all cafes" when the user picked "chill".
 */
export function enforceDiversity(suggestions: Suggestion[], maxResults: number = 5): Suggestion[] {
  const result: Suggestion[] = []
  const categoryCounts: Record<string, number> = {}
  const maxPerCategory = Math.ceil(maxResults / 2) // max 3 of same type in top 5

  // First pass: add top suggestions respecting category limits
  for (const suggestion of suggestions) {
    const category = suggestion.types[0] || 'other'
    const count = categoryCounts[category] || 0

    if (count < maxPerCategory) {
      result.push(suggestion)
      categoryCounts[category] = count + 1
    }

    if (result.length >= maxResults) break
  }

  // If we don't have enough (due to diversity filtering), backfill
  if (result.length < maxResults) {
    for (const suggestion of suggestions) {
      if (!result.includes(suggestion)) {
        result.push(suggestion)
        if (result.length >= maxResults) break
      }
    }
  }

  return result
}
