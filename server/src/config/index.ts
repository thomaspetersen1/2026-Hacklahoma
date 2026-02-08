/**
 * ============================================================
 * config/index.ts — Centralized Configuration
 * ============================================================
 *
 * Single source of truth for all environment variables.
 * Every service imports config from here instead of
 * reading process.env directly. This makes it easy to:
 *   - See all config in one place
 *   - Validate that required keys exist at startup
 *   - Provide sensible defaults
 *
 * Usage:
 *   import { config } from '../config'
 *   const key = config.google.apiKey
 */

import dotenv from 'dotenv'

// Load .env file into process.env
dotenv.config()

/**
 * Helper: read an env var or throw if missing.
 * Catches missing keys at startup instead of at runtime.
 */
function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

/**
 * Helper: read an env var with a fallback default.
 * Use for optional config that has a sensible default.
 */
function optional(name: string, fallback: string): string {
  return process.env[name] || fallback
}

export const config = {
  // --- App ---
  port: parseInt(optional('PORT', '3001'), 10),
  corsOrigin: optional('CORS_ORIGIN', 'http://localhost:5177'),

  // --- Google Maps Platform ---
  // Used by: services/places.ts, services/routes.ts
  google: {
    apiKey: optional('GOOGLE_MAPS_API_KEY', ''),
  },

  // --- OpenWeather ---
  // Used by: services/weather.ts
  openweather: {
    apiKey: optional('OPENWEATHER_API_KEY', ''),
  },

  // --- Supabase ---
  // Used by: lib/supabase.ts
  supabase: {
    url: optional('SUPABASE_URL', ''),
    anonKey: optional('SUPABASE_ANON_KEY', ''),
    serviceRoleKey: optional('SUPABASE_SERVICE_ROLE_KEY', ''),
  },

  // --- ML Service ---
  // Used by: scoring service to get ML-enhanced rankings
  ml: {
    url: optional('ML_SERVICE_URL', 'http://localhost:8000'),
  },

  // --- Cache TTLs (in seconds) ---
  // How long to keep cached API responses in memory.
  // Saves API quota and speeds up repeated nearby requests.
  cache: {
    weatherTtl: 600,    // 10 min — weather doesn't change fast
    placesTtl: 300,     // 5 min  — places don't move
    routesTtl: 1800,    // 30 min — travel times are stable-ish
  },
} as const
