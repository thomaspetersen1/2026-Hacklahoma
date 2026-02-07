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
  const isValidKey = (key: string) => key && key !== '' && !key.startsWith('AIzaxxx') && !key.startsWith('xxx') && !key.startsWith('eyJxxx')
  const isValidUrl = (url: string) => url && url !== '' && !url.includes('xxx.supabase.co')

  res.json({
    status: 'ok',
    uptime: Math.floor((Date.now() - startedAt.getTime()) / 1000),
    startedAt: startedAt.toISOString(),
    services: {
      google: isValidKey(config.google.apiKey),
      openweather: isValidKey(config.openweather.apiKey),
      supabase: isValidUrl(config.supabase.url),
      ml: config.ml.url,
    },
  })
})

export default router
