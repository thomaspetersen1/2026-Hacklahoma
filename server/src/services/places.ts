/**
 * ============================================================
 * services/places.ts — Google Places API (New) Wrapper
 * ============================================================
 *
 * Searches for nearby places using Google's new Places API.
 * Normalizes the response into our internal Place type
 * so the rest of the codebase never touches raw Google objects.
 *
 * Docs: https://developers.google.com/maps/documentation/places/web-service/nearby-search
 *
 * Uses native fetch (not the @googlemaps library) because
 * the new Places API is simpler as a direct HTTP call.
 */

import { Place, LatLng } from '../types'
import { config } from '../config'
import { getFallbackPlaces } from './fallback'

/** Base URL for the new Google Places API */
const PLACES_API_URL = 'https://places.googleapis.com/v1/places:searchNearby'

/**
 * In-memory cache for places results.
 * Key: rounded lat/lng + radius + types (string)
 * Saves API quota on repeated nearby requests.
 */
const placesCache = new Map<string, { data: Place[]; expires: number }>()

/**
 * Search for nearby places matching the given types.
 *
 * @param origin - User's current location
 * @param radiusMeters - Search radius in meters (from fit.ts getSearchRadius)
 * @param includedTypes - Google place types to search for (from vibes.ts)
 * @returns Array of normalized Place objects
 */
export async function searchNearbyPlaces(
  origin: LatLng,
  radiusMeters: number,
  includedTypes: string[]
): Promise<Place[]> {
  // --- For demo cities (Norman, OKC, Dallas), use our enriched JSON data first ---
  // This showcases our custom vibe tagging system, not Google's generic types
  const demoOrigins = [
    { lat: 35.2226, lng: -97.4395, city: 'Norman' },
    { lat: 35.4676, lng: -97.5164, city: 'OKC' },
    { lat: 32.7767, lng: -96.7970, city: 'Dallas' },
  ]
  const isNearDemoCity = demoOrigins.some(demo => {
    const dLat = Math.abs(origin.lat - demo.lat)
    const dLng = Math.abs(origin.lng - demo.lng)
    return dLat < 0.5 && dLng < 0.5 // Within ~30 miles
  })

  if (isNearDemoCity) {
    console.log('[PLACES] Using enriched JSON data for demo city')
    return getFallbackPlaces(includedTypes, origin)
  }

  // --- Check if API key is configured ---
  if (!config.google.apiKey || config.google.apiKey === 'AIzaxxx...') {
    console.warn('Google Maps API key not configured — using fallback data')
    return getFallbackPlaces(includedTypes, origin)
  }

  // --- Check cache first ---
  const cacheKey = `${origin.lat.toFixed(3)},${origin.lng.toFixed(3)}-${radiusMeters}-${includedTypes.sort().join(',')}`
  const cached = placesCache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    return cached.data
  }

  // --- Build request body ---
  // Field mask: only request fields we actually use (saves quota)
  // Each field costs a different amount — be intentional about what you request
  const body = {
    includedTypes,
    maxResultCount: 20,
    locationRestriction: {
      circle: {
        center: {
          latitude: origin.lat,
          longitude: origin.lng,
        },
        radius: radiusMeters,
      },
    },
  }

  // --- Call Google Places API ---
  const response = await fetch(PLACES_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': config.google.apiKey,
      // Field mask: only return fields we need
      // This directly affects cost — fewer fields = cheaper
      'X-Goog-FieldMask': [
        'places.id',
        'places.displayName',
        'places.types',
        'places.location',
        'places.rating',
        'places.userRatingCount',
        'places.priceLevel',
        'places.photos',
        'places.currentOpeningHours',
        'places.businessStatus',
        'places.formattedAddress',
      ].join(','),
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.text()
    console.warn(`Google Places API error (${response.status}): ${error} — using Norman fallback`)
    return getFallbackPlaces(includedTypes, origin)
  }

  const data = await response.json()

  // --- Normalize into our Place type ---
  // Place types to exclude — errands, retail, services (not experiences)
  // We only want places where ACTIVITIES & EVENTS happen, not where tasks get done
  const EXCLUDED_TYPES = new Set([
    // Generic retail & stores
    'store', 'department_store', 'clothing_store', 'shoe_store',
    'grocery_store', 'hardware_store', 'home_goods_store',
    'home_improvement_store', 'furniture_store', 'electronics_store',
    'convenience_store', 'toy_store', 'gift_shop', 'antique_store',

    // Automotive (errands)
    'gas_station', 'car_dealer', 'car_repair', 'car_wash',
    'automotive_repair', 'auto_parts_store',

    // Professional services (not experiences)
    'dentist', 'doctor', 'hospital', 'pharmacy', 'medical_clinic',
    'optometrist', 'veterinary_care', 'lawyer', 'accounting',
    'real_estate_agency', 'insurance_agency', 'bank', 'atm',

    // Utilities & logistics (errands)
    'storage', 'moving_company', 'locksmith', 'laundry',
    'dry_cleaning', 'post_office', 'ups_store', 'fedex_office',

    // Transit (not activities)
    'transit_station', 'bus_station', 'train_station', 'airport',
  ])

  const places: Place[] = (data.places || [])
    // Filter: only operational businesses
    .filter((p: any) => p.businessStatus === 'OPERATIONAL' || !p.businessStatus)
    // Filter: exclude big-box stores and non-activity places
    .filter((p: any) => {
      const types: string[] = p.types || []
      // Exclude if the PRIMARY type is a boring store
      if (types.length > 0 && EXCLUDED_TYPES.has(types[0])) return false
      // Exclude if most types are excluded (e.g. Walmart has 10+ store types)
      const excludedCount = types.filter((t: string) => EXCLUDED_TYPES.has(t)).length
      if (excludedCount >= 3) return false
      return true
    })
    .map((p: any) => normalizePlaceResponse(p))

  // --- Cache the results ---
  placesCache.set(cacheKey, {
    data: places,
    expires: Date.now() + config.cache.placesTtl * 1000,
  })

  return places
}

/**
 * Normalize a raw Google Places API response into our Place type.
 * Keeps Google's response shape out of the rest of the codebase.
 */
function normalizePlaceResponse(raw: any): Place {
  return {
    id: raw.id || '',
    name: raw.displayName?.text || 'Unknown',
    types: raw.types || [],
    location: {
      lat: raw.location?.latitude || 0,
      lng: raw.location?.longitude || 0,
    },
    rating: raw.rating,
    userRatingsTotal: raw.userRatingCount,
    priceLevel: parsePriceLevel(raw.priceLevel),
    photoUri: raw.photos?.[0]?.name
      ? `https://places.googleapis.com/v1/${raw.photos[0].name}/media?maxWidthPx=400&key=${config.google.apiKey}`
      : undefined,
    openNow: raw.currentOpeningHours?.openNow,
    address: raw.formattedAddress,
  }
}

/**
 * Parse Google's price level enum to a number 0-4.
 * Google returns strings like "PRICE_LEVEL_MODERATE".
 */
function parsePriceLevel(level?: string): number | undefined {
  if (!level) return undefined
  const map: Record<string, number> = {
    PRICE_LEVEL_FREE: 0,
    PRICE_LEVEL_INEXPENSIVE: 1,
    PRICE_LEVEL_MODERATE: 2,
    PRICE_LEVEL_EXPENSIVE: 3,
    PRICE_LEVEL_VERY_EXPENSIVE: 4,
  }
  return map[level]
}

/**
 * Calculate straight-line distance between two points (Haversine formula).
 * Used for initial filtering before calling the Routes API.
 * Returns distance in meters.
 */
export function haversineDistance(a: LatLng, b: LatLng): number {
  const R = 6371000 // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)

  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}
