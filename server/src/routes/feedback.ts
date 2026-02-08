/**
 * ============================================================
 * routes/feedback.ts — POST /api/feedback
 * ============================================================
 *
 * Collects user feedback on suggestions and feeds it into
 * the self-learning loop.
 *
 * Two input formats:
 *   1. Simple (backward compat): { placeId, action }
 *   2. Rich event: full RecommendationEvent with context + scoring
 *
 * On every feedback event:
 *   - Stores locally (in-memory for MVP)
 *   - Forwards to ML service's /api/feedback (Thompson Sampling update)
 *   - Derives reward signal: navigate/like/save → 1, dismiss/dislike → 0
 *
 * This closes the learning loop:
 *   suggest → impression → user action → feedback → bandit update → better suggestions
 */

import { Router, Request, Response } from 'express'
import { FeedbackRequest, RecommendationEvent } from '../types'
import { mapToMLCategory } from '../services/scoring'
import { config } from '../config'

const router = Router()

/**
 * In-memory feedback store.
 * Stores both simple and rich events (rich events have more fields).
 */
const feedbackStore: Array<FeedbackRequest | RecommendationEvent> = []

/**
 * Map simple feedback actions to ML event types.
 * The ML service uses a different vocabulary than the client.
 */
const ACTION_TO_EVENT_TYPE: Record<string, string> = {
  like: 'like',
  dislike: 'dislike',
  save: 'save',
}

router.post('/', async (req: Request, res: Response) => {
  const body = req.body

  // --- Detect format: Rich event vs. simple feedback ---
  if (body.eventType && body.placeId) {
    // Rich RecommendationEvent format
    const event = body as RecommendationEvent
    feedbackStore.push(event)
    console.log(`Event: ${event.eventType} on ${event.placeId} (total: ${feedbackStore.length})`)

    // Forward to ML service (fire-and-forget)
    forwardToML(event.placeId, event.placeCategory, event.context?.hourOfDay, event.eventType)

    res.json({ success: true, totalFeedback: feedbackStore.length, format: 'rich' })
    return
  }

  // --- Simple FeedbackRequest format (backward compat) ---
  const simple = body as FeedbackRequest

  if (!simple.placeId || !simple.action) {
    res.status(400).json({ error: 'Missing required fields: placeId, action' })
    return
  }

  if (!['like', 'dislike', 'save'].includes(simple.action)) {
    res.status(400).json({ error: 'action must be: like, dislike, or save' })
    return
  }

  feedbackStore.push(simple)
  console.log(`Feedback: ${simple.action} on ${simple.placeId} (total: ${feedbackStore.length})`)

  // Forward to ML service (fire-and-forget)
  const eventType = ACTION_TO_EVENT_TYPE[simple.action] || 'impression'
  forwardToML(simple.placeId, 'entertainment', new Date().getHours(), eventType)

  res.json({ success: true, totalFeedback: feedbackStore.length, format: 'simple' })
})

/** Get all feedback (for debugging / ML training) */
router.get('/', (_req: Request, res: Response) => {
  res.json({ feedback: feedbackStore, total: feedbackStore.length })
})

/**
 * Forward feedback event to ML service's Thompson Sampling bandit.
 * Fire-and-forget — never blocks the response.
 */
function forwardToML(placeId: string, category: string, hour: number, eventType: string): void {
  fetch(`${config.ml.url}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      place_id: placeId,
      category,
      hour: hour ?? new Date().getHours(),
      event_type: eventType,
    }),
    signal: AbortSignal.timeout(1000),
  }).catch(() => {}) // don't block on failures
}

export default router
