/**
 * ============================================================
 * index.ts — Sorcerer Troop API Server
 * ============================================================
 *
 * Express server entry point. Wires up:
 *   - CORS (allows client to call us)
 *   - JSON body parsing
 *   - Route handlers:
 *       GET  /api/health   → health check
 *       POST /api/suggest  → the core product
 *       POST /api/feedback → user feedback collection
 *
 * Start with: npm run dev
 */

import express from 'express'
import cors from 'cors'
import { config } from './config'

// Route handlers
import healthRouter from './routes/health'
import suggestRouter from './routes/suggest'
import feedbackRouter from './routes/feedback'

const app = express()

// --- Middleware ---
app.use(cors({ origin: config.corsOrigin }))
app.use(express.json())

// --- Routes ---
app.use('/api/health', healthRouter)
app.use('/api/suggest', suggestRouter)
app.use('/api/feedback', feedbackRouter)

// --- Start server ---
app.listen(config.port, () => {
  console.log(`
  ⚡ Sorcerer Troop API running on port ${config.port}

  Endpoints:
    GET  /api/health    → health check
    POST /api/suggest   → get suggestions
    POST /api/feedback  → submit feedback

  Test it:
    curl http://localhost:${config.port}/api/health
  `)
})
