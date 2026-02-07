/**
 * ============================================================
 * services/vibes.ts — Vibe → Place Type Mapping
 * ============================================================
 *
 * Maps user-facing "vibe" tags to Google Places API types.
 * This is the bridge between what the user feels ("chill")
 * and what we search for ("cafe", "book_store", "library").
 *
 * Also handles time-of-day boosts — coffee shops score higher
 * in the morning, parks in the afternoon, bars at night.
 *
 * NO external API calls. Pure lookup logic. Fast and testable.
 *
 * Usage:
 *   import { getPlaceTypesForVibes, getTimeOfDayBoosts } from '../services/vibes'
 *   const types = getPlaceTypesForVibes(['chill', 'outdoors'])
 *   const boosts = getTimeOfDayBoosts()
 */

import { Vibe } from '../types'

// =============================================================
// Vibe → Google Place Types
// =============================================================

/**
 * Maps each vibe to the Google Places API "includedTypes" values.
 *
 * Full list of supported types:
 * https://developers.google.com/maps/documentation/places/web-service/place-types
 *
 * We intentionally keep this focused on "third places" —
 * cafes, parks, bookstores, galleries — not generic retail.
 */
const VIBE_TO_PLACE_TYPES: Record<Vibe, string[]> = {
  chill: [
    'cafe',           // coffee shops, tea houses
    'book_store',     // bookstores, reading nooks
    'library',        // public libraries, reading rooms
    'bakery',         // bakeries, pastry shops
  ],

  social: [
    'bar',            // bars, pubs
    'restaurant',     // sit-down restaurants
    'bowling_alley',  // bowling, arcade
    'cafe',           // coffee shops (good for meetups)
  ],

  active: [
    'gym',            // gyms, fitness centers
    'park',           // parks, rec areas
    'sports_complex', // sports facilities
  ],

  creative: [
    'art_gallery',    // galleries
    'museum',         // museums
  ],

  outdoors: [
    'park',           // parks, green spaces
    'campground',     // outdoor areas
  ],

  food: [
    'restaurant',     // restaurants
    'bakery',         // bakeries
    'cafe',           // cafes
  ],

  'late-night': [
    'bar',            // bars open late
    'restaurant',     // late-night dining
    'cafe',           // 24hr cafes
  ],

  // "surprise" uses ALL types — the scoring engine handles diversity
  surprise: [
    'cafe',
    'book_store',
    'library',
    'bakery',
    'bar',
    'restaurant',
    'park',
    'gym',
    'art_gallery',
    'museum',
  ],
}

/**
 * Given an array of vibes the user selected,
 * return a deduplicated list of Google Place types to search for.
 *
 * If no vibes provided, defaults to 'surprise' (all types).
 *
 * @example
 *   getPlaceTypesForVibes(['chill', 'outdoors'])
 *   // → ['cafe', 'book_store', 'library', 'bakery', 'park', 'campground']
 */
export function getPlaceTypesForVibes(vibes?: Vibe[]): string[] {
  // Default to surprise if no vibes selected
  const selectedVibes = vibes && vibes.length > 0 ? vibes : ['surprise' as Vibe]

  // Collect all place types, then deduplicate
  const allTypes = selectedVibes.flatMap((vibe) => VIBE_TO_PLACE_TYPES[vibe] || [])
  return [...new Set(allTypes)]
}

/**
 * Check if a specific Google Place type matches any of the user's vibes.
 * Used by the scoring engine to calculate vibe_match score.
 *
 * @returns Array of vibes that match, or empty if no match.
 *
 * @example
 *   getMatchingVibes('cafe', ['chill', 'active'])
 *   // → ['chill'] (cafe is chill, not active)
 */
export function getMatchingVibes(placeType: string, vibes: Vibe[]): Vibe[] {
  return vibes.filter((vibe) => VIBE_TO_PLACE_TYPES[vibe]?.includes(placeType))
}

// =============================================================
// Time-of-Day Boosts
// =============================================================

/**
 * Time-of-day scoring boosts.
 * Certain place types make more sense at certain times:
 *   - Morning: people want coffee, not bars
 *   - Afternoon: parks and shops
 *   - Evening: restaurants and social spots
 *   - Night: late-night spots, safety mode kicks in
 *
 * Returns a map of place_type → bonus (0.0 to 0.15).
 * The scoring engine adds this bonus to matching places.
 */
export function getTimeOfDayBoosts(): Record<string, number> {
  const hour = new Date().getHours()

  // Morning: 6am - 11am
  if (hour >= 6 && hour < 11) {
    return {
      cafe: 0.10,
      bakery: 0.10,
      book_store: 0.05,
      park: 0.05,
    }
  }

  // Afternoon: 11am - 5pm
  if (hour >= 11 && hour < 17) {
    return {
      park: 0.10,
      book_store: 0.05,
      art_gallery: 0.05,
      museum: 0.05,
      library: 0.05,
    }
  }

  // Evening: 5pm - 9pm
  if (hour >= 17 && hour < 21) {
    return {
      restaurant: 0.10,
      bar: 0.10,
      bowling_alley: 0.05,
      cafe: 0.05,
    }
  }

  // Night: 9pm - 6am
  return {
    bar: 0.15,
    restaurant: 0.10,
    cafe: 0.05,   // 24hr cafes
  }
}

/**
 * Is it "night time"?
 * Used by safety mode to filter out isolated outdoor spots.
 */
export function isNightTime(): boolean {
  const hour = new Date().getHours()
  return hour >= 21 || hour < 6
}
