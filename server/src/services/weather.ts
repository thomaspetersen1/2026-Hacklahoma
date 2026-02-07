/**
 * ============================================================
 * services/weather.ts — OpenWeather API Wrapper
 * ============================================================
 *
 * Gets current weather at the user's location.
 * Used by scoring engine to boost/filter outdoor suggestions
 * and by the client to display weather context on cards.
 *
 * Cached aggressively — weather doesn't change every minute.
 *
 * Docs: https://openweathermap.org/current
 */

import { LatLng, WeatherInfo } from '../types'
import { config } from '../config'

/** Base URL for OpenWeather current weather */
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather'

/**
 * In-memory cache for weather.
 * Key: rounded lat/lng (weather is the same within ~1km)
 */
const weatherCache = new Map<string, { data: WeatherInfo; expires: number }>()

/**
 * Get current weather at a location.
 *
 * @param location - Where to check weather
 * @returns WeatherInfo with temp, condition, and outdoor-friendliness
 */
export async function getWeather(location: LatLng): Promise<WeatherInfo | null> {
  // --- Check cache (round to 2 decimal places ~1km grid) ---
  const cacheKey = `${location.lat.toFixed(2)},${location.lng.toFixed(2)}`
  const cached = weatherCache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    return cached.data
  }

  try {
    // --- Call OpenWeather API ---
    const url = `${WEATHER_API_URL}?lat=${location.lat}&lon=${location.lng}&units=imperial&appid=${config.openweather.apiKey}`

    const response = await fetch(url)

    if (!response.ok) {
      console.warn(`OpenWeather API error (${response.status})`)
      return null
    }

    const data = await response.json()

    // --- Normalize into our WeatherInfo type ---
    const temp = data.main?.temp || 70
    const condition = data.weather?.[0]?.description || 'Unknown'
    const icon = data.weather?.[0]?.icon || '01d'
    const mainWeather = data.weather?.[0]?.main || ''

    // Is it good to be outside?
    // Yes if: not raining/snowing AND temperature is comfortable (50-95°F)
    const badWeather = ['Rain', 'Snow', 'Thunderstorm', 'Drizzle']
    const isOutdoorFriendly = !badWeather.includes(mainWeather) && temp >= 50 && temp <= 95

    const weatherInfo: WeatherInfo = {
      temp,
      condition,
      icon,
      isOutdoorFriendly,
    }

    // --- Cache for 10 minutes ---
    weatherCache.set(cacheKey, {
      data: weatherInfo,
      expires: Date.now() + config.cache.weatherTtl * 1000,
    })

    return weatherInfo
  } catch (err) {
    // Weather is optional — don't let it break suggestions
    console.warn('Weather fetch failed:', err)
    return null
  }
}
