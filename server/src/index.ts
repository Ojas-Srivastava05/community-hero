import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { reportsRouter } from './routes/reports'
import { analyticsRouter } from './routes/analytics'
import { aiRouter } from './routes/ai'
import { leaderboardRouter } from './routes/leaderboard'
const app = express()
const PORT = Number(process.env.PORT) || 3001
const isProd = process.env.NODE_ENV === 'production'

app.use(cors())
app.use(express.json())

app.get('/api/health', async (_req, res) => {
  let firestore = 'unknown'
  try {
    const { db } = await import('./lib/firebase-admin')
    await db.collection('issues').limit(1).get()
    firestore = 'connected'
  } catch {
    firestore = 'error'
  }
  res.json({
    status: firestore === 'connected' ? 'ok' : 'degraded',
    service: 'community-hero-api',
    phase: 19,
    firestore,
    timestamp: new Date().toISOString(),
    stack: ['Node.js', 'Express', 'Firebase Admin', 'Gemini', 'Google Maps'],
  })
})

app.get('/api', (_req, res) => {
  res.json({ name: 'Community Hero API', version: '1.0.0', docs: '/api/health' })
})

app.use('/api/reports', reportsRouter)
app.use('/api/analytics', analyticsRouter)
app.use('/api/ai', aiRouter)
app.use('/api/leaderboard', leaderboardRouter)

if (isProd) {
  const frontendDist = path.resolve(__dirname, '../../frontend/dist')
  app.use(express.static(frontendDist))
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'))
  })
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Community Hero API listening on 0.0.0.0:${PORT}`)
})
