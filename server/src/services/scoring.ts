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

import { Place, Suggestion, Vibe, WeatherInfo, TimeBudget, ScoreBreakdown } from '../types'
import { getMatchingVibes, getTimeOfDayBoosts } from './vibes'
import { config } from '../config'

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

/**
 * Try to get ML-enhanced scores from Tommy's preference model.
 * Falls back to local scores if ML service is down.
 *
 * Tommy's flow:
 *   Candidates + user preferences → ML model → predicted scores → top 5
 */
export async function getMLScores(
  candidates: Place[],
  vibes: Vibe[],
  windowMinutes: number
): Promise<Record<string, number> | null> {
  try {
    const response = await fetch(`${config.ml.url}/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidates: candidates.map(p => ({
          id: p.id,
          types: p.types,
          rating: p.rating,
          priceLevel: p.priceLevel,
        })),
        vibes,
        windowMinutes,
      }),
      // Timeout after 2s — don't let ML service slow down the response
      signal: AbortSignal.timeout(2000),
    })

    if (!response.ok) return null

    // ML service returns: { scores: { "placeId": 0.85, ... } }
    const data = await response.json()
    return data.scores
  } catch {
    // ML service is down or slow — fall back to local scoring
    console.warn('ML service unavailable, using local scoring')
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
