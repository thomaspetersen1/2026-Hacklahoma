/**
 * ============================================================
 * routes/suggest.ts — POST /api/suggest
 * ============================================================
 *
 * The CORE endpoint. This is the product.
 *
 * Takes: time window + location + travel mode + vibes
 * Returns: top 5 ranked suggestions that fit
 *
 * Pipeline:
 *   1. Validate input
 *   2. Get weather (for outdoor boost/filter)
 *   3. Map vibes → Google place types
 *   4. Calculate search radius
 *   5. Fetch nearby places from Google
 *   6. First pass: heuristic distance filter (free)
 *   7. Second pass: real travel times for top candidates (Routes API)
 *   8. Calculate time budgets, filter by fit
 *   9. Score (local heuristic + optional ML)
 *   10. Enforce diversity, return top 5
 */

import { Router, Request, Response } from 'express'
import { SuggestRequest, SuggestResponse, Suggestion, Vibe, Place } from '../types'
import { getPlaceTypesForVibes, getMatchingVibes } from '../services/vibes'
import { getSearchRadius, estimateTravelTime, calculateTimeBudget } from '../services/fit'
import { searchNearbyPlaces, haversineDistance } from '../services/places'
import { getTravelTime } from '../services/routes'
import { getWeather } from '../services/weather'
import { scorePlace, buildReasonCodes, getMLScores, getLastScoreSource, enforceDiversity, mapToMLCategory } from '../services/scoring'
import { isNightTime } from '../services/vibes'
import { config } from '../config'

const router = Router()

router.post('/', async (req: Request, res: Response) => {
  const startTime = Date.now()

  try {
    // --- 1. Validate input ---
    const body = req.body as SuggestRequest

    if (!body.windowMinutes || !body.origin || !body.travelMode) {
      res.status(400).json({
        error: 'Missing required fields: windowMinutes, origin (lat/lng), travelMode',
      })
      return
    }

    if (body.windowMinutes < 15 || body.windowMinutes > 180) {
      res.status(400).json({
        error: 'windowMinutes must be between 15 and 180',
      })
      return
    }

    // --- Normalize inputs (accept frontend format OR backend format) ---
    const travelModeMap: Record<string, string> = {
      WALK: 'walking', DRIVE: 'driving', TRANSIT: 'transit',
      walking: 'walking', driving: 'driving', transit: 'transit',
    }
    const travelMode = (travelModeMap[body.travelMode] || 'walking') as import('../types').TravelMode

    // Accept "vibe" (single string) or "vibes" (array), normalize to lowercase array
    const rawVibes: string[] = body.vibes || (body.vibe ? [body.vibe] : [])
    const vibes = rawVibes.map((v: string) => v.toLowerCase())

    const { windowMinutes, origin } = body
    const maxTravelMinutes = body.maxTravelMinutes || Math.floor(windowMinutes / 2)
    const priceLevel = body.priceLevel as number | undefined

    // --- 2. Get weather (async, don't block on failure) ---
    const weatherPromise = getWeather(origin)

    // --- 3. Map vibes → Google place types ---
    const placeTypes = getPlaceTypesForVibes(vibes as Vibe[])

    // --- 4. Calculate search radius ---
    const radius = getSearchRadius(travelMode, windowMinutes)

    // --- 5. Fetch nearby places from Google ---
    const rawPlaces = await searchNearbyPlaces(origin, radius, placeTypes)
    const candidatesConsidered = rawPlaces.length

    if (rawPlaces.length === 0) {
      res.json({
        suggestions: [],
        weather: await weatherPromise,
        meta: {
          candidatesConsidered: 0,
          candidatesAfterFit: 0,
          processingTimeMs: Date.now() - startTime,
        },
      } as SuggestResponse)
      return
    }

    // --- 6. First pass: heuristic distance filter ---
    // Calculate straight-line distance and estimate travel time.
    // Filter out places that are obviously too far (saves Routes API calls).
    const withEstimates = rawPlaces.map((place) => {
      const distance = haversineDistance(origin, place.location)
      const estTravel = estimateTravelTime(distance, travelMode)
      return { place, distance, estTravel }
    })
    // Sort by distance so we process closest first
    .sort((a, b) => a.distance - b.distance)

    // --- 7. Second pass: real travel times (Routes API) ---
    const withRealTravelTimes = await Promise.all(
      withEstimates.map(async ({ place, estTravel }) => {
        try {
          const realTravel = await getTravelTime(origin, place.location, travelMode)
          return { place, travelMinutes: realTravel }
        } catch {
          // If Routes API fails for this place, use the heuristic
          return { place, travelMinutes: estTravel }
        }
      })
    )

    // --- 8. Calculate time budgets, filter by fit ---
    const weather = await weatherPromise
    const fittingCandidates = withRealTravelTimes
      .map(({ place, travelMinutes }) => {
        const primaryType = place.types[0] || 'cafe'
        const timeBudget = calculateTimeBudget(travelMinutes, primaryType, windowMinutes)
        return { place, travelMinutes, timeBudget }
      })
      // Don't exclude — score handles ranking by fit
      // Price filter: if user set a max price, exclude places above it
      .filter(({ place }) => {
        if (priceLevel == null) return true
        if (place.priceLevel == null) return true // keep places with no price data
        return place.priceLevel <= priceLevel
      })

    const candidatesAfterFit = fittingCandidates.length

    // --- 9. Score ---
    // Try ML scoring first (LightGBM + Thompson blend), fall back to local heuristic
    const userId = body.userId
    const mlStart = Date.now()
    const mlScores = await getMLScores(
      fittingCandidates.map(c => c.place),
      vibes as Vibe[],
      windowMinutes,
      {
        origin,
        hour: new Date().getHours(),
        dayOfWeek: new Date().getDay(),
        weather: weather?.condition,
        travelMinutesMap: Object.fromEntries(
          fittingCandidates.map(c => [c.place.id, c.travelMinutes])
        ),
        userId,
      }
    )
    const mlLatencyMs = Date.now() - mlStart

    const scored: Suggestion[] = fittingCandidates.map(({ place, travelMinutes, timeBudget }) => {
      // Use ML score if available, otherwise local heuristic
      const localScore = scorePlace(
        place, timeBudget, windowMinutes,
        vibes as Vibe[], maxTravelMinutes, weather || undefined
      )
      const mlScore = mlScores?.[place.id]
      const finalScore = mlScore ?? localScore.total

      const reasonCodes = buildReasonCodes(
        place, timeBudget, vibes as Vibe[], travelMode, weather || undefined
      )

      // Return ALL vibeTags so the client-side filter can match any vibe,
      // not just the ones sent in this request
      let matchingVibes: string[] = []
      if (place.vibeTags && place.vibeTags.length > 0) {
        matchingVibes = place.vibeTags.map(tag => tag.toLowerCase())
      } else {
        // Fallback: infer from Google place types (check against ALL vibes, not just request)
        const allVibes: Vibe[] = ['chill', 'social', 'active', 'creative', 'outdoors', 'food', 'late-night']
        matchingVibes = getMatchingVibes(place.types[0] || '', allVibes)
      }

      return {
        ...place,
        travelMinutes,
        dwellMinutes: timeBudget.dwell,
        totalMinutes: timeBudget.total,
        vibeMatch: matchingVibes,
        reasonCodes: reasonCodes,
        fitScore: Math.round(finalScore * 100) / 100,
        scoreSource: (mlScore !== undefined ? 'ml' : 'heuristic') as 'ml' | 'heuristic',
      }
    })
    // Sort by score (highest first)
    .sort((a, b) => b.fitScore - a.fitScore)

    // --- 9b. Night safety: downrank isolated outdoor spots after 9pm ---
    if (isNightTime()) {
      const outdoorTypes = ['park', 'campground', 'sports_complex']
      scored.forEach(s => {
        if (s.types.some(t => outdoorTypes.includes(t))) s.fitScore *= 0.5
      })
      // Re-sort after downranking
      scored.sort((a, b) => b.fitScore - a.fitScore)
    }

    // --- 10. Enforce diversity, return top 5 ---
    const suggestions = enforceDiversity(scored, scored.length)
      .map((s, i) => ({ ...s, rankPosition: i + 1 }))

    // --- 11. Log impressions for self-learning loop (fire-and-forget) ---
    const currentHour = new Date().getHours()
    suggestions.forEach((s, i) => {
      fetch(`${config.ml.url}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          place_id: s.id,
          category: mapToMLCategory(s.types),
          hour: currentHour,
          event_type: 'impression',
          rank_position: i + 1,
          userId,
        }),
        signal: AbortSignal.timeout(1000),
      }).catch(() => {}) // don't block on failures
    })

    const scoreSource = getLastScoreSource()
    const response: SuggestResponse = {
      suggestions,
      weather: weather || undefined,
      meta: {
        candidatesConsidered,
        candidatesAfterFit,
        processingTimeMs: Date.now() - startTime,
        scoreSource,
        mlLatencyMs,
        mlUp: scoreSource === 'ml',
      },
    }

    res.json(response)
  } catch (err) {
    console.error('Suggest endpoint error:', err)
    res.status(500).json({
      error: 'Failed to generate suggestions',
      details: err instanceof Error ? err.message : 'Unknown error',
    })
  }
})

export default router
