/**
 * ============================================================
 * services/routes.ts — Google Routes API Wrapper
 * ============================================================
 *
 * Calculates real travel time between user and a place.
 * Supports walking, driving, and transit.
 *
 * IMPORTANT: This costs money per call. We minimize calls by:
 *   1. First pass: use haversine distance heuristic (free)
 *   2. Second pass: call Routes API only for top ~10 candidates
 *
 * Docs: https://developers.google.com/maps/documentation/routes
 */

import { LatLng, TravelMode } from '../types'
import { config } from '../config'

/** Base URL for Google Routes API */
const ROUTES_API_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes'

/**
 * In-memory cache for route results.
 * Key: origin + destination + mode
 */
const routeCache = new Map<string, { minutes: number; expires: number }>()

/**
 * Maps our travel mode names to Google Routes API values.
 */
const TRAVEL_MODE_MAP: Record<TravelMode, string> = {
  walking: 'WALK',
  driving: 'DRIVE',
  transit: 'TRANSIT',
}

/**
 * Get real travel time between two points via Google Routes API.
 *
 * @param origin - Starting point (user location)
 * @param destination - End point (place location)
 * @param travelMode - How the user is traveling
 * @returns Travel time in minutes
 */
export async function getTravelTime(
  origin: LatLng,
  destination: LatLng,
  travelMode: TravelMode
): Promise<number> {
  // --- Check if API key is configured ---
  if (!config.google.apiKey || config.google.apiKey === 'AIzaxxx...') {
    throw new Error('Google Maps API key not configured. Set GOOGLE_MAPS_API_KEY in .env')
  }

  // --- Check cache ---
  const cacheKey = `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}-${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}-${travelMode}`
  const cached = routeCache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    return cached.minutes
  }

  // --- Call Google Routes API ---
  const body = {
    origin: {
      location: {
        latLng: { latitude: origin.lat, longitude: origin.lng },
      },
    },
    destination: {
      location: {
        latLng: { latitude: destination.lat, longitude: destination.lng },
      },
    },
    travelMode: TRAVEL_MODE_MAP[travelMode],
  }

  const response = await fetch(ROUTES_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': config.google.apiKey,
      // Only request duration — cheapest field mask
      'X-Goog-FieldMask': 'routes.duration',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Google Routes API error (${response.status}): ${error}`)
  }

  const data = await response.json()

  // Duration comes as "480s" string — parse to minutes
  const durationStr = data.routes?.[0]?.duration || '0s'
  const seconds = parseInt(durationStr.replace('s', ''), 10)
  const minutes = Math.ceil(seconds / 60)

  // --- Cache the result ---
  routeCache.set(cacheKey, {
    minutes,
    expires: Date.now() + config.cache.routesTtl * 1000,
  })

  return minutes
}

/**
 * Get travel times for multiple destinations in parallel.
 * Batches requests to avoid hammering the API.
 *
 * @param origin - User location
 * @param destinations - Array of place locations
 * @param travelMode - How the user is traveling
 * @returns Map of "lat,lng" → travel time in minutes
 */
export async function getBatchTravelTimes(
  origin: LatLng,
  destinations: LatLng[],
  travelMode: TravelMode
): Promise<Map<string, number>> {
  const results = new Map<string, number>()

  // Run all requests in parallel (Google handles concurrency fine)
  const promises = destinations.map(async (dest) => {
    try {
      const minutes = await getTravelTime(origin, dest, travelMode)
      const key = `${dest.lat.toFixed(4)},${dest.lng.toFixed(4)}`
      results.set(key, minutes)
    } catch (err) {
      // If one route fails, don't kill the whole batch
      console.warn(`Route calc failed for ${dest.lat},${dest.lng}:`, err)
    }
  })

  await Promise.all(promises)
  return results
}
