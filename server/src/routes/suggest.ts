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
import { scorePlace, buildReasonCodes, getMLScores, enforceDiversity } from '../services/scoring'

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

    const { windowMinutes, origin, travelMode, vibes = [] } = body
    const maxTravelMinutes = body.maxTravelMinutes || (travelMode === 'walking' ? 10 : 15)

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
    .filter(({ estTravel }) => estTravel <= maxTravelMinutes)
    // Sort by distance so we process closest first
    .sort((a, b) => a.distance - b.distance)
    // Only get real travel times for top 10 (saves API quota)
    .slice(0, 10)

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
      .filter(({ timeBudget }) => timeBudget.fits)

    const candidatesAfterFit = fittingCandidates.length

    // --- 9. Score ---
    // Try ML scoring first, fall back to local heuristic
    const mlScores = await getMLScores(
      fittingCandidates.map(c => c.place),
      vibes as Vibe[],
      windowMinutes
    )

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

      const matchingVibes = getMatchingVibes(place.types[0] || '', vibes as Vibe[])

      return {
        ...place,
        travelMinutes,
        dwellMinutes: timeBudget.dwell,
        totalMinutes: timeBudget.total,
        vibeMatch: matchingVibes,
        reasonCodes,
        fitScore: Math.round(finalScore * 100) / 100,
      }
    })
    // Sort by score (highest first)
    .sort((a, b) => b.fitScore - a.fitScore)

    // --- 10. Enforce diversity, return top 5 ---
    const suggestions = enforceDiversity(scored, 5)

    const response: SuggestResponse = {
      suggestions,
      weather: weather || undefined,
      meta: {
        candidatesConsidered,
        candidatesAfterFit,
        processingTimeMs: Date.now() - startTime,
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
