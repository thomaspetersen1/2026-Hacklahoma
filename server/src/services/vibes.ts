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
 * CRITICAL: We focus on ACTIVITY & EVENT places — places where experiences happen.
 * NO errands, retail, or service places. We're about moments, not mundane tasks.
 */
const VIBE_TO_PLACE_TYPES: Record<Vibe, string[]> = {
  chill: [
    'cafe',           // coffee shops, tea houses — hang out & relax
    'book_store',     // bookstores — browse & discover
    'library',        // public libraries — quiet intellectual space
    'bakery',         // bakeries — pastries & chat
  ],

  social: [
    'bar',            // bars, pubs — gather & celebrate
    'restaurant',     // sit-down dining — share meals & conversation
    'bowling_alley',  // bowling — games & fun
    'night_club',     // clubs — dancing & nightlife
    'amusement_park', // theme parks — shared experiences
    'cafe',           // coffee shops — meetups
  ],

  active: [
    'gym',            // fitness — sweat & strength
    'park',           // parks — run, play, exercise
    'sports_complex', // courts, fields — competitive play
  ],

  creative: [
    'art_gallery',    // galleries — visual inspiration
    'museum',         // museums — learn & explore
    'tourist_attraction', // tourist spots — experiences
    'sculpture',      // public art
    'point_of_interest', // landmarks — cultural spots
    'establishment',  // catch-all for interesting places
  ],

  outdoors: [
    'park',           // parks — nature & green space
    'campground',     // camping — wilderness
    'point_of_interest', // outdoor landmarks
    'tourist_attraction', // scenic attractions
  ],

  food: [
    'restaurant',     // restaurants — culinary experiences
    'bakery',         // bakeries — pastries & baking culture
    'cafe',           // cafes — coffee & snacks
  ],

  'late-night': [
    'bar',            // bars open late
    'night_club',     // clubs
    'restaurant',     // late-night dining
    'cafe',           // 24hr cafes
  ],

  // "surprise" uses ALL activity types — the scoring engine handles diversity
  surprise: [
    'cafe',
    'book_store',
    'library',
    'bakery',
    'bar',
    'night_club',
    'restaurant',
    'park',
    'gym',
    'sports_complex',
    'art_gallery',
    'museum',
    'amusement_park',
    'bowling_alley',
    'tourist_attraction',
    'sculpture',
    'point_of_interest',
    'establishment',
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
