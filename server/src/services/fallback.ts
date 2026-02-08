/**
 * Multi-city fallback place data.
 *
 * If Google Places API fails during demo, we return these instead.
 * Each city has ~50 real places with our own enrichment layer
 * (vibe tags, duration fit, solo-friendliness, etc.)
 *
 * Routes to the correct city based on user's lat/lng using
 * simple distance check to each city center.
 */

import { Place, LatLng } from '../types'
import normanPlaces from '../data/norman-places.json'
import okcPlaces from '../data/okc-places.json'
import dallasPlaces from '../data/dallas-places.json'

/** City definitions with center coordinates */
interface CityData {
  name: string
  center: LatLng
  places: Place[]
}

/** Convert raw JSON place to our Place type */
function toPlace(p: any): Place {
  return {
    id: p.id,
    name: p.name,
    types: p.types,
    location: p.location,
    rating: p.rating,
    userRatingsTotal: p.userRatingsTotal,
    priceLevel: p.priceLevel,
    openNow: p.openNow ?? true,
    address: p.address,
    vibeTags: p.vibe_tags || [],  // Preserve custom vibe tags from JSON
  }
}

/** All supported cities */
const CITIES: CityData[] = [
  {
    name: 'Norman',
    center: { lat: 35.2226, lng: -97.4395 },
    places: normanPlaces.map(toPlace),
  },
  {
    name: 'Oklahoma City',
    center: { lat: 35.4676, lng: -97.5164 },
    places: okcPlaces.map(toPlace),
  },
  {
    name: 'Dallas',
    center: { lat: 32.7767, lng: -96.7970 },
    places: dallasPlaces.map(toPlace),
  },
]

/**
 * Simple distance between two points (degrees, not meters).
 * Good enough for "which city is the user closest to?"
 */
function roughDistance(a: LatLng, b: LatLng): number {
  const dLat = a.lat - b.lat
  const dLng = a.lng - b.lng
  return Math.sqrt(dLat * dLat + dLng * dLng)
}

/**
 * Find which city the user is closest to.
 * Returns the city data or Norman as default.
 */
function findClosestCity(origin: LatLng): CityData {
  let closest = CITIES[0] // default to Norman
  let minDist = Infinity

  for (const city of CITIES) {
    if (city.places.length === 0) continue // skip cities without data
    const dist = roughDistance(origin, city.center)
    if (dist < minDist) {
      minDist = dist
      closest = city
    }
  }

  return closest
}

/**
 * Get fallback places for the user's location.
 * Automatically routes to the nearest city with data.
 * Optionally filtered by Google place types.
 */
export function getFallbackPlaces(includedTypes?: string[], origin?: LatLng): Place[] {
  const city = origin ? findClosestCity(origin) : CITIES[0]
  console.log(`[FALLBACK] Using ${city.name} data (${city.places.length} places)`)

  // Return ALL places — vibe filtering/sorting happens on the frontend
  return city.places
}

/** Get all places across all cities (for training data grounding) */
export function getAllFallbackPlaces(): Place[] {
  return CITIES.flatMap(c => c.places)
}

// Log what loaded
const totalPlaces = CITIES.reduce((sum, c) => sum + c.places.length, 0)
const cityReport = CITIES.map(c => `${c.name}: ${c.places.length}`).join(', ')
console.log(`[OK] Loaded ${totalPlaces} fallback places (${cityReport})`)
