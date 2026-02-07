/**
 * ============================================================
 * services/fit.ts — Time Fit Calculator
 * ============================================================
 *
 * Determines if a place fits within the user's time window.
 * HARD constraint — if it doesn't fit, it's filtered out. No exceptions.
 *
 * Calculates: travel_to + dwell + travel_back + buffer
 *
 * NO external API calls. Pure math.
 */

import { TimeBudget } from '../types'

/**
 * Dwell time estimates by place type: [min, max] in minutes.
 * Short windows lean toward min, long windows toward max.
 * ML service will learn better estimates over time from real usage.
 */
const DWELL_ESTIMATES: Record<string, [number, number]> = {
  cafe:           [15, 20],
  bakery:         [10, 15],
  book_store:     [15, 25],
  library:        [20, 45],
  bar:            [30, 60],
  restaurant:     [25, 35],
  bowling_alley:  [30, 45],
  gym:            [25, 30],
  park:           [15, 30],
  sports_complex: [25, 40],
  art_gallery:    [25, 45],
  museum:         [30, 60],
  campground:     [20, 40],
}

const DEFAULT_DWELL: [number, number] = [15, 25]
const BUFFER_MINUTES = 5

/**
 * Get estimated dwell time for a place type.
 * Scales between min/max based on how much time the user has.
 * Short window → quick visit. Long window → enjoy it.
 */
export function getDwellEstimate(placeType: string, windowMinutes: number): number {
  const [min, max] = DWELL_ESTIMATES[placeType] || DEFAULT_DWELL
  const ratio = Math.min(windowMinutes / 60, 1)
  return Math.round(min + (max - min) * ratio)
}

/**
 * Calculate full time budget for visiting a place.
 * travel_to + dwell + travel_back + buffer = total
 * If total > windowMinutes → doesn't fit → filter out.
 * Assumes travel_back = travel_to (symmetric trip).
 */
export function calculateTimeBudget(
  travelMinutes: number,
  placeType: string,
  windowMinutes: number
): TimeBudget {
  const dwell = getDwellEstimate(placeType, windowMinutes)
  const travelBack = travelMinutes
  const total = travelMinutes + dwell + travelBack + BUFFER_MINUTES

  return {
    travelTo: travelMinutes,
    dwell,
    travelBack,
    buffer: BUFFER_MINUTES,
    total,
    fits: total <= windowMinutes,
  }
}

/**
 * Quick distance-based travel time estimate.
 * Used as FIRST PASS before calling Routes API (which costs money).
 * Conservative — slightly overestimates to avoid false negatives.
 */
export function estimateTravelTime(
  distanceMeters: number,
  travelMode: 'walking' | 'driving' | 'transit'
): number {
  const speedMetersPerMinute: Record<string, number> = {
    walking: 70,   // ~4.2 km/h (slow walk with crossings)
    driving: 400,  // ~24 km/h (city driving with lights)
    transit: 200,  // ~12 km/h (includes wait + walk to stop)
  }
  return Math.ceil(distanceMeters / speedMetersPerMinute[travelMode])
}

/**
 * Calculate search radius (meters) based on travel mode and time window.
 * Longer windows → wider search. Walking → tighter radius.
 * Used by Places API to limit the search area.
 */
export function getSearchRadius(
  travelMode: 'walking' | 'driving' | 'transit',
  windowMinutes: number
): number {
  const baseRadius: Record<string, number> = {
    walking: 800,    // ~10 min walk
    driving: 5000,   // ~10 min drive
    transit: 3000,   // ~15 min transit
  }
  // Scale up for longer windows, max 1.5x at 60+ min
  const scale = Math.min(windowMinutes / 30, 1.5)
  return Math.round(baseRadius[travelMode] * scale)
}
