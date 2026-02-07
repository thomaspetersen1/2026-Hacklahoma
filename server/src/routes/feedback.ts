/**
 * ============================================================
 * routes/feedback.ts — POST /api/feedback
 * ============================================================
 *
 * Collects user feedback (like/dislike/save) on suggestions.
 * Feeds the data flywheel — this is how we learn what works.
 *
 * For MVP: stores in memory.
 * Future: writes to Supabase activity_history table,
 *         updates preference weights, feeds ML service.
 */

import { Router, Request, Response } from 'express'
import { FeedbackRequest } from '../types'

const router = Router()

/**
 * In-memory feedback store for MVP.
 * Replace with Supabase when database is wired up.
 */
const feedbackStore: FeedbackRequest[] = []

router.post('/', (req: Request, res: Response) => {
  const body = req.body as FeedbackRequest

  if (!body.placeId || !body.action) {
    res.status(400).json({ error: 'Missing required fields: placeId, action' })
    return
  }

  if (!['like', 'dislike', 'save'].includes(body.action)) {
    res.status(400).json({ error: 'action must be: like, dislike, or save' })
    return
  }

  // Store feedback
  feedbackStore.push(body)
  console.log(`Feedback: ${body.action} on ${body.placeId} (total: ${feedbackStore.length})`)

  res.json({ success: true, totalFeedback: feedbackStore.length })
})

/** Get all feedback (for debugging / ML training) */
router.get('/', (_req: Request, res: Response) => {
  res.json({ feedback: feedbackStore, total: feedbackStore.length })
})

export default router
