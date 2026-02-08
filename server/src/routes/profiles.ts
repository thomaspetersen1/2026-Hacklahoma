/**
 * ============================================================
 * routes/profiles.ts — GET /api/profiles
 * ============================================================
 *
 * Proxies profile requests to the ML service.
 * The frontend calls the Express server (port 3001),
 * which forwards to the ML service (port 8000).
 */

import { Router, Request, Response } from 'express'
import { config } from '../config'

const router = Router()

/** List all personas (for profile page dropdown) */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const response = await fetch(`${config.ml.url}/api/profiles`, {
      signal: AbortSignal.timeout(2000),
    })
    const data = await response.json()
    res.json(data)
  } catch {
    // Fallback if ML service is down
    res.json({
      success: true,
      profiles: {
        alex: {
          name: 'Alex',
          description: 'Chill coffee lover. Walks everywhere. Prefers cozy, affordable spots.',
          profile: { category_food: 0.8, category_outdoor: 0.2, category_entertainment: 0.4, category_culture: 0.3, price_sensitivity: 0.3, adventure_level: 0.3 },
        },
        jordan: {
          name: 'Jordan',
          description: 'Active and outdoorsy. Always exploring. Willing to drive for a good trail.',
          profile: { category_food: 0.3, category_outdoor: 0.9, category_entertainment: 0.6, category_culture: 0.1, price_sensitivity: 0.5, adventure_level: 0.8 },
        },
        sam: {
          name: 'Sam',
          description: 'Creative and cultured. Museums, galleries, bookstores. Transit rider.',
          profile: { category_food: 0.4, category_outdoor: 0.3, category_entertainment: 0.5, category_culture: 0.9, price_sensitivity: 0.6, adventure_level: 0.5 },
        },
      },
    })
  }
})

/** Get single profile */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${config.ml.url}/api/profiles/${req.params.userId}`, {
      signal: AbortSignal.timeout(2000),
    })
    const data = await response.json()
    res.json(data)
  } catch {
    res.json({ success: true, userId: req.params.userId, profile: {} })
  }
})

export default router
