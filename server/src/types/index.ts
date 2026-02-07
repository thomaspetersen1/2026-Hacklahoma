/**
 * ============================================================
 * types/index.ts — Shared TypeScript Types
 * ============================================================
 *
 * All types used across the server live here.
 * Import from '../types' in any file.
 *
 * Organized by domain:
 *   - Core (coordinates, travel modes, vibes)
 *   - Places (raw Google data, normalized)
 *   - Suggestions (scored + ranked output)
 *   - API (request/response shapes)
 *   - Weather
 *   - Feedback
 */

// =============================================================
// Core
// =============================================================

/** Latitude/longitude pair used everywhere */
export interface LatLng {
  lat: number
  lng: number
}

/**
 * How the user is getting around.
 * Maps to Google Routes API travel modes:
 *   walking → WALK
 *   driving → DRIVE
 *   transit → TRANSIT
 */
export type TravelMode = 'walking' | 'driving' | 'transit'

/**
 * Vibe tags the user can select.
 * Each maps to a set of Google Place types (see services/vibes.ts).
 * "surprise" picks randomly across all categories.
 */
export type Vibe =
  | 'chill'
  | 'social'
  | 'active'
  | 'creative'
  | 'outdoors'
  | 'food'
  | 'late-night'
  | 'surprise'

// =============================================================
// Places (raw from Google, normalized)
// =============================================================

/**
 * A place as returned by Google Places API (New),
 * normalized into our internal shape.
 *
 * We normalize early so the rest of the codebase
 * never touches raw Google response objects.
 */
export interface Place {
  /** Google Place ID (e.g., "ChIJ...") — unique identifier */
  id: string

  /** Human-readable name (e.g., "Blue Bottle Coffee") */
  name: string

  /** Google place types (e.g., ["cafe", "food", "point_of_interest"]) */
  types: string[]

  /** Where the place is */
  location: LatLng

  /** Google rating: 1.0 - 5.0 (optional, not all places have ratings) */
  rating?: number

  /** Price level: 0 (free) to 4 (expensive) */
  priceLevel?: number

  /** URL to a photo of the place (from Google Photos) */
  photoUri?: string

  /** Is the place open right now? */
  openNow?: boolean

  /** Street address */
  address?: string
}

// =============================================================
// Suggestions (scored + ranked, sent to client)
// =============================================================

/**
 * A Place that has been scored, ranked, and enriched
 * with time calculations and reason codes.
 *
 * This is what the client receives and renders as a card.
 */
export interface Suggestion extends Place {
  /** Minutes to travel from user to this place */
  travelMinutes: number

  /** Estimated minutes spent at this place */
  dwellMinutes: number

  /**
   * Total time commitment: travel_to + dwell + travel_back + buffer
   * Must be <= user's windowMinutes to appear as a suggestion.
   */
  totalMinutes: number

  /** Which of the user's selected vibes this place matches */
  vibeMatch: string[]

  /**
   * Human-readable reasons why this was suggested.
   * Shown on the card, e.g.:
   *   ["Chill vibe", "6 min walk", "Fits in 45 min", "Open now"]
   */
  reasonCodes: string[]

  /**
   * Composite score from the scoring engine (0.0 - 1.0).
   * Higher = better match. Used for ranking, shown for transparency.
   */
  fitScore: number
}

// =============================================================
// Time Fit (internal, used by fit.ts)
// =============================================================

/**
 * Breakdown of how time is allocated for a suggestion.
 * Used internally by the fit calculator and included in
 * reason codes for transparency.
 */
export interface TimeBudget {
  /** Minutes to travel TO the place */
  travelTo: number

  /** Estimated minutes at the place */
  dwell: number

  /** Minutes to travel BACK (assumed same as travelTo) */
  travelBack: number

  /** Buffer time (default 5 min) for comfort */
  buffer: number

  /** Sum of all above */
  total: number

  /** Does this fit within the user's time window? */
  fits: boolean
}

// =============================================================
// API Request / Response
// =============================================================

/**
 * What the client sends to POST /api/suggest.
 * This is the core input to the entire suggestion pipeline.
 */
export interface SuggestRequest {
  /** How many minutes the user has free (e.g., 45) */
  windowMinutes: number

  /** Where the user is right now */
  origin: LatLng

  /** How they're getting around */
  travelMode: TravelMode

  /** What vibes they're feeling (optional — omit for "surprise me") */
  vibes?: Vibe[]

  /** Max minutes they're willing to travel one-way (optional, default from travelMode) */
  maxTravelMinutes?: number
}

/**
 * What POST /api/suggest returns to the client.
 * Contains ranked suggestions + weather context.
 */
export interface SuggestResponse {
  /** Ranked list of suggestions (best first, max 5) */
  suggestions: Suggestion[]

  /** Current weather at the user's location (for UI context) */
  weather?: WeatherInfo

  /** Metadata about the request (for debugging/transparency) */
  meta: {
    /** How many candidates were considered before filtering */
    candidatesConsidered: number

    /** How many passed the time-fit filter */
    candidatesAfterFit: number

    /** Total time to process this request (ms) */
    processingTimeMs: number
  }
}

// =============================================================
// Weather
// =============================================================

/**
 * Simplified weather info from OpenWeather API.
 * Used by the scoring engine to boost/filter outdoor suggestions,
 * and sent to the client for display on cards.
 */
export interface WeatherInfo {
  /** Temperature in Fahrenheit */
  temp: number

  /** Short description (e.g., "Clear sky", "Light rain") */
  condition: string

  /** OpenWeather icon code (e.g., "01d" for clear day) */
  icon: string

  /**
   * Is it a good time to be outside?
   * true if: not raining AND temp between 50-95°F
   * Used by scoring engine to boost/filter outdoor places.
   */
  isOutdoorFriendly: boolean
}

// =============================================================
// Feedback
// =============================================================

/**
 * What the client sends to POST /api/feedback.
 * Collected after the user visits a place (or dismisses it).
 * Feeds the data flywheel for better future suggestions.
 */
export interface FeedbackRequest {
  /** Google Place ID of the suggestion */
  placeId: string

  /** What the user thought */
  action: 'like' | 'dislike' | 'save'

  /** Which vibes were active when this was suggested */
  vibesActive?: Vibe[]

  /** How long the user's window was */
  windowMinutes?: number
}

// =============================================================
// Scoring (internal, used by scoring.ts)
// =============================================================

/**
 * Individual score components before they're combined.
 * Useful for debugging why a place ranked where it did.
 */
export interface ScoreBreakdown {
  vibeMatch: number       // 0.0 - 1.0
  timeEfficiency: number  // 0.0 - 1.0
  distance: number        // 0.0 - 1.0
  novelty: number         // 0.0 - 1.0
  rating: number          // 0.0 - 1.0
  weatherBonus: number    // 0.0 - 0.15 (bonus, not a full category)
  total: number           // weighted sum of above
}
