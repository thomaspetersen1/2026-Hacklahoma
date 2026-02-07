/**
 * ============================================================
 * routes/health.ts — GET /api/health
 * ============================================================
 *
 * Simple health check endpoint.
 * Returns status + uptime + which services are configured.
 * Useful for Docker health checks and debugging.
 */

import { Router, Request, Response } from 'express'
import { config } from '../config'

const router = Router()
const startedAt = new Date()

router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: Math.floor((Date.now() - startedAt.getTime()) / 1000),
    startedAt: startedAt.toISOString(),
    services: {
      google: config.google.apiKey !== 'YOUR_KEY_HERE',
      openweather: config.openweather.apiKey !== 'YOUR_KEY_HERE',
      supabase: config.supabase.url !== '' && config.supabase.url !== 'YOUR_URL_HERE',
      ml: config.ml.url,
    },
  })
})

export default router
